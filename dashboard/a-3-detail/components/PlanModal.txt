import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Icon } from '../../../shared/Icon';
import { money, signed } from '../../../shared/format';
import { ECON, VERDICT_TEXT, farmEconomics } from '../../../../lib/economics.mjs';

const CAPITALS = ECON.capitals.map((value) => ({
  value,
  label: value >= 1000 ? `$${value / 1000}K` : `$${value}`,
}));
const SHARES = ECON.shares.map((value) => ({ value, label: `${value * 100}%` }));
const HOLDS = ECON.holds.map((value) => ({ value, label: `${value}d` }));
const COLOURS = [
  { value: 'colour', label: 'Colour' },
  { value: 'mono', label: 'Mono' },
];

function Segmented({ label, value, options, onChange }) {
  return (
    <div className="plan-setting">
      <span id={`seg-${label}`}>{label}</span>
      <div className="plan-segmented" role="radiogroup" aria-labelledby={`seg-${label}`}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={value === option.value}
            className={value === option.value ? 'is-on' : ''}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Cost stack: what the slice has to cover (fees, then the T-bill yield), and what is left or missing. */
function CostBar({ econ }) {
  const cost = econ.fees_usd + econ.tbill_usd;
  const total = Math.max(econ.slice_usd, cost, 0.01);
  const parts = [
    { key: 'fees', label: 'Fees', value: econ.fees_usd },
    { key: 'tbill', label: 'T-bill given up', value: econ.tbill_usd },
    econ.net_usd >= 0
      ? { key: 'net', label: 'Net', value: econ.net_usd }
      : { key: 'short', label: 'Shortfall', value: cost - econ.slice_usd },
  ];
  const marker = (econ.slice_usd / total) * 100;
  return (
    <div className="plan-meter">
      <div className="plan-bar" role="img" aria-label={`Slice ${money(econ.slice_usd, 2)} against costs ${money(cost, 2)}`}>
        {parts.map((part) => (
          <i key={part.key} className={`seg seg-${part.key}`} style={{ flexGrow: Math.max(part.value, 0.0001) }} title={`${part.label} $${part.value.toFixed(2)}`} />
        ))}
        <b className="plan-marker" style={{ left: `${Math.min(marker, 100)}%` }}>
          <span>Slice ${econ.slice_usd.toFixed(2)}</span>
        </b>
      </div>
      <div className="plan-chips">
        <span className="chip chip-fees">
          <i /> Fees ${econ.fees_usd.toFixed(2)}
        </span>
        <span className="chip chip-tbill">
          <i /> T-bill ${econ.tbill_usd.toFixed(2)}
        </span>
        <span className="chip chip-slice">
          <i /> Slice ${econ.slice_usd.toFixed(2)}
        </span>
        <span className={`chip ${econ.net_usd >= 0 ? 'chip-net' : 'chip-short'}`}>
          <i /> {econ.net_usd >= 0 ? 'Net' : 'Short'} {signed(econ.net_usd)}
        </span>
      </div>
    </div>
  );
}

function Scenarios({ protocol, active }) {
  return (
    <table className="plan-grid">
      <caption>Net of all costs, by capital and airdrop share ({active.hold_days}-day hold)</caption>
      <thead>
        <tr>
          <th scope="col">Capital</th>
          {ECON.shares.map((share) => (
            <th scope="col" key={share}>
              {share * 100}% drop
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {ECON.capitals.map((capital) => (
          <tr key={capital}>
            <th scope="row">{money(capital, 0)}</th>
            {ECON.shares.map((share) => {
              const e = farmEconomics(protocol, { capital, share, holdDays: active.hold_days });
              const current = capital === active.capital_usd && share === active.share;
              return (
                <td key={share} className={`${e.net_usd >= 0 ? 'pos' : 'neg'}${current ? ' is-current' : ''}`}>
                  {signed(e.net_usd)}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * The research plan as a dialog: the plan and its economics on the left, the scenario controls on
 * the right. Capital, airdrop share and hold only re-price the plan through farmEconomics.
 */
export function PlanModal({ open, onClose, protocol, saved, onToggleSave }) {
  const [tab, setTab] = useState('plan');
  const [capital, setCapital] = useState(ECON.capital);
  const [share, setShare] = useState(ECON.share);
  const [hold, setHold] = useState(ECON.holdDays);
  const [colour, setColour] = useState('colour');
  const [copied, setCopied] = useState(false);
  const closeRef = useRef(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return undefined;
    setTab('plan');
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);
  useEffect(() => {
    if (!copied) return undefined;
    const timer = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(timer);
  }, [copied]);

  if (!protocol) return null;
  const econ = farmEconomics(protocol, { capital, share, holdDays: hold });
  const { farm } = protocol;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      /* clipboard blocked: the address bar still holds the link */
    }
    setCopied(true);
  }

  const shift = reduceMotion ? 0 : 1;
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="plan-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <motion.div
            className={`plan-dialog${colour === 'mono' ? ' is-mono' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-label={`${protocol.name} research plan`}
            initial={{ opacity: 0, scale: 0.98, y: 14 * shift }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.99, y: 8 * shift }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            <section className="plan-stage" aria-label="Plan preview">
              <div className="plan-stage-bar">
                <div className="plan-tabs" role="tablist">
                  {[
                    ['plan', 'Plan'],
                    ['math', 'Math'],
                  ].map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      role="tab"
                      aria-selected={tab === id}
                      className={tab === id ? 'is-on' : ''}
                      onClick={() => setTab(id)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="plan-round"
                  onClick={() => onToggleSave(protocol.slug)}
                  aria-pressed={saved}
                  aria-label={saved ? 'Remove from research list' : 'Save to research list'}
                >
                  <Icon name={saved ? 'bookmarkFill' : 'bookmark'} size={18} />
                </button>
              </div>

              <div className="plan-stage-body">
                <article className="plan-flow">
                  <div className="plan-summary">
                  <header className="plan-card-head">
                    <h3>{protocol.name}</h3>
                    <span className={`verdict-pill verdict-${econ.verdict.toLowerCase()}`} title={VERDICT_TEXT[econ.verdict]}>
                      {econ.verdict}
                    </span>
                  </header>
                  <p className="plan-figure">
                    <strong className={econ.net_usd >= 0 ? 'pos' : 'neg'}>{signed(econ.net_usd)}</strong>
                    <span>
                      net of all costs at {money(capital, 0)} · {signed(econ.per_hour_usd)}/h hands-on
                    </span>
                  </p>
                  <CostBar econ={econ} />
                  </div>

                  {tab === 'plan' ? (
                    <ol className="plan-steps">
                      {farm.steps.map((step, index) => (
                        <li key={step.title}>
                          <span className="plan-step-n">{index + 1}</span>
                          <div>
                            <h4>{step.title}</h4>
                            <p>{step.text}</p>
                            <div className="plan-step-meta">
                              <span>{step.cost}</span>
                              <span>
                                <Icon name="clock" size={12} /> {step.time}
                              </span>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <div className="plan-math">
                      <Scenarios protocol={protocol} active={econ} />
                      <dl className="plan-sum">
                        <div>
                          <dt>Implied value</dt>
                          <dd>{money(protocol.implied_value_usd, 2)}</dd>
                        </div>
                        <div>
                          <dt>Slice = value × {share * 100}% × {money(capital, 0)} ÷ TVL {money(protocol.tvl_usd, 2)}</dt>
                          <dd>+${econ.slice_usd.toFixed(2)}</dd>
                        </div>
                        <div>
                          <dt>Fees, {farm.txs} transactions on {farm.chain}</dt>
                          <dd>-${econ.fees_usd.toFixed(2)}</dd>
                        </div>
                        <div>
                          <dt>
                            T-bill forgone, {ECON.tbillYield * 100}% × {hold} days
                          </dt>
                          <dd>-${econ.tbill_usd.toFixed(2)}</dd>
                        </div>
                        <div className="total">
                          <dt>Net of all costs</dt>
                          <dd className={econ.net_usd >= 0 ? 'pos' : 'neg'}>{signed(econ.net_usd)}</dd>
                        </div>
                      </dl>
                    </div>
                  )}
                </article>
              </div>
            </section>

            <aside className="plan-side" aria-label="Plan settings">
              <header className="plan-side-head">
                <h2>Research plan</h2>
                <button ref={closeRef} type="button" className="plan-round" onClick={onClose} aria-label="Close">
                  <Icon name="close" size={18} />
                </button>
              </header>
              <p className="plan-side-copy">
                Seven steps with what each costs and how long it takes, netted against the T-bill yield
                the capital gives up. Move capital, airdrop share or hold and the plan is re-priced. The
                airdrop is a scenario: the snapshot records no points programme.
              </p>
              <Segmented label="Capital" value={capital} options={CAPITALS} onChange={setCapital} />
              <Segmented label="Airdrop" value={share} options={SHARES} onChange={setShare} />
              <Segmented label="Hold" value={hold} options={HOLDS} onChange={setHold} />
              <Segmented label="Colour" value={colour} options={COLOURS} onChange={setColour} />
              <dl className="plan-facts">
                <div>
                  <dt>Chain</dt>
                  <dd>{farm.chain}</dd>
                </div>
                <div>
                  <dt>Hands-on</dt>
                  <dd>{farm.setup_minutes}</dd>
                </div>
                <div>
                  <dt>Risk</dt>
                  <dd>{farm.risk}</dd>
                </div>
              </dl>
              <div className="plan-actions">
                <button type="button" className="plan-share" onClick={copyLink}>
                  <Icon name={copied ? 'check' : 'link'} size={16} />
                  {copied ? 'Link copied' : 'Share'}
                </button>
                <button type="button" className="plan-save" onClick={() => onToggleSave(protocol.slug)} aria-pressed={saved}>
                  {saved ? 'Saved to research' : 'Save protocol'}
                </button>
              </div>
            </aside>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
