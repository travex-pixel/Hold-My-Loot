// Turns an episode spec into an MP4: renders the audio plan with the game's own sound engine, then draws every frame
// on stage.html and pipes it straight into ffmpeg (H.264 + AAC, loudness-normalised for social, faststart).
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { openBrowser, WORK, BASE, FPS } from './capture.mjs';
import { renderAudio } from './audio.mjs';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
export const OUT = path.join(ROOT, 'out');

export function timeline(spec) { let t = 0; return spec.segs.map(s => { const o = Object.assign({ t0: t }, s); t += s.d; o.t1 = t; return o; }); }
export function duration(spec) { return spec.segs.reduce((a, s) => a + s.d, 0); }

export function audioPlan(spec) {
  const segs = timeline(spec), dur = duration(spec), sfx = [];
  for (const s of segs) {
    // whoosh on every cut (the first frame starts on a hit instead)
    if (s.t0 > 0 && s.whoosh !== false) sfx.push({ n: s.kind === 'card' ? 'bigwhoosh' : 'whoosh', t: Math.max(0, s.t0 * 1000 - 60), force: true });
    if (s.kind === 'card' && s.hit !== false) sfx.push({ n: s.hit || 'slam', t: s.t0 * 1000 + 80, force: true });
    for (const e of s.sfx || []) sfx.push({ n: e.n, a: e.a, t: (s.t0 + e.t) * 1000, force: true });
    const shots = s.kind === 'split' ? [s.a] : (s.kind === 'foot' || s.kind === 'phone') ? [s] : [];
    for (const src of shots) {
      if (s.mute || src.mute) continue;
      const snd = JSON.parse(fs.readFileSync(path.join(WORK, 'shots', src.shot, 'sound.json'), 'utf8')), from = (src.from || 0) * 1000, sp = src.speed == null ? 1 : src.speed;
      for (const e of snd) { if (e.k !== 'sfx') continue; if (e.t < from || e.t >= from + s.d * 1000 * sp) continue; if (['click', 'wave'].includes(e.n) && !src.keepClicks) continue; sfx.push({ n: e.n, a: e.a, t: s.t0 * 1000 + (e.t - from) / sp }); }
      if (src.stings) for (const e of snd) if (e.k === 'sting' && e.t >= from && e.t < from + s.d * 1000 * sp) (spec._stings = spec._stings || []).push({ name: e.n, t: s.t0 + (e.t - from) / sp / 1000 });
    }
  }
  for (const c of spec.caps || []) if (c.sfx) sfx.push({ n: c.sfx, t: c.t * 1000, force: true });
  for (const e of spec.sfx || []) sfx.push({ n: e.n, a: e.a, t: e.t * 1000, force: true });
  const music = (spec.music || [{ track: 'game', start: 0, end: dur }]).map(m => Object.assign({ end: dur }, m));
  return { dur, music, stings: (spec.stings || []).concat(spec._stings || []), sfx };
}

export async function renderEpisode(spec, { browser, scale = 1 } = {}) {
  const own = !browser; browser = browser || await openBrowser();
  const dur = duration(spec), frames = Math.round(dur * FPS);
  fs.mkdirSync(OUT, { recursive: true });
  const wav = path.join(WORK, 'audio', spec.id + '.wav');
  spec._stings = []; const plan = audioPlan(spec);
  await renderAudio(plan, wav, browser);
  const shots = {}; const need = new Set();
  for (const s of spec.segs) { if (s.shot) need.add(s.shot); if (s.a) need.add(s.a.shot); if (s.b) need.add(s.b.shot); }
  for (const n of need) shots[n] = JSON.parse(fs.readFileSync(path.join(WORK, 'shots', n, 'meta.json'), 'utf8'));
  const ctx = await browser.newContext({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: scale });
  const page = await ctx.newPage(); page.on('pageerror', e => console.log('stage error', String(e)));
  await page.goto(BASE + 'marketing/video/stage.html', { waitUntil: 'load' });
  await page.evaluate(() => window.ready());
  const total = await page.evaluate(([s, shots]) => window.setSpec(Object.assign({}, s, { shots })), [Object.assign({}, spec, { segs: spec.segs }), shots]);
  const mp4 = path.join(OUT, spec.id + '.mp4');
  const ff = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-i', wav,
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-g', '60',
    '-af', 'loudnorm=I=-13:TP=-1.5:LRA=11', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-shortest', '-movflags', '+faststart', mp4], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((res, rej) => ff.on('close', c => c === 0 ? res() : rej(new Error('ffmpeg exit ' + c))));
  const write = buf => new Promise(res => { if (!ff.stdin.write(buf)) ff.stdin.once('drain', res); else res(); });
  const t0 = Date.now();
  for (let f = 0; f < frames; f++) {
    await page.evaluate(t => window.renderAt(t), f / FPS);
    await write(await page.screenshot({ type: 'jpeg', quality: 93 }));
    if (spec.cover != null && Math.abs(f / FPS - spec.cover) < .5 / FPS) await page.screenshot({ path: path.join(WORK, 'covers', spec.id + '.jpg'), type: 'jpeg', quality: 92 }).catch(() => {});
  }
  ff.stdin.end(); await done;
  await ctx.close(); if (own) await browser.close();
  return { mp4, secs: +dur.toFixed(2), frames, renderS: Math.round((Date.now() - t0) / 1000), sounds: plan.sfx.length };
}
