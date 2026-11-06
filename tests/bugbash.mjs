// Bug bash: fuzzed inputs and hostile environments. Each check is a regression test for something that broke or could.
// Usage: node tests/bugbash.mjs   (needs node tests/serve.mjs 8081 running)
import fs from 'fs';
import { loadSim } from './load-sim.mjs';
import { launch, BASE, settle, VIEWPORTS } from './lib.mjs';
const results = []; const check = (name, ok, extra) => { results.push(ok); console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra ? '  (' + extra + ')' : '')); };

// ---- 1. simulation: Dazza's splash must not tick Gav's spikes (the corrupted paste fixed in build 31) ----
{ const S = loadSim(); const meta = Object.assign(S.defaultMeta(), { wins: 20 });
  const G = S.newRun(meta, 7, 0, 'campaign'); G.gold = 99999; G.crew = ['chuck', 'gav', 'nan', 'bonk', 'sizzle', 'jezza'];
  // Dazza splashes from tier 2; both go on the open pallets nearest the road so spikes and splashes meet
  const near = G.map.pads.map((p, i) => [i, S.padRoadDist(G.map, p)]).filter(([i]) => !(G.padLock && G.padLock[i])).sort((a, b) => a[1] - b[1]);
  S.build(G, near[0][0], 'chuck'); S.build(G, near[1][0], 'gav'); S.upgrade(G, near[0][0]); S.upgrade(G, near[0][0]); S.startWave(G);
  let bad = 0, frames = 0, splashes = 0; const dt = 1 / 60;
  while (!G.over && frames < 60 * 90) {
    const before = new Map((G.spikes || []).map(sp => [sp.id, sp.life]));
    const nProj = (G.projs || []).filter(p => p.splash).length;
    S.update(G, dt); frames++;
    if (nProj) splashes++;
    for (const sp of G.spikes || []) if (before.has(sp.id) && Math.abs(before.get(sp.id) - sp.life - dt) > 1e-6) bad++;
    if (!G.waveActive && !G.over) S.startWave(G);
  }
  check('sim: spikes age exactly one frame per frame while Dazza splashes', bad === 0 && splashes > 30 && G.spikes.length + G.towers.filter(Boolean).length > 1, bad + ' bad ticks over ' + frames + ' frames, ' + splashes + ' frames with splashes in flight');
  check('sim: gold, pile and HP stay finite through a long run', Number.isFinite(G.gold) && Number.isFinite(G.pile) && G.enemies.every(e => Number.isFinite(e.hp)));
}

// ---- browser scenarios ----
const browser = await launch();
const b30 = fs.readFileSync(new URL('./fixtures/save-build30.json', import.meta.url), 'utf8');
async function open(opts = {}) {
  const vp = opts.vp || VIEWPORTS.se;
  const ctx = await browser.newContext({ viewport: vp.viewport, deviceScaleFactor: 1, isMobile: true, hasTouch: true, userAgent: opts.ua || vp.userAgent });
  if (opts.save !== false) await ctx.addInitScript(s => { if (sessionStorage.getItem('x')) return; sessionStorage.setItem('x', 1); localStorage.clear(); localStorage.setItem('hml.meta.v3', s); }, b30);
  if (opts.init) await ctx.addInitScript(opts.init);
  const page = await ctx.newPage(); page.errors = [];
  page.on('pageerror', e => page.errors.push(String(e))); page.on('console', m => { if (m.type() === 'error' && !/net::ERR|Failed to load resource/.test(m.text())) page.errors.push('console: ' + m.text()); });
  if (opts.block) await page.route(opts.block, r => r.abort()); else await page.route(/posthog/, r => r.fulfill({ status: 200, body: '{}' }));
  await page.goto(BASE, { waitUntil: 'load' }); await settle(page, 1300);
  return { ctx, page };
}
const startLevel = async (page, i = null) => {
  await page.evaluate(i => { const b = i == null ? document.getElementById('playNext') : document.querySelector('.level[data-map="' + i + '"]'); if (b) b.click(); }, i); await settle(page, 400);
  await page.evaluate(() => document.getElementById('lvPlay') && document.getElementById('lvPlay').click()); await settle(page, 1000);
};
const sane = page => page.evaluate(() => { const g = window.__hml(); if (!g) return 'no game'; const bad = [];
  if (!Number.isFinite(g.gold) || g.gold < 0) bad.push('gold ' + g.gold); if (!Number.isFinite(g.pile) || g.pile < 0 || g.pile > g.pileMax) bad.push('pile ' + g.pile);
  if (g.towers.length !== g.map.pads.length) bad.push('towers length'); if (g.enemies.some(e => !Number.isFinite(e.x) || !Number.isFinite(e.hp))) bad.push('enemy NaN'); return bad.join(', '); });
