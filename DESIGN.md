# Hold My Loot — design document

Written 25 October 2026 against build 30 (the live build). Build 31 is in progress; see the end.
Everything ships as one file: `index.html` (sim, renderer, audio, UI, all inline). Other files in the
repo are assets only: `preview.jpg` (link preview), `manifest.json`, `icon-192.png`, `icon-512.png`, `CNAME`.
Hosting is GitHub Pages at holdmyloot.com. The game self-updates: it fetches its own `index.html`,
reads `<meta name="hml-build">`, and reloads to `?v=N` when a newer build is live. Bump the build number
on every release or cached phones never pick it up.

## 1. What the game is

Gary, the realm's last licensed hero, has gone AFK on a monster-infested road. Monsters want his loot
pile. The player builds towers crewed by ridiculous townsfolk, keeps the pile, taps loot off the road,
and unlocks crew, outfits and upgrades between levels. Mobile first, portrait, one thumb.

Core loop: Level -> waves -> bonus card -> boss -> results -> NEXT LEVEL. Meta loop: rocks, shards,
loot, Odd Jobs, Clive's Shed, Gary level, crew unlocks, Wardrobe, Mastery Paths, Heat.

## 2. Tone rules

- Australian, cheeky, short. A joke is one line. If it needs a second line it is cut.
- The humour is specific and absurd, never generic banter. No Marvel quips. No "epic fail".
- Characters are idiots with dignity. We laugh with the crew, never at the player.
- Losing is never a punishment. Headlines are SO CLOSE / NOT HAPPY, JAN / YEAH, NAH. Every loss
  screen says why and what to try.
- Gary never wakes up. He mutters, rolls over, loses his pants. He does not fight.
- Nan is absurdly overpowered on purpose. A real player loved this. Do not flatten her into an
  average character to make a spreadsheet tidy (we tried in build 17 and reverted in build 18).
- Bin chickens are a feature, not a bug. Keep them weird.
- No dark patterns, ever: no energy, no fake timers, no forced ads, no pay-to-win, no loss aversion
  tricks. Daily streaks only add; missing a day costs nothing.
- Analytics are anonymous. Never log names, emails, locations, free text other than the opt-in
  "Tell the dev" box (which is labelled anonymous).
- Visual style: warm paper UI, hand-drawn canvas characters, Fraunces for titles, Nunito for text.
  Keep it. "Improve the look, don't replace it."

## 3. Jokes that are off-limits to change

These are load-bearing. Rewording them is fine only if the joke survives intact.

- Gary's "BRB" sign and his sleep-talk: "zzz... guard me loot...", "...did I miss anything?",
  "...why is it breezy..." (after Sir Pantsalot takes his pants), "zzz... no officer, I live here...",
  "zzz... tell 'em they're dreamin'...".
- Kevin's intro: "KEVIN. It's just a rat. Bit bigger. Don't make it weird."
- Sir Pantsalot takes pants. Crew end up in heart-print boxers shouting "OI! MY PANTS!",
  "Not the good trackies!", "I've got work tomorrow!". Long Peter: "...he wasn't wearing any." /
  "Awkward." Gary can lose his too.
- Bev and the bin chickens: "They're not pests. They're colleagues." / "No fish sauce. I mean it." /
  "That one's Kevin. Different Kevin." / "Bin night, boys." The fish-sauce gag stays.
- Nan: "Finally. Someone competent." / "Hmph. Fine." / share-card line "Nan fixes most things." /
  defeat hint "Or bring Nan. Nan fixes most things."
- Jezza: "Waste of good whisky. Luckily it's not good whisky." / "VB longneck. 8am. Breakfast."
- Big Marg: "You can't park there, mate."
- Uncle Tony: "Onions go on top. Fight me." / "Democracy sausage, coming up."
- Banjo: "Excellent choice. 🍌" / "Peel yourself together."
- Big Rocco: "G'day. I'm a wombat. I'm also on fire." / lava cubes (wombats do cubes).
- Loot heists: "Nek minnit. Rat grabbed Gary's Sword and is using it."
- Perfect-wave gloats: "How good is that." / "Yeah the boys." / "Smoko?"
- Boss names: The Stack (twenty goblins in a trenchcoat), Chrisso Who Has Never Been Tipsy,
  Middle Manager Mortimer ("Just circling back on your survival"), Steve Who Is Not AFK,
  Big Barry the Barramundi (escaped from an esky), Dame Doris Bowls President, The Night Manager,
  Gary's Alarm Clock ("the final boss of sleep"), The Council Ranger ("You can't park there.
  Or there. Or anywhere."), The Landlord ("Rent is due. Rent is always due.").
