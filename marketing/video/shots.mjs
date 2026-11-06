// The shot library. Every shot is real gameplay from index.html, scripted and captured frame-exact.
// Shots marked RECREATED re-create an old bug for the story (the compositor labels them on screen).
// Usage: node marketing/video/shots.mjs [name ...]   (no names = all)
import { openBrowser, openGame, captureShot, run, clickSel, tapCanvas } from './lib/capture.mjs';

const SKILLS = ['chucking', 'bonking', 'muttering', 'sizzling', 'pouring', 'flocking', 'hyping', 'levitating', 'gesturing', 'rumbling', 'charging', 'building', 'foreseeing', 'scrounging'];
const ALL_MAPS = ['nap', 'paddock', 'creek', 'camp', 'garden', 'lanes', 'woods', 'bigday', 'servo', 'tide', 'smoko', 'longpad'];
export function vetMeta(over = {}) {
  const xp = {}; for (const s of SKILLS) xp[s] = 20000;
  const maps = {}; ALL_MAPS.forEach((id, i) => { maps[id] = { plays: 3, wins: 2, stars: i % 3 === 2 ? 2 : 3, bestKept: 9 }; });
  return Object.assign({ v: 3, runs: 60, wins: 30, rocks: 2400, shards: 30, garyXp: 9000, xp, maps,
    stash: { Bucket: 3, 'Thong of Swiftness': 2, "Gary's Sword": 1, "Nan's Spare Teeth": 1, "Kevin's Tail": 2 },
    totals: { kills: 9000, crits: 1400, heists: 40, snatches: 60, banked: 300, pokes: 8, time: 30000, bosses: { kevin: 4, stack: 3, pantsalot: 2, swoop: 2, chrisso: 2 }, tipsy: 400, bestCombo: 30, rocksEarned: 8000, perfects: 40, dreams: 20 },
    settings: { sound: true, volume: .6, music: true, shake: true, instantLoot: false }, seenHow: true, tutDone: 1, seenBuild: 30,
    jezzaSeen: true, bevSeen: true, djSeen: true, peteSeen: true, banjoSeen: true, heatSeen: true, heatOff: true, toldDraft: 1, toldAbility: 1,
    a2hsDone: 1, rated: 1, supSeen: true, giftKey: 20261109, sessions: 20, firstSeen: Date.UTC(2026, 9, 1), dreams: { swing: 3, snore: 2, rain: 2, freeze: 1 }, dreamEquip: 'swing',
    equip: ["Gary's Sword", null, null], synergies: { duck: 1, pubbrawl: 1 }, jobs: [], jobsDone: 9, daily: { done: {}, count: 3 }, endlessBest: { nap: 22 },
    crewMode: 'custom', crew: ['nan', 'chuck', 'bonk', 'sizzle', 'jezza', 'bev'], paths: {} }, over);
}

