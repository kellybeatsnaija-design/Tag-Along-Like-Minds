-- ============================================================================
-- Tag Along — Safety & Moderation System
-- Run AFTER 001_matching_queue.sql. Paste this whole file into the Supabase
-- SQL Editor and run it top-to-bottom. Idempotent — safe to re-run.
-- ============================================================================


-- ============================================================================
-- 0. profiles.is_moderator + helper
-- ============================================================================

alter table public.profiles
  add column if not exists is_moderator boolean not null default false;

create or replace function public.is_moderator(p_uid uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select p.is_moderator from public.profiles p where p.id = p_uid), false);
$$;


-- ============================================================================
-- 1. NEW TABLES
-- ============================================================================

create table if not exists public.reports (
  id               uuid primary key default gen_random_uuid(),
  reporter_id      uuid not null references public.profiles(id) on delete cascade,
  reported_user_id uuid not null references public.profiles(id) on delete cascade,
  session_id       uuid references public.sessions(id) on delete set null,
  reason           text not null,
  details          text,
  status           text not null default 'pending'
                     check (status in ('pending','reviewed','actioned','dismissed')),
  created_at       timestamptz not null default now(),
  reviewed_at      timestamptz,
  reviewed_by      uuid references public.profiles(id),
  constraint reports_reason_chk check (reason in
    ('harassment','safety_concern','inappropriate_behavior','spam','no_show','impersonation','other')),
  constraint reports_not_self_chk check (reporter_id <> reported_user_id)
);
create index if not exists reports_reported_idx on public.reports (reported_user_id, created_at desc);
create index if not exists reports_status_idx   on public.reports (status, created_at desc);
create index if not exists reports_reporter_idx on public.reports (reporter_id, created_at desc);

create table if not exists public.blocked_users (
  id         uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  reason     text,
  created_at timestamptz not null default now(),
  unique (blocker_id, blocked_id),
  constraint blocked_not_self_chk check (blocker_id <> blocked_id)
);
create index if not exists blocked_blocked_idx on public.blocked_users (blocked_id, blocker_id);

create table if not exists public.moderation_events (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles(id) on delete cascade,
  event_type        text not null check (event_type in
                      ('warning','strike','restriction','suspension','ban','report_dismissed')),
  reason            text,
  related_report_id uuid references public.reports(id) on delete set null,
  created_at        timestamptz not null default now(),
  expires_at        timestamptz,
  issued_by         uuid references public.profiles(id)
);
create index if not exists modevents_user_idx on public.moderation_events (user_id, created_at desc);
create index if not exists modevents_active_idx on public.moderation_events (user_id, event_type, expires_at);

create table if not exists public.session_exits (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  exit_type  text not null check (exit_type in ('left','completed','removed')),
  created_at timestamptz not null default now()
);
create index if not exists session_exits_room_idx on public.session_exits (session_id, user_id);
create index if not exists session_exits_user_idx on public.session_exits (user_id, created_at desc);

alter table public.match_handshakes drop constraint if exists match_handshakes_status_chk;
alter table public.match_handshakes
  add constraint match_handshakes_status_chk check (status in ('accepted','left','removed'));

alter table public.reports           enable row level security;
alter table public.blocked_users     enable row level security;
alter table public.moderation_events enable row level security;
alter table public.session_exits     enable row level security;


-- ============================================================================
-- 2. RLS
-- ============================================================================

drop policy if exists reports_insert_own on public.reports;
create policy reports_insert_own on public.reports
  for insert with check (reporter_id = auth.uid());

drop policy if exists reports_select_own_or_mod on public.reports;
create policy reports_select_own_or_mod on public.reports
  for select using (reporter_id = auth.uid() or public.is_moderator());

drop policy if exists reports_update_mod on public.reports;
create policy reports_update_mod on public.reports
  for update using (public.is_moderator()) with check (public.is_moderator());

