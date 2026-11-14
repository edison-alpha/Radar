const DAY_MS = 86_400_000;

/** Expands the compact local TVL history (window.__RADAR_HISTORY__) for one protocol. */
export function tvlHistory(slug) {
  const history = window.__RADAR_HISTORY__;
  const entry = history?.series?.[slug];
  if (!entry) return null;
  const start = Date.parse(`${entry.s}T00:00:00Z`);
  const step = (history.step_days ?? 1) * DAY_MS;
  const points = entry.v.map((thousands, index) => ({
    x: start + index * step,
    value: thousands * 1000,
  }));
  return { points, source: history.source, fetched: history.fetched, latest: history.latest };
}

export const RANGES = [
  { id: '1M', days: 30 },
  { id: '3M', days: 90 },
  { id: '6M', days: 180 },
  { id: '1Y', days: 365 },
];

export function sliceRange(points, days) {
  const end = points.at(-1).x;
  const from = end - days * DAY_MS;
  const sliced = points.filter((p) => p.x >= from);
  return sliced.length > 2 ? sliced : points.slice(-3);
}

const dayFormat = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});
const monthFormat = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  year: '2-digit',
  timeZone: 'UTC',
});
const fullFormat = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});
export const formatDay = (ms) => dayFormat.format(ms);
export const formatMonth = (ms) => monthFormat.format(ms);
export const formatFull = (ms) => fullFormat.format(ms);
