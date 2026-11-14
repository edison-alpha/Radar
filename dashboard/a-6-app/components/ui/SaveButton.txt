import React, { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Icon } from '../../shared/Icon';

const BURST = Array.from({ length: 8 }, (_, i) => i * 45);

/**
 * Bookmark icon with a like-button style response: it pops and bursts when saved, and
 * shrinks back when removed. Nothing animates on first render.
 */
export function AnimatedBookmark({ saved, size = 17 }) {
  const reduce = useReducedMotion();
  const [pulse, setPulse] = useState(0);
  const previous = useRef(saved);
  useEffect(() => {
    if (previous.current !== saved) {
      previous.current = saved;
      setPulse((n) => n + 1);
    }
  }, [saved]);

  const keyframes = reduce ? undefined : saved ? [0.5, 1.4, 0.9, 1] : [1.15, 0.75, 1];
  return (
    <span className="save-anim">
      <motion.span
        key={pulse}
        className="save-icon"
        initial={pulse ? { scale: 1 } : false}
        animate={pulse && keyframes ? { scale: keyframes } : undefined}
        transition={{ duration: saved ? 0.5 : 0.3, ease: 'easeOut' }}
      >
        <Icon name={saved ? 'bookmarkFill' : 'bookmark'} size={size} />
      </motion.span>
      {saved && pulse > 0 && !reduce && (
        <span className="save-burst" key={`burst-${pulse}`} aria-hidden="true">
          <b />
          {BURST.map((angle) => (
            <i key={angle} style={{ '--a': `${angle}deg` }} />
          ))}
        </span>
      )}
    </span>
  );
}

export function SaveButton({ saved, onClick, label, size = 17, className = '' }) {
  return (
    <button
      className={`icon-button save-button ${saved ? 'is-saved' : ''} ${className}`}
      aria-label={label}
      aria-pressed={saved}
      onClick={onClick}
    >
      <AnimatedBookmark saved={saved} size={size} />
    </button>
  );
}
