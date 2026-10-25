# Hold My Loot — changelog

Build numbers match `<meta name="hml-build">` and `window.HML_BUILD`. The game auto-updates
players to the newest build on load and when the tab regains focus.

## Build 1-4 (prototype)
- Core loop: single-file canvas tower defence. Gary asleep on his loot pile; monsters walk the road,
  grab loot, wear it. Tap or swipe loot to snatch it back; otherwise it auto-collects.
- 5 maps, 4 crew: Dazza (The Chuckery), Big Marg (Bonk Booth), Nan Beryl (Nan's Porch),
  Uncle Tony (Sausage Sizzle). Three upgrade tiers.
- Loot rarities Junk / Alright / Decent / Mint / Grouse, stash, combos, wave bonuses, bonus-card
  draft after each wave, Gary's pile as the health bar.
- Deterministic sim (fixed step, seeded RNG) separate from renderer; headless balance bots.

## Build 5
- Bev and the bin chickens (ibises, pigeons at tier 2).
- Synthesised sound effects (Web Audio, no files), rainbow crits, damage numbers, confetti.

## Build 6
- Tier 4 ULTIMATE for every crew member (skill level 5). Uncle Tony's global Sizzle buff.
- Pad mistap fixes.

## Build 7
- Gary's Dreams (player ultimate, 5 dreams x 5 levels, Dream Shards), tower abilities with
  cooldowns, 8 synergies and a codex, 3 new maps, new enemies, random events (merchant, treasure
  goblin, blood moon, casserole, double rainbow), modifiers, Gary level with unlocks, trinket slots,
  banners, landscape layout.

## Build 8
- Self-updating: fetches its own index.html, reads the build number, reloads to ?v=N.
- "What's new" changelog card.

## Build 9
- DJ Brendo's Doof Ute (economy and aura buff). Tier 5 ELITE for every crew (skill level 8):
  golden stage, cape, crown, transformation effects.

## Build 10
- Long Peter (telekinesis: lift, hold, slam, yeet). Big Barry the Barramundi.

## Build 11
- Chapter 2, The Road Trip: 10 maps with auto-generated pallet layouts, multi-boss finals.

## Build 12
- Chapter 3, Out of Bounds: 10 maps with mechanics (magnet, blackout, conveyor belts, ice, gusts,
  sinkholes, trampolines, sprinklers, swing bridge, Eclipse finale), 10 summoner bosses and their
  minions, Banjo the Banana (7 gestures then Banana Split), bonus build spots and the Extra Pallets
  shed upgrade.

## Build 13
- Medieval tavern soundtrack, fully synthesised: menu jig, gameplay tune, boss theme, victory
  fanfare, defeat sting, Banjo's kazoo sting. Separate music and SFX volumes, crossfades, ducking,
  pauses when backgrounded, catch-up protection, mobile unlock.

## Build 14
- Bulletproof saves: main save + last-good backup + best-ever backup, automatic recovery, unreadable
  saves set aside instead of overwritten, storage self-test, warnings for in-app browsers and blocked
  storage, deliberate reset and save-code load replace the backups, navigator.storage.persist().

## Build 15
- Crew screen: tap to meet each character (portrait, reaction, sound, quip), pick up to 6 or use a
  per-level Recommended crew; locked crew as silhouettes.
- Portrait build menu (6 cards, no scrolling).
- Learn-by-doing coach marks for Level 1 (TAP HERE -> pick -> hire -> START -> loot -> upgrade ->
  dream), beginner's grace in a first run, locked pallets hidden for the first runs.
- New results screen (LEVEL COMPLETE, stars, loot, rewards, NEXT LEVEL, details folded) and
  defeat screen (SO CLOSE, wave, one diagnosis, one tip, Change crew).
- First-win moment, returning-player NEXT LEVEL button on the home screen.
- Speech bubbles above crew, Gary's sleep-talk.
- PostHog analytics through one fail-silent trackEvent (key configured in build 20).

## Build 16
- "Up next" goals on the home screen (next crew, next Gary unlock, next shed upgrade).
- Crew unlock reveal screen; aspiration teases on level and defeat screens ("Win this and JEZZA
  joins"); boss drop teases; level-card "NEW:" chips; mastery goals on beaten levels.
- Synergy chips in the crew picker. Today's Nap card with rules, rewards and streak (daily streak
  bonus rocks). PNG share cards built from game art. Gary's pyjamas as earnable cosmetics.
- Supporter-tip path built and switched off (link + code). Boss-death slow motion.
- Day-number and session-count analytics.

## Build 17
- Human-style balance pass: first-run grace extended through Level 1; guaranteed early drop and
  longer loot window in a first run; wave-clear gold pops; optional speed hint.
- Nan trimmed and Dazza buffed (reverted for Nan in 18). The Beer Garden softened.
- New loss diagnoses: ran out of damage late, everything in one corner.
- Up next moved under NEXT LEVEL; Shed button red dot; unlock cards say the new crew is in your next
  crew; Gary mutters after boss kills; perfect-wave gloats.
- Home-screen supporter card (5 wins, 3 sessions, never after a loss, dismissible) when configured.

## Build 18
- Chapters 2 and 3 retuned for humans: chapter HP multipliers cut, flank entrances open from wave 3,
  Chapter 3 wave-6 spike trimmed, six levels adjusted. Nan restored to full power.
- Bev's bin-chicken lines. Repeated-loss escalation (same reason three times -> blunt hint,
  Change crew becomes primary). level_fail carries the diagnosed reason; chapter and nan_in_crew
  properties.

