// Things for players who have maxed everything: who the crew aim at, Overtime for ELITE crew, Deep sleep for maxed
// dreams, and the Rock Tumbler. Simulation checks first (no browser), then the buttons in a real browser.
// Usage: node tests/endgame.mjs   (the browser part needs node tests/serve.mjs 8081 running)
import fs from 'fs';
import { loadSim } from './load-sim.mjs';
import { launch, newPage, VIEWPORTS, BASE, settle, tapCanvas } from './lib.mjs';
const results = []; const check = (name, ok, extra) => { results.push(ok); console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra ? '  (' + extra + ')' : '')); };
const S = loadSim();
const vet = () => { const m = Object.assign(S.defaultMeta(), { wins: 28 }); for (const k of S.SKILLS) m.xp[k] = 6000; return m; };

// ---------- aim ----------
// One crew member, four monsters in reach with known places and health. Fire once and see who was picked.
function pick(type, aim, look) {
  const G = S.newRun(vet(), 5, 0, 'campaign'); G.gold = 1e6;
  const pad = G.map.pads.map((p, i) => [i, S.padRoadDist(G.map, p)]).filter(([i]) => !(G.padLock && G.padLock[i])).sort((a, b) => a[1] - b[1])[0][0], P = G.map.pads[pad];
  S.build(G, pad, type); if (aim) S.setAim(G, pad, aim);
  S.startWave(G); G.spawnQ.length = 0; G.spawnQ.push({ type: 'rat', at: 1e9 }); G.enemies.length = 0;
  // put four monsters on the road points nearest the pallet, in road order: back ... front
  const Pth = G.map.P[0]; let best = 0, bd = 1e9; for (let d = 0; d < Pth.len; d += 2) { const q = S.posOn(Pth, d), dd = Math.hypot(q.x - P[0], q.y - P[1]); if (dd < bd) { bd = dd; best = d; } }
  const mk = (off, hp, extra) => { const e = S.spawn(G, 'skel', best + off, 0); e.hp = e.maxHp = hp; Object.assign(e, extra || {}); const q = S.posOn(Pth, e.d); e.x = q.x; e.y = q.y; return e; };
  const back = mk(-24, 500), weak = mk(-8, 60), thief = mk(8, 300, { carry: { name: 'Sock', tier: 0 } }), front = mk(24, 200);
  const strong = mk(0, 900);
  const ids = { [back.id]: 'back', [weak.id]: 'weak', [thief.id]: 'thief', [front.id]: 'front', [strong.id]: 'strong' };
  G.towers[pad].cd = 0;
  for (let k = 0; k < 4 && !look(G, pad).length; k++) S.update(G, 1 / 60);
  return look(G, pad).map(id => ids[id] || '?');
}
const shot = (G) => G.projs.filter(p => p.tid).map(p => p.tid);
const expect = { first: 'front', last: 'back', strong: 'strong', weak: 'weak', loot: 'thief' };
for (const type of ['chuck', 'nan']) for (const aim of S.AIMS) { const got = pick(type, aim, shot)[0]; check(`aim: ${type} on ${S.AIM_NAMES[aim]} goes for the ${expect[aim]} one`, got === expect[aim], 'picked ' + got); }
check('aim: with nothing chosen, Dazza goes for the first and Nan for the strongest, as before', pick('chuck', null, shot)[0] === 'front' && pick('nan', null, shot)[0] === 'strong');
check('aim: Long Peter lifts the one he is told to', pick('pete', 'weak', G => G.enemies.filter(e => e.lift).map(e => e.id))[0] === 'weak' && pick('pete', 'last', G => G.enemies.filter(e => e.lift).map(e => e.id))[0] === 'back');
check('aim: Bev sends her bird where she is told', pick('bev', 'strong', G => G.birds.filter(b => b.kind === 'ibis').map(b => b.tid))[0] === 'strong');
{ const G = S.newRun(vet(), 5, 0, 'campaign'); G.gold = 1e6; S.build(G, 0, 'sizzle'); S.build(G, 1, 'bonk'); S.build(G, 2, 'nan');
  check('aim: crew who never pick a target have no aim (Uncle Tony), and a bad value is refused', !S.aimable(G.towers[0]) && !S.setAim(G, 0, 'strong') && !S.setAim(G, 2, 'biggest') && S.aimable(G.towers[2]));
  S.upgrade(G, 1); S.upgrade(G, 1);
  check('aim: Big Marg stops offering an aim once she hits everything in reach', !S.aimable(G.towers[1]));
  S.setAim(G, 2, 'weak'); const snap = JSON.parse(JSON.stringify(S.snapshot(G))); const G2 = S.restoreRun(vet(), snap);
  check('aim: a saved run keeps each crew member’s aim', S.aimOf(G2.towers[2]) === 'weak' && S.aimOf(G2.towers[1]) === 'first');
  S.setAim(G, 2, 'strong'); check('aim: choosing the default clears the setting', G.towers[2].aim === undefined);
  const m = vet(); m.aim = { nan: 'loot', chuck: 'nonsense' }; const G3 = S.newRun(m, 5, 0, 'campaign'); G3.gold = 1e6; S.build(G3, 2, 'nan'); S.build(G3, 3, 'chuck');
  check('aim: the next one hired starts on the aim last chosen for that crew; junk is ignored', S.aimOf(G3.towers[2]) === 'loot' && S.aimOf(G3.towers[3]) === 'first'); }
