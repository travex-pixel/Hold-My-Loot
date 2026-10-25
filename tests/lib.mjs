// Shared Playwright helpers for Hold My Loot tours and tests.
import { createRequire } from 'module';
const { chromium, devices } = createRequire(import.meta.url)('/opt/node-tools/node_modules/playwright');
import fs from 'fs';

export const BASE = process.env.HML_URL || 'http://127.0.0.1:8080/';
export const VIEWPORTS = {
  se: { name: 'iPhone SE', viewport: { width: 375, height: 667 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: devices['iPhone SE'].userAgent },
  i15: { name: 'iPhone 15', viewport: { width: 393, height: 852 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: devices['iPhone 15'].userAgent },
  px8: { name: 'Pixel 8', viewport: { width: 412, height: 915 }, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true, userAgent: devices['Pixel 7'].userAgent },
  desk: { name: 'Desktop 1280', viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
};

export async function launch() { return chromium.launch(); }

export async function newPage(browser, vp, opts = {}) {
  const ctx = await browser.newContext(Object.assign({}, vp, { viewport: vp.viewport, deviceScaleFactor: vp.deviceScaleFactor, isMobile: vp.isMobile, hasTouch: vp.hasTouch, userAgent: vp.userAgent, reducedMotion: opts.reducedMotion || 'no-preference', colorScheme: opts.colorScheme || 'light' }));
  if (opts.init) await ctx.addInitScript(opts.init);
  const page = await ctx.newPage();
  page.errors = [];
  page.on('pageerror', e => page.errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') page.errors.push('console: ' + m.text()); });
  // never let analytics or fonts stall a test
  await page.route(/posthog\.com/, r => r.fulfill({ status: 200, body: '{}' }));
  return { ctx, page };
}

export function shotDir(name) { const d = 'review/' + name; fs.mkdirSync(d, { recursive: true }); return d; }
export async function shot(page, dir, name) { const f = dir + '/' + name + '.png'; try { await page.screenshot({ path: f, fullPage: false, timeout: 8000 }); } catch (e) { console.log('shot failed', name, String(e).split('\n')[0]); } return f; }
export async function shotFull(page, dir, name) { const f = dir + '/' + name + '.png'; try { await page.screenshot({ path: f, fullPage: true, timeout: 8000 }); } catch (e) { console.log('shot failed', name, String(e).split('\n')[0]); } return f; }

// ---- game drivers (everything the UI exposes is global in classic scripts) ----
export const G = page => page.evaluate(() => { const g = window.__hml(); return g ? { wave: g.wave, waveActive: g.waveActive, over: g.over, won: g.won, gold: g.gold, pile: g.pile, towers: g.towers.map(t => t ? t.type + t.tier : null), enemies: g.enemies.length, meter: g.meter, mode: g.mode, map: g.map.id, grace: !!g.grace, waveCount: g.waveCount } : null; });
export const state = page => page.evaluate(() => ({ modal: !document.getElementById('modal').hidden, title: (document.querySelector('#modalCard h1, #modalCard h2') || {}).textContent || '', sheet: !document.getElementById('sheet').hidden, coach: document.getElementById('coach').hidden ? '' : document.querySelector('#coach b').textContent, start: document.getElementById('startBtn').textContent, startDisabled: document.getElementById('startBtn').disabled, wave: document.getElementById('wave').textContent, toasts: [...document.querySelectorAll('.toast')].map(t => t.textContent), banner: document.getElementById('banner').textContent }));
// Advance the simulation headlessly by `secs` of game time (stops when the wave ends or the run ends).
export const advance = (page, secs) => page.evaluate(s => { const g = window.__hml(); if (!g) return 0; let t = 0; while (t < s && !g.over && g.waveActive) { update(g, 1 / 60); t += 1 / 60; } return t; }, secs);
export const build = (page, pad, type) => page.evaluate(([p, t]) => { const g = window.__hml(); if (!g) return false; g.gold = Math.max(g.gold, towerCost(g, t)); return build(g, p, t); }, [pad, type]);
export const upgradeN = (page, pad, n) => page.evaluate(([p, k]) => { const g = window.__hml(); let c = 0; for (let i = 0; i < k; i++) { const u = upgradeCost(g, p); if (u == null) break; g.gold = Math.max(g.gold, u); if (upgrade(g, p)) c++; } return c; }, [pad, n]);
export const canvasPoint = async (page, x, y) => page.evaluate(([x, y]) => { const r = document.getElementById('cv').getBoundingClientRect(); return { x: r.left + x * r.width / W, y: r.top + y * r.height / H }; }, [x, y]);
export async function tapCanvas(page, x, y) { const p = await canvasPoint(page, x, y); await page.mouse.click(p.x, p.y); }
export const settle = (page, ms = 250) => page.waitForTimeout(ms);
export async function waitModal(page, re, ms = 8000) { await page.waitForFunction(r => { const m = document.getElementById('modal'); return !m.hidden && new RegExp(r, 'i').test(document.getElementById('modalCard').textContent); }, re.source || re, { timeout: ms }); }
export async function clickBtn(page, sel) { await page.click(sel, { force: true }); await settle(page); }
