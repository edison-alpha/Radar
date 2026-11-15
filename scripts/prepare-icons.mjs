// Builds a small offline Iconify subset (Phosphor Fill: solid, rounded) so the app never calls the Iconify API.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { getIconData } from '@iconify/utils';

export const iconMap = {
  search: 'magnifying-glass-fill',
  searchFill: 'magnifying-glass-fill',
  arrow: 'arrow-right-bold',
  arrowUp: 'arrow-up-right-bold',
  chevron: 'caret-right-bold',
  down: 'caret-down-bold',
  close: 'x-circle-fill',
  download: 'download-simple-fill',
  filter: 'funnel-simple-fill',
  check: 'check-circle-fill',
  clock: 'clock-fill',
  info: 'info-fill',
  book: 'book-open-text-fill',
  sort: 'arrows-down-up-bold',
  menu: 'list-bold',
  share: 'share-fat-fill',
  link: 'link-simple-bold',
  list: 'squares-four-fill',
  eye: 'binoculars-fill',
  sparkle: 'rocket-launch-fill',
  trending: 'arrow-fat-up-fill',
  chartLine: 'pulse-bold',
  chartBars: 'waveform-bold',
  external: 'arrow-square-out-fill',
  globe: 'globe-hemisphere-west-fill',
  more: 'dots-three-circle-fill',
  stack: 'stack-fill',
  coins: 'coins-fill',
  archive: 'archive-fill',
  category: 'streamline-flex:search-category-solid',
  shield: 'shield-check-fill',
  help: 'question-fill',
  database: 'database-fill',
  gauge: 'gauge-fill',
  offline: 'wifi-slash-fill',
  trendDown: 'arrow-fat-down-fill',
  lightbulb: 'lightbulb-fill',
  monitor: 'monitor-fill',
  clockHistory: 'clock-counter-clockwise-bold',
  telegram: 'telegram-logo-fill',
  whatsapp: 'whatsapp-logo-fill',
};

// Official X mark (not in Phosphor).
const customIcons = {
  // andrsrxn:bookmark (Iconify)
  bookmark: {
    width: 24,
    height: 24,
    body: '<g fill="none"><path fill="currentColor" d="M4.62 6.41c0-1.88 0-2.83.58-3.41c.6-.59 1.53-.59 3.42-.59h6.76c1.89 0 2.83 0 3.42.59c.58.58.58 1.53.58 3.41v10.16c0 2.3 0 3.46-.52 4.03a2 2 0 0 1-1.31.65c-.77.06-1.69-.64-3.52-2.04c-.77-.59-1.15-.88-1.58-.98a2 2 0 0 0-.87 0c-.4.09-.73.39-1.59.98c-1.85 1.41-2.78 2.12-3.56 2.05a2 2 0 0 1-1.28-.64c-.53-.57-.53-1.74-.53-4.06z" opacity=".2"/><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13.72 18.84c-.68-.6-1.02-.92-1.41-1a2 2 0 0 0-.62 0c-.4.08-.73.4-1.41 1c-2.04 1.83-3.06 2.75-3.94 2.66A2 2 0 0 1 5.2 21c-.65-.6-.65-1.97-.65-4.7V9.87c0-3.26 0-4.88.89-5.98a4 4 0 0 1 .6-.6c1.1-.89 2.72-.89 5.97-.89s4.88 0 5.98.9a4 4 0 0 1 .6.59c.88 1.1.88 2.72.88 5.98v6.4c0 2.74 0 4.11-.65 4.7a2 2 0 0 1-1.15.52c-.88.09-1.9-.83-3.94-2.66"/></g>',
  },
  // andrsrxn:bookmark-filled (Iconify)
  bookmarkFill: {
    width: 24,
    height: 24,
    body: '<g fill="none"><path fill="currentColor" d="M4.62 6.12c0-1.88 0-2.83.58-3.41c.6-.59 1.53-.59 3.42-.59h6.76c1.89 0 2.83 0 3.42.59c.58.58.58 1.53.58 3.41v10.16c0 2.3 0 3.46-.52 4.03a2 2 0 0 1-1.31.65c-.77.06-1.69-.64-3.52-2.04c-.77-.59-1.15-.88-1.58-.98a2 2 0 0 0-.87 0c-.43.1-.82.4-1.59.98c-1.85 1.41-2.78 2.12-3.56 2.05a2 2 0 0 1-1.28-.64c-.53-.57-.53-1.74-.53-4.06z"/><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13.72 18.55c-.68-.6-1.02-.91-1.41-1a2 2 0 0 0-.62 0c-.4.09-.73.4-1.41 1c-2.04 1.84-3.06 2.75-3.94 2.67a2 2 0 0 1-1.15-.52c-.65-.6-.65-1.96-.65-4.7V9.59c0-3.26 0-4.88.89-5.98a4 4 0 0 1 .6-.6c1.1-.89 2.72-.89 5.97-.89s4.88 0 5.98.9a4 4 0 0 1 .6.59c.88 1.1.88 2.72.88 5.98v6.4c0 2.74 0 4.11-.65 4.7a2 2 0 0 1-1.15.53c-.88.08-1.9-.83-3.94-2.67"/></g>',
  },
  // lucide:search (Iconify)
  search: {
    width: 24,
    height: 24,
    body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="m21 21l-4.34-4.34"/><circle cx="11" cy="11" r="8"/></g>',
  },
  x: {
    width: 24,
    height: 24,
    body: '<path fill="currentColor" d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/>',
  },
};

// Entries are Phosphor ids, or 'set:id' for another installed @iconify-json set.
const sets = {};
const loadSet = (prefix) =>
  (sets[prefix] ??= JSON.parse(
    readFileSync(`node_modules/@iconify-json/${prefix}/icons.json`, 'utf8'),
  ));
const icons = {};
for (const [name, ref] of Object.entries(iconMap)) {
  const [prefix, id] = ref.includes(':') ? ref.split(':') : ['ph', ref];
  const set = loadSet(prefix);
  const data = getIconData(set, id);
  if (!data) throw new Error(`Icon ${ref} missing from the ${prefix} set`);
  // Normalise every icon to the collection's 256 grid, so sets with other grids render the same size.
  const width = data.width ?? set.width ?? 256;
  const height = data.height ?? set.height ?? 256;
  icons[name] =
    width === 256 && height === 256
      ? data
      : {
          ...data,
          body: `<g transform="scale(${256 / width} ${256 / height})">${data.body}</g>`,
          width: 256,
          height: 256,
        };
}
Object.assign(icons, customIcons);
mkdirSync('src/data', { recursive: true });
writeFileSync(
  'src/data/icons.json',
  JSON.stringify({ prefix: 'radar', width: 256, height: 256, icons }) + '\n',
);
console.log(`Prepared ${Object.keys(icons).length} offline icons.`);