const canvasXY = (page, x, y) => page.evaluate(([x, y]) => { const r = document.getElementById('cv').getBoundingClientRect(); return { x: r.left + x * r.width / 360, y: r.top + y * r.height / 600 }; }, [x, y]);

// 2. double taps everywhere: pads, build cards, Start, upgrade
{ const { ctx, page } = await open(); await startLevel(page);
  const pads = await page.evaluate(() => window.__hml().map.pads.slice(0, 6));
  for (const p of pads) { const c = await canvasXY(page, p[0], p[1]); await page.mouse.dblclick(c.x, c.y); await settle(page, 120);
    const card = await page.$('#sheet .bcard:not(.poor):not(.far)'); if (card) { await card.dblclick({ force: true }).catch(() => {}); await settle(page, 150); } }
  await page.dblclick('#startBtn', { force: true }).catch(() => {}); await settle(page, 300);
  const g = await page.evaluate(() => { const g = window.__hml(); return { towers: g.towers.filter(Boolean).length, gold: g.gold, wave: g.wave, waves: g.waveActive }; });
  check('double taps: no doubled builds, gold never negative, one wave started', g.gold >= 0 && g.wave <= 1 && (await sane(page)) === '', JSON.stringify(g));
  check('double taps: no page errors', page.errors.length === 0, page.errors[0]);
  await ctx.close(); }

// 3. two fingers at once (multitouch) on the board and the sheet
{ const { ctx, page } = await open(); await startLevel(page);
  const cdp = await ctx.newCDPSession(page);
  const a = await canvasXY(page, 100, 200), b = await canvasXY(page, 260, 380);
  for (let k = 0; k < 12; k++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: a.x, y: a.y, id: 1 }, { x: b.x, y: b.y, id: 2 }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: a.x + 20, y: a.y + 30, id: 1 }, { x: b.x - 15, y: b.y - 10, id: 2 }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await settle(page, 60);
  }
  check('multitouch: two-finger taps and drags cause no errors or bad state', page.errors.length === 0 && (await sane(page)) === '', page.errors[0] || await sane(page));
  await ctx.close(); }

// 4. rotate mid-wave, twice
{ const { ctx, page } = await open(); await startLevel(page);
  await page.evaluate(() => { const g = window.__hml(); g.gold = 9999; build(g, 1, 'chuck'); build(g, 2, 'nan'); startWave(g); }); await settle(page, 1500);
  await page.setViewportSize({ width: 667, height: 375 }); await settle(page, 900);
  const land = await page.evaluate(() => { const r = document.getElementById('cv').getBoundingClientRect(); return r.height <= innerHeight + 1 && r.width > 100; });
  await page.setViewportSize({ width: 375, height: 667 }); await settle(page, 900);
  const port = await page.evaluate(() => { const r = document.getElementById('cv').getBoundingClientRect(); return r.width <= innerWidth + 1 && r.height > 200; });
  check('rotate mid-wave: the board re-fits both ways and the wave carries on', land && port && (await page.evaluate(() => window.__hml().waveActive || window.__hml().wave > 1)) && page.errors.length === 0, page.errors[0]);
  await ctx.close(); }

