import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

declare global {
  interface Window {
    __hdPwaUpdateReady?: boolean;
    __hdApplyPwaUpdate?: () => Promise<void>;
  }
}

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      window.__hdPwaUpdateReady = true;
      window.dispatchEvent(new CustomEvent('hd-pwa-update-ready'));
    },
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;
      window.setInterval(() => {
        if (navigator.onLine) {
          registration.update().catch(() => {
            // Ignore transient offline errors
          });
        }
      }, 15 * 60 * 1000);
    },
  });

  window.__hdApplyPwaUpdate = async () => {
    await updateSW(true);
  };
}

createRoot(document.getElementById('root')!).render(<App />);
