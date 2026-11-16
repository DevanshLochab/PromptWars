'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Saans ServiceWorker registered with scope:', registration.scope);
        })
        .catch((error) => {
          console.warn('Saans ServiceWorker registration failed:', error);
        });
    }
  }, []);

  return null;
}
