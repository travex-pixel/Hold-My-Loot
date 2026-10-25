// How does a brand-new player's 3-wave taster actually go? Three behaviours, N runs each.
import { loadSim } from './load-sim.mjs';
const S = loadSim();
const N = +process.argv[2] || 300;
function taster(seed, behaviour) {
  const meta = S.defaultMeta();
  const G = S.newRun(meta, seed, 0, 'campaign');
  G.grace = true; S.shortFirstLevel(G);
  G.gold += S.towerCost(G, 'chuck'); S.build(G, 1, 'chuck'); G.freeDazza = true;   // what startTut does
  if (behaviour === 'taps') G.instantLoot = true;
  let t = 0, built2 = false, gap = 0;
  S.startWave(G);
  while (!G.over && t < 900) {
    S.update(G, 1 / 60); t += 1 / 60;
    if (!G.waveActive && !G.over) { gap += 1 / 60; if (gap >= 2.2) { gap = 0; S.startWave(G); } }   // auto-start like the UI
    if (behaviour === 'coach' || behaviour === 'taps') {
      // follows the coach literally: hires one more Dazza when told, upgrades only if told between waves
      if (!built2 && G.waveActive && G.waveT > 2.5 && G.gold >= S.towerCost(G, 'chuck')) { S.build(G, 3, 'chuck'); built2 = true; }
      if (!G.waveActive && G.towers[1] && S.upgradeCost(G, 1) != null && G.gold >= S.upgradeCost(G, 1)) S.upgrade(G, 1);
    } else if (behaviour === 'spender') {
      // spends everything as soon as possible, sensible order
      const order = [[3, 'nan'], [4, 'chuck'], [0, 'bonk'], [2, 'sizzle']];
      for (const [p, k] of order) if (!G.towers[p] && G.gold >= S.towerCost(G, k)) { S.build(G, p, k); break; }
      for (let p = 0; p < G.towers.length; p++) if (G.towers[p] && S.upgradeCost(G, p) != null && G.gold >= S.upgradeCost(G, p) + 60) { S.upgrade(G, p); break; }
    }
  }
  return { won: G.won, pile: G.pile, wave: G.wave, t, gold: G.gold };
}
for (const b of ['coach', 'taps', 'spender']) {
  const rs = []; for (let i = 0; i < N; i++) rs.push(taster(1000 + i, b));
  const wins = rs.filter(r => r.won).length, piles = rs.map(r => r.pile).sort((a, b) => a - b);
  const stars = rs.map(r => !r.won ? 0 : r.pile / 10 >= .8 ? 3 : r.pile / 10 >= .5 ? 2 : 1);
  console.log(b.padEnd(8), 'win', (100 * wins / N).toFixed(0) + '%', 'pile median', piles[N >> 1], 'p10', piles[N / 10 | 0], 'stars 3/2/1/0:', [3, 2, 1, 0].map(s => stars.filter(x => x === s).length).join('/'), 'avg secs', (rs.reduce((a, r) => a + r.t, 0) / N).toFixed(0), 'avg gold left', (rs.reduce((a, r) => a + r.gold, 0) / N).toFixed(0));
}
