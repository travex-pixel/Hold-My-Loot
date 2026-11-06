# Hold My Loot videos

Every video is made from the real game: real footage of `index.html`, the game's own synthesised music and sound
effects, and the game's fonts and palette. Nothing is stock, nothing is AI-generated art. Output is MP4 only
(H.264 + AAC, 1080x1920, 30 fps, loudness about -14 LUFS for social).

## The videos

| File | What it is | Length |
|---|---|---|
| `ep01-one-file.mp4` | How I built it 1: a whole game in one file | 26 s |
| `ep02-gary-never-wakes-up.mp4` | 2: the hero is asleep on purpose | 23 s |
| `ep03-i-nerfed-nan.mp4` | 3: I nerfed Nan, a real player loved her, she came back | 22 s |
| `ep04-marg-couldnt-reach.mp4` | 4: 102 of 428 pallets were out of Big Marg's reach | 17 s |
| `ep05-soundtrack-is-code.mp4` | 5: zero audio files, the music is code | 21 s |
| `ep06-pantsalot.mp4` | 6: Sir Pantsalot took zero pants for 20 builds | 19 s |
| `ep07-android-ate-the-map.mp4` | 7: Android phones dropping the map (bug recreated, labelled) | 17 s |
| `ep08-three-copies.mp4` | 8: every save has three copies | 17 s |
| `ep09-bots-played-my-game.mp4` | 9: 8,400 bot games found the one broken level (The Laneways, 40% to 92%) | 23 s |
| `ep10-everything-that-broke.mp4` | 10: 30 builds, everything that broke, all fixed in build 31. Post after build 31 is live | 20 s |
| `trailer-launch.mp4` | Launch trailer | 27 s |
| `crew-01-chuck.mp4` ... `crew-13-val.mp4` | Meet the crew, one per character | 11 s each |

Posting copy for each one is in `../posts.md`.

## The retention rules every video follows

These are the principles MrBeast's team writes about, applied to a 20-second Short with no voice-over:

1. **Frame one is the best picture in the video, with the claim on it.** No logo, no intro, no "hey guys".
2. **Show the promise immediately.** The title says "one file", so the file is on screen by second two.
3. **A number or a stake in the first five seconds** (6,834 lines, 102 of 428 pallets, 0 audio files), then escalate:
   every beat is bigger or weirder than the one before.
4. **A cut every 1.5 to 2.5 seconds**, each with a punch-in zoom and a whoosh. Nothing stays on screen once it has
   made its point.
5. **One open question early, paid off at the end** ("I nerfed her" ... "a real player loved her" ... "Nan Eternal").
6. **Big, simple captions** that carry the story without sound: 2 to 5 words, one idea, key word in colour.
7. **No outro.** The last line leads straight back into the first, so the Short loops and rewatches count.
8. **Honesty is part of the brand.** Recreated bugs are labelled RECREATED on screen. Every claim is true and comes
   from the changelog or the code.

What the videos don't have, and you can add: a voice-over and a face. Both lift retention on TikTok and Shorts. If you
record a voice-over, read the captions as written, one beat per cut, and drop it over the MP4 in any editor; the game
audio is mixed low enough to sit under a voice.

## Rebuilding

Needs Node 22, Playwright's Chromium and ffmpeg (all in this repo's cloud environment).

```
node tests/serve.mjs 8081 &                # serve the repo like GitHub Pages
node marketing/video/shots.mjs             # capture the shot library into marketing/video/work/shots (a few minutes)
node marketing/video/build.mjs all         # render every video into marketing/video/out
node marketing/video/build.mjs ep03 crew   # or just some
```

- `shots.mjs` scripts each moment in the real game and captures it frame by frame on a fake clock, so the footage
  never stutters. It also logs every sound the game asks for, with its exact time.
- `lib/audio.mjs` takes the sound engine straight out of `index.html` and renders music, stings and those logged
  sounds offline, in sync with the footage.
- `stage.html` draws any frame of any video (captions, cards, code, before/after splits, red circles);
  `lib/compose.mjs` pipes every frame into ffmpeg.
- `episodes.mjs` is every video as data. Change a caption or a cut there and re-run `build.mjs`.

`work/` and `out/` are not committed (footage is several GB). Re-run the two commands to get them back.