// 5. go to the background during a boss, come back
{ const { ctx, page } = await open(); await startLevel(page, 0);
  await page.evaluate(() => { const g = window.__hml(); g.gold = 9999; build(g, 1, 'nan'); g.wave = g.waveCount - 1; startWave(g); });
  for (let i = 0; i < 30 && !(await page.evaluate(() => window.__hml().enemies.some(e => e.boss))); i++) await settle(page, 300);
  const hadBoss = await page.evaluate(() => window.__hml().enemies.some(e => e.boss));
  const hide = h => page.evaluate(h => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => h ? 'hidden' : 'visible' }); Object.defineProperty(document, 'hidden', { configurable: true, get: () => h }); document.dispatchEvent(new Event('visibilitychange')); window.dispatchEvent(new Event(h ? 'pagehide' : 'pageshow')); }, h);
  const t0 = await page.evaluate(() => window.__hml().t); await hide(true); await settle(page, 2500);
  const t1 = await page.evaluate(() => window.__hml().t); await hide(false); await settle(page, 1200);
  const t2 = await page.evaluate(() => window.__hml().t);
  check('background during a boss: the game pauses while hidden', hadBoss && t1 - t0 < .6, 'advanced ' + (t1 - t0).toFixed(2) + ' s while hidden');
  const pausedBack = t2 - t1 < .6; await page.click('#pauseBtn', { force: true }); await settle(page, 1200); const t3 = await page.evaluate(() => window.__hml().t);
  check('background during a boss: back in the app it stays paused until you tap Pause, then carries on', pausedBack && t3 > t2 && page.errors.length === 0, page.errors[0]);
  await ctx.close(); }

// 6. ad blocker: analytics, fonts and Ko-fi all blocked
{ const { ctx, page } = await open({ block: /posthog|googleapis|gstatic|ko-fi|supabase/ }); await startLevel(page);
  await page.evaluate(() => { const g = window.__hml(); g.gold = 9999; build(g, 1, 'chuck'); startWave(g); }); await settle(page, 2000);
  check('ad blocker: the game starts and plays with analytics and fonts blocked', (await page.evaluate(() => window.__hml().waveActive || window.__hml().wave > 1)) && page.errors.length === 0, page.errors[0]);
  await ctx.close(); }

// 7. an old Android WebView: modern APIs missing
{ const { ctx, page } = await open({ save: false, ua: 'Mozilla/5.0 (Linux; Android 8.1.0; SM-J260G Build/M1AJB; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/69.0.3497.100 Mobile Safari/537.36',
    init: () => { for (const k of ['structuredClone', 'requestIdleCallback', 'ResizeObserver', 'IntersectionObserver']) { try { delete window[k]; } catch (e) {} window[k] = undefined; }
      try { delete Array.prototype.at; delete String.prototype.at; delete Object.hasOwn; delete String.prototype.replaceAll; delete Array.prototype.findLast; } catch (e) {}
      try { Object.defineProperty(crypto, 'randomUUID', { value: undefined }); } catch (e) {}
      try { Object.defineProperty(navigator, 'share', { value: undefined }); Object.defineProperty(navigator, 'vibrate', { value: undefined }); } catch (e) {}
      try { Object.defineProperty(navigator, 'serviceWorker', { value: undefined }); } catch (e) {} } });
  await settle(page, 800);
  const started = await page.evaluate(() => !!window.__hml() && window.__hml().map && window.__hml().map.id === 'nap');
  await page.evaluate(() => { const g = window.__hml(); if (g) { g.gold = 999; build(g, 2, 'chuck'); startWave(g); } }); await settle(page, 2500);
  check('old WebView (Chrome 69, no structuredClone/at/replaceAll/randomUUID/idle callbacks/observers/service worker): first game starts and runs', started && (await sane(page)) === '' && page.errors.length === 0, page.errors[0]);
  await ctx.close(); }

// 8. 400 random taps over everything (menus included), then sanity
{ const { ctx, page } = await open(); await startLevel(page);
  let seed = 12345; const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  const vw = 375, vh = 667;
  for (let i = 0; i < 400; i++) {
    const x = rnd() * vw, y = rnd() * vh;
    if (rnd() < .15) await page.mouse.dblclick(x, y); else await page.mouse.click(x, y);
    if (i % 40 === 0) await settle(page, 200);
    if (i % 100 === 99) await page.evaluate(() => { const g = window.__hml(); if (g && !g.waveActive && !g.over) { g.gold += 300; } });
  }
  await settle(page, 800);
  const bad = await sane(page).catch(e => String(e));
  check('400 random taps: no errors and the game state is sane', page.errors.length === 0 && (bad === '' || bad === 'no game'), page.errors[0] || bad);
  await ctx.close(); }

await browser.close();
console.log(results.every(Boolean) ? 'ALL PASS' : 'SOME FAILED');
process.exit(results.every(Boolean) ? 0 : 1);
