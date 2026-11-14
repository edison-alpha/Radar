import React from 'react';
import { money } from '../../shared/format';

export function ValuationRange({ value, low, high }) {
  const valid = low > 0 && high > low && value > 0;
  const position = valid ? Math.max(0, Math.min(100, 100 * (Math.log(value) - Math.log(low)) / (Math.log(high) - Math.log(low)))) : 50;
  return (
    <span className="implied-cell">
      <strong>{money(value, 2)}</strong>
      <small>{money(low)}–{money(high)}</small>
      {valid && <span className="valuation-range" aria-hidden="true"><i style={{ left: `${position}%` }} /></span>}
    </span>
  );
}
