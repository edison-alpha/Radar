import React from 'react';

export function EmptyState({
  title = 'No protocols found',
  description = 'Try a different search or clear your filters.',
  action,
}) {
  return (
    <div className="empty-state">
      <span className="scope scope-mini" aria-hidden="true">
        <span className="scope-ring r1" />
        <span className="scope-ring r2" />
        <span className="scope-sweep" />
        <span className="scope-core" />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
