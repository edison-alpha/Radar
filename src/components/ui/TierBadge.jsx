import React from 'react';
import { Icon } from '../../shared/Icon';

const tiers = {
  Watchlist: { icon: 'eye', className: 'watchlist', description: 'On the snapshot watchlist' },
  'Above floor': { icon: 'trending', className: 'above', description: 'Outside the watchlist, at or above the snapshot TVL floor' },
  'Below floor': { icon: 'trendDown', className: 'below', description: 'Outside the watchlist, below the snapshot TVL floor' },
};

export function TierBadge({ tier }) {
  const details = tiers[tier];
  if (!details) return <span className="tier-badge">{tier || 'Unknown'}</span>;
  return (
    <span className={`tier-badge tier-badge--${details.className}`} title={details.description}>
      <Icon name={details.icon} size={13} />
      {tier}
    </span>
  );
}
