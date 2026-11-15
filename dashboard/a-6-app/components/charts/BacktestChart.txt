import React, { useMemo, useState } from 'react';
import { money } from '../../shared/format';

const W = 640;
const H = 380;
const PAD = { left: 62, right: 20, top: 16, bottom: 44 };

/**
 * Out-of-sample backtest. Each dot is a token that trades, priced as if it had none from the other
 * tokens only (leave one out). On the diagonal the model was exactly right; the shaded band is within
 * three times of the real market cap.
 */
export function BacktestChart({ points }) {
  const [hover, setHover] = useState(null);
  const scale = useMemo(() => {
    const values = points.flatMap((p) => [Math.log10(p[0]), Math.log10(p[1])]);
    const min = Math.floor(Math.min(...values));
    const max = Math.ceil(Math.max(...values));
    return {
      min,
      max,
      x: (v) => PAD.left + ((v - min) / (max - min)) * (W - PAD.left - PAD.right),
      y: (v) => PAD.top + (1 - (v - min) / (max - min)) * (H - PAD.top - PAD.bottom),
    };
  }, [points]);
  const { min, max, x, y } = scale;
  const ticks = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  const d3 = Math.log10(3);
  const band = `M${x(min)},${y(min + d3)} L${x(max - d3)},${y(max)} L${x(max)},${y(max)} L${x(max)},${y(max - d3)} L${x(min + d3)},${y(min)} L${x(min)},${y(min)} Z`;
  return (
    <figure className="backtest-chart">
      <div className="backtest-stage">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby="bt-title bt-desc" onPointerLeave={() => setHover(null)}>
          <title id="bt-title">Backtest: modelled value against real market cap</title>
          <desc id="bt-desc">
            {points.length} tokens on record, each priced from the others only. The diagonal is a
            perfect call and the band is within three times.
          </desc>
          <clipPath id="bt-clip">
            <rect x={PAD.left} y={PAD.top} width={W - PAD.left - PAD.right} height={H - PAD.top - PAD.bottom} />
          </clipPath>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} className="grid" />
              <line y1={PAD.top} y2={H - PAD.bottom} x1={x(t)} x2={x(t)} className="grid" />
              <text x={PAD.left - 8} y={y(t) + 4} textAnchor="end" className="tick">
                {money(10 ** t, 0)}
              </text>
              <text x={x(t)} y={H - PAD.bottom + 16} textAnchor="middle" className="tick">
                {money(10 ** t, 0)}
              </text>
            </g>
          ))}
          <g clipPath="url(#bt-clip)">
            <path d={band} className="bt-band" />
            <line x1={x(min)} y1={y(min)} x2={x(max)} y2={y(max)} className="bt-diagonal" />
            {points.map(([predicted, actual, name]) => (
              <circle
                key={name}
                cx={x(Math.log10(predicted))}
                cy={y(Math.log10(actual))}
                r={hover === name ? 5.5 : 3.4}
                className={Math.abs(Math.log10(predicted / actual)) <= d3 ? 'bt-dot hit' : 'bt-dot miss'}
                onPointerEnter={() => setHover(name)}
              >
                <title>
                  {name}: modelled {money(predicted, 1)}, real {money(actual, 1)}
                </title>
              </circle>
            ))}
          </g>
          <text x={(PAD.left + W - PAD.right) / 2} y={H - 4} textAnchor="middle" className="axis">
            Modelled with the token left out
          </text>
          <text transform={`translate(14 ${(PAD.top + H - PAD.bottom) / 2}) rotate(-90)`} textAnchor="middle" className="axis">
            Real market cap
          </text>
        </svg>
      </div>
      <figcaption>
        Each dot is a token that trades, priced from the others only. Green: within 3× of the real
        market cap; grey: further off. {hover ? `Selected: ${hover}.` : ''}
      </figcaption>
    </figure>
  );
}