- Item names: Thong of Mild Speed, Ring of Mild Inconvenience, Skeleton Without Pants / With Pants,
  Unpaid Goblin Intern, Seagull Chip-Motivated, Crab in a Bucket, Steve's Participation Medal,
  The King's Missing Pants.
- Daily gift lines: "It was in his other pants." / "Don't ask where it's been."

## 4. Crew (towers)

Costs are build cost then upgrade costs per tier. Tier 4 = ULTIMATE (needs skill level 5),
tier 5 = ELITE (needs skill level 8). Each crew member has a skill that levels with use;
skill level 6 unlocks a Mastery Path (1,590 XP), level 10 is 6,080 XP. Crew limit per level: 6.

| id | Crew | Role | Unlock | Build | Upgrades (T2..T5) | Base numbers | Ability (cd) |
|---|---|---|---|---|---|---|---|
| chuck | Dazza, The Chuckery | Thrower, splash, hits flyers | start | 50 | 60/95/220/420 | dmg 8-16, rate 1.1/s, range 90; splash 34 from T3; T4 tub every 4s; T5 throws 3 | Throw the Bin (28s): big splash + stun |
| bonk | Big Marg, Bonk Booth | Melee bouncer, stun | start | 60 | 60/100/210/400 | dmg 15, rate 0.9, range 72, stun 0.5s; multi-hit T3; slam every 5s T4 | Closing Time (26s): shove back + stun |
| nan | Nan Beryl, Nan's Porch | Sniper, crits, anti-armour | start | 85 | 80/125/240/450 | dmg 30, rate 0.5, range 125, crit 40% (x3); pierce T3; chain 3 T4, 5 T5 | Disappointed (30s): 5s of triple fire rate, all crits |
| sizzle | Uncle Tony, Sausage Sizzle | Support: global speed buff + slow aura | start | 70 | 70/110/200/380 | aura 75, buff +8% all towers, slow 25%; queue T3; snag rain T4 | Free Snags (30s): monsters queue 3s |
| jezza | Jezza's Top Shelf | Crowd control, tipsy puddles | 1 win | 80 | 70/115/220/420 | rate 0.55, range 95, puddle r24 life 3s, tipsy 2.5s, dmg 8; fire-able T3; vulnerable 45% T4 | Shout a Round (28s): all in range tipsy 6s |
| bev | Bev's Bin Chickens | Summoner, anti-air | 2 wins | 70 | 70/110/220/420 | ibis every 3.2s, max 2, dmg 6.5; pigeons T2; bin day T3; pigeon storm T4 | Feeding Frenzy (30s): six birds |
| dj | DJ Brendo's Doof Ute | Economy + aura buff | 3 wins | 90 | 80/120/230/420 | aura 80, +10% range/speed to crew in aura, tips 30 gold per wave; bass drop T4; +10% global T5 | Hype Train (32s): all towers +50% rate 6s |
| pete | Long Peter | Control: lift and slam | 4 wins | 85 | 80/120/240/440 | range 100, lift every 2.4s, dmg 28 aoe 22; 2 lifts + yeet T3; mass levitation T4 | Mind Fetch (32s): strongest monster yeeted to start |
| banjo | Banjo the Banana | Chaos melee, 7 gestures then Banana Split | 5 wins | 80 | 75/115/230/430 | range 72, rate 1.25, dmg 16; peels T4; double T5 | Dance-Off (30s): nearby monsters watch 3s |
| rocco | Big Rocco, the Lava Wombat | Bruiser: stomp crowds, lob lava | 7 wins | 95 | 85/130/250/460 | range 96, rate 0.55, dmg 34, stomp r52 stun 0.45; lava burns T3; Eruption every 9s T4 (6s T5). Cannot hit flyers | Big Stomp (30s): 3x dmg, long stun, r150 |
| kev | Big Kev the Cassowary | Charger: line damage, knockback | 12 wins | 100 | 90/140/260/480 | range 100, rate 0.45, dmg 40, line width 15; knock 14 T3; Stampede every 10s T4. Cannot hit flyers | Stampede! (30s): flatten, knock back, stun r190 |
| gav | Gav the Tradie | Road spikes, barricades | 15 wins | 85 | 80/125/240/450 | range 96, strip every 2.9s, 6 hits x 18 dmg, max 3 strips; barricade every 8s T3; Roadworks every 12s T4 | Knock-Off Time (35s): all monsters stop 2s |
| val | Aunty Val the Psychic | Curses (+damage taken), card rerolls | 18 wins | 90 | 85/130/250/470 | range 110, curses 1 (6 at T5) for 4s, +25% dmg taken (+50% T5); Bad Omen every 10s T4; rerolls: 1 per Val per wave (2 at T3+) | Séance (32s): curse everything 6s |

