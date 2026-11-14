import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';
import { build } from 'esbuild';
import { Window } from 'happy-dom';

async function exerciseDashboard(label, scripts) {
  const window = new Window({
    url: 'http://localhost/',
    settings: { enableJavaScriptEvaluation: true },
  });
  const errors = [];
  // React development profiling calls this browser API; Happy DOM leaves it unimplemented.
  window.console.timeStamp = () => {};
  // Exercise Motion's JavaScript fallback; the simulator's native animation cancellation rejects.
  window.Element.prototype.animate = undefined;
  window.addEventListener('error', (event) => errors.push(event.error?.stack ?? event.message));
  window.document.body.innerHTML = '<div id="root">Loading the protocol radar…</div>';

  async function waitFor(check, message) {
    for (let attempt = 0; attempt < 100; attempt++) {
      if (check()) return;
      await delay(20);
    }
    assert.fail(`${label}: ${message}. Errors: ${errors.join('; ')}`);
  }

  try {
    for (const script of scripts) window.eval(script);
    const document = window.document;
    await waitFor(
      () => document.querySelectorAll('tbody tr').length === 10,
      'React did not render the table',
    );
    assert.match(document.querySelector('h1').textContent, /Price the launch/);
    assert.equal(document.querySelectorAll('[role="tab"]').length, 3);
    const tvlFilter = document.querySelector('[aria-label="Minimum TVL"]');
    assert.ok(tvlFilter, 'Minimum TVL filter missing');
    tvlFilter.click();
    await waitFor(() => document.querySelector('[role="option"]:nth-child(5)'), 'TVL options did not open');
    document.querySelector('[role="option"]:nth-child(5)').click();
    await waitFor(() => tvlFilter.textContent.includes('$1B'), 'Minimum TVL selection did not apply');
    document.querySelector('.active-filters button').click();
    await waitFor(() => !document.querySelector('.active-filters'), 'Clear filters did not reset selections');
    const tableLogos = [...document.querySelectorAll('.protocol-cell .protocol-mark img')];
    assert.equal(tableLogos.length, 10, `${label}: expected authentic logos in each visible row`);
    assert.ok(
      tableLogos.every((image) => image.getAttribute('src').startsWith('./protocol-logos/')),
    );
    assert.doesNotMatch(document.getElementById('root').textContent, /Loading the protocol radar/);

    // Header search: opens in place, lists categories, folds back on Escape.
    assert.equal(document.querySelector('.hs-panel').getAttribute('aria-hidden'), 'true');
    document.querySelector('.hs-label').click();
    await waitFor(
      () => document.querySelector('.hs-panel').getAttribute('aria-hidden') === 'false',
      'Header search did not open',
    );
    assert.ok(document.querySelectorAll('.hs-chips button').length > 3, 'Category chips missing');
    document
      .querySelector('.hs-box')
      .dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await waitFor(
      () => document.querySelector('.hs-panel').getAttribute('aria-hidden') === 'true',
      'Header search did not fold back',
    );

    const firstPageProtocol = document.querySelector('.protocol-cell').textContent;
    document.querySelector('[aria-label="Next page"]').click();
    await waitFor(
      () => document.querySelector('.protocol-cell').textContent !== firstPageProtocol,
      'Pagination did not update',
    );

    document.querySelector('[aria-label="Previous page"]').click();
    await waitFor(
      () => document.querySelector('.protocol-cell').textContent === firstPageProtocol,
      'Previous page did not update',
    );

    const firstBookmark = document.querySelector('.save-button');
    firstBookmark.click();
    await waitFor(
      () => document.querySelector('.save-button')?.getAttribute('aria-pressed') === 'true',
      'Bookmark did not update',
    );

    document.querySelector('.header-saved').click();
    await waitFor(
      () =>
        document.querySelector('.saved-page') && document.querySelectorAll('tbody tr').length === 1,
      'Saved page did not list the bookmarked protocol',
    );

    document.querySelector('.protocol-cell').click();
    await waitFor(
      () => document.querySelector('.detail-page-header'),
      'Protocol detail page did not open',
    );
    await waitFor(
      () => document.querySelector('.detail-page-main .line-chart svg'),
      'Valuation chart did not appear after its skeleton',
    );
    assert.match(document.querySelector('.detail-page-main').textContent, /Behind the valuation/);
    assert.ok(document.querySelectorAll('.detail-chains li').length > 0, 'Chain list missing');
    assert.ok(document.querySelector('.detail-chains .chain-mark'), 'Chain logo missing');
    assert.ok(
      document.querySelector('.detail-page-main .line-chart svg'),
      'Valuation chart missing',
    );
    assert.match(document.querySelector('.detail-page-main').textContent, /Historical TVL/);
    [...document.querySelectorAll('.chart-tabs button')]
      .find((button) => button.textContent === 'Valuation scenarios')
      .click();
    await waitFor(
      () => document.querySelector('.chart-axis-caption'),
      'Scenario chart did not open',
    );
    assert.match(
      document.querySelector('.chart-axis-caption').textContent,
      /TVL change from snapshot/,
    );
    const growthButton = [...document.querySelectorAll('.chart-switch button')].find(
      (button) => button.textContent === '7d growth',
    );
    growthButton.click();
    await waitFor(
      () =>
        document
          .querySelector('.chart-axis-caption')
          .textContent.includes('Assumed seven-day TVL growth'),
      'Growth chart did not update',
    );
    assert.ok(document.querySelector('.chart-baseline-dot'), 'Snapshot baseline missing');
    assert.ok(
      document.querySelector('.detail-page-header .protocol-mark img'),
      'Protocol detail logo missing',
    );
    assert.match(
      document.querySelector('.detail-page-main').textContent,
      /A considered research plan/,
    );
    window.location.hash = '#/radar';
    await waitFor(() => document.querySelector('.monitor-table'), 'Monitor page did not open');
    assert.equal(document.querySelectorAll('.monitor-table tbody tr').length, 25);
    assert.ok(document.querySelector('.monitor-table .sparkline'), 'Monitor sparkline missing');
    window.location.hash = '#/saved';
    await waitFor(() => document.querySelector('.saved-page'), 'Saved page did not return');

    document.querySelector('.save-button').click();
    await waitFor(() => document.querySelector('.empty-state'), 'Empty saved state did not render');
    assert.match(document.querySelector('.empty-state').textContent, /Your research starts here/);
    assert.deepEqual(errors, [], `${label}: runtime errors`);
    console.log(
      `PASS ${label}: mount, data, pagination, bookmark, saved filter, detail and empty state.`,
    );
  } finally {
    await window.happyDOM.close();
  }
}

const data = readFileSync('public/data.js', 'utf8');
const history = readFileSync('public/zz-history.js', 'utf8');
// Reproduce the classic JSX transform served by a dev server started before vite.config.js existed.
const classic = await build({
  entryPoints: ['src/main.jsx'],
  bundle: true,
  write: false,
  platform: 'browser',
  format: 'iife',
  jsx: 'transform',
  loader: { '.css': 'empty' },
  define: { 'process.env.NODE_ENV': '"development"' },
});
await exerciseDashboard('Classic JSX regression', [data, history, classic.outputFiles[0].text]);
await exerciseDashboard('Production offline build', [
  data,
  history,
  readFileSync('dist/zz-runtime.js', 'utf8'),
  readFileSync('dist/app.js', 'utf8'),
]);
