// Regression checks for the known bugs fixed in build 32 (DESIGN.md section 10). Simulation checks first, then the
// screens in a real browser.
// Usage: node tests/knownbugs.mjs   (the browser part needs node tests/serve.mjs 8081 running; HML_URL overrides)
import fs from 'fs';
import { loadSim, readIndex } from './load-sim.mjs';
import { launch, newPage, VIEWPORTS, BASE, settle, tapCanvas } from './lib.mjs';
const results = []; const check = (name, ok, extra) => { results.push(!!ok); console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra ? '  (' + extra + ')' : '')); };
const html = readIndex(), S = loadSim(html);
const vet = () => { const m = Object.assign(S.defaultMeta(), { wins: 28 }); for (const k of S.SKILLS) m.xp[k] = 6000; return m; };

// ---------- Raid: there is no next wave to call early ----------
{ const ri = S.MAPS.findIndex(m => m.id === 'longpad'); const G = S.newRun(vet(), 3, ri, 'raid'); S.initRaid(G, 'landlord'); G.gold = 1e6;
  S.build(G, 1, 'nan'); S.build(G, 2, 'chuck'); S.startWave(G);
  let early = 0, gaps = 0; for (let f = 0; f < 60 * 40 && !G.over; f++) { S.update(G, 1 / 60); if (!G.spawnQ.length) gaps++; if (S.canCallEarly(G)) early++; }
  check('raid: the Start button never offers "Send next early" (it spawned a second raid boss)', gaps > 0 && early === 0, early + ' frames offered it'); }

