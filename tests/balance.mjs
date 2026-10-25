// Headless balance harness. Loads index.html's simulation as-is and plays every level N times with a
// human-style bot (not an optimiser). Usage:
//   node tests/balance.mjs [--runs 200] [--maps 1-8] [--crew auto|nonan|chuck,nan,...] [--mods hard,speed] [--heat 3] [--tier hard] [--json out.json] [--quiet]
import { loadSim } from './load-sim.mjs';
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import os from 'os';
import fs from 'fs';

const CREW_ALL = ['chuck', 'bonk', 'nan', 'sizzle', 'jezza', 'bev', 'dj', 'pete', 'banjo', 'rocco', 'kev', 'gav', 'val'];
const UNLOCK = { chuck: 0, bonk: 0, nan: 0, sizzle: 0, jezza: 1, bev: 2, dj: 3, pete: 4, banjo: 5, rocco: 7, kev: 12, gav: 15, val: 18 };

// Human-style crew pick for a level: what the game recommends, minus Nan when asked.
export function pickCrew(S, mapIdx, mode, meta) {
  const m = S.MAPS[mapIdx], all = [].concat(...m.waves).map(g => g.t);
  const flyers = all.filter(t => S.ENEMIES[t] && S.ENEMIES[t].flyer).length, armour = all.filter(t => ['pants', 'crab', 'scrapbot', 'pantsalot', 'steve'].includes(t)).length, swarm = all.filter(t => ['mozzie', 'rat', 'gob', 'chick', 'baby'].includes(t)).length;
  const sc = { chuck: 10, nan: 9, sizzle: 8, bonk: 6, jezza: 6, bev: 5, dj: 5, pete: 6, banjo: 5, rocco: 6, kev: 6, gav: 5, val: 6 };
  sc.rocco += swarm * .35 - flyers * .9; sc.kev += swarm * .3 - flyers * .9; sc.nan += armour * .5 + flyers * .4; sc.chuck += swarm * .3 + flyers * .3; sc.bev += flyers * .8; sc.bonk += armour * .3; sc.jezza += swarm * .3;
  if (all.includes('chrisso')) sc.jezza -= 20; if (m.chapter >= 2) { sc.dj += 2; sc.pete += 2; sc.val += 3; }
  let pool = CREW_ALL.filter(k => (meta.wins || 0) >= UNLOCK[k]);
  if (mode === 'nonan') { pool = pool.filter(k => k !== 'nan'); }
  else if (mode && mode !== 'auto') { pool = mode.split(',').filter(k => S.TOWERS[k]); }
  return pool.sort((a, b) => sc[b] - sc[a]).slice(0, 6);
}
// Road coverage score for a pad with a given range: how many road points it reaches, weighted toward Gary's end.
function coverage(S, m, pad, range) {
  let c = 0;
  for (const P of m.P) for (let d = 0; d < P.len; d += 10) { const sg = S.segAt(P, d); if (sg && sg.tp) continue; const q = S.posOn(P, d); if (Math.hypot(q.x - pad[0], q.y - pad[1]) <= range) c += 1 + .5 * (d / P.len); }
  return c;
}
export function playLevel(S, mapIdx, opts) {
  const meta = Object.assign(S.defaultMeta(), { wins: opts.wins == null ? Math.max(0, mapIdx) : opts.wins });
  for (const s of S.SKILLS) meta.xp[s] = opts.xp || 0;
  const rng = (() => { let a = (opts.seed | 0) ^ 0x5bd1e995; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; })();
  const G = S.newRun(meta, opts.seed, mapIdx, opts.mode || 'campaign', null, opts.mods || {});
  G.crew = pickCrew(S, mapIdx, opts.crew, meta);
  if (opts.heat) G.heat = opts.heat; if (opts.tier) G.tier = opts.tier;
  if (opts.grace) { G.grace = true; S.shortFirstLevel(G); G.gold += S.towerCost(G, 'chuck'); S.build(G, 1, 'chuck'); }
  const m = G.map;
  // pads ranked by coverage for a mid-range tower; the bot takes the best open pad each time
  const ranked = m.pads.map((p, i) => ({ i, p, c: coverage(S, m, p, 100 * (p[2] === 'high' ? 1.2 : 1)) * (p[2] === 'shady' ? 1.1 : 1) })).filter(o => !(G.padLock && G.padLock[o.i])).sort((a, b) => b.c - a.c);
  const crew = G.crew.slice(), order = [];
  // build order: cheap damage first, support once there are 3 towers
  const dmg = crew.filter(k => !['sizzle', 'dj', 'val'].includes(k)), sup = crew.filter(k => ['sizzle', 'dj', 'val'].includes(k));
  for (let i = 0; i < 8; i++) { if (i === 3 && sup.length) order.push(sup[0]); order.push(dmg[i % Math.max(1, dmg.length)] || crew[0]); }
  let built = 0, think = 0, t = 0, gap = 0, nextAct = 1.2 + rng() * 1.5;
  const act = () => {
    // 1. keep building up to ~5 towers; 2. then upgrade the best-covered tower; 3. abilities and dream when ready
    const want = built < 5 ? order[built] : null;
    if (want && G.gold >= S.towerCost(G, want)) {
      const range = (S.TOWERS[want].tiers[0].range || S.TOWERS[want].tiers[0].aura || 90);
      const spot = ranked.find(o => !G.towers[o.i] && (S.padRoadDist(m, o.p) <= range * (o.p[2] === 'high' ? 1.2 : 1) - 6));
      if (spot && S.build(G, spot.i, want)) { built++; return; }
    }
    let best = -1, bc = -1;
    G.towers.forEach((tw, i) => { if (!tw) return; const u = S.upgradeCost(G, i); if (u == null || G.gold < u + (built < 4 ? 60 : 0) || S.ultLocked(G, i)) return; const c = ranked.find(o => o.i === i).c / (1 + tw.tier); if (c > bc) { bc = c; best = i; } });
    if (best >= 0 && (built >= 4 || G.gold > 200)) { S.upgrade(G, best); return; }
    if (built >= 5 && G.gold > 150) { const w2 = order[built % order.length]; const range = (S.TOWERS[w2].tiers[0].range || S.TOWERS[w2].tiers[0].aura || 90); const spot = ranked.find(o => !G.towers[o.i] && S.padRoadDist(m, o.p) <= range - 6); if (spot && S.build(G, spot.i, w2)) built++; }
  };
  S.startWave(G);
  while (!G.over && t < 2400) {
    S.update(G, 1 / 60); t += 1 / 60; think += 1 / 60;
    if (think >= nextAct) { think = 0; nextAct = .8 + rng() * 1.2; act(); if (G.waveActive) { G.towers.forEach((tw, i) => { if (tw && S.abilityReady(G, i) && G.enemies.length >= 3 && rng() < .5) S.activate(G, i); }); if (S.canDream(G) && (G.enemies.length >= 5 || G.enemies.some(e => e.boss))) S.unleash(G); } }
    if (!G.waveActive && !G.over) {
      gap += 1 / 60;
      if (gap >= 1.5) { gap = 0; if (G.wave >= 1) { const cards = S.rollCards(G); if (cards.length) S.applyCard(G, cards.find(c => !c.cursed) || cards[0]); } for (let k = 0; k < 3; k++) act(); S.startWave(G); }
    }
  }
  const ratio = G.won ? G.pile / G.pileMax : 0;
  return { won: G.won, wave: G.wave, pile: G.pile, pileMax: G.pileMax, stars: !G.won ? 0 : ratio >= .8 ? 3 : ratio >= .5 ? 2 : 1, secs: Math.round(t), gold: G.gold, towers: G.towers.filter(Boolean).length, lost: G.stats.waveLost.slice() };
}

