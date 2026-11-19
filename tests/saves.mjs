// Saves: old builds upgrade, damaged saves recover, and nothing is ever silently thrown away.
// Loads index.html in a real browser with localStorage seeded per case. Usage: node tests/saves.mjs
import fs from 'fs';
import { launch, newPage, VIEWPORTS, BASE, settle } from './lib.mjs';
const F = n => JSON.parse(fs.readFileSync(new URL('./fixtures/' + n, import.meta.url)));
const b29 = F('save-build29.json'), b30 = F('save-build30.json'), run30 = F('run-build30.json'), v1 = F('save-v1.json');
const browser = await launch(); const results = [];
const check = (name, ok, extra) => { results.push(ok); console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra ? '  (' + extra + ')' : '')); };
async function open(store, opts = {}) {
  const { ctx, page } = await newPage(browser, VIEWPORTS.i15, { init: opts.init || (s => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); for (const k in s) localStorage.setItem(k, s[k]); }) });
  if (!opts.init) await ctx.addInitScript(s => { if (sessionStorage.getItem('seeded2')) return; sessionStorage.setItem('seeded2', 1); localStorage.clear(); for (const k in s) localStorage.setItem(k, s[k]); }, store);
  await page.goto(BASE, { waitUntil: 'load' }); await settle(page, 900); return { ctx, page };
}
const M = page => page.evaluate(() => window.__hmlSave.meta());
const home = page => page.evaluate(() => document.getElementById('modalCard').innerText);
const diff = (a, b, keys) => keys.filter(k => JSON.stringify(a[k]) !== JSON.stringify(b[k]));
const same = (a, b, keys) => { const d = diff(a, b, keys); if (d.length) console.log('    differs:', d.map(k => k + ' ' + JSON.stringify(b[k]) + ' -> ' + JSON.stringify(a[k])).join(' ; ').slice(0, 400)); return !d.length; };
const KEEP = ['wins', 'runs', 'rocks', 'shards', 'garyXp', 'stash', 'shed', 'owned', 'crewLook', 'pj', 'paths', 'tstars', 'nick', 'endlessBest', 'synergies', 'equip'];
const dreamsKept = (a, b) => Object.keys(b.dreams).every(k => a.dreams[k] === b.dreams[k]);

