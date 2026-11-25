import { describe, expect, it } from 'vitest';
import { formatBps, formatCents, formatMoney, formatRawCents, isNegative } from './money';

describe('money 格式化', () => {
  it('以分为单位输出两位小数', () => {
    expect(formatCents(570326)).toBe('5,703.26');
    expect(formatCents(0)).toBe('0.00');
    expect(formatCents(9)).toBe('0.09');
  });

  it('负数保留负号', () => {
    expect(formatCents(-570326)).toBe('-5,703.26');
    expect(formatMoney(-570326)).toBe('-¥5,703.26');
  });

  it('带货币符号', () => {
    expect(formatMoney(128400)).toBe('¥1,284.00');
  });

  it('未取整值保留四位小数', () => {
    expect(formatRawCents(814752.211)).toBe('814,752.2110');
  });

  it('万分比换算百分比', () => {
    expect(formatBps(845)).toBe('8.45%');
    expect(formatBps(20)).toBe('0.20%');
  });

  it('负数判定', () => {
    expect(isNegative(-1)).toBe(true);
    expect(isNegative(0)).toBe(false);
    expect(isNegative(1)).toBe(false);
  });
});
