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
          <div className="model-summary">
            <div><strong>How values are estimated</strong><span>{data.curve.comparables} token-recorded comparisons · TVL, category, 7-day change and time tracked</span></div>
            <button onClick={onMethodology}>View methodology</button>
          </div>
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
            minTvl={filters.minTvl}
            onMinTvl={filters.setMinTvl}
            maxFee={filters.maxFee}
            onMaxFee={filters.setMaxFee}
            tier={filters.tier}
            onTier={filters.setTier}
            data={data}
            onExport={() => downloadCsv(filters.rows, data.as_of)}
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
            <span>Each bar shows the estimate within its own P25–P75 range on a log scale; bars do not share a dollar scale. Fees and per-$1k allocations are illustrative estimates.</span>
            <button onClick={onMethodology}>Methodology & assumptions</button>
          </div>
        </div>
        <ResearchSidebar data={data} onSelect={onSelect} onMethodology={onMethodology} />
      </div>
    </section>
  );
}