// a save code or damaged save naming something on Object.prototype must not reach Array.sort (it froze the game)
{ const bad = ['valueOf', '__proto__', 'constructor', 'hasOwnProperty', 'toString'];
  const m = vet(); m.aim = { chuck: 'valueOf', nan: 'constructor' }; const G = S.newRun(m, 5, 0, 'campaign'); G.gold = 1e6; S.build(G, 2, 'nan'); S.build(G, 3, 'chuck');
  const refused = bad.every(a => !S.setAim(G, 2, a)) && S.aimOf(G.towers[2]) === 'strong' && S.aimOf(G.towers[3]) === 'first';
  const snap = JSON.parse(JSON.stringify(S.snapshot(G))); snap.towers[3].aim = 'valueOf'; snap.towers[2].aim = '__proto__';
  let threw = ''; try { const G2 = S.restoreRun(vet(), snap); S.startWave(G2); for (let f = 0; f < 60 * 8; f++) S.update(G2, 1 / 60); S.startWave(G); for (let f = 0; f < 60 * 8; f++) S.update(G, 1 / 60); } catch (e) { threw = String(e); }
  check('aim: names like valueOf or __proto__ from a save are ignored, and the wave still runs', refused && !threw, threw); }

// ---------- Overtime ----------
{ const G = S.newRun(vet(), 5, 0, 'endless'); G.gold = 1e6; S.build(G, 2, 'nan'); S.build(G, 0, 'sizzle');
  check('overtime: not offered before ELITE', S.overtimeCost(G, 2) === null && !S.overtime(G, 2));
  for (let k = 0; k < 4; k++) { S.upgrade(G, 2); S.upgrade(G, 0); }
  check('overtime: offered at ELITE; support crew with no damage are not', S.upgradeCost(G, 2) === null && S.overtimeCost(G, 2) > 0 && S.overtimeCost(G, 0) === null);
  const costs = []; const base = S.TOWERS.nan.tiers[4].dmg; const g0 = G.gold; const spent0 = G.towers[2].spent;
  for (let k = 0; k < 5; k++) { costs.push(S.overtimeCost(G, 2)); S.overtime(G, 2); }
  check('overtime: each level costs about a quarter more than the last', costs.every((c, i) => i === 0 || (c / costs[i - 1] > 1.2 && c / costs[i - 1] < 1.3)), costs.join(', '));
  check('overtime: gold is taken and counted in the sell value', g0 - G.gold === costs.reduce((a, b) => a + b, 0) && G.towers[2].spent - spent0 === g0 - G.gold);
  check('overtime: five levels is +75% of the tier’s damage, and the tier itself is untouched', Math.abs(S.tierOf(G.towers[2]).dmg - base * 1.75) < 1e-9 && S.TOWERS.nan.tiers[4].dmg === base);
  const G2 = S.restoreRun(vet(), JSON.parse(JSON.stringify(S.snapshot(G))));
  check('overtime: a saved run keeps it', G2.towers[2].ot === 5 && Math.abs(S.tierOf(G2.towers[2]).dmg - base * 1.75) < 1e-9);
  G.gold = 1e9; for (let k = 0; k < 40; k++) S.overtime(G, 2);
  check('overtime: stops at ' + S.OT.max, G.towers[2].ot === S.OT.max && S.overtimeCost(G, 2) === null);
  // it really hits harder: same seed, same fight, with and without
  const dealt = ot => { const H = S.newRun(vet(), 9, 0, 'endless'); H.gold = 1e6; S.build(H, 2, 'nan'); for (let k = 0; k < 4; k++) S.upgrade(H, 2); for (let k = 0; k < ot; k++) S.overtime(H, 2); H.wave = 14; S.startWave(H); let hp0 = 0; for (let f = 0; f < 60 * 25; f++) S.update(H, 1 / 60); return H.stats.kills; };
  const k0 = dealt(0), k5 = dealt(5); check('overtime: the same fight goes better with it', k5 > k0, k0 + ' kills without, ' + k5 + ' with Overtime 5'); }