// ---------- Big Kev's Stampede reaches the road ----------
{ // the reachable pallet furthest from the road, and a monster on the road near it but more than 140 from the pallet
  let best = null;
  for (let mi = 0; mi < S.MAPS.length; mi++) { const G0 = S.newRun(vet(), 5, mi, 'campaign');
    G0.map.pads.forEach((p, i) => { const d = S.padRoadDist(G0.map, p), reach = 100 * (p[2] === 'high' ? 1.2 : 1) - 6; if (!(G0.padLock && G0.padLock[i]) && d <= reach && (!best || d > best.d)) best = { mi, i, d }; }); }
  const G = S.newRun(vet(), 5, best.mi, 'campaign'); G.gold = 1e6; S.build(G, best.i, 'kev'); for (let k = 0; k < 3; k++) S.upgrade(G, best.i);
  const P = G.map.pads[best.i]; let spot = null;
  for (let pi = 0; pi < G.map.P.length; pi++) { const Pth = G.map.P[pi]; let rd = 0, rq = null, bd = 1e9; for (let d = 0; d < Pth.len; d += 2) { const q = S.posOn(Pth, d), dd = Math.hypot(q.x - P[0], q.y - P[1]); if (dd < bd) { bd = dd; rd = d; rq = q; } }
    for (let d = 0; d < Pth.len && !spot; d += 2) { const q = S.posOn(Pth, d); if (Math.hypot(q.x - rq.x, q.y - rq.y) < 125 && Math.hypot(q.x - P[0], q.y - P[1]) > 150) spot = { pi, d, q }; } if (spot) break; }
  S.startWave(G); G.spawnQ.length = 0; G.spawnQ.push({ type: 'rat', at: 1e9 }); G.enemies.length = 0;
  const e = S.spawn(G, 'skel', spot.d, spot.pi); e.hp = e.maxHp = 1e6; e.x = spot.q.x; e.y = spot.q.y;
  const t = G.towers[best.i]; t.ucd = 0; t.cd = 99; G.fxq.length = 0; S.update(G, 1 / 60);
  check('kev: a Stampede hits monsters on the road beside him, not only within 140 of his pallet', G.fxq.some(f => f.kind === 'stampede' && !f.big) && e.hp < 1e6, S.MAPS[best.mi].id + ' pallet ' + best.i + ', ' + Math.round(best.d) + ' from the road, monster ' + Math.round(Math.hypot(e.x - P[0], e.y - P[1])) + ' away'); }
{ // over real waves his tier-4 damage rises a little, not a lot (compared with the Stampede centred on his pallet).
  // Damage is measured with Kev alone (with a crew, who gets the kill is noise); how often it fires, with a crew.
  const old = html.replace('Math.hypot(e.x - rp.x, e.y - rp.y) < 140', 'Math.hypot(e.x - px, e.y - py) < 140');
  const meter = src => loadSim(src.replace('e.hp -= eff; if (o.kind)', 'if (o.src === "charging") G.__kd = (G.__kd || 0) + Math.min(eff, Math.max(0, e.hp)); e.hp -= eff; if (o.kind)'));
  const run = (Sx, crew) => { let st = 0, dmg = 0;
    for (let mi = 0; mi < Sx.MAPS.length; mi += 3) { const G0 = Sx.newRun(vet(), 7, mi, 'campaign');
      const pads = G0.map.pads.map((p, i) => [i, Sx.padRoadDist(G0.map, p)]).filter(([i, d]) => !(G0.padLock && G0.padLock[i]) && d <= 100 * (G0.map.pads[i][2] === 'high' ? 1.2 : 1) - 6);
      for (const [pad] of pads.filter((_, k) => k % 4 === 0)) {
        const G = Sx.newRun(vet(), 11 + pad, mi, 'campaign'); G.gold = 1e6; G.pileMax = G.pile = 9999; Sx.build(G, pad, 'kev'); for (let k = 0; k < 3; k++) Sx.upgrade(G, pad);
        const others = pads.filter(([j]) => j !== pad).sort((a, b) => a[1] - b[1]);
        if (crew) ['nan', 'chuck', 'bonk', 'jezza', 'bev'].forEach((ty, k) => { const o = others[(k * 3 + pad) % others.length]; if (o && !G.towers[o[0]]) { Sx.build(G, o[0], ty); Sx.upgrade(G, o[0]); Sx.upgrade(G, o[0]); } });
        G.wave = Math.min(G.waveCount, 6) - 1; Sx.startWave(G);
        for (let f = 0; f < 60 * 70 && G.waveActive && !G.over; f++) { Sx.update(G, 1 / 60); for (const x of G.fxq) if (x.kind === 'stampede' && !x.big) st++; G.fxq.length = 0; G.events.length = 0; }
        dmg += G.__kd || 0; } }
    return { st, dmg }; };
  const So = meter(old), Sn = meter(html), a = run(So, true), b = run(Sn, true), a1 = run(So, false), b1 = run(Sn, false), ratio = b1.dmg / a1.dmg;
  check('kev: with a crew around him his Stampede goes off more often', b.st > a.st, 'stampedes ' + a.st + ' -> ' + b.st);
  check('kev: his tier-4 damage over a wave rises modestly, not wildly (under 15%)', ratio > 1 && ratio < 1.15, 'x' + ratio.toFixed(3) + ', ' + Math.round(a1.dmg) + ' -> ' + Math.round(b1.dmg)); }

// ---------- Odd Jobs only ask for crew you can field ----------
{ const six = ['nan', 'chuck', 'jezza', 'bonk', 'bev', 'rocco'], needs = id => (S.JOBS.find(J => J.id === id) || {}).crew;
  const crewJobs = S.JOBS.filter(J => J.crew).map(J => J.id);
  check('jobs: every job that needs a crew member says so (Nan crits, Banana Splits, Long Peter, DJ tips...)', ['crits', 'tipsy', 'birds', 'chuckk', 'bonkk', 'splits', 'lifts', 'tips'].every(id => crewJobs.includes(id)), crewJobs.join(','));
  let bad = [], seenAny = new Set();
  for (let k = 0; k < 300; k++) { const m = vet(); m.jobs = []; m.lastJob = null; S.ensureJobs(m, six); for (const j of m.jobs) { seenAny.add(j.id); if (needs(j.id) && !six.includes(needs(j.id))) bad.push(j.id); } }
  check('jobs: new jobs never ask for crew outside the six', !bad.length && [...seenAny].some(id => needs(id)), bad.slice(0, 5).join(',') || [...seenAny].join(','));
  const m = vet(); m.jobs = [{ id: 'splits', n: 5, p: 2, reward: 15 }, { id: 'crits', n: 15, p: 3, reward: 15 }, { id: 'perfect', n: 4, p: 1, reward: 15 }]; S.ensureJobs(m, six);
  check('jobs: a held job for someone outside the six (Banana Splits) is swapped; the rest keep their progress', !m.jobs.some(j => j.id === 'splits') && m.jobs.length === 3 && m.jobs.find(j => j.id === 'crits').p === 3 && m.jobs.find(j => j.id === 'perfect').p === 1, m.jobs.map(j => j.id).join(','));
  const m2 = vet(); m2.jobs = [{ id: 'splits', n: 5, p: 2, reward: 15 }]; S.ensureJobs(m2);
  check('jobs: with no crew given (fresh saves, damaged saves) nothing is dropped', m2.jobs[0].id === 'splits' && m2.jobs.length === 3);
  let bad2 = [];
  for (let k = 0; k < 40; k++) { const mm = vet(); mm.jobs = []; const G = S.newRun(mm, 9 + k, 0, 'campaign'); G.fieldCrew = six; G.over = true; S.finishRun(G); for (const j of mm.jobs) if (needs(j.id) && !six.includes(needs(j.id))) bad2.push(j.id); }
  check('jobs: the jobs handed out at the end of a level fit the crew too', !bad2.length, bad2.slice(0, 5).join(',')); }

