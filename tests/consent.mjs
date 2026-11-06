// Cookie-free analytics consent. Nothing is stored for analytics until the player says yes; "no" sends nothing.
// Usage: node tests/consent.mjs   (needs node tests/serve.mjs 8081 running)
import fs from 'fs';
import { launch, VIEWPORTS, BASE, settle } from './lib.mjs';
const b30 = JSON.parse(fs.readFileSync(new URL('./fixtures/save-build30.json', import.meta.url)));
const browser = await launch(); const results = [];
const check = (name, ok, extra) => { results.push(ok); console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra ? '  (' + extra + ')' : '')); };

async function open(store) {
  const vp = VIEWPORTS.i15;
  const ctx = await browser.newContext({ viewport: vp.viewport, deviceScaleFactor: 1, isMobile: true, hasTouch: true, userAgent: vp.userAgent });
  if (store) await ctx.addInitScript(s => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); for (const k in s) localStorage.setItem(k, s[k]); }, store);
  const page = await ctx.newPage(); const events = [];
  await page.route(/posthog\.com/, r => { try { events.push(JSON.parse(r.request().postData() || '{}')); } catch (e) {} r.fulfill({ status: 200, body: '{}' }); });
  page.errors = []; page.on('pageerror', e => page.errors.push(String(e)));
  await page.goto(BASE, { waitUntil: 'load' }); await settle(page, 1200);
  return { ctx, page, events };
}
const ls = (page, k) => page.evaluate(k => localStorage.getItem(k), k);
const save = s => ({ 'hml.meta.v3': JSON.stringify(s) });
const unasked = JSON.parse(JSON.stringify(b30)); delete unasked.settings.analytics;

// 1. brand-new player: events flow for the first-minute funnel, but nothing is stored and the id dies with the tab
{ const { ctx, page, events } = await open(null);
  check('new player: events are sent before any question', events.length >= 2, events.map(e => e.event).join(','));
  check('new player: every event uses a session-only id', events.every(e => /^s_/.test(e.distinct_id)) && events.every(e => e.properties.consent === 'unasked'));
  check('new player: no analytics id is stored on the device', await ls(page, 'hml.anon') === null);
  check('new player: no consent card mid-tutorial', !(await page.$('.consent')));
  check('every event carries the build number', events.every(e => e.properties.build === +(/hml-build" content="(\d+)/.exec(fs.readFileSync('index.html', 'utf8'))[1])));
  await ctx.close(); }

// 2. returning player who was never asked: the card shows on the home screen, "Sure" stores an anonymous id
{ const { ctx, page, events } = await open(save(unasked));
  check('returning player sees the consent card on the home screen', !!(await page.$('.consent')));
  await page.click('#consentYes'); await settle(page, 500);
  const id = await ls(page, 'hml.anon');
  check('"Sure" stores a random anonymous id', /^a_/.test(id || ''), id);
  check('"Sure" is recorded with the new id', events.some(e => e.event === 'consent_given' && e.distinct_id === id));
  check('the card is gone after answering', !(await page.$('.consent')));
  await page.reload({ waitUntil: 'load' }); await settle(page, 900);
  check('after a reload: no card, events use the stored id', !(await page.$('.consent')) && events.slice(-1)[0].distinct_id === id);
  await ctx.close(); }

// 3. "No thanks": nothing is sent from that moment on, and nothing is stored
{ const { ctx, page, events } = await open(save(unasked));
  await page.click('#consentNo'); await settle(page, 300); const n = events.length;
  await page.evaluate(() => { const b = document.querySelector('.level[data-map="0"]'); b.click(); }); await settle(page, 400);
  await page.evaluate(() => document.getElementById('lvPlay') && document.getElementById('lvPlay').click()); await settle(page, 1200);
  await page.reload({ waitUntil: 'load' }); await settle(page, 900);
  check('"No thanks": not one event is sent afterwards', events.length === n, (events.length - n) + ' sent');
  check('"No thanks": no analytics id is stored', await ls(page, 'hml.anon') === null);
  await ctx.close(); }

// 4. a build-30 player who had already switched stats off stays off, and is never asked
{ const off = JSON.parse(JSON.stringify(b30)); off.settings.analytics = false;
  const { ctx, page, events } = await open(save(off));
  check('stats switched off in build 30 stay off (no card, no events)', !(await page.$('.consent')) && events.length === 0, events.length + ' sent');
  await ctx.close(); }

// 5. a player who said yes keeps one id
{ const yes = JSON.parse(JSON.stringify(b30)); yes.settings.analytics = true;
  const { ctx, page, events } = await open(save(yes));
  const id = await ls(page, 'hml.anon');
  check('a player who said yes is counted under one id across sessions', /^a_/.test(id || '') && events.every(e => e.distinct_id === id));
  check('page errors: none', page.errors.length === 0, page.errors.slice(0, 2).join(' | '));
  await ctx.close(); }

await browser.close();
console.log(results.every(Boolean) ? 'ALL PASS' : 'SOME FAILED');
process.exit(results.every(Boolean) ? 0 : 1);
