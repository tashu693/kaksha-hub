create table public.branches (id uuid primary key default gen_random_uuid(), code text not null unique, name text not null, created_at timestamptz not null default now());
grant select on public.branches to anon, authenticated; grant all on public.branches to service_role;
alter table public.branches enable row level security;
create policy "Branches are public" on public.branches for select to anon, authenticated using (true);

create table public.semesters (id uuid primary key default gen_random_uuid(), number int not null unique check (number between 1 and 8), created_at timestamptz not null default now());
grant select on public.semesters to anon, authenticated; grant all on public.semesters to service_role;
alter table public.semesters enable row level security;
create policy "Semesters are public" on public.semesters for select to anon, authenticated using (true);

create table public.subjects (id uuid primary key default gen_random_uuid(), name text not null, code text not null, branch_id uuid not null references public.branches(id) on delete cascade, semester_id uuid not null references public.semesters(id) on delete cascade, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (code, branch_id));
grant select on public.subjects to anon, authenticated; grant all on public.subjects to service_role;
alter table public.subjects enable row level security;
create policy "Subjects are public" on public.subjects for select to anon, authenticated using (true);

create table public.profiles (id uuid primary key references auth.users(id) on delete cascade, full_name text not null check (char_length(full_name) between 1 and 100), email text not null, avatar_url text, branch text references public.branches(code), semester int references public.semesters(number), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
grant select, update on public.profiles to authenticated; grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "Users read own profile" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "Users update own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create type public.app_role as enum ('student', 'admin');
create table public.user_roles (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, role public.app_role not null, created_at timestamptz not null default now(), unique (user_id, role));
grant select on public.user_roles to authenticated; grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "Users read own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role public.app_role) returns boolean language sql stable security definer set search_path = public as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;
create policy "Admins read all profiles" on public.profiles for select to authenticated using (public.has_role(auth.uid(), 'admin'));

create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path = public as $$ begin new.updated_at = now(); return new; end $$;
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
create trigger subjects_touch before update on public.subjects for each row execute function public.touch_updated_at();

create or replace function public.protect_profile_fields() returns trigger language plpgsql set search_path = public as $$ begin new.email = old.email; new.id = old.id; new.created_at = old.created_at; return new; end $$;
create trigger profiles_protect before update on public.profiles for each row execute function public.protect_profile_fields();

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
declare b text; s int;
begin
  b := nullif(new.raw_user_meta_data->>'branch','');
  if b is not null and not exists (select 1 from public.branches where code = b) then b := null; end if;
  begin s := (new.raw_user_meta_data->>'semester')::int; exception when others then s := null; end;
  if s is not null and (s < 1 or s > 8) then s := null; end if;
  insert into public.profiles (id, full_name, email, branch, semester)
  values (new.id, left(coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'),''), split_part(new.email,'@',1)),100), new.email, b, s);
  insert into public.user_roles (user_id, role) values (new.id, 'student');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

insert into public.branches (code, name) values
('CSE','Computer Science & Engineering'),('IT','Information Technology'),('AIML','Artificial Intelligence & ML'),('DS','Data Science'),('ECE','Electronics & Communication'),('EE','Electrical Engineering'),('EEE','Electrical & Electronics'),('ME','Mechanical Engineering'),('CE','Civil Engineering'),('CHE','Chemical Engineering'),('BT','Biotechnology'),('OTH','Other AKTU Branches');
insert into public.semesters (number) select generate_series(1,8);
insert into public.subjects (name, code, branch_id, semester_id)
select v.name, v.code, b.id, s.id from (values ('Data Structures','KCS301',3),('Discrete Structures','KCS303',3),('Operating Systems','KCS401',4),('Database Management','KCS501',5),('Computer Networks','KCS603',6),('Machine Learning','KCS071',7)) as v(name,code,sem)
join public.branches b on b.code='CSE' join public.semesters s on s.number=v.sem;