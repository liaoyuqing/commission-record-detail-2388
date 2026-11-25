import type { ApprovalNode, CommissionRecord, RecordChainNode, RuleVersion } from '../types';
import { buildSteps, computeLedger } from '../lib/calc';

const ruleV2: RuleVersion = {
  version: 'R-2026.09-v2',
  effectiveFrom: '2026-09-01',
  effectiveTo: '2026-12-31',
  publishedBy: '提成规则管理组',
  publishedAt: '2026-08-28 10:12',
  rows: [
    {
      code: 'R2-01',
      name: '标准回款计提',
      rateBps: 845,
      hit: true,
      conditions: [
        { field: '记录类型', operator: '等于', expected: '计提', actual: '计提', passed: true },
        { field: '回款期次', operator: '小于等于', expected: '第 4 期', actual: '第 1 期', passed: true },
        { field: '交易类型', operator: '等于', expected: '新签', actual: '新签', passed: true },
        { field: '会籍档位', operator: '属于', expected: '铂金 / 钻石', actual: '铂金', passed: true },
        { field: '回款账龄', operator: '小于等于', expected: '30 天', actual: '11 天', passed: true },
      ],
    },
    {
      code: 'R2-02',
      name: '续签加计',
      rateBps: 930,
      hit: false,
      missReason: '交易类型为「新签」，本行仅适用「续签」',
      conditions: [
        { field: '交易类型', operator: '等于', expected: '续签', actual: '新签', passed: false },
        { field: '连续在租月数', operator: '大于等于', expected: '24', actual: '0', passed: false },
      ],
    },
    {
      code: 'R2-03',
      name: '渠道线索加计',
      rateBps: 890,
      hit: false,
      missReason: '线索来源为「渠道转介」但渠道编号未在当期白名单内',
      conditions: [
        { field: '线索来源', operator: '等于', expected: '渠道转介', actual: '渠道转介', passed: true },
        { field: '渠道编号', operator: '属于', expected: 'CH-1001 / CH-1004 / CH-1009', actual: 'CH-1017', passed: false },
      ],
    },
    {
      code: 'R2-04',
      name: '折让回款折减',
      rateBps: 620,
      hit: false,
      missReason: '折扣率 92% 未低于 85% 的折让门槛',
      conditions: [
        { field: '折扣率', operator: '小于等于', expected: '85%', actual: '92%', passed: false },
        { field: '折让审批', operator: '等于', expected: '已审批', actual: '不适用', passed: false },
      ],
    },
  ],
};

const ruleV3: RuleVersion = {
  version: 'R-2026.10-v3',
  effectiveFrom: '2026-10-01',
  effectiveTo: '2027-03-31',
  publishedBy: '提成规则管理组',
  publishedAt: '2026-09-26 09:40',
  rows: [
    {
      code: 'R3-01',
      name: '标准回款计提',
      rateBps: 838,
      hit: true,
      conditions: [
        { field: '记录类型', operator: '等于', expected: '计提', actual: '计提', passed: true },
        { field: '回款期次', operator: '小于等于', expected: '第 4 期', actual: '第 1 期', passed: true },
        { field: '交易类型', operator: '等于', expected: '新签', actual: '新签', passed: true },
        { field: '会籍档位', operator: '属于', expected: '铂金 / 钻石', actual: '铂金', passed: true },
      ],
    },
    {
      code: 'R3-05',
      name: '标准回款计提（协同分摊）',
      rateBps: 838,
      hit: false,
      missReason: '协同业务员编号为空，本行仅适用「双人协同」场景',
      conditions: [
        { field: '协同业务员', operator: '不为空', expected: '已指定', actual: '未指定', passed: false },
      ],
    },
  ],
};

function chainNode(
  code: string,
  type: RecordChainNode['type'],
  amountCents: number,
  status: string,
  happenedAt: string,
  relation: string,
  recordId?: string,
): RecordChainNode {
  return { code, type, amountCents, status, happenedAt, relation, recordId };
}

const approvalOfAdjustment: ApprovalNode[] = [
  {
    role: '发起 · 商务助理',
    operator: '助理 A-07',
    decidedAt: '2026-10-16 09:22',
    decision: '提交调整申请',
    comment: '客户补付第 2 期回款，需按新基数重算',
  },
  {
    role: '复核 · 财务专员',
    operator: '财务 B-03',
    decidedAt: '2026-10-16 14:05',
    decision: '复核通过',
    comment: '回款流水与合同条款一致，金额无误',
  },
  {
    role: '审批 · 财务经理',
    operator: '财务经理 C-01',
    decidedAt: '2026-10-17 09:31',
    decision: '审批通过',
    comment: '同意补提差额，计入 2026-10 所属月份',
  },
];

export interface RecordSeed {
  id: string;
  code: string;
  type: CommissionRecord['type'];
  status: CommissionRecord['status'];
  amountSign: 1 | -1;
  baseCents: number;
  rateBps: number;
  shareBp: number;
  month: string;
  monthToDateAccruedCents: number;
  contractAccruedCents: number;
  receivedCents: number;
  exclusions: Array<{ name: string; cents: number }>;
  installment: string;
  settledOn: string;
  rule: RuleVersion;
  approvalChain: ApprovalNode[];
  chain: RecordChainNode[];
  originalAccrual?: RecordChainNode;
}

