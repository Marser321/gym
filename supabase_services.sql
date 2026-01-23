-- TABLA DE SERVICIOS / CLASES
create table if not exists public.gym_services (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  title text not null,
  instructor text,
  schedule text,
  capacity_text text,
  image_url text,
  status text default 'active' check (status in ('active', 'cancelled'))
);

-- RLS para Servicios
alter table public.gym_services enable row level security;

create policy "Lectura pública para servicios" on public.gym_services for select using (true);
create policy "Staff maneja servicios" on public.gym_services for all using (true) with check (true);

-- Insertar algunos de prueba
insert into public.gym_services (title, instructor, schedule, capacity_text, image_url, status)
values 
('CrossFit Élite', 'Marcos V.', '07:00 AM - 08:00 AM', '08/12', 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=1470', 'active'),
('Yoga Flow', 'Elena R.', '09:00 AM - 10:00 AM', '12/15', 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1470', 'active'),
('Boxeo Técnico', 'Javier M.', '18:00 PM - 19:30 PM', 'Full', 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?q=80&w=1470', 'active');
