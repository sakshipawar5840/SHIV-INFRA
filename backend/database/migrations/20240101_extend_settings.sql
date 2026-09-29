-- Extend settings table for arbitrary key-value storage
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS settings_data JSONB DEFAULT '{}'::jsonb;
