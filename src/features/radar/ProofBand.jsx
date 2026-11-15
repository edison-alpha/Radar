import React from 'react';
import { BacktestChart } from '../../components/charts/BacktestChart';

const pct = (n) => Math.round(n * 100) + '%';

/**
 * The evidence, up front: the formula, how it did on tokens it never saw, and the out-of-sample
 * scatter. Every number comes from the same backtest the Methodology page shows.
 */
export function ProofBand({ data, onMethodology }) {
  const { curve, model, backtest } = data;
  if (!backtest) return null;
  const loo = backtest.leave_one_out;
  const split = backtest.time_split;
  const rows = [
    ['Median miss, leave one out', `×${loo.model.median_miss}`, `×${loo.flat.median_miss}`],
    ['Median miss, time split', `×${split.model.median_miss}`, `×${split.flat.median_miss}`],
    ['Within 3× of the real cap', pct(loo.model.within_3x), pct(loo.flat.within_3x)],
    ['Within 10× of the real cap', pct(loo.model.within_10x), pct(loo.flat.within_10x)],
  ];
  return (
    <section className="proof-band" aria-labelledby="proof-title">
      <header className="proof-head">
        <h2 id="proof-title">
          {data.rows.length} protocols record no token. Here is what each launch would be worth,
          and what farming it costs.
        </h2>
        <p>
          Each value is read off a curve fitted to the {curve.comparables} tokens that already
          trade, then adjusted for category, 7-day TVL growth and time with no token. The curve
          is tested blind: every token is priced as if it had none.
        </p>
      </header>
      <div className="proof-grid">
        <article className="proof-card">
          <h3>How a launch is priced</h3>
          <p className="proof-formula">
            value = 10^{curve.intercept.toFixed(2)} × TVL^{curve.elasticity.toFixed(3)} × category
            × momentum × seasoning
          </p>
          <ul className="proof-list">
            <li>
              <span>Elasticity</span>
              <b>{curve.elasticity.toFixed(3)}</b>
            </li>
            <li>
              <span>Middle half of tokens</span>
              <b>
                ×{curve.low_factor.toFixed(2)} to ×{curve.high_factor.toFixed(2)}
              </b>
            </li>
            <li>
              <span>Momentum and seasoning</span>
              <b>small, bounded</b>
            </li>
            <li>
              <span>Model</span>
              <b>{model.version}</b>
            </li>
          </ul>
        </article>
        <article className="proof-card">
          <h3>Blind test, tokens left out</h3>
          <table className="proof-table">
            <thead>
              <tr>
                <th scope="col">
                  <span className="sr-only">Measure</span>
                </th>
                <th scope="col">Model</th>
                <th scope="col">Flat multiple</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([label, a, b]) => (
                <tr key={label}>
                  <th scope="row">{label}</th>
                  <td className="win">{a}</td>
                  <td>{b}</td>
                </tr>
              ))}
              <tr>
                <th scope="row">Inside the P25–P75 band</th>
                <td colSpan="2">
                  {pct(loo.model.inside_band)} / {pct(split.model.inside_band)}
                </td>
              </tr>
            </tbody>
          </table>
          <p className="proof-note">
            {loo.n} tokens leave one out; time split priced on the {split.n} newest. A ranking tool,
            not a price.{' '}
            <button type="button" onClick={onMethodology}>
              Method and backtest
            </button>
          </p>
        </article>
        <article className="proof-card proof-chart">
          <h3>Out of sample: each traded token priced as if it had none</h3>
          <BacktestChart points={backtest.points} />
        </article>
      </div>
    </section>
  );
}
