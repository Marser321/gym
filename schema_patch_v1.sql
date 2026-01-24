-- =============================================
-- FIX: CORRECCIÓN DE COLUMNAS FALTANTES
-- Ejecutar este script en el SQL Editor de Supabase
-- =============================================

-- 1. Agregar columna PHONE si no existe
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='phone') THEN
        ALTER TABLE public.profiles ADD COLUMN phone text;
    END IF;
END $$;

-- 2. Agregar columna DNI si no existe
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='dni') THEN
        ALTER TABLE public.profiles ADD COLUMN dni text;
    END IF;
END $$;

-- 3. Asegurar que las políticas permitan insertar/actualizar estas columnas
-- (Re-aplicamos la política permisiva para el staff)
DROP POLICY IF EXISTS "Staff full access profiles" ON public.profiles;
CREATE POLICY "Staff full access profiles" 
ON public.profiles 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- 4. Verificar tabla de Pagos (por si acaso)
create table if not exists public.payments (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  member_id uuid references public.profiles(id) on delete cascade,
  amount decimal(10,2) not null,
  plan_name text not null,
  payment_method text,
  status text default 'completed'
);