// ---------- Deep sleep and the Rock Tumbler ----------
{ const m = vet(); m.dreams = { swing: 4, snore: 5 }; m.dreamEquip = 'snore'; m.shards = 60;
  check('deep sleep: only a level-5 dream can go deeper', S.deepCost(m, 'swing') === null && S.deepCost(m, 'snore') === 25 && !S.buyDeep(m, 'swing'));
  const G0 = S.newRun(m, 5, 0, 'campaign'); const c0 = G0.chargeMult;
  check('deep sleep: buying takes shards and the next level costs more', S.buyDeep(m, 'snore') && m.shards === 35 && S.deepCost(m, 'snore') === 30 && S.buyDeep(m, 'snore') && m.shards === 5 && !S.buyDeep(m, 'snore'));
  const G1 = S.newRun(m, 5, 0, 'campaign');
  check('deep sleep: the dream charges 6% faster per level', Math.abs(G1.chargeMult / c0 - 1.12) < 1e-9, (G1.chargeMult / c0).toFixed(3));
  m.dreamEquip = 'swing'; check('deep sleep: it belongs to that dream only', Math.abs(S.newRun(m, 5, 0, 'campaign').chargeMult - c0) < 1e-9);
  m.shards = 1e6; for (let k = 0; k < 30; k++) S.buyDeep(m, 'snore'); check('deep sleep: stops at ' + S.DEEP.max, S.deepLevel(m, 'snore') === S.DEEP.max && S.deepCost(m, 'snore') === null);
  const r = vet(); r.rocks = 1000; r.shards = 3;
  check('tumbler: closed until the whole Shed is maxed', !S.shedMaxed(r) && !S.tumble(r, 1) && r.rocks === 1000);
  for (const sh of S.SHED) r.shed[sh.id] = sh.costs.length;
  check('tumbler: 100 rocks in, 1 shard out, and never more than you have', S.tumble(r, 1) && r.rocks === 900 && r.shards === 4 && S.tumble(r, 9) && r.rocks === 0 && r.shards === 13 && !S.tumble(r, 1)); }

