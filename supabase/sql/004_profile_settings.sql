-- ============================================================================
-- Tag Along — Profile Settings, Privacy Controls & Appeals
-- Run AFTER 001_matching_queue.sql, 002_safety_moderation.sql, and
-- 003_trust_verification.sql. Paste this whole file into the Supabase SQL
-- Editor and run it top-to-bottom. Idempotent — safe to re-run.
-- ============================================================================


-- ============================================================================
-- 1. NEW profiles COLUMNS — bio, interests, privacy, and session defaults
-- ============================================================================

alter table public.profiles
  add column if not exists bio                     text,
  add column if not exists interests               jsonb not null default '[]'::jsonb,
  add column if not exists anonymity_level         text not null default 'full_name'
                             check (anonymity_level in ('full_name', 'first_initial')),
  add column if not exists show_verification_badges boolean not null default true,
  add column if not exists show_reputation_state    boolean not null default true,
  add column if not exists default_comfort_mode    text,
  add column if not exists default_group_size      int,
  add column if not exists default_connection_mode text,
  add column if not exists default_social_mood     text;

alter table public.profiles drop constraint if exists profiles_default_group_size_chk;
alter table public.profiles
  add constraint profiles_default_group_size_chk
    check (default_group_size is null or default_group_size between 1 and 4);


-- ============================================================================
-- 2. profiles UPDATE policy — first real direct-client write path
-- ============================================================================

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());


-- ============================================================================
-- 3. public_profile_card(s) — now privacy-aware
-- ============================================================================

create or replace function public.public_profile_cards(p_user_ids uuid[])
returns table (
  id                    uuid,
  first_name            text,
  avatar_color          text,
  reputation_state      text,
  is_email_verified     boolean,
  is_phone_verified     boolean,
  is_id_verified        boolean,
  is_community_verified boolean
) language sql stable security definer set search_path = public as $$
  select
    p.id,
    case when p.anonymity_level = 'first_initial'
         then left(p.first_name, 1) || '.'
         else p.first_name
    end,
    p.avatar_color,
    case when p.show_reputation_state then public.reputation_state(p.id) else 'Private' end,
    case when p.show_verification_badges then p.email_verified_at     is not null else false end,
    case when p.show_verification_badges then p.phone_verified_at     is not null else false end,
    case when p.show_verification_badges then p.id_verified_at        is not null else false end,
    case when p.show_verification_badges then p.community_verified_at is not null else false end
  from public.profiles p
  where p.id = any(p_user_ids);
$$;

create or replace function public.public_profile_card(p_user_id uuid)
returns table (
  id uuid, first_name text, avatar_color text, reputation_state text,
  is_email_verified boolean, is_phone_verified boolean,
  is_id_verified boolean, is_community_verified boolean
) language sql stable security definer set search_path = public as $$
  select * from public.public_profile_cards(array[p_user_id]);
$$;

grant execute on function public.public_profile_cards(uuid[]) to authenticated;
grant execute on function public.public_profile_card(uuid)   to authenticated;


-- ============================================================================
-- 4. moderation_events.revoked_at — lets an overturned appeal actually restore access
-- ============================================================================

alter table public.moderation_events
  add column if not exists revoked_at timestamptz;

create or replace function public.get_user_standing(p_user_id uuid)
returns text language sql stable security definer set search_path = public as $$
  select case
    when exists (select 1 from public.moderation_events e
                  where e.user_id = p_user_id and e.event_type = 'ban'
                    and e.revoked_at is null) then 'banned'
    when exists (select 1 from public.moderation_events e
                  where e.user_id = p_user_id and e.event_type = 'suspension'
                    and e.revoked_at is null
                    and (e.expires_at is null or e.expires_at > now())) then 'suspended'
    when exists (select 1 from public.moderation_events e
                  where e.user_id = p_user_id and e.event_type = 'restriction'
                    and e.revoked_at is null
                    and (e.expires_at is null or e.expires_at > now())) then 'restricted'
    else 'active'
  end;
