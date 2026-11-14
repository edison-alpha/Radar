import React from 'react';
import { Icon } from '../../../shared/Icon';
export function FarmPlan({ farm }) {
  return (
    <section className="detail-section">
      <div className="detail-section-title">
        <h3>A considered research plan</h3>
        <span>
          <Icon name="clock" size={14} /> {farm.summary}
        </span>
      </div>
      <div className="farm-budget">
        <div>
          <span>Test capital</span>
          <strong>{farm.capital}</strong>
        </div>
        <div>
          <span>Estimated fees</span>
          <strong>{farm.gas_estimate}</strong>
        </div>
        <div>
          <span>Total time</span>
          <strong>{farm.setup_minutes} over 3 weeks</strong>
        </div>
      </div>
      <p className="detail-explainer">
        {farm.assumption} Capital remains exposed; it is separate from spent fees.
      </p>
      <ol className="farm-steps">
        {farm.steps.map((step, index) => (
          <li key={step.title}>
            <span className="step-number">{index + 1}</span>
            <div>
              <h4>{step.title}</h4>
              <p>{step.text}</p>
              <div className="step-meta">
                <span>{step.cost}</span>
                <span>
                  <Icon name="clock" size={12} />
                  {step.time}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ol>
      <p className="risk-note">
        <Icon name="info" size={16} />
        <span>Consider: {farm.risk}. Activity does not guarantee a token allocation.</span>
      </p>
    </section>
  );
}
