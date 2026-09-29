-- Add missing chat_history columns to match code expectations

ALTER TABLE public.chat_history
    ADD COLUMN IF NOT EXISTS phone VARCHAR(50) DEFAULT '' NOT NULL;

ALTER TABLE public.chat_history
    ADD COLUMN IF NOT EXISTS sender VARCHAR(50) DEFAULT 'User' NOT NULL CHECK (sender IN ('User', 'Agent', 'System'));
