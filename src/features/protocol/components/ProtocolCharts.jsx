import React, { useMemo, useState } from 'react';
import { TvlHistoryChart } from './TvlHistoryChart';
import { ValuationChart } from './ValuationChart';
import { tvlHistory } from '../../../shared/history';
import { ChartSkeleton, useReveal } from '../../../components/ui/Skeleton';

export function ProtocolCharts({ protocol }) {
  const history = useMemo(() => tvlHistory(protocol.slug), [protocol.slug]);
  const ready = useReveal(320);
  const [mode, setMode] = useState(history ? 'history' : 'scenario');
  if (!ready) return <ChartSkeleton />;
  return (
    <>
      {history && (
        <div className="chart-tabs" role="tablist" aria-label="Chart view">
          <button role="tab" aria-selected={mode === 'history'} onClick={() => setMode('history')}>
            TVL history
          </button>
          <button
            role="tab"
            aria-selected={mode === 'scenario'}
            onClick={() => setMode('scenario')}
          >
            Valuation scenarios
          </button>
        </div>
      )}
      {mode === 'history' && history ? (
        <TvlHistoryChart key={protocol.slug} protocol={protocol} history={history} />
      ) : (
        <ValuationChart key={protocol.slug} protocol={protocol} />
      )}
    </>
  );
}