for (const [name, save] of [['build 29', b29], ['build 30', b30]]) {
  const { ctx, page } = await open({ 'hml.meta.v3': JSON.stringify(save), 'hml.run.v4': JSON.stringify(run30) });
  let m = await M(page);
  check(name + ' save loads with all progress intact', same(m, save, KEEP) && dreamsKept(m, save), 'wins ' + m.wins + ', rocks ' + m.rocks);
  check(name + ' save is migrated to v' + (await page.evaluate(() => window.__hmlSave.version)), m.v === await page.evaluate(() => window.__hmlSave.version) && m.firstBuild === save.seenBuild);
  check(name + ' settings survive (music off, volume)', m.settings.music === false && m.settings.volume === .45);
  check(name + ' mid-level run is offered', /Continue: The Beer Garden, wave 4/.test(await home(page)));
  await page.reload({ waitUntil: 'load' }); await settle(page, 700); await page.reload({ waitUntil: 'load' }); await settle(page, 700);
  m = await M(page); check(name + ' save survives two reloads', same(m, save, KEEP));
  await page.click('#contBtn', { force: true }); await settle(page, 800);
  const g = await page.evaluate(() => { const g = window.__hml(); return { map: g.map.id, wave: g.wave, gold: g.gold, towers: g.towers.filter(Boolean).map(t => t.type + t.tier).join(',') }; });
  check(name + ' run resumes where it was saved', g.map === 'garden' && g.wave === 3 && g.gold === 312 && g.towers === 'nan1,chuck0', JSON.stringify(g));
  await ctx.close();
}
{ const { ctx, page } = await open({ 'hml.meta.v1': JSON.stringify(v1) }); const m = await M(page);
  check('a pre-build-14 (v1) save is carried over', m.wins === 2 && m.runs === 5 && m.xp.chucking === 200 && m.maps.nap && m.maps.nap.wins === 2); await ctx.close(); }
{ const { ctx, page } = await open({ 'hml.meta.v3': '{"wins": 23, "rocks": 17', 'hml.meta.bak': JSON.stringify(b29) }); const m = await M(page);
  check('a cut-off main save recovers from the backup', m.wins === 23 && m.rocks === 1745 && /Progress recovered/.test(await home(page))); await ctx.close(); }
{ const { ctx, page } = await open({ 'hml.meta.v3': 'garbage', 'hml.meta.bak': '{{{', 'hml.meta.best': 'null' }); const m = await M(page);
  const kept = await page.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith('hml.meta.unreadable.')).map(k => localStorage.getItem(k)));
  check('a save nobody can read is set aside, not overwritten', kept.includes('garbage') && m.runs === 0); await ctx.close(); }
{ const bad = Object.assign({}, b30, { rocks: 'NaN', shards: -40, wins: '25', garyXp: null, xp: { muttering: 'lots', chucking: 1e300 }, maps: { nap: { plays: 'x', wins: 2, stars: 99 } }, equip: ['Not A Real Item', 5], jobs: 'none', daily: null, heat: 77 });
  const { ctx, page } = await open({ 'hml.meta.v3': JSON.stringify(bad) }); const m = await M(page);
  console.log('    junk result', JSON.stringify({ rocks: m.rocks, shards: m.shards, wins: m.wins, garyXp: m.garyXp, xp: m.xp.muttering, xpc: m.xp.chucking, stars: m.maps.nap.stars, equip: m.equip, jobs: Array.isArray(m.jobs), daily: m.daily, heat: m.heat }).slice(0, 300));
  const ok = m.rocks === 0 && m.shards === 0 && m.wins === 25 && isFinite(m.garyXp) && m.xp.muttering === 0 && isFinite(m.xp.chucking) && m.maps.nap.stars === 3 && m.equip.every(x => x === null) && Array.isArray(m.jobs) && m.daily.count >= 0 && m.heat === 10;
  check('a save with junk values is cleaned instead of crashing the game', ok && !page.errors.length, JSON.stringify({ rocks: m.rocks, wins: m.wins, heat: m.heat, stars: m.maps.nap.stars, errors: page.errors.length })); await ctx.close(); }
{ const runBad = Object.assign({}, run30, { map: 999 });
  const { ctx, page } = await open({ 'hml.meta.v3': JSON.stringify(b30), 'hml.run.v4': JSON.stringify(runBad) });
  check('a broken mid-level run is dropped and the home screen still works', !/Continue:/.test(await home(page)) && !page.errors.length && await page.evaluate(() => !localStorage.getItem('hml.run.v4'))); await ctx.close(); }
{ const { ctx, page } = await open({ 'hml.meta.v3': JSON.stringify(b30), 'hml.run.v4': JSON.stringify(Object.assign({}, run30, { mode: 'raid' })) });
  check('a raid is never offered as a resumable run (it cannot resume)', !/Continue:/.test(await home(page))); await ctx.close(); }
{ // storage full: every write fails after load
  const { ctx, page } = await open({ 'hml.meta.v3': JSON.stringify(b30) });
  await page.evaluate(() => { const real = Storage.prototype.setItem; Storage.prototype.setItem = function () { const e = new Error('QuotaExceededError'); e.name = 'QuotaExceededError'; throw e; }; window.__restore = () => { Storage.prototype.setItem = real; }; });
  const saved = await page.evaluate(() => { try { return window.__hmlSave.storageOk(); } catch (e) { return 'threw'; } });
  await page.click('.level[data-map="0"]', { force: true }); await settle(page, 300); await page.click('#lvPlay', { force: true }); await settle(page, 600);
  check('a full disk does not crash the game', !page.errors.length && await page.evaluate(() => !!window.__hml()), 'storageOk before: ' + saved); await ctx.close(); }
{ // private mode / blocked storage: the game still plays and says why progress will not stick
  const { ctx, page } = await newPage(browser, VIEWPORTS.i15, { init: () => { Object.defineProperty(window, 'localStorage', { get() { throw new Error('SecurityError'); } }); } });
  await page.goto(BASE, { waitUntil: 'load' }); await settle(page, 1200);
  const g = await page.evaluate(() => !!window.__hml()); check('with storage blocked the first game still starts', g && !page.errors.length, page.errors.join(' | ').slice(0, 120)); await ctx.close(); }
await browser.close();
console.log(results.every(Boolean) ? 'PASS saves (' + results.length + ' checks)' : 'FAIL saves'); process.exit(results.every(Boolean) ? 0 : 1);
