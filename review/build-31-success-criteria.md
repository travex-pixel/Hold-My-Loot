# How we'll know build 31 worked

Written before build 31 reached any player, so the result can't be argued after the fact.

## The question
Do more real people win their first level on build 31 than on build 30?

## Who counts as a real player
Crawlers and link-preview bots load the page and fire `session_start`, `first_game_start` and tutorial events without
anyone touching it. On build 30 they made up 57 of 125 "players" (35 desktop crawlers with a median visit of 0 s, and
22 mobile visits that never tapped). PostHog's own bot flag marked every visitor as a bot because the game sent no
user agent, so it can't be used for build 30.

- **Build 30 (baseline):** a player is anyone who placed or upgraded a crew member, or stayed longer than 30 s.
- **Build 31:** a player is anyone who sent `first_input` (their first tap, click or key). Build 31 also sends the
  browser user agent, so PostHog's `isLikelyBot()` works as a second filter.

The build-31 definition is broader (any tap counts, not just a build), which makes build 31's rate look worse, not
better. That's the conservative direction.

## Baseline (build 29-30, 45 days to 2026-11-11, PostHog)
| | Real players | Won a level | Rate |
|---|---:|---:|---:|
| Placed or upgraded a crew member | 57 | 17 | 30% |

Also, for context: 15 of 68 real players came back on another day (22%).

## Decision rule
Wait for **20 real players on build 31** (about two weeks at the build-30 rate of 1.5 a day; sooner once the videos
go out). Then count how many won a level.

| Wins out of 20 | Verdict |
|---|---|
| 13 or more (65%+) | Build 31's first ten minutes work. One-sided Fisher exact test against 17/57: p < 0.01. |
| 9 to 12 | Better than build 30 but not proven. Watch the next 20 before changing anything. |
| 8 or fewer | The taster isn't working for real people even though the bots win it every time. Look at where they stop. |

If the true rate is 80% (the bots and the coached first-minute test say it should be higher), there is a 97% chance
of reaching 13 of 20. If it's only 60%, a 42% chance, which is why 9-12 means "not proven" rather than "failed".

## Query
Run in PostHog SQL (or read the "Real players: first tap to second visit" funnel on the "Hold My Loot: launch"
dashboard):

```sql
WITH p AS (
  SELECT distinct_id,
         countIf(event = 'first_input') > 0 AS real,
         countIf(event = 'level_complete') > 0 AS won,
         max(isLikelyBot(properties.$raw_user_agent)) AS bot
  FROM events
  WHERE toInt(properties.build) = 31 AND timestamp > toDateTime('2026-11-11')
  GROUP BY distinct_id)
SELECT countIf(real AND NOT bot) AS real_players, countIf(real AND NOT bot AND won) AS won FROM p
```

Exclude the developer's own devices: they show up as several IDs with very long sessions in Australia.
