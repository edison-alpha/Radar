import React, { useEffect, useState } from 'react';
import { ProtocolMark, EmptyState, Button } from '../../shared/ui';
import { money } from '../../shared/format';

const PAGE = 25;
const CONFIDENCE = {
  verified: 'verified by id',
  name: 'ticker and name match',
  ticker: 'ticker match only, unverified',
};

/**
 * The two tabs that explain what the board leaves out: tokens that already trade (they price the
 * curve, so they are never ranked) and protocols set aside as wrapped, staked, bridged, exchange or
 * versioned products. Every row is read from the same snapshot as the ranked board.
 */
export function ReferenceTable({ kind, rows, onReset, onSelect }) {
  const [shown, setShown] = useState(PAGE);
  useEffect(() => setShown(PAGE), [kind, rows]);
  const traded = kind === 'traded';
  return (
    <div className="protocol-table-panel reference-panel">
      <p className="reference-note">
        {traded
          ? 'Tokens the snapshot records already trade, so they are never ranked: they are the comparables the launch curve is fitted on. “Curve says” is what the curve alone would price each one at, and the miss is how far off that is.'
          : 'Wrapped, staked, bridged, exchange and versioned products of other protocols are set aside by the house rule. They are not pre-token launches, so the board does not rank them.'}
      </p>
      <div className="table-scroll">
        <table className="protocol-table reference-table">
          <caption className="sr-only">
            {traded ? 'Protocols with a token on record' : 'Protocols set aside from the board'}
          </caption>
          <thead>
            <tr>
              <th scope="col">Protocol</th>
              <th scope="col">Category</th>
              <th scope="col" className="num">
                TVL
              </th>
              {traded ? (
                <>
                  <th scope="col" className="num">
                    Market cap
                  </th>
                  <th scope="col" className="num">
                    Mcap / TVL
                  </th>
                  <th scope="col" className="num">
                    Curve says
                  </th>
                  <th scope="col" className="num">
                    Miss
                  </th>
                </>
              ) : (
                <th scope="col">Why set aside</th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, shown).map((p) => (
              <tr
                key={p.slug}
                className={onSelect ? 'is-clickable' : undefined}
                onClick={onSelect ? () => onSelect(kind, p) : undefined}
              >
                <td>
                  <button
                    type="button"
                    className="protocol-cell static"
                    disabled={!onSelect}
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelect?.(kind, p);
                    }}
                    aria-label={`View ${p.name} details`}
                  >
                    <ProtocolMark name={p.name} slug={p.slug} />
                    <span>
                      <strong>{p.name}</strong>
                      <small>
                        {p.symbol ? `${p.symbol} · ` : ''}
                        {p.chain ?? 'Chain unreported'}
                      </small>
                    </span>
                  </button>
                </td>
                <td className="muted">{p.category ?? 'Uncategorised'}</td>
                <td className="num">{money(p.tvl_usd, 2)}</td>
                {traded ? (
                  <>
                    <td className="num">
                      {p.mcap_usd > 0 ? (
                        money(p.mcap_usd, 2)
                      ) : p.mcap_ref ? (
                        <span
                          className="mcap-ref"
                          title={`CoinGecko, ${p.mcap_ref.token}, ${CONFIDENCE[p.mcap_ref.confidence]}, ${p.mcap_ref.as_of}. Not in the snapshot; not used by the model.`}
                        >
                          {money(p.mcap_ref.mcap_usd, 2)}
                          <sup>{p.mcap_ref.confidence === 'ticker' ? '?' : '*'}</sup>
                        </span>
                      ) : (
                        'No market cap'
                      )}
                    </td>
                    <td className="num">{p.ratio == null ? '–' : `${p.ratio.toFixed(2)}×`}</td>
                    <td className="num">{p.model_usd == null ? '–' : money(p.model_usd, 2)}</td>
                    <td className="num">{p.miss == null ? '–' : `×${p.miss.toFixed(1)}`}</td>
                  </>
                ) : (
                  <td>
                    <span className="reason-chip">{p.reason}</span>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length && <EmptyState action={<Button onClick={onReset}>Clear filters</Button>} />}
      <div className="table-pagination">
        <span>
          {Math.min(shown, rows.length)} <span className="muted">of {rows.length} protocols</span>
        </span>
        {shown < rows.length && (
          <Button onClick={() => setShown((n) => n + PAGE)}>Show {PAGE} more</Button>
        )}
      </div>
    </div>
  );
}
