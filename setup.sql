-- Run once in Supabase Dashboard > SQL Editor > New query.
-- Creates a profile for each Auth user. admin@ktholidays.com is manager;
-- every other Auth user is staff by default.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text not null,
  role text not null default 'staff' check (role in ('staff', 'manager')),
  title text not null default 'Staff Member',
  department text not null default 'Operations',
  avatar text not null default '',
  joined_date date not null default current_date,
  location_country text,
  timezone text,
  manager_id uuid references public.profiles(id) on delete set null,
  offer_letter jsonb not null default jsonb_build_object('offerDate', current_date::text, 'contractType', 'Full-Time', 'annualLeaveEntitlement', 18, 'sickLeaveEntitlement', 14, 'casualLeaveEntitlement', 7, 'maternityPaternityEntitlement', 14, 'probationMonths', 3, 'standardHoursPerDay', 8),
  active_work_status jsonb
);

create or replace function public.is_manager()
returns boolean
language sql stable security definer
set search_path = public
as $$ select exists (select 1 from public.profiles where id = auth.uid() and role = 'manager'); $$;

create or replace function public.create_staff_profile()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, role, title, department)
  values (
    new.id,
    lower(new.email),
    coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), nullif(new.raw_user_meta_data->>'name', ''), split_part(new.email, '@', 1)),
    case when lower(new.email) = 'admin@ktholidays.com' then 'manager' else 'staff' end,
    case when lower(new.email) = 'admin@ktholidays.com' then 'Manager' else 'Staff Member' end,
    'Operations'
  ) on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute procedure public.create_staff_profile();

-- Backfill users created before this setup was applied.
insert into public.profiles (id, email, name, role, title, department)
select id, lower(email), coalesce(nullif(raw_user_meta_data->>'full_name',''), nullif(raw_user_meta_data->>'name',''), split_part(email,'@',1)),
       case when lower(email) = 'admin@ktholidays.com' then 'manager' else 'staff' end,
       case when lower(email) = 'admin@ktholidays.com' then 'Manager' else 'Staff Member' end,
       'Operations'
from auth.users where email is not null
on conflict (id) do update set
  email = excluded.email,
  role = case when excluded.email = 'admin@ktholidays.com' then 'manager' else 'staff' end;

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.profiles(id) on delete cascade,
  date date not null,
  clock_in_time time not null,
  clock_out_time time,
  breaks jsonb not null default '[]'::jsonb,
  work_location text not null check (work_location in ('Office HQ','Remote / WFH','Client Site')),
  clock_in_geo jsonb,
  clock_out_geo jsonb,
  status text not null check (status in ('present','late','half-day','on-leave','absent')),
  notes text,
  unique (employee_id, date)
);

create table if not exists public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.profiles(id) on delete cascade,
  leave_type text not null check (leave_type in ('annual','sick','casual','maternity_paternity','unpaid')),
  start_date date not null,
  end_date date not null,
  is_half_day boolean not null default false,
  half_day_period text check (half_day_period in ('morning','afternoon')),
  total_days numeric not null check (total_days > 0),
  reason text not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected','cancelled')),
  applied_at timestamptz not null default now(),
  reviewed_by uuid references public.profiles(id),
  reviewed_by_name text,
  reviewed_at timestamptz,
  manager_comment text,
  supporting_doc_name text
);

create or replace function public.guard_staff_record_updates()
returns trigger
language plpgsql security invoker
set search_path = public
as $$
begin
  if public.is_manager() then return new; end if;
  if tg_table_name = 'attendance' then
    if new.employee_id is distinct from old.employee_id or new.date is distinct from old.date
       or new.clock_in_time is distinct from old.clock_in_time or new.work_location is distinct from old.work_location
       or new.clock_in_geo is distinct from old.clock_in_geo or new.status is distinct from old.status
       or new.notes is distinct from old.notes then
      raise exception 'Staff can only update their own clock-out and break details';
    end if;
  else
    if old.employee_id <> auth.uid() or old.status <> 'pending' or new.status <> 'cancelled'
       or (to_jsonb(new) - 'status') is distinct from (to_jsonb(old) - 'status') then
      raise exception 'Staff can only cancel their own pending leave request';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_attendance_updates on public.attendance;
create trigger guard_attendance_updates before update on public.attendance
  for each row execute procedure public.guard_staff_record_updates();
drop trigger if exists guard_leave_request_updates on public.leave_requests;
create trigger guard_leave_request_updates before update on public.leave_requests
  for each row execute procedure public.guard_staff_record_updates();

alter table public.profiles enable row level security;
alter table public.attendance enable row level security;
alter table public.leave_requests enable row level security;

drop policy if exists profiles_read_self_or_manager on public.profiles;
create policy profiles_read_self_or_manager on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_manager());
drop policy if exists profiles_manager_update on public.profiles;
create policy profiles_manager_update on public.profiles for update to authenticated
  using (public.is_manager()) with check (public.is_manager());

drop policy if exists attendance_read_self_or_manager on public.attendance;
create policy attendance_read_self_or_manager on public.attendance for select to authenticated
  using (employee_id = auth.uid() or public.is_manager());
drop policy if exists attendance_insert_self on public.attendance;
create policy attendance_insert_self on public.attendance for insert to authenticated
  with check (employee_id = auth.uid());
drop policy if exists attendance_update_self_or_manager on public.attendance;
create policy attendance_update_self_or_manager on public.attendance for update to authenticated
  using (employee_id = auth.uid() or public.is_manager())
  with check (employee_id = auth.uid() or public.is_manager());

drop policy if exists leave_read_self_or_manager on public.leave_requests;
create policy leave_read_self_or_manager on public.leave_requests for select to authenticated
  using (employee_id = auth.uid() or public.is_manager());
drop policy if exists leave_insert_self on public.leave_requests;
create policy leave_insert_self on public.leave_requests for insert to authenticated
  with check (employee_id = auth.uid());
drop policy if exists leave_update_self_or_manager on public.leave_requests;
create policy leave_update_self_or_manager on public.leave_requests for update to authenticated
  using (employee_id = auth.uid() or public.is_manager())
  with check (employee_id = auth.uid() or public.is_manager());

grant select on public.profiles, public.attendance, public.leave_requests to authenticated;
grant update (title, department, avatar, location_country, timezone, manager_id, offer_letter, active_work_status)
  on public.profiles to authenticated;
grant insert, update on public.attendance, public.leave_requests to authenticated;
