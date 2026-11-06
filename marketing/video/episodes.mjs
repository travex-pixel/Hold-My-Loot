// Every video as data. Times are seconds. Captions: *yellow*, ~red~, _green_.
// Retention rules applied to every video (see marketing/video/README.md):
//  1. Frame one is the most interesting picture in the video, with the claim on it. No logo, no intro.
//  2. A cut every 1.5 to 2.5 s, each with a punch-in and a whoosh. Nothing on screen without a reason.
//  3. A number or a stake on screen in the first five seconds. Then escalate: each beat bigger than the last.
//  4. One open question early ("but then..."), paid off at the end.
//  5. No outro. The last line leads straight back into the first, so the Short loops.
import fs from 'fs';
import path from 'path';
const INDEX = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', 'index.html');
const SRC = fs.readFileSync(INDEX, 'utf8');
const lineOf = needle => SRC.split('\n').findIndex(l => l.includes(needle));

// game coordinates (360x600 board) -> 0..1 of the captured 1080x1920 frame
export const g2n = (gx, gy) => [(23 + gx * 314 / 360) / 360, (53.3 + gy * 523 / 600) / 640];
const GARY = g2n(180, 548);
const CTA = { text: 'holdmyloot.com', sub: 'free · plays in your browser' };
const cap = (t, d, text, o) => Object.assign({ t, d, text }, o || {});
// lay captions on segment boundaries: caps placed with `at` = segment index
function build(spec) {
  let t = 0; const starts = spec.segs.map(s => { const v = t; t += s.d; return v; });
  spec.caps = (spec.caps || []).map(c => c.seg != null ? Object.assign({}, c, { t: starts[c.seg] + (c.off || 0), d: c.d || spec.segs[c.seg].d - (c.off || 0) }) : c);
  if (spec.ctaSeg != null) spec.cta = Object.assign({ t: starts[spec.ctaSeg] + (spec.ctaOff || .2) }, CTA, spec.ctaText || {});
  spec.dur = t; return spec;
}
const C = (seg, text, o) => Object.assign({ seg, text }, o || {});

export const EPISODES = {};

// ============ 1. One file ============
EPISODES.ep01 = build({
  id: 'ep01-one-file', title: 'I built a whole tower defence game in ONE file', cover: 0.7,
  codeText: SRC,
  segs: [
    { kind: 'foot', shot: 'chaos', from: 4.2, d: 2.0, zoom: [1.0, 1.1], focus: [.5, .45] },
    { kind: 'card', bg: 'honey', kick: 'in', big: 'ONE FILE', small: 'no engine · no install', d: 1.6 },
    { kind: 'code', line: 700, lps: 160, d: 2.6 },
    { kind: 'foot', shot: 'crew_screen', from: 1.2, d: 1.8, zoom: [1.0, 1.06], focus: [.5, .55] },
    { kind: 'foot', shot: 'kevin_intro', from: 0.3, d: 1.7, zoom: [1.05, 1.2], focus: [.5, .38] },
    { kind: 'foot', shot: 'pants_crew', from: 0.6, d: 2.0, zoom: [1.5, 1.7], focus: [g2n(160, 230)[0], g2n(160, 230)[1]] },
    { kind: 'foot', shot: 'bev_birds', from: 2.8, d: 1.7, zoom: [1.25, 1.4], focus: [.5, .45] },
    { kind: 'foot', shot: 'nan_crits', from: 1.7, d: 2.2, zoom: [1.3, 1.45], focus: g2n(185, 150), shake: 22 },
    { kind: 'card', bg: 'red', kick: 'it took', big: '30 BUILDS', small: 'one person · one AI\nzero engines', d: 1.9 },
    { kind: 'split', d: 2.4, a: { shot: 'marg_before', from: 2.0, zoom: 2.1, focus: g2n(105, 215), label: 'BUILD 18', chip: 'red' }, b: { shot: 'marg_after', from: 2.0, zoom: 2.1, focus: g2n(105, 215), label: 'BUILD 19', chip: 'green' } },
    { kind: 'foot', shot: 'smear_bug', from: 2.5, d: 1.6, zoom: [1.0, 1.08], tag: 'RECREATED' },
    { kind: 'phone', shot: 'taster_open', from: 0.2, d: 3.2, bg: 'honey' },
    { kind: 'foot', shot: 'chaos', from: 7.4, d: 1.7, zoom: [1.12, 1.0], focus: [.5, .45] },
  ],
  caps: [
    C(0, 'I made *this* game', { pos: 'top' }),
    C(2, '*6,834* lines', { pos: 'center', d: 1.3 }), C(2, '*690,469* characters', { pos: 'center', off: 1.3 }),
    C(3, '13 idiots\nwith *dignity*', { pos: 'top' }),
    C(4, '*19* bosses', { pos: 'low' }),
    C(5, 'a king who steals *pants*', { pos: 'low' }),
    C(6, 'bin chickens.\n*colleagues.*', { pos: 'low' }),
    C(7, 'and *Nan.*', { pos: 'low', size: 130, sfx: 'crit' }),
    C(9, 'Marg couldn’t\nreach the *road*', { pos: 'center', size: 80 }),
    C(10, 'Android *ate* the map', { pos: 'low' }),
    C(11, 'free. *one tap.*', { pos: 'top' }),
    C(12, 'all in *ONE* file.', { pos: 'center', size: 110 }),
  ],
  ctaSeg: 11, ctaOff: .5,
  music: [{ track: 'game', start: 0, end: 99, vol: .75 }],
  sfx: [],
});

