// Frame-exact gameplay capture. The page runs on Playwright's fake clock, so each frame advances the game by exactly
// 1/30 s no matter how slow the screenshot is, and every sound the game asks for is logged with its virtual time.
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
const { chromium } = createRequire(import.meta.url)('/opt/node-tools/node_modules/playwright');
export const BASE = process.env.HML_URL || 'http://127.0.0.1:8081/';
export const FPS = 30;
export const WORK = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', 'work');

export async function openBrowser() { return chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] }); }

// meta: object written to localStorage before load (null = brand-new player)
export async function openGame(browser, { meta = null, run = null, toasts = false, bossbar = true, width = 360, height = 640, scale = 3, startTime = Date.UTC(2026, 10, 9, 9, 0, 0) } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: scale, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36' });
  await ctx.addInitScript(([m, r]) => {
    try { localStorage.clear(); if (m) localStorage.setItem('hml.meta.v3', JSON.stringify(m)); if (r) localStorage.setItem('hml.run.v4', JSON.stringify(r)); } catch (e) {}
    window.HML_ANALYTICS = { key: '' };
  }, [meta, run]);
  const page = await ctx.newPage();
  await page.route(/posthog\.com/, r => r.fulfill({ status: 200, body: '{}' }));
  await page.clock.install({ time: startTime });
  page.errors = []; page.on('pageerror', e => page.errors.push(String(e)));
  await page.goto(BASE, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  if (!toasts) await page.addStyleTag({ content: '#toasts{visibility:hidden!important}' });
  if (!bossbar) await page.addStyleTag({ content: '#bossbar{visibility:hidden!important}' });
  // analytics off, sound log on
  await page.evaluate(() => {
    window.__snd = []; window.__shotT0 = Date.now();
    const log = (k, n, a) => window.__snd.push({ k, n, a: typeof a === 'number' ? a : undefined, t: Date.now() - window.__shotT0 });
    const p = SFX.play, m = SFX.music, s = SFX.sting;
    SFX.play = (n, a) => { log('sfx', n, a); return p(n, a); };
    SFX.music = n => { log('music', n); return m(n); };
    SFX.sting = (n, then) => { log('sting', n); return s(n, then); };
  });
  // freeze time: from here on the game only moves when we say so
  const now = await page.evaluate(() => Date.now());
  await page.clock.pauseAt(now + 500);
  await page.clock.runFor(400);
  return { ctx, page };
}

// Capture `secs` of footage into work/shots/<name>/NNNNN.jpg. actions: { frameNumber: async (page, f) => {} }
// every: optional async (page, f) called each frame before the screenshot.
export async function captureShot(page, name, secs, { actions = {}, every = null, quality = 88, step = 1000 / FPS } = {}) {
  const dir = path.join(WORK, 'shots', name); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  await page.evaluate(() => { window.__snd = []; window.__shotT0 = Date.now(); });
  const n = Math.round(secs * FPS), t0 = Date.now();
  for (let f = 0; f < n; f++) {
    if (actions[f]) await actions[f](page, f);
    if (every) await every(page, f);
    await page.screenshot({ path: path.join(dir, String(f).padStart(5, '0') + '.jpg'), type: 'jpeg', quality, caret: 'initial' });
    await page.clock.runFor(step);
  }
  const snd = await page.evaluate(() => window.__snd);
  // the shot plays at real speed; if step != 1000/FPS the virtual time is scaled
  const k = (1000 / FPS) / step;
  fs.writeFileSync(path.join(dir, 'sound.json'), JSON.stringify(snd.map(e => Object.assign(e, { t: Math.round(e.t * k) }))));
  fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify({ frames: n, fps: FPS, secs, errors: page.errors.slice(0, 5) }));
  return { frames: n, ms: Date.now() - t0, sounds: snd.length };
}

// helpers usable inside actions
export const G = page => page.evaluate(() => window.__hml());
export async function run(page, ms) { await page.clock.runFor(ms); }
export async function clickSel(page, sel) { await page.click(sel, { force: true, timeout: 4000 }).catch(() => console.log('  click failed', sel)); }
export async function tapCanvas(page, x, y) { const p = await page.evaluate(([x, y]) => { const r = document.getElementById('cv').getBoundingClientRect(); return { x: r.left + x * r.width / W, y: r.top + y * r.height / H }; }, [x, y]); await page.mouse.click(p.x, p.y); }