// ---- in-page director helpers (installed once per page) ----
async function director(page) {
  await page.evaluate(() => {
    const D = window.__dir = {};
    D.g = () => window.__hml();
    D.clean = () => { const t = document.getElementById('toasts'); if (t) t.innerHTML = ''; const b = document.getElementById('banner'); if (b) b.className = ''; };
    D.place = list => { const g = D.g(); for (const [pad, type, tier] of list) { g.gold = 99999; if (!g.towers[pad]) build(g, pad, type); for (let k = 0; k < (tier || 0); k++) upgrade(g, pad); } g.gold = 640; };
    D.clear = () => { const g = D.g(); g.towers = g.towers.map(() => null); g.birds.length = 0; g.spikes.length = 0; };
    // keep monsters coming: pattern [[type, gap], ...] cycled, path p
    D.flow = (pattern, opts) => { D._flow = { pattern, i: 0, next: 0, opts: opts || {} }; };
    D.tick = () => {
      const g = D.g(); if (!g || !D._flow || g.over) return;
      if (!g.waveActive) { g.lastEventWave = g.wave; startWave(g); g.spawnQ.length = 0; }
      const F = D._flow; if (F.opts.keepPile !== false) { g.pile = g.pileMax; }
      if (F.opts.d != null) { // enter partway down the road, so the action reaches the crew inside the shot
        if (!g.spawnQ.some(q => q.at > 1e8)) g.spawnQ.push({ type: 'rat', at: 1e9 });
        while (g.waveT >= F.next) { const [t, gap] = F.pattern[F.i % F.pattern.length]; F.i++; F.next = Math.max(F.next, g.waveT - 1) + gap; const pi = typeof F.opts.p === 'number' ? F.opts.p : 0; spawn(g, t, F.opts.d + (F.i % 3) * 6, pi); }
      } else while (g.spawnQ.length < 4) { const [t, gap] = F.pattern[F.i % F.pattern.length]; F.i++; F.next = Math.max(F.next, g.waveT) + gap; g.spawnQ.push({ type: t, at: F.next, p: F.opts.p }); }
      if (F.opts.hp) for (const e of g.enemies) if (!e._hp && !e.boss) { e._hp = 1; e.hp = e.maxHp = Math.round(e.maxHp * F.opts.hp); }
    };
    D.wave = n => { const g = D.g(); g.wave = n - 1; g.lastEventWave = g.wave; startWave(g); };
    D.hold = () => { const g = D.g(); g.spawnQ.length = 0; g.spawnQ.push({ type: 'rat', at: 1e9 }); }; // wave never ends
  });
}
const tick = page => page.evaluate(() => window.__dir.tick());
async function startLevel(page, mapIdx) {
  await page.waitForFunction(() => !document.getElementById('modal').hidden);
  await page.evaluate(i => { const b = document.querySelector('.level[data-map="' + i + '"]'); b.scrollIntoView(); b.click(); }, mapIdx);
  await run(page, 300);
  await page.evaluate(() => document.getElementById('lvPlay').click());
  await run(page, 600);
  await director(page);
  await page.evaluate(() => window.__dir.clean());
}

