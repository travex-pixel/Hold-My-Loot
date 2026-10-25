// Startup budget check: mid-range Android on 4G. CPU 4x slowdown, 4G-ish network (9 Mbps down, 170 ms RTT).
// Reports: HTML bytes, time to first paint, to game object, to first interactive frame, and long tasks.
import { launch, newPage, VIEWPORTS, BASE } from './lib.mjs';
const vp = VIEWPORTS[process.argv[2] || 'px8'];
const browser = await launch();
const { ctx, page } = await newPage(browser, vp);
const cdp = await ctx.newCDPSession(page);
await cdp.send('Network.enable'); await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 170, downloadThroughput: 9e6 / 8, uploadThroughput: 3e6 / 8 });
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
await page.addInitScript(() => { window.__t0 = performance.now(); window.__long = []; try { new PerformanceObserver(l => l.getEntries().forEach(e => window.__long.push([Math.round(e.startTime), Math.round(e.duration)]))).observe({ type: 'longtask', buffered: true }); } catch (e) {} });
const t0 = Date.now();
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForFunction(() => window.__hml && window.__hml() && !document.getElementById('startBtn').disabled, null, { timeout: 60000 });
const interactive = Date.now() - t0;
const m = await page.evaluate(() => { const nav = performance.getEntriesByType('navigation')[0]; const fp = performance.getEntriesByType('paint').map(p => [p.name, Math.round(p.startTime)]); return { transfer: nav.transferSize, decoded: nav.decodedBodySize, domContentLoaded: Math.round(nav.domContentLoadedEventEnd), load: Math.round(nav.loadEventEnd), paint: fp, longTasks: window.__long.length, longTotal: window.__long.reduce((a, l) => a + l[1], 0), worst: window.__long.sort((a, b) => b[1] - a[1]).slice(0, 5), fonts: performance.getEntriesByType('resource').filter(r => /fonts\./.test(r.name)).map(r => [r.name.split('/')[2], Math.round(r.responseEnd)]) }; });
console.log(JSON.stringify({ viewport: vp.name, msToInteractive: interactive, ...m }, null, 1));
await browser.close();