// ============ 2. Gary never wakes up ============
EPISODES.ep02 = build({
  id: 'ep02-gary-never-wakes-up', title: 'The hero of my game is asleep. On purpose.', cover: 0.8,
  segs: [
    { kind: 'foot', shot: 'gary_sleep', from: 0.3, d: 2.3, zoom: [2.3, 2.5], focus: GARY },
    { kind: 'foot', shot: 'gary_sleep', from: 7.6, d: 2.0, zoom: [2.6, 2.4], focus: GARY },
    { kind: 'foot', shot: 'chaos', from: 2.0, d: 1.6, zoom: [1.05, 1.15], focus: [.5, .45] },
    { kind: 'foot', shot: 'kevin_intro', from: 0.2, d: 1.6, zoom: [1.1, 1.25], focus: [.5, .36] },
    { kind: 'foot', shot: 'gary_sleep', from: 2.6, d: 1.8, zoom: [2.6, 2.8], focus: GARY },
    { kind: 'foot', shot: 'pants_gary', from: 3.0, d: 3.0, zoom: [1.6, 2.0], focus: [.5, .78] },
    { kind: 'foot', shot: 'pants_gary', from: 6.0, d: 1.9, zoom: [2.2, 2.4], focus: GARY },
    { kind: 'foot', shot: 'alarm_raid', from: 0.4, d: 2.2, zoom: [1.1, 1.25], focus: [.5, .5], shake: 26 },
    { kind: 'foot', shot: 'alarm_raid', from: 4.6, d: 1.8, zoom: [2.2, 2.4], focus: GARY },
    { kind: 'card', bg: 'dark', kick: 'the one rule', big: 'Gary never\nwakes up.', bigSize: 150, small: '30 builds. not once.', d: 2.4 },
    { kind: 'foot', shot: 'gary_sleep', from: 10.1, d: 2.6, zoom: [2.4, 2.6], focus: GARY },
  ],
  caps: [
    C(0, 'this is the *hero*', { pos: 'top' }), C(1, 'he does *nothing*', { pos: 'top' }),
    C(2, 'monsters attack', { pos: 'low' }), C(3, 'a boss shows up', { pos: 'low' }), C(4, '~still~ asleep', { pos: 'top' }),
    C(5, 'a king steals\nhis *pants*', { pos: 'top' }), C(6, '*STILL* asleep', { pos: 'top', size: 120 }),
    C(7, 'his *ALARM CLOCK*\nattacks', { pos: 'top' }), C(8, 'nope.', { pos: 'top', size: 140 }),
    C(10, '...and he never will.', { pos: 'top' }),
  ],
  ctaSeg: 10, ctaOff: .9,
  music: [{ track: 'menu', start: 0, end: 99, vol: .7 }],
});

