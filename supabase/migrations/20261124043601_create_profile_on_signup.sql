-- Migration: create_profile_on_signup
-- Auto-create a public.profiles row when a new auth user is created.
-- Decision: docs/adr/0025-create-profile-on-signup-trigger.md
--
-- Why a trigger (not app-side): the profile is guaranteed to exist atomically with the auth
-- user, server-side, for every sign-up path (Google now, others later) — no app code path
-- can forget it. See ADR-0025.
--
-- Conventions (match ADR-0022 / initial_schema):
--   * profiles.id = auth.users.id; every other profiles column has a default, so inserting
--     id alone is enough. time_zone defaults to 'UTC' (the app updates it once it can detect
--     the user's zone); display_name is read from auth metadata by the app, so it is left null.
--   * SECURITY DEFINER: the insert runs as the function owner, because the role that inserts
--     into auth.users at sign-up is a different one. The owner bypasses RLS, so the owner-only
--     insert policy on profiles is satisfied even though there is no auth.uid() during sign-up.
--   * search_path = '' (Supabase linter hardening); all objects are fully schema-qualified.
--   * ON CONFLICT DO NOTHING keeps the trigger idempotent so it can never block a sign-up.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Drop-then-create so the migration can be re-run cleanly when rebuilding from the repo.
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
