-- PlayPointy Auth / Besitz (v1)
-- Im Supabase SQL Editor ausführen.

create table if not exists public.entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  pack_id text not null,
  created_at timestamptz not null default now(),
  stripe_session_id text,
  stripe_payment_intent_id text,
  -- Store teaser trio shown at checkout, e.g. "card_047,card_034,card_039"
  teaser_card_ids text,
  constraint entitlements_user_pack_unique unique (user_id, pack_id)
);

-- Existing projects: run this once in the Supabase SQL editor.
alter table public.entitlements
  add column if not exists teaser_card_ids text;

-- Trio frequency among unlocks:
--   select pack_id, teaser_card_ids, count(*)
--   from public.entitlements
--   where teaser_card_ids is not null
--   group by 1, 2
--   order by 3 desc;
--
-- Single-card frequency among unlocks:
--   select pack_id, trim(unnest(string_to_array(teaser_card_ids, ','))) as card_id, count(*)
--   from public.entitlements
--   where teaser_card_ids is not null
--   group by 1, 2
--   order by 3 desc;

create index if not exists entitlements_user_id_idx on public.entitlements (user_id);

alter table public.entitlements enable row level security;

-- Clients dürfen nur eigene Rows lesen. Writes nur via Service Role (Stripe später).
create policy "entitlements_select_own"
  on public.entitlements
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Keine INSERT/UPDATE/DELETE Policies für authenticated/anon.