Elite titles: Dazza Lord of the Bins, Big Marg Bouncer Supreme, Nan Eternal, Uncle Tony Grill
Master, Jezza Top Shelf Legend, Bev Queen of the Bin Chickens, DJ Brendo The Headliner, Long Peter
The Floating Legend, Banjo Top Banana, Big Rocco Molten Legend, Big Kev Cassowary King, Gav Head
Foreman, The All-Seeing Aunty.

Intended roles. Nan is the raw-power pick and wins most Chapter 1 levels alone; that is allowed.
Dazza is the cheap generalist. Marg is the only early stun. Tony and DJ do no damage. Rocco and
Kev cannot hit flyers, which is their whole trade-off. Bev is the anti-air. Levels are tuned so a
support-heavy crew is viable but weaker than a damage-heavy one, and no single crew wins The Paddock.

Mastery Paths (choose at skill level 6, switch any time between levels):
chuck Tip Run (splash x1.6, dmg x1.15) / Recycler (+3 gold per kill, rate x1.1);
bonk Bouncer (knock 14, +0.2s stun) / The Cook (burn 2.5s on hit, dmg x1.1);
nan Sniper Nan (dmg x1.8, rate x0.75, range x1.15, +10% crit) / Knitting Circle (chains to 2 more at 45%, dmg x0.9);
sizzle The Caterer (buff x1.5) / Hotplate (aura x1.35);
jezza Shout a Round (range x1.25, rate x1.2) / Happy Hour (tipsy monsters take +25% from everyone);
bev The Flock (rate x1.35) / Clear Skies (x2 vs flyers);
dj Headliner (tips x1.6) / Bass Line (aura x1.4);
pete Yeet Master (dmg x1.6, knock 10) / Hover Boy (rate x1.3, range x1.15);
banjo Peel Season (+0.3s stun on hit) / Big Split (dmg x1.5);
rocco Quake (stomp radius x1.35, +0.2s stun) / Volcano (burn 2s, rate x1.15);
kev Sprinter (range x1.3, rate x1.15) / Bulldozer (dmg x1.4, knock 16);
gav Spike Specialist (rate x1.3) / Barrier Boss (+0.4s stun on hit);
val Hex (+15% curse) / Oracle (rate x1.35, range x1.2).

Synergies (discovered by playing; shown as ⚡ once found, ❔ before):
Pub Brawl (Jezza+Marg) stuns last 2x on tipsy; Queue Jumpers (Tony+Dazza) splash +50% on slowed;
Bad Influence (Jezza+Nan) crits knock tipsy monsters back; Bin Night (Bev+Dazza) junk +30% on pecked;
Sitting Duck (Marg+Nan) +30% crit on stunned; Smoke Signals (Tony+Bev) birds peck 40% faster in smoke;
Barbecue Whisky (Jezza+Tony) puddles near the grill ignite; Tag Team (Banjo+Marg) slaps +50% on
stunned; Air Strike (Peter+Dazza) junk +50% on levitating; Backyard Bash (DJ+Tony) tips +50%;
Wet and Wild (map) wading monsters take +30% from bonks and pecks.

## 5. Enemies

hp / speed / armour / gold / items stolen. Per-level HP multiplier applies on top (section 6),
plus per-wave scaling (1 + 0.23 x (wave-1)), plus Heat and tier.

Minions: Rat (Regular) 22/46/0/5/1. Skeleton Without Pants 48/38/2/8/1. Unpaid Goblin Intern
30/68/0/7/1 (fast). Mozzie 9/60/0/2/1 (swarm). Seagull, Chip-Motivated 34/50/0/8/1 FLYER. Goblin
First-Aider 75/33/1/14/1 (heals). Rat Mum 130/27/1/16/2 (spawns babies). Baby Rat 12/48/0/1/1.
Crab in a Bucket 60/31/2/14/1 shield 90 (Marg knocks the bucket off). Treasure Goblin 170/74/1/60/0
(event, steals nothing). Bog Bloke 140/25/1/18/2 (tank). Skeleton With Pants 85/34/5/15/1 (armour).
Chapter 3 minions: Scrapbot 90/26/6/8/1 (metal, magnet-able), Drizzle 45/38/0/6/1 FLYER (zaps
towers), Crate (Suspicious) 130/22/3/10/0 (bursts into goblins), Penguin Egg 95/0/1/6/0 (hatches),
Penguin Chick 26/64/0/3/1, Mole 55/40/1/5/1 (pops up ahead), Bouncy Castle (Fun Size) 200/28/2/12/1,
Lawn Bowl 60/92/5/5/1 (very fast, armoured), Billy Goat 140/52/2/9/1 (charges), Night Shift
60/58/1/6/1 (dark only).

