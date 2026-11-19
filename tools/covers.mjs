// Portal cover images, drawn by the game itself: the level background, sleeping Gary and the crew all come from the
// game's own renderer (R._bg, R.garyPortrait, R.portrait), the wordmark from its own font. Nothing new is drawn.
// CrazyGames asks for 1920x1080 (16:9), 800x1200 (2:3) and 800x800 (1:1).
//   node tests/serve.mjs 8081 &   then   node tools/covers.mjs
import fs from 'fs'; import path from 'path'; import { createRequire } from 'module';
const { chromium } = createRequire(import.meta.url)('/opt/node-tools/node_modules/playwright');
const root = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const BASE = process.env.HML_URL || 'http://127.0.0.1:8081/';
const outDir = path.join(root, 'marketing', 'store'); fs.mkdirSync(outDir, { recursive: true });
const sizes = [{ w: 1920, h: 1080, name: 'cover-1920x1080' }, { w: 800, h: 1200, name: 'cover-800x1200' }, { w: 800, h: 800, name: 'cover-800x800' }];
const browser = await chromium.launch();
for (const s of sizes) {
  const ctx = await browser.newContext({ viewport: { width: s.w, height: s.h }, deviceScaleFactor: 1 });
  const page = await ctx.newPage(); await page.route(/posthog/, r => r.fulfill({ status: 200, body: '{}' }));
  await page.goto(BASE, { waitUntil: 'load' }); await page.waitForFunction(() => window.__hml && window.__hml());
  await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(1500);
  await page.evaluate(({ w, h }) => {
    const land = w > h, sq = w === h;
    const el = document.createElement('div'); el.id = 'cover';
    el.style.cssText = `position:fixed;left:0;top:0;width:${w}px;height:${h}px;z-index:99999;overflow:hidden;background:#6E9A5A;font-family:Nunito,sans-serif`;
    document.body.appendChild(el);
    const add = (tag, css, html) => { const n = document.createElement(tag); n.style.cssText = css; if (html) n.innerHTML = html; el.appendChild(n); return n; };
    // 1. the level's own painted background, covering the frame, softened so the characters read
    const bg = R._bg(); const c = add('canvas', 'position:absolute;inset:0;width:100%;height:100%;filter:saturate(1.1) brightness(.92)');
    c.width = w; c.height = h; const x = c.getContext('2d');
    const sc = Math.max(w / bg.width, h / bg.height); x.drawImage(bg, (w - bg.width * sc) / 2, (h - bg.height * sc) / 2, bg.width * sc, bg.height * sc);
    const g = x.createRadialGradient(w * (land ? .3 : .5), h * .25, 10, w * .5, h * .5, Math.max(w, h) * .8); g.addColorStop(0, 'rgba(255,249,236,.35)'); g.addColorStop(1, 'rgba(30,40,20,.45)'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    // 2. wordmark and line, in the game's own type and colours
    const tsize = land ? 168 : sq ? 112 : 120;
    const stroke = n => Array.from({ length: 16 }, (_, i) => { const a = i / 16 * Math.PI * 2; return `${(Math.cos(a) * n).toFixed(1)}px ${(Math.sin(a) * n).toFixed(1)}px 0 #2A1E18`; }).join(',') + `,0 ${n + 6}px 0 rgba(0,0,0,.25)`;
    add('div', `position:absolute;${land ? 'left:90px;top:120px;width:900px;text-align:left' : 'left:0;right:0;top:' + (sq ? 44 : 70) + 'px;text-align:center'};font:800 ${tsize}px/0.95 Fraunces,Georgia,serif;color:#FFE07A;text-shadow:${stroke(land ? 9 : 7)};letter-spacing:-1px`, 'Hold My<br>Loot');
    add('div', `position:absolute;${land ? 'left:96px;top:470px;width:760px' : 'left:40px;right:40px;top:' + (sq ? 290 : 330) + 'px;text-align:center'};font:900 ${land ? 46 : 34}px/1.15 Nunito,sans-serif;color:#FFF9EC;text-shadow:${stroke(land ? 5 : 4)}`, 'Gary’s asleep.<br>Monsters want his loot.');
    // 3. sleeping Gary on his pile, big
    const gw = land ? 980 : sq ? 560 : 760; const gc = add('canvas', `position:absolute;${land ? 'right:60px;top:170px' : 'left:50%;transform:translateX(-50%);top:' + (sq ? 330 : 470) + 'px'};width:${gw}px;height:${gw * .55}px;filter:drop-shadow(0 14px 18px rgba(0,0,0,.35))`);
    gc.width = gw; gc.height = Math.round(gw * .55); R.garyPortrait(gc);
    // 4. the crew lining up to defend him
    const crew = land ? ['nan', 'chuck', 'bonk', 'bev', 'jezza', 'sizzle'] : ['nan', 'chuck', 'bonk'];
    // portraits carry a lot of padding round the character, so draw them big and let them overlap
    const cw = land ? 440 : sq ? 380 : 420, overlap = Math.round(cw * .42);
    const row = add('div', `position:absolute;left:0;right:0;bottom:${land ? -50 : sq ? -60 : -30}px;display:flex;justify-content:center`);
    crew.forEach((k, i) => { const cc = document.createElement('canvas'); cc.width = cw; cc.height = Math.round(cw * .9); cc.style.cssText = `filter:drop-shadow(0 10px 12px rgba(0,0,0,.35));margin-left:${i ? -overlap : 0}px`; row.appendChild(cc); R.portrait(cc, k, 1); });
  }, s);
  await page.waitForTimeout(400);
  const file = path.join(outDir, s.name + '.jpg');
  await page.locator('#cover').screenshot({ path: file, type: 'jpeg', quality: 88 });
  console.log(path.relative(root, file), Math.round(fs.statSync(file).size / 1024) + ' KB');
  await ctx.close();
}
await browser.close();
