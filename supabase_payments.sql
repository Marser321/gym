-- TABLA DE PAGOS
create table if not exists public.payments (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  member_id uuid references public.profiles(id) on delete cascade,
  amount decimal(10,2) not null,
  plan_name text not null,
  payment_method text check (payment_method in ('efectivo', 'transferencia', 'debito', 'credito')),
  status text default 'completed' check (status in ('completed', 'pending', 'cancelled')),
  notes text
);

-- RLS para Pagos
alter table public.payments enable row level security;

-- En modo demo/dev permitimos acceso total al staff
create policy "Staff puede manejar pagos"
  on public.payments for all
  using (true)
  with check (true);

create policy "Usuarios pueden ver sus propios pagos"
  on public.payments for select
  using ( auth.uid() = member_id );
