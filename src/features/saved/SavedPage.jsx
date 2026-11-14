import React, { useMemo } from 'react';
import { ProtocolTable } from '../radar/ProtocolTable';

export function SavedPage({ data, saved, onToggleSave, onSelect, onBack }) {
  const rows = useMemo(() => data.rows.filter((p) => saved.has(p.slug)), [data.rows, saved]);
  return (
    <section className="page-shell saved-page" aria-labelledby="saved-title">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <a href="#" onClick={onBack}>
          Explore
        </a>
        <span aria-hidden="true">›</span>
        <strong>Saved</strong>
      </nav>
      <div className="section-heading">
        <div>
          <h1 id="saved-title" className="page-title">
            Your research list
          </h1>
          <p>
            {rows.length
              ? `${rows.length} saved ${rows.length === 1 ? 'protocol' : 'protocols'}, kept in this browser.`
              : 'Protocols you bookmark are collected here.'}
          </p>
        </div>
      </div>
      <ProtocolTable
        rows={rows}
        saved={saved}
        onToggleSave={onToggleSave}
        onSelect={onSelect}
        onReset={onBack}
        savedView
      />
    </section>
  );
}
