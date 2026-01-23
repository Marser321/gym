-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- 1. Profiles Table (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  avatar_url text,
  role text default 'socio' check (role in ('socio', 'admin', 'entrenador')),
  is_looking_for_spotter boolean default false,
  qr_code_token text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on profiles for select
  using ( true );

create policy "Users can insert their own profile"
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile"
  on profiles for update
  using ( auth.uid() = id );

-- Trigger for auto-profile creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Trainers Table
create table public.trainers (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  specialty text,
  hourly_rate decimal(10,2),
  commission_rate decimal(5,2) default 0.0,
  bio text,
  certifications jsonb,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.trainers enable row level security;

create policy "Trainers viewable by everyone" on trainers for select using (true);
create policy "Admins can manage trainers" on trainers for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- 3. Subscriptions Table
create table public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  plan_type text check (plan_type in ('mensual', 'trimestral', 'anual')),
  base_price decimal(10,2),
  current_discount decimal(5,2) default 0.0,
  monthly_attendances int default 0,
  start_date date,
  end_date date,
  status text check (status in ('activa', 'pausada', 'cancelada')) default 'activa',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.subscriptions enable row level security;

create policy "Users view own subscription" on subscriptions for select using (auth.uid() = user_id);

-- 4. Check-ins Table (Realtime & Crowd Meter)
create table public.checkins (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  checked_in_at timestamp with time zone default timezone('utc'::text, now()) not null,
  checked_out_at timestamp with time zone
);

alter table public.checkins enable row level security;

create policy "Users view own checkins" on checkins for select using (auth.uid() = user_id);
create policy "Admins view all checkins" on checkins for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- 5. User-Trainers Relationship (Booking/Hiring)
create table public.user_trainers (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  trainer_id uuid references public.trainers(id) on delete cascade not null,
  booking_type text check (booking_type in ('hora', 'pack_5', 'pack_10')),
  sessions_remaining int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.user_trainers enable row level security;

create policy "Users can view their hired trainers" on user_trainers for select using (auth.uid() = user_id);

-- 6. Routines Table
create table public.routines (
  id uuid primary key default uuid_generate_v4(),
  trainer_id uuid references public.trainers(id),
  user_id uuid references public.profiles(id), -- If assigned to specific user, or null for template
  name text not null,
  description text,
  difficulty text check (difficulty in ('principiante', 'intermedio', 'avanzado')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.routines enable row level security;

create policy "Routines viewable by authenticated users" on routines for select using (auth.role() = 'authenticated');

-- 7. Routine Exercises (Details)
create table public.routine_exercises (
  id uuid primary key default uuid_generate_v4(),
  routine_id uuid references public.routines(id) on delete cascade not null,
  exercise_name text not null,
  sets int,
  reps int,
  video_url text, -- URL to storage or external video
  order_index int default 0
);

alter table public.routine_exercises enable row level security;
create policy "Exercises viewable by auth users" on routine_exercises for select using (auth.role() = 'authenticated');

-- 8. Gym Match (Social/Spotter)
create table public.gym_match (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  exercise_type text, -- e.g., "Leg Press", "Bench Press"
  available_at timestamp with time zone default timezone('utc'::text, now()),
  status text check (status in ('buscando', 'encontrado', 'cancelado')) default 'buscando'
);

alter table public.gym_match enable row level security;

create policy "Gym match viewable by everyone" on gym_match for select using (true);
create policy "Users manage own match status" on gym_match for all using (auth.uid() = user_id);

-- Activate Realtime for relevant tables
alter publication supabase_realtime add table checkins;
alter publication supabase_realtime add table gym_match;
alter publication supabase_realtime add table user_trainers;

-- Initial Seed Data (Optional - to have something on screen)
-- You can run INSERT statements here if needed later.
