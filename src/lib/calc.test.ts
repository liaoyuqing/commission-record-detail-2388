import { describe, expect, it } from 'vitest';
import { buildSteps, computeLedger, divRoundHalfUp, replay } from './calc';
import { records } from '../mock/records';

describe('divRoundHalfUp', () => {
  it('大于等于半分进一、不足半分舍去', () => {
    expect(divRoundHalfUp(5, 2)).toBe(3);
    expect(divRoundHalfUp(4, 2)).toBe(2);
    expect(divRoundHalfUp(1, 3)).toBe(0);
    expect(divRoundHalfUp(2, 3)).toBe(1);
  });

  it('负数按绝对值取整后还原符号', () => {
    expect(divRoundHalfUp(-5, 2)).toBe(-3);
    expect(divRoundHalfUp(-1, 3)).toBe(0);
  });

  it('除数为零抛出异常', () => {
    expect(() => divRoundHalfUp(1, 0)).toThrow('divisor must be positive');
  });
});

describe('computeLedger 拆分守恒', () => {
  it('主业务员份额 + 协同份额 + 尾差 恒等于取整总额', () => {
    for (const record of records) {
      const ledger = computeLedger(record.params);
      expect(ledger.shareCents + ledger.otherCents + ledger.tailCents).toBe(ledger.totalCents);
    }
  });

  it('实收 96,500.00 扣 79.62 后基数 96,420.38，尾差为 -1 分', () => {
    const ledger = computeLedger({ baseCents: 9642038, rateBps: 845, shareBp: 7000 });
    expect(ledger.totalCents).toBe(814752);
    expect(ledger.shareCents).toBe(570327);
    expect(ledger.otherCents).toBe(244426);
    expect(ledger.tailCents).toBe(-1);
    expect(ledger.settledCents).toBe(570326);
  });

  it('调整记录基数 128,400.06 时尾差为 +1 分', () => {
    const ledger = computeLedger({ baseCents: 12840006, rateBps: 845, shareBp: 7000 });
    expect(ledger.totalCents).toBe(1084981);
    expect(ledger.shareCents).toBe(759486);
    expect(ledger.tailCents).toBe(1);
    expect(ledger.settledCents).toBe(759487);
  });
});

describe('buildSteps 计算步骤', () => {
  it('计提记录共 8 步，取整步骤 3 个、尾差步骤 1 个', () => {
    const accrual = records[0];
    const steps = buildSteps(accrual);
    expect(steps).toHaveLength(8);
    expect(steps.filter((step) => step.highlight === 'rounding')).toHaveLength(3);
    expect(steps.filter((step) => step.highlight === 'tail')).toHaveLength(1);
  });

  it('取整步骤与尾差步骤带专用标记，普通步骤不带', () => {
    const steps = buildSteps(records[0]);
    expect(steps[2].highlight).toBe('rounding');
    expect(steps[4].highlight).toBe('rounding');
    expect(steps[5].highlight).toBe('rounding');
    expect(steps[6].highlight).toBe('tail');
    expect(steps[0].highlight).toBe('none');
  });

  it('尾差步骤的公式与输出体现两次取整的差额', () => {
    const steps = buildSteps(records[0]);
    const tailStep = steps[6];
    expect(tailStep.formula).toContain('尾差');
    expect(tailStep.output).toBe('-¥0.01');
  });

  it('调整记录在 8 步基础上追加比对与差额 2 步', () => {
    const adjustment = records[2];
    const steps = buildSteps(adjustment);
    expect(steps).toHaveLength(10);
    expect(steps[9].title).toBe('计算调整差额');
    expect(steps[9].output).toBe('¥1,891.61');
  });
});

describe('replay 重放校验', () => {
  it('同规则快照重放结果为一致', () => {
    const record = records[0];
    const result = replay(record);
    expect(result.consistent).toBe(true);
    expect(result.firstDiff).toBeUndefined();
    expect(result.comparedSteps).toBe(record.steps.length);
  });

  it('替换费率后重放定位到第一处差异步骤', () => {
    const record = records[0];
    const stale = {
      ...record.rule,
      version: 'R-2026.10-v3',
      rows: record.rule.rows.map((row, index) => (index === 0 ? { ...row, rateBps: 838 } : row)),
    };
    const result = replay(record, stale);
    expect(result.consistent).toBe(false);
    expect(result.firstDiff?.no).toBe(2);
    expect(result.firstDiff?.title).toBe('计算提成总额（未取整）');
    expect(result.firstDiff?.recorded).not.toBe(result.firstDiff?.replayed);
    expect(result.ruleVersion).toBe('R-2026.10-v3');
  });

  it('三条记录在同规则下均可重放一致', () => {
    for (const record of records) {
      expect(replay(record).consistent).toBe(true);
    }
  });
});