const SHOTS = {
  // ---------- the brand-new player's first minute ----------
  async taster(b) {
    const { page } = await openGame(b, { meta: null });
    await director(page);
    console.log(' taster_open', await captureShot(page, 'taster_open', 6));
    // tap where the coach points, then the Dazza card it points at
    const coach = await page.evaluate(() => { const c = document.getElementById('coach').getBoundingClientRect(); return { x: c.left + c.width / 2, y: c.top + 30 }; });
    console.log(' taster_build', await captureShot(page, 'taster_build', 6, { actions: {
      12: async p => { await p.mouse.click(coach.x, coach.y); },
      40: async p => { const el = await p.$('#sheet .bcard[data-build="chuck"]'); if (el) await el.click({ force: true }); },
    } }));
    // fast-forward to Kevin
    for (let i = 0; i < 400; i++) { await run(page, 500); const boss = await page.evaluate(() => { const g = window.__hml(); return g && g.enemies.some(e => e.boss); }); if (boss) break; }
    await run(page, 200);
    console.log(' kevin_intro', await captureShot(page, 'kevin_intro', 6));
    for (let i = 0; i < 400; i++) { await run(page, 500); const r = await page.evaluate(() => !!document.querySelector('#revOk')); if (r) break; }
    console.log(' reveal_jezza', await captureShot(page, 'reveal_jezza', 4.5));
  },

  // ---------- big busy fights ----------
  async chaos(b) {
    const { page } = await openGame(b, { meta: vetMeta() });
    await startLevel(page, 7);
    await page.evaluate(() => { const D = window.__dir; D.place([[0, 'nan', 3], [1, 'chuck', 3], [2, 'bev', 3], [3, 'jezza', 3], [4, 'bonk', 3], [5, 'sizzle', 3], [6, 'dj', 2], [9, 'pete', 3], [11, 'nan', 2], [12, 'chuck', 2]]);
      D.wave(6); D.flow([['pants', .6], ['gob', .25], ['gob', .25], ['skel', .4], ['seagull', .7], ['rat', .2], ['rat', .2], ['bog', .9]], { hp: 1.4, p: 'alt' }); });
    for (let i = 0; i < 25; i++) { await tick(page); await run(page, 200); }
    await page.evaluate(() => window.__dir.clean());
    console.log(' chaos', await captureShot(page, 'chaos', 10, { every: tick, actions: { 150: p => p.evaluate(() => { const g = window.__hml(); g.meter = 100; unleash(g); }) } }));
  },

  async nan(b) {
    const { page } = await openGame(b, { meta: vetMeta() });
    await startLevel(page, 0);
    await page.evaluate(() => { const D = window.__dir; D.place([[1, 'nan', 3], [4, 'bonk', 1]]); D.flow([['pants', .45], ['skel', .35], ['bog', .8], ['skel', .35]], { hp: 2.2 }); });
    for (let i = 0; i < 30; i++) { await tick(page); await run(page, 200); }
    await page.evaluate(() => window.__dir.clean());
    console.log(' nan_crits', await captureShot(page, 'nan_crits', 9, { every: tick, actions: {
      60: p => p.evaluate(() => { const g = window.__hml(); g.gold = 99999; upgrade(g, 1); g.gold = 410; }),
      170: p => p.evaluate(() => { const g = window.__hml(); g.towers[1].acd = 0; activate(g, 1); }),
    } }));
  },

  // ---------- Sir Pantsalot ----------
  async pants(b) {
    const { page } = await openGame(b, { meta: vetMeta() });
    await startLevel(page, 2);
    // crew lined up along the creek road so the king walks past them
    await page.evaluate(() => { const D = window.__dir; D.place([[2, 'chuck', 1], [3, 'bonk', 0], [6, 'pete', 0], [7, 'jezza', 0], [9, 'sizzle', 0]]); D.wave(8); const g = D.g(); D.hold();
      const e = spawn(g, 'pantsalot', 250, 0); e.hp = e.maxHp = 9e5; e.spd = 46; e.pantsCd = 99; D._king = e.id; D.flow([['skel', 1.4], ['rat', .9]], { hp: .6, d: 200 }); });
    for (let i = 0; i < 12; i++) { await tick(page); await run(page, 200); }
    await page.evaluate(() => window.__dir.clean());
    const steal = p => p.evaluate(() => { const g = window.__hml(), e = g.enemies.find(x => x.type === 'pantsalot'); if (e) { e.pantsCd = 0; e.hp = Math.max(e.hp, e.maxHp * .7); } });
    console.log(' pants_crew', await captureShot(page, 'pants_crew', 14, { every: async (p, f) => { await tick(p); await p.evaluate(() => { const g = window.__hml(), e = g.enemies.find(x => x.type === 'pantsalot'); if (e && e.pantsCd > 50) e.pantsCd = 60; }); },
      actions: { 20: steal, 120: steal, 230: steal, 330: steal } }));
  },
  async pantsGary(b) {
    const { page } = await openGame(b, { meta: vetMeta(), bossbar: false });
    await startLevel(page, 2);
    await page.evaluate(() => { const D = window.__dir; D.wave(8); const g = D.g(); D.hold(); const P = g.map.P[0]; const e = spawn(g, 'pantsalot', P.len - 175, 0); e.hp = e.maxHp = 9e5; e.spd = 26; e.pantsCd = 999; });
    await run(page, 300); await page.evaluate(() => window.__dir.clean());
    console.log(' pants_gary', await captureShot(page, 'pants_gary', 8));
  },

  // ---------- Gary asleep ----------
  async gary(b) {
    const { page } = await openGame(b, { meta: vetMeta() });
    await startLevel(page, 0);
    await page.evaluate(() => { const D = window.__dir; D.place([[7, 'chuck', 1], [5, 'nan', 1]]); D.flow([['rat', 1.1], ['skel', 1.5]], { d: 900 }); });
    for (let i = 0; i < 10; i++) { await tick(page); await run(page, 200); }
    await page.evaluate(() => window.__dir.clean());
    const say = line => p => p.evaluate(l => R.say(GARY.x, GARY.y - 34, l, 2.4), line);
    console.log(' gary_sleep', await captureShot(page, 'gary_sleep', 13, { every: tick, actions: {
      5: say('zzz... guard me loot...'), 80: say('zzz... five more minutes...'), 155: say('zzz... no officer, I live here...'), 230: say('...did I miss anything?'), 305: say('zzz... tell ’em they’re dreamin’...') } }));
  },
  async alarm(b) {
    const { page } = await openGame(b, { meta: vetMeta(), bossbar: false });
    await page.waitForFunction(() => !document.getElementById('modal').hidden);
    await page.evaluate(() => { const r = document.getElementById('raidBtn'); r.scrollIntoView(); r.click(); });
    await run(page, 400);
    await page.evaluate(() => document.getElementById('rdPlay').click());
    await run(page, 600); await director(page);
    await page.evaluate(() => { const D = window.__dir; D.place([[0, 'nan', 3], [1, 'chuck', 2], [2, 'bonk', 2], [3, 'sizzle', 2], [4, 'jezza', 2], [5, 'nan', 2], [6, 'bev', 2]]); startWave(D.g()); });
    for (let i = 0; i < 40; i++) { await run(page, 200); const near = await page.evaluate(() => { const g = window.__hml(), e = g.enemies.find(x => x.raidBoss); return e ? e.d : 0; }); if (near > 260) break; }
    await page.evaluate(() => window.__dir.clean());
    const ring = p => p.evaluate(() => { window.__hml().raidMechT = 0; });
    console.log(' alarm_raid', await captureShot(page, 'alarm_raid', 8, { actions: { 20: ring, 150: ring } }));
  },

  // ---------- Big Marg's reach (build 19) ----------
  async marg(b) {
    for (const [name, range] of [['marg_before', 60], ['marg_after', 72]]) {
      const { ctx, page } = await openGame(b, { meta: vetMeta() });
      await startLevel(page, 2);
      await page.evaluate(r => { TOWERS.bonk.tiers[0].range = r; const D = window.__dir; D.place([[2, 'bonk', 0]]); D.flow([['rat', .9], ['skel', 1.3], ['rat', .9]], { hp: 3, p: 0 }); }, range);
      for (let i = 0; i < 25; i++) { await tick(page); await run(page, 200); }
      await page.evaluate(() => window.__dir.clean());
      console.log(' ' + name, await captureShot(page, name, 6, { every: tick }));
      await ctx.close();
    }
    // the build menu today: crew who can't reach are greyed out
    const { page } = await openGame(b, { meta: vetMeta() });
    await startLevel(page, 2);
    await page.evaluate(() => window.__dir.place([[2, 'chuck', 1]]));
    console.log(' marg_toofar', await captureShot(page, 'marg_toofar', 4, { actions: { 8: p => tapCanvas(p, 250, 312) } }));
  },

  // ---------- crew moments ----------
  async bev(b) {
    const { page } = await openGame(b, { meta: vetMeta() });
    await startLevel(page, 3);
    await page.evaluate(() => { const D = window.__dir; D.place([[3, 'bev', 3], [6, 'bev', 2], [2, 'chuck', 1]]); D.flow([['seagull', .7], ['rat', .5], ['gob', .5], ['seagull', .7]], { hp: 1.6 }); });
    for (let i = 0; i < 20; i++) { await tick(page); await run(page, 200); }
    await page.evaluate(() => window.__dir.clean());
    console.log(' bev_birds', await captureShot(page, 'bev_birds', 8, { every: tick, actions: { 90: p => p.evaluate(() => { window.__hml().towers[3].ucd = 0; }) } }));
  },
  async banjo(b) {
    const { page } = await openGame(b, { meta: vetMeta() });
    await startLevel(page, 0);
    await page.evaluate(() => { const D = window.__dir; D.place([[10, 'banjo', 3], [6, 'banjo', 1]]); D.flow([['skel', .45], ['rat', .3], ['gob', .35]], { hp: 1.8, d: 760 }); });
    for (let i = 0; i < 25; i++) { await tick(page); await run(page, 200); }
    await page.evaluate(() => window.__dir.clean());
    console.log(' banjo', await captureShot(page, 'banjo', 7, { every: tick, actions: { 10: p => p.evaluate(() => SFX.sting('banjo')) } }));
  },

  // ---------- the Android smear (build 27) ----------
  async smear(b) {
    const { page } = await openGame(b, { meta: vetMeta() });
    await startLevel(page, 0);
    await page.evaluate(() => { const D = window.__dir; D.place([[1, 'nan', 2], [4, 'chuck', 2], [5, 'bonk', 1], [10, 'jezza', 1]]); D.flow([['rat', .35], ['gob', .4], ['skel', .6]], { hp: 1.5 }); });
    for (let i = 0; i < 20; i++) { await tick(page); await run(page, 200); }
    await page.evaluate(() => window.__dir.clean());
    console.log(' smear_ok', await captureShot(page, 'smear_ok', 4, { every: tick }));
    // RECREATED: what the bug did. The phone dropped the background layer and nothing wiped the frame.
    await page.evaluate(() => {
      const cv = document.getElementById('cv'), P = CanvasRenderingContext2D.prototype, fr = P.fillRect, di = P.drawImage;
      P.fillRect = function (x, y, w, h) { if (this.canvas === cv && w >= cv.width - 1 && h >= cv.height - 1) return; return fr.apply(this, arguments); };
      P.drawImage = function (img) { if (this.canvas === cv && img && img.width === cv.width && img.height === cv.height) return; return di.apply(this, arguments); };
    });
    console.log(' smear_bug', await captureShot(page, 'smear_bug', 5, { every: tick }));
  },

  // ---------- results ----------
  async win3(b) {
    const { page } = await openGame(b, { meta: vetMeta() });
    await startLevel(page, 0);
    await page.evaluate(() => { const D = window.__dir; D.place([[1, 'nan', 3], [4, 'nan', 3], [5, 'chuck', 3], [10, 'bonk', 2]]); D.wave(8); });
    for (let i = 0; i < 300; i++) { await run(page, 300); const over = await page.evaluate(() => { const g = window.__hml(); return g && g.over; }); if (over) break; }
    await run(page, 1300);
    console.log(' win3', await captureShot(page, 'win3', 5));
  },

  // ---------- menus ----------
  async menus(b) {
    const { page } = await openGame(b, { meta: vetMeta() });
    await page.waitForFunction(() => !document.getElementById('modal').hidden);
    await run(page, 600);
    console.log(' home_scroll', await captureShot(page, 'home_scroll', 7, { every: (p, f) => p.evaluate(f => { const c = document.getElementById('modalCard'); if (f > 20) c.scrollTop += 16; }, f) }));
    await page.evaluate(() => { const c = document.getElementById('modalCard'); c.scrollTop = 0; document.getElementById('gearBtn').click(); });
    await run(page, 300);
    await page.evaluate(() => document.querySelector('[data-gt="pj"]').click());
    await run(page, 400);
    console.log(' wardrobe', await captureShot(page, 'wardrobe', 6, { every: (p, f) => p.evaluate(f => { const c = document.getElementById('modalCard'); if (f > 30 && f < 150) c.scrollTop += 14; }, f) }));
    await page.evaluate(() => document.querySelector('.wp[data-w="bonk"]').click());
    await run(page, 400);
    console.log(' wardrobe_marg', await captureShot(page, 'wardrobe_marg', 4, { every: (p, f) => p.evaluate(f => { const c = document.getElementById('modalCard'); if (f > 20) c.scrollTop += 8; }, f) }));
  },
  async crew(b) {
    const { page } = await openGame(b, { meta: vetMeta() });
    await page.waitForFunction(() => !document.getElementById('modal').hidden);
    await page.evaluate(() => { const b2 = document.querySelector('.level[data-map="0"]'); b2.click(); });
    await run(page, 300);
    await page.evaluate(() => document.getElementById('lvCrew').click());
    await run(page, 700);
    const tap = k => p => p.evaluate(k => { const el = document.querySelector('.ccard[data-k="' + k + '"]'); el.click(); }, k);
    console.log(' crew_screen', await captureShot(page, 'crew_screen', 7, { actions: { 15: tap('nan'), 50: tap('banjo'), 95: tap('bev'), 140: tap('rocco'), 185: tap('jezza') } }));
    for (const k of ['chuck', 'bonk', 'nan', 'sizzle', 'jezza', 'bev', 'dj', 'pete', 'banjo', 'rocco', 'kev', 'gav', 'val']) {
      await page.evaluate(k => { const el = document.querySelector('.cinfo[data-info="' + k + '"]'); el.click(); }, k);
      await run(page, 120);
      console.log(' info_' + k, await captureShot(page, 'info_' + k, 2.5));
      await page.evaluate(() => document.getElementById('ciBack').click());
      await run(page, 200);
    }
  },
  async acts(b) {
    const { page } = await openGame(b, { meta: vetMeta() });
    await startLevel(page, 0);
    const pad = 10;
    for (const k of ['chuck', 'bonk', 'nan', 'sizzle', 'jezza', 'bev', 'dj', 'pete', 'banjo', 'rocco', 'kev', 'gav', 'val']) {
      const ground = ['rocco', 'kev', 'bonk', 'gav', 'banjo'].includes(k);
      await page.evaluate(([k, pad, ground]) => { const D = window.__dir; D.clear(); const g = D.g(); g.enemies.length = 0; g.projs.length = 0; g.puddles.length = 0;
        const crew = [[pad, k, 3]]; if (k === 'sizzle' || k === 'dj' || k === 'val') crew.push([5, 'chuck', 1], [6, 'chuck', 1]);
        D.place(crew); D.flow(ground ? [['rat', .3], ['skel', .45], ['gob', .35]] : [['rat', .3], ['skel', .45], ['seagull', .6], ['gob', .35]], { hp: 1.8, d: 760 }); }, [k, pad, ground]);
      for (let i = 0; i < 18; i++) { await tick(page); await run(page, 200); }
      await page.evaluate(() => window.__dir.clean());
      console.log(' act_' + k, await captureShot(page, 'act_' + k, 5, { every: tick, actions: { 60: p => p.evaluate(pad => { const g = window.__hml(); if (g.towers[pad]) { g.towers[pad].acd = 0; activate(g, pad); } }, pad) } }));
    }
  },

  // ---------- saves (build 14) ----------
  async saves(b) {
    const { page } = await openGame(b, { meta: vetMeta() });
    await startLevel(page, 0);
    await page.evaluate(() => document.getElementById('menuBtn').click()); await run(page, 300);
    await page.evaluate(() => document.querySelector('.tab[data-tab="settings"]').click()); await run(page, 300);
    const scrollTo = sel => p => p.evaluate(sel => { const el = document.querySelector(sel), c = document.getElementById('modalCard'); c.scrollTop = el.offsetTop - 260; }, sel);
    console.log(' save_copy', await captureShot(page, 'save_copy', 5, { actions: { 10: scrollTo('#saveNow'), 40: p => p.evaluate(() => document.getElementById('copyCode').click()) } }));
    const code = await page.evaluate(() => document.getElementById('codeBox').value || ('HML3:' + btoa(unescape(encodeURIComponent(JSON.stringify(JSON.parse(localStorage.getItem('hml.meta.v3'))))))));
    console.log(' save_reset', await captureShot(page, 'save_reset', 6, { actions: { 5: scrollTo('#resetBtn'), 30: p => p.evaluate(() => document.getElementById('resetBtn').click()), 75: p => p.evaluate(() => document.getElementById('resetBtn').click()) } }));
    await run(page, 1500);
    await page.evaluate(() => document.getElementById('menuBtn').click()); await run(page, 300);
    await page.evaluate(() => document.querySelector('.tab[data-tab="settings"]').click()); await run(page, 300);
    console.log(' save_load', await captureShot(page, 'save_load', 7, { actions: {
      5: scrollTo('#codeBox'),
      25: p => p.evaluate(c => { const box = document.getElementById('codeBox'); box.value = c; box.dispatchEvent(new Event('input')); }, code),
      55: p => p.evaluate(() => document.getElementById('loadCode').click()),
      100: p => p.evaluate(() => document.getElementById('quitBtn') && document.getElementById('quitBtn').click()),
      130: p => p.evaluate(() => { const c = document.getElementById('modalCard'); c.scrollTop = 0; }) } }));
  },
};

const want = process.argv.slice(2);
const names = want.length ? want : Object.keys(SHOTS);
const b = await openBrowser();
const queue = names.slice(), pool = Math.min(3, queue.length);
await Promise.all(Array.from({ length: pool }, async () => { while (queue.length) { const n = queue.shift(); const t0 = Date.now(); try { await SHOTS[n](b); console.log('done', n, Math.round((Date.now() - t0) / 1000) + 's'); } catch (e) { console.log('FAILED', n, String(e).split('\n')[0]); } } }));
await b.close();