// ---------- in the browser ----------
const b30 = JSON.parse(fs.readFileSync(new URL('./fixtures/save-build30.json', import.meta.url))); b30.settings.analytics = false; b30.seenBuild = 99;
const seed = (ctx, m) => ctx.addInitScript(s => { if (sessionStorage.getItem('x')) return; sessionStorage.setItem('x', 1); localStorage.clear(); localStorage.setItem('hml.meta.v3', s); }, JSON.stringify(m));
const browser = await launch();
// the free Dazza counts as a placed crew member, flagged free; first_tower_placed is the player's own first hire
{ const { ctx, page } = await newPage(browser, VIEWPORTS.se); const evs = [];
  await page.route(/posthog\.com/, r => { try { evs.push(JSON.parse(r.request().postData() || '{}')); } catch (e) {} r.fulfill({ status: 200, body: '{}' }); });
  await page.goto(BASE, { waitUntil: 'load' }); await page.waitForFunction(() => window.__hml && window.__hml() && window.__hml().towers[1]); await settle(page, 1200);
  const placed = () => evs.filter(e => e.event === 'tower_placed').map(e => e.properties), firsts = () => evs.filter(e => e.event === 'first_tower_placed').map(e => e.properties);
  const p0 = placed();
  check('analytics: the free Dazza sends tower_placed with free: true', p0.length === 1 && p0[0].tower === 'chuck' && p0[0].free === true, JSON.stringify(p0));
  check('analytics: the free Dazza is not the player’s first_tower_placed', firsts().length === 0);
  const pad = await page.evaluate(() => { const g = window.__hml(); g.gold = 999; return g.map.pads.map((p, i) => [i, p, padRoadDist(g.map, p)]).filter(([i]) => !g.towers[i] && !(g.padLock && g.padLock[i])).sort((a, b) => a[2] - b[2])[0][1]; });
  await tapCanvas(page, pad[0], pad[1]); await settle(page, 500);
  await page.click('#sheet .bcard:not(.poor):not(.far)', { force: true }); await settle(page, 500);
  const p1 = placed(), f1 = firsts();
  check('analytics: the player’s own first hire sends tower_placed (not free) and first_tower_placed', p1.length === 2 && !p1[1].free && f1.length === 1 && f1[0].tower === p1[1].tower, JSON.stringify(f1));
  check('no page errors in the first game', page.errors.length === 0, page.errors[0]);
  await ctx.close(); }
// the Heat row waits until Heat has started
for (const [label, extra, want] of [['before Heat starts', { wins: 6, heat: 0, heatSeen: undefined }, null], ['once Heat is on', { wins: 6, heat: 2, heatSeen: true }, /Heat 2: monsters \+16%/]]) {
  const { ctx, page } = await newPage(browser, VIEWPORTS.se); const m = Object.assign({}, b30, extra); if (extra.heatSeen === undefined) delete m.heatSeen;
  await seed(ctx, m); await page.goto(BASE, { waitUntil: 'load' }); await settle(page, 1300);
  await page.evaluate(() => document.querySelector('.level[data-map="0"]').click()); await settle(page, 400);
  const row = await page.evaluate(() => { const r = document.querySelector('#modalCard .heatrow'); return r ? r.innerText : null; });
  check('level screen: Heat row ' + label + (want ? ' shows the Heat' : ' is not shown as "Heat 0"'), want ? row && want.test(row) : row === null, String(row));
  await ctx.close(); }
