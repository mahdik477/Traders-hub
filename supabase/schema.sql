-- Tradox account tables. Run this once in the Supabase SQL editor
-- (Dashboard → SQL Editor → New query → paste → Run). Safe to re-run.
--
-- Principles:
--   * We store the minimum: a user id, an email address, and the things a
--     person saves on the site. No names, no photos, no payment details.
--   * Every table has row-level security switched on, with one policy:
--     a signed-in person can read and write ONLY rows where user_id is
--     their own id. Nobody can read anyone else's rows, including through
--     the public (publishable/anon) key shipped to the browser.
--   * A person can delete everything about themselves with one call
--     (delete_my_account), which satisfies "right to be forgotten"
--     requests without an admin.

-- ---------------------------------------------------------------------------
-- profiles: one row per signed-up person
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  user_id          uuid primary key references auth.users (id) on delete cascade,
  email            text,
  -- Set when the person ticks "I'm 18 or over" on first sign-in.
  age_confirmed_at timestamptz,
  created_at       timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- saved_items: the Save button on listing cards and pages
--   kind is one of: firm, course, broker, tool, signal, strategy
-- ---------------------------------------------------------------------------
create table if not exists public.saved_items (
  user_id    uuid not null references auth.users (id) on delete cascade,
  kind       text not null check (kind in ('firm','course','broker','tool','signal','strategy')),
  item_id    text not null check (char_length(item_id) between 1 and 120),
  saved_at   timestamptz not null default now(),
  primary key (user_id, kind, item_id)
);

-- ---------------------------------------------------------------------------
-- saved_comparisons: a compare-page link the person chose to keep
--   kind is one of: firms, courses, brokers; query is the ?... part
-- ---------------------------------------------------------------------------
create table if not exists public.saved_comparisons (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  kind       text not null check (kind in ('firms','courses','brokers')),
  query      text not null check (char_length(query) between 1 and 2000),
  title      text check (char_length(title) <= 200),
  created_at timestamptz not null default now(),
  unique (user_id, kind, query)
);

-- ---------------------------------------------------------------------------
-- recently_viewed: the last listings the person opened (capped in app code)
-- ---------------------------------------------------------------------------
create table if not exists public.recently_viewed (
  user_id    uuid not null references auth.users (id) on delete cascade,
  kind       text not null check (kind in ('firm','course','broker','tool','signal','strategy','learn')),
  item_id    text not null check (char_length(item_id) between 1 and 120),
  viewed_at  timestamptz not null default now(),
  primary key (user_id, kind, item_id)
);

-- ---------------------------------------------------------------------------
-- learning_progress: Learn topics and strategy quizzes marked as done
-- ---------------------------------------------------------------------------
create table if not exists public.learning_progress (
  user_id      uuid not null references auth.users (id) on delete cascade,
  kind         text not null check (kind in ('learn','quiz')),
  item_id      text not null check (char_length(item_id) between 1 and 120),
  completed_at timestamptz not null default now(),
  primary key (user_id, kind, item_id)
);

-- ---------------------------------------------------------------------------
-- alert_preferences: the unticked "email me about price/promo changes" box
--   per prop firm. Only a preference — no emails are sent by anything yet.
-- ---------------------------------------------------------------------------
create table if not exists public.alert_preferences (
  user_id    uuid not null references auth.users (id) on delete cascade,
  firm_id    text not null check (char_length(firm_id) between 1 and 120),
  opted_in   boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, firm_id)
);

-- ---------------------------------------------------------------------------
-- Row-level security: own rows only, on every table
-- ---------------------------------------------------------------------------
alter table public.profiles          enable row level security;
alter table public.saved_items       enable row level security;
alter table public.saved_comparisons enable row level security;
alter table public.recently_viewed   enable row level security;
alter table public.learning_progress enable row level security;
alter table public.alert_preferences enable row level security;

drop policy if exists "own rows" on public.profiles;
create policy "own rows" on public.profiles
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own rows" on public.saved_items;
create policy "own rows" on public.saved_items
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own rows" on public.saved_comparisons;
create policy "own rows" on public.saved_comparisons
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own rows" on public.recently_viewed;
create policy "own rows" on public.recently_viewed
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own rows" on public.learning_progress;
create policy "own rows" on public.learning_progress
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own rows" on public.alert_preferences;
create policy "own rows" on public.alert_preferences
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Nothing for anonymous visitors: the anon role gets no policies, so every
-- query without a signed-in session returns zero rows.

-- ---------------------------------------------------------------------------
-- Self-service account deletion ("right to be forgotten").
-- Deleting the auth.users row cascades through every table above.
-- security definer lets the function touch auth.users; it only ever deletes
-- the caller's own row.
-- ---------------------------------------------------------------------------
create or replace function public.delete_my_account()
returns void
language sql
security definer
set search_path = public
as $$
  delete from auth.users where id = auth.uid();
$$;

revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;