// ============ 3. Nan ============
EPISODES.ep03 = build({
  id: 'ep03-i-nerfed-nan', title: 'I nerfed Nan. A real player made me put her back.', cover: 0.5,
  segs: [
    { kind: 'foot', shot: 'nan_crits', from: 3.0, d: 2.0, zoom: [1.5, 1.6], focus: g2n(185, 150) },
    { kind: 'foot', shot: 'nan_crits', from: 4.6, d: 1.7, zoom: [1.15, 1.25], focus: g2n(150, 140), shake: 18 },
    { kind: 'foot', shot: 'chaos', from: 5.8, d: 1.6, zoom: [1.05, 1.15], focus: [.5, .4] },
    { kind: 'card', bg: 'dark', kick: 'build 17', big: 'I nerfed her.', bigSize: 160, small: 'for "balance"', d: 1.8 },
    { kind: 'doc', head: 'What’s new · v17', lines: ['Nan was carrying everyone.', 'Her needles hit a little softer.', 'Dazza’s junk hits a little harder.'], mark: 1, markAt: .3, d: 2.6, bg: 'paper' },
    { kind: 'card', bg: 'red', kick: 'but a real player', big: 'LOVED her', small: 'so I undid it', d: 1.8 },
    { kind: 'doc', head: 'What’s new · v18', lines: ['Nan is back to full, ridiculous power.', 'Hold My Loot is her game and we all just live in it.'], mark: 0, markAt: .25, d: 2.8, bg: 'honey' },
    { kind: 'doc', head: 'DESIGN.md · the rules', lines: ['Nan is absurdly overpowered on purpose.', 'Do not flatten her into an average character to make a spreadsheet tidy.'], mark: 0, markAt: .25, d: 2.8, bg: 'sky' },
    { kind: 'foot', shot: 'nan_crits', from: 1.8, d: 2.6, zoom: [1.1, 1.35], focus: g2n(185, 160), shake: 30, stings: false },
    { kind: 'foot', shot: 'nan_crits', from: 5.6, d: 2.2, zoom: [1.35, 1.2], focus: g2n(185, 150) },
  ],
  caps: [
    C(0, 'this is *Nan*', { pos: 'low', size: 120, sfx: 'crit' }), C(1, 'she’s ~broken~', { pos: 'low' }), C(2, 'she wins levels *alone*', { pos: 'low' }),
    C(5, 'and I *listened*', { pos: 'low', off: .9, d: .9 }),
    C(7, 'it’s a *written rule* now', { pos: 'low' }),
    C(8, '*NAN ETERNAL*', { pos: 'low', size: 130 }),
    C(9, 'Nan fixes most things.', { pos: 'low' }),
  ],
  ctaSeg: 9, ctaOff: .7,
  music: [{ track: 'boss', start: 0, end: 99, vol: .6 }],
});

// ============ 4. Big Marg's reach ============
const MARG = g2n(110, 215);
EPISODES.ep04 = build({
  id: 'ep04-marg-couldnt-reach', title: 'For 18 builds my frying-pan lady couldn’t reach the road', cover: 1.2,
  segs: [
    { kind: 'foot', shot: 'marg_before', from: 1.0, d: 2.3, zoom: [2.0, 2.2], focus: MARG, tag: 'RECREATED' },
    { kind: 'foot', shot: 'marg_before', from: 3.3, d: 1.9, zoom: [2.3, 2.1], focus: MARG, tag: 'RECREATED' },
    { kind: 'card', bg: 'red', kick: 'out of 428 pallets', big: '102', count: [0, 102, '{}'], small: 'were too far from the road', d: 2.0 },
    { kind: 'card', bg: 'dark', kick: 'nobody noticed for', big: '18 BUILDS', d: 1.6 },
    { kind: 'card', bg: 'honey', kick: 'the fix', big: '+12', small: 'pan reach 60 → 72', d: 1.8 },
    { kind: 'split', d: 3.0, a: { shot: 'marg_before', from: 2.4, zoom: 1.9, focus: MARG, label: 'BEFORE', chip: 'red' }, b: { shot: 'marg_after', from: 2.4, zoom: 1.9, focus: MARG, label: 'AFTER', chip: 'green' } },
    { kind: 'foot', shot: 'marg_toofar', from: 0.6, d: 2.6, zoom: [1.3, 1.9], focus: [.74, .24] },
    { kind: 'foot', shot: 'marg_after', from: 3.6, d: 2.2, zoom: [2.2, 2.4], focus: MARG },
  ],
  caps: [
    C(0, 'Big Marg has *one* job', { pos: 'top' }), C(1, 'hit monsters\nwith a *frying pan*', { pos: 'top', d: 1.0 }), C(1, 'she hit ~nothing~', { pos: 'top', off: 1.0 }),
    C(6, 'now the game\n*warns you*', { pos: 'top' }),
    C(7, '*BONK.*', { pos: 'top', size: 150, sfx: 'bonk' }),
  ],
  stickers: [{ kind: 'circle', t: 3.2, d: 1.0, x: 560, y: 1200, r: 170 }, { kind: 'circle', t: 17.4 - 2.2 - 2.6 + 1.0, d: 1.5, x: 735, y: 1090, r: 200 }],
  ctaSeg: 7, ctaOff: .8,
  music: [{ track: 'game', start: 0, end: 99, vol: .7 }],
});

