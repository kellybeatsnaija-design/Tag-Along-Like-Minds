-- ============================================================================
-- Tag Along — Background Queue Matching System
-- Paste this whole file into the Supabase SQL Editor and run it top-to-bottom.
-- Every statement is idempotent (create-or-replace / if-not-exists), so it is
-- safe to re-run after making edits.
--
-- Group-size semantic: group_size is the TOTAL number of people in the
-- tag-along (host + accepted candidates). A group is "full" when
-- accepted_count = group_size - 1.
-- ============================================================================


-- ============================================================================
-- 1. EXTENSIONS
-- ============================================================================

create extension if not exists pg_cron  with schema extensions;
create extension if not exists pg_net   with schema extensions;


-- ============================================================================
-- 2. SCHEMA CHANGES — sessions
-- ============================================================================

alter table public.sessions
  add column if not exists paused                  boolean     not null default false,
  add column if not exists expires_at              timestamptz,
  add column if not exists matched_at              timestamptz,
  add column if not exists ready_at                timestamptz,
  add column if not exists completed_at            timestamptz,
  add column if not exists last_activity_at        timestamptz not null default now(),
  add column if not exists matched_into_session_id uuid references public.sessions(id);

-- group_size guard (1..4 total people)
alter table public.sessions drop constraint if exists sessions_group_size_chk;
alter table public.sessions
  add constraint sessions_group_size_chk check (group_size between 1 and 4);

-- migrate legacy status values before adding the vocabulary constraint
update public.sessions set status = 'Queued' where status = 'Active';
update public.sessions set status = 'Ready'  where status = 'Matched';

-- backfill expiry for any pre-existing open rows
update public.sessions
  set expires_at = coalesce(expires_at, created_at + interval '72 hours')
  where status in ('Queued','Matching','Partially Matched');

alter table public.sessions alter column status set default 'Queued';

alter table public.sessions drop constraint if exists sessions_status_vocab_chk;
alter table public.sessions
  add constraint sessions_status_vocab_chk check (status in
    ('Queued','Matching','Partially Matched','Waiting for Confirmation',
     'Ready','Expired','Cancelled','Completed'));

-- stamp expires_at + last_activity_at on insert
create or replace function public.set_session_expiry()
returns trigger language plpgsql as $$
begin
  if new.expires_at is null then
    new.expires_at := coalesce(new.created_at, now()) + interval '72 hours';
  end if;
  new.last_activity_at := coalesce(new.last_activity_at, now());
  return new;
end $$;

drop trigger if exists trg_set_session_expiry on public.sessions;
create trigger trg_set_session_expiry
  before insert on public.sessions
  for each row execute function public.set_session_expiry();

-- bump room activity on every new message (feeds the auto-completion heuristic)
create or replace function public.bump_session_activity()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.sessions set last_activity_at = now() where id = new.session_id;
  return new;
end $$;

drop trigger if exists trg_bump_session_activity on public.messages;
create trigger trg_bump_session_activity
  after insert on public.messages
  for each row execute function public.bump_session_activity();


-- ============================================================================
-- 3. NEW TABLES — notifications, push_tokens
-- ============================================================================

create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  type       text not null,                          -- 'match_joined' | 'group_ready'
  title      text not null,
  body       text not null,
  data       jsonb not null default '{}'::jsonb,      -- e.g. {"session_id":"...","room_id":"..."}
  read       boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_unread_idx
  on public.notifications (user_id, read, created_at desc);

create table if not exists public.push_tokens (
  user_id         uuid not null references public.profiles(id) on delete cascade,
  expo_push_token text not null,
  platform        text,
  updated_at      timestamptz not null default now(),
  primary key (user_id, expo_push_token)
);

alter table public.notifications enable row level security;
alter table public.push_tokens   enable row level security;

drop policy if exists notif_select_own on public.notifications;
create policy notif_select_own on public.notifications
  for select using (user_id = auth.uid());

drop policy if exists notif_update_own on public.notifications;
create policy notif_update_own on public.notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists push_select_own on public.push_tokens;
create policy push_select_own on public.push_tokens
  for select using (user_id = auth.uid());

drop policy if exists push_insert_own on public.push_tokens;
create policy push_insert_own on public.push_tokens
  for insert with check (user_id = auth.uid());

drop policy if exists push_update_own on public.push_tokens;
create policy push_update_own on public.push_tokens
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists push_delete_own on public.push_tokens;
create policy push_delete_own on public.push_tokens
  for delete using (user_id = auth.uid());


-- ============================================================================
-- 4. TRANSITION ENFORCEMENT + ACTOR RULES ON sessions
-- ============================================================================

create or replace function public.enforce_session_rules()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_uid    uuid := auth.uid();      -- NULL when called by the SECURITY DEFINER job
  v_is_job boolean := (v_uid is null);
