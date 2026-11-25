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
--   * ON CONFLICT DO NOTHING keeps the trigger idempotent against a duplicate id. The insert is
--     id-only (every other profiles column defaults), so it won't fail under the current schema —
--     but a future NOT NULL column on profiles without a default must update this trigger, or it
--     would abort the sign-up transaction. (We don't swallow all errors: that would let a user
--     sign up with no profile — the silent broken state this trigger exists to prevent.)
--   * Grants: supabase_auth_admin (the role GoTrue uses to insert into auth.users) gets schema
--     USAGE + EXECUTE so the trigger fires; EXECUTE is revoked from PUBLIC (hardening).

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

-- ---------------------------------------------------------------------------
-- Grants: let the auth admin role fire the trigger; restrict who else may run it
-- ---------------------------------------------------------------------------
-- GoTrue (Supabase Auth) inserts into auth.users as supabase_auth_admin. For the trigger to fire
-- cleanly that role needs USAGE on schema public (and EXECUTE on the function on hardened projects);
-- without them the sign-up transaction aborts ("Database error saving new user"). We also revoke
-- EXECUTE from PUBLIC so only the auth admin role can run this SECURITY DEFINER function (hardening;
-- it is a trigger function and not callable directly anyway). Same GRANT-layer lesson as ADR-0023.
grant usage on schema public to supabase_auth_admin;
revoke execute on function public.handle_new_user() from public;
grant execute on function public.handle_new_user() to supabase_auth_admin;

-- ---------------------------------------------------------------------------
-- Backfill: give any pre-existing auth users a profile
-- ---------------------------------------------------------------------------
-- The trigger fires only on NEW inserts, so accounts created before this migration would
-- otherwise have no profile. This one-time, idempotent backfill covers them, so the
-- "every account has exactly one profile" invariant holds for existing users too.
insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;