drop policy if exists blocks_insert_own on public.blocked_users;
create policy blocks_insert_own on public.blocked_users
  for insert with check (blocker_id = auth.uid());
drop policy if exists blocks_select_own on public.blocked_users;
create policy blocks_select_own on public.blocked_users
  for select using (blocker_id = auth.uid());
drop policy if exists blocks_delete_own on public.blocked_users;
create policy blocks_delete_own on public.blocked_users
  for delete using (blocker_id = auth.uid());

drop policy if exists modevents_select_own_or_mod on public.moderation_events;
create policy modevents_select_own_or_mod on public.moderation_events
  for select using (user_id = auth.uid() or public.is_moderator());

drop policy if exists exits_select_visible on public.session_exits;
create policy exits_select_visible on public.session_exits
  for select using (
    user_id = auth.uid()
    or exists (select 1 from public.sessions s
                where s.id = session_exits.session_id and s.host_id = auth.uid())
    or exists (select 1 from public.match_handshakes h
                where h.session_id = session_exits.session_id
                  and h.candidate_id = auth.uid())
  );

alter publication supabase_realtime add table public.moderation_events;


-- ============================================================================
-- 3. STANDING + COOLDOWN HELPERS
-- ============================================================================

create or replace function public.get_user_standing(p_user_id uuid)
returns text language sql stable security definer set search_path = public as $$
  select case
    when exists (select 1 from public.moderation_events e
                  where e.user_id = p_user_id and e.event_type = 'ban') then 'banned'
    when exists (select 1 from public.moderation_events e
                  where e.user_id = p_user_id and e.event_type = 'suspension'
                    and (e.expires_at is null or e.expires_at > now())) then 'suspended'
    when exists (select 1 from public.moderation_events e
                  where e.user_id = p_user_id and e.event_type = 'restriction'
                    and (e.expires_at is null or e.expires_at > now())) then 'restricted'
    else 'active'
  end;
$$;

create or replace function public.users_recently_matched(
  p_a uuid, p_b uuid, p_within interval default interval '5 days')
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
      select 1 from public.match_handshakes h
        join public.sessions s on s.id = h.session_id
       where s.host_id = p_a and h.candidate_id = p_b
         and h.created_at > now() - p_within
    union all
      select 1 from public.match_handshakes h
        join public.sessions s on s.id = h.session_id
       where s.host_id = p_b and h.candidate_id = p_a
         and h.created_at > now() - p_within
    union all
      select 1 from public.match_handshakes h1
        join public.match_handshakes h2 on h1.session_id = h2.session_id
       where h1.candidate_id = p_a and h2.candidate_id = p_b
         and h1.candidate_id <> h2.candidate_id
         and greatest(h1.created_at, h2.created_at) > now() - p_within
  );
$$;


-- ============================================================================
-- 4. SESSION-CREATION STANDING GATE
-- ============================================================================

create or replace function public.enforce_session_standing()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_standing text;
begin
  if auth.uid() is not null then
    v_standing := public.get_user_standing(new.host_id);
    if v_standing <> 'active' then
      raise exception 'Your account is % and cannot create new sessions.', v_standing
        using errcode = 'insufficient_privilege';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_enforce_session_standing on public.sessions;
create trigger trg_enforce_session_standing
  before insert on public.sessions
  for each row execute function public.enforce_session_standing();


-- ============================================================================
-- 5. enforce_session_rules — add bypass flag, remove participant self-mutation
-- ============================================================================

create or replace function public.enforce_session_rules()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_uid    uuid    := auth.uid();
  v_is_job boolean := (v_uid is null);
  v_bypass boolean := coalesce(current_setting('tagalong.bypass_actor_rules', true) = 'on', false);
