import React, { useEffect, useId, useRef, useState } from 'react';
import { Icon } from '../../shared/Icon';
import { ChainMark } from './ChainMark';

/**
 * Rounded custom dropdown (listbox). Options: [{ value, label }].
 */
export function Dropdown({ label, value, options, onChange, className = '', align = 'left', defaultValue }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef(null);
  const id = useId();
  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => String(o.value) === String(value)),
  );
  const selected = options[selectedIndex];
  // A filter is active once it leaves its default (the empty "all" option unless told otherwise).
  const filtered = String(value) !== String(defaultValue ?? '');

  useEffect(() => {
    if (!open) return;
    const close = (event) => {
      if (!root.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);

  function toggle() {
    setActive(selectedIndex);
    setOpen((v) => !v);
  }
  function choose(option) {
    onChange(option.value);
    setOpen(false);
  }
  function onKeyDown(event) {
    if (event.key === 'Escape') setOpen(false);
    else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) return toggle();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActive((i) => (i + step + options.length) % options.length);
    } else if ((event.key === 'Enter' || event.key === ' ') && open) {
      event.preventDefault();
      choose(options[active]);
    }
  }

  return (
    <div className={`dropdown ${className}`} ref={root} onKeyDown={onKeyDown}>
      <button
        type="button"
        className={`dropdown-trigger${filtered ? ' is-filtered' : ''}`}
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        onClick={toggle}
      >
        <span>
          {selected?.chain && <ChainMark chain={selected.chain} size={18} />}
          {selected?.label}
        </span>
        <Icon name="down" size={14} className={open ? 'rotate-180' : ''} />
      </button>
      {open && (
        <ul
          id={`${id}-list`}
          className={`dropdown-menu align-${align}`}
          role="listbox"
          aria-label={label}
        >
          {options.map((option, index) => {
            const isSelected = index === selectedIndex;
            return (
              <li
                key={option.value}
                role="option"
                aria-selected={isSelected}
                className={index === active ? 'is-active' : ''}
                onMouseEnter={() => setActive(index)}
                onClick={() => choose(option)}
              >
                <span>
                  {option.chain && <ChainMark chain={option.chain} size={18} />}
                  {option.label}
                </span>
                {isSelected && <Icon name="check" size={14} />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
