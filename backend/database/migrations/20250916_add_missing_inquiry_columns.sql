-- =====================================================
-- SHIVINFRA INQUIRY MISSING COLUMNS FIX (v2)
-- Adds replied and interest_level columns to inquiries table
-- if they don't exist. Safely updates CHECK constraint for
-- interest_level to include 'Not Interested' if old constraint exists.
-- =====================================================

-- 1. Add replied column if missing
ALTER TABLE public.inquiries
    ADD COLUMN IF NOT EXISTS replied BOOLEAN DEFAULT false NOT NULL;

-- 2. Add interest_level column if missing with correct constraint
ALTER TABLE public.inquiries
    ADD COLUMN IF NOT EXISTS interest_level VARCHAR(50) DEFAULT 'Medium'
    CHECK (interest_level IN ('High', 'Medium', 'Low', 'VIP', 'Not Interested'));

-- 3. If interest_level column exists but has old constraint (without 'Not Interested'),
--    drop the old constraint and add the new one.
--    This handles the case where 20240101_add_missing_tables.sql was applied first.
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- Find the CHECK constraint name on interest_level column
    SELECT conname INTO constraint_name
    FROM pg_constraint c
    JOIN pg_attribute a ON a.attnum = ANY(c.conkey)
    WHERE c.conrelid = 'public.inquiries'::regclass
      AND a.attname = 'interest_level'
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) NOT ILIKE '%Not Interested%';

    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE public.inquiries DROP CONSTRAINT %I', constraint_name);
        EXECUTE $$
            ALTER TABLE public.inquiries
            ADD CONSTRAINT inquiries_interest_level_check
            CHECK (interest_level IN ('High', 'Medium', 'Low', 'VIP', 'Not Interested'))
        $$;
    END IF;
END $$;

-- 4. Update existing rows to have default values (idempotent)
UPDATE public.inquiries
SET replied = false
WHERE replied IS NULL;

UPDATE public.inquiries
SET interest_level = 'Medium'
WHERE interest_level IS NULL;