Traits (from Level 4 onward; more with Heat and tier; wave preview shows them): ⚡ Speedy spd x1.45;
🛡️ Armoured armour x2 (min +5), hp x1.15; 🧬 Splitter pops into two rats at 30% hp; 💚 Healer heals
mates within 60 by 5% every 1.2s, hp x1.2. Trait monsters give x1.5 gold.

Bosses (hp / spd / armour / gold / steal, mechanic, drop):
Kevin 1700/20/3/120/4 — crits split him into rats — Kevin's Tail.
The Stack 2100/15/2/140/4 — sheds goblins when hit — Trenchcoat of Many Pockets.
Sir Pantsalot 1600/18/8/150/5 — wears loot he passes, steals crew pants every ~9s (victim embarrassed
2s, +1 armour per pair), takes Gary's pants if he gets close — The King's Missing Pants.
Big Swoop 1500/30/1/160/5 FLYER — steals crew hats — Swooper's Feather.
Chrisso 2300/17/4/180/5 — whisky immune, drinks puddles — Chrisso's Stubby Holder.
Middle Manager Mortimer 2500/16/3/190/5 — paperwork shield needs 3 crew types — Lanyard of Authority.
Big Mum 3000/14/3/200/6 — summons babies, enrages — Big Mum's Wooden Spoon.
Steve Who Is Not AFK 3400/19/5/260/6 — takes the least-defended road, steals credit — Steve's
Participation Medal. Big Barry 2200/22/3/170/4 — splashes soggy, fast in water — Barry's Lucky Lure.
Chapter 3: Scrap King 3000/15/6/220/6 (builds scrapbots, recycles loot), Nimbus Nev 2600/18/2/220/6
FLYER (drizzles zap towers), Foreman Frank 3000/16/4/220/6 (crates), Emperor Ken 3000/17/3/220/6
(eggs), Gusty Gail 2800/18/2/220/6 (seagull flocks, fast in gusts), The Mole Queen 3200/15/4/230/6,
Bouncy Castle Bruce 3600/14/2/230/6 (splits into mini-castles), Dame Doris 3000/16/3/230/6 (armoured
bowls), Trevor the Bridge Troll 3400/15/5/240/6 (goat charges, 6 when enraged), The Night Manager
4200/15/4/300/7 (night shift, summons other bosses). All drop a boss trinket (section 7).

Raid bosses (hp 1e9, never die; score = damage dealt): The Landlord (takes 15% of your gold every
18s; phase 2 evicts a random crew member for 3s; phase 3 moves 35% faster), The Council Ranger (fines
your highest-tier crew member for 4s every 15s; phase 2 sends 3 inspectors; phase 3 +6 armour),
Gary's Alarm Clock (rings every 18s stunning crew within 170 for 1.6s; phase 2 sends sleepwalkers;
phase 3 rings every 10s).

## 6. Levels and intended difficulty

Chapter numbers of waves: 8 everywhere except The Final Nap and Eclipse Night Market (10). Starting
gold and HP multiplier are the main dials. Intended feel, from human-style bot testing (not the
optimal bot): a first-timer should win Level 1; an average player should win most of Chapter 1 and
lose late in a level rather than early; Chapter 2 should be won by a damage-heavy crew most of the
time and by a support-heavy crew about half; Chapter 3 should lose on waves 6-8, never on wave 3.

Chapter 1, Gary's Backyard (hand-built pads):
1 Gary's First Nap — gold 150, hp x1.25, Kevin. A brand-new player's very first game is a 3-wave
"taster" (waves 1, 2, then Kevin with 40% of his escort, no goblins) at 2x speed with a free Dazza
pre-placed, HP x0.7 waves 1-3, boss x0.62. Replays are the full 8 waves.
2 The Paddock — 230, x1.55, The Stack. Gate you can tap. Punishes single-type crews.
3 Puddle Crossing — 200, x1.5, Sir Pantsalot. Creek slows waders. Favours Nan.
4 Campfire Corner — 210, x1.25, Big Swoop. Fire. Needs anti-air.
5 The Beer Garden — 260, x2.05, Chrisso. Sticky floor. Chapter finale: should bite, not wall.
6 The Laneways — 280, x1.15, Mortimer. Three entrances, roundabout.
7 Fairy Ring Woods — 300, x1.1, Big Mum. Portals.
8 Gary's Big Day — 320, x1.25, Steve. Two entrances, flyers.

