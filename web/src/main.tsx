import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './App';
import { LanguageProvider } from './lib/i18n';
import { registerServiceWorker } from './lib/offline';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

createRoot(rootElement).render(
  <LanguageProvider>
    <App />
  </LanguageProvider>,
);

registerServiceWorker();
