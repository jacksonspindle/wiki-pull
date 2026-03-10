-- WikiPull: Auth + Binders Migration
-- Run this in Supabase SQL Editor AFTER the initial schema
-- This drops and recreates tables with user_id scoping

-- Drop old policies and tables
drop policy if exists "Allow all on cards" on cards;
drop policy if exists "Allow all on game_state" on game_state;
drop table if exists binder_cards;
drop table if exists binders;
drop table if exists cards;
drop table if exists game_state;

-- Cards table: scoped to user
create table cards (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
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
  duplicate_count integer not null default 0,
  unique (user_id, title)
);

-- Game state: one row per user
create table game_state (
  user_id uuid references auth.users(id) on delete cascade primary key,
  total_pulls integer not null default 0,
  packs_opened integer not null default 0,
  stardust integer not null default 0,
  daily_packs integer not null default 9999,
  max_packs integer not null default 9999,
  last_regen_time timestamptz not null default now(),
  pulls_since_gold integer not null default 0,
  pity_counter integer not null default 0
);

-- Binders: user-created card collections
create table binders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text not null default '',
  icon text not null default '',
  created_at timestamptz not null default now()
);

-- Junction table: which cards are in which binder
create table binder_cards (
  binder_id uuid references binders(id) on delete cascade not null,
  card_id text references cards(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  added_at timestamptz not null default now(),
  primary key (binder_id, card_id)
);

-- Enable RLS on all tables
alter table cards enable row level security;
alter table game_state enable row level security;
alter table binders enable row level security;
alter table binder_cards enable row level security;

-- Users can only access their own data
create policy "Users own their cards" on cards
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users own their game state" on game_state
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users own their binders" on binders
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users own their binder cards" on binder_cards
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Index for fast card lookups by user
create index idx_cards_user_id on cards(user_id);
create index idx_binders_user_id on binders(user_id);
create index idx_binder_cards_binder_id on binder_cards(binder_id);