function parseArgs(argv) { const o = { runs: 100, maps: '1-28', crew: 'auto', json: '', quiet: false }; for (let i = 0; i < argv.length; i++) { const a = argv[i]; if (a === '--quiet') o.quiet = true; else if (a.startsWith('--')) o[a.slice(2)] = argv[++i]; } return o; }
function mapList(s, n) { const out = new Set(); for (const part of String(s).split(',')) { const m = /^(\d+)-(\d+)$/.exec(part); if (m) { for (let i = +m[1]; i <= +m[2]; i++) out.add(i - 1); } else if (part) out.add(+part - 1); } return [...out].filter(i => i >= 0 && i < n); }
export function summarise(rs) {
  const n = rs.length, wins = rs.filter(r => r.won).length, lossW = rs.filter(r => !r.won).map(r => r.wave);
  const avgStars = rs.reduce((a, r) => a + r.stars, 0) / n, lossWave = lossW.length ? (lossW.reduce((a, b) => a + b, 0) / lossW.length) : 0;
  const perWave = []; for (let w = 0; w < 10; w++) { const v = rs.map(r => r.lost[w] || 0); perWave.push(+(v.reduce((a, b) => a + b, 0) / n).toFixed(2)); }
  return { n, winRate: +(wins / n).toFixed(3), avgStars: +avgStars.toFixed(2), avgLossWave: +lossWave.toFixed(1), earlyLoss: +(lossW.filter(w => w <= 3).length / n).toFixed(3), lostPerWave: perWave, avgPile: +(rs.reduce((a, r) => a + r.pile, 0) / n).toFixed(1) };
}

