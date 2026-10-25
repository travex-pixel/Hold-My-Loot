// "Before" tour, part 2: menus, refresh/resume, pause/background, landscape, veteran screens, edge states. Usage: node tests/tour2.mjs se|i15|px8|desk
import fs from 'fs';
import { launch, newPage, VIEWPORTS, shotDir, shot, shotFull, G, state, advance, build, upgradeN, settle, waitModal, BASE, tapCanvas } from './lib.mjs';
const key = process.argv[2] || 'se', vp = VIEWPORTS[key], dir = shotDir('before/' + key), log = [];
const say = (...a) => { const s = a.join(' '); log.push(s); console.log(s); };
const click = async (page, sel, ms = 5000) => page.click(sel, { force: true, timeout: ms }).catch(() => say('click failed', sel));
const browser = await launch();
try {
  let { ctx, page } = await newPage(browser, vp, { init: () => localStorage.setItem('hml.meta.v3', JSON.stringify({ v: 3, runs: 2, wins: 1, rocks: 35, shards: 6, garyXp: 200, xp: { chucking: 300, bonking: 40, muttering: 90, sizzling: 30, scrounging: 120 }, maps: { nap: { plays: 1, wins: 1, stars: 2, bestKept: 6 }, paddock: { plays: 1, wins: 0, stars: 0, bestKept: 0 } }, stash: { Bucket: 2, 'Thong of Swiftness': 1 }, totals: { kills: 80, crits: 0, heists: 3, snatches: 0, banked: 5, pokes: 0, time: 400, bosses: { kevin: 1 }, tipsy: 0, bestCombo: 6, rocksEarned: 35 }, settings: { sound: true, volume: .6, music: true }, seenBuild: 30, tutDone: 1, jezzaSeen: true, firstSeen: Date.now() - 3600000, sessions: 2, giftKey: 0 })) });
  await page.goto(BASE, { waitUntil: 'load' }); await page.waitForFunction(() => !document.getElementById('modal').hidden); await settle(page, 800);
  // menu tabs + settings: the hamburger is under the home modal, so open it from inside a run
  say('menuBtn hit on home:', await page.evaluate(() => { const r = document.getElementById('menuBtn').getBoundingClientRect(); const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return el.id || el.className; }));
  await click(page, '.level[data-map="0"]'); await settle(page, 300); await click(page, '#lvPlay'); await settle(page, 1200);
  await click(page, '#menuBtn'); await settle(page, 400); await shotFull(page, dir, '34-menu-skills');
  for (const t of ['synergy', 'stats', 'settings']) { await click(page, '.tab[data-tab="' + t + '"]'); await settle(page, 300); await shotFull(page, dir, '35-menu-' + t); }
  if (await page.$('#quitBtn')) { await click(page, '#quitBtn'); await settle(page, 600); } else { await click(page, '#menuClose'); await settle(page, 300); }
  if (await page.$('#fbLink')) { await click(page, '#fbLink'); await settle(page, 300); await shot(page, dir, '36-feedback'); await click(page, '#fbBack'); await settle(page, 300); }
  if (await page.$('#wnLink')) { await click(page, '#wnLink'); await settle(page, 300); await shotFull(page, dir, '37-whats-new'); await click(page, '#clBack'); await settle(page, 300); }
  // ===== hard refresh mid-level: start level 1 replay, play a wave, reload =====
  await click(page, '.level[data-map="0"]'); await settle(page, 300); await click(page, '#lvPlay'); await settle(page, 1200);
  await shot(page, dir, '38-level1-replay-start'); say('replay L1', JSON.stringify(await G(page)), JSON.stringify(await state(page)));
  await build(page, 1, 'nan'); await click(page, '#startBtn'); await settle(page, 200); await advance(page, 120); await settle(page, 700);
  if (await page.$('.dcard')) { const c = await page.$('.dcard:not([disabled])'); if (c) { await c.click({ force: true, timeout: 3000 }).catch(() => {}); await settle(page, 300); } }
  await click(page, '#startBtn'); await settle(page, 1500); await shot(page, dir, '39-midwave-before-refresh');
  await page.reload({ waitUntil: 'load' }); await settle(page, 1200); await shotFull(page, dir, '40-after-refresh-home'); say('after refresh', (await page.evaluate(() => document.getElementById('modalCard').innerText)).slice(0, 300).replace(/\n/g, ' / '));
  if (await page.$('#contBtn')) { await click(page, '#contBtn'); await settle(page, 800); await shot(page, dir, '41-continued-run'); say('continued', JSON.stringify(await G(page))); }
  // pause / resume / background
  await click(page, '#startBtn'); await settle(page, 1200); await click(page, '#pauseBtn'); await settle(page, 300); await shot(page, dir, '42-paused');
  await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true }); Object.defineProperty(document, 'hidden', { value: true, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
  await settle(page, 1500);
  await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true }); Object.defineProperty(document, 'hidden', { value: false, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
  await settle(page, 500); await shot(page, dir, '43-back-from-background'); say('after background', JSON.stringify(await G(page)), JSON.stringify(await state(page)));
  await click(page, '#pauseBtn'); await settle(page, 300);
  // landscape
  if (vp.isMobile) { await page.setViewportSize({ width: vp.viewport.height, height: vp.viewport.width }); await settle(page, 600); await shot(page, dir, '44-landscape'); await page.setViewportSize(vp.viewport); await settle(page, 400); }
  say('errors', JSON.stringify(page.errors));
  await ctx.close();

  // ===== 2. veteran save: raid, merchant, odd jobs, long names =====
  ({ ctx, page } = await newPage(browser, vp, { init: () => { const m = { v: 3, runs: 30, wins: 14, rocks: 900, shards: 12, garyXp: 2500, nick: 'XXXXXXXXXXXXXX', xp: { chucking: 3000, bonking: 2000, muttering: 4000, sizzling: 1000, pouring: 800, flocking: 600, hyping: 0, levitating: 0, gesturing: 0, rumbling: 0, charging: 0, building: 0, foreseeing: 0, scrounging: 2000 }, maps: { nap: { plays: 5, wins: 4, stars: 3, bestKept: 10 }, paddock: { plays: 3, wins: 2, stars: 2, bestKept: 8 }, creek: { plays: 2, wins: 2, stars: 3, bestKept: 10 }, camp: { plays: 2, wins: 1, stars: 1, bestKept: 5 }, garden: { plays: 3, wins: 1, stars: 1, bestKept: 4 }, lanes: { plays: 1, wins: 1, stars: 2, bestKept: 7 }, woods: { plays: 1, wins: 1, stars: 2, bestKept: 7 }, bigday: { plays: 2, wins: 1, stars: 1, bestKept: 5 }, servo: { plays: 1, wins: 1, stars: 1, bestKept: 5 } }, stash: { Bucket: 3, "Gary's Sword": 1, 'Ring of Mild Inconvenience': 2, "Nan's Spare Teeth": 1, "Kevin's Tail": 1, 'Trenchcoat of Many Pockets': 1 }, totals: { kills: 3000, crits: 400, heists: 20, snatches: 30, banked: 200, pokes: 5, time: 7200, bosses: { kevin: 4, stack: 2, pantsalot: 2 }, tipsy: 100, bestCombo: 22, rocksEarned: 2000 }, settings: { sound: true, volume: .6, music: true }, seenHow: true, tutDone: 1, shed: { float: 2 }, jobs: [], jobsDone: 6, daily: { done: {}, count: 2, streak: 2 }, endlessBest: { nap: 14 }, jezzaSeen: true, bevSeen: true, djSeen: true, peteSeen: true, banjoSeen: true, dreams: { swing: 2, snore: 1 }, dreamEquip: 'swing', equip: ["Gary's Sword", null, null], synergies: { duck: 1 }, seenBuild: 30, heat: 3, heatSeen: true, giftKey: 0, firstSeen: Date.now() - 86400000 * 9, sessions: 12 }; localStorage.setItem('hml.meta.v3', JSON.stringify(m)); } }));
  await page.goto(BASE, { waitUntil: 'load' }); await page.waitForFunction(() => !document.getElementById('modal').hidden); await settle(page, 800);
  await shotFull(page, dir, '50-home-veteran'); say('vet home', (await page.evaluate(() => document.getElementById('modalCard').innerText)).slice(0, 400).replace(/\n/g, ' / '));
  if (await page.$('#raidBtn')) { await click(page, '#raidBtn'); await settle(page, 400); await shotFull(page, dir, '51-raid-screen'); await click(page, '#rdPlay'); await settle(page, 1200); await shot(page, dir, '52-raid-start');
    await build(page, 0, 'nan'); await build(page, 1, 'nan'); await build(page, 2, 'chuck'); await build(page, 3, 'bonk'); await build(page, 4, 'sizzle'); await upgradeN(page, 0, 3); await upgradeN(page, 1, 3);
    await click(page, '#startBtn'); await settle(page, 4000); await shot(page, dir, '53-raid-fight');
    await page.evaluate(() => { const g = window.__hml(); let t = 0; while (t < 200 && !g.over) { update(g, 1 / 60); t += 1 / 60; } }); await settle(page, 2500); await shotFull(page, dir, '54-raid-results'); say('raid', JSON.stringify(await G(page)));
    if (await page.$('#levelsBtn')) { await settle(page, 900); await click(page, '#levelsBtn'); await settle(page, 600); } }
  // merchant: force the event on a level
  await click(page, '.level[data-map="4"]'); await settle(page, 400); await shotFull(page, dir, '55-level-screen-veteran-tiers');
  await click(page, '#lvPlay'); await settle(page, 1200); await shot(page, dir, '56-beer-garden-start');
  await build(page, 0, 'nan'); await build(page, 1, 'chuck'); await click(page, '#startBtn'); await settle(page, 200); await advance(page, 120); await settle(page, 700);
  if (await page.$('.dcard')) { await shotFull(page, dir, '57-draft-veteran'); const c = await page.$('.dcard:not([disabled])'); if (c) { await c.click({ force: true, timeout: 3000 }).catch(() => {}); await settle(page, 300); } }
  await page.evaluate(() => { const g = window.__hml(); const pool = CARDS.slice(0, 6); g.merchant = { offers: pool.slice(0, 3).map((card, k) => ({ card, price: [60, 90, 130][k] })) }; g.event = 'merchant'; });
  await click(page, '#startBtn'); await settle(page, 1500); await shot(page, dir, '58-merchant-cart'); await tapCanvas(page, 44, 540); await settle(page, 700); await shotFull(page, dir, '59-merchant-modal'); say('merchant', JSON.stringify(await state(page)));
  if (await page.$('#mBack')) { await settle(page, 600); await click(page, '#mBack'); await settle(page, 300); }
  // a defeat
  await page.evaluate(() => { const g = window.__hml(); g.towers = g.towers.map(() => null); g.pile = 2; let t = 0; while (t < 300 && !g.over) { update(g, 1 / 60); t += 1 / 60; } });
  await settle(page, 2500); await shotFull(page, dir, '60-defeat'); say('defeat', (await page.evaluate(() => document.getElementById('modalCard').innerText)).slice(0, 400).replace(/\n/g, ' / '));
  say('errors2', JSON.stringify(page.errors));
  await ctx.close();

  // ===== 3. states: reduced motion, dark mode, storage blocked, build-29 self-update =====
  ({ ctx, page } = await newPage(browser, vp, { reducedMotion: 'reduce', colorScheme: 'dark', init: () => localStorage.setItem('hml.meta.v3', JSON.stringify({ v: 3, runs: 2, wins: 1, xp: {}, maps: { nap: { plays: 2, wins: 1, stars: 2, bestKept: 7 } }, stash: {}, totals: {}, settings: {}, seenBuild: 30, tutDone: 1 })) }));
  await page.goto(BASE, { waitUntil: 'load' }); await settle(page, 900); await shotFull(page, dir, '61-dark-reduced-home');
  await click(page, '.level[data-map="0"]'); await settle(page, 300); await click(page, '#lvPlay'); await settle(page, 1000); await shot(page, dir, '62-dark-reduced-play');
  await ctx.close();
  ({ ctx, page } = await newPage(browser, vp, { init: () => { const bad = () => { throw new Error('SecurityError: localStorage blocked'); }; Object.defineProperty(window, 'localStorage', { get: bad }); } }));
  await page.goto(BASE, { waitUntil: 'load' }); await settle(page, 1200); await shot(page, dir, '63-storage-blocked-first'); say('storage blocked', JSON.stringify(await state(page)), JSON.stringify(page.errors));
  await ctx.close();
  // self-update: serve this page as build 29, let it discover 30
  ({ ctx, page } = await newPage(browser, vp));
  await page.route(/\/(index\.html)?(\?.*)?$/, async route => {
    const u = route.request().url();
    if (/[?&]t=/.test(u) || /[?&]v=30/.test(u)) return route.continue();
    const r = await route.fetch(); let body = await r.text(); body = body.replace('content="30"', 'content="29"').replace('HML_BUILD = 30', 'HML_BUILD = 29');
    route.fulfill({ response: r, body, headers: Object.assign({}, r.headers(), { 'content-type': 'text/html' }) });
  });
  await page.goto(BASE, { waitUntil: 'load' }); await settle(page, 2500);
  say('self-update url', page.url(), 'build in DOM', await page.evaluate(() => document.querySelector('meta[name=hml-build]').content + '/' + window.HML_BUILD));
  await shot(page, dir, '64-after-self-update');
  await ctx.close();
} finally { await browser.close(); fs.writeFileSync(dir + '/log.txt', log.join('\n')); }
