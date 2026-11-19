// Ko-fi support flow and the supporter unlock, with a test link and code switched on.
// Usage: node tests/support.mjs   (needs node tests/serve.mjs 8081 running)
import fs from 'fs'; import crypto from 'crypto';
import { launch, VIEWPORTS, BASE, settle } from './lib.mjs';
const b30 = JSON.parse(fs.readFileSync(new URL('./fixtures/save-build30.json', import.meta.url)));
Object.assign(b30, { supporter: false, supSeen: false, wins: Math.max(5, b30.wins || 0), sessions: Math.max(3, b30.sessions || 0) }); b30.settings.analytics = false;
const HASH = crypto.createHash('sha256').update('snag time').digest('hex');
const browser = await launch(); const results = [];
const check = (name, ok, extra) => { results.push(ok); console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra ? '  (' + extra + ')' : '')); };

const vp = VIEWPORTS.se;
const ctx = await browser.newContext({ viewport: vp.viewport, deviceScaleFactor: 1, isMobile: true, hasTouch: true, userAgent: vp.userAgent });
await ctx.addInitScript(s => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('hml.meta.v3', s); }, JSON.stringify(b30));
const page = await ctx.newPage(); page.errors = []; page.on('pageerror', e => page.errors.push(String(e)));
await page.route(/posthog\.com/, r => r.fulfill({ status: 200, body: '{}' }));
await page.route(u => u.pathname === '/' || u.pathname.endsWith('/index.html'), async r => {
  const res = await r.fetch(); const html = (await res.text()).replace("window.HML_SUPPORT = { url: '', codeHash: '' };", `window.HML_SUPPORT = { url: 'https://ko-fi.com/holdmyloot-test', codeHash: '${HASH}' };`);
  r.fulfill({ response: res, body: html, headers: Object.assign({}, res.headers(), { 'content-type': 'text/html; charset=utf-8' }) });
});
await page.goto(BASE, { waitUntil: 'load' }); await settle(page, 1200);
check('the support card shows on the home screen after 5 wins and 3 sessions', !!(await page.$('.supcard')));
check('the source holds a hash, not the word', !(await page.content()).includes('snag time'));
await page.evaluate(() => document.getElementById('menuBtn').click()); await settle(page, 300); await page.click('[data-tab="settings"]'); await settle(page, 300);
const href = await page.getAttribute('#supLink', 'href').catch(() => null);
check('Settings has the Ko-fi link, opening in a new tab', href === 'https://ko-fi.com/holdmyloot-test' && await page.getAttribute('#supLink', 'target') === '_blank');
await page.fill('#supCode', 'free pyjamas'); await page.click('#supBtn'); await settle(page, 300);
check('a wrong code does not unlock', /didn.t work/.test(await page.innerText('#supMsg')) && !(await page.evaluate(() => window.__hmlSave.meta().supporter)));
await page.fill('#supCode', '  Snag Time '); await page.click('#supBtn'); await settle(page, 400);
const m = await page.evaluate(() => window.__hmlSave.meta());
check('the right code unlocks (any case, spaces trimmed)', m.supporter === true && m.pj === 'scarlet');
await page.reload({ waitUntil: 'load' }); await settle(page, 1000);
check('the unlock survives a reload, and the support card is gone', (await page.evaluate(() => window.__hmlSave.meta().supporter)) === true && !(await page.$('.supcard')));
check('no page errors', page.errors.length === 0, page.errors.slice(0, 2).join(' | '));
await browser.close();
console.log(results.every(Boolean) ? 'ALL PASS' : 'SOME FAILED');
process.exit(results.every(Boolean) ? 0 : 1);
