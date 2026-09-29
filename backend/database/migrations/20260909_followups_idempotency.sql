-- =====================================================
-- SHIVINFRA FOLLOWUPS IDEMPOTENCY MIGRATION
-- Adds reference_id and reference_type columns to the
-- followups table so that reminders for the same
-- site visit or task are not duplicated.
-- =====================================================

ALTER TABLE public.followups
    ADD COLUMN IF NOT EXISTS reference_id UUID,
    ADD COLUMN IF NOT EXISTS reference_type VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_followups_reference ON public.followups(reference_type, reference_id, sent);
CREATE INDEX IF NOT EXISTS idx_followups_company_sent ON public.followups(company_id, sent, scheduled_at);
