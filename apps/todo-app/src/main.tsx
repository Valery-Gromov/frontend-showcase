import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@frontend-showcase/ui';
import '@frontend-showcase/ui/styles';
import { App } from './App';
import { themeStorage } from './themeStorage';
import './styles.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element #root not found');
}

createRoot(rootElement).render(
  <React.StrictMode>
    <ThemeProvider storage={themeStorage}>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);
