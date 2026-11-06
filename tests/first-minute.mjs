// Plays a brand-new player's first game in a real browser by tapping wherever the coach points, and nothing else.
// Passes if the taster is won with 8+ of 10 kept, 3 stars show, it takes under 90 s of real time, and no errors fire.
// Usage: node tests/first-minute.mjs [se|i15|px8|desk] [shotsDir]
import fs from 'fs';
import { launch, newPage, VIEWPORTS, BASE, G, state, settle } from './lib.mjs';
const vp = VIEWPORTS[process.argv[2] || 'se'], dir = process.argv[3] || '';
if (dir) fs.mkdirSync(dir, { recursive: true });
const browser = await launch();
const { page } = await newPage(browser, vp);
const t0 = Date.now(); const coachSeen = new Set(); let taps = 0, shot = 0;
await page.goto(BASE, { waitUntil: 'load' });
await page.waitForFunction(() => window.__hml && window.__hml());
for (let i = 0; i < 400; i++) {
  await settle(page, 250);
  const st = await state(page), g = await G(page);
  if (st.coach) { if (!coachSeen.has(st.coach)) { coachSeen.add(st.coach); if (dir) await page.screenshot({ path: dir + '/coach-' + String(++shot).padStart(2, '0') + '.png' }); } }
  if (st.modal || !g || g.over) break;
  if (i % 40 === 39) console.log('  t', Math.round((Date.now() - t0) / 1000) + 's', 'wave', g.wave, g.waveActive ? 'active' : 'gap', 'coach', st.coach || '-', 'sheet', st.sheet);
  if (st.coach && !/Speed up|TRY THIS/.test(st.coach)) {
    const p = await page.evaluate(() => { const c = document.getElementById('coach'), r = c.getBoundingClientRect(), ring = c.classList.contains('ring'); return { x: r.left + r.width / 2, y: r.top + (ring ? 30 : r.height + 18), ring }; });
    await page.mouse.click(p.x, p.y); taps++;
  }
}
await page.waitForFunction(() => !document.getElementById('modal').hidden, null, { timeout: 15000 });
const secs = (Date.now() - t0) / 1000;
await settle(page, 1500);
if (await page.$('#revOk')) { if (dir) await page.screenshot({ path: dir + '/reveal.png' }); await settle(page, 900); await page.click('#revOk', { force: true }); await settle(page, 1800); }
const res = await page.evaluate(() => ({ text: document.getElementById('modalCard').innerText.slice(0, 200).replace(/\n+/g, ' / '), stars: document.querySelectorAll('.rstar.on').length }));
if (dir) await page.screenshot({ path: dir + '/results.png' });
const g = await page.evaluate(() => { const g = window.__hml(); return g ? { won: g.won, pile: g.pile, pileMax: g.pileMax, towers: g.towers.filter(Boolean).length } : null; });
console.log(JSON.stringify({ viewport: vp.name, realSecs: Math.round(secs), taps, coach: [...coachSeen], game: g, stars: res.stars, results: res.text, errors: page.errors }));
await browser.close();
const ok = g && g.won && g.pile >= 8 && res.stars === 3 && secs < 90 && !page.errors.length;
console.log(ok ? 'PASS' : 'FAIL'); process.exit(ok ? 0 : 1);