begin
  if new.status is distinct from old.status then
    if not (
      (old.status = 'Queued'                    and new.status in ('Matching','Cancelled','Expired')) or
      (old.status = 'Matching'                  and new.status in ('Partially Matched','Waiting for Confirmation','Ready','Queued','Cancelled','Expired')) or
      (old.status = 'Partially Matched'         and new.status in ('Waiting for Confirmation','Ready','Matching','Cancelled','Expired')) or
      (old.status = 'Waiting for Confirmation'  and new.status in ('Ready','Partially Matched')) or
      (old.status = 'Ready'                     and new.status in ('Completed'))
    ) then
      raise exception 'Illegal session status transition: % -> %', old.status, new.status
        using errcode = 'check_violation';
    end if;
  end if;

  if new.status = 'Completed' and old.status <> 'Completed' then
    new.completed_at := now();
  end if;

  if v_is_job or v_bypass then
    return new;
  end if;

  if v_uid = old.host_id then
    if (new.intent        is distinct from old.intent
        or new.group_size  is distinct from old.group_size
        or new.comfort_mode is distinct from old.comfort_mode)
       and old.status not in ('Queued','Partially Matched') then
      raise exception 'Session content can only be edited while Queued or Partially Matched'
        using errcode = 'check_violation';
    end if;
    if new.status = 'Cancelled' and old.status not in ('Queued','Partially Matched') then
      raise exception 'Cancel only allowed from Queued or Partially Matched'
        using errcode = 'check_violation';
    end if;
  else
    raise exception 'Only the host may modify this session (use Leave to exit).'
      using errcode = 'insufficient_privilege';
  end if;

  return new;
end $$;

drop trigger if exists trg_enforce_session_rules on public.sessions;
create trigger trg_enforce_session_rules
  before update on public.sessions
  for each row execute function public.enforce_session_rules();


-- ============================================================================
-- 6. leave_session — individual exit, room continues
-- ============================================================================