// ============ 5. The soundtrack is code ============
const MENU_LINE = lineOf('// Menu: "The Snoring Knight"'), INSTR = lineOf('// ---------- instruments ----------');
EPISODES.ep05 = build({
  id: 'ep05-soundtrack-is-code', title: 'My game’s soundtrack has zero audio files', cover: 1.0,
  codeText: SRC,
  segs: [
    { kind: 'foot', shot: 'chaos', from: 5.0, d: 2.0, zoom: [1.35, 1.45], focus: [.5, .45], mute: true },
    { kind: 'code', line: MENU_LINE, lps: 1.6, mark: MENU_LINE, d: 2.6 },
    { kind: 'card', bg: 'dark', kick: 'audio files in my game', big: '0', d: 1.8, hit: 'bassdrop' },
    { kind: 'code', line: INSTR, lps: 26, d: 2.2 },
    { kind: 'foot', shot: 'kevin_intro', from: 0.2, d: 2.6, zoom: [1.05, 1.2], focus: [.5, .36] },
    { kind: 'foot', shot: 'banjo', from: 0.2, d: 2.8, zoom: [1.5, 1.7], focus: g2n(178, 378), stings: true },
    { kind: 'foot', shot: 'win3', from: 0.1, d: 2.8, zoom: [1.0, 1.06], focus: [.5, .4] },
    { kind: 'card', bg: 'honey', kick: 'no licences', big: '0 downloads', bigSize: 170, small: 'just maths making noise', d: 2.0 },
    { kind: 'foot', shot: 'chaos', from: 1.0, d: 2.6, zoom: [1.05, 1.15], focus: [.5, .45] },
  ],
  caps: [
    C(0, 'this music...', { pos: 'top' }), C(1, '...is *this*', { pos: 'top' }),
    C(3, 'a *lute*. a *fiddle*.\na *crumhorn*.', { pos: 'top', size: 84 }),
    C(4, 'boss? *boss music.*', { pos: 'low' }), C(5, 'Banjo gets a *kazoo*', { pos: 'top' }), C(6, 'win? *fanfare.*', { pos: 'low' }),
    C(8, 'every note is *code*', { pos: 'top' }),
  ],
  ctaSeg: 8, ctaOff: .6,
  music: [{ track: 'menu', start: 0, end: 8.7, vol: .9, fadeOut: .25 }, { track: 'boss', start: 8.6, end: 11.2, vol: .9, fadeIn: .05, fadeOut: .2 }, { track: 'game', start: 16.8, end: 99, vol: .85 }],
  stings: [{ name: 'victory', t: 14.05 }],
});

// ============ 6. Sir Pantsalot ============
EPISODES.ep06 = build({
  id: 'ep06-pantsalot', title: 'For 20 builds Sir Pantsalot took zero pants', cover: 1.0,
  segs: [
    { kind: 'foot', shot: 'pants_crew', from: 0.4, d: 2.2, zoom: [1.6, 1.8], focus: g2n(170, 200) },
    { kind: 'card', bg: 'paper', kick: 'for 20 builds', big: '0 PANTS', small: 'he just... walked', d: 1.8 },
    { kind: 'card', bg: 'red', kick: 'build 24', big: 'PANTS.', small: 'he finally takes them', d: 1.6 },
    { kind: 'foot', shot: 'pants_crew', from: 3.7, d: 2.2, zoom: [1.7, 1.9], focus: g2n(200, 260) },
    { kind: 'foot', shot: 'pants_crew', from: 7.4, d: 2.2, zoom: [1.6, 1.8], focus: g2n(150, 420) },
    { kind: 'foot', shot: 'pants_crew', from: 10.8, d: 2.4, zoom: [1.6, 1.8], focus: g2n(180, 430) },
    { kind: 'card', bg: 'honey', kick: 'every pair he steals', big: '+1 ARMOUR', bigSize: 170, small: 'the pants make him stronger', d: 1.9 },
    { kind: 'foot', shot: 'pants_gary', from: 3.2, d: 2.8, zoom: [1.6, 2.0], focus: [.5, .78] },
    { kind: 'foot', shot: 'pants_gary', from: 6.0, d: 2.0, zoom: [2.2, 2.4], focus: GARY },
  ],
  caps: [
    C(0, 'his name is\n*Sir Pantsalot*', { pos: 'top' }),
    C(3, '~OI! MY PANTS!~', { pos: 'top', size: 110 }), C(4, 'no pants = *no work*', { pos: 'top' }), C(5, 'Long Peter...', { pos: 'top' }),
    C(7, 'and if he reaches *Gary*...', { pos: 'top' }), C(8, '...why is it *breezy*', { pos: 'top' }),
  ],
  ctaSeg: 8, ctaOff: .7,
  music: [{ track: 'boss', start: 0, end: 99, vol: .55 }],
});

