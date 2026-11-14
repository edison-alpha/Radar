import { useState } from 'react';
const KEY = 'radar.saved.v1';
export function useSavedProtocols() {
  const [saved, setSaved] = useState(() => {
    try {
      const value = JSON.parse(localStorage.getItem(KEY) ?? '[]');
      return new Set(Array.isArray(value) ? value.filter((v) => typeof v === 'string') : []);
    } catch {
      return new Set();
    }
  });
  const [storageError, setStorageError] = useState(false);
  function toggle(slug) {
    setSaved((current) => {
      const next = new Set(current);
      next.has(slug) ? next.delete(slug) : next.add(slug);
      try {
        localStorage.setItem(KEY, JSON.stringify([...next]));
        setStorageError(false);
      } catch {
        setStorageError(true);
      }
      return next;
    });
  }
  return { saved, toggle, storageError };
}
