import React, { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Icon } from '../../shared/Icon';

/**
 * A round search button that expands into a field when clicked. It stays open while it holds
 * text; Escape clears it, and it folds back once it is empty and loses focus.
 */
export function ExpandSearch({
  value,
  onChange,
  label = 'Search',
  placeholder = 'Search…',
  width = 260,
}) {
  const [open, setOpen] = useState(Boolean(value));
  const input = useRef(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);

  function collapseIfEmpty() {
    if (!value) setOpen(false);
  }

  return (
    <motion.div
      className={`expand-search${open ? ' is-open' : ''}`}
      initial={false}
      animate={{ width: open ? width : 40 }}
      transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 36 }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          onChange('');
          setOpen(false);
        }
      }}
    >
      <button
        type="button"
        className="expand-search-button"
        onClick={() => setOpen(true)}
        aria-label={label}
        aria-expanded={open}
        tabIndex={open ? -1 : 0}
      >
        <Icon name="search" size={17} />
      </button>
      <input
        ref={input}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={collapseIfEmpty}
        placeholder={placeholder}
        aria-label={label}
        tabIndex={open ? 0 : -1}
      />
      {value && (
        <button
          type="button"
          className="expand-search-clear"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            onChange('');
            input.current?.focus();
          }}
          aria-label="Clear search"
        >
          <Icon name="close" size={15} />
        </button>
      )}
    </motion.div>
  );
}