// ---------- the buttons ----------
const b30 = JSON.parse(fs.readFileSync(new URL('./fixtures/save-build30.json', import.meta.url))); b30.settings.analytics = false; b30.seenBuild = 99;
for (const k in b30.xp) b30.xp[k] = 6000; b30.rocks = 1234; b30.shards = 80; b30.dreams = Object.assign({}, b30.dreams, { swing: 5 }); for (const sh of S.SHED) (b30.shed = b30.shed || {})[sh.id] = sh.costs.length;
const browser = await launch();
{ const { ctx, page } = await newPage(browser, VIEWPORTS.se);
  await ctx.addInitScript(s => { if (sessionStorage.getItem('x')) return; sessionStorage.setItem('x', 1); localStorage.clear(); localStorage.setItem('hml.meta.v3', s); }, JSON.stringify(b30));
  await page.goto(BASE, { waitUntil: 'load' }); await settle(page, 1300);
  await page.evaluate(() => document.querySelector('.level[data-map="0"]').click()); await settle(page, 400);
  await page.evaluate(() => document.getElementById('lvPlay').click()); await settle(page, 1200);
  const pads = await page.evaluate(() => { const g = window.__hml(); g.gold = 99999; build(g, 1, 'nan'); for (let k = 0; k < 4; k++) upgrade(g, 1); build(g, 2, 'sizzle'); build(g, 3, 'chuck'); g.gold = 2000; return g.map.pads; });
  await settle(page, 2600);   // the ELITE banner
  await tapCanvas(page, pads[1][0], pads[1][1]); await settle(page, 500);
  const chips = await page.$$eval('#sheet .aim', els => els.map(e => e.textContent + (e.classList.contains('on') ? '*' : '')));
  check('sheet: five aims, with Nan’s usual one lit', chips.join(' ') === 'First Last Strongest* Weakest Thieves', chips.join(' '));
  await page.click('#sheet .aim[data-aim="first"]'); await settle(page, 300);
  check('sheet: tapping an aim sets it and lights it', await page.evaluate(() => window.__hml().towers[1].aim) === 'first' && await page.$eval('#sheet .aim.on', e => e.dataset.aim) === 'first');
  const fits = await page.evaluate(() => { const s = document.getElementById('sheet').getBoundingClientRect(); return [...document.querySelectorAll('#sheet .aim')].every(b => { const r = b.getBoundingClientRect(); return r.left >= s.left && r.right <= s.right && r.height >= 40; }) && document.querySelector('#sheet .x').getBoundingClientRect().height >= 40; });
  check('sheet: the aim buttons fit an iPhone SE and they and Close are at least 40px tall', fits);
  const g0 = await page.evaluate(() => window.__hml().gold); const label = await page.$eval('#sheet [data-act="ot"]', e => e.textContent);
  await page.click('#sheet [data-act="ot"]'); await settle(page, 300);
  const st = await page.evaluate(() => { const g = window.__hml(); return { ot: g.towers[1].ot, gold: g.gold }; });
  check('sheet: an ELITE crew member offers Overtime, and buying it takes the gold', /Overtime 1: \+15% damage/.test(label) && st.ot === 1 && st.gold < g0, label + ' -> gold ' + g0 + ' to ' + st.gold);
  await page.evaluate(() => { window.__hml().gold = 10; }); await settle(page, 400);
  check('sheet: Overtime is greyed out when you can’t afford it', await page.$eval('#sheet [data-act="ot"]', e => e.disabled));
  await page.click('#sheet [data-act="close"]'); await settle(page, 200);
  await tapCanvas(page, pads[2][0], pads[2][1]); await settle(page, 500);
  check('sheet: Uncle Tony has no aim buttons and no Overtime', !(await page.$('#sheet .aim')) && !(await page.$('#sheet [data-act="ot"]')) && !!(await page.$('#sheet [data-act="sell"]')));
  await page.click('#sheet [data-act="close"]'); await settle(page, 200);
  // a new Nan starts on the aim just chosen; and it all survives a reload and Continue
  await page.evaluate(() => { const g = window.__hml(); g.gold = 500; build(g, 4, 'nan'); });
  check('the next Nan hired starts on the same aim', await page.evaluate(() => window.__hml().towers[4].aim) === 'first');
  await page.evaluate(() => { document.getElementById('menuBtn').click(); }); await settle(page, 300); await page.click('#quitBtn').catch(() => {}); await settle(page, 700);
  await page.reload({ waitUntil: 'load' }); await settle(page, 1200);
  await page.click('#contBtn', { force: true }); await settle(page, 900);
  const after = await page.evaluate(() => { const g = window.__hml(); return g && { aim: g.towers[1].aim, ot: g.towers[1].ot, aim4: g.towers[4] && g.towers[4].aim }; });
  check('aim and Overtime survive quitting, reloading and Continue', after && after.aim === 'first' && after.ot === 1 && after.aim4 === 'first', JSON.stringify(after));
  check('no page errors while playing', page.errors.length === 0, page.errors[0]);
  await ctx.close(); }
{ const { ctx, page } = await newPage(browser, VIEWPORTS.se);
  await ctx.addInitScript(s => { if (sessionStorage.getItem('x')) return; sessionStorage.setItem('x', 1); localStorage.clear(); localStorage.setItem('hml.meta.v3', s); }, JSON.stringify(b30));
  await page.goto(BASE, { waitUntil: 'load' }); await settle(page, 1300);
  await page.click('#shedBtn'); await settle(page, 400);
  check('shed: with everything maxed, the Rock Tumbler appears', /Rock Tumbler/.test(await page.innerText('#modalCard')));
  await page.click('[data-tumble="1"]'); await settle(page, 300); await page.click('[data-tumble="10"]'); await settle(page, 300);
  const m1 = await page.evaluate(() => { const m = window.__hmlSave.meta(); return [m.rocks, m.shards]; });
  check('shed: tumbling 1 then 10 turns 1,100 rocks into 11 shards', m1[0] === 134 && m1[1] === 91, m1.join(' rocks, ') + ' shards');
  check('shed: the buttons go once you can’t afford them', !(await page.$('[data-tumble="10"]')) && await page.$eval('[data-tumble="1"]', e => !e.disabled));
  // buying near the bottom of a long list keeps you there
  await page.evaluate(() => { const m = window.__hmlSave.meta(); m.rocks = 5000; });
  await page.click('#shedBack'); await settle(page, 300); await page.click('#shedBtn'); await settle(page, 400);
  const sc = await page.evaluate(async () => { const c = document.getElementById('modalCard'), m = document.getElementById('modal'); document.querySelector('[data-tumble="1"]').scrollIntoView({ block: 'center' }); const a = c.scrollTop + m.scrollTop; document.querySelector('[data-tumble="1"]').click(); await new Promise(r => setTimeout(r, 300)); return [a, c.scrollTop + m.scrollTop]; });
  check('shed: tumbling doesn’t jump the list back to the top', sc[0] > 50 && Math.abs(sc[1] - sc[0]) < 2, sc.join(' -> '));
  check('shed: the Tumbler says how many rocks you have and what ×10 costs', /You have [\d,]+ rocks and \d+ shards/.test(await page.innerText('#modalCard')) && /1,000/.test(await page.$eval('[data-tumble="10"]', e => e.textContent)));
  await page.click('#shedBack'); await settle(page, 300);
  await page.evaluate(() => document.getElementById('gearBtn').click()); await settle(page, 400);
  const before = await page.innerText('#modalCard');
  const sc0 = await page.evaluate(() => { document.querySelector('[data-deep="swing"]').scrollIntoView({ block: 'center' }); return document.getElementById('modalCard').scrollTop + document.getElementById('modal').scrollTop; });
  await page.click('[data-deep="swing"]'); await settle(page, 400);
  const sc1 = await page.evaluate(() => document.getElementById('modalCard').scrollTop + document.getElementById('modal').scrollTop);
  check('dreams: buying Deep sleep keeps your place in the list', Math.abs(sc1 - sc0) < 2, sc0 + ' -> ' + sc1);
  const m2 = await page.evaluate(() => { const m = window.__hmlSave.meta(); return [m.shards, m.deep && m.deep.swing]; });
  check('dreams: a maxed dream offers Deeper sleep, and buying it takes the shards', /Deeper sleep \(25 shards\)/.test(before) && m2[0] === 67 && m2[1] === 1 && /Deep sleep 1 of 10: charges 6% faster/.test(await page.innerText('#modalCard')), m2.join(' shards, level '));
  await page.reload({ waitUntil: 'load' }); await settle(page, 1000);
  check('rocks, shards and Deep sleep are saved', JSON.stringify(await page.evaluate(() => { const m = window.__hmlSave.meta(); return [m.rocks, m.shards, m.deep.swing]; })) === '[4900,67,1]');
  check('no page errors in the menus', page.errors.length === 0, page.errors[0]);
  await ctx.close(); }
