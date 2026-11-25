import { describe, expect, it } from 'vitest';
import { findRecord, records } from './records';

describe('mock 数据集', () => {
  it('至少含计提、扣回、调整各一条', () => {
    const types = records.map((record) => record.type);
    expect(types).toContain('accrual');
    expect(types).toContain('clawback');
    expect(types).toContain('adjustment');
  });

  it('id 1 / 2 / 3 分别对应计提、扣回、调整', () => {
    expect(findRecord('1')?.type).toBe('accrual');
    expect(findRecord('2')?.type).toBe('clawback');
    expect(findRecord('3')?.type).toBe('adjustment');
  });

  it('扣回记录金额为负数', () => {
    expect(findRecord('2')?.amountCents).toBeLessThan(0);
  });

  it('计提记录金额为正数', () => {
    expect(findRecord('1')?.amountCents).toBeGreaterThan(0);
  });

  it('记录编号唯一', () => {
    const codes = records.map((record) => record.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('扣回记录挂有原计提记录引用', () => {
    const clawback = findRecord('2');
    expect(clawback?.relations.originalAccrual?.code).toBe(findRecord('1')?.code);
  });

  it('调整记录挂有三级审批链', () => {
    const adjustment = findRecord('3');
    expect(adjustment?.relations.approvalChain).toHaveLength(3);
    expect(adjustment?.relations.approvalChain[2].decision).toBe('审批通过');
  });

  it('每条记录的规则都只有一个命中行', () => {
    for (const record of records) {
      expect(record.rule.rows.filter((row) => row.hit)).toHaveLength(1);
    }
  });
});
