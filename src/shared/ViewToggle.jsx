import React from 'react';

export function ViewToggle({ view, onChange, className = '' }) {
  return (
    <div className={`view-toggle ${className}`} role="group" aria-label="View mode">
      <span className="view-toggle-label">View</span>
      {['comfortable', 'compact'].map((m) => (
        <button
          key={m}
          type="button"
          className={view === m ? 'active' : ''}
          aria-pressed={view === m}
          onClick={() => onChange(m)}
        >
          {m === 'compact' ? 'Compact' : 'Comfortable'}
        </button>
      ))}
    </div>
  );
}
