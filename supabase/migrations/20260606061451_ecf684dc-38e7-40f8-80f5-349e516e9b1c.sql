ALTER TABLE public.medicines
  ADD COLUMN IF NOT EXISTS onchain_hash text,
  ADD COLUMN IF NOT EXISTS onchain_signature text,
  ADD COLUMN IF NOT EXISTS onchain_recorded_at timestamptz;