// ============ 7. Android ate the map ============
const BG_LINE = lineOf('function bgBlank(b) {');
EPISODES.ep07 = build({
  id: 'ep07-android-ate-the-map', title: 'Some Android phones were eating my game', cover: 1.0,
  codeText: SRC,
  segs: [
    { kind: 'foot', shot: 'smear_bug', from: 3.0, d: 2.0, zoom: [1.0, 1.08], tag: 'RECREATED' },
    { kind: 'foot', shot: 'smear_bug', from: 0.4, d: 1.8, zoom: [1.1, 1.2], focus: [.5, .4], tag: 'RECREATED' },
    { kind: 'card', bg: 'dark', kick: 'the phone quietly', big: 'DELETED\nthe map', bigSize: 160, small: 'to save memory', d: 2.0 },
    { kind: 'foot', shot: 'smear_bug', from: 4.0, d: 1.6, zoom: [1.15, 1.25], focus: [.5, .5], tag: 'RECREATED' },
    { kind: 'card', bg: 'honey', kick: 'the fix', big: '3 pixels', small: 'checked every second', d: 1.8 },
    { kind: 'code', line: BG_LINE, lps: 1.2, mark: BG_LINE + 1, d: 2.6 },
    { kind: 'split', d: 2.8, a: { shot: 'smear_bug', from: 3.4, zoom: 1.4, focus: [.5, .45], label: 'BEFORE', chip: 'red' }, b: { shot: 'smear_ok', from: 1.0, zoom: 1.4, focus: [.5, .45], label: 'AFTER', chip: 'green' } },
    { kind: 'foot', shot: 'smear_ok', from: 1.6, d: 2.2, zoom: [1.05, 1.15], focus: [.5, .45] },
  ],
  caps: [
    C(0, 'this is ~not~ a filter', { pos: 'top' }), C(1, 'my game on\nsome *Android* phones', { pos: 'top' }),
    C(3, '...and nothing\ncleaned up', { pos: 'top' }),
    C(5, 'blank? *rebuild it.*', { pos: 'low' }),
    C(7, '*fixed.*', { pos: 'top', size: 140 }),
  ],
  ctaSeg: 7, ctaOff: .6,
  music: [{ track: 'game', start: 0, end: 99, vol: .7 }],
});

// ============ 8. Saves ============
EPISODES.ep08 = build({
  id: 'ep08-three-copies', title: 'Every save in my game has three copies', cover: 0.8,
  segs: [
    { kind: 'foot', shot: 'save_reset', from: 0.7, d: 2.2, zoom: [1.0, 1.08], focus: [.5, .78] },
    { kind: 'foot', shot: 'save_reset', from: 2.4, d: 1.8, zoom: [1.08, 1.0], focus: [.5, .5], shake: 24 },
    { kind: 'card', bg: 'dark', kick: 'browser games lose saves', big: 'ALL THE\nTIME', bigSize: 170, small: 'private tabs · chat apps · cleared data', d: 2.2 },
    { kind: 'card', bg: 'honey', kick: 'so every save has', big: '3 COPIES', small: 'main · last good · best ever', d: 2.0 },
    { kind: 'foot', shot: 'save_copy', from: 1.2, d: 2.4, zoom: [1.0, 1.1], focus: [.5, .55] },
    { kind: 'foot', shot: 'save_load', from: 0.6, d: 2.6, zoom: [1.0, 1.1], focus: [.5, .55] },
    { kind: 'foot', shot: 'save_load', from: 4.2, d: 2.6, zoom: [1.0, 1.05], focus: [.5, .4] },
    { kind: 'card', bg: 'paper', big: 'phew.', bigSize: 230, d: 1.6 },
  ],
  caps: [
    C(0, 'watch me *delete*\nmy whole save', { pos: 'top' }), C(1, '~gone.~', { pos: 'top', size: 140 }),
    C(4, 'plus a *save code*', { pos: 'top' }), C(5, 'paste it on *any* phone', { pos: 'top' }), C(6, '*all back.*', { pos: 'top', size: 130 }),
  ],
  ctaSeg: 7, ctaOff: .4,
  music: [{ track: 'game', start: 0, end: 99, vol: .7 }],
});

