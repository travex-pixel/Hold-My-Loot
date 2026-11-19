// Offline render of the game's own synthesised audio. Pulls the SFX/music block out of index.html, points it at an
// OfflineAudioContext, then schedules music beds, stings and sound effects at exact times and writes a WAV.
import fs from 'fs';
import path from 'path';
import { openBrowser } from './capture.mjs';
const INDEX = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..', 'index.html');

function sfxSource() {
  const html = fs.readFileSync(INDEX, 'utf8');
  const m = /<script>\s*\/\/ ===== Hold My Loot: synthesised sound effects[\s\S]*?<\/script>/.exec(html);
  if (!m) throw new Error('SFX block not found');
  let src = m[0].replace(/^<script>/, '').replace(/<\/script>$/, '');
  const n0 = src.split('const t0 = ac.currentTime + (o.delay || 0)').length - 1;
  src = src.split('const t0 = ac.currentTime + (o.delay || 0)').join('const t0 = (window.__T0 != null ? window.__T0 : ac.currentTime) + (o.delay || 0)');
  src = src.replace('return { play, unlock: () => unlock()', 'window.__SFXI = { S, TRACKS, STINGS, GAP, busReady, init, duck: () => duckG, bus: () => mBus };\n  return { play, unlock: () => unlock()');
  if (n0 !== 2 || !src.includes('window.__SFXI')) throw new Error('SFX patch did not apply (' + n0 + ')');
  return src;
}

// plan: { dur, music: [{ track, start, end, vol, fadeIn, fadeOut }], stings: [{ name, t, vol }], sfx: [{ n, a, t, vol }] }
// Applies the game's own per-sound cooldowns, plus a cap of 7 sounds per 120 ms so busy waves don't turn to noise.
export async function renderAudio(plan, outWav, browser) {
  const own = !browser; browser = browser || await openBrowser();
  const page = await browser.newPage();
  const GAPS = { thud: 45, poof: 70, peck: 90, tick: 55, coin: 70, soft: 60, hic: 220, whoosh: 70, squawk: 450, coo: 380, num: 40, drop: 90, bonk: 60, smash: 60, fwoomp: 150, flutter: 200, glug: 300, crit: 70 };
  const last = {}, win = []; const sfx = [];
  for (const e of plan.sfx.slice().sort((a, b) => a.t - b.t)) {
    if (e.t < 0 || e.t > plan.dur * 1000) continue;
    const gap = e.force ? 0 : (GAPS[e.n] || 30);
    if (last[e.n] != null && e.t - last[e.n] < gap) continue;
    while (win.length && e.t - win[0] > 120) win.shift();
    if (!e.force && win.length >= 7) continue;
    last[e.n] = e.t; win.push(e.t); sfx.push(e);
  }
  await page.evaluate(([dur]) => { window.__OFF = new OfflineAudioContext(2, Math.ceil(48000 * dur), 48000); window.AudioContext = function () { return window.__OFF; }; }, [plan.dur]);
  await page.addScriptTag({ content: sfxSource() });
  const b64 = await page.evaluate(async ([plan, sfx]) => {
    const I = window.__SFXI, ac = window.__OFF; I.busReady();
    const duck = I.duck(), bus = I.bus();
    for (const m of plan.music || []) {
      const g = ac.createGain(), v = m.vol == null ? .8 : m.vol, fi = m.fadeIn == null ? .3 : m.fadeIn, fo = m.fadeOut == null ? .6 : m.fadeOut;
      g.gain.setValueAtTime(0, m.start); g.gain.linearRampToValueAtTime(v, m.start + fi); g.gain.setValueAtTime(v, Math.max(m.start + fi, m.end - fo)); g.gain.linearRampToValueAtTime(0, m.end); g.connect(duck);
      const def = I.TRACKS[m.track]; const tr = { name: m.track, g, step: m.step || 0, next: m.start, def };
      while (tr.next < m.end) { def.fn(tr, tr.next, tr.step); tr.step++; tr.next += def.dt(); }
    }
    for (const s of plan.stings || []) { const g = ac.createGain(); g.gain.value = s.vol == null ? 1 : s.vol; g.connect(bus); I.STINGS[s.name](g, s.t); }
    for (const e of sfx) { if (!I.S[e.n]) continue; window.__T0 = e.t / 1000; try { I.S[e.n](e.a); } catch (err) {} }
    window.__T0 = null;
    const buf = await ac.startRendering();
    const L = buf.getChannelData(0), R = buf.getChannelData(1), n = L.length, out = new DataView(new ArrayBuffer(44 + n * 4));
    const w = (o, s) => { for (let i = 0; i < s.length; i++) out.setUint8(o + i, s.charCodeAt(i)); };
    w(0, 'RIFF'); out.setUint32(4, 36 + n * 4, true); w(8, 'WAVEfmt '); out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, 2, true); out.setUint32(24, 48000, true); out.setUint32(28, 192000, true); out.setUint16(32, 4, true); out.setUint16(34, 16, true); w(36, 'data'); out.setUint32(40, n * 4, true);
    for (let i = 0; i < n; i++) { out.setInt16(44 + i * 4, Math.max(-1, Math.min(1, L[i])) * 32767, true); out.setInt16(46 + i * 4, Math.max(-1, Math.min(1, R[i])) * 32767, true); }
    const bytes = new Uint8Array(out.buffer); let s = ''; for (let i = 0; i < bytes.length; i += 32768) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 32768)); return btoa(s);
  }, [plan, sfx]);
  fs.mkdirSync(path.dirname(outWav), { recursive: true });
  fs.writeFileSync(outWav, Buffer.from(b64, 'base64'));
  await page.close(); if (own) await browser.close();
  return { sfx: sfx.length };
}
