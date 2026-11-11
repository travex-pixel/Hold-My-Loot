// "Feels finished" checks: 200% zoom reflow, landscape, persistent mute (M key), Escape, the home Settings link.
// Usage: node tests/polish.mjs   (needs node tests/serve.mjs 8081 running)
import fs from 'fs';
import { launch, BASE, settle } from './lib.mjs';
const b30 = fs.readFileSync(new URL('./fixtures/save-build30.json', import.meta.url), 'utf8');
const browser = await launch(); const results = [];
const check = (name, ok, extra) => { results.push(ok); console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra ? '  (' + extra + ')' : '')); };
async function open(viewport, dsf = 2) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: dsf, isMobile: true, hasTouch: true });
  await ctx.addInitScript(s => { if (sessionStorage.getItem('x')) return; sessionStorage.setItem('x', 1); localStorage.clear(); localStorage.setItem('hml.meta.v3', s); }, b30);
  const page = await ctx.newPage(); page.errors = []; page.on('pageerror', e => page.errors.push(String(e)));
  await page.route(/posthog/, r => r.fulfill({ status: 200, body: '{}' }));
  await page.goto(BASE, { waitUntil: 'load' }); await settle(page, 1300); return { ctx, page };
}
const fits = page => page.evaluate(() => {
  const W = innerWidth, wide = [...document.querySelectorAll('#app *, #modal *')].filter(el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.right > W + 1 && getComputedStyle(el).position !== 'fixed'; });
  return { page: document.documentElement.scrollWidth <= W, wide: wide.slice(0, 3).map(e => e.id || e.className) };
});
const play = async page => { await page.evaluate(() => document.getElementById('playNext') && document.getElementById('playNext').click()); await settle(page, 500); await page.evaluate(() => document.getElementById('lvPlay') && document.getElementById('lvPlay').click()); await settle(page, 1200); };

// 200% zoom on an iPhone SE: 375 / 2 = about 188 CSS px
{ const { ctx, page } = await open({ width: 188, height: 334 }, 4);
  let f = await fits(page); check('200% zoom: home screen fits, no sideways scrolling', f.page && !f.wide.length, f.wide.join(','));
  await page.click('#homeSettings'); await settle(page, 400);
  f = await fits(page); check('200% zoom: settings fit', f.page && !f.wide.length && !!(await page.$('#setSound')), f.wide.join(','));
  await page.keyboard.press('Escape'); await settle(page, 300);
  await play(page); f = await fits(page); check('200% zoom: playing fits (HUD and buttons wrap)', f.page, f.wide.join(','));
  check('200% zoom: no page errors', page.errors.length === 0, page.errors[0]);
  await ctx.close(); }

// landscape phone
{ const { ctx, page } = await open({ width: 844, height: 390 });
  await play(page); const f = await fits(page);
  const box = await page.evaluate(() => { const r = document.getElementById('cv').getBoundingClientRect(); return [r.width, r.height, innerHeight]; });
  check('landscape: the board fits the height and nothing scrolls sideways', f.page && box[1] <= box[2] + 1 && box[0] > 150, box.map(Math.round).join('x'));
  await ctx.close(); }

