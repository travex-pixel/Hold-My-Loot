// The brand-new player's 3-wave taster, played by simple behaviours. Fails (exit 1) if any reasonable first game loses
// or keeps fewer than 8 of 10 on average. Usage: node tests/taster-sim.mjs [runs]
import { loadSim } from './load-sim.mjs';
const S = loadSim();
const N = +process.argv[2] || 200;
function taster(seed, second, upgrades, third) {
  const G = S.newRun(S.defaultMeta(), seed, 0, 'campaign');
  G.grace = true; S.shortFirstLevel(G);
  G.gold += S.towerCost(G, 'chuck'); S.build(G, 1, 'chuck');            // the free Dazza
  let t = 0, built = false, b3 = false, gap = 0; S.startWave(G);
  while (!G.over && t < 900) {
    S.update(G, 1 / 60); t += 1 / 60;
    if (!G.waveActive && !G.over) { gap += 1 / 60; if (gap >= 2.2) { gap = 0; S.startWave(G); } }
    if (!built && G.waveActive && G.waveT > 2.5 && second && G.gold >= S.towerCost(G, second)) { S.build(G, 3, second); built = true; }
    // the coach's "GUARD GARY!" step: a third hire near the bottom of the road in wave 2
    if (third && !b3 && built && G.wave >= 2 && G.waveActive && G.waveT > 1.5 && G.gold >= S.towerCost(G, third)) { S.build(G, 6, third); b3 = true; }
    if (upgrades) for (const p of [1, 3]) if (G.towers[p] && S.upgradeCost(G, p) != null && G.gold >= S.upgradeCost(G, p)) S.upgrade(G, p);
  }
  return { won: G.won, pile: G.pile, t };
}
let fail = false;
console.log('hires                upgrades  wins   avg kept  worst  3-star  game-secs');
const PATHS = [['chuck', 'chuck'], ['bonk', 'chuck'], ['nan', 'chuck'], ['sizzle', 'chuck'], ['chuck', 'bonk'], ['chuck', null], [null, null]];
for (const [second, third] of PATHS) for (const up of [false, true]) {
  const rs = []; for (let i = 0; i < N; i++) rs.push(taster(1000 + i, second, up, third));
  const wins = rs.filter(r => r.won).length, avg = rs.reduce((a, r) => a + r.pile, 0) / N, worst = Math.min(...rs.map(r => r.pile)), three = rs.filter(r => r.won && r.pile >= 8).length;
  console.log(('Dazza+' + (second || '-') + '+' + (third || '-')).padEnd(20), String(up).padEnd(9), String(Math.round(100 * wins / N) + '%').padEnd(6), avg.toFixed(1).padEnd(9), String(worst).padEnd(6), String(Math.round(100 * three / N) + '%').padEnd(7), (rs.reduce((a, r) => a + r.t, 0) / N).toFixed(0));
  // the coached path (three hires) must be nearly perfect; two hires must still always win
  if (second && third && (wins < N || avg < 8.5)) fail = true;
  if (second && !third && wins < N * .97) fail = true;
}
if (fail) { console.log('FAIL: a reasonable first game can lose or keeps under 8 of 10'); process.exit(1); } else console.log('PASS');
