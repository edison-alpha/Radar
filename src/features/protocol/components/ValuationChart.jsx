import React, { useMemo, useState } from 'react';
import { Icon } from '../../../shared/Icon';
import { LineChart } from '../../../components/charts/LineChart';
import { money, percent } from '../../../shared/format';
import { buildSensitivity } from '../../../../lib/sensitivity.mjs';

export function ValuationChart({ protocol }) {
  const [driver, setDriver] = useState('tvl');
  const [variant, setVariant] = useState('line');
  const points = useMemo(() => buildSensitivity(protocol, driver), [protocol, driver]);
  const baselineIndex = points.findIndex((point) => point.baseline);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const activeIndex = selectedIndex ?? baselineIndex;
  const active = points[activeIndex] ?? points[baselineIndex];
  const formatX = (value) => `${value > 0 ? '+' : ''}${Number(value.toFixed(1))}%`;
  function changeDriver(value) {
    setDriver(value);
    setSelectedIndex(null);
  }

  return (
    <section
      className="detail-section valuation-chart-section"
      aria-labelledby="valuation-chart-title"
    >
      <h3 id="valuation-chart-title" className="sr-only">
        Explore the valuation
      </h3>
      <div className="valuation-chart-panel">
        <div className="chart-readout">
          <span className="chart-readout-label">
            {active.baseline ? 'Snapshot estimate' : 'Scenario estimate'}
          </span>
          <strong>{money(active.value, 2)}</strong>
          <div className="chart-assumptions">
            <span>
              TVL <strong>{money(active.tvl, 2)}</strong>
            </span>
            <span>
              7d growth{' '}
              <strong>{active.growth == null ? 'Not reported' : percent(active.growth)}</strong>
            </span>
          </div>
        </div>
        <LineChart
          key={`${driver}-${variant}`}
          points={points}
          activeIndex={activeIndex}
          onActiveIndex={setSelectedIndex}
          variant={variant}
          formatX={formatX}
          formatY={(value) => money(value)}
          label={`${protocol.name} valuation sensitivity to ${driver === 'tvl' ? 'TVL' : 'seven-day growth'}`}
          description="Modelled scenarios from the fixed snapshot. This chart is not a historical price series or a forecast. The baseline marker shows the snapshot valuation."
        />
        <div className="chart-footer">
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
          <div className="chart-switch" role="group" aria-label="Chart sensitivity driver">
            <button aria-pressed={driver === 'tvl'} onClick={() => changeDriver('tvl')}>
              TVL
            </button>
            <button aria-pressed={driver === 'growth'} onClick={() => changeDriver('growth')}>
              7d growth
            </button>
          </div>
          <div className="chart-axis-caption">
            <span>
              {driver === 'tvl' ? 'TVL change from snapshot' : 'Assumed seven-day TVL growth'}
            </span>
            <span className="chart-legend">Snapshot baseline</span>
          </div>
        </div>
        <label className="scenario-control">
          <span>
            Explore a scenario <strong>{formatX(active.x)}</strong>
          </span>
          <input
            type="range"
            aria-label="Valuation scenario"
            min="0"
            max={points.length - 1}
            step="1"
            value={activeIndex}
            onChange={(event) => setSelectedIndex(Number(event.target.value))}
            aria-valuetext={`${formatX(active.x)}, implied value ${money(active.value, 2)}`}
          />
          <button onClick={() => setSelectedIndex(null)} disabled={active.baseline}>
            Reset to snapshot
          </button>
        </label>
      </div>
      <p className="chart-disclaimer">
        Scenario analysis, not historical data.{' '}
        {driver === 'tvl'
          ? 'Category, momentum and seasoning are held constant as TVL moves along the curve.'
          : 'TVL, category and seasoning are held constant as growth changes.'}{' '}
        No future price or launch is predicted.
      </p>
    </section>
  );
}
