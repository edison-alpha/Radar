import React from 'react';
import { createRoot } from 'react-dom/client';
import { MotionConfig } from 'motion/react';
import { App } from './app/App';
import { ErrorBoundary } from './app/ErrorBoundary';
import './styles/index.js';

const data = window.__RADAR_DATA__;
createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <MotionConfig reducedMotion="user">
      {data?.rows?.length ? (
        <App data={data} />
      ) : (
        <main className="fatal-error">
          <h1>Snapshot data is unavailable.</h1>
          <p>Run the project’s data command, then reload this page.</p>
          <button className="button button-primary" onClick={() => location.reload()}>
            Reload radar
          </button>
        </main>
      )}
    </MotionConfig>
  </ErrorBoundary>,
);
