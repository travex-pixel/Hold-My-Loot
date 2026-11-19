# Turning on the global leaderboard

The game already has the leaderboard built in. It stays off until `window.HML_BOARD` at the top of `index.html`
has a Supabase URL and key. All the rules (plausible scores, rate limits, the nickname filter, one best score per
player) run inside Postgres, in `leaderboard.sql`. There is no other server.

## Cost (check before switching it on)

Supabase's **free plan costs $0** and is enough for launch. Check supabase.com/pricing for today's numbers. When this
was written the free plan had:

| Limit | What the board uses |
|---|---|
| 500 MB database | about 5 MB a week at 10,000 weekly players (one row per player per board; 12 weeks kept) |
| 5 GB egress a month | about 2 GB a month at 10,000 weekly players opening the board 30 times a week |
| Pauses after 7 days with no requests | only matters if nobody plays for a week; un-pause from the dashboard |

Roughly **25,000+ weekly players** would pass the free egress. That is the point to move to Pro (US$25 a month).
Nothing is charged automatically on the free plan: it slows or pauses instead.

## Setup (10 minutes)

1. Make a free account at supabase.com and create a project. Region: closest to most players (Sydney for Australia).
2. Open **SQL Editor**, click **New query**, paste all of `leaderboard.sql`, click **Run**. It is safe to run again later.
3. Open **Project Settings, API**. Copy the **Project URL** and the **anon public** key. The anon key is meant to be
   public; the SQL only lets it read the board and post a score.
4. In `index.html`, set:
   ```js
   window.HML_BOARD = { url: 'https://YOURPROJECT.supabase.co', key: 'the anon public key' };
   ```
5. Bump `hml-build` and add a CHANGELOG line, as for any release.

## What the server checks

- **Shape:** nickname 2-14 letters, digits, spaces, `_` or `-`; a known level or Raid boss; build 31 or newer.
- **This week only:** the week key must be this week's Monday (a day of slack either side for time zones).
- **Plausible scores:**
  - Long Nap: at most wave 150, and at least 12 game seconds per wave. Bots take about 50 and strong crews fall at
    waves 37-53.
  - Raid: at most 1,500 damage per second of a 3-minute clock. Gold is 70,000 damage, about 390 a second.
- **Rate limits:** 6 posts per player per 10 minutes, 40 a day, and 300 a minute across everyone.
- **One row per player per board:** a worse score is ignored, a better one replaces the old row.
- **Nicknames:** a rude name is swapped for "Sleepy" plus four letters, so the score still counts. The game runs the
  same filter first and asks for another name. `tests/leaderboard-sql.mjs` checks the two lists match.
- **The public key cannot** read player ids, edit or delete scores, or see the rate-limit log.

Scores still come from the player's browser, so a determined cheater can post a fake but plausible score.
Making that impossible would need server-side replays, which is not worth it for a free game. If someone does it,
delete the row in **Table Editor, scores**.

## Testing

`node tests/leaderboard-sql.mjs` starts a throwaway Postgres, loads this SQL and posts scores as the anon role
(27 checks). It needs the PostgreSQL binaries, which this repo's cloud environment has.
