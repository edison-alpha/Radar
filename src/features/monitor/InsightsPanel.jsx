import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Icon } from '../../shared/Icon';
import { ProtocolMark } from '../../shared/ui';
import { ageLabel, money, percent } from '../../shared/format';
import { formatDay } from '../../shared/history';

/** Compact side panel: a rotating overview, then a timeline of the biggest recent TVL moves. */
export function InsightsPanel({ monitor, saved, onSelect, onMethodology }) {
  const [tab, setTab] = useState('insights');
  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduceMotion = useReducedMotion();
  const m = monitor;

  const slides = useMemo(() => {
    const list = [];
    if (m.aggregate) {
      const up = m.aggregate.change >= 0;
      list.push({
        title: `Combined TVL ${up ? 'rose' : 'fell'} ${Math.abs(m.aggregate.change).toFixed(1)}% in 90 days`,
        text: `The ${m.rows.length} ranked protocols hold ${money(m.aggregate.total, 2)} of TVL. The median protocol moved ${percent(m.median30)} over the last 30 days.`,
      });
    }
    if (m.gainers[0]) {
      const g = m.gainers[0];
      list.push({
        title: `${g.name} leads 7-day growth at ${percent(g.change_7d)}`,
        text: `${g.category ?? 'Uncategorised'} protocol with ${money(g.tvl_usd, 2)} of TVL and an implied launch value of ${money(g.implied_value_usd, 2)}.`,
        slug: g.slug,
      });
    }
    const c = m.topCategories[0];
    if (c) {
      list.push({
        title: `${c.name} leads by TVL`,
        text: `${c.count} protocols hold ${money(c.tvl, 2)} together. Newest tracked: ${m.newest?.name ?? 'n/a'}${m.newest ? `, listed ${ageLabel(m.newest.age_days)} ago` : ''}.`,
      });
    }
    return list;
  }, [m]);

  const current = slides[slide % Math.max(1, slides.length)];
  const savedRows = m.rows.filter((r) => saved.has(r.slug));
  const step = (dir) => setSlide((i) => (i + dir + slides.length) % slides.length);

  // Rotate through the overview on its own; hover or keyboard focus pauses it.
  useEffect(() => {
    if (slides.length < 2 || paused || reduceMotion || tab !== 'insights') return undefined;
    const timer = setInterval(() => setSlide((i) => (i + 1) % slides.length), 6000);
    return () => clearInterval(timer);
  }, [slides.length, paused, reduceMotion, tab, slide]);

  return (
    <div className="ins">
      <div className="ins-head">
        <div className="ins-tabs" role="tablist" aria-label="Panel">
          <button role="tab" aria-selected={tab === 'insights'} onClick={() => setTab('insights')}>
            Insights
          </button>
          <button role="tab" aria-selected={tab === 'saved'} onClick={() => setTab('saved')}>
            Saved <span>{savedRows.length}</span>
          </button>
        </div>
        <Icon name="lightbulb" size={16} />
      </div>

      {tab === 'insights' ? (
        <>
          <section
            className="ins-section"
            aria-label="Overview"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
          >
            <div className="ins-label">
              <span>Radar overview</span>
              <i aria-hidden="true" />
              {slides.length > 1 && (
                <span className="ins-arrows">
                  <button onClick={() => step(-1)} aria-label="Previous insight">
                    <Icon name="chevron" size={12} className="rotate-180" />
                  </button>
                  <button onClick={() => step(1)} aria-label="Next insight">
                    <Icon name="chevron" size={12} />
                  </button>
                </span>
              )}
            </div>
            <div className="ins-slide" aria-live="off">
              <AnimatePresence mode="wait" initial={false}>
                {current && (
                  <motion.div
                    key={slide % slides.length}
                    initial={{ opacity: 0, y: reduceMotion ? 0 : 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: reduceMotion ? 0 : -6 }}
                    transition={{ duration: 0.22 }}
                  >
                    <h3>
                      {current.slug ? (
                        <button
                          onClick={() => onSelect(m.rows.find((r) => r.slug === current.slug))}
                        >
                          {current.title}
                        </button>
                      ) : (
                        current.title
                      )}
                    </h3>
                    <p>{current.text}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="ins-foot">
              <span>Computed from the data, not news</span>
              <span className="ins-dots" aria-hidden="true">
                {slides.map((_, i) => (
                  <b key={i} className={i === slide % slides.length ? 'is-on' : ''} />
                ))}
              </span>
            </div>
            <button className="ins-cta" onClick={onMethodology}>
              How it is calculated
            </button>
          </section>

          <section className="ins-section" aria-label="Latest TVL moves">
            <div className="ins-label">
              <span>Latest TVL moves</span>
              <i aria-hidden="true" />
            </div>
            <ol className="ins-timeline">
              {m.recentEvents.map((e) => (
                <li key={e.slug}>
                  <time>{formatDay(e.x)}</time>
                  <button onClick={() => onSelect(m.rows.find((r) => r.slug === e.slug))}>
                    {e.name} TVL {e.change >= 0 ? 'jumped' : 'dropped'}{' '}
                    {Math.abs(e.change).toFixed(0)}% in two days to {money(e.value, 2)}
                  </button>
                  <span className="ins-chip">
                    <ProtocolMark name={e.name} slug={e.slug} size="small" />
                    {e.category ?? 'Uncategorised'}
                  </span>
                </li>
              ))}
              {!m.recentEvents.length && (
                <li className="muted">No large moves in the last 30 days.</li>
              )}
            </ol>
          </section>
        </>
      ) : (
        <section className="ins-section" aria-label="Saved protocols">
          {savedRows.length ? (
            <ul className="ins-saved">
              {savedRows.map((r) => (
                <li key={r.slug}>
                  <button onClick={() => onSelect(r)}>
                    <ProtocolMark name={r.name} slug={r.slug} size="small" />
                    <span className="ins-saved-name">{r.name}</span>
                    <b>{money(r.tvl_usd, 2)}</b>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="ins-empty">Bookmark a protocol to keep it here.</p>
          )}
        </section>
      )}
    </div>
  );
}
