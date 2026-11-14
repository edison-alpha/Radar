import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

for (const [directory, dataPath] of [['dist', './data.js'], ['dashboard', '../data.js']]) {
  const scope = `https://radar.test/${directory}/`;
  const listeners = {};
  const entries = new Map();
  const key = (request) => typeof request === 'string' ? request : request.url;
  const cache = {
    addAll: async (urls) => { for (const url of urls) entries.set(url, new Response(`cached:${url}`)); },
    put: async (request, response) => entries.set(key(request), response),
  };
  const caches = {
    open: async () => cache,
    match: async (request) => entries.get(key(request))?.clone(),
    keys: async () => [],
    delete: async () => true,
  };
  let online = true;
  const self = {
    registration: { scope },
    location: { origin: 'https://radar.test' },
    clients: { claim: async () => {} },
    skipWaiting: async () => {},
    addEventListener: (type, callback) => { listeners[type] = callback; },
  };
  runInNewContext(readFileSync(`${directory}/sw.js`, 'utf8'), {
    self, caches, URL, Response, Promise,
    fetch: async () => { if (!online) throw new Error('offline'); return new Response('latest snapshot'); },
  });
  let pending;
  listeners.install({ waitUntil: (promise) => { pending = promise; } });
  await pending;
  const dataUrl = new URL(dataPath, scope).href;
  assert.ok(entries.has(dataUrl), `${directory}: snapshot was not precached`);
  const request = async (url, mode = 'same-origin') => {
    let response;
    listeners.fetch({ request: { method: 'GET', url, mode }, respondWith: (promise) => { response = promise; } });
    return await response;
  };
  assert.equal(await (await request(dataUrl)).text(), 'latest snapshot');
  online = false;
  assert.equal(await (await request(dataUrl)).text(), 'latest snapshot');
  assert.ok((await request(new URL('app.js', scope).href)).ok);
  assert.ok((await request(scope, 'navigate')).ok);
  console.log(`PASS ${directory}: installation, refreshed snapshot, and offline cache`);
}
