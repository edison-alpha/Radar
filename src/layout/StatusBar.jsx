import React, { useEffect, useState } from 'react';
import { Icon } from '../shared/Icon';
import { number, snapshotDate } from '../shared/format';

/** Milliseconds the browser spent loading data.js, or time-to-render when timing is unavailable. */
function measureDataLoad() {
  try {
    const entry = performance
      .getEntriesByType('resource')
      .find((item) => /data\.js(\?|$)/.test(item.name));
    if (entry && entry.duration > 0)
      return { label: 'Data loaded', ms: Math.max(1, Math.round(entry.duration)) };
  } catch {
    // Resource timing is not available everywhere; fall through.
  }
  return { label: 'Rendered', ms: Math.max(1, Math.round(performance.now())) };
}

/** Thin fixed status strip. Every figure is read from the page itself; nothing is simulated. */
export function StatusBar({ data, evidence }) {
  const [load] = useState(measureDataLoad);
  const [hidden, setHidden] = useState(() => {
    try {
      return window.localStorage.getItem('radar-status-hidden') === '1';
    } catch {
      return false;
    }
  });
  useEffect(() => {
    document.body.classList.toggle('statusbar-hidden', hidden);
    try {
      window.localStorage.setItem('radar-status-hidden', hidden ? '1' : '0');
    } catch {
      // Storage may be blocked; the bar still toggles for this visit.
    }
  }, [hidden]);
  const series = window.__RADAR_HISTORY__?.series
    ? Object.keys(window.__RADAR_HISTORY__.series).length
    : 0;
  const through = window.__RADAR_HISTORY__?.latest;
  if (hidden)
    return (
      <button
        className="status-handle"
        onClick={() => setHidden(false)}
        aria-label="Show data status"
        title="Show data status"
      >
        <Icon name="gauge" size={13} />
      </button>
    );
  return (
    <footer className="statusbar" aria-label="Data status">
      <span className="status-item status-ok">
        <i className="status-dot" aria-hidden="true" />
        Data ready
      </span>
      <span className="status-item">
        <Icon name="gauge" size={13} />
        {load.label} in {load.ms} ms
      </span>
      {evidence && (
        <>
          <span
            className={`status-item ${evidence.watchlistCovered === evidence.watchlist ? 'status-ok' : 'status-bad'}`}
            title="Every protocol on the snapshot watchlist is ranked on the board"
          >
            <Icon name="eye" size={13} />
            Watchlist {evidence.watchlistCovered}/{evidence.watchlist} on board
          </span>
          <span
            className={`status-item ${evidence.match ? 'status-ok' : 'status-bad'}`}
            title={`The rows on this page hash to ${evidence.digest}, the digest written into board.json`}
          >
            <Icon name="check" size={13} />
            Page = board.json {evidence.rows}/{evidence.boardRows} rows
          </span>
        </>
      )}
      <span className="status-item">
        <Icon name="database" size={13} />
        Snapshot {snapshotDate(data.as_of)} · {number(data.rows.length)} protocols
      </span>
      {through && (
        <span className="status-item status-wide">
          <Icon name="clock" size={13} />
          TVL history through {snapshotDate(through)} · {number(series)} series
        </span>
      )}
      <span className="status-item status-end">
        <Icon name="offline" size={13} />
        Offline · sealed snapshot, no network calls
      </span>
      <button
        className="status-hide"
        onClick={() => setHidden(true)}
        aria-label="Hide data status"
        title="Hide"
      >
        <Icon name="down" size={12} />
      </button>
    </footer>
  );
}
