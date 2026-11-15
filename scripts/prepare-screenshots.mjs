// Turns raw browser captures into the screenshots the gate accepts: 3 to 4 JPEGs, long side at most
// 1440 px, short side at least 800 px, about 300 to 350 KB each (the dossier carries them all).
//
//   node scripts/prepare-screenshots.mjs 1-board.jpg=raw/board.png 2-plan.jpg=raw/plan.png ...
//
// The names sort in the order the judge sees them; the first is the cover image.
import { mkdirSync, writeFileSync } from 'node:fs';
import { basename } from 'node:path';
import sharp from 'sharp';

const TARGET_MAX = 345 * 1024;
const TARGET_MIN = 300 * 1024;
const jobs = process.argv.slice(2).map((arg) => {
  const [name, source] = arg.split('=');
  if (!name || !source || !/^[A-Za-z0-9][A-Za-z0-9._-]*\.jpg$/.test(name))
    throw new Error(`Use name.jpg=source.png (letters, digits, . _ - only): ${arg}`);
  return { name, source };
});
if (jobs.length < 3 || jobs.length > 4) throw new Error('Give 3 or 4 screenshots.');
mkdirSync('screenshots', { recursive: true });

for (const { name, source } of jobs) {
  const meta = await sharp(source).metadata();
  const scale = 1440 / Math.max(meta.width, meta.height);
  const width = Math.round(meta.width * scale);
  const height = Math.round(meta.height * scale);
  if (Math.min(width, height) < 800) throw new Error(`${basename(source)} is too short: ${width}x${height}`);
  const resized = await sharp(source).resize({ width, height, kernel: 'lanczos3' }).removeAlpha().toBuffer();
  // highest quality that still fits the budget, found by bisection
  let low = 40;
  let high = 98;
  let best = await sharp(resized).jpeg({ quality: low, mozjpeg: true }).toBuffer();
  while (low <= high) {
    const quality = (low + high) >> 1;
    const buffer = await sharp(resized).jpeg({ quality, mozjpeg: true }).toBuffer();
    if (buffer.length <= TARGET_MAX) {
      best = buffer;
      low = quality + 1;
    } else high = quality - 1;
  }
  writeFileSync(`screenshots/${name}`, best);
  const note = best.length < TARGET_MIN ? ' (under 300 KB: the page is simple, fine)' : '';
  console.log(`${name}: ${width}x${height}, ${(best.length / 1024).toFixed(0)} KB${note}`);
}
