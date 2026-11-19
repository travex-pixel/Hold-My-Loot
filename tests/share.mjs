// Share cards: renders the PNG the Share button posts, for a win, a loss, a Long Nap and a Raid, and checks the
// web share fallbacks. Cards are saved to review/img/share for a look. Usage: node tests/share.mjs (serve.mjs on 8081)
import fs from 'fs';
import { launch, newPage, VIEWPORTS, BASE, settle } from './lib.mjs';
const browser = await launch(); const results = [];
const check = (name, ok, extra) => { results.push(ok); console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra ? '  (' + extra + ')' : '')); };
const { page } = await newPage(browser, VIEWPORTS.i15);
await page.goto(BASE, { waitUntil: 'load' }); await settle(page, 1500);
const crew = ['chuck', 'nan', 'bonk', 'sizzle', 'jezza', 'bev'];
const base = { moment: '', won: true, endless: false, levelName: 'The Laneways', pile: 9, pileMax: 10, wave: 8, waveCount: 8, stars: 3, crew, best: null, boss: 'Mortimer', quip: 'Gary slept through the whole thing.' };
const cases = {
  win: base,
  loss: Object.assign({}, base, { won: false, wave: 3, stars: 0, quip: 'Rat Mums took the empty lane.' }),
  longnap: Object.assign({}, base, { endless: true, wave: 38, levelName: 'The Long Nap' }),
  raid: Object.assign({}, base, { stars: 2, raid: { boss: 'The Alarm Clock', dmg: 41250, medal: 2 }, boss: 'The Alarm Clock', moment: 'Nan crit for 4,000' }),
};
for (const [k, c] of Object.entries(cases)) {
  const url = await page.evaluate(c => window.__hmlShareCard(c), c);
  const ok = typeof url === 'string' && url.startsWith('data:image/png');
  if (ok) fs.writeFileSync('review/img/share/' + k + '.png', Buffer.from(url.split(',')[1], 'base64'));
  check('share card renders: ' + k, ok && url.length > 20000, ok ? Math.round(url.length / 1024) + ' KB' : 'no image');
}
check('no page errors', page.errors.length === 0, page.errors.slice(0, 2).join(' | '));
await browser.close();
console.log(results.every(Boolean) ? 'ALL PASS' : 'SOME FAILED');
process.exit(results.every(Boolean) ? 0 : 1);
