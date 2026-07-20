-- ============================================================================
-- Tag Along — Trust & Verification System
-- Run AFTER 001_matching_queue.sql and 002_safety_moderation.sql.
-- Paste this whole file into the Supabase SQL Editor and run it top-to-bottom.
-- Idempotent — safe to re-run.
-- ============================================================================


-- ============================================================================
-- 1. NEW profiles COLUMNS
-- ============================================================================

alter table public.profiles
  add column if not exists email_verified_at     timestamptz,
  add column if not exists phone_verified_at     timestamptz,  -- reserved; no flow sets this yet
  add column if not exists community_verified_at timestamptz,
  add column if not exists id_verified_at        timestamptz;


-- ============================================================================
-- 2. EMAIL VERIFICATION — sync from auth.users (mirrors handle_new_user)
-- ============================================================================

create or replace function public.sync_email_verified()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.email_confirmed_at is not null then
    update public.profiles
       set email_verified_at = new.email_confirmed_at
     where id = new.id
       and email_verified_at is distinct from new.email_confirmed_at;
  end if;
  return new;
end $$;

drop trigger if exists trg_sync_email_verified on auth.users;
create trigger trg_sync_email_verified
  after insert or update of email_confirmed_at on auth.users
  for each row execute function public.sync_email_verified();

-- one-time backfill for users who confirmed before this migration existed
update public.profiles p
   set email_verified_at = u.email_confirmed_at
  from auth.users u
 where u.id = p.id and u.email_confirmed_at is not null and p.email_verified_at is null;


-- ============================================================================
-- 3. reputation_state — New / Verified / Reliable / Trusted / Restricted / Suspended / Banned
-- ============================================================================

create or replace function public.reputation_state(p_user_id uuid)
returns text language plpgsql stable security definer set search_path = public as $$
declare
  v_standing text := public.get_user_standing(p_user_id);
  v_tc int;
  v_ps int;
  v_has_verification boolean;
  v_strong_verification boolean;
begin
  if v_standing = 'banned'     then return 'Banned';     end if;
  if v_standing = 'suspended'  then return 'Suspended';  end if;
  if v_standing = 'restricted' then return 'Restricted'; end if;

  select coalesce(total_connections, 0), coalesce(positive_signals, 0),
         (email_verified_at is not null or phone_verified_at is not null
            or id_verified_at is not null or community_verified_at is not null),
         (id_verified_at is not null or community_verified_at is not null)
    into v_tc, v_ps, v_has_verification, v_strong_verification
    from public.profiles where id = p_user_id;

  if v_tc >= 10 and v_ps >= 8 and v_strong_verification then return 'Trusted'; end if;
  if v_tc >= 5  and v_ps >= 3                            then return 'Reliable'; end if;
  if v_has_verification                                  then return 'Verified'; end if;
  return 'New';
end $$;

grant execute on function public.reputation_state(uuid) to authenticated;


-- ============================================================================
-- 4. public_profile_card(s) — the ONLY sanctioned cross-user lookup
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
  select p.id, p.first_name, p.avatar_color,
         public.reputation_state(p.id),
         p.email_verified_at     is not null,
         p.phone_verified_at     is not null,
         p.id_verified_at        is not null,
         p.community_verified_at is not null
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
-- 5. profiles SELECT lockdown — raw numbers = owner + moderator only
-- ============================================================================

do $$
declare pol record;
begin
  for pol in select policyname from pg_policies
    where schemaname = 'public' and tablename = 'profiles' and cmd = 'SELECT'
  loop
    execute format('drop policy %I on public.profiles', pol.policyname);
  end loop;
end $$;

alter table public.profiles enable row level security;

create policy profiles_select_self_or_mod on public.profiles
  for select using (id = auth.uid() or public.is_moderator());


-- ============================================================================
-- 6. verification_requests
-- ============================================================================

create table if not exists public.verification_requests (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  type            text not null check (type in ('id_document', 'community')),
  submission_data jsonb not null default '{}'::jsonb,
  status          text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  review_note     text,
  reviewed_by     uuid references public.profiles(id),
  reviewed_at     timestamptz,
  created_at      timestamptz not null default now()
);
create index if not exists verreq_user_idx   on public.verification_requests (user_id, created_at desc);
create index if not exists verreq_status_idx on public.verification_requests (status, created_at desc);

