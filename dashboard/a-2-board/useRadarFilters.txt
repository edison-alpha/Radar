import { useMemo, useState } from 'react';
// A shareable filtered view: #/?category=RWA&chain=Ethereum&q=vault
function initialFilters() {
  const query = window.location.hash.split('?')[1] ?? '';
  const params = new URLSearchParams(query);
  return {
    category: params.get('category') ?? '',
    chain: params.get('chain') ?? '',
    search: params.get('q') ?? '',
  };
}
export function useRadarFilters(data, saved) {
  const [initial] = useState(initialFilters);
  const [view, setView] = useState('all');
  const [search, setSearch] = useState(initial.search);
  const [category, setCategory] = useState(initial.category);
  const [chain, setChain] = useState(initial.chain);
  const rows = useMemo(
    () =>
      data.rows.filter((p) => {
        if (view === 'watchlist' && !p.watchlist) return false;
        if (view === 'early' && p.watchlist) return false;
        return (
          (!category || p.category === category) &&
          (!chain || p.chains.includes(chain)) &&
          (!search.trim() ||
            `${p.name} ${p.slug} ${p.category ?? ''} ${p.chains.join(' ')}`
              .toLowerCase()
              .includes(search.trim().toLowerCase()))
        );
      }),
    [data, view, search, category, chain],
  );
  function reset() {
    setSearch('');
    setCategory('');
    setChain('');
  }
  function changeView(value) {
    setView(value);
    reset();
  }
  return {
    view,
    search,
    category,
    chain,
    rows,
    reset,
    changeView,
    setSearch,
    setCategory,
    setChain,
    filtered: Boolean(search || category || chain),
    counts: {
      all: data.rows.length,
      watchlist: data.watchlist_count,
      early: data.rows.length - data.watchlist_count,
      saved: data.rows.filter((p) => saved.has(p.slug)).length,
    },
  };
}
