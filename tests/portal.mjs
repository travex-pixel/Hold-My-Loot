// The portal build, the way a portal runs it: built by tools/build-portal.mjs, served from another origin under a
// sub-folder, inside an iframe at the portal's sizes, with every request outside that origin blocked and recorded.
// Usage: node tests/portal.mjs [crazygames]   (builds dist/ first; needs network once for the fonts)
import http from 'http'; import fs from 'fs'; import path from 'path'; import { execFileSync } from 'child_process';
import { launch, settle } from './lib.mjs';
const root = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const portal = process.argv[2] || 'crazygames';
execFileSync('node', [path.join(root, 'tools/build-portal.mjs'), portal], { stdio: 'ignore' });
const dir = path.join(root, 'dist', portal);
const results = []; const check = (name, ok, extra) => { results.push(ok); console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra ? '  (' + extra + ')' : '')); };

// the portal's file host: the build under /games/hold-my-loot/, with a fake Ko-fi link switched on to prove portal mode hides it
const types = { '.html': 'text/html; charset=utf-8', '.woff2': 'font/woff2', '.js': 'text/javascript' };
const files = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x'); const rel = u.pathname.replace(/^\/games\/hold-my-loot\//, ''); const f = path.join(dir, rel || 'index.html');
  if (!u.pathname.startsWith('/games/hold-my-loot/') || !f.startsWith(dir) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  let body = fs.readFileSync(f); if (f.endsWith('index.html')) body = body.toString().replace("window.HML_SUPPORT = { url: ''", "window.HML_SUPPORT = { url: 'https://ko-fi.com/test-portal'");
  res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); res.end(body);
}).listen(0);
const gameUrl = 'http://127.0.0.1:' + files.address().port + '/games/hold-my-loot/index.html';
// the portal's own page (a different origin) with the game in an iframe
const host = http.createServer((req, res) => { const q = new URL(req.url, 'http://x').searchParams;
  res.writeHead(200, { 'Content-Type': 'text/html' }); res.end(`<!doctype html><body style="margin:0;background:#111"><iframe id="g" src="${gameUrl}" width="${q.get('w')}" height="${q.get('h')}" style="border:0;display:block" allow="autoplay; fullscreen; gamepad"></iframe></body>`); }).listen(0);
const hostUrl = (w, h) => 'http://localhost:' + host.address().port + '/?w=' + w + '&h=' + h;

const browser = await launch();
async function open(w, h, fresh = true) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  // capture what Share would send: the share sheet takes the text (no file sharing), the clipboard as a fallback
  await ctx.addInitScript(() => { window.__shared = []; try { navigator.share = d => { window.__shared.push(d.text || ''); return Promise.resolve(); }; navigator.canShare = () => false; navigator.clipboard.writeText = t => { window.__shared.push(t); return Promise.resolve(); }; } catch (e) {} });
  const page = await ctx.newPage(); page.errors = []; const outside = [], analytics = [];
  page.on('pageerror', e => page.errors.push(String(e)));
  await page.route('**/*', r => { const u = r.request().url();
    if (u.startsWith('http://127.0.0.1:' + files.address().port + '/') || u.startsWith('http://localhost:' + host.address().port + '/') || u.startsWith('data:')) return r.continue();
    if (/posthog\.com/.test(u)) { analytics.push(u); return r.fulfill({ status: 200, body: '{}' }); }
    outside.push(u); return r.abort(); });
  await page.goto(hostUrl(w, h), { waitUntil: 'load' });
  const frame = page.frames().find(f => f.url().startsWith(gameUrl));
  await frame.waitForFunction(() => window.__hml && window.__hml(), null, { timeout: 15000 });
  await settle(page, 1500);
  return { ctx, page, frame, outside, analytics };
}

