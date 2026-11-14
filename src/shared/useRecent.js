import { useCallback, useState } from 'react';

const KEY = 'radar-recent';
const MAX = 8;

function read() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === 'string').slice(0, MAX) : [];
  } catch {
    return [];
  }
}

/** Protocols the visitor opened, newest first. Stored in this browser only. */
export function useRecent() {
  const [recent, setRecent] = useState(read);
  const write = (next) => {
    setRecent(next);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // Storage can be blocked; the list still works for this visit.
    }
  };
  const push = useCallback((slug) => {
    setRecent((current) => {
      const next = [slug, ...current.filter((s) => s !== slug)].slice(0, MAX);
      try {
        window.localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        // ignored, see above
      }
      return next;
    });
  }, []);
  const clear = useCallback(() => write([]), []);
  return { recent, push, clear };
}
