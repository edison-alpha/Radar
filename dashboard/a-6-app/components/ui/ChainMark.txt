import React from 'react';
import sprite from '../../data/chain-logos.json';

/** A chain's real logo, cut from the local sprite; initials when the chain has no logo on file. */
export function ChainMark({ chain, size = 16 }) {
  const position = sprite.index[chain];
  if (position == null) {
    return (
      <span
        className="chain-mark chain-mark-text"
        style={{ width: size, height: size, fontSize: size * 0.5 }}
        aria-hidden="true"
      >
        {String(chain ?? '?').slice(0, 1)}
      </span>
    );
  }
  const column = position % sprite.columns;
  const row = Math.floor(position / sprite.columns);
  const rows = Math.ceil(sprite.count / sprite.columns);
  return (
    <span
      className="chain-mark"
      style={{
        width: size,
        height: size,
        backgroundSize: `${sprite.columns * size}px ${rows * size}px`,
        backgroundPosition: `-${column * size}px -${row * size}px`,
      }}
      aria-hidden="true"
    />
  );
}
