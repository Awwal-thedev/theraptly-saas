-- Theraptly schema — run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query).
-- Safe to re-run: uses "if not exists" / "or replace" where possible.

-- =========================================================
-- Tables
-- =========================================================

create table if not exists public.organizations (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  type          text not null,
  team_size     text not null,
  frameworks    text[] not null default '{}',
  owner_id      uuid not null references auth.users (id) on delete cascade,
  created_at    timestamptz not null default now()
);

create table if not exists public.profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  full_name       text,
  role            text not null default 'admin',
  onboarded       boolean not null default false,
  organization_id uuid references public.organizations (id) on delete set null,
  created_at      timestamptz not null default now()
);

create table if not exists public.organization_invites (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  email           text not null,
  status          text not null default 'pending',
  invited_by      uuid references auth.users (id) on delete set null,
  created_at      timestamptz not null default now()
);

-- =========================================================
-- Auto-create a profile row whenever a new auth user signs up
-- =========================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    coalesce(new.raw_user_meta_data ->> 'role', 'admin')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================================
-- Row Level Security
-- =========================================================

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.organization_invites enable row level security;

-- profiles: a user can read & update only their own profile
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- organizations: owner can do anything with their org; members can read theirs
drop policy if exists "orgs_select_member" on public.organizations;
create policy "orgs_select_member" on public.organizations
  for select using (
    owner_id = auth.uid()
    or id = (select organization_id from public.profiles where id = auth.uid())
  );

drop policy if exists "orgs_insert_owner" on public.organizations;
create policy "orgs_insert_owner" on public.organizations
  for insert with check (owner_id = auth.uid());

drop policy if exists "orgs_update_owner" on public.organizations;
create policy "orgs_update_owner" on public.organizations
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- invites: only the owning org's owner can read/create invites
drop policy if exists "invites_select_owner" on public.organization_invites;
create policy "invites_select_owner" on public.organization_invites
  for select using (
    organization_id in (select id from public.organizations where owner_id = auth.uid())
  );

drop policy if exists "invites_insert_owner" on public.organization_invites;
create policy "invites_insert_owner" on public.organization_invites
  for insert with check (
    organization_id in (select id from public.organizations where owner_id = auth.uid())
  );
