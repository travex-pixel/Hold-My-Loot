# Launch checklist

## Before you upload build 31

- [ ] `node tests/serve.mjs 8081 &` then `node tests/run-all.mjs`: every suite passes.
- [ ] Play the first minute yourself on a phone, as a new player (a private tab works).
- [ ] Upload `index.html`, `sw.js` and `privacy.html` to the repo's main branch (GitHub Pages serves them).
- [ ] On your phone, open holdmyloot.com twice. Menu, Settings should say "Version 31".

## Switches to flip (all off until you choose)

| Switch | Where | What it needs from you | Cost |
|---|---|---|---|
| Ko-fi support | `window.HML_SUPPORT` in `index.html` | Your Ko-fi page URL, and a thank-you word for supporters | Ko-fi says it takes no platform fee on one-off tips; PayPal or Stripe fees still apply. Check ko-fi.com |
| Supporter word | same, `codeHash` | Put the word in Ko-fi's thank-you message. Hash it with the command in the comment above `HML_SUPPORT` | free |
| Global leaderboard | `window.HML_BOARD` | A Supabase project, created with `supabase/README.md` (10 minutes) | free plan; Pro is US$25/month above roughly 25,000 weekly players |
| PostHog IP discarding | PostHog, Project settings, "Discard client IP data" | One click. The privacy page says the game asks PostHog not to profile players; this goes further | free |

PostHog volume: build 30 averaged about 58 events per player. Build 31 sends per-tap events only in a player's first
five games, so expect about 40. PostHog's free tier is 1 million events a month, about 25,000 players a month.
Above that it bills per event; set a billing limit in PostHog before a big push.

## Link previews (once the site is live)

- [ ] Paste https://holdmyloot.com into an X post draft, a Discord channel, iMessage and WhatsApp. Each should show the
  big preview image with "Hold My Loot: a free tower defence game in your browser". `tests/og.mjs` checks the
  tags in the repo; only the apps themselves can confirm the live result.
- [ ] If an app shows an old preview, its cache can take a day. Discord and X refresh when the URL changes:
  share `https://holdmyloot.com/?ref=x-trailer` instead.

## Portals

Listings, tags and descriptions are in `marketing/store.md`; screenshots in `marketing/store/`.

- [ ] **itch.io**: easiest first. Upload a zip of `index.html` + `manifest.json` + icons as an HTML game,
  "This file will be played in the browser", viewport 400x780 portrait (enable fullscreen button and mobile friendly).
- [ ] **CrazyGames**: apply as a developer, then submit a zip. Read their current requirements first: portals
  usually want their SDK for ads and game events. The game has no ads, so ask about a no-ads path before adding any.
- [ ] **Poki**: submit through their developer form. Same question about their SDK and ads.

Both portals show games in a landscape frame. On desktop the game is a centred portrait column, which looks sparse
there. A proper desktop frame (DESIGN.md section 11) is the most valuable next build before a portal push.

## Launch week

- [ ] Monday: post the trailer and episode 1 (copy in `marketing/posts.md`, order at the bottom).
- [ ] Post the Reddit launch post from `marketing/launch-posts.md` on a weekday morning US time.
- [ ] Every day: open the PostHog dashboard "Hold My Loot: launch". Watch the first-ten-minutes funnel by build,
  "Where levels are lost", and "New players by source".
- [ ] Reply to every comment for the first six hours of each post.
