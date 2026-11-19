// The build-32 fixes from a new-player playtest of the live game: things that made a first-timer lose or get stuck
// in their first fifteen minutes. Simulation checks first, then the coach in a real browser.
// Usage: node tests/newplayer.mjs   (the browser part needs node tests/serve.mjs 8081 running; HML_URL overrides)
import fs from 'fs';
import { loadSim, readIndex } from './load-sim.mjs';
import { playLevel } from './balance.mjs';
import { launch, newPage, VIEWPORTS, BASE, settle } from './lib.mjs';
const results = []; const check = (name, ok, extra) => { results.push(!!ok); console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra ? '  (' + extra + ')' : '')); };
const S = loadSim(readIndex());

// ---------- the coached first game can't be rushed into a loss ----------
{ const G = S.newRun(S.defaultMeta(), 7, 0, 'campaign'); G.grace = true; S.shortFirstLevel(G); G.gold += S.towerCost(G, 'chuck'); S.build(G, 1, 'chuck');
  S.startWave(G); let offered = 0; for (let f = 0; f < 60 * 60 && !G.over; f++) { S.update(G, 1 / 60); if (S.canCallEarly(G)) offered++; }
  const N = S.newRun(Object.assign(S.defaultMeta(), { wins: 3 }), 7, 1, 'campaign'); N.gold = 1e4; S.build(N, 1, 'chuck'); S.startWave(N);
  let later = 0; for (let f = 0; f < 60 * 40 && !N.over; f++) { S.update(N, 1 / 60); if (S.canCallEarly(N)) later++; }
  check('first game: "Send next early" is never offered (a few taps lost it in 30 seconds)', offered === 0 && later > 0, offered + ' frames in the first game, ' + later + ' later'); }

// ---------- The Paddock's first swarm isn't a cliff ----------
{ const mi = S.MAPS.findIndex(m => m.id === 'paddock'), runs = 60, per = []; let wins = 0;
  for (let s = 0; s < runs; s++) { const r = playLevel(S, mi, { seed: 500 + s, crew: 'auto' }); if (r.won) wins++; r.lost.forEach((v, i) => per[i] = (per[i] || 0) + (v || 0)); }
  const avg = per.map(v => v / runs), worst = Math.max(...avg);
  check('the paddock: no wave costs a human-style bot more than half an item on average (wave 3 was 1.3)', worst < .5 && wins >= runs * .95, avg.map(v => v.toFixed(2)).join(' ') + ', won ' + wins + '/' + runs); }

// ---------- no cursed bonus cards for beginners; listed last after that ----------
{ const G = S.newRun(Object.assign(S.defaultMeta(), { wins: 1 }), 3, 1, 'campaign'); let cursed = 0;
  for (let k = 0; k < 300; k++) { G.cards = []; cursed += S.rollCards(G).filter(c => c.cursed).length; }
  const V = S.newRun(Object.assign(S.defaultMeta(), { wins: 12 }), 3, 4, 'campaign'); let seen = 0, notLast = 0;
  for (let k = 0; k < 400; k++) { V.cards = []; const r = S.rollCards(V), i = r.findIndex(c => c.cursed); if (i >= 0) { seen++; if (r.slice(i).some(c => !c.cursed)) notLast++; } }
  check('cards: none cursed before three wins; after that a cursed card is always listed last', cursed === 0 && seen > 0 && notLast === 0, cursed + ' cursed for a beginner; ' + seen + ' veteran draws with one, ' + notLast + ' not last'); }

const browser = await launch();
// ---------- a first-timer who doesn't tap during wave 1 still gets the coach afterwards ----------
{ const { page } = await newPage(browser, VIEWPORTS.se);
  await page.goto(BASE, { waitUntil: 'load' }); await page.waitForFunction(() => window.__hml && window.__hml() && window.__hml().waveActive, null, { timeout: 20000 });
  await page.waitForFunction(() => { const g = window.__hml(); return g.wave >= 1 && !g.waveActive && document.getElementById('modal').hidden; }, null, { timeout: 90000 });
  await page.waitForFunction(() => !document.getElementById('banner').classList.contains('show'), null, { timeout: 15000 }).catch(() => {});
  await settle(page, 3500);
  const st = await page.evaluate(() => ({ coach: document.getElementById('coach').hidden ? '' : document.querySelector('#coach b').textContent, wave: window.__hml().wave, towers: window.__hml().towers.filter(Boolean).length }));
  check('first game: after an untouched wave 1 the coach points at a pallet for the second hire', /TAP|Hire/i.test(st.coach) && st.towers === 1, JSON.stringify(st));
  check('no page errors in the first game', page.errors.length === 0, page.errors[0]); }
// ---------- Gary's Dream is pointed out the first time it's full mid-wave, on any level ----------
{ const { ctx, page } = await newPage(browser, VIEWPORTS.se);
  const m = JSON.parse(fs.readFileSync(new URL('./fixtures/save-build30.json', import.meta.url))); m.settings.analytics = false; m.seenBuild = 99; m.wins = 2; delete m.toldDreamBtn;
  await ctx.addInitScript(s => { if (sessionStorage.getItem('x')) return; sessionStorage.setItem('x', 1); localStorage.clear(); localStorage.setItem('hml.meta.v3', s); }, JSON.stringify(m));
  await page.goto(BASE, { waitUntil: 'load' }); await settle(page, 1300);
  await page.evaluate(() => document.querySelector('.level[data-map="1"]').click()); await settle(page, 400);
  await page.evaluate(() => document.getElementById('lvPlay').click()); await settle(page, 1200);
  await page.evaluate(() => { const g = window.__hml(); g.gold = 999; build(g, 1, 'chuck'); startWave(g); }); await settle(page, 2500);
  await page.evaluate(() => { window.__hml().meter = 100; }); await settle(page, 600);
  const c1 = await page.evaluate(() => document.getElementById('coach').hidden ? '' : document.querySelector('#coach b').textContent);
  await page.evaluate(() => document.getElementById('pokeBtn').click()); await settle(page, 800);
  await page.evaluate(() => { window.__hml().meter = 100; }); await settle(page, 600);
  const c2 = await page.evaluate(() => document.getElementById('coach').hidden ? '' : document.querySelector('#coach b').textContent);
  check('dream: the first full Dream mid-wave says TRY THIS!, and stops once used', c1 === 'TRY THIS!' && c2 === '', JSON.stringify([c1, c2]));
  check('no page errors on level 2', page.errors.length === 0, page.errors[0]);
  await ctx.close(); }
await browser.close();
console.log(results.every(Boolean) ? 'ALL PASS' : 'SOME FAILED');
process.exit(results.every(Boolean) ? 0 : 1);
