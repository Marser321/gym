-- ==============================================================================
-- GYM CRM SaaS - MULTI-TENANT SCHEMA (v3.0)
-- Migración completa a arquitectura multi-inquilino (multi-tenant).
-- Cada gimnasio (tenant) se aísla mediante gym_id + RLS basado en JWT app_metadata.
-- ==============================================================================

-- 1. EXTENSIONES
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ==============================================================================
-- 2. TABLA RAÍZ: GYMS (Tenant Root)
-- Cada registro representa un gimnasio / inquilino independiente.
-- ==============================================================================
create table if not exists public.gyms (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text unique not null,              -- URL-friendly identifier (e.g. "ironfit-madrid")
  owner_id      uuid references auth.users(id) on delete set null,
  logo_url      text,
  address       text,
  city          text,
  country       text default 'ES',
  phone         text,
  email         text,
  timezone      text default 'Europe/Madrid',
  currency      text default 'EUR',
  plan          text default 'free' check (plan in ('free', 'pro', 'enterprise')),
  max_members   int default 50,                    -- límite según plan SaaS
  is_active     boolean default true,
  settings      jsonb default '{}'::jsonb,         -- configuración personalizada del tenant
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

comment on table public.gyms is 'Tabla raíz multi-tenant. Cada fila es un gimnasio independiente.';
comment on column public.gyms.slug is 'Identificador URL-friendly único para el gimnasio.';
comment on column public.gyms.plan is 'Plan SaaS: free, pro, enterprise.';
comment on column public.gyms.settings is 'Configuración JSON libre del tenant (colores, features, etc.).';

-- ==============================================================================
-- 3. TABLA: PROFILES (Usuarios / Socios / Staff)
-- Extiende auth.users. Incluye gym_id para aislamiento de tenant.
-- ==============================================================================
create table if not exists public.profiles (
  id                    uuid references auth.users(id) on delete cascade primary key,
  gym_id                uuid not null references public.gyms(id) on delete cascade,
  email                 text,
  full_name             text,
  avatar_url            text,
  phone                 text,
  dni                   text,
  role                  text default 'member' check (role in ('owner', 'admin', 'trainer', 'member')),
  level                 int default 1,
  xp                    int default 0,
  rank_name             text default 'Bronce',
  qr_code_token         text,
  subscription_status   text default 'active' check (subscription_status in ('active', 'inactive', 'suspended', 'trial')),
  emergency_contact     text,
  birth_date            date,
  notes                 text,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

comment on table public.profiles is 'Perfiles de usuario vinculados a un gym_id específico.';

-- ==============================================================================
-- 4. TABLA: TRAINERS (Entrenadores)
-- Perfil extendido para entrenadores con datos profesionales.
-- ==============================================================================
create table if not exists public.trainers (
  id                uuid primary key default gen_random_uuid(),
  gym_id            uuid not null references public.gyms(id) on delete cascade,
  user_id           uuid not null references public.profiles(id) on delete cascade,
  specialty         text,
  bio               text,
  certifications    jsonb default '[]'::jsonb,
  hourly_rate       decimal(10,2),
  commission_rate   decimal(5,2) default 0.00,
  max_clients       int default 20,
  is_active         boolean default true,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now(),

  unique(gym_id, user_id)
);

comment on table public.trainers is 'Datos profesionales de entrenadores, aislados por gym_id.';

-- ==============================================================================
-- 5. TABLA: MEMBERSHIPS (Planes de membresía disponibles)
-- Define los tipos de membresía que cada gimnasio ofrece.
-- ==============================================================================
create table if not exists public.memberships (
  id              uuid primary key default gen_random_uuid(),
  gym_id          uuid not null references public.gyms(id) on delete cascade,
  name            text not null,                               -- "Plan Mensual", "Trimestral VIP"
  description     text,
  duration_days   int not null default 30,                     -- duración en días
  price           decimal(10,2) not null,
  currency        text default 'EUR',
  features        jsonb default '[]'::jsonb,                   -- ["acceso_24h", "clases_grupales", "spa"]
  max_freezes     int default 0,                               -- pausas permitidas
  is_active       boolean default true,
  sort_order      int default 0,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

comment on table public.memberships is 'Catálogo de planes de membresía disponibles por gimnasio.';

-- ==============================================================================
-- 6. TABLA: SUBSCRIPTIONS (Suscripciones activas de socios)
-- Vincula un perfil con un plan de membresía en un período específico.
-- ==============================================================================
create table if not exists public.subscriptions (
  id                  uuid primary key default gen_random_uuid(),
  gym_id              uuid not null references public.gyms(id) on delete cascade,
  user_id             uuid not null references public.profiles(id) on delete cascade,
  membership_id       uuid references public.memberships(id) on delete set null,
  start_date          date not null default current_date,
  end_date            date not null,
  status              text default 'active' check (status in ('active', 'paused', 'cancelled', 'expired')),
  payment_method      text check (payment_method in ('efectivo', 'transferencia', 'debito', 'credito', 'stripe', 'paypal')),
  auto_renew          boolean default false,
  base_price          decimal(10,2),
  discount_pct        decimal(5,2) default 0.00,
  final_price         decimal(10,2),                           -- precio final tras descuento
  freeze_start        date,
  freeze_end          date,
  notes               text,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

comment on table public.subscriptions is 'Suscripciones activas que vinculan socios con planes de membresía.';

-- ==============================================================================
-- 7. TABLA: CLASSES (Clases grupales / Servicios)
-- Clases y actividades ofrecidas por cada gimnasio.
-- ==============================================================================
create table if not exists public.classes (
  id              uuid primary key default gen_random_uuid(),
  gym_id          uuid not null references public.gyms(id) on delete cascade,
  trainer_id      uuid references public.trainers(id) on delete set null,
  title           text not null,
  description     text,
  category        text,                                        -- "CrossFit", "Yoga", "Boxeo", etc.
  day_of_week     int check (day_of_week between 0 and 6),    -- 0=Domingo, 6=Sábado
  start_time      time not null,
  end_time        time not null,
  capacity        int default 20,
  enrolled        int default 0,
  room            text,                                        -- "Sala A", "Piscina"
  image_url       text,
  is_active       boolean default true,
  recurrence      text default 'weekly' check (recurrence in ('once', 'daily', 'weekly', 'biweekly', 'monthly')),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

comment on table public.classes is 'Clases grupales y actividades programadas por gimnasio.';

-- ==============================================================================
-- 8. TABLA: CLASS_ENROLLMENTS (Inscripciones a clases)
-- Registro de socios inscritos en clases.
-- ==============================================================================
create table if not exists public.class_enrollments (
  id          uuid primary key default gen_random_uuid(),
  gym_id      uuid not null references public.gyms(id) on delete cascade,
  class_id    uuid not null references public.classes(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  status      text default 'enrolled' check (status in ('enrolled', 'attended', 'cancelled', 'no_show')),
  enrolled_at timestamptz default now(),

  unique(class_id, user_id)
);

comment on table public.class_enrollments is 'Inscripciones de socios a clases grupales.';

-- ==============================================================================
-- 9. TABLA: PAYMENTS (Historial de pagos / Finanzas)
-- ==============================================================================
create table if not exists public.payments (
  id                uuid primary key default gen_random_uuid(),
  gym_id            uuid not null references public.gyms(id) on delete cascade,
  member_id         uuid references public.profiles(id) on delete set null,
  subscription_id   uuid references public.subscriptions(id) on delete set null,
  amount            decimal(10,2) not null,
  plan_name         text,
  payment_method    text check (payment_method in ('efectivo', 'transferencia', 'debito', 'credito', 'stripe', 'paypal')),
  status            text default 'completed' check (status in ('pending', 'completed', 'failed', 'refunded')),
  reference_code    text,
  notes             text,
  created_at        timestamptz default now()
);

comment on table public.payments is 'Registro de transacciones financieras por gimnasio.';

-- ==============================================================================
-- 10. TABLA: CHECKINS (Control de acceso / Aforo)
-- ==============================================================================
create table if not exists public.checkins (
  id              uuid primary key default gen_random_uuid(),
  gym_id          uuid not null references public.gyms(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  checked_in_at   timestamptz default now(),
  checked_out_at  timestamptz,
  method          text default 'qr' check (method in ('qr', 'manual', 'nfc', 'biometric'))
);

comment on table public.checkins is 'Control de acceso y registro de asistencia por gimnasio.';

-- ==============================================================================
-- 11. TABLA: ROUTINES (Rutinas de entrenamiento)
-- ==============================================================================
create table if not exists public.routines (
  id              uuid primary key default gen_random_uuid(),
  gym_id          uuid not null references public.gyms(id) on delete cascade,
  trainer_id      uuid references public.trainers(id) on delete set null,
  assigned_to     uuid references public.profiles(id) on delete set null,
  name            text not null,
  description     text,
  difficulty      text default 'intermedio' check (difficulty in ('principiante', 'intermedio', 'avanzado')),
  duration_min    int default 60,
  exercise_count  int default 0,
  image_url       text,
  is_template     boolean default false,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

comment on table public.routines is 'Rutinas de entrenamiento asignables a socios, por gimnasio.';

-- ==============================================================================
-- 12. TABLA: EXERCISES (Biblioteca de ejercicios)
-- ==============================================================================
create table if not exists public.exercises (
  id            uuid primary key default gen_random_uuid(),
  gym_id        uuid not null references public.gyms(id) on delete cascade,
  name          text not null,
  muscle_group  text,
  video_url     text,
  description   text,
  created_at    timestamptz default now()
);

comment on table public.exercises is 'Biblioteca de ejercicios del gimnasio.';

-- ==============================================================================
-- 13. TABLA: ROUTINE_EXERCISES (Relación N:M Rutina-Ejercicio)
-- ==============================================================================
create table if not exists public.routine_exercises (
  id            uuid primary key default gen_random_uuid(),
  gym_id        uuid not null references public.gyms(id) on delete cascade,
  routine_id    uuid not null references public.routines(id) on delete cascade,
  exercise_id   uuid not null references public.exercises(id) on delete cascade,
  order_index   int default 0,
  sets          int default 3,
  reps          text default '10-12',
  rest_seconds  int default 60,
  notes         text,
  created_at    timestamptz default now()
);

comment on table public.routine_exercises is 'Ejercicios dentro de una rutina con orden y configuración.';

-- ==============================================================================
-- 14. TABLA: WORKOUT_LOGS (Historial de entrenamientos)
-- ==============================================================================
create table if not exists public.workout_logs (
  id            uuid primary key default gen_random_uuid(),
  gym_id        uuid not null references public.gyms(id) on delete cascade,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  routine_id    uuid references public.routines(id) on delete set null,
  exercise_id   uuid references public.exercises(id) on delete set null,
  set_number    int,
  weight        decimal(10,2),
  reps          int,
  duration_sec  int,
  notes         text,
  completed_at  timestamptz default now()
);

comment on table public.workout_logs is 'Registro detallado de series y ejercicios completados.';

-- ==============================================================================
-- 15. TABLA: TRAINER_ASSIGNMENTS (Relación Entrenador-Cliente)
-- ==============================================================================
create table if not exists public.trainer_assignments (
  id            uuid primary key default gen_random_uuid(),
  gym_id        uuid not null references public.gyms(id) on delete cascade,
  trainer_id    uuid not null references public.profiles(id) on delete cascade,
  client_id     uuid not null references public.profiles(id) on delete cascade,
  status        text default 'active' check (status in ('active', 'paused', 'completed')),
  assigned_at   timestamptz default now(),

  unique(gym_id, trainer_id, client_id)
);

comment on table public.trainer_assignments is 'Asignaciones entrenador-cliente dentro de un gimnasio.';

-- ==============================================================================
-- 16. TABLA: MESSAGES (Chat Entrenador-Cliente)
-- ==============================================================================
create table if not exists public.messages (
  id            uuid primary key default gen_random_uuid(),
  gym_id        uuid not null references public.gyms(id) on delete cascade,
  sender_id     uuid not null references public.profiles(id) on delete cascade,
  receiver_id   uuid not null references public.profiles(id) on delete cascade,
  content       text not null,
  is_read       boolean default false,
  created_at    timestamptz default now()
);

comment on table public.messages is 'Mensajes internos entre usuarios del mismo gimnasio.';

-- ==============================================================================
-- 17. TABLA: MEMBERSHIP_REQUESTS (Solicitudes de ingreso)
-- ==============================================================================
create table if not exists public.membership_requests (
  id          uuid primary key default gen_random_uuid(),
  gym_id      uuid not null references public.gyms(id) on delete cascade,
  full_name   text not null,
  email       text not null,
  phone       text,
  goal        text,
  status      text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  created_at  timestamptz default now()
);

comment on table public.membership_requests is 'Solicitudes de nuevos socios pendientes de revisión.';
