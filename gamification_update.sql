-- Add XP column to profiles
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='xp') THEN
        ALTER TABLE public.profiles ADD COLUMN xp int default 0;
    END IF;
END $$;

-- RPC Function to safely award XP
create or replace function award_xp(user_id uuid, amount int)
returns void
language plpgsql
security definer
as $$
begin
  update public.profiles
  set xp = xp + amount,
      level = floor((xp + amount) / 1000) + 1 -- Simple logic: 1000 XP per level
  where id = user_id;
end;
$$;
