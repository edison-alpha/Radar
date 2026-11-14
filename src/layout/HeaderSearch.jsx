import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Icon } from '../shared/Icon';
import { ProtocolMark } from '../components/ui/ProtocolMark';
import { money } from '../shared/format';

/** True while the window is at most `px` wide, so the closed pill can shrink to an icon. */
function useNarrow(px) {
  const query = `(max-width: ${px}px)`;
  const [narrow, setNarrow] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setNarrow(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [query]);
  return narrow;
}

const MAX_RESULTS = 6;
const CLOSED = 196;
const OPEN = 580;

/**
 * Header search that grows in place: a small pill that expands into a field with a panel of
 * categories and recently viewed protocols underneath, then folds back. No overlay, no modal.
 */
export function HeaderSearch({
  open,
  onOpenChange,
  rows,
  categories,
  recent,
  onClearRecent,
  onSelect,
  onCategory,
}) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const input = useRef(null);
  const root = useRef(null);
  const reduce = useReducedMotion();
  const narrow = useNarrow(720);
  const closedWidth = narrow ? 40 : CLOSED;
  const openWidth = narrow ? Math.min(OPEN, window.innerWidth - 32) : OPEN;

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return rows
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.category ?? '').toLowerCase().includes(q) ||
          p.chains.some((c) => c.toLowerCase().includes(q)),
      )
      .sort(
        (a, b) =>
          (a.name.toLowerCase().startsWith(q) ? 0 : 1) -
            (b.name.toLowerCase().startsWith(q) ? 0 : 1) || a.rank - b.rank,
      )
      .slice(0, MAX_RESULTS);
  }, [query, rows]);

  const viewed = useMemo(
    () => recent.map((slug) => rows.find((r) => r.slug === slug)).filter(Boolean),
    [recent, rows],
  );
  const cards = viewed.length ? viewed : rows.slice(0, 6);

  useLayoutEffect(() => {
    if (open) {
      input.current?.focus();
      return undefined;
    }
    const timer = setTimeout(() => {
      setQuery('');
      setActive(0);
    }, 320);
    return () => clearTimeout(timer);
  }, [open]);
  useEffect(() => setActive(0), [query]);

  useEffect(() => {
    if (!open) return undefined;
    const outside = (event) => {
      if (!root.current?.contains(event.target)) onOpenChange(false);
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open, onOpenChange]);

  function choose(protocol) {
    if (!protocol) return;
    onOpenChange(false);
    onSelect(protocol);
  }
  function onKeyDown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      onOpenChange(false);
    } else if (event.key === 'ArrowDown' && results.length) {
      event.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (event.key === 'ArrowUp' && results.length) {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (event.key === 'Enter' && results[active]) {
      event.preventDefault();
      choose(results[active]);
    }
  }

  const spring = reduce
    ? { duration: 0 }
    : { type: 'spring', stiffness: 460, damping: 44, mass: 0.9 };
  const fade = reduce ? { duration: 0 } : { duration: 0.18, ease: 'easeOut' };
  return (
    <div className="hs-slot" ref={root}>
      <motion.div
        className={`hs-box${open ? ' is-open' : ''}`}
        initial={false}
        animate={{ width: open ? openWidth : closedWidth, borderRadius: open ? 24 : 20 }}
        transition={spring}
        style={{ x: narrow && open ? '0%' : '-50%' }}
        onKeyDown={onKeyDown}
      >
        <div className="hs-bar">
          <button
            type="button"
            className="hs-icon"
            onClick={() => onOpenChange(true)}
            aria-label="Search protocols"
            tabIndex={open ? -1 : 0}
          >
            <Icon name="search" size={18} />
          </button>
          <div className="hs-field">
            <motion.button
              type="button"
              className="hs-label"
              onClick={() => onOpenChange(true)}
              animate={{ opacity: open ? 0 : 1 }}
              transition={fade}
              style={{ pointerEvents: open ? 'none' : 'auto' }}
              tabIndex={open ? -1 : 0}
              aria-hidden={open}
            >
              <span>Search</span>
              <kbd>/</kbd>
            </motion.button>
            <motion.input
              ref={input}
              className="hs-input"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search protocols, categories or chains"
              aria-label="Search protocols"
              role="combobox"
              aria-expanded={open}
              aria-controls="hs-results"
              aria-activedescendant={results[active] ? `hs-opt-${active}` : undefined}
              animate={{ opacity: open ? 1 : 0 }}
              transition={fade}
              style={{ pointerEvents: open ? 'auto' : 'none' }}
              tabIndex={open ? 0 : -1}
            />
          </div>
          <motion.button
            type="button"
            className="hs-close"
            animate={{ opacity: open ? 1 : 0, scale: open ? 1 : 0.6 }}
            transition={fade}
            style={{ pointerEvents: open ? 'auto' : 'none' }}
            tabIndex={open ? 0 : -1}
            onClick={() => (query ? setQuery('') : onOpenChange(false))}
            aria-label={query ? 'Clear search' : 'Close search'}
          >
            <Icon name="close" size={16} />
          </motion.button>
        </div>

        <motion.div
          className="hs-panel"
          initial={false}
          animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
          transition={{ height: spring, opacity: fade }}
          style={{ pointerEvents: open ? 'auto' : 'none' }}
          aria-hidden={!open}
        >
          <div className="hs-panel-inner">
            {query.trim() ? (
              results.length ? (
                <ul id="hs-results" className="hs-results" role="listbox">
                  {results.map((p, index) => (
                    <li
                      key={p.slug}
                      id={`hs-opt-${index}`}
                      role="option"
                      aria-selected={index === active}
                      className={index === active ? 'is-active' : ''}
                      onMouseEnter={() => setActive(index)}
                      onClick={() => choose(p)}
                    >
                      <ProtocolMark name={p.name} slug={p.slug} size="small" />
                      <span className="hs-name">
                        <strong>{p.name}</strong>
                        <small>
                          {p.category ?? 'Uncategorised'} · {p.chains.slice(0, 2).join(', ')}
                        </small>
                      </span>
                      <span className="hs-value">
                        {money(p.tvl_usd, 2)}
                        <small>TVL</small>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="hs-empty">No protocol matches “{query}”.</p>
              )
            ) : (
              <>
                <section>
                  <h3>Categories</h3>
                  <div className="hs-chips">
                    {categories.slice(0, 14).map((c) => (
                      <button
                        key={c.name}
                        onClick={() => {
                          onOpenChange(false);
                          onCategory(c.name);
                        }}
                      >
                        {c.name} <span>{c.count}</span>
                      </button>
                    ))}
                  </div>
                </section>
                <section>
                  <div className="hs-heading">
                    <h3>{viewed.length ? 'Recently viewed' : 'Top ranked'}</h3>
                    {viewed.length > 0 && <button onClick={onClearRecent}>Clear</button>}
                  </div>
                  <div className="hs-cards">
                    {cards.map((p) => (
                      <button key={p.slug} className="hs-card" onClick={() => choose(p)}>
                        <span className="hs-card-art">
                          <ProtocolMark name={p.name} slug={p.slug} size="large" />
                        </span>
                        <strong>{p.name}</strong>
                        <small>
                          #{p.rank} · {money(p.implied_value_usd)}
                        </small>
                      </button>
                    ))}
                  </div>
                </section>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
