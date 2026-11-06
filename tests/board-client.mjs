// The game's side of the global leaderboard, against a mocked Supabase: nickname filter, what gets posted, failures.
// Usage: node tests/board-client.mjs   (needs node tests/serve.mjs 8081 running)
import fs from 'fs';
import { launch, VIEWPORTS, BASE, settle } from './lib.mjs';
const b30 = JSON.parse(fs.readFileSync(new URL('./fixtures/save-build30.json', import.meta.url))); delete b30.nick; b30.settings.analytics = false;
const browser = await launch(); const results = [];
const check = (name, ok, extra) => { results.push(ok); console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra ? '  (' + extra + ')' : '')); };

async function open({ fail = false } = {}) {
  const vp = VIEWPORTS.i15;
  const ctx = await browser.newContext({ viewport: vp.viewport, deviceScaleFactor: 1, isMobile: true, hasTouch: true, userAgent: vp.userAgent });
  await ctx.addInitScript(s => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('hml.meta.v3', s); }, JSON.stringify(b30));
  const page = await ctx.newPage(); const posts = [], gets = [];
  page.errors = []; page.on('pageerror', e => page.errors.push(String(e)));
  await page.route(/posthog\.com/, r => r.fulfill({ status: 200, body: '{}' }));
  // the page as served, with the board switched on
  await page.route(u => u.pathname === '/' || u.pathname.endsWith('/index.html'), async r => {
    const res = await r.fetch(); const html = (await res.text()).replace("window.HML_BOARD = { url: '', key: '' };", "window.HML_BOARD = { url: 'https://fake.supabase.co', key: 'anon-key' };");
    r.fulfill({ response: res, body: html, headers: Object.assign({}, res.headers(), { 'content-type': 'text/html; charset=utf-8' }) });
  });
  await page.route(/fake\.supabase\.co/, r => {
    const q = r.request();
    if (q.method() === 'POST') { posts.push({ body: JSON.parse(q.postData()), headers: q.headers() }); return r.fulfill({ status: fail ? 500 : 201, body: '' }); }
    gets.push(q.url()); return fail ? r.abort() : r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ name: 'Nan Fan', wave: 44, crew: 'nan' }, { name: 'Gaz', wave: 11, crew: 'chuck' }]) });
  });
  await page.goto(BASE, { waitUntil: 'load' }); await settle(page, 1200);
  return { ctx, page, posts, gets };
}
async function endLongNap(page, wave, secs) {
  await page.click('#longBtn'); await settle(page, 300);
  if (await page.$('[data-l]')) { await page.click('[data-l]'); await settle(page, 600); }
  await page.click('#bdPlay'); await settle(page, 600);
  await page.evaluate(([w, t]) => { const g = window.__hml(); g.wave = w; g.t = t; g.pile = 0; }, [wave, secs]);
  // the run ends when a monster walks off with the last of the pile, which takes a few game seconds
  await page.waitForFunction(() => !!document.getElementById('nickIn'), null, { timeout: 60000 }).catch(() => {});
}

{ const { ctx, page, posts, gets } = await open();
  await page.click('#longBtn'); await settle(page, 300);
  if (await page.$('[data-l]')) { await page.click('[data-l]'); await settle(page, 800); }
  check('the Long Nap screen loads the global board', gets.length >= 1 && /week=eq\.\d{8}/.test(gets[0]) && /Nan Fan/.test(await page.innerText('#bdRows')));
  await page.click('#bdBack').catch(() => {}); await settle(page, 300); await page.click('#lnBack').catch(() => {}); await settle(page, 300);
  await endLongNap(page, 12, 700);
  check('a finished Long Nap asks for a nickname', !!(await page.$('#nickIn')));
  await page.fill('#nickIn', 'Sh1t Lord'); await page.click('#nickGo'); await settle(page, 600);
  check('a rude nickname is refused in the game and nothing is posted', posts.length === 0 && !!(await page.$('#nickIn')));
  await page.fill('#nickIn', 'Gaz <3 Nan!!'); await page.click('#nickGo'); await settle(page, 900);
  const p0 = posts[0] && posts[0].body;
  check('a fair nickname posts once', posts.length === 1, posts.length + ' posts');
  check('the post carries the wave, game seconds, build and a board-only player id', p0 && p0.wave >= 11 && p0.wave <= 12 && p0.secs >= 700 && p0.secs < 900 && p0.build >= 30 && /^b_/.test(p0.player) && p0.name === 'Gaz 3 Nan', JSON.stringify(p0));
  check('the post uses return=minimal (the public key cannot read rows back)', posts[0] && /return=minimal/.test(posts[0].headers.prefer || ''));
  check('the player id is not the analytics id', p0 && p0.player !== await page.evaluate(() => localStorage.getItem('hml.anon')));
  check('no page errors', page.errors.length === 0, page.errors.slice(0, 2).join(' | '));
  await ctx.close(); }

{ const { ctx, page } = await open({ fail: true });
  await endLongNap(page, 8, 500);
  await page.fill('#nickIn', 'Gaz'); await page.click('#nickGo'); await settle(page, 1200);
  check('when the board is down the results screen says so and the game carries on', /Couldn.t reach the leaderboard/.test(await page.innerText('#modalCard')) && page.errors.length === 0, page.errors.slice(0, 1).join(''));
  await ctx.close(); }

await browser.close();
console.log(results.every(Boolean) ? 'ALL PASS' : 'SOME FAILED');
process.exit(results.every(Boolean) ? 0 : 1);