## Build 19
- Big Marg's reach raised from 60 to 72 (she could not reach the road from 102 of 428 pallets); the
  build menu greys out crew who are too far from the road.
- Australian quips (VB longneck, "You can't park there, mate", "Nek minnit", "Not happy, Jan").

## Build 20
- PostHog project key connected (US). Build bumped so cached copies start reporting.

## Build 21
- Self-healing renderer (a thrown frame resets canvas state instead of corrupting the screen),
  protected game loop, rate-limited client_error reporting, canvas memory released when menus close,
  roundRect fallback for older iPhones.

## Build 22
- Picture-first crew cards (per-character colour, spotlight, name banner, icon chips) in the crew
  screen, build menu, info card and reveal.
- First draft skipped for a new player's first two waves; first draft explained; cards show the
  crew they help; shorter tap-protection with early taps remembered.
- Louder first-pallet hint after 7s. ?ref= source tracking. Open Graph / Twitter preview tags,
  favicon.

## Build 23
- One-tap start: first visitors land straight in Level 1, wave 1 starts after the first crew member.
- Add to Home Screen card after the first win (manifest + icons), Tell the dev (emoji rating + text
  to PostHog), Brag to a mate at big moments with ?ref=share, wave_complete event, storage warning
  only after a wave if saving fails.
- Fixed: a win that unlocked crew paid out twice (double rocks, XP, loot and win count).

## Build 24
- Sir Pantsalot takes pants: crew every ~9s (boxers, embarrassed, +1 armour per pair), Gary's if he
  gets close; Long Peter wasn't wearing any. pants_stolen analytics.

## Build 25
- First 60 seconds: Dazza pre-placed, shorter first level (5 waves), big tap area with a tapping
  hand, welcome banner. Daily gift from Gary and the Tomorrow preview. Funny-moment share cards
  (heists, pants) including on losses.
- Weekly Long Nap: same waves for everyone per map, exponential difficulty, personal weekly bests,
  global leaderboard client (Supabase, switched off), nickname prompt.

## Build 26
- The Wardrobe: 16 pyjama sets for Gary and ~20 crew outfits, Common to Legendary, with animated
  legendaries (Molten Nap, Molten Marg's lava cape, Molten Core Rocco, Dreamweaver, Nan of the
  Nebula), live previews, two-tap purchase, Up next suggests affordable outfits.
- Trinket stars ★1-★5 using spare copies plus rocks (up to 2x effect, slots unchanged).
- Big Rocco, the Lava Wombat (lava lob / wombat stomp, Eruption, Big Stomp, weak to flyers).
- Crew-screen PLAY button pinned at the bottom.

## Build 27
- Smeary-screen fix: the frame is wiped every draw, the background layer is checked and rebuilt if
  the browser drops it (Android memory pressure), context-loss listeners, bg_lost reporting.

## Build 28
- Heat (+8% monsters, +12% rewards per level, win +1 / loss -1, after 5 wins).
- Hard and Nightmare tiers with separate stars and Nightmare-only legendary outfits.
- Monster traits: Speedy, Armoured, Splitter, Healer, shown in the wave preview.
- 3x speed and auto-start next wave for veterans. Smooth mode (manual and automatic), cached shading
  gradients (65-75% fewer gradient creations per frame), background check interval tuned.

## Build 29
- Weekly Raid Boss (Landlord / Council Ranger / Alarm Clock): 3-minute damage race, phases,
  mechanics, Bronze/Silver/Gold medals, weekly best, leaderboard hook.
- Mastery Paths for all 13 crew (choose at skill level 6, switch between levels).
- Three new crew: Big Kev the Cassowary, Gav the Tradie, Aunty Val the Psychic (curses, card
  rerolls).
- Empty pallets baked into the background; staged automatic quality (smooth mode -> lower
  resolution -> 30 fps drawing); renderer-error check added to the release process.
- Fixed before release: Gav and Val blanked the screen (hair passed as a colour instead of a
  drawing function); raids stopped their clock when the boss was alone; a startup variable
  declared after first use; slow-frame detection ignored very slow frames.

## Build 30
- A brand-new player's first game is a 3-wave taster (two warm-ups, then Kevin with a smaller
  escort) at 2x speed with auto-starting waves and progress banners; about a minute to a first win.
  Coach-only, average and slow players all win in testing. Speed resets after the taster.
- "boss next!" on the wave counter before every final wave.

## Build 31 (in progress, unreleased)
- Desktop frame: wordmark, how to play, animated crew, keyboard shortcuts (Space, 1/2/3, Esc, M),
  QR code to the phone version, pointer cursor over pallets and loot, CLICK wording on a mouse.
- Coach arrow waits for the welcome banner.
- Lazy pallet layout: game-logic startup 1,781 ms -> 10 ms; throttled phone 4.3 s -> 1.2 s to
  playable; remaining maps pre-computed in idle time. Instant CSS splash screen.
