import React, { useMemo, useState } from 'react';
import { Icon } from '../../../shared/Icon';
import { LineChart } from '../../../components/charts/LineChart';
import { money } from '../../../shared/format';
import { RANGES, formatDay, formatFull, formatMonth, sliceRange } from '../../../shared/history';

export function TvlHistoryChart({ protocol, history }) {
  const [range, setRange] = useState('3M');
  const [variant, setVariant] = useState('line');
  const [hover, setHover] = useState(null);
  const days = RANGES.find((r) => r.id === range).days;
  const points = useMemo(
    () => sliceRange(history.points, days).map((p) => ({ x: p.x, value: p.value })),
    [history, days],
  );
  const last = points.length - 1;
  const activeIndex = hover ?? last;
  const active = points[activeIndex];
  const change = active.value - points[0].value;
  const changePct = points[0].value ? (change / points[0].value) * 100 : null;
  const up = change >= 0;
  const formatX = days > 120 ? formatMonth : formatDay;

  function changeRange(id) {
    setRange(id);
    setHover(null);
  }

  return (
    <section className="detail-section valuation-chart-section" aria-label="TVL history">
      <div className="valuation-chart-panel">
        <div className="chart-readout">
          <span className="chart-readout-label">{protocol.name} TVL</span>
          <strong>{money(active.value, 2)}</strong>
          <div className="chart-assumptions">
            <span className={up ? 'positive' : 'negative'}>
              {up ? '▲' : '▼'} {money(Math.abs(change), 2)}
              {changePct == null ? '' : ` (${Math.abs(changePct).toFixed(2)}%)`}
            </span>
            <span>{formatFull(active.x)}</span>
          </div>
        </div>
        <LineChart
          key={`${range}-${variant}`}
          points={points}
          activeIndex={activeIndex}
          onActiveIndex={(index) => setHover(index === last ? null : index)}
          restIndex={last}
          formatX={formatX}
          formatY={(value) => money(value)}
          yFit
          xTickCount={5}
          variant={variant}
          label={`${protocol.name} total value locked, last ${range}`}
          description="Daily total value locked from DefiLlama's history for this protocol."
        />
        <div className="chart-footer">
          <div className="chart-switch" role="group" aria-label="Time range">
            {RANGES.map((r) => (
              <button key={r.id} aria-pressed={range === r.id} onClick={() => changeRange(r.id)}>
                {r.id}
              </button>
            ))}
          </div>
          <div className="chart-switch chart-type" role="group" aria-label="Chart type">
            <button
              aria-pressed={variant === 'line'}
              onClick={() => setVariant('line')}
              aria-label="Line chart"
            >
              <Icon name="chartLine" size={18} />
            </button>
            <button
              aria-pressed={variant === 'bars'}
              onClick={() => setVariant('bars')}
              aria-label="Bar chart"
            >
              <Icon name="chartBars" size={18} />
            </button>
          </div>
        </div>
      </div>
      <p className="chart-disclaimer">
        Historical TVL from DefiLlama (fetched {history.fetched}, through {history.latest}). It is
        shown for context and is separate from the sealed snapshot that sets the ranking and the
        implied value.
      </p>
    </section>
  );
}
