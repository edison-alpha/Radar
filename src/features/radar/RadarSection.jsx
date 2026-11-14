import React from 'react';
import { SectionHeading } from '../../components/ui/SectionHeading';
import { RadarFilters } from './RadarFilters';
import { ProtocolTable } from './ProtocolTable';
import { ResearchSidebar } from './ResearchSidebar';
import { downloadCsv } from '../../shared/format';
export function RadarSection({ data, filters, saved, onToggleSave, onSelect, onMethodology }) {
  return (
    <section id="protocols" className="radar-section">
      <SectionHeading
        title={'The launch radar'}
        description="Compare estimated launch values, uncertainty, and farming costs."
      >
        <span className="section-meta">{data.rows.length} protocols. One clearer picture.</span>
      </SectionHeading>
      <div className="radar-layout">
        <div className="board-main">
          <RadarFilters
            view={filters.view}
            onView={filters.changeView}
            counts={filters.counts}
            search={filters.search}
            onSearch={filters.setSearch}
            category={filters.category}
            onCategory={filters.setCategory}
            chain={filters.chain}
            onChain={filters.setChain}
            data={data}
            onExport={() => downloadCsv(filters.rows)}
            reset={filters.reset}
            filtered={filters.filtered}
          />
          <ProtocolTable
            rows={filters.rows}
            saved={saved}
            onToggleSave={onToggleSave}
            onSelect={onSelect}
            onReset={() => {
              filters.reset();
            }}
          />
          <div className="board-footnote">
            <span>P25–P75 reflects the middle half of comparable-token residuals. Fees and per-$1k allocations are illustrative estimates.</span>
            <button onClick={onMethodology}>Methodology & assumptions</button>
          </div>
        </div>
        <ResearchSidebar data={data} onSelect={onSelect} onMethodology={onMethodology} />
      </div>
    </section>
  );
}
