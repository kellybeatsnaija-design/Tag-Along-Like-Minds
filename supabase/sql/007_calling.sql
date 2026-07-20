-- ============================================================================
-- Tag Along — Real In-App Voice/Video Calling (Daily.co)
-- Run AFTER 001_matching_queue.sql through 006_realtime_publication_fix.sql.
-- Paste this whole file into the Supabase SQL Editor and run it top-to-bottom.
-- Idempotent — safe to re-run.
-- ============================================================================

-- pg_net (used by notify_user) is fire-and-forget — wrong tool here, since
-- creating a room and minting a token both need their JSON response read
-- inline, in the same call, before we can answer the client. The `http`
-- extension gives a synchronous request/response instead.
create extension if not exists http with schema extensions;

-- ============================================================================
-- 1. SECRET — run this ONE line by hand, with your real Daily API key.
--    Never commit the real value. Read only inside SECURITY DEFINER
--    functions below (never returned/logged), same idiom as the existing
--    tagalong.bypass_actor_rules GUC in 002_safety_moderation.sql.
-- ============================================================================
-- alter database postgres set app.daily_api_key = '<your real Daily API key>';


-- ============================================================================
-- 2. SCHEMA — replace phone/meeting-link with an in-app call room
-- ============================================================================

alter table public.sessions
  add column if not exists call_room_name text,
  add column if not exists call_room_url  text,
  drop column if exists meeting_link;

alter table public.profiles
  drop column if exists phone_number;

update public.sessions set connection_mode = 'call' where connection_mode in ('voice', 'meeting');


-- ============================================================================
-- 3. is_session_participant — "who's actually still in this session"
--    Mirrors the host-or-accepted-handshake check already used in
--    submit_session_feedback / leave_session, but also excludes anyone
--    (including the host) who has since exited.
-- ============================================================================