// the Mastery Path goal opens a card with no dead Select button; Odd Jobs fit the custom six
{ const { ctx, page } = await newPage(browser, VIEWPORTS.se);
  const m = Object.assign({}, b30, { paths: {}, jobs: [{ id: 'splits', n: 5, p: 2, reward: 15 }, { id: 'lifts', n: 20, p: 0, reward: 15 }, { id: 'crits', n: 40, p: 12, reward: 30 }] });
  for (const k in m.xp) m.xp[k] = 6000;
  await seed(ctx, m); await page.goto(BASE, { waitUntil: 'load' }); await settle(page, 1300);
  const jobs = await page.evaluate(() => window.__hmlSave.meta().jobs.map(j => j.id));
  check('home: Odd Jobs for crew outside the six (Banana Splits, Long Peter) are swapped out; Nan’s crits stay', !jobs.includes('splits') && !jobs.includes('lifts') && jobs.includes('crits') && jobs.length === 3, jobs.join(','));
  check('home: the "Choose a Mastery Path" goal is there', !!(await page.$('[data-pathgoal]')));
  await page.click('[data-pathgoal]', { force: true }); await settle(page, 500);
  check('mastery goal: the crew card has Back and the paths, and no Select/Remove button that does nothing', !(await page.$('#ciSel')) && !!(await page.$('#ciBack')) && (await page.$$('.pathbtn')).length >= 2);
  await page.click('.pathbtn', { force: true }); await settle(page, 400);
  check('mastery goal: picking a path still works and the card stays without the dead button', Object.keys(await page.evaluate(() => window.__hmlSave.meta().paths || {})).length === 1 && !(await page.$('#ciSel')));
  await page.click('#ciBack', { force: true }); await settle(page, 500);
  check('mastery goal: Back returns home', await page.evaluate(() => !!document.getElementById('playBtn') || !!document.querySelector('.level[data-map]')));
  check('no page errors on the home screen', page.errors.length === 0, page.errors[0]);
  await ctx.close(); }
// Raid: no "Send next early" mid-raid, and "Done!" (not a stale "Start wave N") when it ends
{ const { ctx, page } = await newPage(browser, VIEWPORTS.se); await seed(ctx, Object.assign({}, b30, { wins: 14 }));
  await page.goto(BASE, { waitUntil: 'load' }); await settle(page, 1300);
  await page.click('#raidBtn', { force: true }); await settle(page, 400); await page.click('#rdPlay', { force: true }); await settle(page, 1200);
  await page.evaluate(() => { const g = window.__hml(); g.gold = 99999; build(g, 1, 'nan'); build(g, 2, 'chuck'); });
  await page.click('#startBtn', { force: true }); await settle(page, 400);
  const labels = new Set();
  for (let i = 0; i < 10; i++) { await page.evaluate(() => { const g = window.__hml(); for (let f = 0; f < 120; f++) update(g, 1 / 60); }); await settle(page, 120); labels.add(await page.$eval('#startBtn', b => b.textContent)); }
  check('raid: mid-raid the Start button never offers "Send next early"', ![...labels].some(l => /early/i.test(l)), [...labels].join(' | '));
  await page.evaluate(() => { window.__hml().raidT = 0.05; }); await settle(page, 600);
  const end = await page.$eval('#startBtn', b => b.textContent);
  await settle(page, 2000); const later = await page.$eval('#startBtn', b => b.textContent);
  check('raid: when it ends the Start button reads Done!, not a stale "Start wave N"', end === 'Done!' && later === 'Done!', end + ' / ' + later);
  check('no page errors in the Raid', page.errors.length === 0, page.errors[0]);
  await ctx.close(); }
await browser.close();
console.log(results.every(Boolean) ? 'ALL PASS' : 'SOME FAILED');
process.exit(results.every(Boolean) ? 0 : 1);
