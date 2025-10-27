/**
 * FICHIER: apps\web\src\main-simple.tsx
 * POINT D'ENTRÉE SIMPLIFIÉ DE L'APPLICATION CROU
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App-simple';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
