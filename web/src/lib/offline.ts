import { useEffect, useState } from 'react';

/** Tracks connectivity so routes, panels and the map can show offline states. */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState<boolean>(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );

  useEffect(() => {
    const handleOnline = (): void => setOnline(true);
    const handleOffline = (): void => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return online;
}

/**
 * Registers the service worker that caches the app shell and campus data.
 * Production only: the dev server's asset URLs change on every reload.
 */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD || typeof navigator === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Offline support is an enhancement; the app still works without it.
    });
  });
}
