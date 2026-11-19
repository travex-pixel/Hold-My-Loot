# Hold My Loot: launch and content strategy

Written 25 October 2026. One person, zero ad budget, a finished-enough browser game at holdmyloot.com, a global
leaderboard about to go live, no ads in the game, tips via Ko-fi. This is the plan I'd run.

## The one decision that matters more than any post

Do not post anything until the first ten minutes are fixed (audit items 1 to 8). Right now a stranger's first game
ends with "FIRST WIN!" over one star and four items left, or a loss if they tapped Nan. Marketing a leaky bucket just
buys you a day of traffic and a thread of "it's broken". The order is: fix the first ten minutes, ship build 31,
then start the content series. Content can be recorded against build 31 while the rest of the polish lands.

## Positioning

**One line:** A weird, funny Australian tower defence where your crew are idiots with dignity and Nan is a war crime.

**Who it is for, in order:**
1. People who already like tower defence and will try anything new on their phone for five minutes (Reddit
   r/TowerDefense, r/WebGames, r/incremental_games crossovers, Kingdom Rush and Bloons refugees).
2. Australians who will share it because the jokes are theirs (bin chickens, democracy sausage, "not happy, Jan").
3. People who like watching things get built (indie dev and "I made a game" audiences on X, YouTube Shorts, TikTok).

**What makes it shareable:** the jokes are specific, the moments are screenshot-able (Sir Pantsalot taking Gary's
pants, a rat wearing Gary's Sword, Nan's rainbow chain crits), and it opens in a tap with no install. Lead with the
moments, never with features.

**What to never do:** no "epic", no "addictive", no feature lists, no AI-generated art in any post. The game's hand-made
look is the whole brand; every post uses real game art and real gameplay.

## The honesty question: it was built with an AI

The game was written in a Claude chat across 30 builds and uploaded by hand. That is either your best hook or your
worst thread, depending on where you say it.

- On Reddit game communities (r/WebGames, r/TowerDefense, r/IndieGaming), "made with AI" in the title gets the post
  removed on some subs and brigaded on others. Lead with the game. If asked, answer plainly: one person, an AI pair
  programmer, hand-tuned over 30 builds, every joke yours. Do not hide it and do not headline it.
- On X, YouTube Shorts and TikTok, "I built a full game in one HTML file with an AI and here's what broke" is a proven
  format with a large audience that is curious rather than hostile. That is where the "How I built it" series lives.
- On r/ClaudeAI, r/vibecoding and similar, the build story is the entire post and will do well.

So: two tracks. The game track (moments, jokes, play now) on game communities. The maker track (how it was built) on
maker communities. They point at the same link with different ref codes so you can see which track brings players
who stay.

## Channels, ranked by expected players per hour of your effort

| Channel | Why | Format | Cadence |
|---|---|---|---|
| Reddit r/WebGames | Exactly the audience, allows self-promo, small but converts | One post, screenshots + link, reply to every comment for 48 h | Launch day, then once per major build |
| Reddit r/TowerDefense | Bigger, picky, loves depth: lead with crew synergies and the Long Nap | Post with a 30 s clip | Launch week |
| Reddit r/australia, r/melbourne etc. | The jokes land here and they share | Screenshot of a Pantsalot moment, "made a game, it has bin chickens" | Once, carefully, as a "made a thing" post |
| X | Maker audience, clips travel, replies compound | 15 to 30 s vertical clips, one joke each | 3 a week for 6 weeks |
| YouTube Shorts / TikTok | Same clips, far larger reach, slow burn | Same clips, captions burned in | Same clips reposted |
| CrazyGames listing | Free distribution to people who already play browser games; no ads needed to be listed | Store page with 5 screenshots and a 30 s video | Submit in launch week |
| itch.io | Indie credibility, press and streamers browse it, free | Page with GIFs and devlog posts | Launch week, devlogs monthly |
| Discord/Slack of mates | First 50 players and your bug reporters | A link | Day zero |

Poki: submit, but expect the alcohol jokes to be a no. Do not change the jokes for Poki.

## Measurement

Every link carries a ref code; PostHog already records it as `src` on every event and remembers the first one as
`first_src`. The questions each week are only four:

1. How many first visits per ref code.
2. What share finished the taster (tutorial_start to first level_complete).
3. What share came back on day 2 and day 7 (return_session with day_number).
4. How many shares were tapped and how many visits came from `?ref=share`.

Ref codes to use: `reddit-webgames`, `reddit-td`, `reddit-aus`, `x-build`, `x-crew`, `shorts`, `tiktok`,
`crazygames`, `itch`, `mates`, `share` (already used by the in-game share button), `homescreen` (already used).