create unique index if not exists verreq_one_pending
  on public.verification_requests (user_id, type) where status = 'pending';

alter table public.verification_requests enable row level security;

drop policy if exists verreq_select_own_or_mod on public.verification_requests;
create policy verreq_select_own_or_mod on public.verification_requests
  for select using (user_id = auth.uid() or public.is_moderator());
-- no direct insert/update policy — writes only via the SECURITY DEFINER RPCs below


-- ============================================================================
-- 7. Storage bucket + RLS for ID verification photos
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('verification-docs', 'verification-docs', false)
on conflict (id) do nothing;

drop policy if exists verdocs_insert_own on storage.objects;
create policy verdocs_insert_own on storage.objects
  for insert to authenticated
  with check (bucket_id = 'verification-docs'
              and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists verdocs_select_own_or_mod on storage.objects;
create policy verdocs_select_own_or_mod on storage.objects
  for select to authenticated
  using (bucket_id = 'verification-docs'
         and ((storage.foldername(name))[1] = auth.uid()::text or public.is_moderator()));

drop policy if exists verdocs_update_own on storage.objects;
create policy verdocs_update_own on storage.objects
  for update to authenticated
  using (bucket_id = 'verification-docs' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists verdocs_delete_own_or_mod on storage.objects;
create policy verdocs_delete_own_or_mod on storage.objects
  for delete to authenticated
  using (bucket_id = 'verification-docs'
         and ((storage.foldername(name))[1] = auth.uid()::text or public.is_moderator()));


-- ============================================================================
-- 8. Verification RPCs
-- ============================================================================

create or replace function public.submit_verification_request(
  p_type text, p_submission_data jsonb default '{}'::jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_id uuid;
begin
  if v_me is null then
    raise exception 'Authentication required' using errcode = 'insufficient_privilege';
  end if;
  if p_type not in ('id_document', 'community') then
    raise exception 'Unknown verification type: %', p_type using errcode = 'check_violation';
  end if;

  if exists (select 1 from public.verification_requests
              where user_id = v_me and type = p_type and status = 'approved') then
    raise exception 'You are already verified for %', p_type using errcode = 'unique_violation';
  end if;
  if exists (select 1 from public.verification_requests
              where user_id = v_me and type = p_type and status = 'pending') then
    raise exception 'You already have a pending % request', p_type using errcode = 'unique_violation';
  end if;

  insert into public.verification_requests(user_id, type, submission_data)
  values (v_me, p_type, coalesce(p_submission_data, '{}'::jsonb))
  returning id into v_id;

  return v_id;
end $$;

create or replace function public.review_verification_request(
  p_request_id uuid, p_approve boolean, p_review_note text default null)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  v_actor uuid := auth.uid();
  r public.verification_requests%rowtype;
begin
  if not public.is_moderator(v_actor) then
    raise exception 'Moderator privileges required' using errcode = 'insufficient_privilege';
  end if;

  select * into r from public.verification_requests where id = p_request_id for update;
  if not found then
    raise exception 'Request not found' using errcode = 'no_data_found';
  end if;
  if r.status <> 'pending' then
    raise exception 'Request already %', r.status using errcode = 'check_violation';
  end if;

  update public.verification_requests
     set status = case when p_approve then 'approved' else 'rejected' end,
         reviewed_by = v_actor, reviewed_at = now(), review_note = p_review_note
   where id = p_request_id;

  if p_approve then
    if r.type = 'id_document' then
      update public.profiles set id_verified_at = now() where id = r.user_id;
    elsif r.type = 'community' then
      update public.profiles set community_verified_at = now() where id = r.user_id;
    end if;
    perform public.notify_user(r.user_id, 'verification_approved',
      'Verification approved',
      case when r.type = 'id_document' then 'Your ID verification was approved.'
           else 'Your community verification was approved.' end,
      jsonb_build_object('type', r.type, 'request_id', r.id));
  else
    perform public.notify_user(r.user_id, 'verification_rejected',
      'Verification not approved',
      coalesce(p_review_note, 'Your verification request was not approved. You can resubmit.'),
      jsonb_build_object('type', r.type, 'request_id', r.id));
  end if;

  return jsonb_build_object(
    'status', case when p_approve then 'approved' else 'rejected' end,
    'type', r.type, 'user_id', r.user_id
  );
end $$;

grant execute on function public.submit_verification_request(text, jsonb) to authenticated;
grant execute on function public.review_verification_request(uuid, boolean, text) to authenticated;


-- ============================================================================
-- 9. session_feedback — private ratings, never visible to the rated user
-- ============================================================================

create table if not exists public.session_feedback (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references public.sessions(id) on delete cascade,
  rater_id      uuid not null references public.profiles(id) on delete cascade,
  rated_user_id uuid not null references public.profiles(id) on delete cascade,
  signal        text not null check (signal in ('positive', 'negative')),
  tags          jsonb not null default '[]'::jsonb,
  note          text,
  created_at    timestamptz not null default now(),
  unique (session_id, rater_id, rated_user_id),
  constraint feedback_not_self_chk check (rater_id <> rated_user_id)
);
create index if not exists feedback_rated_idx on public.session_feedback (rated_user_id, signal, created_at desc);

alter table public.session_feedback enable row level security;

drop policy if exists feedback_select_rater_or_mod on public.session_feedback;
create policy feedback_select_rater_or_mod on public.session_feedback
  for select using (rater_id = auth.uid() or public.is_moderator());
-- no insert policy — writes only via the RPC below; the rated user gets NO select access at all


-- ============================================================================
-- 10. submit_session_feedback — connects feedback to reputation signals
-- ============================================================================

create or replace function public.submit_session_feedback(
  p_session_id uuid, p_rated_user_id uuid, p_signal text,
  p_tags jsonb default '[]'::jsonb, p_note text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_room uuid;
begin
  if v_me is null then
    raise exception 'Authentication required' using errcode = 'insufficient_privilege';
  end if;
  if p_signal not in ('positive', 'negative') then
    raise exception 'Invalid signal: %', p_signal using errcode = 'check_violation';
  end if;
  if v_me = p_rated_user_id then
    raise exception 'You cannot rate yourself' using errcode = 'check_violation';
  end if;

  select coalesce(matched_into_session_id, id) into v_room
    from public.sessions where id = p_session_id;
  if v_room is null then
    raise exception 'Session not found' using errcode = 'no_data_found';
  end if;

  if not exists (select 1 from public.sessions where id = v_room and status = 'Completed') then
    raise exception 'You can only leave feedback after the session is completed'
      using errcode = 'check_violation';
  end if;

  if not (exists (select 1 from public.sessions s where s.id = v_room and s.host_id = v_me)
       or exists (select 1 from public.match_handshakes h
                   where h.session_id = v_room and h.candidate_id = v_me)) then
    raise exception 'You were not part of this session' using errcode = 'insufficient_privilege';
  end if;

  if not (exists (select 1 from public.sessions s where s.id = v_room and s.host_id = p_rated_user_id)
       or exists (select 1 from public.match_handshakes h
                   where h.session_id = v_room and h.candidate_id = p_rated_user_id)) then
    raise exception 'That person was not in this session' using errcode = 'check_violation';
  end if;

  begin
    insert into public.session_feedback(session_id, rater_id, rated_user_id, signal, tags, note)
    values (v_room, v_me, p_rated_user_id, p_signal, coalesce(p_tags, '[]'::jsonb), p_note);
  exception when unique_violation then
    raise exception 'You already left feedback for this person in this session'
      using errcode = 'unique_violation';
  end;

  update public.profiles
     set total_connections = coalesce(total_connections, 0) + 1,
         positive_signals  = coalesce(positive_signals, 0) + (case when p_signal = 'positive' then 1 else 0 end)
   where id = p_rated_user_id;

  return jsonb_build_object('ok', true, 'signal', p_signal, 'room_id', v_room);
end $$;

grant execute on function public.submit_session_feedback(uuid, uuid, text, jsonb, text) to authenticated;
