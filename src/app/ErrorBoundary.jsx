import React, { Component } from 'react';
export class ErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <main className="fatal-error">
          <h1>The radar could not load.</h1>
          <p>
            Reload the page. If this persists, regenerate the snapshot data with the project’s data
            command.
          </p>
          <button className="button button-primary" onClick={() => location.reload()}>
            Reload radar
          </button>
        </main>
      );
    return this.props.children;
  }
}
