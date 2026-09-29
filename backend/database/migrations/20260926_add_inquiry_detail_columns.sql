-- =====================================================
-- SHIVINFRA INQUIRY DETAIL CARD FIELDS
-- Safe, idempotent migration.
-- Adds columns required by the Inquiry detail card:
--   address, email, source, follow_up
-- Uses ADD COLUMN IF NOT EXISTS so it never fails
-- on an existing database and never recreates the table.
-- =====================================================

ALTER TABLE public.inquiries
    ADD COLUMN IF NOT EXISTS address VARCHAR(500);

ALTER TABLE public.inquiries
    ADD COLUMN IF NOT EXISTS email VARCHAR(255);

ALTER TABLE public.inquiries
    ADD COLUMN IF NOT EXISTS source VARCHAR(50);

ALTER TABLE public.inquiries
    ADD COLUMN IF NOT EXISTS follow_up TEXT;

-- =====================================================
-- Extend status CHECK to include 'Not Interested'
-- =====================================================

ALTER TABLE public.inquiries
    DROP CONSTRAINT IF EXISTS inquiries_status_check;

ALTER TABLE public.inquiries
    ADD CONSTRAINT inquiries_status_check
    CHECK (status IN (
        'New',
        'Interested',
        'Replied',
        'Follow up',
        'Not Interested'
    ));