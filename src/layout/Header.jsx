import React from 'react';
import { Icon } from '../shared/Icon';
import { Button } from '../shared/ui';
import { HeaderSearch } from './HeaderSearch';
export function Header({ view, onView, savedCount, onMethodology, search }) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <a
          href="#"
          className="wordmark"
          aria-label="Radar home"
          onClick={(e) => {
            e.preventDefault();
            onView('all');
            window.scrollTo({ top: 0, behavior: 'instant' });
          }}
        >
          <img src="./radar.png" alt="Radar" className="wordmark-logo" />
        </a>
        <nav className="primary-nav" aria-label="Main navigation">
          <button
            className={
              view && view !== 'saved' && view !== 'monitor' ? 'nav-item active' : 'nav-item'
            }
            onClick={() => onView('all')}
          >
            Explore
          </button>
          <button
            className={view === 'monitor' ? 'nav-item active' : 'nav-item'}
            onClick={() => onView('monitor')}
          >
            Radar
          </button>
          <button className="nav-item" onClick={onMethodology}>
            Methodology
          </button>
        </nav>
        <HeaderSearch {...search} />
        <button
          className={view === 'saved' ? 'header-saved is-active' : 'header-saved'}
          onClick={() => onView('saved')}
          aria-label={`Saved protocols (${savedCount})`}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path fill="currentColor" d="M4.75 6.6c0-1.88 0-2.82.58-3.4c.59-.6 1.53-.6 3.42-.6h6.5c1.89 0 2.83 0 3.42.6c.58.58.58 1.52.58 3.4v12.04c0 1.6 0 2.4-.51 2.69c-.52.28-1.2-.14-2.55-1l-2.06-1.29c-1.04-.65-1.55-.97-2.13-.97s-1.1.32-2.13.97l-2.06 1.3c-1.35.85-2.03 1.27-2.55.99c-.51-.29-.51-1.09-.51-2.69z" />
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.67 8.6c0-2.82 0-4.23.87-5.11c.88-.88 2.3-.88 5.13-.88h2.66c2.83 0 4.25 0 5.13.88s.87 2.29.87 5.12v8.43c0 2.65 0 3.98-.79 4.4l-.15.07c-.84.33-1.85-.52-3.87-2.23c-1.17-1-1.76-1.5-2.45-1.52h-.14c-.7.03-1.28.52-2.45 1.52c-2.02 1.7-3.03 2.56-3.87 2.23l-.15-.07c-.8-.42-.8-1.75-.8-4.4z" />
          </svg>
          <span className="header-saved-count">{savedCount}</span>
        </button>
        <Button className="header-guide" onClick={onMethodology} icon="info">
          How to read the radar
        </Button>
        <button
          className="icon-button mobile-guide"
          onClick={onMethodology}
          aria-label="Read methodology"
        >
          <Icon name="info" />
        </button>
      </div>
    </header>
  );
}
