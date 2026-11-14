export const money = (value, digits = 1) =>
  value == null
    ? 'Not reported'
    : new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        notation: 'compact',
        maximumFractionDigits: digits,
      }).format(value);
export const number = (value) => new Intl.NumberFormat('en-US').format(value);
export const percent = (value) =>
  value == null ? 'Not reported' : `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
export const ageLabel = (days) =>
  days == null ? 'Unknown' : days < 365 ? `${days}d` : `${(days / 365).toFixed(1)}y`;
export const snapshotDate = (date) =>
  new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(date));
export function downloadCsv(rows) {
  const columns = [
    'rank',
    'name',
    'category',
    'tvl_usd',
    'change_7d',
    'implied_value_usd',
    'implied_low_usd',
    'implied_high_usd',
    'slice_per_1k_usd',
    'age_days',
  ];
  const escape = (v) => `"${String(v ?? '').replaceAll('"', '""')}"`;
  const text = [
    columns.join(','),
    ...rows.map((row) => columns.map((key) => escape(row[key])).join(',')),
  ].join('\r\n');
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8;' }));
  const link = Object.assign(document.createElement('a'), {
    href: url,
    download: 'radar-protocols.csv',
  });
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
