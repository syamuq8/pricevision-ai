import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Dynamic API URL Router Interceptor
const originalFetch = window.fetch;
window.fetch = function (url, options) {
  if (typeof url === 'string' && url.startsWith('http://localhost:8000/api')) {
    const isSinglePortLocal = window.location.port === '8000';
    const isOnlineProduction = !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1');
    if (isSinglePortLocal || isOnlineProduction) {
      url = url.replace('http://localhost:8000/api', '/api');
    }
  }
  return originalFetch(url, options);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
