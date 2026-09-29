-- =====================================================
-- SHIVINFRA BROADCAST MIGRATION
-- Creates broadcasts and broadcast_recipients tables
-- for WhatsApp broadcast messaging feature
-- =====================================================

-- ==========================================
-- BROADCASTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.broadcasts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    created_by UUID REFERENCES public.users(id),
    message_text TEXT NOT NULL,
    audience VARCHAR(100),
    status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Sent', 'Failed', 'Partial')),
    recipient_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- ==========================================
-- BROADCAST RECIPIENTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.broadcast_recipients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    broadcast_id UUID REFERENCES public.broadcasts(id) ON DELETE CASCADE NOT NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    phone VARCHAR(50) NOT NULL,
    recipient_type VARCHAR(50) CHECK (recipient_type IN ('customer', 'lead')),
    recipient_id UUID,
    provider_message_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Sent', 'Failed', 'Skipped')),
    error TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- INDEXES
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_broadcasts_company ON public.broadcasts(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_broadcast_recipients_broadcast ON public.broadcast_recipients(broadcast_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_recipients_phone ON public.broadcast_recipients(phone);

-- ==========================================
-- ROW LEVEL SECURITY
-- ==========================================
ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcast_recipients ENABLE ROW LEVEL SECURITY;

-- Broadcasts policy: company members can access their company's broadcasts
CREATE POLICY IF NOT EXISTS broadcast_admin_crud ON public.broadcasts
    FOR ALL
    USING (company_id = current_setting('request.jwt.claims', true)::json->>'company_id'::uuid)
    WITH CHECK (company_id = current_setting('request.jwt.claims', true)::json->>'company_id'::uuid);

-- Broadcast recipients policy: company members can access their company's recipients
CREATE POLICY IF NOT EXISTS broadcast_recipients_admin ON public.broadcast_recipients
    FOR ALL
    USING (company_id = current_setting('request.jwt.claims', true)::json->>'company_id'::uuid)
    WITH CHECK (company_id = current_setting('request.jwt.claims', true)::json->>'company_id'::uuid);
