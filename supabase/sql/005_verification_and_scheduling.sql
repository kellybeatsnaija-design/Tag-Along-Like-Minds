-- ============================================================================
-- Tag Along — Activity-Based Community Verification, Re-Evaluation & Scheduling
-- Run AFTER 001_matching_queue.sql through 004_profile_settings.sql.
-- Paste this whole file into the Supabase SQL Editor and run it top-to-bottom.
-- Idempotent — safe to re-run.
-- ============================================================================


-- ============================================================================
-- 1. NEW COLUMNS
-- ============================================================================

alter table public.profiles
  add column if not exists phone_number text,
  add column if not exists community_last_reviewed_at timestamptz,
  add column if not exists community_reverification_flagged_at timestamptz;

alter table public.sessions
  add column if not exists scheduled_at timestamptz,
  add column if not exists meeting_link text,
  add column if not exists reminder_sent_at timestamptz;


-- ============================================================================
-- 2. submit_verification_request — notify moderators on community applications
-- ============================================================================

create or replace function public.submit_verification_request(
  p_type text, p_submission_data jsonb default '{}'::jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_id uuid;
  v_mod_id uuid;
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

  if p_type = 'community' then
    for v_mod_id in select id from public.profiles where is_moderator = true loop
      perform public.notify_user(v_mod_id, 'community_verification_submitted',
        'Community verification request',
        'A member applied for community verification — review their activity before deciding.',
        jsonb_build_object('request_id', v_id, 'user_id', v_me));
    end loop;
  end if;

  return v_id;
end $$;

grant execute on function public.submit_verification_request(text, jsonb) to authenticated;


-- ============================================================================
-- 3. review_verification_request — stamp the review clock on community approval
-- ============================================================================

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
      update public.profiles
         set community_verified_at = now(), community_last_reviewed_at = now()
       where id = r.user_id;
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

grant execute on function public.review_verification_request(uuid, boolean, text) to authenticated;


-- ============================================================================
-- 4. get_verification_review_context — real activity signals for moderators
-- ============================================================================

create or replace function public.get_verification_review_context(p_user_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_profile record;
  v_feedback jsonb;
begin
  if not public.is_moderator() then
    raise exception 'Moderator privileges required' using errcode = 'insufficient_privilege';
  end if;

  select total_connections, positive_signals, community_verified_at, community_last_reviewed_at
    into v_profile from public.profiles where id = p_user_id;

  select coalesce(jsonb_agg(jsonb_build_object(
           'signal', signal, 'tags', tags, 'note', note, 'created_at', created_at
         ) order by created_at desc), '[]'::jsonb)
    into v_feedback
    from (select * from public.session_feedback
           where rated_user_id = p_user_id order by created_at desc limit 10) f;

  return jsonb_build_object(
    'total_connections', coalesce(v_profile.total_connections, 0),
    'positive_signals', coalesce(v_profile.positive_signals, 0),
    'reputation_state', public.reputation_state(p_user_id),
    'community_verified_at', v_profile.community_verified_at,
    'community_last_reviewed_at', v_profile.community_last_reviewed_at,
    'recent_feedback', v_feedback
  );
end $$;

grant execute on function public.get_verification_review_context(uuid) to authenticated;


-- ============================================================================
-- 5. resolve_community_reverification — moderator confirms or revokes
-- ============================================================================

create or replace function public.resolve_community_reverification(
  p_user_id uuid, p_revoke boolean, p_note text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_actor uuid := auth.uid();
begin
  if not public.is_moderator(v_actor) then
    raise exception 'Moderator privileges required' using errcode = 'insufficient_privilege';
  end if;
  if not exists (select 1 from public.profiles where id = p_user_id and community_reverification_flagged_at is not null) then
    raise exception 'No pending re-evaluation for this user' using errcode = 'no_data_found';
  end if;

  if p_revoke then
    update public.profiles
       set community_verified_at = null,
           community_reverification_flagged_at = null,
           community_last_reviewed_at = now()
     where id = p_user_id;
    perform public.notify_user(p_user_id, 'community_verification_revoked',
      'Community verification removed',
      coalesce(p_note, 'Your community verification was removed after a routine review.'),
      '{}'::jsonb);
  else
    update public.profiles
       set community_reverification_flagged_at = null,
           community_last_reviewed_at = now()
     where id = p_user_id;
  end if;

  return jsonb_build_object('user_id', p_user_id, 'revoked', p_revoke);
end $$;

grant execute on function public.resolve_community_reverification(uuid, boolean, text) to authenticated;


-- ============================================================================
-- 6. flag_community_reverifications — periodic job, flags for moderator review
--    (never auto-revokes; a human always makes the final call)
-- ============================================================================

create or replace function public.flag_community_reverifications()
returns void language plpgsql security definer set search_path = public as $$
declare
  r record;
  v_positive int;
  v_negative int;
begin
  for r in
    select id from public.profiles
    where community_verified_at is not null
      and community_reverification_flagged_at is null
      and coalesce(community_last_reviewed_at, community_verified_at) < now() - interval '30 days'
  loop
    select count(*) filter (where signal = 'positive'),
           count(*) filter (where signal = 'negative')
      into v_positive, v_negative
      from public.session_feedback
     where rated_user_id = r.id and created_at > now() - interval '30 days';

    if v_negative >= 2 or (v_negative > 0 and v_negative >= v_positive) then
      update public.profiles set community_reverification_flagged_at = now() where id = r.id;
    else
      update public.profiles set community_last_reviewed_at = now() where id = r.id;
    end if;
  end loop;
end $$;


-- ============================================================================
-- 7. run_session_reminders — periodic job, reminds hosts + matched partners
--    of upcoming scheduled calls/meetings
-- ============================================================================

create or replace function public.run_session_reminders()
returns void language plpgsql security definer set search_path = public, extensions as $$
declare
  s record;
  h record;
  v_kind text;
begin
  for s in
    select * from public.sessions
    where scheduled_at is not null
      and reminder_sent_at is null
      and connection_mode in ('voice', 'meeting')
      and scheduled_at between now() and now() + interval '30 minutes'
      and status not in ('Cancelled', 'Expired', 'Completed')
  loop
    v_kind := case when s.connection_mode = 'voice' then 'call' else 'meeting' end;

    perform public.notify_user(s.host_id, 'session_reminder',
      'Starting soon', 'Your "' || s.intent || '" ' || v_kind || ' starts in about 30 minutes.',
      jsonb_build_object('session_id', s.id));

    for h in select candidate_id from public.match_handshakes
              where session_id = s.id and status = 'accepted' loop
      perform public.notify_user(h.candidate_id, 'session_reminder',
        'Starting soon', 'Your "' || s.intent || '" ' || v_kind || ' starts in about 30 minutes.',
        jsonb_build_object('session_id', s.id));
    end loop;

    update public.sessions set reminder_sent_at = now() where id = s.id;
  end loop;
end $$;


-- ============================================================================
-- 8. SCHEDULE — pg_cron
-- ============================================================================

select cron.schedule('tagalong_community_reeval', '0 3 * * *', $$ select public.flag_community_reverifications(); $$);
select cron.schedule('tagalong_reminders', '*/5 * * * *', $$ select public.run_session_reminders(); $$);
