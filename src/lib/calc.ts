import type { CalcStep, CommissionRecord, LedgerParams, ReplayResult, RuleVersion } from '../types';
import { formatBps, formatMoney, formatRawCents } from './money';

/**
 * 分位四舍五入（half-up），全程整数运算，避免浮点误差。
 * n / d 向下取整前先加 d/2；负数单独处理符号。
 */
export function divRoundHalfUp(n: number, d: number): number {
  if (d <= 0) {
    throw new Error('divRoundHalfUp: divisor must be positive');
  }
  const negative = n < 0;
  const abs = Math.abs(n);
  const q = Math.floor((2 * abs + d) / (2 * d));
  const signed = negative ? -q : q;
  // 避免出现 -0，负零与正零在断言与展示上语义不同
  return signed === 0 ? 0 : signed;
}

export interface LedgerOutcome {
  baseCents: number;
  totalRaw: string;
  totalCents: number;
  shareRaw: string;
  shareCents: number;
  otherCents: number;
  tailCents: number;
  settledCents: number;
}

/**
 * 提成台账核心算式。
 * 单位统一为「分」；未取整值以 1e-4 分（=万分之一分）为内部单位换算成字符串展示。
 */
export function computeLedger(params: LedgerParams): LedgerOutcome {
  const { baseCents, rateBps, shareBp } = params;
  // baseCents * rateBps => 单位 1e-4 分
  const totalUnits = baseCents * rateBps;
  const totalCents = divRoundHalfUp(totalUnits, 10000);
  // 主业务员份额：totalUnits * shareBp => 单位 1e-8 分
  const shareUnits = totalUnits * shareBp;
  const otherUnits = totalUnits * (10000 - shareBp);
  const shareCents = divRoundHalfUp(shareUnits, 100000000);
  const otherCents = divRoundHalfUp(otherUnits, 100000000);
  const tailCents = totalCents - shareCents - otherCents;

  return {
    baseCents,
    totalRaw: (totalUnits / 10000).toFixed(4),
    totalCents,
    shareRaw: (shareUnits / 1e8).toFixed(4),
    shareCents,
    otherCents,
    tailCents,
    settledCents: shareCents + tailCents,
  };
}

/** 生成「YYYY-MM-DD HH:mm:ss」形式的本地时间串，用于展示校验时刻。 */
export function formatTimestamp(date: Date): string {
  const pad = (value: number) => value.toString().padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}

function exclusionTotal(record: CommissionRecord): number {
  return record.payment.exclusions.reduce((sum, item) => sum + item.cents, 0);
}

