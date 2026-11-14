import { useMemo } from 'react';
import { tvlHistory } from '../../shared/history';

const DAY_MS = 86_400_000;
const SPARK_POINTS = 45; // ~90 days at the stored 2-day step
const pct = (now, before) => (before > 0 ? (now / before - 1) * 100 : null);

/** Joins the sealed board rows with the locally stored TVL history. Everything here is derived data. */
export function useMonitorData(data) {
  return useMemo(() => {
    const rows = data.rows.map((row) => {
      const history = tvlHistory(row.slug);
      const values = history?.points.map((p) => p.value) ?? null;
      const at = (back) =>
        values && values.length > back ? values[values.length - 1 - back] : null;
      return {
        ...row,
        history,
        spark: values ? values.slice(-SPARK_POINTS) : null,
        change_30d: values ? pct(values.at(-1), at(15)) : null,
        change_90d: values ? pct(values.at(-1), at(45)) : null,
      };
    });

    // Combined TVL of every ranked protocol on a shared 2-day grid.
    const withHistory = rows.filter((r) => r.history);
    let aggregate = null;
    if (withHistory.length) {
      const end = Math.max(...withHistory.map((r) => r.history.points.at(-1).x));
      const grid = Array.from({ length: 91 }, (_, i) => end - (90 - i) * 2 * DAY_MS);
      const values = grid.map((x) => {
        let sum = 0;
        for (const r of withHistory) {
          const pts = r.history.points;
          const first = pts[0].x;
          if (x < first) continue;
          const index = Math.min(pts.length - 1, Math.round((x - first) / (2 * DAY_MS)));
          sum += pts[index].value;
        }
        return sum;
      });
      aggregate = {
        points: grid.map((x, i) => ({ x, value: values[i] })),
        total: values.at(-1),
        change: pct(values.at(-1), values[0]),
        end,
      };
    }

    const byChange = (key, dir) =>
      rows.filter((r) => r[key] != null).sort((a, b) => dir * (b[key] - a[key]) || a.rank - b.rank);
    const gainers = byChange('change_7d', 1);
    const decliners = byChange('change_7d', -1);

    const categories = new Map();
    for (const r of rows) {
      const key = r.category ?? 'Uncategorised';
      const entry = categories.get(key) ?? { name: key, count: 0, tvl: 0 };
      entry.count += 1;
      entry.tvl += r.tvl_usd;
      categories.set(key, entry);
    }
    const topCategories = [...categories.values()].sort((a, b) => b.tvl - a.tvl);
    const newest = rows
      .filter((r) => r.age_days != null)
      .sort((a, b) => a.age_days - b.age_days)[0];
    const by30 = rows
      .filter((r) => r.change_30d != null)
      .map((r) => r.change_30d)
      .sort((a, b) => a - b);
    const median30 = by30.length ? by30[Math.floor(by30.length / 2)] : null;
    const biggest = [...rows].sort((a, b) => b.tvl_usd - a.tvl_usd)[0];

    // Largest two-day TVL move per protocol over the last 30 days, newest first.
    const events = [];
    for (const r of withHistory) {
      const pts = r.history.points;
      let best = null;
      for (let i = Math.max(1, pts.length - 15); i < pts.length; i += 1) {
        const prev = pts[i - 1].value;
        if (prev < 5_000_000) continue;
        const change = (pts[i].value / prev - 1) * 100;
        if (!best || Math.abs(change) > Math.abs(best.change)) {
          best = {
            slug: r.slug,
            name: r.name,
            category: r.category,
            change,
            x: pts[i].x,
            value: pts[i].value,
          };
        }
      }
      if (best && Math.abs(best.change) >= 8) events.push(best);
    }
    events.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
    const recentEvents = events.slice(0, 8).sort((a, b) => b.x - a.x);

    const bestSlices = [...rows]
      .sort((a, b) => b.slice_per_1k_usd - a.slice_per_1k_usd || a.rank - b.rank)
      .slice(0, 5);

    return {
      rows,
      bestSlices,
      aggregate,
      recentEvents,
      gainers,
      decliners,
      topCategories,
      newest,
      median30,
      biggest,
    };
  }, [data]);
}
