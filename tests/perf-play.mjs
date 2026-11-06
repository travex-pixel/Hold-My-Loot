// Play-time budget: frame rate in the busiest wave on an iPhone SE-sized screen, memory across ten levels, layout shift.
// The busiest wave: The Final Nap's last wave with a full crew at tier 3+, every effect on.
// CPU is throttled 2x (a 2020 iPhone SE is roughly half a desktop core for this workload). Usage: node tests/perf-play.mjs
import fs from 'fs';
import { launch, newPage, VIEWPORTS, BASE, settle } from './lib.mjs';
const b30 = fs.readFileSync(new URL('./fixtures/save-build30.json', import.meta.url), 'utf8');
const browser = await launch(); const results = []; const report = {};
const check = (name, ok, extra) => { results.push(ok); console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra ? '  (' + extra + ')' : '')); };
const { ctx, page } = await newPage(browser, VIEWPORTS.se);
await ctx.addInitScript(s => { if (sessionStorage.getItem('x2')) return; sessionStorage.setItem('x2', 1); localStorage.clear(); const m = JSON.parse(s); m.wins = 28; m.maps = m.maps || {}; for (const id of 'nap paddock creek camp garden lanes woods bigday servo tide smoko longpad maze pubcrawl office ratking revenge finalnap scrap storm factory rink cliff sink tramp lawn bridge eclipse'.split(' ')) m.maps[id] = Object.assign({ wins: 1, stars: 3 }, m.maps[id] || {}); localStorage.setItem('hml.meta.v3', JSON.stringify(m)); }, b30);
await page.addInitScript(() => { window.__cls = 0; window.__clsSrc = []; try { new PerformanceObserver(l => l.getEntries().forEach(e => { if (!e.hadRecentInput) { window.__cls += e.value; if (e.value > .01) window.__clsSrc.push([+e.value.toFixed(3), (e.sources || []).map(x => x.node ? (x.node.id || x.node.className || x.node.nodeName) : '?').join('|')]); } })).observe({ type: 'layout-shift', buffered: true }); } catch (e) {} });
const cdp = await ctx.newCDPSession(page);
await page.goto(BASE, { waitUntil: 'load' }); await settle(page, 1500);
report.clsLoad = await page.evaluate(() => +window.__cls.toFixed(4));
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 2 });

// start a level through the UI so the real code path runs
async function level(i) {
  await page.click('.level[data-map="' + i + '"]', { timeout: 5000 }).catch(() => {}); await settle(page, 400);
  await page.click('#lvPlay', { timeout: 5000 }).catch(() => {}); await settle(page, 900);
  return page.evaluate(() => !!window.__hml());
}
const fps = secs => page.evaluate(s => new Promise(res => { const ts = []; let last = performance.now(); const t0 = last;
  const f = now => { ts.push(now - last); last = now; if (now - t0 < s * 1000) requestAnimationFrame(f); else { ts.sort((a, b) => a - b); const avg = ts.reduce((a, b) => a + b, 0) / ts.length; res({ frames: ts.length, avgMs: +avg.toFixed(2), p95: +ts[Math.floor(ts.length * .95)].toFixed(1), fps: +(1000 / avg).toFixed(1), slow: ts.filter(x => x > 33).length }); } };
  requestAnimationFrame(f); }), secs);

// 1. busiest wave
await level(17);
const crowd = await page.evaluate(() => { const g = window.__hml(); g.gold = 1e6;
  const types = ['nan', 'chuck', 'bonk', 'sizzle', 'jezza', 'bev']; g.crew = types;
  g.map.pads.forEach((p, i) => { if (!g.towers[i] && !(g.padLock && g.padLock[i])) { build(g, i, types[i % types.length]); for (let k = 0; k < 3; k++) upgrade(g, i); } });
  g.wave = g.waveCount - 1; startWave(g); return g.towers.filter(Boolean).length; });
await settle(page, 6000);
const busy = await page.evaluate(() => ({ enemies: window.__hml().enemies.length }));
await cdp.send('Performance.enable'); const m0 = await cdp.send('Performance.getMetrics');
const f = await fps(8);
const m1 = await cdp.send('Performance.getMetrics'); const met = (m, k) => m.metrics.find(x => x.name === k).value;
const scriptMs = +((met(m1, 'ScriptDuration') - met(m0, 'ScriptDuration')) * 1000 / f.frames).toFixed(1);
report.busiestWave = Object.assign({ towers: crowd, enemies: busy.enemies, scriptMsPerFrame: scriptMs, note: 'rAF fps here is headless Chromium without a GPU; phones draw the canvas on the GPU' }, f);
check('busiest wave: the game\u2019s own work per frame fits a 60 fps frame at 2x CPU throttle (<= 14 of 16.7 ms)', scriptMs <= 14, scriptMs + ' ms script per frame; headless rAF ' + f.fps + ' fps');

// 2. memory across ten levels: play a wave of each, quit to the home screen the way a player does, measure after GC
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
const quit = async () => { await page.click('#menuBtn', { timeout: 3000 }).catch(() => page.evaluate(() => document.getElementById('menuBtn').click())); await settle(page, 300); await page.click('[data-tab="settings"]').catch(() => {}); await settle(page, 200);
  await page.click('#quitBtn', { timeout: 3000 }).catch(() => {}); await settle(page, 600); };
await quit();
const heap = [];
for (let i = 0; i < 10; i++) {
  const ok = await level(i);
  await page.evaluate(() => { const g = window.__hml(); if (g) { g.gold = 2000; build(g, 1, 'chuck'); build(g, 2, 'nan'); startWave(g); } });
  await settle(page, 2500);
  await quit();
  await cdp.send('HeapProfiler.collectGarbage');
  const u = await cdp.send('Runtime.getHeapUsage'); heap.push(Math.round(u.usedSize / 1048576 * 10) / 10);
  if (!ok) break;
}
report.heapMB = heap;
const grow = heap.length >= 10 ? heap[9] - heap[2] : 99;
check('memory across ten levels: no steady growth (level 10 within 8 MB of level 3, after GC)', heap.length >= 10 && grow < 8, heap.join(' > ') + ' MB');
report.clsPlay = await page.evaluate(() => +window.__cls.toFixed(4));
report.clsSources = await page.evaluate(() => window.__clsSrc.slice(0, 12));
check('layout shift: CLS under 0.05 from load through ten levels', report.clsPlay < .05, 'load ' + report.clsLoad + ', after play ' + report.clsPlay);
check('no page errors', page.errors.length === 0, page.errors[0]);
fs.mkdirSync('review', { recursive: true }); fs.writeFileSync('review/perf-play.json', JSON.stringify(report, null, 1));
await browser.close();
console.log(results.every(Boolean) ? 'ALL PASS' : 'SOME FAILED');
process.exit(results.every(Boolean) ? 0 : 1);
