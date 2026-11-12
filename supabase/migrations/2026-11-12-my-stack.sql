-- Tradox: "What I'm using" (my_stack). Run once in Supabase → SQL Editor.
-- Safe to re-run. Adds one table; changes nothing that exists.
--
-- What a person ticks themselves on a firm / broker / course / tool page
-- ("I have an account here", "I'm taking this course"). Self-reported, only
-- ever readable by that person (row-level security below), deleted with
-- their account. No free text.

create table if not exists public.my_stack (
  user_id  uuid not null references auth.users (id) on delete cascade,
  kind     text not null check (kind in ('firm','broker','course','tool')),
  item_id  text not null check (char_length(item_id) between 1 and 120),
  since    timestamptz not null default now(),
  primary key (user_id, kind, item_id)
);

alter table public.my_stack enable row level security;

drop policy if exists "own rows" on public.my_stack;
create policy "own rows" on public.my_stack
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
