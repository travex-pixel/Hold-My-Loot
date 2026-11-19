// The full balance matrix: every level x crew (with Nan / without Nan) x difficulty x modifier, played by the same
// human-style bot as balance.mjs. Writes review/balance.json and review/balance.md.
//   node tests/balance-matrix.mjs [--runs 60] [--only normal,nonan] [--maps 1-28]
import { loadSim } from './load-sim.mjs';
import { playLevel, summarise } from './balance.mjs';
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import os from 'os';
import fs from 'fs';

// tiers apply the same modifiers the level screen does (index.html TIERS)
export const CONFIGS = [
  { id: 'normal', label: 'Normal, recommended crew', crew: 'auto' },
  { id: 'nonan', label: 'Normal, no Nan', crew: 'nonan' },
  { id: 'hard', label: 'Hard tier', crew: 'auto', tier: 'hard', mods: { hard: true, speed: true } },
  { id: 'hard-nonan', label: 'Hard tier, no Nan', crew: 'nonan', tier: 'hard', mods: { hard: true, speed: true } },
  { id: 'nightmare', label: 'Nightmare tier', crew: 'auto', tier: 'nightmare', mods: { hard: true, speed: true, bossrush: true } },
  { id: 'm-hard', label: 'Mod: Hard', crew: 'auto', mods: { hard: true } },
  { id: 'm-speed', label: 'Mod: Speed', crew: 'auto', mods: { speed: true } },
  { id: 'm-nomercy', label: 'Mod: No Mercy', crew: 'auto', mods: { nomercy: true } },
  { id: 'm-chaos', label: 'Mod: Chaos', crew: 'auto', mods: { chaos: true } },
  { id: 'm-bossrush', label: 'Mod: Boss Rush', crew: 'auto', mods: { bossrush: true } },
];

function args(argv) { const o = { runs: 60, only: '', maps: '1-28' }; for (let i = 0; i < argv.length; i++) if (argv[i].startsWith('--')) o[argv[i].slice(2)] = argv[++i]; return o; }
function mapList(s, n) { const out = []; for (const p of String(s).split(',')) { const m = /^(\d+)-(\d+)$/.exec(p); if (m) for (let i = +m[1]; i <= +m[2]; i++) out.push(i - 1); else if (p) out.push(+p - 1); } return out.filter(i => i >= 0 && i < n); }

if (isMainThread) {
  const o = args(process.argv.slice(2));
  const S = loadSim();
  const maps = mapList(o.maps, S.MAPS.length);
  const cfgs = o.only ? CONFIGS.filter(c => o.only.split(',').includes(c.id)) : CONFIGS;
  const jobs = []; for (const c of cfgs) for (const mi of maps) jobs.push({ c, mi, runs: +o.runs });
  const nW = Math.max(1, os.cpus().length);
  const out = {}; let next = 0, done = 0; const t0 = Date.now();
  await new Promise(res => { let live = 0; const go = () => { while (live < nW && next < jobs.length) { const j = jobs[next++]; live++; const w = new Worker(new URL(import.meta.url), { workerData: j }); w.on('message', r => { (out[j.c.id] = out[j.c.id] || {})[j.mi] = r; }); w.on('error', e => { console.error(j.c.id, j.mi + 1, e.message); }); w.on('exit', () => { live--; done++; if (done % 20 === 0) process.stderr.write(`${done}/${jobs.length} ${Math.round((Date.now() - t0) / 1000)}s\n`); if (next < jobs.length) go(); else if (!live) res(); }); } }; go(); });

  const rows = maps.map(mi => { const r = { level: mi + 1, name: S.MAPS[mi].name }; for (const c of cfgs) r[c.id] = out[c.id] && out[c.id][mi]; return r; });
  const prev = fs.existsSync('review/balance.json') ? JSON.parse(fs.readFileSync('review/balance.json', 'utf8')) : null;
  fs.mkdirSync('review', { recursive: true });
  fs.writeFileSync('review/balance.json', JSON.stringify({ when: new Date().toISOString(), build: (/name="hml-build" content="(\d+)"/.exec(fs.readFileSync('index.html', 'utf8')) || [])[1], runs: +o.runs, configs: cfgs, rows }, null, 1));

  // flags: a wall is a level where the recommended crew wins under 60% on Normal; a walkover is a late level that
  // the no-Nan crew wins 100% with 3 stars on Hard (no challenge left even without the strongest character)
  const pct = v => v == null ? '  -' : String(Math.round(v * 100)).padStart(3);
  const lines = ['# Balance matrix', '', `Build ${(/name="hml-build" content="(\d+)"/.exec(fs.readFileSync('index.html', 'utf8')) || [])[1]}, ${o.runs} bot runs per cell, ${jobs.length * o.runs} games in total. Win rate in %.`, '',
    '| Lv | Level | ' + cfgs.map(c => c.id).join(' | ') + ' | flag |', '|---|---|' + cfgs.map(() => '---:').join('|') + '|---|'];
  const flags = [];
  for (const r of rows) {
    const n = r.normal, nn = r.nonan, h = r['hard-nonan'];
    let f = '';
    if (n && n.winRate < .6) f = 'WALL';
    else if (nn && nn.winRate < .4) f = 'wall without Nan';
    else if (r.level >= 6 && h && h.winRate >= 1 && h.avgStars >= 2.9) f = 'walkover';
    if (r.level <= 3 && n && n.winRate < .95) f = (f ? f + ', ' : '') + 'early level not safe';
    if (f) flags.push({ level: r.level, name: r.name, flag: f });
    lines.push(`| ${r.level} | ${r.name} | ` + cfgs.map(c => pct(r[c.id] && r[c.id].winRate)).join(' | ') + ` | ${f} |`);
  }
  lines.push('', '## Configs', '', ...cfgs.map(c => `- **${c.id}**: ${c.label}`), '', '## Flags', '', flags.length ? flags.map(f => `- Level ${f.level} ${f.name}: ${f.flag}`).join('\n') : 'None.');
  fs.writeFileSync('review/balance.md', lines.join('\n') + '\n');
  console.log(lines.join('\n'));
} else {
  const S = loadSim(); const { c, mi, runs } = workerData; const rs = [];
  for (let i = 0; i < runs; i++) rs.push(playLevel(S, mi, { seed: 7000 + i * 13 + mi, crew: c.crew, mods: c.mods || {}, tier: c.tier || '' }));
  parentPort.postMessage(summarise(rs));
}