if (isMainThread && import.meta.url === 'file://' + process.argv[1]) {
  const o = parseArgs(process.argv.slice(2));
  const S = loadSim(); const maps = mapList(o.maps, S.MAPS.length);
  const mods = o.mods ? Object.fromEntries(o.mods.split(',').map(k => [k, true])) : null;
  const jobs = maps.map(mi => ({ mi, runs: +o.runs, crew: o.crew, mods, heat: +o.heat || 0, tier: o.tier || '', wins: o.wins != null ? +o.wins : null, xp: +o.xp || 0, grace: o.grace === '1' }));
  const nW = Math.min(jobs.length, Math.max(1, os.cpus().length));
  const results = {}; let next = 0;
  await new Promise(res => { let live = 0; const spawn = () => { while (live < nW && next < jobs.length) { const j = jobs[next++]; live++; const w = new Worker(new URL(import.meta.url), { workerData: j }); w.on('message', r => { results[j.mi] = r; }); w.on('exit', () => { live--; if (next < jobs.length) spawn(); else if (!live) res(); }); } }; spawn(); });
  const rows = maps.map(mi => Object.assign({ level: mi + 1, name: S.MAPS[mi].name, chapter: S.MAPS[mi].chapter || 1 }, results[mi]));
  if (!o.quiet) { console.log(['Lv', 'Name'.padEnd(22), 'win%', 'stars', 'lossW', 'early', 'pile', 'lost/wave'].join('  ')); for (const r of rows) console.log([String(r.level).padStart(2), r.name.padEnd(22), String(Math.round(r.winRate * 100)).padStart(4), r.avgStars.toFixed(2), String(r.avgLossWave).padStart(5), String(Math.round(r.earlyLoss * 100)).padStart(5), String(r.avgPile).padStart(4), r.lostPerWave.join(' ')].join('  ')); }
  if (o.json) fs.writeFileSync(o.json, JSON.stringify({ when: new Date().toISOString(), args: o, rows }, null, 1));
} else if (!isMainThread) {
  const S = loadSim(); const j = workerData; const rs = [];
  for (let i = 0; i < j.runs; i++) rs.push(playLevel(S, j.mi, { seed: 7000 + i * 13 + j.mi, crew: j.crew, mods: j.mods, heat: j.heat, tier: j.tier, wins: j.wins, xp: j.xp, grace: j.grace }));
  parentPort.postMessage(summarise(rs));
}