// on an iPhone SE, a crew member's sheet never hides them, and their aim and buttons stay on screen
{ const { ctx, page } = await newPage(browser, VIEWPORTS.se);
  await ctx.addInitScript(s => { if (sessionStorage.getItem('x')) return; sessionStorage.setItem('x', 1); localStorage.clear(); localStorage.setItem('hml.meta.v3', s); }, JSON.stringify(b30));
  await page.goto(BASE, { waitUntil: 'load' }); await settle(page, 1300);
  await page.evaluate(() => document.querySelector('.level[data-map="0"]').click()); await settle(page, 400);
  await page.evaluate(() => document.getElementById('lvPlay').click()); await settle(page, 1200);
  const pads = await page.evaluate(() => { const g = window.__hml(); g.gold = 1e7; g.map.pads.forEach((_, i) => { if (!(g.padLock && g.padLock[i])) { if (!g.towers[i]) build(g, i, 'chuck'); for (let k = 0; k < 4; k++) upgrade(g, i); } }); g.gold = 30000; return g.map.pads.map((p, i) => g.towers[i] ? p : null); });
  await settle(page, 2600);
  const bad = [];
  for (let i = 0; i < pads.length; i++) { if (!pads[i]) continue;
    await tapCanvas(page, pads[i][0], pads[i][1]); await settle(page, 450);
    const r = await page.evaluate(i => { const g = window.__hml(), p = g.map.pads[i], c = document.querySelector('canvas').getBoundingClientRect(), y = v => c.top + v * c.height / H;
      const s = document.getElementById('sheet'), sr = s.getBoundingClientRect(), a = s.querySelector('.acts').getBoundingClientRect(), aim = s.querySelector('.aim');
      return { open: !s.hidden, covers: sr.top < y(p[1] + 16) && sr.bottom > y(p[1] - 52), acts: a.top >= sr.top - 1 && a.bottom <= sr.bottom + 1, aim: !!aim && aim.getBoundingClientRect().top >= sr.top }; }, i);
    if (!r.open || r.covers || !r.acts || !r.aim) bad.push(i + ':' + JSON.stringify(r));
    await page.click('#sheet [data-act="close"]').catch(() => {}); await settle(page, 200); }
  check('sheet: on an iPhone SE no crew member is hidden by their own sheet; aim and buttons stay in view', !bad.length && pads.filter(Boolean).length >= 6, bad.join(' '));
  check('no page errors opening every sheet', page.errors.length === 0, page.errors[0]);
  await ctx.close(); }
