const formatter = new Intl.NumberFormat('zh-CN', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** 以「分」为单位的整数格式化为两位小数金额字符串，不含货币符号。 */
export function formatCents(cents: number): string {
  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(cents);
  const yuan = Math.floor(abs / 100);
  const fen = abs % 100;
  return `${sign}${formatter.format(yuan)}.${fen.toString().padStart(2, '0')}`;
}

/** 带货币符号的金额，扣回等负数保留负号。 */
export function formatMoney(cents: number): string {
  return cents < 0 ? `-¥${formatCents(Math.abs(cents))}` : `¥${formatCents(cents)}`;
}

/** 以分为单位的原始小数（可能带分以下小数）格式化为四位小数，用于公式展示。 */
export function formatRawCents(rawCents: number): string {
  const fixed = rawCents.toFixed(4);
  const [intPart, decPart] = fixed.split('.');
  const sign = intPart.startsWith('-') ? '-' : '';
  const digits = sign ? intPart.slice(1) : intPart;
  return `${sign}${formatter.format(Number(digits))}.${decPart}`;
}

/** 百分比展示：bps = 万分比，845 → 8.45% */
export function formatBps(bps: number): string {
  return `${(bps / 100).toFixed(2)}%`;
}

export function formatBpShare(bp: number): string {
  return `${(bp / 100).toFixed(2)}%`;
}

export function isNegative(cents: number): boolean {
  return cents < 0;
}
