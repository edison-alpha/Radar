import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Icon } from '../../shared/Icon';
import { ProtocolMark } from './ProtocolMark';
import { money } from '../../shared/format';

// Where the suggested protocols sit on the radar scope, in percent of its box.
const SPOTS = [
  [50, 16],
  [80, 34],
  [74, 72],
  [42, 84],
  [17, 62],
  [24, 28],
];

/**
 * "Not found" as a live radar scope: the sweep turns, and real ranked protocols appear as
 * blips you can open. Used when a protocol address matches nothing in the snapshot.
 */
export function OffRadar({ title, description, suggestions, onSelect, onBack, onSearch }) {
  const reduce = useReducedMotion();
  return (
    <div className="offradar">
      <div className="scope" aria-hidden={suggestions.length ? undefined : true}>
        <span className="scope-ring r1" />
        <span className="scope-ring r2" />
        <span className="scope-ring r3" />
        <span className="scope-cross" />
        <span className="scope-sweep" />
        <span className="scope-core" />
        {suggestions.slice(0, SPOTS.length).map((p, index) => (
          <motion.button
            key={p.slug}
            className="scope-blip"
            style={{ left: `${SPOTS[index][0]}%`, top: `${SPOTS[index][1]}%` }}
            initial={{ opacity: 0, scale: reduce ? 1 : 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25 + index * 0.12, type: 'spring', stiffness: 320, damping: 18 }}
            whileHover={reduce ? undefined : { scale: 1.18 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => onSelect(p)}
            aria-label={`Open ${p.name}, rank ${p.rank}`}
          >
            <ProtocolMark name={p.name} slug={p.slug} />
            <span className="scope-label">
              <strong>{p.name}</strong>
              <small>
                #{p.rank} · {money(p.implied_value_usd)}
              </small>
            </span>
          </motion.button>
        ))}
      </div>
      <motion.div
        className="offradar-copy"
        initial={{ opacity: 0, y: reduce ? 0 : 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1>{title}</h1>
        <p>{description}</p>
        <div className="offradar-actions">
          <button className="button button-primary" onClick={onBack}>
            <Icon name="list" size={16} /> Back to the board
          </button>
          {onSearch && (
            <button className="button button-secondary" onClick={onSearch}>
              <Icon name="search" size={16} /> Search protocols
            </button>
          )}
        </div>
        {suggestions.length > 0 && (
          <span className="offradar-hint">Or pick one of the protocols on the scope.</span>
        )}
      </motion.div>
    </div>
  );
}