Targets that mean it is working: 40% of first visits win the taster, 20% come back the next day, 5% tap share. If
taster completion is under 30%, stop posting and fix the game again.

## Series A: "How I built Hold My Loot" (the maker track)

Ten episodes, 20 to 45 seconds each, vertical, captions burned in, no voice needed. Each one is a true story from the
changelog with real footage. The format is the same every time: a hook card (3 s), the problem (10 s), the thing on
screen (15 s), the lesson (5 s), "play it free, link in bio" (3 s). Post one every two to three days, in this order.

| # | Title (hook card) | The true story | What's on screen |
|---|---|---|---|
| 1 | I built a whole tower defence game in one HTML file | 690 KB, no build tools, no engine, every character drawn with canvas code, 30 builds uploaded by hand to GitHub Pages | Scroll through the file at speed, then the game running on a phone |
| 2 | Gary never wakes up | The design rule: Gary mutters, rolls over, loses his pants, never fights. Why a hero who does nothing is funnier than one who does | Gary sleep-talk lines appearing one by one, then Pantsalot taking his pants |
| 3 | I nerfed Nan and a real player made me put her back | Build 17 trimmed Nan to make a spreadsheet tidy, build 18 restored her. "Nan is meant to be overpowered" is now a written rule | Nan's rainbow chain crits deleting a wave; the DESIGN.md line on screen |
| 4 | Big Marg couldn't reach the road from 102 of 428 pallets | Build 19: a frying pan with a 60 range and pallets 65 away. Nobody noticed for 18 builds. The fix was +12 range and greying out crew who are too far | A silent Marg next to the road, then the build menu showing "TOO FAR FROM THE ROAD" |
| 5 | The soundtrack is 400 lines of code and zero audio files | Build 13: a tavern jig, a battle theme and Banjo's kazoo sting, all synthesised with Web Audio. No licences, no downloads | The music code scrolling with the game audio playing; Banjo's sting |
| 6 | Sir Pantsalot didn't take pants for 20 builds | The boss was called Pantsalot from build 3; he only started stealing pants in build 24. Crew in heart-print boxers shouting "I've got work tomorrow!" | The depants moment and the boxers |
| 7 | Android phones were erasing my background | Build 27: some Androids drop canvas memory under pressure, the map vanished and everything smeared. Now the game checks three pixels every second and rebuilds it | Before/after smear (recreate it), then the check code |
| 8 | Your save has three copies and a code | Build 14: main save, last-good, best-ever, a self-test, and a save code you can paste on another phone. Why a browser game needs more care than a native one | Reset, paste code, progress back |
| 9 | I run 300 bots through every level before I touch the balance | The headless harness: win rates per level with and without Nan, the Laneways turning out to be a wall, what got changed and what didn't | The terminal table, then the level that changed |
| 10 | 30 builds, one file, here's everything that broke | A fast montage of the changelog's "Fixed:" lines, ending on the launch build number | The changelog, the version number in Settings, the play button |

Episode 1 and episode 3 are the ones to test first. If episode 3 outperforms (people love a "we listened" story),
make the next series about player feedback.

### Episode 1, ready to post

**Clip:** 0 to 3 s hook card "I built a whole tower defence game in one HTML file." 3 to 13 s: the file scrolling at
speed with a counter (lines, characters, bosses) ticking up. 13 to 28 s: phone footage, the taster from the first tap
to Kevin going down. 28 to 33 s: "30 builds. No engine. No install. Play it free: holdmyloot.com".

**X caption:** One HTML file. 13 crew, 28 levels, 19 bosses, a synthesised soundtrack, and a Nan who is a war crime.
No engine, no install, free in your browser. holdmyloot.com/?ref=x-build

**Shorts/TikTok caption:** I built a whole tower defence game in one HTML file and uploaded it by hand 30 times.
Gary's asleep, monsters want his loot, bin chickens are colleagues. Free, link in bio. #indiegame #towerdefense
#webgame #gamedev

## Series B: "Meet the crew" (the game track)

Thirteen 12 to 15 second clips, one crew member each, their intro line on screen, their best move, their worst idea.
These are the ones to run on r/australia and in the group chat, because every clip is a joke that stands on its own.

