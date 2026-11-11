# Hold My Loot

Gary's asleep. Monsters want his loot. A crew of Australian misfits is all that stands between a rat and his sword.
A free tower defence game for phones and browsers: **[holdmyloot.com](https://holdmyloot.com/)**.

## What's here

| Path | What it is |
|---|---|
| `index.html` | The whole game: simulation, renderer, sound engine and UI in one file, on purpose. |
| `sw.js` | Service worker: offline play and a self-update that still reaches installed copies. |
| `privacy.html` | The privacy page linked from the consent card and Settings. |
| `manifest.json`, `icon-*.png`, `preview.jpg` | Install metadata, icons, link-preview image. |
| `DESIGN.md` | Intent, rules and history. Read it before changing anything. |
| `CHANGELOG.md` | What each build changed. |
| `LAUNCH.md` | The launch checklist and the switches to flip. |
| `supabase/` | The global leaderboard's server rules (SQL) and setup guide with costs. |
| `tools/` | `build-portal.mjs` makes a portal zip from index.html; `covers.mjs` draws portal covers with the game's renderer. |
| `tests/` | Every automated check. They load `index.html` as it is. |
| `review/` | The audit, balance report, Lighthouse and performance results, before and after. |
| `marketing/` | Strategy, posting copy, store listings, screenshots, and the video pipeline. |

## House rules

- One file. No bundler, no `src/` split.
- Every release bumps `<meta name="hml-build">` and `window.HML_BUILD` together, with a CHANGELOG entry and a line in
  the in-game "What's new" list. Installed copies only update when the number goes up.
- Nan is overpowered on purpose. Balance work tunes levels around her, never her.
- No backend beyond Supabase. Flag any cost before switching something on.

## Running it locally

```
node tests/serve.mjs 8081          # serves the repo like GitHub Pages (gzip, max-age=600)
open http://127.0.0.1:8081/
```

## Tests

Needs Node 22 and Playwright's Chromium (both in this repo's cloud environment).

```
node tests/serve.mjs 8081 &
node tests/run-all.mjs              # every suite in order; --skip-perf for the quick run
node tests/balance-matrix.mjs       # the full balance report (about 45 minutes): review/balance.md
```

| Suite | Checks |
|---|---|
| `syntax`, `smoke-sim` | every script block parses; the simulation runs headless |
| `taster-sim` | a brand-new player's first game can't really be lost |
| `first-minute` | the coached first minute in a real browser, iPhone SE and iPhone 15 |
| `saves` | build 29 and 30 saves upgrade, damaged saves recover, full disk, blocked storage |
| `offline` | service worker: offline launch, new builds reach installed copies, slow networks |
| `consent`, `support`, `share`, `og` | play-stats consent, Ko-fi unlock, share cards, link previews |
| `board-client`, `leaderboard-sql` | the leaderboard, in the game (mocked) and on a real Postgres |
| `polish`, `bugbash` | 200% zoom, wide screens and portal sizes, keys, mute; double taps, multitouch, rotation, old WebViews, random taps |
| `portal` | the CrazyGames build in a cross-origin iframe, outside requests blocked: no links out, fonts bundled, first game winnable |
| `perf-startup`, `perf-play` | time to playable on a throttled Android, frame budget, memory, layout shift |
| `balance`, `balance-matrix` | bot win rates per level, crew, difficulty and modifier |
