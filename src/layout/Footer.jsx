import React from 'react';

export function Footer({ onMethodology, onExplore, onSaved }) {
  const wordmarkRef = React.useRef(null);

  return (
    <footer
      className="footer-landscape"
      aria-label="Footer"
      onPointerMove={(event) => {
        const wordmark = wordmarkRef.current;
        if (!wordmark) return;
        const bounds = wordmark.getBoundingClientRect();
        wordmark.style.setProperty('--pointer-x', `${event.clientX - bounds.left}px`);
        wordmark.style.setProperty('--pointer-y', `${event.clientY - bounds.top}px`);
      }}
    >
      <div className="footer-panel">
        <div className="footer-top">
          <div className="footer-about">
            <p>
              A little perspective,
              <br />
              before the next launch.
            </p>
            <span>
              Independent research from a fixed DefiLlama snapshot. Implied values are model
              estimates, not token prices or a promise of rewards.
            </span>
          </div>
          <div className="footer-links">
            <div>
              <span>Radar</span>
              <button onClick={onExplore}>Explore protocols</button>
              <button onClick={onSaved}>Saved protocols</button>
            </div>
            <div>
              <span>Research</span>
              <button onClick={onMethodology}>Our methodology</button>
              <button onClick={onMethodology}>Data & assumptions</button>
            </div>
          </div>
        </div>
        <div className="footer-wordmark" ref={wordmarkRef} aria-hidden="true">
          <img src="./radar.png" alt="" />
          <div className="footer-wordmark-reveal"><div /></div>
        </div>
        <div className="footer-bottom">
          <span>Token launch research, with context.</span>
          <span>© 2026 Radar</span>
        </div>
      </div>
    </footer>
  );
}
