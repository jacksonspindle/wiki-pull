-- WikiPull Supabase Schema
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor)

-- Cards table: one row per unique card in the collection
create table cards (
  id text primary key,
  title text not null unique,
  extract text,
  image_url text,
  thumbnail_url text,
  rarity text not null,
  category text not null,
  atk integer not null,
  def integer not null,
  pageviews integer not null default 0,
  article_length integer not null default 0,
  languages integer not null default 0,
  wiki_url text not null,
  wiki_rank integer,
  daily_views integer,
  pageview_date text,
  pulled_at timestamptz not null default now(),
  is_new boolean not null default true,
  duplicate_count integer not null default 0
);

-- Game state: single row holding collection stats + gacha state
create table game_state (
  id integer primary key default 1 check (id = 1),
  total_pulls integer not null default 0,
  packs_opened integer not null default 0,
  stardust integer not null default 0,
  daily_packs integer not null default 9999,
  max_packs integer not null default 9999,
  last_regen_time timestamptz not null default now(),
  pulls_since_gold integer not null default 0,
  pity_counter integer not null default 0
);

-- Insert the single game state row
insert into game_state (id) values (1);

-- Disable RLS (single-user personal project)
alter table cards enable row level security;
alter table game_state enable row level security;

-- Permissive policies so the anon key can read/write everything
create policy "Allow all on cards" on cards for all using (true) with check (true);
create policy "Allow all on game_state" on game_state for all using (true) with check (true);