create or replace function public.leave_session(p_session_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_room      uuid;
  v_host      uuid;
  v_me        uuid := auth.uid();
  v_is_host   boolean;
  v_remaining int;
begin
  if v_me is null then
    raise exception 'Authentication required' using errcode = 'insufficient_privilege';
  end if;

  select coalesce(s.matched_into_session_id, s.id) into v_room
    from public.sessions s where s.id = p_session_id;
  if v_room is null then
    raise exception 'Session not found' using errcode = 'no_data_found';
  end if;

  select host_id into v_host from public.sessions where id = v_room;
  v_is_host := (v_host = v_me);

  if not v_is_host and not exists (
      select 1 from public.match_handshakes h
       where h.session_id = v_room and h.candidate_id = v_me and h.status = 'accepted') then
    raise exception 'Not an active participant of this session' using errcode = 'insufficient_privilege';
  end if;

  perform set_config('tagalong.bypass_actor_rules', 'on', true);

  if not v_is_host then
    update public.match_handshakes
       set status = 'left'
     where session_id = v_room and candidate_id = v_me and status = 'accepted';

    update public.sessions
       set status = 'Completed', completed_at = now()
     where host_id = v_me and matched_into_session_id = v_room and status = 'Ready';
  end if;

  insert into public.session_exits(session_id, user_id, exit_type)
  values (v_room, v_me, 'left');

  select (select count(*) from public.match_handshakes h
            where h.session_id = v_room and h.status = 'accepted')
         + (case when exists (select 1 from public.session_exits e
                                where e.session_id = v_room and e.user_id = v_host
                                  and e.exit_type in ('left','removed'))
                 then 0 else 1 end)
    into v_remaining;

  if v_remaining <= 0 then
    update public.sessions set status = 'Completed', completed_at = now()
      where id = v_room and status = 'Ready';
    update public.sessions set status = 'Completed', completed_at = now()
      where matched_into_session_id = v_room and status = 'Ready' and id <> v_room;
  end if;

  perform set_config('tagalong.bypass_actor_rules', 'off', true);
end $$;

grant execute on function public.leave_session(uuid) to authenticated;


-- ============================================================================
-- 7. complete_session — now host-only
-- ============================================================================

create or replace function public.complete_session(p_session_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_room uuid;
begin
  select coalesce(matched_into_session_id, id) into v_room
    from public.sessions where id = p_session_id;
  if v_room is null then
    raise exception 'Session not found' using errcode = 'no_data_found';
  end if;

  if not exists (select 1 from public.sessions s
                  where s.id = v_room and s.host_id = auth.uid()) then
    raise exception 'Only the host may complete this session' using errcode = 'insufficient_privilege';
  end if;

  perform set_config('tagalong.bypass_actor_rules', 'on', true);
  update public.sessions set status = 'Completed', completed_at = now()
    where id = v_room and status = 'Ready';
  update public.sessions set status = 'Completed', completed_at = now()
    where matched_into_session_id = v_room and status = 'Ready' and id <> v_room;
  perform set_config('tagalong.bypass_actor_rules', 'off', true);

  insert into public.session_exits(session_id, user_id, exit_type)
  select v_room, u, 'completed' from (
      select host_id as u from public.sessions where id = v_room
      union
      select candidate_id from public.match_handshakes
        where session_id = v_room and status = 'accepted'
  ) parts;
end $$;

grant execute on function public.complete_session(uuid) to authenticated;


-- ============================================================================
-- 8. apply_moderation_action — moderator-only, escalation ladder + cascade
-- ============================================================================

create or replace function public.apply_moderation_action(
  p_report_id      uuid,
  p_target_user_id uuid,
  p_action         text default 'auto',
  p_reason         text default null)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  v_actor     uuid := auth.uid();
  v_prior     int;
  v_action    text := lower(coalesce(p_action, 'auto'));
  v_expires   timestamptz;
  v_title     text;
  v_body      text;
  v_room      record;
  v_remaining int;
begin
  if not public.is_moderator(v_actor) then
    raise exception 'Moderator privileges required' using errcode = 'insufficient_privilege';
  end if;

  if v_action = 'dismiss' then
    if p_report_id is not null then
      update public.reports
         set status = 'dismissed', reviewed_at = now(), reviewed_by = v_actor
       where id = p_report_id;
    end if;
    insert into public.moderation_events(user_id, event_type, reason, related_report_id, issued_by)
    values (p_target_user_id, 'report_dismissed', p_reason, p_report_id, v_actor);
    return jsonb_build_object('action','report_dismissed');
  end if;

  select count(*) into v_prior
    from public.moderation_events
   where user_id = p_target_user_id
     and event_type in ('warning','strike','restriction','suspension','ban');

  if v_action = 'auto' then
    v_action := case
                  when v_prior = 0 then 'warning'
                  when v_prior = 1 then 'restriction'
                  when v_prior = 2 then 'suspension'
                  else 'ban'
                end;
  end if;

  if v_action not in ('warning','strike','restriction','suspension','ban') then
    raise exception 'Unknown moderation action: %', v_action using errcode = 'check_violation';
  end if;

  v_expires := case
                 when v_action = 'restriction' then now() + interval '24 hours'
                 when v_action = 'suspension'  then now() + interval '7 days'
                 else null
               end;

  insert into public.moderation_events(user_id, event_type, reason, related_report_id, expires_at, issued_by)
  values (p_target_user_id, v_action, p_reason, p_report_id, v_expires, v_actor);

  if p_report_id is not null then
    update public.reports
       set status = 'actioned', reviewed_at = now(), reviewed_by = v_actor
     where id = p_report_id;
  end if;

  if v_action in ('suspension','ban') then
    perform set_config('tagalong.bypass_actor_rules', 'on', true);

    update public.sessions
       set status = 'Cancelled'
     where host_id = p_target_user_id
       and status in ('Queued','Matching','Partially Matched');

    for v_room in
      select h.session_id as room_id
        from public.match_handshakes h
        join public.sessions s on s.id = h.session_id
       where h.candidate_id = p_target_user_id and h.status = 'accepted' and s.status = 'Ready'
    loop
      update public.match_handshakes set status = 'removed'
        where session_id = v_room.room_id and candidate_id = p_target_user_id;
      update public.sessions set status = 'Completed', completed_at = now()
        where host_id = p_target_user_id and matched_into_session_id = v_room.room_id and status = 'Ready';
      insert into public.session_exits(session_id, user_id, exit_type)
      values (v_room.room_id, p_target_user_id, 'removed');

      select (select count(*) from public.match_handshakes h
                where h.session_id = v_room.room_id and h.status = 'accepted')
             + (case when exists (select 1 from public.session_exits e
                                    join public.sessions s on s.id = v_room.room_id
                                    where e.session_id = v_room.room_id and e.user_id = s.host_id
                                      and e.exit_type in ('left','removed'))
                     then 0 else 1 end)
        into v_remaining;
      if v_remaining <= 0 then
        update public.sessions set status = 'Completed', completed_at = now()
          where id = v_room.room_id and status = 'Ready';
        update public.sessions set status = 'Completed', completed_at = now()
          where matched_into_session_id = v_room.room_id and status = 'Ready' and id <> v_room.room_id;
      end if;
    end loop;

    for v_room in
      select id as room_id from public.sessions
       where host_id = p_target_user_id and status = 'Ready'
    loop
      insert into public.session_exits(session_id, user_id, exit_type)
      values (v_room.room_id, p_target_user_id, 'removed');
      select count(*) into v_remaining from public.match_handshakes
        where session_id = v_room.room_id and status = 'accepted';
      if v_remaining <= 0 then
        update public.sessions set status = 'Completed', completed_at = now()
          where id = v_room.room_id and status = 'Ready';
      end if;
    end loop;

    perform set_config('tagalong.bypass_actor_rules', 'off', true);
  end if;

  v_title := case v_action
               when 'warning'     then 'You received a warning'
               when 'strike'      then 'You received a strike'
               when 'restriction' then 'Your account is temporarily restricted'
               when 'suspension'  then 'Your account is suspended'
               when 'ban'         then 'Your account has been banned'
             end;
  v_body := case v_action
              when 'restriction' then 'You cannot create or join sessions for 24 hours. Existing chats still work.'
              when 'suspension'  then 'You cannot use core features for 7 days.'
              when 'ban'         then 'Your access to Tag Along has been permanently removed.'
              else coalesce(p_reason, 'Please review our community guidelines.')
            end;
  perform public.notify_user(p_target_user_id, 'moderation_notice', v_title, v_body,
    jsonb_build_object('action', v_action, 'expires_at', v_expires, 'report_id', p_report_id));

  return jsonb_build_object('action', v_action, 'prior_violations', v_prior, 'expires_at', v_expires);
end $$;

grant execute on function public.apply_moderation_action(uuid, uuid, text, text) to authenticated;


-- ============================================================================
-- 9. run_matchmaking — patched with standing + block + cooldown exclusion
-- ============================================================================

create or replace function public.run_matchmaking()
returns void language plpgsql security definer set search_path = public, extensions as $$
declare
  t      record;
  anchor record;
  cnt    int;
begin
  for t in
    select s.*
    from public.sessions s
    where s.status in ('Queued','Matching','Partially Matched')
      and s.paused = false
      and s.expires_at > now()
      and public.get_user_standing(s.host_id) = 'active'
    order by s.created_at asc
    for update skip locked
  loop
    if t.status = 'Queued' then
      update public.sessions set status = 'Matching' where id = t.id;
      t.status := 'Matching';
    end if;

    select a.* into anchor
    from public.sessions a
    where a.id <> t.id
      and a.host_id <> t.host_id
      and a.created_at < t.created_at
      and a.paused = false
      and a.expires_at > now()
      and a.status in ('Queued','Matching','Partially Matched')
      and (select count(*) from public.match_handshakes h
             where h.session_id = a.id and h.status = 'accepted') < (a.group_size - 1)
      and exists (select 1 from public.profiles p where p.id = a.host_id)
      and public.get_user_standing(a.host_id) = 'active'
      and not exists (
        select 1 from public.blocked_users b
         where (b.blocker_id = t.host_id and b.blocked_id = a.host_id)
            or (b.blocker_id = a.host_id and b.blocked_id = t.host_id))
      and not public.users_recently_matched(t.host_id, a.host_id, interval '5 days')
      and a.intent ilike '%' || trim(t.intent) || '%'
    order by a.created_at asc
    limit 1
    for update skip locked;

    if not found then
      select a.* into anchor
      from public.sessions a
      where a.id <> t.id
        and a.host_id <> t.host_id
        and a.created_at < t.created_at
        and a.paused = false
        and a.expires_at > now()
        and a.status in ('Queued','Matching','Partially Matched')
        and (select count(*) from public.match_handshakes h
               where h.session_id = a.id and h.status = 'accepted') < (a.group_size - 1)
        and exists (select 1 from public.profiles p where p.id = a.host_id)
        and public.get_user_standing(a.host_id) = 'active'
        and not exists (
          select 1 from public.blocked_users b
           where (b.blocker_id = t.host_id and b.blocked_id = a.host_id)
              or (b.blocker_id = a.host_id and b.blocked_id = t.host_id))
        and not public.users_recently_matched(t.host_id, a.host_id, interval '5 days')
      order by a.created_at asc
      limit 1
      for update skip locked;
    end if;

    if not found then
      continue;
    end if;

    insert into public.match_handshakes(session_id, candidate_id, status)
    values (anchor.id, t.host_id, 'accepted')
    on conflict (session_id, candidate_id) do nothing;

    select count(*) into cnt from public.match_handshakes
      where session_id = anchor.id and status = 'accepted';

    update public.sessions
       set status = 'Ready', ready_at = now(), matched_at = coalesce(matched_at, now()),
           matched_into_session_id = anchor.id
     where id = t.id;

    perform public.notify_user(t.host_id, 'match_joined',
      'You matched!', 'You have been placed into a group for "' || anchor.intent || '".',
      jsonb_build_object('session_id', t.id, 'room_id', anchor.id));

    perform public.notify_user(anchor.host_id, 'match_joined',
      'Someone joined your Tag',
      (select first_name from public.profiles where id = t.host_id) || ' joined "' || anchor.intent || '".',
      jsonb_build_object('session_id', anchor.id, 'room_id', anchor.id));

    if cnt >= (anchor.group_size - 1) then
      update public.sessions set status = 'Waiting for Confirmation'
        where id = anchor.id and status in ('Matching','Partially Matched');
      update public.sessions
         set status = 'Ready', ready_at = now(), matched_at = coalesce(matched_at, now()),
             matched_into_session_id = anchor.id
       where id = anchor.id;

      perform public.notify_user(u, 'group_ready',
        'Your group is ready', 'Everyone is matched for "' || anchor.intent || '". Say hi!',
        jsonb_build_object('room_id', anchor.id))
      from (
        select anchor.host_id as u
        union
        select h.candidate_id from public.match_handshakes h
          where h.session_id = anchor.id and h.status = 'accepted'
      ) parts;
    else
      update public.sessions
         set status = 'Partially Matched', matched_at = coalesce(matched_at, now()),
             matched_into_session_id = anchor.id
       where id = anchor.id and status in ('Matching','Partially Matched');
    end if;
  end loop;
end $$;


-- ============================================================================
-- 10. Tighten sessions UPDATE RLS to host-only
-- ============================================================================

drop policy if exists sessions_update_participant on public.sessions;
drop policy if exists sessions_update_host on public.sessions;
create policy sessions_update_host on public.sessions
  for update using (host_id = auth.uid()) with check (host_id = auth.uid());
