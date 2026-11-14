import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import sharp from 'sharp';

const manifest = JSON.parse(readFileSync('src/data/protocol-logos.json', 'utf8'));
const board = JSON.parse(readFileSync('data/board.json', 'utf8')).rows;
const provenance = JSON.parse(readFileSync('docs/protocol-logo-provenance.json', 'utf8'));

test('every ranked protocol has its own slug-matched, locally stored logo', () => {
  assert.equal(Object.keys(manifest).length, board.length);
  assert.equal(provenance.unresolved.length, 0);
  for (const protocol of board) {
    assert.equal(manifest[protocol.slug], `${protocol.slug}.webp`);
    const record = provenance.logos.find((logo) => logo.slug === protocol.slug);
    assert.ok(record?.source_url?.startsWith('https://'));
    const bytes = readFileSync(`public/protocol-logos/${manifest[protocol.slug]}`);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), record.sha256);
  }
});

test('all logos decode as compact WebP images with bounded dimensions', async () => {
  for (const file of Object.values(manifest)) {
    const metadata = await sharp(`public/protocol-logos/${file}`).metadata();
    assert.equal(metadata.format, 'webp');
    assert.ok(metadata.width > 0 && metadata.width <= 96);
    assert.ok(metadata.height > 0 && metadata.height <= 96);
  }
});
