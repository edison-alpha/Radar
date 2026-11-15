import { useState } from 'react';

/** 'comfortable' | 'compact', remembered per page in localStorage. */
export function useViewMode(key) {
  const [mode, setMode] = useState(() => {
    try {
      return localStorage.getItem(key) === 'compact' ? 'compact' : 'comfortable';
    } catch {
      return 'comfortable';
    }
  });
  const update = (next) => {
    setMode(next);
    try {
      localStorage.setItem(key, next);
    } catch {
      /* storage unavailable */
    }
  };
  return [mode, update];
}
