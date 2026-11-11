// Every automated check, in order, stopping at the first failure. Needs `node tests/serve.mjs 8081` running.
// Usage: node tests/run-all.mjs [--skip-perf]
import { spawnSync } from 'child_process';
const skipPerf = process.argv.includes('--skip-perf');
const suites = ['syntax', 'smoke-sim', 'taster-sim', 'leaderboard-sql', 'og', 'first-minute', 'saves', 'offline', 'consent', 'board-client', 'support', 'share', 'polish', 'bugbash', 'portal']
  .concat(skipPerf ? [] : ['perf-startup', 'perf-play']);
const t0 = Date.now(); const done = [];
for (const s of suites) {
  const t = Date.now(); const r = spawnSync('node', ['tests/' + s + '.mjs'], { encoding: 'utf8', timeout: 900000 });
  const out = (r.stdout || '') + (r.stderr || ''); const fails = out.split('\n').filter(l => /^FAIL/.test(l));
  const ok = r.status === 0 && !fails.length;
  console.log((ok ? 'PASS ' : 'FAIL ') + s.padEnd(16) + Math.round((Date.now() - t) / 1000) + 's' + (fails.length ? '  ' + fails.slice(0, 3).join(' | ') : ''));
  done.push([s, ok]);
  if (!ok) { console.log(out.split('\n').slice(-15).join('\n')); process.exit(1); }
}
console.log('ALL ' + done.length + ' SUITES PASS in ' + Math.round((Date.now() - t0) / 1000) + 's');
