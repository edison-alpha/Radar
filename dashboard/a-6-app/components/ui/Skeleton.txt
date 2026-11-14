import React, { useEffect, useState } from 'react';
import { useReducedMotion } from 'motion/react';

/** A shimmering placeholder block. Size it with className or style. */
export function Skeleton({ className = '', style }) {
  return <span className={`skeleton ${className}`} style={style} aria-hidden="true" />;
}

/**
 * True once `delay` ms have passed since mount. Used to show a skeleton briefly while a heavy view
 * settles. Skipped entirely when the user prefers reduced motion.
 */
export function useReveal(delay = 350) {
  const reduce = useReducedMotion();
  const [ready, setReady] = useState(Boolean(reduce) || delay <= 0);
  useEffect(() => {
    if (ready) return undefined;
    const timer = setTimeout(() => setReady(true), delay);
    return () => clearTimeout(timer);
  }, [ready, delay]);
  return ready;
}

export function MonitorSkeleton() {
  return (
    <div className="monitor-skeleton" role="status" aria-label="Loading the radar">
      <Skeleton className="sk-title" />
      <Skeleton className="sk-sub" />
      <div className="monitor-cards">
        {[0, 1, 2].map((i) => (
          <div key={i} className="monitor-card sk-card">
            <Skeleton className="sk-line sk-w40" />
            {[0, 1, 2, 3].map((j) => (
              <Skeleton key={j} className="sk-line" />
            ))}
          </div>
        ))}
      </div>
      <Skeleton className="sk-tabs" />
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="sk-row">
          <Skeleton className="sk-circle" />
          <Skeleton className="sk-line sk-w30" />
          <Skeleton className="sk-line sk-w15" />
          <Skeleton className="sk-line sk-w15" />
          <Skeleton className="sk-line sk-w15" />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="chart-skeleton" role="status" aria-label="Loading the chart">
      <Skeleton className="sk-line sk-w20" />
      <Skeleton className="sk-big" />
      <Skeleton className="sk-chart" />
    </div>
  );
}