// a save carrying junk aims loads clean; a brand-new player's first crew member has no aim row to puzzle over
{ const { ctx, page } = await newPage(browser, VIEWPORTS.se);
  const junk = Object.assign({}, b30, { aim: { chuck: 'valueOf', nan: '__proto__', bev: 'loot', constructor: 'first' } });
  await ctx.addInitScript(s => { if (sessionStorage.getItem('x')) return; sessionStorage.setItem('x', 1); localStorage.clear(); localStorage.setItem('hml.meta.v3', s); }, JSON.stringify(junk));
  await page.goto(BASE, { waitUntil: 'load' }); await settle(page, 1300);
  const aim = await page.evaluate(() => JSON.stringify(window.__hmlSave.meta().aim));
  check('save: junk aim names are dropped when the save loads, good ones kept', aim === '{"bev":"loot"}', aim);
  await ctx.close(); }
{ const { ctx, page } = await newPage(browser, VIEWPORTS.se);
  await page.goto(BASE, { waitUntil: 'load' }); await page.waitForFunction(() => window.__hml && window.__hml() && window.__hml().towers[1]); await settle(page, 1500);
  const p = await page.evaluate(() => window.__hml().map.pads[1]); await tapCanvas(page, p[0], p[1]); await settle(page, 500);
  check('first game: tapping Dazza shows no aim row yet', !!(await page.$('#sheet [data-act="sell"]')) && !(await page.$('#sheet .aim')));
  await ctx.close(); }
await browser.close();
console.log(results.every(Boolean) ? 'ALL PASS' : 'SOME FAILED');
process.exit(results.every(Boolean) ? 0 : 1);
