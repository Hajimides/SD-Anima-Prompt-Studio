import { initApp } from '@components/App';

function registerServiceWorker(): void {
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    navigator.serviceWorker.register('./sw.js').catch((err) => {
      console.warn('Service worker registration failed:', err);
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initApp();
    registerServiceWorker();
  });
} else {
  initApp();
  registerServiceWorker();
}
