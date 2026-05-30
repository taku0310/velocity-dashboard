import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { RenderErrorBoundary } from './components/RenderErrorBoundary';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RenderErrorBoundary>
      <App />
    </RenderErrorBoundary>
  </React.StrictMode>,
);