begin
  -- (a) transition allow-list (only checked when status actually changes)
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

  -- the scheduled job bypasses actor/edit-window rules but not the allow-list above
  if v_is_job then
    return new;
  end if;

  if v_uid = old.host_id then
    -- HOST: may edit content only while Queued or Partially Matched
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
    -- NON-HOST participant: may ONLY mark a Ready session Completed
    if new.intent        is distinct from old.intent
       or new.group_size  is distinct from old.group_size
       or new.comfort_mode is distinct from old.comfort_mode
       or new.paused       is distinct from old.paused
       or new.host_id      is distinct from old.host_id then
      raise exception 'Only the host may edit this session' using errcode = 'insufficient_privilege';
    end if;
    if new.status is distinct from old.status
       and not (old.status = 'Ready' and new.status = 'Completed') then
      raise exception 'Participants may only mark a Ready session as Completed'
        using errcode = 'insufficient_privilege';
    end if;
  end if;

  if new.status = 'Completed' and old.status <> 'Completed' then
    new.completed_at := now();
  end if;

  return new;
end $$;

drop trigger if exists trg_enforce_session_rules on public.sessions;
create trigger trg_enforce_session_rules
  before update on public.sessions
  for each row execute function public.enforce_session_rules();


-- ============================================================================
-- 5. RLS on sessions (extend existing UPDATE policy with WITH CHECK) + realtime
-- ============================================================================

drop policy if exists sessions_update_participant on public.sessions;
create policy sessions_update_participant on public.sessions
  for update
  using (
    host_id = auth.uid()
    or exists (select 1 from public.match_handshakes h
               where h.session_id = sessions.id
                 and h.candidate_id = auth.uid()
                 and h.status = 'accepted')
  )
  with check (
    host_id = auth.uid()
    or exists (select 1 from public.match_handshakes h
               where h.session_id = sessions.id
                 and h.candidate_id = auth.uid()
                 and h.status = 'accepted')
  );

alter publication supabase_realtime add table public.sessions;
alter publication supabase_realtime add table public.notifications;


-- ============================================================================
-- 6. notify_user — writes the in-app row + fires Expo push
-- ============================================================================

create or replace function public.notify_user(
  p_user_id uuid, p_type text, p_title text, p_body text, p_data jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare
  r record;
begin
  insert into public.notifications(user_id, type, title, body, data)
  values (p_user_id, p_type, p_title, p_body, p_data);

  for r in select expo_push_token from public.push_tokens where user_id = p_user_id loop
    perform net.http_post(
      url     := 'https://exp.host/--/api/v2/push/send',
      headers := jsonb_build_object('Content-Type','application/json','Accept','application/json'),
      body    := jsonb_build_object(
                   'to',    r.expo_push_token,
                   'title', p_title,
                   'body',  p_body,
                   'sound', 'default',
                   'data',  p_data)
    );
  end loop;
end $$;


-- ============================================================================
-- 7. run_matchmaking — the scheduled matching job
-- ============================================================================

create or replace function public.run_matchmaking()
returns void language plpgsql security definer set search_path = public, extensions as $$
declare
  t      record;   -- the joiner being processed this iteration
  anchor record;   -- the chosen older anchor session
  cnt    int;       -- anchor's accepted-candidate count after attaching t
begin
  for t in
    select s.*
    from public.sessions s
    where s.status in ('Queued','Matching','Partially Matched')
      and s.paused = false
      and s.expires_at > now()
    order by s.created_at asc
    for update skip locked
  loop
    if t.status = 'Queued' then
      update public.sessions set status = 'Matching' where id = t.id;
      t.status := 'Matching';
    end if;

    -- Pass 1: oldest strictly-older session with an exact-ish intent match and open capacity
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
      and a.intent ilike '%' || trim(t.intent) || '%'
    order by a.created_at asc
    limit 1
    for update skip locked;

    if not found then
      -- Pass 2: broaden to ANY strictly-older open session
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
      order by a.created_at asc
      limit 1
      for update skip locked;
    end if;

    if not found then
      continue;  -- no eligible anchor yet; t stays Matching, retried next tick
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
      -- group full: brief system-internal transition, resolved to Ready in this same transaction
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
-- 8. run_session_maintenance — expiry + auto-completion sweep
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


-- ============================================================================
-- 9. complete_session — client-callable RPC for "mark as done"
-- ============================================================================

create or replace function public.complete_session(p_session_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_room uuid;
begin
  select coalesce(matched_into_session_id, id) into v_room
    from public.sessions where id = p_session_id;

  if not exists (
      select 1 from public.sessions s where s.id = v_room and s.host_id = auth.uid()
      union
      select 1 from public.match_handshakes h
        where h.session_id = v_room and h.candidate_id = auth.uid() and h.status = 'accepted')
  then
    raise exception 'Not a participant of this session' using errcode = 'insufficient_privilege';
  end if;

  update public.sessions set status = 'Completed', completed_at = now()
    where id = v_room and status = 'Ready';

  update public.sessions set status = 'Completed', completed_at = now()
    where matched_into_session_id = v_room and status = 'Ready' and id <> v_room;
end $$;


-- ============================================================================
-- 10. SCHEDULE — pg_cron
-- ============================================================================
-- Sub-minute intervals ('30 seconds') require pg_cron >= 1.5. Check first:
--   select extversion from pg_extension where extname = 'pg_cron';
-- If below 1.5, unschedule and re-schedule tagalong_matchmaking with '* * * * *' instead.

select cron.schedule('tagalong_matchmaking', '30 seconds', $$ select public.run_matchmaking(); $$);
select cron.schedule('tagalong_maintenance', '*/5 * * * *', $$ select public.run_session_maintenance(); $$);
