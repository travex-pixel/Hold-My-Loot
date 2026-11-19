import { loadSim, buildNumber } from './load-sim.mjs';
const S = loadSim();
console.log('build', buildNumber(), 'maps', S.MAPS.length, 'towers', Object.keys(S.TOWERS).length, 'enemies', Object.keys(S.ENEMIES).length);
const G = S.newRun(S.defaultMeta(), 1, 0, 'campaign');
G.gold += 500; console.log('build ok', S.build(G, 1, 'nan'), S.startWave(G));
let t = 0; while (!G.over && t < 600) { S.update(G, 1 / 60); t += 1 / 60; if (!G.waveActive && !G.over) S.startWave(G); }
console.log('run', { over: G.over, won: G.won, wave: G.wave, pile: G.pile, t: Math.round(t) });