Chapter 2, The Road Trip (auto pads, +240 start gold baked in, chapter multiplier x1.1 then per-map
tune): 9 Servo Stop 540/x1.65 Kevin+Big Mum. 10 Low Tide 540/x1.69 Barry. 11 Smoko Ridge 550/x1.58
Swoop (seagull swarms arrive later than they used to). 12 The Long Paddock 550/x1.62 Stack.
13 Mushroom Maze 560/x1.83 Pantsalot. 14 Pub Crawl 560/x1.3 Chrisso early and again; flank opens
wave 3. 15 Head Office 570/x1.61 Mortimer+Pantsalot. 16 Rat Kingdom 570/x1.94 Big Mum+Kevin.
17 Steve's Revenge 580/x1.13 Steve+Mortimer. 18 The Final Nap 600/x1.85, 10 waves, Steve+Big Mum+
Stack; flank opens wave 3.

Chapter 3, Out of Bounds (chapter multiplier x0.62 then tune; wave-6 template trimmed): 19 Scrapyard
Magnet 560/x1.77 (tap magnet, 6s before overheat). 20 Blackout Storm 560/x1.58 (dark, lanterns,
lightning). 21 Conveyor Factory 570/x1.83 (belts, lever reverses). 22 Ice Rink 570/x1.73.
23 Cliff Top Gusts 580/x1.59. 24 Sinkhole Street 580/x1.79 (roads collapse waves 4 and 7).
25 Trampoline Park 590/x2.05. 26 Sprinkler Lawn 590/x1.84. 27 Swing Bridge 600/x1.48 (crossing swaps
every 2 waves). 28 Eclipse Night Market 640/x2.6, 10 waves, blackout+magnet+gusts, 3 mid-bosses,
The Night Manager.

Difficulty layers on top of a level:
- Heat (unlocks at 5 wins): +1 per campaign win, -1 per loss, max 10. Each level: monsters +8% hp,
  +1% speed, more trait monsters; rewards (rocks, Gary XP) +12%. Shown as 🔥N. Can be switched off
  on the level screen. Testing: Heat 4 bites, Heat 8 beats most strong crews.
- Tiers (after a win): Hard = Hard+Speed modifiers, rewards x2. Nightmare = Hard+Speed+Boss Rush,
  hp x1.12 extra, rewards x2.5, +3 trait monsters per wave; unlocks after beating Hard.
  Nightmare-only outfits: Nightmare Dazza (1 win), Night Terror Nan (3), Nightmare Nap pyjamas (5),
  Hellfire Marg (8), Inferno Rocco (reach Heat 8).
- Modifiers (manual, Normal tier only): Hard +40% hp, Speed +20%, No Mercy (3 items), Chaos
  (random mixes, Gary L5), Boss Rush (bosses waves 3 and 6, Gary L5). Each adds x0.5 rewards.
- Stars: 3 if 80%+ of the pile kept, 2 if 50%+, else 1.

Random events (waves 2+, 24%, not in Long Nap or Raid): merchant (cart near Gary sells cards at
60/90/130 gold), treasure goblin, blood moon (faster, more loot), casserole (+2 pile), double
rainbow (+15% crit, crits pay gold).

## 7. Economy

Gold (in-level only): start gold per level + kills + wave bonus + DJ tips + snatch bonuses. Towers
and upgrades cost gold. Mates Rates (shed) and Council Grant (card) discount it.

