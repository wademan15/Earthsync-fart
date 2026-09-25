import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { ErrorBoundary } from './components/system/ErrorBoundary';

// Timeline Anchor: Restore Point - The Harmonic Convergence (Phase Locking, Full Physics Suite)
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary moduleName="EarthSync Application">
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);