/** 生成时间轴计算步骤。取整步骤与尾差步骤单独标记，供页面高亮。 */
export function buildSteps(record: CommissionRecord): CalcStep[] {
  const excluded = exclusionTotal(record);
  const received = record.payment.receivedCents;
  const base = received - excluded;
  const ledger = computeLedger({ ...record.params, baseCents: base });
  const steps: CalcStep[] = [
    {
      no: 1,
      title: '确定计费基数',
      formula: '计费基数 = 实收金额 − 排除款项合计',
      inputs: [
        { label: '实收金额', value: formatMoney(received) },
        { label: '排除款项合计', value: formatMoney(excluded) },
      ],
      output: formatMoney(base),
      highlight: 'none',
    },
    {
      no: 2,
      title: '计算提成总额（未取整）',
      formula: '提成总额 = 计费基数 × 提成费率',
      inputs: [
        { label: '计费基数', value: formatMoney(base) },
        { label: '提成费率', value: formatBps(record.params.rateBps) },
      ],
      output: `${formatRawCents(Number(ledger.totalRaw))} 分`,
      note: '本步骤保留分以下小数，不做任何截断',
      highlight: 'none',
    },
    {
      no: 3,
      title: '总额取整',
      formula: '取整总额 = ROUND_HALF_UP(提成总额, 分)',
      inputs: [
        { label: '提成总额（未取整）', value: `${formatRawCents(Number(ledger.totalRaw))} 分` },
        { label: '取整方式', value: '四舍五入到分（ROUND_HALF_UP）' },
      ],
      output: formatMoney(ledger.totalCents),
      note: '取整步骤：分以下小数在此步一次性并入总额',
      highlight: 'rounding',
    },
    {
      no: 4,
      title: '主业务员份额（未取整）',
      formula: '主业务员份额 = 提成总额（未取整） × 主业务员占比',
      inputs: [
        { label: '提成总额（未取整）', value: `${formatRawCents(Number(ledger.totalRaw))} 分` },
        { label: '主业务员占比', value: `${(record.params.shareBp / 100).toFixed(2)}%` },
      ],
      output: `${formatRawCents(Number(ledger.shareRaw))} 分`,
      highlight: 'none',
      note: '份额按未取整的提成总额分摊；两次取整产生的差额在尾差步骤归集到主业务员',
    },
    {
      no: 5,
      title: '主业务员份额取整',
      formula: '主业务员份额取整 = ROUND_HALF_UP(主业务员份额, 分)',
      inputs: [
        { label: '主业务员份额（未取整）', value: `${formatRawCents(Number(ledger.shareRaw))} 分` },
      ],
      output: formatMoney(ledger.shareCents),
      note: '取整步骤：与第 3 步同一取整口径',
      highlight: 'rounding',
    },
    {
      no: 6,
      title: '协同业务员份额取整',
      formula: '协同份额 = ROUND_HALF_UP(提成总额（未取整） × 协同占比, 分)',
      inputs: [
        { label: '提成总额（未取整）', value: `${formatRawCents(Number(ledger.totalRaw))} 分` },
        { label: '协同占比', value: `${((10000 - record.params.shareBp) / 100).toFixed(2)}%` },
      ],
      output: formatMoney(ledger.otherCents),
      note: '取整步骤：与第 4 步同一口径，先按未取整总额分摊，再把分以下小数四舍五入',
      highlight: 'rounding',
    },
    {
      no: 7,
      title: '尾差归集',
      formula: '尾差 = 取整总额 − 主业务员份额取整 − 协同份额取整',
      inputs: [
        { label: '取整总额', value: formatMoney(ledger.totalCents) },
        { label: '主业务员份额取整', value: formatMoney(ledger.shareCents) },
        { label: '协同份额取整', value: formatMoney(ledger.otherCents) },
      ],
      output: formatMoney(ledger.tailCents),
      note: '尾差步骤：两次取整的差额在此归集到主业务员，保证拆分合计与总额严格相等',
      highlight: 'tail',
    },
    {
      no: 8,
      title: '本期应计提成',
      formula: '本期应计提成 = 主业务员份额取整 + 尾差',
      inputs: [
        { label: '主业务员份额取整', value: formatMoney(ledger.shareCents) },
        { label: '尾差', value: formatMoney(ledger.tailCents) },
      ],
      output: formatMoney(ledger.settledCents),
      note: '结果为最终落账金额',
      highlight: 'final',
    },
  ];

  if (record.type === 'adjustment') {
    const previous = record.contractAccruedCents;
    const delta = ledger.settledCents - previous;
    steps.push({
      no: 9,
      title: '比对本合同已计提',
      formula: '已计提成 = 原计提记录已落账金额',
      inputs: [
        { label: '原计提记录', value: record.relations.originalAccrual?.code ?? '—' },
        { label: '已计提成', value: formatMoney(previous) },
      ],
      output: formatMoney(previous),
      highlight: 'none',
    });
    steps.push({
      no: 10,
      title: '计算调整差额',
      formula: '调整差额 = 本期应计提成 − 已计提成',
      inputs: [
        { label: '本期应计提成', value: formatMoney(ledger.settledCents) },
        { label: '已计提成', value: formatMoney(previous) },
      ],
      output: formatMoney(delta),
      note: '差额为正为补提，为负为冲减',
      highlight: 'final',
    });
  }

  return steps;
}

/**
 * 重放校验：以记录落库时的规则快照与入参重新执行一遍算式，
 * 逐步比对展示值，返回「一致」或第一处差异步骤。
 */
export function replay(record: CommissionRecord, ruleOverride?: RuleVersion): ReplayResult {
  const replayed: CommissionRecord = ruleOverride
    ? {
        ...record,
        params: {
          ...record.params,
          rateBps: replayRate(ruleOverride) ?? record.params.rateBps,
        },
        rule: ruleOverride,
      }
    : record;

  const recorded = record.steps;
  const replayedSteps = buildSteps(replayed);
  const total = Math.min(recorded.length, replayedSteps.length);

  for (let i = 0; i < total; i += 1) {
    if (recorded[i].output !== replayedSteps[i].output) {
      return {
        consistent: false,
        checkedAt: formatTimestamp(new Date()),
        comparedSteps: i + 1,
        ruleVersion: replayed.rule.version,
        firstDiff: {
          no: recorded[i].no,
          title: recorded[i].title,
          recorded: recorded[i].output,
          replayed: replayedSteps[i].output,
        },
      };
    }
  }

  return {
    consistent: true,
    checkedAt: formatTimestamp(new Date()),
    comparedSteps: total,
    ruleVersion: replayed.rule.version,
  };
}

function replayRate(rule: RuleVersion): number | undefined {
  const hit = rule.rows.find((row) => row.hit);
  return hit?.rateBps;
}
