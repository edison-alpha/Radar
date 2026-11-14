import React, { useId } from 'react';

const WIDTH = 760;
const HEIGHT = 330;
const INSET = { left: 6, right: 64, top: 16, bottom: 36 };

// Monotone cubic interpolation keeps the curve smooth without overshooting the data.
function smoothPath(coords) {
  const n = coords.length;
  if (n < 3) return coords.map(([px, py], i) => `${i ? 'L' : 'M'}${px},${py}`).join(' ');
  const dx = [];
  const slope = [];
  for (let i = 0; i < n - 1; i++) {
    dx[i] = coords[i + 1][0] - coords[i][0] || 1e-6;
    slope[i] = (coords[i + 1][1] - coords[i][1]) / dx[i];
  }
  const tangent = [slope[0]];
  for (let i = 1; i < n - 1; i++) {
    tangent[i] = slope[i - 1] * slope[i] <= 0 ? 0 : (slope[i - 1] + slope[i]) / 2;
  }
  tangent[n - 1] = slope[n - 2];
  let d = `M${coords[0][0]},${coords[0][1]}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    d += ` C${coords[i][0] + h},${coords[i][1] + tangent[i] * h} ${coords[i + 1][0] - h},${coords[i + 1][1] - tangent[i + 1] * h} ${coords[i + 1][0]},${coords[i + 1][1]}`;
  }
  return d;
}

export function LineChart({
  points,
  activeIndex,
  onActiveIndex,
  formatX,
  formatY,
  label,
  description,
  variant = 'line',
  yFit = false,
  restIndex,
  xTickCount = 3,
}) {
  const id = useId().replaceAll(':', '');
  const plotWidth = WIDTH - INSET.left - INSET.right;
  const plotHeight = HEIGHT - INSET.top - INSET.bottom;
  const minX = points[0].x;
  const maxX = points.at(-1).x;
  const values = points.map((point) => point.value);
  const dataMax = Math.max(...values);
  const dataMin = Math.min(...values);
  const pad = (dataMax - dataMin || dataMax || 1) * 0.12;
  const minY = yFit ? Math.max(0, dataMin - pad) : 0;
  const maxY = yFit ? dataMax + pad : dataMax * 1.15;
  const x = (value) => INSET.left + ((value - minX) / (maxX - minX || 1)) * plotWidth;
  const y = (value) => INSET.top + plotHeight * (1 - (value - minY) / (maxY - minY || 1));
  const tickValue = (fraction) => minY + (maxY - minY) * fraction;
  const line = smoothPath(points.map((point) => [x(point.x), y(point.value)]));
  const bottom = INSET.top + plotHeight;
  const area = `${line} L${x(maxX)},${bottom} L${x(minX)},${bottom} Z`;
  const baseline = points.find((point) => point.baseline);
  const active = points[activeIndex] ?? baseline;
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  const xTicks = Array.from(
    { length: xTickCount },
    (_, i) => points[Math.round((i * (points.length - 1)) / Math.max(1, xTickCount - 1))],
  );

  function selectPoint(event) {
    const bounds = event.currentTarget.getBoundingClientRect();
    if (!bounds.width) return;
    const position = ((event.clientX - bounds.left) / bounds.width) * WIDTH;
    const target = minX + ((position - INSET.left) / plotWidth) * (maxX - minX);
    const closest = points.reduce(
      (best, point, index) =>
        Math.abs(point.x - target) < Math.abs(points[best].x - target) ? index : best,
      0,
    );
    onActiveIndex(closest);
  }

  return (
    <div
      className="line-chart"
      onPointerMove={selectPoint}
      onPointerLeave={() => onActiveIndex(restIndex ?? points.findIndex((point) => point.baseline))}
    >
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-labelledby={`${id}-title ${id}-description`}
      >
        <title id={`${id}-title`}>{label}</title>
        <desc id={`${id}-description`}>{description}</desc>
        <defs>
          <linearGradient id={`${id}-fill`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#00b050" stopOpacity=".32" />
            <stop offset="100%" stopColor="#00b050" stopOpacity="0" />
          </linearGradient>
          <linearGradient
            id={`${id}-fade`}
            gradientUnits="userSpaceOnUse"
            x1={INSET.left}
            x2={INSET.left + plotWidth * 0.16}
            y1="0"
            y2="0"
          >
            <stop offset="0%" stopColor="#fff" stopOpacity="0" />
            <stop offset="100%" stopColor="#fff" stopOpacity="1" />
          </linearGradient>
          <linearGradient
            id={`${id}-fade-inverse`}
            gradientUnits="userSpaceOnUse"
            x1={INSET.left}
            x2={INSET.left + plotWidth * 0.16}
            y1="0"
            y2="0"
          >
            <stop offset="0%" stopColor="#fff" stopOpacity="1" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <mask
            id={`${id}-crisp`}
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            width={WIDTH}
            height={HEIGHT}
          >
            <rect x="0" y="0" width={WIDTH} height={HEIGHT} fill={`url(#${id}-fade)`} />
            <rect
              x={INSET.left + plotWidth * 0.16}
              y="0"
              width={WIDTH}
              height={HEIGHT}
              fill="#fff"
            />
          </mask>
          <mask
            id={`${id}-soft`}
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            width={WIDTH}
            height={HEIGHT}
          >
            <rect x="0" y="0" width={WIDTH} height={HEIGHT} fill={`url(#${id}-fade-inverse)`} />
          </mask>
          <filter id={`${id}-blur`} x="-5%" y="-20%" width="110%" height="140%">
            <feGaussianBlur stdDeviation="3.5" />
          </filter>
        </defs>
        {ticks.map((fraction) => (
          <g key={fraction}>
            <line
              x1={INSET.left}
              x2={WIDTH - INSET.right + 8}
              y1={y(tickValue(fraction))}
              y2={y(tickValue(fraction))}
              className="chart-gridline"
            />
            <text
              x={WIDTH - INSET.right + 18}
              y={y(tickValue(fraction)) + 3}
              textAnchor="start"
              className="chart-axis-label"
            >
              {formatY(tickValue(fraction))}
            </text>
          </g>
        ))}
        {variant === 'line' && (
          <>
            <g className="chart-area" mask={`url(#${id}-crisp)`}>
              <path d={area} fill={`url(#${id}-fill)`} />
            </g>
            <g mask={`url(#${id}-soft)`} filter={`url(#${id}-blur)`}>
              <path d={area} fill={`url(#${id}-fill)`} />
              <path d={line} pathLength="1" className="chart-line" />
            </g>
          </>
        )}
        {variant === 'bars' &&
          points.map((point, index) => {
            const barWidth = Math.max(2, (plotWidth / points.length) * 0.6);
            return (
              <rect
                key={point.x}
                x={x(point.x) - barWidth / 2}
                y={y(point.value)}
                width={barWidth}
                height={Math.max(0, bottom - y(point.value))}
                rx={Math.min(3, barWidth / 2)}
                className={index === activeIndex ? 'chart-bar is-active' : 'chart-bar'}
                style={{ '--i': Math.min(index, 60) }}
              />
            );
          })}
        {variant === 'line' && (
          <g mask={`url(#${id}-crisp)`}>
            <path d={line} pathLength="1" className="chart-line" />
          </g>
        )}
        {baseline && (
          <circle
            cx={x(baseline.x)}
            cy={y(baseline.value)}
            r="3.5"
            className="chart-baseline-dot"
          />
        )}
        {active && (
          <g>
            <line
              x1={x(active.x)}
              x2={x(active.x)}
              y1={INSET.top}
              y2={bottom}
              className="chart-crosshair"
            />
            <circle cx={x(active.x)} cy={y(active.value)} r="11" className="chart-active-halo" />
            <circle cx={x(active.x)} cy={y(active.value)} r="4" className="chart-active-dot" />
          </g>
        )}
        {xTicks.map((point) => (
          <text
            key={point.x}
            x={x(point.x)}
            y={HEIGHT - 12}
            textAnchor="middle"
            className="chart-axis-label"
          >
            {formatX(point.x)}
          </text>
        ))}
      </svg>
    </div>
  );
}
