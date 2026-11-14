// Builds a small offline Iconify subset (Phosphor Fill: solid, rounded) so the app never calls the Iconify API.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { getIconData } from '@iconify/utils';

export const iconMap = {
  search: 'magnifying-glass-fill',
  arrow: 'arrow-right-bold',
  arrowUp: 'arrow-up-right-bold',
  chevron: 'caret-right-bold',
  down: 'caret-down-bold',
  close: 'x-circle-fill',
  bookmark: 'bookmark-simple',
  bookmarkFill: 'bookmark-simple-fill',
  download: 'download-simple-fill',
  filter: 'funnel-simple-fill',
  check: 'check-circle-fill',
  clock: 'clock-fill',
  info: 'info-fill',
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
