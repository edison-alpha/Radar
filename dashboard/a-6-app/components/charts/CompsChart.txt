import React, { useMemo, useState } from 'react';
import { money } from '../../shared/format';

const W = 760;
const H = 380;
const PAD = { left: 58, right: 34, top: 18, bottom: 40 };

/**
 * The launch curve. Grey: token-recorded protocols (market cap on record). Green: ranked
 * pre-token protocols at their implied value. Hover for the nearest point, click a green
 * point to open it, and use the legend to hide either group.
 */
export function CompsChart({ curve, rows, onSelect }) {
  const [show, setShow] = useState({ comps: true, radar: true });
  const [hover, setHover] = useState(null);

  const scale = useMemo(() => {
    const xs = [...curve.points.map((p) => p[0]), ...rows.map((r) => r.tvl_usd)].map(Math.log10);
    const ys = [...curve.points.map((p) => p[1]), ...rows.map((r) => r.implied_value_usd)].map(
      Math.log10,
    );
    const minX = Math.floor(Math.min(...xs));
    const maxX = Math.ceil(Math.max(...xs));
    const minY = Math.floor(Math.min(...ys));
    const maxY = Math.ceil(Math.max(...ys));
    return {
      minX,
      maxX,
      minY,
      maxY,
      x: (v) => PAD.left + ((v - minX) / (maxX - minX)) * (W - PAD.left - PAD.right),
      y: (v) => PAD.top + (1 - (v - minY) / (maxY - minY)) * (H - PAD.top - PAD.bottom),
    };
  }, [curve, rows]);
  const { minX, maxX, minY, maxY, x, y } = scale;

  const dots = useMemo(() => {
    const list = [];
    if (show.comps)
      for (const [tvl, mcap, name] of curve.points)
        list.push({
          kind: 'comp',
          name,
          tvl,
          value: mcap,
          cx: x(Math.log10(tvl)),
          cy: y(Math.log10(mcap)),
        });
    if (show.radar)
      for (const r of rows)
        list.push({
          kind: 'radar',
          name: r.name,
          tvl: r.tvl_usd,
          value: r.implied_value_usd,
          row: r,
          cx: x(Math.log10(r.tvl_usd)),
          cy: y(Math.log10(r.implied_value_usd)),
        });
    return list;
  }, [curve, rows, show, x, y]);

  const line = (v) => curve.intercept + curve.elasticity * v;
  const lo = Math.log10(curve.low_factor);
  const hi = Math.log10(curve.high_factor);
  const band = `M${x(minX)},${y(line(minX) + hi)} L${x(maxX)},${y(line(maxX) + hi)} L${x(maxX)},${y(line(maxX) + lo)} L${x(minX)},${y(line(minX) + lo)} Z`;
  const ticks = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

  function locate(event) {
    const box = event.currentTarget.getBoundingClientRect();
    if (!box.width) return null;
    const px = ((event.clientX - box.left) / box.width) * W;
    const py = ((event.clientY - box.top) / box.height) * H;
    let best = null;
    let bestDistance = 22 * 22;
    for (const dot of dots) {
      const distance = (dot.cx - px) ** 2 + (dot.cy - py) ** 2;
      // a green point wins a near tie so it stays clickable inside a crowd
      const weighted = dot.kind === 'radar' ? distance * 0.7 : distance;
      if (weighted < bestDistance) {
        bestDistance = weighted;
        best = dot;
      }
    }
    return best;
  }

  const tipLeft = hover ? (hover.cx / W) * 100 : 0;
  const tipTop = hover ? (hover.cy / H) * 100 : 0;
  return (
    <figure className="comps-chart">
      <div className="comps-stage">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-labelledby="comps-title comps-desc"
          className={hover?.kind === 'radar' ? 'is-clickable' : ''}
          onPointerMove={(event) => setHover(locate(event))}
          onPointerLeave={() => setHover(null)}
          onClick={(event) => {
            const dot = locate(event);
            if (dot?.row && onSelect) onSelect(dot.row);
          }}
        >
          <title id="comps-title">Launch curve: market cap against TVL</title>
          <desc id="comps-desc">
            {curve.comparables} token-recorded protocols with the fitted line and its middle-half
            band, and {rows.length} pre-token protocols at their implied values.
          </desc>
          <clipPath id="comps-clip">
            <rect
              x={PAD.left}
              y={PAD.top}
              width={W - PAD.left - PAD.right}
              height={H - PAD.top - PAD.bottom}
            />
          </clipPath>
          {ticks(minY, maxY).map((t) => (
            <g key={`y${t}`}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={y(t)}
                y2={y(t)}
                className="chart-gridline"
              />
              <text x={PAD.left - 10} y={y(t) + 4} textAnchor="end" className="comps-axis">
                {money(10 ** t, 0)}
              </text>
            </g>
          ))}
          {ticks(minX, maxX).map((t) => (
            <text key={`x${t}`} x={x(t)} y={H - 14} textAnchor="middle" className="comps-axis">
              {money(10 ** t, 0)}
            </text>
          ))}
          <g clipPath="url(#comps-clip)">
            <path d={band} className="comps-band" />
            <line
              x1={x(minX)}
              x2={x(maxX)}
              y1={y(line(minX))}
              y2={y(line(maxX))}
              className="comps-line"
            />
            {dots.map((dot, i) => (
              <circle
                key={`${dot.kind}-${i}`}
                cx={dot.cx}
                cy={dot.cy}
                r={dot.kind === 'radar' ? 2.8 : 3}
                className={`${dot.kind === 'radar' ? 'comps-candidate' : 'comps-dot'}${hover && hover !== dot ? ' is-dim' : ''}`}
                style={{ '--i': i % 40 }}
              />
            ))}
          </g>
          {hover && (
            <g pointerEvents="none">
              <line
                x1={hover.cx}
                x2={hover.cx}
                y1={hover.cy}
                y2={H - PAD.bottom}
                className="comps-guide"
              />
              <line
                x1={PAD.left}
                x2={hover.cx}
                y1={hover.cy}
                y2={hover.cy}
                className="comps-guide"
              />
              <circle cx={hover.cx} cy={hover.cy} r="9" className="comps-halo" />
              <circle
                cx={hover.cx}
                cy={hover.cy}
                r="4.5"
                className={hover.kind === 'radar' ? 'comps-candidate' : 'comps-dot is-on'}
              />
            </g>
          )}
        </svg>
        {hover && (
          <div
            className={`comps-tip${tipLeft > 62 ? ' is-left' : ''}${tipTop < 28 ? ' is-below' : ''}`}
            style={{ left: `${tipLeft}%`, top: `${tipTop}%` }}
            role="status"
          >
            <strong>{hover.name}</strong>
            <span>
              TVL <b>{money(hover.tvl, 2)}</b>
            </span>
            <span>
              {hover.kind === 'radar' ? 'Implied value' : 'Market cap'}{' '}
              <b>{money(hover.value, 2)}</b>
            </span>
            <em>
              {hover.kind === 'radar' ? 'No token recorded · click to open' : 'Token on record'}
            </em>
          </div>
        )}
      </div>
      <figcaption>
        <button
          className="legend-toggle"
          aria-pressed={show.comps}
          onClick={() => setShow((s) => ({ ...s, comps: !s.comps }))}
        >
          <span className="legend-dot is-comp" /> Market cap on record ({curve.comparables})
        </button>
        <button
          className="legend-toggle"
          aria-pressed={show.radar}
          onClick={() => setShow((s) => ({ ...s, radar: !s.radar }))}
        >
          <span className="legend-dot is-cand" /> Implied value, this radar ({rows.length})
        </button>
        <span className="legend-static">
          <span className="legend-band" /> Middle half of priced tokens (×
          {curve.low_factor.toFixed(2)} to ×{curve.high_factor.toFixed(2)})
        </span>
        <em>
          Horizontal: TVL. Vertical: market cap. Both logarithmic. Hover a point for its figures.
        </em>
      </figcaption>
    </figure>
  );
}