// wide screens and portal iframes (CrazyGames lists 907x510, 1216x684, 1280x720, 1366x768 and 1920x1080 on desktop)
for (const [w, h] of [[907, 510], [1216, 684], [1280, 720], [1366, 768], [1920, 1080]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await ctx.addInitScript(s => { if (sessionStorage.getItem('x')) return; sessionStorage.setItem('x', 1); localStorage.clear(); localStorage.setItem('hml.meta.v3', s); }, b30);
  const page = await ctx.newPage(); page.errors = []; page.on('pageerror', e => page.errors.push(String(e)));
  await page.route(/posthog/, r => r.fulfill({ status: 200, body: '{}' }));
  await page.goto(BASE, { waitUntil: 'load' }); await settle(page, 1200); await play(page);
  const m = await page.evaluate(() => { const r = id => document.getElementById(id).getBoundingClientRect(); const cv = r('cv'), hud = r('hud'), bar = r('bar'), info = r('deskInfo');
    return { fits: document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight, boardH: cv.height / innerHeight, gapL: Math.round(cv.left - hud.right), gapR: Math.round(bar.left - cv.right), info: info.height > 0 }; });
  check(`${w}x${h}: board fills the height, panels hug it, nothing scrolls`, m.fits && m.boardH > .9 && m.gapL >= 0 && m.gapL < 24 && m.gapR >= 0 && m.gapR < 24 && (h < 470 || m.info) && page.errors.length === 0, JSON.stringify(m));
  await ctx.close();
}
{ const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage(); await page.route(/posthog/, r => r.fulfill({ status: 200, body: '{}' }));
  await page.goto(BASE, { waitUntil: 'load' }); await settle(page, 2500);
  const label = await page.evaluate(() => { const c = document.getElementById('coach'); return c.hidden ? '' : c.textContent; });
  check('with a mouse, the coach says CLICK, not TAP', /CLICK/.test(label) && !/TAP/.test(label), label);
  await ctx.close(); }

// desktop keys while playing: Space starts the wave, 2 sets 2x, Escape opens then closes the menu
{ const { ctx, page } = await open({ width: 1280, height: 800 }, 1);
  await play(page);
  await page.keyboard.press('Space'); await settle(page, 400);
  const started = await page.evaluate(() => window.__hml().waveActive);
  await page.keyboard.press('2'); await settle(page, 200);
  const sp = await page.evaluate(() => document.getElementById('speedBtn').textContent);
  await page.keyboard.press('Escape'); await settle(page, 300); const opened = !!(await page.$('#setSound'));
  await page.keyboard.press('Escape'); await settle(page, 300); const closed = await page.evaluate(() => document.getElementById('modal').hidden);
  check('keys: Space starts the wave, 2 sets 2x speed, Escape opens and closes the menu', started && /2/.test(sp) && opened && closed, [started, sp, opened, closed].join(','));
  await ctx.close(); }

// home Settings link, Escape, and M to mute (persists, and restores what was on)
{ const { ctx, page } = await open({ width: 375, height: 667 });
  await page.click('#homeSettings'); await settle(page, 400);
  check('the home screen has a Settings link', !!(await page.$('#setSound')));
  await page.keyboard.press('Escape'); await settle(page, 400);
  check('Escape closes the menu', !(await page.$('#setSound')) && !!(await page.$('#homeSettings')));
  const before = await page.evaluate(() => { const s = window.__hmlSave.meta().settings; return { sound: s.sound !== false, music: s.music !== false }; });
  await page.keyboard.press('m'); await settle(page, 300);
  let st = await page.evaluate(() => window.__hmlSave.meta().settings);
  check('M mutes sound and music', st.sound === false && st.music === false);
  await page.reload({ waitUntil: 'load' }); await settle(page, 1200);
  st = await page.evaluate(() => window.__hmlSave.meta().settings);
  check('mute survives a reload', st.sound === false && st.music === false);
  await page.keyboard.press('m'); await settle(page, 300);
  st = await page.evaluate(() => window.__hmlSave.meta().settings);
  check('M again restores exactly what was on before', (st.sound !== false) === before.sound && (st.music !== false) === before.music, JSON.stringify(before));
  await page.click('#homeSettings'); await settle(page, 300);
  await page.focus('#supCode').catch(() => {}); await page.evaluate(() => { const i = document.querySelector('#modalCard input[type=text], #modalCard textarea'); if (i) i.focus(); });
  const typed = await page.evaluate(() => !!document.activeElement && /INPUT|TEXTAREA/.test(document.activeElement.tagName));
  if (typed) { await page.keyboard.press('m'); await settle(page, 200); }
  st = await page.evaluate(() => window.__hmlSave.meta().settings);
  check('typing an m in a text box does not mute', !typed || (st.sound !== false) === before.sound);
  check('no page errors', page.errors.length === 0, page.errors[0]);
  await ctx.close(); }

await browser.close();
console.log(results.every(Boolean) ? 'ALL PASS' : 'SOME FAILED');
process.exit(results.every(Boolean) ? 0 : 1);