Loot: drops from kills (base 20% + shed/cards/trinkets; +15% while Sir Pantsalot is on the field).
Rarity weights Junk 55, Alright 27, Decent 12, Mint 5, Grouse 1. 37 items: 5 Junk (Bucket, Single
Sock, Soggy Chip, Bent Spoon, Rock), 4 Alright (Thong of Mild Speed, Frying Pan, Lucky Brick, Cork
Hat), 4 Decent (Thong of Swiftness, Gary's Spare Helmet, Ring of Mild Inconvenience, Boot of
Kicking), 3 Mint (Boomerang Brick, Nan's Good Scissors, Gary's Sword), 2 Grouse (Nan's Spare Teeth,
Gary's Actual Crown), plus 19 boss trinkets, one per boss. Loot auto-collects after 1s (2.2x longer
in a first run's first two waves); monsters that reach it wear it ("heist") and get its stats. A
first run guarantees a Decent drop in wave 1.

Trinkets: 1-3 slots by Gary level (1/3/7). Effects are small multipliers, e.g. Gary's Sword +15%
dream charge, Nan's Spare Teeth +12% crit, Gary's Actual Crown +2 pile, Kevin's Tail +10% kill
gold, The King's Missing Pants +12% boss damage. Trinket stars (★1-★5) multiply the effect by
1 + 0.25 x (stars-1), paid with spare copies plus rocks: copies 1/2/3/5 and rocks 200/500/1200/2500
scaled by (1 + 0.35 x tier). A Mint item costs 410/1030/2460/5130 rocks for ★2-★5. Slots stay at 3
so power is capped.

Shiny Rocks: earned per run from salvage, boss kills, jobs, daily bonus, raid medals (x modMult x
Heat). Spent in Clive's Shed: Bigger Float 30/60/100/150/220 (+20 start gold each), Spare Undies
60/130/220 (+1 pile each), Warm Milk 80/180 (+12% dream charge each), Mates Rates 40/80/130/190/260
(-4% costs each), Fridge Magnet 35/80/150, Extra Pallets 60/120/200 (one bonus build spot per level
per rank), Extra Card 200 (4 cards per draft). After the Shed, rocks go to the Wardrobe and trinket
stars. The Shed button glows with a red dot when something is affordable.

Dream Shards: from perfect waves, bosses, rare loot, raid medals (2/5/10). Spent on dream levels
(DREAM_COST per level: 4, 8, 14, 22 for L2-L5) and the rarest outfits (Dreamweaver 40, Nan of the
Nebula 45).

Gary XP: kills + 120 per win (30 per loss) + 25 per perfect wave + 40 per boss, x modMult x Heat.
Level unlocks: L1 Sleep Swing + 1 trinket slot, L2 Thunder Snore, L3 slot 2, L4 Lost Property Rain,
L5 Chaos and Boss Rush, L6 Sunday Freeze, L7 slot 3, L8 Static Blanket, L10 Golden Pyjamas
(9,640 XP). Dreams: Sleep Swing, Thunder Snore, Lost Property Rain, Sunday Freeze, Static Blanket,
each 5 levels.

Odd Jobs (3 active, three tiers each, +15/+30 rocks): snatch 3/6/10 loot, stop 60/150/300 monsters,
15/40/80 Nan crits, 20/60/120 tipsy, 15/40/80 bird kills, 30/80/150 Chuckery kills, 15/40/80 Bonk
kills, bank 3/6/12 Decent+, 10/18/26 combo, flawless level, 2/4/7 dreams, 4/8/14 perfect waves,
20/60/150 synergies, 5/15/35 Banana Splits, 20/60/140 lifts, 150/400/900 tip gold, 3/6/10 abilities,
win without a Bonk Booth, wave 8/12/16 in the Long Nap, win a Daily Nap.

Bonus cards (draft of 3 after each wave; 4 with Extra Card; Aunty Val rerolls): Two-Bin Dazza, Nan's
Had Her Tea (+15% crit), Bigger Frying Pan, Extra Onions, Fundraiser (+90 gold), Council Grant (-15%
costs), Shiny Things (+12% drops), Rush Hour [cursed: +20% speed, rarity rolls twice], Steve's
Watching [cursed: +25% hp, +50% kill gold], Gary Snores, Sweet Dreams (+40 meter), Sticky Fingers,
Spare Undies (+2 pile), Smoko Break (+15% rate), Top Shelf, Dropped Chips, Extra Potassium, Good Boy
Treats, Headliner Booking, Shout a Round. Cards for crew not in your 6 are filtered out. A first
run gets no draft until wave 3.

Daily gift: 15-30 rocks and a 50% shard, once per calendar day, no penalty for missing days.
Daily Nap: a seeded level with two card rules; first win 2x XP, +20 rocks (+5 per consecutive day up
to +25), +3 shards.

Wardrobe (cosmetic only). Gary's pyjamas: Standard Issue (default), Stubbies & Singlet 250, Snag
Print 400, Thong Pattern 400, Hi-Vis Onesie 600, Christmas in July 700, Backyard Greens (5 wins),
Classic Stripes (12 wins), Footy Trackies 1200, Budgie Smugglers 1500, Night Sky (finish Chapter 2),
Golden Pyjamas (Gary L10), Molten Nap 6000, The Royal Robe (beat Sir Pantsalot), Dreamweaver 40
shards, Supporter Scarlet (supporter code), Nightmare Nap (5 Nightmare wins). Crew outfits: Dazza
Footy Shorts 300 / Flanno Dazza 600 / Lord of the Tip 1500; Marg Muumuu 600 / Molten Marg 5000;
Nan Bowls Whites 300 / Nan Supreme 1800 / Nan of the Nebula 45 shards; Tony Kiss the Cook 500 /
Grill Lord 1500; Jezza Flanno 300 / Top Shelf Tux 1500; Bev Hi-Vis 300 / Queen of the Tip 1600;
DJ Neon Rave 700; Peter Knitted Jumper 600 / Golden Boy 1500; Banjo Overripe 500 / Golden Banana
4500; Rocco Cooled Off 600 / Molten Core 5000; Kev Emu Costume 700; Gav Blue Singlet 300 / Golden
Foreman 1800; Val Cosmic Aunty 5000. Legendaries have animated lava, auras or shimmer. Full
collection is roughly 25,000 rocks plus shards.

## 8. Long Nap and the weekly Raid

Long Nap (endless) is the leaderboard mode. Same waves for everyone each week per map (wave RNG is
seeded from week + map; combat RNG is not). HP compounds x1.075 per wave after wave 8, bosses
every 10 waves compound too, speed creeps +1.2% per wave after 25 (cap +50%). Everyone dies
eventually; in tests strong crews fall at waves 37-53 and a crew twice as strong lasts about 10 more
waves. Weekly best and all-time best are stored locally; the global board posts {week, map, wave,
nickname, crew} to Supabase when configured (see section 9). Weeks reset Monday (weekKey).

Raid (unlocks at 10 wins): one boss per week rotating Landlord / Council Ranger / Alarm Clock on The
Long Paddock. 3 minutes, +900 start gold, minion waves every 13s, phases at 2:00 and 1:00. Ends at
time-out, if the boss reaches Gary, or if the pile is emptied. Score = damage dealt. Medals Bronze
15,000 / Silver 35,000 / Gold 70,000 pay 50/110/200 rocks and 2/5/10 shards (15 rocks for no medal).
Measured scores: mid-game crews 13-21k, late crews 19-30k, so Gold needs a serious build. Weekly
best stored locally; global board key is `raid-<boss>`.

## 9. Deliberately unfinished (switched off, config at the top of index.html)

- `HML_SUPPORT = { url: '', code: '' }`. Ko-fi / Buy Me a Coffee link and a secret word. With a url,
  Settings shows "Shout the dev a snag" and a code box, and a dismissible home card appears for
  players with 5+ wins and 3+ sessions (never on a loss screen). The code unlocks Supporter Scarlet
  pyjamas and a heart on the title. Honour system: there is no payment verification and there
  should not be until someone has actually paid. Everything is built and tested; only the link and
  the word are missing.
- `HML_BOARD = { url: '', key: '' }`. Supabase project URL and anon key. Expects a `scores` table
  (week int, map text, wave int, name text, crew text, build int, player text, created_at) with
  anon insert + select. Client fetches top 20 by wave desc; nickname is sanitised to [A-Za-z0-9 _-]
  max 14. Scores come from the client and are trivially fakeable; fine among mates. Tested only
  against a mocked server.
- `HML_ANALYTICS` is live (PostHog, US). Event list: session_start/end, first_visit, return_session,
  character_selection_open/selected, crew_confirmed, tutorial_start/step_completed, first_game_start,
  first_tower_placed/upgrade/ability_used/boss_encounter/boss_defeated, level_start/complete/fail/
  restart, wave_complete, results_view, next_level_clicked, tower_placed/upgraded, ability_used,
  boss_spawn/defeat, reward_claimed, crew_unlocked, daily_mode_start, daily_gift_opened, long_nap_end,
  raid_view/start/end, tier_selected/complete, heat_change, path_chosen, draft_reroll, outfit_bought/
  equipped, trinket_starred, share_clicked, a2hs_*, feedback_rating/text, support_*, client_error,
  smooth_auto, leaderboard_view/submit. Properties include level_id, chapter, mode, wave, stars, crew,
  nan_in_crew, reason, retries, src (from ?ref=), device_category, screen size, build. No PII.
- No service worker. The manifest exists for Add to Home Screen; nothing is cached offline on
  purpose because the self-update relies on fetching index.html fresh.

## 10. Known bugs and rough edges (build 30)

- The free Dazza placed at the start of a first run does not fire `tower_placed`, so the
  first_tower_placed funnel step means "second crew member".
- After a Raid ends, the Start button can read "Start wave N" with a stale number until the next
  level starts.
- The Heat row on the level screen shows "Heat 0" for players between 5 wins and their first
  Heat change.
- Opening a crew member's card from the "Choose a Mastery Path" goal on the home screen shows a
  Select/Remove button that does nothing (the crew list passed in is empty).
- Big Kev's Stampede (tier 4 passive) rarely triggers because it needs monsters within 140 of his
  pallet; he is usually placed further from the road.
- Odd Jobs can ask for crew who are not in the player's current six (e.g. Banana Splits).
- The supporter code and the leaderboard are honour-system (see section 9).
- One Android Chrome `client_error` of "Script error." with no detail has been seen (likely an
  extension). Android can drop canvas memory under pressure; the renderer detects a blank
  background every 1s (2.5s in smooth mode) and rebuilds it, and reports `bg_lost`.
- Firefox has never been run by us; it starts in smooth mode on user agent. Safari (WebKit) likewise
  untested in automation, only on real phones by friends.
- The dark-mode viewer: the game is light-only by design; the claude.ai preview is sandboxed and
  cannot send analytics or fetch updates.
- `winshot.py`-style tests broke when the crew-unlock reveal was added; the reveal screen appears
  before results whenever a win unlocks crew. New tests must click `#revOk` first.

## 11. Ideas discussed but not built, in priority order

1. The Gauntlet, "Gary's Long Weekend": a roguelite run across 6-8 maps with relics that combine,
   permadeath, permanent unlocks and its own board. Biggest late-game retention lever; reuses maps,
   cards, trinkets and the weekly seed. One big update plus a tuning pass.
2. Chapter 4. Only after Chapters 2-3 have real human data; both chapters were walls for average
   players until build 18 and are still only bot-tuned.
3. Collection sets: group loot into sets (Gary's Starter Kit, Boss Trophies, The Bogan Formal);
   completing one unlocks an outfit or a title shown on share cards and boards.
4. Heat cash-out: bank a bonus by dropping Heat, turning it into a push-your-luck choice.
5. Crew suggestions per level ("Try DJ Brendo here") and mastery lines like "win with Banjo in the
   crew", to pull players off the recommended six.
6. Push notifications for the daily gift and the weekly raid. Needs a service worker and a push
   server; conflicts with the self-update approach, so do it when moving to a store build.
7. Store builds: Google Play via TWA from the existing manifest (about US$25 one-off), later iOS via
   Capacitor. The audio and storage code were written to survive a WebView.
8. Distribution before features: itch.io listing, CrazyGames submission, 10-second clips (Pantsalot
   stealing pants, Nan crit rainbows, bin chickens) with ?ref= links per channel.
9. Minify or split the single file. It is ~690 KB; after the lazy pallet layout (build 31) startup
   is fast, so this is a bandwidth win on 3G rather than a CPU one.
10. A profanity filter for leaderboard nicknames, and a basic sanity check on posted scores, before
    the board goes public.
11. Desktop as a first-class platform beyond the build-31 frame: hover states on cards, drag to
    pan is unnecessary, but a wider layout that uses the space (e.g. crew panel beside the map)
    was discussed and parked.

## 12. Build 31 (in progress, not released)

Desktop frame with how-to-play, keyboard shortcuts (Space start wave, 1/2/3 speed, Esc pause, M
menu), pointer cursor over pallets and loot, "CLICK" wording on a mouse, QR code to the phone
version; the welcome banner no longer overlaps the coach arrow; lazy pallet layout (startup
game-logic time 1.8s -> 10ms, throttled phone 4.3s -> 1.2s to playable) with background warm-up;
instant CSS splash screen. Release check not yet run.

## 13. Release check (run before every upload)

1. Play the first minute as a brand-new player on a 390x844 touch viewport; look at the frames.
2. Instrumented draw check: 20 levels x all crew; fail on any `[Hold My Loot]` console error or
   NaN/negative radius.
3. Human-style bot: Level 1 first-timer must win 12/12; spot-check Chapter 2/3 levels you touched.
4. Tap protection, mid-level resume, music, save integrity (12 realistic saves survive 2 reloads),
   deliberate reset and save-code load, storage-blocked and in-app-browser banners.
5. Every script block parses; file ends with </html>; build number bumped; analytics key present;
   HML_SUPPORT and HML_BOARD still empty unless intended.
6. Upload index.html only (other files unchanged); confirm Settings shows the new version.
