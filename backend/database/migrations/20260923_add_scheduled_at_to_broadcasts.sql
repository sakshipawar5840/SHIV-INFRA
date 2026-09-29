-- =====================================================
-- SHIVINFRA SCHEDULED BROADCAST MIGRATION
-- Add scheduled_at column to broadcasts table for
-- future-scheduled broadcasts, plus status support.
-- =====================================================

-- =====================================================
-- 1. EXTEND broadcasts TABLE
--    Add scheduled_at column for future scheduling
--    Add audience_params JSONB to store audience filters for scheduler
--    Add error column for failure visibility
--    Extend status CHECK to include 'Scheduled' and 'Dispatching'
-- =====================================================
ALTER TABLE public.broadcasts
    ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;

ALTER TABLE public.broadcasts
    ADD COLUMN IF NOT EXISTS audience_params JSONB DEFAULT '{}';

ALTER TABLE public.broadcasts
    ADD COLUMN IF NOT EXISTS error TEXT;

ALTER TABLE public.broadcasts
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- Update status CHECK constraint to include new states
ALTER TABLE public.broadcasts
    DROP CONSTRAINT IF EXISTS broadcasts_status_check;

ALTER TABLE public.broadcasts
    ADD CONSTRAINT broadcasts_status_check
    CHECK (status IN ('Pending', 'Scheduled', 'Dispatching', 'Sent', 'Failed', 'Partial'));

-- Index for efficient scheduler queries
CREATE INDEX IF NOT EXISTS idx_broadcasts_scheduled_at ON public.broadcasts(scheduled_at)
    WHERE status IN ('Scheduled', 'Dispatching');

-- Index for stuck Dispatching recovery queries.
-- Uses updated_at which is maintained on every status update.
CREATE INDEX IF NOT EXISTS idx_broadcasts_dispatching_stuck ON public.broadcasts(status, updated_at)
    WHERE status = 'Dispatching';

-- =====================================================
-- 2. IDEMPOTENCY for scheduled dispatch
--    The scheduler will atomically update status from
--    'Scheduled' to 'Dispatching' before processing.
--    This prevents double-dispatch on concurrent runs.
-- =====================================================
COMMENT ON COLUMN public.broadcasts.scheduled_at IS 'ISO timestamp when broadcast should be sent. Null = send now.';
COMMENT ON COLUMN public.broadcasts.status IS 'Pending=created not sent, Scheduled=future, Dispatching=in progress, Sent/Partial/Failed=done.';
COMMENT ON COLUMN public.broadcasts.audience_params IS 'JSON params for scheduler to resolve recipients: {audience, city, lead_status}';
COMMENT ON COLUMN public.broadcasts.error IS 'Last dispatch error message, if any. Bounded to 2000 chars.';