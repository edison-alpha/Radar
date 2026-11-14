import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8').replace(/^\uFEFF/, ''));
const board = readJson('data/board.json').rows;
const metadata = readJson('docs/protocol-logo-metadata.json');
const overrides = existsSync('data/logo-overrides.json')
  ? readJson('data/logo-overrides.json')
  : {};
const bySlug = new Map(metadata.map((protocol) => [protocol.slug, protocol]));
const allowedHosts = new Set([
  'icons.llama.fi',
  'icons.llamao.fi',
  'drakewell.fi',
  'www.drakewell.fi',
  'app.makina.finance',
  'd3o4n3yn4cjsqa.cloudfront.net',
]);
const manifest = {};
const provenance = [];
const failures = [];
let index = 0;
let processed = 0;
mkdirSync('public/protocol-logos', { recursive: true });
mkdirSync('src/data', { recursive: true });
mkdirSync('.cache/protocol-logo-originals', { recursive: true });

async function download(protocol) {
  const override = overrides[protocol.slug];
  const match = override ?? bySlug.get(protocol.slug);
  if (!match?.logo) throw new Error('No verified source URL for this exact protocol slug.');
  const url = new URL(match.logo);
  if (url.protocol !== 'https:' || !allowedHosts.has(url.hostname))
    throw new Error(`Unreviewed logo host: ${url.hostname}`);
  const cache = `.cache/protocol-logo-originals/${protocol.slug}.image`;
  let bytes;
  if (existsSync(cache)) {
    bytes = readFileSync(cache);
  } else {
    let lastError;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(20_000) });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        if (!response.headers.get('content-type')?.startsWith('image/'))
          throw new Error('Source did not return an image.');
        bytes = Buffer.from(await response.arrayBuffer());
        if (bytes.length > 8_388_608) throw new Error('Source image exceeds 8 MiB.');
        writeFileSync(cache, bytes);
        break;
      } catch (error) {
        lastError = error;
      }
    }
    if (!bytes) throw lastError;
  }
  const file = `${protocol.slug}.webp`;
  const image = await sharp(bytes, { limitInputPixels: 16_777_216 })
    .resize({
      width: 96,
      height: 96,
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      withoutEnlargement: true,
    })
    .webp({ quality: 92 })
    .toBuffer();
  writeFileSync(`public/protocol-logos/${file}`, image);
  manifest[protocol.slug] = file;
  provenance.push({
    slug: protocol.slug,
    name: protocol.name,
    matched_name: match.name,
    match: override ? 'Official website override' : 'Exact DefiLlama slug',
    metadata_source: override?.source ?? 'https://api.llama.fi/protocols',
    source_url: url.href,
    website: match.url ?? null,
    file: `protocol-logos/${file}`,
    sha256: createHash('sha256').update(image).digest('hex'),
    bytes: image.length,
  });
}

await Promise.all(
  Array.from({ length: 6 }, async () => {
    while (index < board.length) {
      const protocol = board[index++];
      try {
        await download(protocol);
      } catch (error) {
        failures.push({ slug: protocol.slug, name: protocol.name, reason: error.message });
      }
      processed++;
      if (processed % 25 === 0 || processed === board.length)
        console.log(
          `Processed ${processed}/${board.length}; downloaded ${Object.keys(manifest).length}; unresolved ${failures.length}`,
        );
    }
  }),
);
const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync('src/data/protocol-logos.json', JSON.stringify(sorted, null, 2) + '\n');
writeFileSync(
  'docs/protocol-logo-provenance.json',
  JSON.stringify(
    {
      catalog: 'DefiLlama protocol logos with independently verified official-site overrides',
      count: provenance.length,
      total_protocols: board.length,
      logos: provenance.sort((a, b) => a.slug.localeCompare(b.slug)),
      unresolved: failures,
    },
    null,
    2,
  ) + '\n',
);
console.log(
  `Saved ${provenance.length}/${board.length} authentic sourced logos. ${failures.length} remain as initials.`,
);
if (failures.length) console.log(JSON.stringify(failures, null, 2));
