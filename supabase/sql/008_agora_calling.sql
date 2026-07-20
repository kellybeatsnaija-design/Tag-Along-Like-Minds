-- ============================================================================
-- Tag Along — Swap Calling Provider: Daily.co → Agora
-- Run AFTER 001_matching_queue.sql through 007_calling.sql.
-- Paste this whole file into the Supabase SQL Editor and run it top-to-bottom.
-- Idempotent — safe to re-run.
-- ============================================================================

-- ============================================================================
-- 1. SECRETS — run these three lines by hand, with real values.
--    Never commit the real values. <project-ref> is your Supabase project
--    ref; INTERNAL_SECRET must match the same value set via
--    `supabase secrets set INTERNAL_SECRET=...` for the agora-token function.
--    app.agora_app_id is not secret (the client needs it too) but lives here
--    so get_or_create_call_room can hand it back in one round trip.
-- ============================================================================
-- alter database postgres set app.agora_function_url = 'https://<project-ref>.supabase.co/functions/v1/agora-token';
-- alter database postgres set app.agora_function_secret = '<same INTERNAL_SECRET as the deployed function>';
-- alter database postgres set app.agora_app_id = '<your Agora App ID>';

-- ============================================================================
-- 2. SCHEMA — Agora channels have no URL (unlike Daily rooms); call_room_name
--    is reused as-is, now meaning "the Agora channel name" instead of "the
--    Daily room name".
-- ============================================================================

alter table public.sessions drop column if exists call_room_url;


-- ============================================================================
-- 3. get_or_create_call_room — no more "create room" REST call at all (an
--    Agora channel is just a string, nothing to provision) — only a token
--    needs minting, via the agora-token Edge Function.
-- ============================================================================

create or replace function public.get_or_create_call_room(p_session_id uuid)
returns jsonb
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_me            uuid := auth.uid();
  v_room          uuid;
  v_status        text;
  v_room_name     text;
  v_function_url  text := current_setting('app.agora_function_url', true);
  v_function_key  text := current_setting('app.agora_function_secret', true);
  v_agora_app_id  text := current_setting('app.agora_app_id', true);
  v_uid           bigint;
  v_resp          extensions.http_response;
  v_token         text;
begin
  if v_me is null then
    raise exception 'Authentication required' using errcode = 'insufficient_privilege';
  end if;
  if v_function_url is null or v_function_key is null or v_agora_app_id is null then
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

  select status, call_room_name into v_status, v_room_name
    from public.sessions where id = v_room
    for update;

  if v_status <> 'Ready' then
    raise exception 'This session is not active' using errcode = 'check_violation';
  end if;

  if v_room_name is null then
    v_room_name := 'tag-' || replace(v_room::text, '-', '');
    update public.sessions set call_room_name = v_room_name where id = v_room;
  end if;

  -- Agora wants a 32-bit unsigned int uid, not a UUID — derive one
  -- deterministically from the caller's own id so it's stable across joins.
  v_uid := abs(hashtext(v_me::text));

  perform extensions.http_set_curlopt('CURLOPT_TIMEOUT_MS', '5000');
  perform extensions.http_set_curlopt('CURLOPT_CONNECTTIMEOUT_MS', '3000');

  select * into v_resp from extensions.http((
    'POST',
    v_function_url,
    array[
      extensions.http_header('x-internal-secret', v_function_key),
      extensions.http_header('Content-Type', 'application/json')
    ],
    'application/json',
    jsonb_build_object('channelName', v_room_name, 'uid', v_uid, 'role', 'publisher')::text
  )::extensions.http_request);

  if v_resp.status <> 200 then
    raise exception 'Failed to mint call token (status %): %', v_resp.status, v_resp.content
      using errcode = 'internal_error';
  end if;

  v_token := (v_resp.content::jsonb)->>'token';

  return jsonb_build_object(
    'channel_name', v_room_name,
    'app_id', v_agora_app_id,
    'uid', v_uid,
    'token', v_token
  );
end $$;

grant execute on function public.get_or_create_call_room(uuid) to authenticated;


-- ============================================================================
-- 4. run_session_maintenance — drop the Daily room-DELETE block entirely;
--    Agora channels are ephemeral and need no explicit cleanup once empty.
-- ============================================================================

create or replace function public.run_session_maintenance()
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.sessions
     set status = 'Expired'
   where status in ('Queued','Matching','Partially Matched')
     and now() >= expires_at;

  update public.sessions
     set status = 'Completed', completed_at = now()
   where status = 'Ready'
     and (
          (last_activity_at < now() - interval '24 hours'
             and exists (select 1 from public.messages m where m.session_id = sessions.id))
       or (ready_at < now() - interval '48 hours'
             and not exists (select 1 from public.messages m where m.session_id = sessions.id))
     );
end $$;
