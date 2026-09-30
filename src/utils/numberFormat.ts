/**
 * Utility functions for formatting numbers with standard thousand delimiters (e.g. 100,000)
 * to provide a clear, professional reading experience across all tables, charts, cards, and summaries.
 */

export function formatNumber(val: number | string | null | undefined): string {
  if (val === null || val === undefined || val === '') return '0';
  if (typeof val === 'number') {
    return isNaN(val) ? '0' : val.toLocaleString('en-US');
  }
  const str = String(val).trim();
  // Don't format dates or complex strings containing dashes, slashes, colons, or alphabet/script characters
  if (str.includes('-') || str.includes('/') || str.includes(':') || /[a-zA-Z\u0E80-\u0EFF\u0E00-\u0E7F]/.test(str)) {
    return str;
  }
  const clean = str.replace(/,/g, '');
  const num = Number(clean);
  if (isNaN(num)) {
    return str;
  }
  return num.toLocaleString('en-US');
}

export function formatCurrency(amount: number | string | null | undefined, symbol: string = ''): string {
  const formatted = formatNumber(amount);
  return symbol ? `${symbol} ${formatted}` : formatted;
}
