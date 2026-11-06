// The leaderboard's server-side rules, tested against a real Postgres (the same engine Supabase runs).
// Starts a throwaway database, loads supabase/leaderboard.sql, then posts scores as the public "anon" role.
// Also checks the game's own nickname filter (index.html nickOk) agrees with the server's (hml_name_ok).
// Usage: node tests/leaderboard-sql.mjs   (needs PostgreSQL 14+ binaries; skips if they are missing)
import { execFileSync, spawnSync } from 'child_process';
import fs from 'fs'; import os from 'os'; import path from 'path';

const BIN = ['/usr/lib/postgresql/16/bin', '/usr/lib/postgresql/15/bin', '/usr/lib/postgresql/14/bin'].find(d => fs.existsSync(d + '/initdb'));
if (!BIN) { console.log('SKIP leaderboard-sql: no PostgreSQL binaries'); process.exit(0); }
const root = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const asRoot = process.getuid && process.getuid() === 0;
const run = (cmd, args) => asRoot ? execFileSync('su', ['postgres', '-c', [cmd, ...args].map(a => "'" + String(a).replace(/'/g, "'\\''") + "'").join(' ')], { encoding: 'utf8' }) : execFileSync(cmd, args, { encoding: 'utf8' });
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hmlpg-')); if (asRoot) execFileSync('chown', ['postgres', dir]);
const PORT = 54000 + Math.floor(Math.random() * 900);
run(BIN + '/initdb', ['-D', dir + '/data', '-A', 'trust', '-U', 'postgres']);
run(BIN + '/pg_ctl', ['-D', dir + '/data', '-o', '-p ' + PORT + ' -k ' + dir + ' -c listen_addresses=', '-w', '-l', dir + '/log', 'start']);
const results = []; const check = (name, ok, extra) => { results.push(ok); console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra ? '  (' + extra + ')' : '')); };
function sql(q, role) {
  const r = spawnSync('psql', ['-h', dir, '-p', String(PORT), '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-At', '-c', (role ? 'set role ' + role + '; ' : '') + q], { encoding: 'utf8' });
  return { ok: r.status === 0, out: (r.stdout || '').trim(), err: (r.stderr || '').trim() };
}
try {
  // what Supabase gives every project
  sql("create role anon nologin; create role authenticated nologin; grant usage on schema public to anon, authenticated;");
  const load = spawnSync('psql', ['-h', dir, '-p', String(PORT), '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-q', '-f', path.join(root, 'supabase/leaderboard.sql')], { encoding: 'utf8' });
  check('supabase/leaderboard.sql loads cleanly', load.status === 0, load.stderr.trim().split('\n')[0]);
  const again = spawnSync('psql', ['-h', dir, '-p', String(PORT), '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-q', '-f', path.join(root, 'supabase/leaderboard.sql')], { encoding: 'utf8' });
  check('and is safe to run twice', again.status === 0, again.stderr.trim().split('\n')[0]);

  const WEEK = "to_char(date_trunc('week', current_date), 'YYYYMMDD')::int";
  const post = (o) => { const v = Object.assign({ week: WEEK, map: "'lanes'", wave: 30, name: "'Gary Fan'", crew: "'chuck,nan,bonk'", build: 31, player: "'b_test-player-1'", secs: 1500 }, o);
    return sql(`insert into public.scores (week, map, wave, name, crew, build, player, secs) values (${v.week}, ${v.map}, ${v.wave}, ${v.name}, ${v.crew}, ${v.build}, ${v.player}, ${v.secs})`, 'anon'); };
  const rows = (where) => sql('select name, wave from public.scores where ' + where + ' order by id').out;

  check('a fair Long Nap score posts', post({}).ok && rows("player = 'b_test-player-1'") === 'Gary Fan|30');
  check('a worse score from the same player keeps the best', post({ wave: 20, secs: 900 }).ok && rows("player = 'b_test-player-1'") === 'Gary Fan|30');
  check('a better score replaces it (one row per player per board)', post({ wave: 41, secs: 2200 }).ok && rows("player = 'b_test-player-1'") === 'Gary Fan|41');
  const rude = post({ name: "'Sh1t Lord'", player: "'b_test-player-2'" });
  check('a rude nickname is swapped for a harmless one', rude.ok && /^Sleepy [0-9A-F]{4}\|30$/.test(rows("player = 'b_test-player-2'")), rows("player = 'b_test-player-2'"));
  check('wave 151 is rejected as implausible', !post({ wave: 151, secs: 99999, player: "'b_test-player-3'" }).ok);
  check('40 waves in 5 minutes is rejected', !post({ wave: 40, secs: 300, player: "'b_test-player-3'" }).ok);
  check('an unknown level is rejected', !post({ map: "'moon'", player: "'b_test-player-3'" }).ok);
  check('last month’s week is rejected', !post({ week: "to_char(date_trunc('week', current_date) - interval '35 days', 'YYYYMMDD')::int", player: "'b_test-player-3'" }).ok);
  check('a week key that is not a Monday is rejected', !post({ week: "to_char(date_trunc('week', current_date) + interval '2 days', 'YYYYMMDD')::int", player: "'b_test-player-3'" }).ok);
  check('scores from builds before 31 are rejected', !post({ build: 30, player: "'b_test-player-3'" }).ok);
  check('a malformed player id is rejected', !post({ player: "'x'" }).ok);
  check('a nickname with odd characters is rejected', !post({ name: "'<script>'", player: "'b_test-player-3'" }).ok);
  check('a fair Raid score posts (30,000 damage in 3 minutes)', post({ map: "'raid-alarm'", wave: 30000, secs: 180, player: "'b_test-player-4'" }).ok);
  check('a Raid score of 900,000 is rejected', !post({ map: "'raid-alarm'", wave: 900000, secs: 180, player: "'b_test-player-5'" }).ok);
  check('a Raid score too fast for its clock is rejected', !post({ map: "'raid-ranger'", wave: 60000, secs: 10, player: "'b_test-player-5'" }).ok);
  // rate limit: player 6 posts to many boards in a row
  const maps = ['nap', 'paddock', 'creek', 'camp', 'garden', 'woods', 'bigday', 'servo'];
  const okN = maps.map(m => post({ map: `'${m}'`, player: "'b_test-player-6'", wave: 10, secs: 600 }).ok);
  check('rate limit: the 7th post inside 10 minutes is refused', okN.slice(0, 6).every(Boolean) && !okN[6] && !okN[7], okN.map(x => x ? 'y' : 'n').join(''));
  // what the public key can and cannot do
  check('anon can read the board columns', sql("select name, wave, crew from public.scores where map = 'lanes' order by wave desc limit 20", 'anon').ok);
  check('anon cannot read player ids', !sql('select player from public.scores', 'anon').ok);
  check('anon cannot edit scores', !sql("update public.scores set wave = 150", 'anon').ok);
  check('anon cannot delete scores', !sql('delete from public.scores', 'anon').ok);
  check('anon cannot read the rate-limit log', !sql('select * from public.score_posts', 'anon').ok);
  check('anon cannot set its own created_at or id', !sql(`insert into public.scores (id, week, map, wave, name, build, player, secs) values (1, ${WEEK}, 'nap', 5, 'Gaz', 31, 'b_test-player-7', 300)`, 'anon').ok);

  // the client filter and the server filter agree
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const grab = re => (re.exec(html) || [])[0];
  const js = grab(/const NICK_CONTAINS = [^\n]+\n\s*const NICK_TOKENS = [^\n]+\n\s*function nickOk\(n\) \{[\s\S]*?\n  \}/);
  const nickOk = new Function(js + '; return nickOk;')();
  const sqlText = fs.readFileSync(path.join(root, 'supabase/leaderboard.sql'), 'utf8');
  const arr = name => (new RegExp(name + " text\\[\\] := array\\[([^\\]]*)\\]").exec(sqlText) || [])[1].split(',').map(x => x.trim().replace(/'/g, ''));
  const jsArr = name => JSON.parse((new RegExp('const ' + name + ' = (\\[[^\\]]*\\])').exec(html))[1].replace(/'/g, '"'));
  check('word lists match between index.html and the SQL', JSON.stringify(arr('contains_words')) === JSON.stringify(jsArr('NICK_CONTAINS')) && JSON.stringify(arr('token_words')) === JSON.stringify(jsArr('NICK_TOKENS')));
  const names = ['Gary', 'Big Marg', 'Nan Fan 99', 'Cockatoo King', 'Peacock', 'Dickson', 'Bass Player', 'Classy', 'assassin', 'Essex Gaz', 'Sussex', 'Cocky', 'analyst', 'grape', 'Rapunzel', 'Grassy', 'Shitake',
    'fuuuck', 'F_U_C_K', 'sh1t', 'ass', 'Arse', 'dick', 'b1tch', 'KKK', 'wanker', 'Hitler88', 'Mr Twat', 'sex', 'big-cock', 'Cum Lord', 'tits 4 u', 'n1gga', 'Pr1ck', 'p0rn star'];
  const want = { 'Gary': 1, 'Big Marg': 1, 'Nan Fan 99': 1, 'Cockatoo King': 1, 'Peacock': 1, 'Dickson': 1, 'Bass Player': 1, 'Classy': 1, 'assassin': 1, 'Essex Gaz': 1, 'Sussex': 1, 'Cocky': 1, 'analyst': 1, 'grape': 1, 'Rapunzel': 1, 'Grassy': 1 };
  const server = Object.fromEntries(names.map(n => [n, sql(`select public.hml_name_ok('${n}')`).out === 't']));
  const client = Object.fromEntries(names.map(n => [n, nickOk(n)]));
  const disagree = names.filter(n => server[n] !== client[n]);
  check('client and server filters agree on ' + names.length + ' names', !disagree.length, disagree.join(', '));
  const wrong = names.filter(n => n !== 'Shitake' && server[n] !== !!want[n]);
  check('the filter passes ordinary names and blocks rude ones', !wrong.length, wrong.join(', '));
} finally {
  try { run(BIN + '/pg_ctl', ['-D', dir + '/data', '-m', 'immediate', 'stop']); } catch (e) {}
  fs.rmSync(dir, { recursive: true, force: true });
}
console.log(results.every(Boolean) ? 'ALL PASS' : 'SOME FAILED');
process.exit(results.every(Boolean) ? 0 : 1);
