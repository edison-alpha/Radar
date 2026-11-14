import React, { useId } from 'react';

/** Tiny dependency-free trend line. `values` are plain numbers, oldest first. */
export function Sparkline({
  values,
  width = 140,
  height = 40,
  area = false,
  label,
  stretch = false,
}) {
  const id = useId().replaceAll(':', '');
  if (!values || values.length < 2) return <span className="muted">—</span>;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pad = 3;
  const x = (i) => pad + (i / (values.length - 1)) * (width - pad * 2);
  const y = (v) => pad + (1 - (v - min) / span) * (height - pad * 2);
  const line = values
    .map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`)
    .join(' ');
  const up = values.at(-1) >= values[0];
  const color = up ? 'var(--positive)' : 'var(--negative)';
  return (
    <svg
      className="sparkline"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio={stretch ? 'none' : 'xMidYMid meet'}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {area && (
        <>
          <defs>
            <linearGradient id={`${id}-f`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity=".28" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d={`${line} L${x(values.length - 1)},${height} L${x(0)},${height} Z`}
            fill={`url(#${id}-f)`}
          />
        </>
      )}
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect={stretch ? 'non-scaling-stroke' : undefined}
      />
    </svg>
  );
}