create or replace function public.is_session_participant(
  p_room_id uuid, p_uid uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select
    (
      exists (select 1 from public.sessions s
               where s.id = p_room_id and s.host_id = p_uid)
      or exists (select 1 from public.match_handshakes h
                  where h.session_id = p_room_id
                    and h.candidate_id = p_uid and h.status = 'accepted')
    )
    and not exists (select 1 from public.session_exits e
                     where e.session_id = p_room_id and e.user_id = p_uid
                       and e.exit_type in ('left', 'removed'));
$$;

grant execute on function public.is_session_participant(uuid, uuid) to authenticated;


-- ============================================================================
-- 4. get_or_create_call_room — the one client-facing RPC. Creates the Daily
--    room on first call for a session (idempotent after that), mints a
--    per-user meeting token, and returns both in one round trip. Only ever
--    called from a single interactive "join call" tap — never from a
--    trigger, cron job, or bulk loop, since the HTTP round trip blocks the
--    backend for its duration.
-- ============================================================================

create or replace function public.get_or_create_call_room(p_session_id uuid)
returns jsonb
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_me         uuid := auth.uid();
  v_room       uuid;
  v_status     text;
  v_host_id    uuid;
  v_group_size int;
  v_room_name  text;
  v_room_url   text;
  v_api_key    text := current_setting('app.daily_api_key', true);
  v_resp       extensions.http_response;
  v_body       jsonb;
  v_token      text;
begin
  if v_me is null then
    raise exception 'Authentication required' using errcode = 'insufficient_privilege';
  end if;
  if v_api_key is null or length(v_api_key) = 0 then
    raise exception 'Calling is not configured' using errcode = 'internal_error';
  end if;

  select coalesce(matched_into_session_id, id) into v_room
    from public.sessions where id = p_session_id;
  if v_room is null then
    raise exception 'Session not found' using errcode = 'no_data_found';
  end if;

  if not public.is_session_participant(v_room, v_me) then
    raise exception 'Not a participant of this session' using errcode = 'insufficient_privilege';
  end if;

  select status, host_id, group_size, call_room_name, call_room_url
    into v_status, v_host_id, v_group_size, v_room_name, v_room_url
    from public.sessions where id = v_room
    for update;

  if v_status <> 'Ready' then
    raise exception 'This session is not active' using errcode = 'check_violation';
  end if;

  perform extensions.http_set_curlopt('CURLOPT_TIMEOUT_MS', '5000');
  perform extensions.http_set_curlopt('CURLOPT_CONNECTTIMEOUT_MS', '3000');

  if v_room_name is null then
    select * into v_resp from extensions.http((
      'POST',
      'https://api.daily.co/v1/rooms',
      array[extensions.http_header('Authorization', 'Bearer ' || v_api_key)],
      'application/json',
      jsonb_build_object(
        'name', 'tag-' || replace(v_room::text, '-', ''),
        'privacy', 'private',
        'properties', jsonb_build_object(
          'exp', extract(epoch from now() + interval '6 hours')::int,
          'eject_at_room_exp', true,
          'enable_chat', false,
          'enable_screenshare', false,
          'start_video_off', true,
          'start_audio_off', false,
          'max_participants', greatest(coalesce(v_group_size, 2), 2)
        )
      )::text
    )::extensions.http_request);

    if v_resp.status not in (200, 201) then
      raise exception 'Failed to create call room (status %): %', v_resp.status, v_resp.content
        using errcode = 'internal_error';
    end if;

    v_body      := v_resp.content::jsonb;
    v_room_name := v_body->>'name';
    v_room_url  := v_body->>'url';

    update public.sessions
       set call_room_name = v_room_name, call_room_url = v_room_url
     where id = v_room;
  end if;

  select * into v_resp from extensions.http((
    'POST',
    'https://api.daily.co/v1/meeting-tokens',
    array[extensions.http_header('Authorization', 'Bearer ' || v_api_key)],
    'application/json',
    jsonb_build_object(
      'properties', jsonb_build_object(
        'room_name', v_room_name,
        'user_id', v_me::text,
        'is_owner', (v_me = v_host_id),
        'exp', extract(epoch from now() + interval '2 hours')::int
      )
    )::text
  )::extensions.http_request);

  if v_resp.status not in (200, 201) then
    raise exception 'Failed to mint call token (status %): %', v_resp.status, v_resp.content
      using errcode = 'internal_error';
  end if;

  v_token := (v_resp.content::jsonb)->>'token';

  return jsonb_build_object('room_url', v_room_url, 'room_name', v_room_name, 'token', v_token);
end $$;

grant execute on function public.get_or_create_call_room(uuid) to authenticated;


-- ============================================================================
-- 5. run_session_maintenance — best-effort room teardown the instant a
--    session completes (the room's own exp/eject_at_room_exp TTL, set at
--    creation above, is the guaranteed cleanup path either way).
-- ============================================================================

create or replace function public.run_session_maintenance()
returns void language plpgsql security definer set search_path = public, extensions as $$
declare
  v_api_key text := current_setting('app.daily_api_key', true);
  r         record;
begin
  update public.sessions
     set status = 'Expired'
   where status in ('Queued','Matching','Partially Matched')
     and now() >= expires_at;

  for r in
    select id, call_room_name from public.sessions
     where status = 'Ready'
       and (
            (last_activity_at < now() - interval '24 hours'
               and exists (select 1 from public.messages m where m.session_id = sessions.id))
         or (ready_at < now() - interval '48 hours'
               and not exists (select 1 from public.messages m where m.session_id = sessions.id))
       )
  loop
    update public.sessions set status = 'Completed', completed_at = now() where id = r.id;

    if r.call_room_name is not null and v_api_key is not null then
      begin
        perform extensions.http_set_curlopt('CURLOPT_TIMEOUT_MS', '4000');
        perform extensions.http((
          'DELETE',
          'https://api.daily.co/v1/rooms/' || r.call_room_name,
          array[extensions.http_header('Authorization', 'Bearer ' || v_api_key)],
          null, null
        )::extensions.http_request);
      exception when others then
        null; -- best-effort; the room's own exp/eject_at_room_exp TTL still cleans it up
      end;
    end if;
  end loop;
end $$;


-- ============================================================================
-- 6. run_session_reminders — simplified to the single 'call' connection mode
-- ============================================================================

create or replace function public.run_session_reminders()
returns void language plpgsql security definer set search_path = public, extensions as $$
declare
  s record;
  h record;
begin
  for s in
    select * from public.sessions
    where scheduled_at is not null
      and reminder_sent_at is null
      and connection_mode = 'call'
      and scheduled_at between now() and now() + interval '30 minutes'
      and status not in ('Cancelled', 'Expired', 'Completed')
  loop
    perform public.notify_user(s.host_id, 'session_reminder',
      'Starting soon', 'Your "' || s.intent || '" call starts in about 30 minutes.',
      jsonb_build_object('session_id', s.id));

    for h in select candidate_id from public.match_handshakes
              where session_id = s.id and status = 'accepted' loop
      perform public.notify_user(h.candidate_id, 'session_reminder',
        'Starting soon', 'Your "' || s.intent || '" call starts in about 30 minutes.',
        jsonb_build_object('session_id', s.id));
    end loop;

    update public.sessions set reminder_sent_at = now() where id = s.id;
  end loop;
end $$;
