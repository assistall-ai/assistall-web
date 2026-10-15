begin;

create extension if not exists pgcrypto;

create table public.demo_requests (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique,
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 1 and 100),
  email text not null check (char_length(email) between 3 and 254 and email = lower(email)),
  company text not null check (char_length(company) between 1 and 160),
  work_need text not null check (char_length(work_need) between 1 and 2000),
  status text not null default 'new' check (status in ('new', 'contacted', 'closed', 'spam')),
  source text not null check (char_length(source) between 1 and 80),
  ip_hash text not null check (ip_hash ~ '^[a-f0-9]{64}$')
);

create table public.demo_rate_limit_events (
  id bigint generated always as identity primary key,
  request_id uuid not null unique,
  created_at timestamptz not null default now(),
  ip_hash text not null check (ip_hash ~ '^[a-f0-9]{64}$'),
  email_hash text not null check (email_hash ~ '^[a-f0-9]{64}$'),
  accepted boolean not null,
  reason text not null check (reason in ('accepted', 'ip_limit', 'email_limit'))
);

create index demo_requests_created_at_idx on public.demo_requests (created_at desc);
create index demo_requests_status_created_at_idx on public.demo_requests (status, created_at desc);
create index demo_rate_limit_ip_idx on public.demo_rate_limit_events (ip_hash, created_at desc) where accepted;
create index demo_rate_limit_email_idx on public.demo_rate_limit_events (email_hash, created_at desc) where accepted;

alter table public.demo_requests enable row level security;
alter table public.demo_requests force row level security;
alter table public.demo_rate_limit_events enable row level security;
alter table public.demo_rate_limit_events force row level security;

revoke all on table public.demo_requests from public, anon, authenticated;
revoke all on table public.demo_rate_limit_events from public, anon, authenticated;
grant select, insert, update, delete on table public.demo_requests to service_role;
grant select, insert, update, delete on table public.demo_rate_limit_events to service_role;
grant usage, select on sequence public.demo_rate_limit_events_id_seq to service_role;

create or replace function public.ingest_demo_request(
  p_request_id uuid,
  p_name text,
  p_email text,
  p_company text,
  p_work_need text,
  p_source text,
  p_ip_hash text,
  p_email_hash text
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  ip_count integer;
  email_count integer;
begin
  if p_name is null or char_length(p_name) not between 1 and 100
    or p_email is null or char_length(p_email) not between 3 and 254 or p_email <> lower(p_email)
    or p_company is null or char_length(p_company) not between 1 and 160
    or p_work_need is null or char_length(p_work_need) not between 1 and 2000
    or p_source is null or char_length(p_source) not between 1 and 80
    or p_ip_hash !~ '^[a-f0-9]{64}$'
    or p_email_hash !~ '^[a-f0-9]{64}$' then
    return jsonb_build_object('ok', false, 'reason', 'invalid_payload');
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_ip_hash, 21811));
  perform pg_advisory_xact_lock(hashtextextended(p_email_hash, 21812));

  if exists (select 1 from public.demo_rate_limit_events where request_id = p_request_id)
    or exists (select 1 from public.demo_requests where request_id = p_request_id) then
    return jsonb_build_object('ok', false, 'reason', 'replay');
  end if;

  select count(*) into ip_count
  from public.demo_rate_limit_events
  where accepted and ip_hash = p_ip_hash and created_at >= now() - interval '1 hour';

  if ip_count >= 5 then
    insert into public.demo_rate_limit_events (request_id, ip_hash, email_hash, accepted, reason)
    values (p_request_id, p_ip_hash, p_email_hash, false, 'ip_limit');
    return jsonb_build_object('ok', false, 'reason', 'rate_limited');
  end if;

  select count(*) into email_count
  from public.demo_rate_limit_events
  where accepted and email_hash = p_email_hash and created_at >= now() - interval '1 day';

  if email_count >= 3 then
    insert into public.demo_rate_limit_events (request_id, ip_hash, email_hash, accepted, reason)
    values (p_request_id, p_ip_hash, p_email_hash, false, 'email_limit');
    return jsonb_build_object('ok', false, 'reason', 'rate_limited');
  end if;

  insert into public.demo_requests (request_id, name, email, company, work_need, source, ip_hash)
  values (p_request_id, p_name, p_email, p_company, p_work_need, p_source, p_ip_hash);

  insert into public.demo_rate_limit_events (request_id, ip_hash, email_hash, accepted, reason)
  values (p_request_id, p_ip_hash, p_email_hash, true, 'accepted');

  return jsonb_build_object('ok', true, 'request_id', p_request_id);
exception
  when unique_violation then
    return jsonb_build_object('ok', false, 'reason', 'replay');
end;
$$;

create or replace function public.purge_demo_request_data() returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  spam_deleted integer;
  closed_deleted integer;
  events_deleted integer;
begin
  delete from public.demo_requests where status = 'spam' and created_at < now() - interval '30 days';
  get diagnostics spam_deleted = row_count;
  delete from public.demo_requests where status = 'closed' and created_at < now() - interval '180 days';
  get diagnostics closed_deleted = row_count;
  delete from public.demo_rate_limit_events where created_at < now() - interval '30 days';
  get diagnostics events_deleted = row_count;
  return jsonb_build_object('spam_deleted', spam_deleted, 'closed_deleted', closed_deleted, 'events_deleted', events_deleted);
end;
$$;

revoke all on function public.ingest_demo_request(uuid, text, text, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.ingest_demo_request(uuid, text, text, text, text, text, text, text) to service_role;
revoke all on function public.purge_demo_request_data() from public, anon, authenticated;
grant execute on function public.purge_demo_request_data() to service_role;

comment on table public.demo_requests is 'Private website demo leads. No browser role has a policy or table grant.';
comment on table public.demo_rate_limit_events is 'Hashed abuse-control events. Raw IP addresses are never stored.';

commit;
