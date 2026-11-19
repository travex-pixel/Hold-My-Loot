// Service worker + self-update, end to end. A local server plays GitHub Pages and can change the build it serves and
// how slowly it serves the page. Proves: (1) after one visit the game opens with no network, (2) a new build reaches
// that copy on the next online visit, (3) it still arrives when the network is slower than the worker's timeout.
import http from 'http'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
import { createRequire } from 'module';
const { chromium } = createRequire(import.meta.url)('/opt/node-tools/node_modules/playwright');
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const html0 = fs.readFileSync(path.join(root, 'index.html'), 'utf8'), base = +/name="hml-build" content="(\d+)"/.exec(html0)[1];
let build = base, delay = 0;
const page = () => html0.replace(/name="hml-build" content="\d+"/, 'name="hml-build" content="' + build + '"').replace(/window\.HML_BUILD = \d+;/, 'window.HML_BUILD = ' + build + ';');
const srv = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x'); let p = u.pathname; if (p.endsWith('/')) p += 'index.html';
  if (p === '/index.html') { setTimeout(() => { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'max-age=600' }); res.end(page()); }, u.searchParams.has('t') ? 0 : delay); return; }
  const f = path.join(root, p); if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': p.endsWith('.js') ? 'text/javascript' : p.endsWith('.json') ? 'application/json' : p.endsWith('.html') ? 'text/html; charset=utf-8' : 'image/png', 'Cache-Control': 'max-age=600' }); res.end(fs.readFileSync(f));
}).listen(0);
const URL0 = 'http://127.0.0.1:' + srv.address().port + '/?ref=homescreen';
const b = await chromium.launch(); const ctx = await b.newContext(); await ctx.route(/posthog|googleapis|gstatic/, r => r.abort());
const p = await ctx.newPage(); const results = []; const check = (name, ok, extra) => { results.push([name, ok]); console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); };
const shown = async () => { for (let k = 0; k < 20; k++) { try { return await p.evaluate(() => window.HML_BUILD); } catch (e) { await p.waitForTimeout(250); } } return 0; };
// every page load records its build, so a reload by the update check can't be missed or mis-read
await ctx.addInitScript(() => addEventListener('DOMContentLoaded', () => { try { const l = JSON.parse(sessionStorage.getItem('builds') || '[]'); l.push(window.HML_BUILD); sessionStorage.setItem('builds', JSON.stringify(l)); } catch (e) {} }));
const loads = async () => { for (let k = 0; k < 20; k++) { try { return await p.evaluate(() => JSON.parse(sessionStorage.getItem('builds') || '[]')); } catch (e) { await p.waitForTimeout(250); } } return []; };
await p.goto(URL0); await p.waitForFunction(() => navigator.serviceWorker && navigator.serviceWorker.controller, null, { timeout: 15000 }).catch(() => {});
check('service worker controls the page after the first visit', await p.evaluate(() => !!navigator.serviceWorker.controller));
await ctx.setOffline(true); await p.reload({ waitUntil: 'load' }).catch(() => {});
check('opens with no network', await p.evaluate(() => !!window.__hml).catch(() => false) && await shown() === base, 'build ' + await shown().catch(() => '?'));
await ctx.setOffline(false); build = base + 1;
await p.goto(URL0, { waitUntil: 'load' }); await p.waitForTimeout(1500);
check('a new build reaches the installed copy on the next online visit', await shown() === base + 1, 'build ' + await shown());
build = base + 2; delay = 6000;   // slower than the worker's 4 s timeout: cache answers first, the page's own check catches up
const before = (await loads()).length; await p.goto(URL0, { waitUntil: 'load' });
await p.waitForFunction(b2 => window.HML_BUILD === b2, base + 2, { timeout: 30000 }).catch(() => {});
const seq = (await loads()).slice(before);
check('on a slow network the old copy opens, then the update check reloads into the new build', seq[0] === base + 1 && await shown() === base + 2, 'loads ' + seq.join(' > ') + ', url ' + p.url().split('/').pop());
delay = 0; await ctx.setOffline(true); await p.goto(URL0, { waitUntil: 'load' }).catch(() => {});
check('offline after the update opens the newest build', await shown().catch(() => 0) === base + 2);
// visiting another page (the privacy page) must never replace the cached game
await ctx.setOffline(false); await p.goto(URL0.replace('/?ref=homescreen', '/privacy.html'), { waitUntil: 'load' });
await ctx.setOffline(true); await p.goto(URL0, { waitUntil: 'load' }).catch(() => {});
check('after opening the privacy page, offline still opens the game', await p.evaluate(() => !!window.__hml).catch(() => false) && await shown().catch(() => 0) === base + 2);
await p.goto(URL0.replace('/?ref=homescreen', '/privacy.html'), { waitUntil: 'load' }).catch(() => {});
check('the privacy page opens offline once seen', /Privacy/.test(await p.title().catch(() => '')));
await b.close(); srv.close();
process.exit(results.every(r => r[1]) ? 0 : 1);
