-- ============================================================================
-- Tag Along — Realtime Publication Fix
-- Run AFTER 001_matching_queue.sql through 005_verification_and_scheduling.sql.
-- Paste this whole file into the Supabase SQL Editor and run it top-to-bottom.
-- Idempotent — safe to re-run.
-- ============================================================================

-- hooks/use-trust-profile.ts subscribes to postgres_changes on public.profiles
-- (UPDATE) and public.verification_requests (*), but neither table was ever
-- added to the supabase_realtime publication — only public.moderation_events
-- was (see 002_safety_moderation.sql). That means those two subscriptions have
-- silently never fired: any moderator action that only touches profiles
-- (review_verification_request approving/rejecting, resolve_community_reverification
-- revoking/keeping) never pushes a live update, so the reputation card on the
-- Profile tab can keep showing a stale tier until the screen is fully remounted.

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'profiles'
  ) then
    alter publication supabase_realtime add table public.profiles;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'verification_requests'
  ) then
    alter publication supabase_realtime add table public.verification_requests;
  end if;
end $$;
