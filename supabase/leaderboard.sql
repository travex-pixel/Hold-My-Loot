-- Hold My Loot: the weekly global leaderboard. Supabase free tier is enough (see supabase/README.md for costs).
-- Paste this whole file into Supabase > SQL Editor > New query > Run. Safe to run again.
-- Everything is checked here in Postgres, so there is no Edge Function and no other server.

create table if not exists public.scores (
  id         bigint generated always as identity primary key,
  week       int  not null,                 -- Monday of the week, YYYYMMDD (the game's weekKey)
  map        text not null,                 -- level id for The Long Nap, or raid-<boss>
  wave       int  not null,                 -- Long Nap: waves survived. Raid: damage dealt.
  name       text not null,
  crew       text not null default '',
  build      int  not null,
  player     text not null,                 -- random id made by the game when it first posts a score
  secs       int  not null default 0,       -- game-clock seconds the run took
  created_at timestamptz not null default now()
);
create index if not exists scores_board  on public.scores (week, map, wave desc, created_at);
create index if not exists scores_player on public.scores (player, week, map);

-- every attempt to post, for rate limits (never readable from the game)
create table if not exists public.score_posts (player text not null, at timestamptz not null default now());
create index if not exists score_posts_player on public.score_posts (player, at desc);
create index if not exists score_posts_at on public.score_posts (at);

-- Nickname filter. The same lists live in index.html (nickOk) so players get told straight away;
-- tests/leaderboard-sql.mjs checks the two copies match.
create or replace function public.hml_name_ok(n text) returns boolean language plpgsql immutable as $$
declare
  contains_words text[] := array['fuck','fuk','fck','shit','cunt','nigger','nigga','faggot','fagot','retard','rapist','whore','slut','bitch','wank','twat','bollock','pussy','penis','vagina','dildo','porn','nazi','hitler','kkk','jizz','spunk','bastard','chink','gook','kike','tranny','asshole','arsehole','dickhead','motherf'];
  token_words text[] := array['ass','arse','cum','tit','tits','dick','cock','prick','piss','sex','rape','anal','anus','coon','dyke','wog','abo','paki','spic','homo','fanny','fag','nig'];
  s text; c text; w text; t text;
begin
  s := regexp_replace(translate(lower(n), '013457@$8', 'oieastasb'), '[^a-z]', '', 'g');
  c := regexp_replace(s, '(.)\1+', '\1', 'g');
  foreach w in array contains_words loop
    if position(w in s) > 0 then return false; end if;
    if regexp_replace(w, '(.)\1+', '\1', 'g') = w and position(w in c) > 0 then return false; end if;
  end loop;
  for t in select regexp_replace(x, '[^a-z]', '', 'g') from regexp_split_to_table(translate(lower(n), '013457@$8', 'oieastasb'), '[ _-]+') as x loop
    if t = any(token_words) or regexp_replace(t, '(.)\1+', '\1', 'g') = any(token_words) then return false; end if;
  end loop;
  return true;
end $$;

create or replace function public.hml_scores_guard() returns trigger language plpgsql security definer set search_path = public as $$
declare monday date; n int; prev record;
begin
  -- shape
  if new.name is null or new.name !~ '^[A-Za-z0-9 _-]{2,14}$' then raise exception 'bad name' using errcode = '22023'; end if;
  if new.player is null or new.player !~ '^b_[A-Za-z0-9_-]{6,60}$' then raise exception 'bad player' using errcode = '22023'; end if;
  if new.crew is null or length(new.crew) > 80 or new.crew !~ '^[a-z,]*$' then raise exception 'bad crew' using errcode = '22023'; end if;
  if new.build is null or new.build < 31 or new.build > 999 then raise exception 'bad build' using errcode = '22023'; end if;
  -- this week only: the Monday key, with a day of slack either side for time zones
  begin monday := to_date(new.week::text, 'YYYYMMDD'); exception when others then raise exception 'bad week' using errcode = '22023'; end;
  if to_char(monday, 'YYYYMMDD')::int <> new.week or extract(isodow from monday) <> 1 or monday > current_date + 1 or monday < current_date - 8 then
    raise exception 'wrong week' using errcode = '22023'; end if;
  -- plausible scores. Long Nap: strong crews fall at waves 37-53, and a wave takes about 50 game seconds
  -- (12 allowed, for players who call waves early). Raid: 3 minutes, Gold medal is 70,000 damage (about 390 a second;
  -- 1,500 a second allowed).
  if new.map like 'raid-%' then
    if new.map not in ('raid-landlord', 'raid-ranger', 'raid-alarm') then raise exception 'bad map' using errcode = '22023'; end if;
    if new.wave < 1 or new.wave > 200000 or new.secs < 1 or new.secs > 200 or new.wave > new.secs * 1500 then raise exception 'implausible' using errcode = '22023'; end if;
  else
    if new.map not in ('nap','paddock','creek','camp','garden','lanes','woods','bigday','servo','tide','smoko','longpad','maze','pubcrawl','office','ratking','revenge','finalnap','scrap','storm','factory','rink','cliff','sink','tramp','lawn','bridge','eclipse') then
      raise exception 'bad map' using errcode = '22023'; end if;
    if new.wave < 1 or new.wave > 150 or new.secs < new.wave * 12 then raise exception 'implausible' using errcode = '22023'; end if;
  end if;
  -- rate limits: 6 posts per player per 10 minutes, 40 a day, and 300 a minute for everyone together
  insert into public.score_posts (player) values (new.player);
  select count(*) into n from public.score_posts where player = new.player and at > now() - interval '10 minutes';
  if n > 6 then raise exception 'slow down' using errcode = '53400'; end if;
  select count(*) into n from public.score_posts where player = new.player and at > now() - interval '1 day';
  if n > 40 then raise exception 'slow down' using errcode = '53400'; end if;
  select count(*) into n from public.score_posts where at > now() - interval '1 minute';
  if n > 300 then raise exception 'busy' using errcode = '53400'; end if;
  -- housekeeping, now and then: the rate-limit log keeps 2 days, the boards keep 12 weeks
  if random() < .01 then
    delete from public.score_posts where at < now() - interval '2 days';
    delete from public.scores where week < to_char(current_date - interval '84 days', 'YYYYMMDD')::int;
  end if;
  -- a rude nickname is swapped for a harmless one rather than rejected, so the score still counts
  if not public.hml_name_ok(new.name) then new.name := 'Sleepy ' || upper(substr(md5(new.player), 1, 4)); end if;
  -- one row per player per board per week: keep their best
  select id, wave into prev from public.scores where player = new.player and week = new.week and map = new.map order by wave desc limit 1;
  if found then
    if new.wave > prev.wave then
      update public.scores set wave = new.wave, name = new.name, crew = new.crew, build = new.build, secs = new.secs, created_at = now() where id = prev.id;
    end if;
    return null;
  end if;
  new.created_at := now();
  return new;
end $$;

drop trigger if exists scores_guard on public.scores;
create trigger scores_guard before insert on public.scores for each row execute function public.hml_scores_guard();

-- Who can do what. The game uses the public "anon" key: it can read the board columns and post a score, nothing else.
alter table public.scores enable row level security;
alter table public.score_posts enable row level security;
drop policy if exists "read the board" on public.scores;
drop policy if exists "post a score" on public.scores;
create policy "read the board" on public.scores for select to anon using (true);
create policy "post a score" on public.scores for insert to anon with check (true);
revoke all on public.scores, public.score_posts from anon, authenticated;
grant select (week, map, wave, name, crew, created_at) on public.scores to anon;
grant insert (week, map, wave, name, crew, build, player, secs) on public.scores to anon;
revoke execute on function public.hml_scores_guard() from public, anon, authenticated;
