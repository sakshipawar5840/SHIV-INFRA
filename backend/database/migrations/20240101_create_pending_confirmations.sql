-- =====================================================
-- SHIVINFRA PERSISTENT CONFIRMATION STORAGE
-- Production-safe confirmation handling with Supabase persistence
-- =====================================================

-- ==========================================
-- PENDING CONFIRMATIONS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.pending_confirmations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    phone VARCHAR(50) NOT NULL,
    intent VARCHAR(100) NOT NULL,
    intent_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'EXPIRED')),
    action_executed BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(company_id, phone, status)
);

-- ==========================================
-- INDEXES
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_pending_confirmations_company_phone ON public.pending_confirmations(company_id, phone);
CREATE INDEX IF NOT EXISTS idx_pending_confirmations_status ON public.pending_confirmations(status);
CREATE INDEX IF NOT EXISTS idx_pending_confirmations_expires ON public.pending_confirmations(expires_at);

-- ==========================================
-- ROW LEVEL SECURITY
-- ==========================================
ALTER TABLE public.pending_confirmations ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if exists (idempotent)
DROP POLICY IF EXISTS pending_confirmations_admin ON public.pending_confirmations;

-- Policy: company members can access their company's confirmations
-- Uses explicit parentheses for correct operator precedence
CREATE POLICY pending_confirmations_admin ON public.pending_confirmations
    FOR ALL
    USING ((current_setting('request.jwt.claims', true)::json->>'company_id')::uuid = company_id)
    WITH CHECK ((current_setting('request.jwt.claims', true)::json->>'company_id')::uuid = company_id);

-- ==========================================
-- CLEANUP FUNCTION (optional, for cron jobs)
-- ==========================================
CREATE OR REPLACE FUNCTION public.expire_pending_confirmations()
RETURNS void AS $$
BEGIN
    UPDATE public.pending_confirmations
    SET status = 'EXPIRED'
    WHERE status = 'PENDING'
    AND expires_at < now();
END;
$$ LANGUAGE plpgsql;