$$;


-- ============================================================================
-- 5. appeals
-- ============================================================================

create table if not exists public.appeals (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.profiles(id) on delete cascade,
  moderation_event_id uuid not null references public.moderation_events(id) on delete cascade,
  message             text not null,
  status              text not null default 'pending' check (status in ('pending', 'upheld', 'overturned')),
  reviewed_by         uuid references public.profiles(id),
  reviewed_at         timestamptz,
  resolution_note     text,
  created_at          timestamptz not null default now()
);
create index if not exists appeals_user_idx on public.appeals (user_id, created_at desc);
create index if not exists appeals_status_idx on public.appeals (status, created_at desc);

create unique index if not exists appeals_one_pending_per_event
  on public.appeals (moderation_event_id) where status = 'pending';

alter table public.appeals enable row level security;

drop policy if exists appeals_select_own_or_mod on public.appeals;
create policy appeals_select_own_or_mod on public.appeals
  for select using (user_id = auth.uid() or public.is_moderator());
-- no direct insert/update policy — writes only via the SECURITY DEFINER RPCs below


-- ============================================================================
-- 6. submit_appeal / review_appeal
-- ============================================================================

create or replace function public.submit_appeal(p_moderation_event_id uuid, p_message text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_id uuid;
begin
  if v_me is null then
    raise exception 'Authentication required' using errcode = 'insufficient_privilege';
  end if;
  if p_message is null or length(trim(p_message)) = 0 then
    raise exception 'An appeal message is required' using errcode = 'check_violation';
  end if;

  if not exists (select 1 from public.moderation_events e
                  where e.id = p_moderation_event_id and e.user_id = v_me) then
    raise exception 'That notice does not belong to you' using errcode = 'insufficient_privilege';
  end if;

  if exists (select 1 from public.appeals a
              where a.moderation_event_id = p_moderation_event_id and a.status = 'pending') then
    raise exception 'You already have a pending appeal for this decision' using errcode = 'unique_violation';
  end if;

  insert into public.appeals(user_id, moderation_event_id, message)
  values (v_me, p_moderation_event_id, trim(p_message))
  returning id into v_id;

  return v_id;
end $$;

create or replace function public.review_appeal(
  p_appeal_id uuid, p_uphold boolean, p_resolution_note text default null)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  v_actor uuid := auth.uid();
  a public.appeals%rowtype;
begin
  if not public.is_moderator(v_actor) then
    raise exception 'Moderator privileges required' using errcode = 'insufficient_privilege';
  end if;

  select * into a from public.appeals where id = p_appeal_id for update;
  if not found then
    raise exception 'Appeal not found' using errcode = 'no_data_found';
  end if;
  if a.status <> 'pending' then
    raise exception 'Appeal already %', a.status using errcode = 'check_violation';
  end if;

  update public.appeals
     set status = case when p_uphold then 'upheld' else 'overturned' end,
         reviewed_by = v_actor, reviewed_at = now(), resolution_note = p_resolution_note
   where id = p_appeal_id;

  if not p_uphold then
    update public.moderation_events set revoked_at = now() where id = a.moderation_event_id;
  end if;

  perform public.notify_user(a.user_id,
    case when p_uphold then 'appeal_upheld' else 'appeal_overturned' end,
    case when p_uphold then 'Your appeal was reviewed' else 'Your appeal was successful' end,
    case when p_uphold
         then coalesce(p_resolution_note, 'The original decision stands.')
         else coalesce(p_resolution_note, 'The decision has been reversed and your access restored.')
    end,
    jsonb_build_object('appeal_id', a.id, 'moderation_event_id', a.moderation_event_id));

  return jsonb_build_object(
    'status', case when p_uphold then 'upheld' else 'overturned' end,
    'user_id', a.user_id
  );
end $$;

grant execute on function public.submit_appeal(uuid, text) to authenticated;
grant execute on function public.review_appeal(uuid, boolean, text) to authenticated;

alter publication supabase_realtime add table public.appeals;