function assemble(seed: RecordSeed): CommissionRecord {
  const ledger = computeLedger({ baseCents: seed.baseCents, rateBps: seed.rateBps, shareBp: seed.shareBp });
  const draft: CommissionRecord = {
    id: seed.id,
    code: seed.code,
    type: seed.type,
    status: seed.status,
    salesperson: {
      name: '业务员 D-12',
      employeeNo: 'E2026012',
      role: '招商业务员（主）',
      team: '招商一组',
    },
    amountCents: seed.amountSign * ledger.settledCents,
    month: seed.month,
    monthToDateAccruedCents: seed.monthToDateAccruedCents,
    contractAccruedCents: seed.contractAccruedCents,
    payment: {
      installment: seed.installment,
      settledOn: seed.settledOn,
      receivedCents: seed.receivedCents,
      exclusions: seed.exclusions,
    },
    contract: {
      code: 'HT-2026-0731',
      signedOn: '2026-09-05',
      dealType: '新签',
      membershipTier: '铂金',
      spaceType: '独立办公室（8 工位）',
      leaseTerm: '24 个月（2026-10-01 至 2028-09-30）',
      discountRate: '92%',
      leadSource: '渠道转介 · CH-1017',
    },
    rule: seed.rule,
    params: { baseCents: seed.baseCents, rateBps: seed.rateBps, shareBp: seed.shareBp },
    steps: [],
    relations: {
      replacedChain: seed.chain,
      originalAccrual: seed.originalAccrual,
      approvalChain: seed.approvalChain,
    },
  };
  draft.steps = buildSteps(draft);
  return draft;
}

const accrualCode = 'CM-2026-09-000417';

const accrualSeed: RecordSeed = {
  id: '1',
  code: accrualCode,
  type: 'accrual',
  status: 'confirmed',
  amountSign: 1,
  baseCents: 9642038,
  rateBps: 845,
  shareBp: 7000,
  month: '2026-09',
  monthToDateAccruedCents: 2718044,
  contractAccruedCents: 0,
  receivedCents: 9650000,
  exclusions: [{ name: '押金结转调整', cents: 7962 }],
  installment: '第 1 期',
  settledOn: '2026-09-18',
  rule: ruleV2,
  approvalChain: [],
  chain: [
    chainNode(accrualCode, 'accrual', 570326, '已确认', '2026-09-19 08:40', '本记录'),
  ],
};

const clawbackSeed: RecordSeed = {
  id: '2',
  code: 'CM-2026-10-000512',
  type: 'clawback',
  status: 'confirmed',
  amountSign: -1,
  baseCents: 9642038,
  rateBps: 845,
  shareBp: 7000,
  month: '2026-10',
  monthToDateAccruedCents: 3294882,
  contractAccruedCents: 570326,
  receivedCents: 9650000,
  exclusions: [{ name: '押金结转调整', cents: 7962 }],
  installment: '第 1 期（整期退回）',
  settledOn: '2026-10-08',
  rule: ruleV2,
  approvalChain: [],
  chain: [
    chainNode(accrualCode, 'accrual', 570326, '已确认', '2026-09-19 08:40', '被本记录冲销', '1'),
    chainNode('CM-2026-10-000512', 'clawback', -570326, '已确认', '2026-10-09 10:15', '本记录'),
  ],
  originalAccrual: chainNode(accrualCode, 'accrual', 570326, '已确认', '2026-09-19 08:40', '扣回对应的原计提记录', '1'),
};

const adjustmentSeed: RecordSeed = {
  id: '3',
  code: 'CM-2026-10-000588',
  type: 'adjustment',
  status: 'pending_review',
  amountSign: 1,
  baseCents: 12840006,
  rateBps: 845,
  shareBp: 7000,
  month: '2026-10',
  monthToDateAccruedCents: 3294882,
  contractAccruedCents: 570326,
  receivedCents: 12840006,
  exclusions: [],
  installment: '第 2 期（补付）',
  settledOn: '2026-10-15',
  rule: ruleV2,
  approvalChain: approvalOfAdjustment,
  chain: [
    chainNode(accrualCode, 'accrual', 570326, '已确认', '2026-09-19 08:40', '被本记录替代', '1'),
    chainNode('CM-2026-10-000588', 'adjustment', 189161, '待复核', '2026-10-17 09:31', '本记录'),
  ],
  originalAccrual: chainNode(accrualCode, 'accrual', 570326, '已确认', '2026-09-19 08:40', '调整依据的原计提记录', '1'),
};

export const activeRule: RuleVersion = ruleV3;
export const frozenRule: RuleVersion = ruleV2;

export const records: CommissionRecord[] = [
  assemble(accrualSeed),
  assemble(clawbackSeed),
  assemble(adjustmentSeed),
];

export function findRecord(id: string): CommissionRecord | undefined {
  return records.find((item) => item.id === id);
}