// ============ 9. 8,400 bot games ============
// Numbers come from tests/balance.mjs on build 30 (the term lines) and tests/balance-matrix.mjs on build 31 (review/balance.md).
const LANE = g2n(70, 420);
EPISODES.ep09 = build({
  id: 'ep09-bots-played-my-game', title: 'I made bots play my game 8,400 times', cover: 0.9,
  segs: [
    { kind: 'grid', d: 2.4, speed: 1.6, stagger: .05, lead: .7, tiles: [
      { shot: 'chaos', from: 2 }, { shot: 'nan_crits', from: 1 }, { shot: 'lanes_wide', from: 0 },
      { shot: 'bev_birds', from: 1 }, { shot: 'pants_crew', from: 4 }, { shot: 'banjo', from: 1 },
      { shot: 'marg_after', from: 1 }, { shot: 'alarm_raid', from: 1 }, { shot: 'taster_build', from: 2 }] },
    { kind: 'card', bg: 'dark', kick: 'games played', big: '0', count: [0, 8400], countDur: 1.2, small: '28 levels · every difficulty · with and without Nan', d: 2.0, hit: 'bassdrop' },
    { kind: 'term', d: 2.6, size: 46, top: 560, lines: ['<u>$</u> node tests/balance.mjs   <b>build 30</b>', '', 'Lv  Level              <b>win%</b>', ' 4  Campfire Corner     100', ' 5  The Beer Garden      90', '<em> 6  The Laneways         40</em>', ' 7  Fairy Ring Woods    100', ' 8  Gary’s Big Day      100'], at: [0, .1, .2, .45, .65, 1.15, 1.5, 1.7] },
    { kind: 'card', bg: 'red', kick: 'level 6 · the laneways', big: '60%', small: 'of bots lost', d: 1.8 },
    { kind: 'foot', shot: 'lanes_wide', from: 0.5, d: 2.0, zoom: [1.0, 1.08], focus: [.5, .45] },
    { kind: 'foot', shot: 'lanes_before', from: 1.0, d: 2.6, zoom: [1.6, 1.8], focus: LANE, tag: 'RECREATED' },
    { kind: 'doc', head: 'Build 31 · The Laneways', lines: ['Rat Mums take the long road.', 'A few less goblins and mozzies early.', '+30 starting gold.'], mark: 0, markAt: .25, d: 2.6, bg: 'honey' },
    { kind: 'split', d: 2.6, a: { shot: 'lanes_before', from: 3.4, zoom: 1.5, focus: LANE, label: 'BUILD 30', chip: 'red' }, b: { shot: 'lanes_after', from: 3.4, zoom: 1.3, focus: [.5, .4], label: 'BUILD 31', chip: 'green' } },
    { kind: 'card', bg: 'green', kick: 'bots who win now', big: '92%', d: 1.8, hit: 'bassdrop' },
    { kind: 'foot', shot: 'nan_crits', from: 1.5, d: 2.4, zoom: [1.3, 1.45], focus: [.5, .4] },
  ],
  caps: [
    C(0, 'I made *bots*\nplay my game', { pos: 'center', size: 110 }),
    C(2, 'most levels: _fine_', { pos: 'low', off: .5, d: 1.0 }), C(2, 'then ~this one~', { pos: 'low', off: 1.5 }),
    C(4, '*three* entrances', { pos: 'top' }),
    C(5, 'Rat Mums took\nthe ~empty lane~', { pos: 'top' }),
    C(9, 'and Nan? *untouched.*', { pos: 'top' }),
  ],
  stickers: [],
  ctaSeg: 9, ctaOff: .7,
  music: [{ track: 'game', start: 0, end: 7.0, vol: .75, fadeOut: .2 }, { track: 'boss', start: 7.0, end: 13.4, vol: .8, fadeIn: .05, fadeOut: .2 }, { track: 'game', start: 13.4, end: 18.5, vol: .6, fadeOut: .15 }, { track: 'game', start: 19.9, end: 99, vol: .8 }],
  stings: [{ name: 'victory', t: 18.65 }],
});

