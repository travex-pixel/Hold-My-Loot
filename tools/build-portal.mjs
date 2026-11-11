// Builds the zip a game portal hosts. index.html stays the one source; this copies it and flips the portal switch.
//   node tools/build-portal.mjs [crazygames|poki] [--no-analytics]
// What changes in the copy:
//   - window.HML_PORTAL is set, which turns off links back to holdmyloot.com, Ko-fi, the install card, the leaderboard,
//     the service worker and self-update (see the PORTAL BUILD comment in index.html).
//   - Google Fonts are downloaded once and shipped inside the zip (Poki blocks outside requests by default; it also means
//     the game looks right even if a portal's CSP blocks fonts). Same fonts, same look.
//   - Head tags that point at holdmyloot.com or the site root (canonical, Open Graph, manifest, touch icon) are removed.
//   - Analytics: kept for CrazyGames (tagged portal=crazygames, still behind the consent card), removed for Poki unless
//     Poki approves PostHog for the game. --no-analytics removes it for any portal.
// Output: dist/<portal>/ (the files) and dist/hold-my-loot-<portal>-b<build>.zip, then a self-check that lists every
// outside URL left in the build.
import fs from 'fs'; import path from 'path'; import { execFileSync } from 'child_process';
const root = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const portal = (process.argv[2] && !process.argv[2].startsWith('--')) ? process.argv[2] : 'crazygames';
if (!['crazygames', 'poki'].includes(portal)) { console.error('portal must be crazygames or poki'); process.exit(1); }
const noAnalytics = process.argv.includes('--no-analytics') || portal === 'poki';
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const build = +(/name="hml-build" content="(\d+)"/.exec(html) || [])[1];
const out = path.join(root, 'dist', portal); fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(path.join(out, 'fonts'), { recursive: true });
const must = (re, what) => { if (!re.test(html)) { console.error('build-portal: could not find ' + what + ' in index.html'); process.exit(1); } };

// 1. the switch
must(/window\.HML_PORTAL = '';/, 'the HML_PORTAL line');
html = html.replace("window.HML_PORTAL = '';", `window.HML_PORTAL = '${portal}';`);
if (noAnalytics) { must(/window\.HML_ANALYTICS = \{ key: '[^']*'/, 'the analytics key'); html = html.replace(/window\.HML_ANALYTICS = \{ key: '[^']*'/, "window.HML_ANALYTICS = { key: ''"); }

// 2. head tags that point outside the portal
const drop = [/<link rel="canonical"[^>]*>\n?/, /<meta property="og:[^>]*>\n?/g, /<meta name="twitter:[^>]*>\n?/g, /<link rel="manifest"[^>]*>\n?/, /<link rel="apple-touch-icon"[^>]*>\n?/,
  /<link rel="preconnect" href="https:\/\/fonts\.[^>]*>\n?/g, /<link rel="preload" as="style" href="https:\/\/fonts\.googleapis\.com[^>]*>\n?/, /<noscript><link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*><\/noscript>\n?/];
for (const re of drop) html = html.replace(re, '');

// 3. fonts: fetch the same stylesheet the page uses, keep the latin and latin-ext faces, ship the files
const m = /<link rel="stylesheet" href="(https:\/\/fonts\.googleapis\.com\/css2[^"]+)"[^>]*>\n?/.exec(html);
if (!m) { console.error('build-portal: Google Fonts stylesheet link not found'); process.exit(1); }
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
const css = await (await fetch(m[1].replace(/&amp;/g, '&'), { headers: { 'User-Agent': UA } })).text();
const blocks = css.split('/* ').slice(1).map(b => ({ subset: b.slice(0, b.indexOf(' */')), body: b.slice(b.indexOf('@font-face')) })).filter(b => ['latin', 'latin-ext'].includes(b.subset));
let faces = '', n = 0; const seen = new Map();
for (const b of blocks) {
  const url = (/url\((https:[^)]+)\)/.exec(b.body) || [])[1]; if (!url) continue;
  let file = seen.get(url);
  if (!file) { file = 'fonts/f' + (++n) + '.woff2'; seen.set(url, file); const buf = Buffer.from(await (await fetch(url)).arrayBuffer()); fs.writeFileSync(path.join(out, file), buf); }
  faces += b.body.replace(url, file).trim() + '\n';
}
if (!faces) { console.error('build-portal: no font faces downloaded'); process.exit(1); }
html = html.replace(m[0], '<style>\n/* fonts shipped with the build (latin, latin-ext) */\n' + faces + '</style>\n');

// 4. files
fs.writeFileSync(path.join(out, 'index.html'), html);
// the privacy page without the parts a portal build doesn't have (leaderboard, Ko-fi)
fs.writeFileSync(path.join(out, 'privacy.html'), fs.readFileSync(path.join(root, 'privacy.html'), 'utf8').replace(/ *<!-- web-only -->[\s\S]*?<!-- \/web-only -->\n?/g, '').replace(/ *<a class="back"[^>]*>[^<]*<\/a>\n?/, ''));
fs.copyFileSync(path.join(root, 'icon-192.png'), path.join(out, 'icon-192.png'));   // the privacy page's tab icon
const zip = path.join(root, 'dist', `hold-my-loot-${portal}-b${build}.zip`); fs.rmSync(zip, { force: true });
execFileSync('zip', ['-qr9', zip, '.'], { cwd: out });

// 5. self-check: every outside URL still in the build, and the numbers portals ask about
const files = []; (function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); fs.statSync(p).isDirectory() ? walk(p) : files.push(p); } })(out);
const text = files.filter(f => /\.(html|js|css)$/.test(f)).map(f => fs.readFileSync(f, 'utf8')).join('\n');
const hosts = {}; for (const u of text.match(/https?:\/\/[a-z0-9.-]+\.[a-z]{2,}/gi) || []) hosts[u.replace(/^https?:\/\//, '')] = (hosts[u.replace(/^https?:\/\//, '')] || 0) + 1;
const size = files.reduce((a, f) => a + fs.statSync(f).size, 0);
console.log(JSON.stringify({ portal, build, analytics: !noAnalytics, files: files.length, bytes: size, zipBytes: fs.statSync(zip).size, fontFiles: n, outsideHosts: hosts, zip: path.relative(root, zip) }, null, 1));
