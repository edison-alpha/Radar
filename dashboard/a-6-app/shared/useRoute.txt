import { useEffect, useState } from 'react';

function parse(hash) {
  const protocol = hash.match(/^#\/protocol\/([^/?]+)/);
  if (protocol) return { name: 'protocol', slug: decodeURIComponent(protocol[1]) };
  const token = hash.match(/^#\/token\/([^/?]+)/);
  if (token) return { name: 'token', slug: decodeURIComponent(token[1]) };
  const aside = hash.match(/^#\/aside\/([^/?]+)/);
  if (aside) return { name: 'aside', slug: decodeURIComponent(aside[1]) };
  if (hash.startsWith('#/protocols')) return { name: 'home', scroll: true };
  if (hash.startsWith('#/radar') || hash.startsWith('#/monitor')) return { name: 'monitor' };
  if (hash.startsWith('#/saved')) return { name: 'saved' };
  if (hash.startsWith('#/methodology')) return { name: 'methodology' };
  return { name: 'home' };
}

export const protocolHref = (slug) => `#/protocol/${encodeURIComponent(slug)}`;
export const referenceHref = (kind, slug) =>
  `#/${kind === 'traded' ? 'token' : 'aside'}/${encodeURIComponent(slug)}`;

export function useRoute() {
  const [route, setRoute] = useState(() => parse(window.location.hash));
  useEffect(() => {
    const onChange = () => {
      setRoute(parse(window.location.hash));
      window.scrollTo({ top: 0, behavior: 'instant' });
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}
