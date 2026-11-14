import React from 'react';
import { motion } from 'motion/react';
import { Icon } from '../../shared/Icon';
import { Button } from '../../shared/ui';
import { Dropdown } from '../../components/ui/Dropdown';
export function RadarFilters({
  view,
  onView,
  counts,
  search,
  onSearch,
  category,
  onCategory,
  chain,
  onChain,
  data,
  onExport,
  reset,
  filtered,
}) {
  const tabs = [
    { id: 'all', label: 'All protocols', icon: 'list', count: counts.all },
    { id: 'watchlist', label: 'Watchlist', icon: 'eye', count: counts.watchlist },
    { id: 'early', label: 'Early discoveries', icon: 'sparkle', count: counts.early },
  ];
  return (
    <>
      <div className="board-tabs" role="tablist" aria-label="Protocol groups">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={view === tab.id}
            onClick={() => onView(tab.id)}
          >
            <Icon name={tab.icon} size={16} />
            {tab.label}
            <span>{tab.count}</span>
            {view === tab.id && (
              <motion.div
                className="tab-indicator"
                layoutId="board-tab"
                transition={{ type: 'spring', stiffness: 450, damping: 40 }}
              />
            )}
          </button>
        ))}
      </div>
      <div className="filter-bar">
        <label className="search-field">
          <Icon name="search" />
          <input
            aria-label="Search protocols"
            placeholder="Search protocols…"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
          />
          {search && (
            <button className="clear-search" onClick={() => onSearch('')} aria-label="Clear search">
              <Icon name="close" size={14} />
            </button>
          )}
        </label>
        <Dropdown
          label="Filter by category"
          value={category}
          onChange={onCategory}
          options={[
            { value: '', label: 'All categories' },
            ...data.categories.map((c) => ({ value: c, label: c })),
          ]}
        />
        <Dropdown
          label="Filter by chain"
          value={chain}
          onChange={onChain}
          options={[
            { value: '', label: 'All chains' },
            ...data.chains.map((c) => ({ value: c, label: c, chain: c })),
          ]}
        />
        <Button className="export-button" icon="download" onClick={onExport}>
          Export
        </Button>
      </div>
      {filtered && (
        <div className="active-filters">
          <span>
            <Icon name="filter" size={14} />
            Filters applied
          </span>
          <button onClick={reset}>
            Clear filters <Icon name="close" size={12} />
          </button>
        </div>
      )}
    </>
  );
}
