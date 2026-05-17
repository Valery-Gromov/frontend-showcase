export const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export const compactNumber = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

export function formatMetricValue(kind: 'money' | 'number' | 'percent', value: number): string {
  if (kind === 'money') return currency.format(value);
  if (kind === 'percent') return `${value.toFixed(2)}%`;
  return compactNumber.format(value);
}

export function formatDateTime(value?: string): string {
  if (!value) return 'No snapshot yet';
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(value));
}
