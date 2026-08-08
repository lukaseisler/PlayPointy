-- PlayPointy Auth / Besitz (v1)
-- Im Supabase SQL Editor ausführen.

create table if not exists public.entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  pack_id text not null,
  created_at timestamptz not null default now(),
  stripe_session_id text,
  stripe_payment_intent_id text,
  constraint entitlements_user_pack_unique unique (user_id, pack_id)
);

create index if not exists entitlements_user_id_idx on public.entitlements (user_id);

alter table public.entitlements enable row level security;

-- Clients dürfen nur eigene Rows lesen. Writes nur via Service Role (Stripe später).
create policy "entitlements_select_own"
  on public.entitlements
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Keine INSERT/UPDATE/DELETE Policies für authenticated/anon.
