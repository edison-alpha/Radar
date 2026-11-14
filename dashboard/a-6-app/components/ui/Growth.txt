import React from 'react';
import { percent } from '../../shared/format';

export function Growth({ value }) {
  return (
    <span className={value == null ? 'muted' : value >= 0 ? 'positive' : 'negative'}>
      {percent(value)}
    </span>
  );
}
