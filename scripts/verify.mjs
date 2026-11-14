import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { Script } from 'node:vm';
import sharp from 'sharp';

const entry = readFileSync('src/main.jsx', 'utf8');
assert.ok(entry.includes('./styles/index.js'));
for (const name of ['tokens', 'layout', 'radar', 'dialogs', 'responsive'])
  assert.ok(existsSync(`src/styles/${name}.css`));

function files(root) {
  return readdirSync(root).flatMap((name) => {
    const path = join(root, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}
assert.ok(existsSync('dist/index.html'), 'Run pnpm build before verification.');
for (const directory of ['dist', 'dashboard']) {
  const manifest = JSON.parse(readFileSync(join(directory, 'manifest.webmanifest'), 'utf8'));
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.start_url, './');
  for (const size of [192, 512]) {
    const icon = await sharp(join(directory, `pwa-${size}.png`)).metadata();
    assert.equal(icon.width, size);
    assert.equal(icon.height, size);
    assert.ok(manifest.icons.some((entry) => entry.sizes === `${size}x${size}`));
  }
  const worker = readFileSync(join(directory, 'sw.js'), 'utf8');
  new Script(worker);
  assert.ok(worker.includes(directory === 'dist' ? '"./data.js"' : '"../data.js"'));
  assert.ok(readFileSync(join(directory, 'index.html'), 'utf8').includes('manifest.webmanifest'));
}
const logoManifest = JSON.parse(readFileSync('src/data/protocol-logos.json', 'utf8'));
for (const file of Object.values(logoManifest)) {
  for (const directory of ['public', 'dist', 'dashboard']) {
    assert.ok(
      existsSync(join(directory, 'protocol-logos', file)),
      `Missing local logo: ${directory}/${file}`,
    );
  }
}
assert.ok(existsSync('dashboard/zz-history.js'), 'Missing local TVL history in dashboard/');
const dashboardFiles = files('dashboard');
assert.ok(dashboardFiles.length <= 400);
const totalBytes = dashboardFiles.reduce((sum, file) => sum + statSync(file).size, 0);
assert.ok(totalBytes <= 4_194_304, `Dashboard exceeds 4 MiB: ${totalBytes}`);
for (const file of dashboardFiles) {
  assert.ok(
    relative('dashboard', file)
      .split(/[\\/]/)
      .every((name) => /^[A-Za-z0-9_][A-Za-z0-9._-]{0,127}$/.test(name)),
    `Invalid name: ${file}`,
  );
  if (file.endsWith('.css'))
    assert.ok(!/https?:\/\//i.test(readFileSync(file, 'utf8')), `Remote CSS asset: ${file}`);
  if (file.endsWith('.html'))
    assert.ok(
      !/\w+\s*=\s*["'][^"']*https?:\/\//i.test(readFileSync(file, 'utf8')),
      `Remote HTML attribute: ${file}`,
    );
}
console.log(
  `Verified entry, styles, ${dashboardFiles.length} dashboard files and ${(totalBytes / 1024).toFixed(1)} KiB of local assets.`,
);