// ============ 10. 30 builds, everything that broke ============
EPISODES.ep10 = build({
  id: 'ep10-everything-that-broke', title: '30 builds. Everything that broke.', cover: 0.8,
  segs: [
    { kind: 'foot', shot: 'smear_bug', from: 3.0, d: 2.0, zoom: [1.2, 1.35], focus: [.5, .42], tag: 'RECREATED' },
    { kind: 'card', bg: 'dark', kick: 'builds', big: '1', count: [1, 30], countDur: 1.0, small: 'one file · one person', d: 1.6 },
    { kind: 'foot', shot: 'nan_crits', from: 0.8, d: 1.6, zoom: [1.4, 1.55], focus: [.5, .38] },
    { kind: 'foot', shot: 'marg_before', from: 1.2, d: 1.6, zoom: [1.7, 1.9], focus: g2n(105, 230), tag: 'RECREATED' },
    { kind: 'foot', shot: 'pants_crew', from: 1.2, d: 1.6, zoom: [1.6, 1.8], focus: g2n(170, 220) },
    { kind: 'foot', shot: 'smear_bug', from: 1.0, d: 1.6, zoom: [1.3, 1.4], focus: [.5, .5], tag: 'RECREATED' },
    { kind: 'foot', shot: 'save_reset', from: 2.4, d: 1.6, zoom: [1.08, 1.0], focus: [.5, .5], shake: 24 },
    { kind: 'foot', shot: 'lanes_before', from: 2.0, d: 1.6, zoom: [1.6, 1.8], focus: LANE, tag: 'RECREATED' },
    { kind: 'card', bg: 'honey', kick: 'build 31', big: 'ALL FIXED.', bigSize: 190, small: 'every one written down in the changelog', d: 1.8 },
    { kind: 'foot', shot: 'win3', from: 0.3, d: 2.0, zoom: [1.0, 1.06], focus: [.5, .4] },
    { kind: 'foot', shot: 'gary_sleep', from: 2.0, d: 2.6, zoom: [2.3, 2.5], focus: GARY },
  ],
  caps: [
    C(0, '*everything* that broke', { pos: 'top', size: 110 }),
    C(2, 'I ~nerfed~ Nan', { pos: 'top' }),
    C(3, 'Marg couldn’t ~reach~', { pos: 'top' }),
    C(4, 'the pants king\ntook ~zero pants~', { pos: 'top' }),
    C(5, 'Android *ate* the map', { pos: 'top' }),
    C(6, 'saves ~vanished~', { pos: 'top' }),
    C(7, 'a level bots lost *60%*', { pos: 'top' }),
    C(10, 'and Gary? *still asleep.*', { pos: 'top' }),
  ],
  ctaSeg: 10, ctaOff: .6,
  music: [{ track: 'boss', start: 0, end: 13.2, vol: .8, fadeOut: .2 }, { track: 'game', start: 16.3, end: 99, vol: .8 }],
  stings: [{ name: 'victory', t: 15.05 }],
});

// ============ Launch trailer ============
EPISODES.trailer = build({
  id: 'trailer-launch', title: 'Hold My Loot launch trailer', cover: 0.6,
  segs: [
    { kind: 'foot', shot: 'gary_sleep', from: 0.3, d: 1.8, zoom: [2.4, 2.6], focus: GARY },
    { kind: 'foot', shot: 'chaos', from: 1.2, d: 1.6, zoom: [1.1, 1.2], focus: [.5, .4] },
    { kind: 'card', bg: 'honey', kick: 'your crew', big: 'IDIOTS', small: 'with dignity', d: 1.4 },
    { kind: 'foot', shot: 'act_chuck', from: 1.8, d: 1.3, zoom: [1.7, 1.9], focus: g2n(178, 378) },
    { kind: 'foot', shot: 'act_bonk', from: 1.8, d: 1.3, zoom: [1.7, 1.9], focus: g2n(178, 378) },
    { kind: 'foot', shot: 'bev_birds', from: 2.6, d: 1.3, zoom: [1.3, 1.45], focus: [.5, .45] },
    { kind: 'foot', shot: 'act_rocco', from: 1.8, d: 1.3, zoom: [1.7, 1.9], focus: g2n(178, 378) },
    { kind: 'foot', shot: 'banjo', from: 1.5, d: 1.3, zoom: [1.6, 1.8], focus: g2n(178, 378) },
    { kind: 'foot', shot: 'nan_crits', from: 1.8, d: 2.0, zoom: [1.2, 1.4], focus: g2n(185, 150), shake: 26 },
    { kind: 'card', bg: 'red', kick: 'the bosses', big: 'ARE WORSE', d: 1.3 },
    { kind: 'foot', shot: 'kevin_intro', from: 0.3, d: 1.6, zoom: [1.05, 1.2], focus: [.5, .38] },
    { kind: 'foot', shot: 'pants_crew', from: 3.7, d: 1.8, zoom: [1.7, 1.9], focus: g2n(200, 260) },
    { kind: 'foot', shot: 'alarm_raid', from: 0.4, d: 1.7, zoom: [1.1, 1.25], shake: 24 },
    { kind: 'foot', shot: 'wardrobe', from: 1.5, d: 1.5, zoom: [1.0, 1.05] },
    { kind: 'phone', shot: 'taster_build', from: 0.6, d: 3.4, bg: 'honey' },
    { kind: 'foot', shot: 'gary_sleep', from: 7.6, d: 2.0, zoom: [2.5, 2.6], focus: GARY },
  ],
  caps: [
    C(0, 'Gary’s *asleep*', { pos: 'top' }), C(1, 'monsters want\nhis *loot*', { pos: 'top' }),
    C(3, 'Dazza', { pos: 'top' }), C(4, 'Big Marg', { pos: 'top' }), C(5, 'Bev’s bin chickens', { pos: 'top' }), C(6, 'a wombat on fire', { pos: 'top' }), C(7, 'Banjo', { pos: 'top' }),
    C(8, 'and *NAN*', { pos: 'low', size: 140, sfx: 'crit' }),
    C(10, 'a rat. bit bigger.', { pos: 'low' }), C(11, 'a king who\nsteals *pants*', { pos: 'top' }), C(12, 'weekly *raid* bosses', { pos: 'top' }), C(13, 'pyjamas. obviously.', { pos: 'top' }),
    C(14, '*free.* one tap.', { pos: 'top' }), C(15, 'hold my loot.', { pos: 'top', size: 120 }),
  ],
  ctaSeg: 14, ctaOff: .4,
  music: [{ track: 'game', start: 0, end: 99, vol: .85 }],
  stings: [],
});