// 1. a brand-new player at the smallest desktop frame plays the coached first game with a mouse
{ const { ctx, page, frame, outside } = await open(907, 510);
  const box = await (await page.$('#g')).boundingBox();
  check('907x510 iframe: the game boots inside the portal frame', !!(await frame.evaluate(() => !!window.__hml())) && page.errors.length === 0, page.errors[0]);
  check('it is in portal mode', await frame.evaluate(() => window.HML_PORTAL) === portal);
  check('the bundled fonts load (same look, no Google request)', await frame.evaluate(async () => { await document.fonts.ready; return document.fonts.check('800 24px Fraunces') && document.fonts.check('800 16px Nunito') && [...document.fonts].some(f => f.status === 'loaded' && /Fraunces/.test(f.family)); }));
  for (let i = 0; i < 400; i++) {
    await settle(page, 250);
    const st = await frame.evaluate(() => { const c = document.getElementById('coach'), g = window.__hml(); const r = c.getBoundingClientRect(); return { coach: c.hidden ? '' : c.textContent, ring: c.classList.contains('ring'), x: r.left + r.width / 2, y: r.top, h: r.height, modal: !document.getElementById('modal').hidden, over: !g || g.over }; });
    if (st.modal || st.over) break;
    if (st.coach && !/Speed up|TRY THIS/i.test(st.coach)) await page.mouse.click(box.x + st.x, box.y + st.y + (st.ring ? 30 : st.h + 18));
  }
  await frame.waitForFunction(() => !document.getElementById('modal').hidden, null, { timeout: 20000 }).catch(() => {});
  await settle(page, 1500);
  if (await frame.$('#revOk')) { await settle(page, 900); await frame.click('#revOk', { force: true }); await settle(page, 1500); }
  const res = await frame.evaluate(() => { const g = window.__hml(); return { won: g && g.won, pile: g && g.pile, stars: document.querySelectorAll('.rstar.on').length }; });
  check('907x510 iframe: a mouse player following the coach wins the first game with 3 stars', res.won && res.stars === 3, JSON.stringify(res));
  await frame.evaluate(() => { const b = document.getElementById('shareBtn'); if (b) { b.dataset.down = '1'; b.click(); } }); await settle(page, 800);
  const shared = await frame.evaluate(() => window.__shared.join('\n'));
  check('a shared result carries no link to the web version', shared.length > 0 && !/https?:\/\//.test(shared) && !/holdmyloot\.com/i.test(shared), JSON.stringify(shared.slice(0, 90)));
  check('no request left the portal (fonts, holdmyloot.com, Ko-fi, Supabase)', outside.length === 0, outside.slice(0, 3).join(' '));
  check('no service worker, no self-update request', await frame.evaluate(async () => !navigator.serviceWorker || (await navigator.serviceWorker.getRegistrations()).length === 0) && !outside.concat(await frame.evaluate(() => performance.getEntriesByType('resource').map(e => e.name))).some(u => /\?t=\d/.test(u)));
  await ctx.close(); }

// 2. a returning player at two more sizes: home, Settings and results show no link out and no Ko-fi
for (const [w, h] of [[1280, 720], [800, 450]]) {
  const { ctx, page, frame, outside } = await open(w, h);
  await frame.evaluate(() => { const m = window.__hmlSave.meta(); m.runs = 6; m.wins = 6; m.sessions = 4; m.settings.analytics = false; });
  await frame.evaluate(() => { location.reload(); }).catch(() => {}); await settle(page, 600);
  const fr = page.frames().find(f => f.url().startsWith(gameUrl)); await fr.waitForFunction(() => window.__hml, null, { timeout: 15000 }); await settle(page, 1500);
  const texts = []; const links = [];
  const grab = async () => { texts.push(await fr.evaluate(() => document.body.innerText)); links.push(...await fr.evaluate(() => [...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href')))); };
  await grab();
  await fr.evaluate(() => openMenu ? 0 : 0).catch(() => {});
  await fr.evaluate(() => { const g = document.getElementById('homeGear') || document.getElementById('homeSettings'); if (g) g.click(); }); await settle(page, 500); await grab();
  const all = texts.join('\n');
  check(`${w}x${h}: no "holdmyloot.com" on screen, no Ko-fi, no install card`, !/holdmyloot\.com/i.test(all) && !/ko-fi|snag/i.test(all) && !/home screen/i.test(all) && !links.some(l => /ko-fi|^https?:/.test(l)), links.filter(l => l !== 'privacy.html').join(' '));
  check(`${w}x${h}: the privacy page is in the build`, links.includes('privacy.html'));
  check(`${w}x${h}: nothing requested outside the portal`, outside.length === 0 && page.errors.length === 0, outside[0] || page.errors[0]);
  await ctx.close();
}

// 3. the zip itself
const zip = fs.readdirSync(path.join(root, 'dist')).find(f => f.startsWith('hold-my-loot-' + portal) && f.endsWith('.zip'));
const zbytes = fs.statSync(path.join(root, 'dist', zip)).size;
check('the zip is far under the portal limits (CrazyGames: 50 MB initial download, 1,500 files)', zbytes < 2e6 && fs.readdirSync(dir).length < 20, Math.round(zbytes / 1024) + ' KB');

await browser.close(); files.close(); host.close();
console.log(results.every(Boolean) ? 'ALL PASS' : 'SOME FAILED');
process.exit(results.every(Boolean) ? 0 : 1);
