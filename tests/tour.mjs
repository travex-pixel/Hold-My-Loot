// "Before" tour: plays the game and screenshots every state at a viewport. Usage: node tests/tour.mjs se|i15|px8|desk
import fs from 'fs';
import { launch, newPage, VIEWPORTS, shotDir, shot, shotFull, G, state, advance, build, upgradeN, settle, waitModal, BASE, tapCanvas } from './lib.mjs';
const key = process.argv[2] || 'se', vp = VIEWPORTS[key], dir = shotDir('before/' + key), log = [];
const say = (...a) => { const s = a.join(' '); log.push(s); console.log(s); };
const browser = await launch();
try {
  // ===== 1. first launch (fresh storage) =====
  let { ctx, page } = await newPage(browser, vp);
  const t0 = Date.now();
  await page.goto(BASE, { waitUntil: 'commit' });
  await shot(page, dir, '01-loading');
  await page.waitForFunction(() => window.__hml && window.__hml());
  say('time to game object', Date.now() - t0, 'ms');
  await settle(page, 300); await shot(page, dir, '02-first-launch-0s'); say('0s', JSON.stringify(await state(page)));
  await settle(page, 2000); await shot(page, dir, '03-first-launch-2s'); say('2s', JSON.stringify(await state(page)), JSON.stringify(await G(page)));
  await settle(page, 4000); await shot(page, dir, '04-first-launch-6s'); say('6s', JSON.stringify(await state(page)), JSON.stringify(await G(page)));
  // follow the coach: tap the pallet it points at
  for (let i = 0; i < 40; i++) { const st = await state(page); const g = await G(page); if (!g || g.over) break; if (st.coach && !st.sheet && !st.modal) { const pad = await page.evaluate(() => { const c = document.getElementById('coach').getBoundingClientRect(); return { x: c.left + c.width / 2, y: c.top + 30 }; }); await page.mouse.click(pad.x, pad.y); await settle(page, 400); if (!(await state(page)).sheet) { await tapCanvas(page, 240, 270); await settle(page, 300); } break; } await settle(page, 500); }
  await shot(page, dir, '05-build-sheet'); say('sheet', JSON.stringify(await state(page)));
  const bc = await page.$('#sheet .bcard:not([disabled])'); if (bc) { await bc.click({ force: true, timeout: 3000 }).catch(() => {}); await settle(page, 400); }
  await shot(page, dir, '06-after-second-build'); say('after 2nd build', JSON.stringify(await G(page)));
  // let the taster run in real time, screenshotting
  for (let i = 0; i < 90; i++) { await settle(page, 1000); const g = await G(page); const st = await state(page); if (i % 5 === 0) await shot(page, dir, '07-taster-' + String(i).padStart(2, '0') + 's'); if (st.modal) { await shot(page, dir, '08-taster-modal-' + i + 's'); say('modal at', i, 's:', st.title, '|', (await page.evaluate(() => document.getElementById('modalCard').innerText)).slice(0, 300).replace(/\n/g, ' / ')); break; } if (!g || g.over) break; }
  say('taster end', JSON.stringify(await G(page)), JSON.stringify(await state(page)));
  await page.waitForFunction(() => !document.getElementById('modal').hidden, null, { timeout: 8000 }).catch(() => {}); await settle(page, 1500);
  // reveal -> results
  if (await page.$('#revOk')) { await shotFull(page, dir, '09-reveal'); await settle(page, 1000); await page.click('#revOk', { force: true, timeout: 5000 }).catch(e => say('click failed', '#revOk')); await settle(page, 1200); }
  await shotFull(page, dir, '10-results-first'); say('results', (await page.evaluate(() => document.getElementById('modalCard').innerText)).slice(0, 600).replace(/\n/g, ' / '));
  if (await page.$('#nextBtn')) { await settle(page, 900); await page.click('#nextBtn', { force: true, timeout: 5000 }).catch(e => say('click failed', '#nextBtn')); await settle(page, 1500); }
  await shot(page, dir, '11-level2-start'); say('level2', JSON.stringify(await G(page)), JSON.stringify(await state(page)));
  // ===== level 2 and 3 with a reasonable crew, headless-advanced =====
  for (const lvl of [2, 3]) {
    const g0 = await G(page);
    if (!g0 || g0.map !== (lvl === 2 ? 'paddock' : 'creek')) { say('unexpected map', g0 && g0.map); }
    await build(page, 0, 'chuck'); await build(page, 1, 'nan'); await build(page, 2, 'bonk'); await build(page, 3, 'sizzle');
    await settle(page, 300); await shot(page, dir, (lvl === 2 ? '12' : '16') + '-level' + lvl + '-built');
    for (let w = 1; w <= 8; w++) {
      await page.click('#startBtn', { force: true, timeout: 5000 }).catch(e => say('click failed', '#startBtn')); await settle(page, 150);
      await advance(page, 120);
      if (w === 4) { await upgradeN(page, 1, 2); await upgradeN(page, 0, 1); }
      await settle(page, 700);
      const st = await state(page);
      if (w === 1) await shotFull(page, dir, (lvl === 2 ? '13' : '17') + '-level' + lvl + '-draft');
      if (st.modal && await page.$('.dcard')) { await settle(page, 600); const c = await page.$('.dcard:not([disabled])'); if (c) { await c.click({ force: true, timeout: 3000 }).catch(() => {}); await settle(page, 300); } }
      const g = await G(page); if (!g || g.over) break;
      if (w === 7) { await settle(page, 200); await shot(page, dir, (lvl === 2 ? '14' : '18') + '-level' + lvl + '-bossnext'); }
    }
    await page.waitForFunction(() => !document.getElementById('modal').hidden, null, { timeout: 8000 }).catch(() => {}); await settle(page, 2000); await shotFull(page, dir, (lvl === 2 ? '15' : '19') + '-level' + lvl + '-results'); say('level', lvl, 'result', JSON.stringify(await G(page)));
    if (await page.$('#revOk')) { await page.click('#revOk', { force: true, timeout: 5000 }).catch(e => say('click failed', '#revOk')); await settle(page, 1200); await shotFull(page, dir, (lvl === 2 ? '15' : '19') + 'b-level' + lvl + '-results'); }
    if (await page.$('#nextBtn')) { await settle(page, 900); await page.click('#nextBtn', { force: true, timeout: 5000 }).catch(e => say('click failed', '#nextBtn')); await settle(page, 1500); }
    else if (await page.$('#levelsBtn')) { await settle(page, 900); await page.click('#levelsBtn', { force: true, timeout: 5000 }).catch(e => say('click failed', '#levelsBtn')); await settle(page, 800); break; }
  }
  say('errors', JSON.stringify(page.errors));
  await ctx.close();
} finally { await browser.close(); fs.writeFileSync(dir + '/log1.txt', log.join('\n')); }
