import { build } from 'esbuild';
import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';

const root = resolve('.');
const vendorModules = {
  react: 'React',
  'react/jsx-runtime': 'JSXRuntime',
  'react-dom/client': 'ReactDOM',
  'motion/react': 'Motion',
  '@tanstack/react-table': 'Table',
};

mkdirSync('dist', { recursive: true });
const namespaces = {};
for (const name of Object.keys(vendorModules))
  namespaces[name] = Object.keys(await import(name)).filter(
    (key) => key !== 'default' && /^[A-Za-z_$][\w$]*$/.test(key),
  );

// Keep the framework runtime separate so the dossier presents application logic first.
await build({
  absWorkingDir: root,
  stdin: {
    contents:
      Object.entries(vendorModules)
        .map(([name, key]) => `import * as ${key} from ${JSON.stringify(name)};`)
        .join('\n') + `\nwindow.__RADAR_VENDOR__ = { ${Object.values(vendorModules).join(', ')} };`,
    resolveDir: root,
  },
  bundle: true,
  format: 'iife',
  platform: 'browser',
  minify: true,
  define: { 'process.env.NODE_ENV': '"production"' },
  outfile: 'dist/zz-runtime.js',
  legalComments: 'eof',
});

await build({
  absWorkingDir: root,
  entryPoints: ['src/main.jsx'],
  bundle: true,
  format: 'iife',
  platform: 'browser',
  jsx: 'automatic',
  minify: true,
  outfile: 'dist/app.js',
  loader: { '.woff2': 'file', '.webp': 'file', '.png': 'file' },
  assetNames: 'assets/[name]-[hash]',
  define: { 'process.env.NODE_ENV': '"production"' },
  plugins: [
    {
      name: 'local-vendor-runtime',
      setup(api) {
        api.onResolve(
          {
            filter:
              /^(react|react\/jsx-runtime|react-dom\/client|motion\/react|@tanstack\/react-table)$/,
          },
          ({ path }) => ({ path, namespace: 'radar-vendor' }),
        );
        api.onLoad({ filter: /.*/, namespace: 'radar-vendor' }, ({ path }) => ({
          contents: `const vendor = window.__RADAR_VENDOR__.${vendorModules[path]};\nexport const { ${namespaces[path].join(', ')} } = vendor;\nexport default vendor;`,
          loader: 'js',
        }));
      },
    },
  ],
});

const shell =
  '<div id="root"><div class="boot" aria-hidden="true"><div class="boot-bar"><i class="b1"></i><i class="b2"></i><i class="b3"></i></div><div class="boot-hero"><i class="b4"></i><i class="b5"></i><i class="b6"></i></div><div class="boot-rows"><i></i><i></i><i></i><i></i></div></div><p class="boot-text">Loading the protocol radar…</p></div>';
const style =
  '<style>body{margin:0;background:#131313;color:#eee;font-family:system-ui,sans-serif}.boot{max-width:1180px;margin:0 auto;padding:24px 48px}.boot i{display:block;border-radius:10px;background:linear-gradient(90deg,#1c1c1c 25%,#2a2a2a 50%,#1c1c1c 75%);background-size:200% 100%;animation:s 1.4s ease-in-out infinite}.boot-bar{display:flex;gap:24px;align-items:center;height:48px}.b1{width:110px;height:28px}.b2{width:260px;height:28px}.b3{width:120px;height:28px;margin-left:auto}.boot-hero{margin-top:80px}.b4{width:140px;height:26px;border-radius:999px}.b5{width:min(640px,90%);height:54px;margin-top:22px}.b6{width:min(440px,70%);height:16px;margin-top:20px}.boot-rows{margin-top:70px}.boot-rows i{height:56px;margin-bottom:10px}.boot-text{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}@keyframes s{0%{background-position:200% 0}100%{background-position:-200% 0}}@media (prefers-reduced-motion:reduce){.boot i{animation:none}}</style>';
const page = (dataPath) => `<!doctype html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="theme-color" content="#131313"><link rel="icon" type="image/png" href="./radar.png"><meta name="description" content="Research protocols before their token launch, with transparent valuations and practical research plans."><title>Radar / Before the launch</title><link rel="stylesheet" href="./app.css">${style}</head><body>${shell}<script src="${dataPath}"></script><script src="./zz-history.js"></script><script src="./zz-runtime.js"></script><script src="./app.js"></script></body></html>\n`;

writeFileSync('dist/index.html', page('./data.js'));
cpSync('public/data.js', 'dist/data.js');
cpSync('public/radar.png', 'dist/radar.png');
cpSync('public/zz-history.js', 'dist/zz-history.js');
cpSync('public/chain-logos.webp', 'dist/chain-logos.webp');
cpSync('public/protocol-logos', 'dist/protocol-logos', { recursive: true });
mkdirSync('dashboard', { recursive: true });
for (const dir of [
  'a-source',
  'a-model',
  'b-features',
  'c-app',
  'a-1-model',
  'a-2-features',
  'a-3-app',
  'a-2-board',
  'a-3-detail',
  'a-4-method',
  'a-5-pages',
  'a-6-app',
])
  rmSync(join('dashboard', dir), { recursive: true, force: true });
for (const name of [
  'app.js',
  'app.css',
  'zz-runtime.js',
  'zz-history.js',
  'radar.png',
  'chain-logos.webp',
  'assets',
  'protocol-logos',
])
  cpSync(join('dist', name), join('dashboard', name), { recursive: true });
writeFileSync('dashboard/index.html', page('../data.js'));

function includeSource(from, to) {
  mkdirSync(to, { recursive: true });
  for (const entry of readdirSync(from, { withFileTypes: true })) {
    const source = join(from, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'assets' && entry.name !== 'styles')
        includeSource(source, join(to, entry.name));
    } else if (/\.(jsx?|mjs)$/.test(entry.name)) {
      cpSync(source, join(to, entry.name.replace(/\.(jsx?|mjs)$/, '.txt')));
    }
  }
}
// The dossier shows source in path order and stops at 64 KiB (and at the first minified bundle),
// so every source folder is named to sort before app.css: the value model first,
// then the board and detail features, then shared UI.
includeSource('lib', 'dashboard/a-1-model');
includeSource('src/features/radar', 'dashboard/a-2-board');
includeSource('src/features/protocol', 'dashboard/a-3-detail');
includeSource('src/features/methodology', 'dashboard/a-4-method');
includeSource('src/features/monitor', 'dashboard/a-5-pages/radar');
includeSource('src/features/saved', 'dashboard/a-5-pages/saved');
for (const entry of readdirSync('src', { withFileTypes: true })) {
  if (entry.name === 'features') continue;
  const from = join('src', entry.name);
  if (entry.isDirectory()) includeSource(from, join('dashboard/a-6-app', entry.name));
  else if (/.(jsx?|mjs)$/.test(entry.name)) {
    mkdirSync('dashboard/a-6-app', { recursive: true });
    cpSync(from, join('dashboard/a-6-app', entry.name.replace(/.(jsx?|mjs)$/, '.txt')));
  }
}
console.log(
  `Built static dashboard with local React, Motion and TanStack runtime (${readFileSync('dist/zz-runtime.js').length.toLocaleString()} bytes).`,
);