Order: Nan ("Finally. Someone competent."), Jezza ("Waste of good whisky. Luckily it's not good whisky."), Bev
("They're not pests. They're colleagues."), Uncle Tony ("Onions go on top. Fight me."), Big Rocco ("G'day. I'm a
wombat. I'm also on fire."), Big Marg ("You can't park there, mate."), Banjo, Long Peter, DJ Brendo, Big Kev, Gav,
Aunty Val, Dazza last ("Righto. I've got this.").

Caption pattern: the quote, nothing else, then the link. The quote is the hook.

## Series C: "Actual things that happened"

The in-game share cards already print "ACTUAL THING THAT HAPPENED: Sir Pantsalot stole Gary's pants" on the image.
Repost the best of your own, then players'. This series writes itself once players exist, and it is the one that
feeds the leaderboard: "someone survived 53 waves of the Long Nap with no Nan. Prove it."

## Launch week, day by day

This assumes build 31 is live and the first ten minutes pass the audit.

- **Day 0 (Monday, Raid resets Monday):** share with mates on the `mates` link. Watch PostHog for client_error and
  the taster funnel for 24 hours. Fix anything red, ship 32 if needed.
- **Day 1:** r/WebGames post (game track). Reply to every comment within the hour for the first six hours. Series A
  episode 1 on X and Shorts.
- **Day 2:** itch.io page live with 4 GIFs and the launch devlog ("30 builds in one file"). CrazyGames submission.
- **Day 3:** r/TowerDefense post, lead with crew synergies and the weekly Long Nap. Series B: Nan.
- **Day 4:** Series A episode 3 (the Nan revert). It will bring maker traffic; make sure the taster holds.
- **Day 5:** r/australia or a state sub, Pantsalot screenshot, "made a game, it has bin chickens". Series B: Bev.
- **Day 6 to 7:** nothing new. Read the data. Write the week-one report from the four questions above.
- **Week 2 onward:** two Series A and one Series B per week, plus a Raid result each Monday ("this week's boss is The
  Landlord"). Monthly itch devlog.

## Posts, drafted

**r/WebGames (title):** Hold My Loot: a weird Australian tower defence in one HTML file. Gary's asleep, monsters want
his loot, your crew are idiots with dignity. Free, no install.

**r/WebGames (body):** One person, 30 builds, no engine. 13 crew with hidden synergies, 28 levels, 19 bosses, a weekly
Long Nap leaderboard and a weekly Raid boss. Sir Pantsalot steals your crew's pants. Nan is overpowered on purpose and
I was told to leave her alone. Plays in the browser on a phone in one tap: holdmyloot.com/?ref=reddit-webgames.
Happy to answer anything about how it's made.

**r/incremental_games:** I'd skip it. It is not an incremental and that sub is strict about it. r/TowerDefense and
r/IndieGaming are the right second and third posts.

**X launch post:** Gary's asleep. Monsters want his loot. A crew of Australian misfits are all that stands between a
rat and his sword. Free tower defence in your browser, no install, one file. holdmyloot.com/?ref=x-crew (clip: 20 s
of Pantsalot and Nan.)

## What I can make for this, from here

- 1080x1920 gameplay recordings of any scripted moment (Pantsalot, Nan crits, bin chickens, the taster), cut with
  title cards into MP4 and WebM, captions burned in. No voice-over. Music is the game's own synthesised tracks or none.
- An "interactive phone": a landing page with a phone frame around the live game, for the Reddit post and your
  link-in-bio. Also usable as the CrazyGames preview.
- Five store screenshots per platform at their required sizes, and a 30 s trailer for CrazyGames and itch.
- GIFs for itch and Reddit (under 8 MB each).
- The week-one PostHog report, written from the four questions.

What only you can do: post, reply in the first six hours, and record a 20 second phone-in-hand clip if you ever want a
human in frame (optional, and it does better than screen capture on TikTok).

## Monetisation, in this order

1. Now: Ko-fi link and supporter code in the config. The home-screen supporter card already waits for 5 wins and 3
   sessions and never shows after a loss. Expect single-digit tips per thousand players; it costs nothing.
2. After the first month, if daily players are over a few hundred: Stripe Payment Link for a Supporter pack (same
   pyjamas plus a second exclusive outfit), with a small Supabase function to confirm payments and hand out codes.
3. Ads only if a portal listing is bringing most players and you want it to pay for itself. The game is designed to
   work without them and should stay that way for the first version.

## Risks

- The first ten minutes. Already covered. Fix before any post.
- The AI-built angle on hostile subs. Covered by the two-track rule.
- Alcohol jokes and Poki. Accept the rejection.
- A viral spike before the leaderboard validation is in. Ship the Edge Function before the Reddit posts, not after.
- You, replying to comments at 2 am. Post at 8 am your time on a weekday so the first six hours are awake hours.