// ============ Meet the crew (13 x ~11 s) ============
const CREW = {
  chuck: { n: 'Dazza', role: 'THROWER', line: 'Righto. I’ve got this.', abil: 'THROW THE BIN', bg: 'honey' },
  bonk: { n: 'Big Marg', role: 'BOUNCER', line: 'You can’t park there, mate.', abil: 'CLOSING TIME', bg: 'red' },
  nan: { n: 'Nan Beryl', role: 'SNIPER', line: 'Finally. Someone competent.', abil: 'DISAPPOINTED', bg: 'purple' },
  sizzle: { n: 'Uncle Tony', role: 'SUPPORT', line: 'Onions go on top. Fight me.', abil: 'FREE SNAGS', bg: 'honey' },
  jezza: { n: 'Jezza', role: 'CROWD CONTROL', line: 'Waste of good whisky. Luckily it’s not good whisky.', abil: 'SHOUT A ROUND', bg: 'red' },
  bev: { n: 'Bev', role: 'SUMMONER', line: 'They’re not pests. They’re colleagues.', abil: 'FEEDING FRENZY', bg: 'sky' },
  dj: { n: 'DJ Brendo', role: 'ECONOMY', line: 'This one goes out to your bank account.', abil: 'HYPE TRAIN', bg: 'purple' },
  pete: { n: 'Long Peter', role: 'CONTROL', line: '*wags menacingly*', abil: 'MIND FETCH', bg: 'night' },
  banjo: { n: 'Banjo', role: 'CHAOS', line: 'Excellent choice. 🍌', abil: 'DANCE-OFF', bg: 'honey' },
  rocco: { n: 'Big Rocco', role: 'BRUISER', line: 'G’day. I’m a wombat. I’m also on fire.', abil: 'BIG STOMP', bg: 'red' },
  kev: { n: 'Big Kev', role: 'CHARGER', line: 'I’m a cassowary. I will kick you.', abil: 'STAMPEDE!', bg: 'sky' },
  gav: { n: 'Gav', role: 'TRADIE', line: 'Yeah nah, that’ll be a three-week job.', abil: 'KNOCK-OFF TIME', bg: 'honey' },
  val: { n: 'Aunty Val', role: 'PSYCHIC', line: 'I knew you’d pick me, love.', abil: 'SÉANCE', bg: 'night' },
};
const PAD = g2n(178, 378);
Object.keys(CREW).forEach((k, i) => {
  const c = CREW[k];
  EPISODES['crew_' + k] = build({
    id: 'crew-' + String(i + 1).padStart(2, '0') + '-' + k, title: 'Meet the crew: ' + c.n, cover: 3.2,
    segs: [
      { kind: 'foot', shot: 'act_' + k, from: 0.0, d: 1.9, zoom: [1.9, 2.1], focus: PAD },
      { kind: 'foot', shot: 'info_' + k, from: 0.1, d: 2.3, zoom: [1.0, 1.05], focus: [.5, .4], mute: true },
      { kind: 'foot', shot: 'act_' + k, from: 1.85, d: 2.8, zoom: [1.5, 1.8], focus: PAD, shake: 20 },
      { kind: 'card', bg: c.bg, kick: 'meet', big: c.n.toUpperCase(), bigSize: c.n.length > 8 ? 150 : 200, small: c.role, d: 1.7 },
      { kind: 'phone', shot: 'act_' + k, from: 3.2, d: 2.4, bg: c.bg, zoom: 1.3, focus: PAD },
    ],
    caps: [
      C(0, '“' + c.line + '”', { pos: 'top', size: c.line.length > 30 ? 72 : 88 }),
      C(2, '*' + c.abil + '*', { pos: 'top', size: 104 }),
    ],
    ctaSeg: 4, ctaOff: .3,
    music: [{ track: 'game', start: 0, end: 99, vol: .75, step: i * 16 }],
  });
});
