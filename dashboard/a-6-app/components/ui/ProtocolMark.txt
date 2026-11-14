import React, { useState } from 'react';
import logos from '../../data/protocol-logos.json';

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
