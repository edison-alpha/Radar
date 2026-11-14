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
export function buildCsv(rows, asOf) {
  const columns = [
    ['Snapshot date (UTC)', () => asOf], ['Rank', r => r.rank],
    ['Protocol', r => r.name], ['Slug', r => r.slug], ['Category', r => r.category],
    ['Chains', r => r.chains?.join('; ')], ['Watchlist', r => r.watchlist ? 'Yes' : 'No'], ['Tier', r => r.tier],
    ['Token status', r => r.token_status], ['TVL (USD)', r => r.tvl_usd],
    ['TVL change 7d (%)', r => r.change_7d], ['Tracked since', r => r.listed_at],
    ['Tracked (days)', r => r.age_days], ['Implied value (USD)', r => r.implied_value_usd],
    ['Implied P25 (USD)', r => r.implied_low_usd], ['Implied P75 (USD)', r => r.implied_high_usd],
    ['Illustrative allocation per $1k (USD)', r => r.slice_per_1k_usd],
    ['Farm action', r => r.farm?.action], ['Farm chain', r => r.farm?.chain],
    ['Estimated fees (USD)', r => r.farm?.fees_usd], ['Estimated time (minutes)', r => r.farm?.minutes],
    ['Test capital (USD)', r => r.farm?.capital_usd], ['Transactions', r => r.farm?.txs],
    ['Farm risks', r => r.farm?.risk], ['Farm assumptions', r => r.farm?.assumption],
    ...Array.from({ length: Math.max(0, ...rows.map(r => r.farm_steps?.length ?? 0)) }, (_, i) =>
      [`Farm step ${i + 1}`, r => r.farm_steps?.[i]]),
  ];
  const escape = (value) => {
    let text = String(value ?? '');
    if (typeof value === 'string' && /^[\s]*[=+@\-\t\r]/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  };
  return '\uFEFF' + [columns.map(([label]) => escape(label)).join(','),
    ...rows.map(row => columns.map(([, get]) => escape(get(row))).join(','))].join('\r\n');
}
export function downloadCsv(rows, asOf) {
  const text = buildCsv(rows, asOf);
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8;' }));
  const link = Object.assign(document.createElement('a'), {
    href: url,
    download: 'radar-protocols.csv',
  });
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
