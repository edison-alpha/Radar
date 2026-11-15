import React, { useState } from 'react';
import logos from '../../data/protocol-logos.json';
import atlas from '../../data/reference-logos.json';

export function ProtocolMark({ name, slug, size = 'normal' }) {
  const [failedSource, setFailedSource] = useState(null);
  const source = logos[slug] ? `./protocol-logos/${logos[slug]}` : null;
  if (source && source !== failedSource) {
    return (
      <span className={`protocol-mark protocol-mark-image mark-${size}`} aria-hidden="true">
        <img
          src={source}
          alt=""
          width="96"
          height="96"
          loading="lazy"
          decoding="async"
          onError={() => setFailedSource(source)}
        />
      </span>
    );
  }
  // Protocols the board does not rank (tokens on record, set-aside products) share one sprite atlas.
  const tile = atlas.slugs[slug];
  if (tile !== undefined) {
    const col = tile % atlas.cols;
    const row = Math.floor(tile / atlas.cols);
    return (
      <span
        className={`protocol-mark protocol-mark-image protocol-mark-atlas mark-${size}`}
        aria-hidden="true"
        style={{
          backgroundImage: `url(./protocol-logos/${atlas.file})`,
          backgroundSize: `${atlas.cols * 100}% ${atlas.rows * 100}%`,
          backgroundPosition: `${(col / (atlas.cols - 1)) * 100}% ${(row / (atlas.rows - 1)) * 100}%`,
        }}
      />
    );
  }
  const initials = name
    .split(/[\s-]+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join('');
  const tone = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 5;
  return (
    <span className={`protocol-mark mark-${tone} mark-${size}`} aria-hidden="true">
      {initials}
    </span>
  );
}
