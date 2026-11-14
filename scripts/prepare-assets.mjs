import { cpSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import sharp from 'sharp';
mkdirSync('src/assets/images', { recursive: true });
mkdirSync('src/assets/fonts', { recursive: true });

// Source artwork is optional: when an original is not in the repository, the committed WebP in
// src/assets/images is used as it is.
const images = [
  ['assets/4d862cbe-afd2-4949-a0ef-877cc89fa831.png', 'landscape.webp', 1440, 83],
  ['assets/92fa9f8f-d969-4526-b7f9-10c659232948.png', 'cloud-study.webp', 1440, 84],
  ['src/assets/images/cloud.png', 'cloud.webp', 760, 78],
];
let converted = 0;
for (const [source, target, width, quality] of images) {
  if (!existsSync(source)) {
    if (!existsSync(`src/assets/images/${target}`))
      throw new Error(`Missing ${source} and no committed ${target}.`);
    continue;
  }
  await sharp(source)
    .resize({ width, withoutEnlargement: true })
    .webp({ quality })
    .toFile(`src/assets/images/${target}`);
  converted += 1;
}

const sans = 'node_modules/@fontsource-variable/funnel-sans/files';
const sansFile = readdirSync(sans).find((name) => name === 'funnel-sans-latin-wght-normal.woff2');
if (!sansFile) throw new Error('Expected local Latin font files are missing.');
cpSync(`${sans}/${sansFile}`, 'src/assets/fonts/funnel-sans.woff2');
console.log(`Prepared images (${converted} converted, rest reused) and local font.`);
