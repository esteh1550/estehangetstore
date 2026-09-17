import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress benign Vite HMR websocket disconnection errors in iframe/sandbox environment
window.addEventListener('unhandledrejection', (event) => {
  const reasonStr = String(event.reason || '');
  const msg = event.reason?.message || '';
  if (
    msg.includes('WebSocket') ||
    msg.includes('websocket') ||
    reasonStr.includes('WebSocket') ||
    reasonStr.includes('websocket')
  ) {
    event.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

