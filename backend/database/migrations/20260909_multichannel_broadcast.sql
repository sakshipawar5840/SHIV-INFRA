-- =====================================================
-- SHIVINFRA MULTI-CHANNEL BROADCAST MIGRATION
-- Extends broadcasts and broadcast_recipients tables to
-- support multi-channel messaging (WhatsApp, Facebook,
-- Instagram, SMS) with per-recipient channel tracking.
-- =====================================================

-- =====================================================
-- 1. EXTEND broadcasts TABLE
--    Add channel column to track which channels were used
-- =====================================================
ALTER TABLE public.broadcasts
    ADD COLUMN IF NOT EXISTS channel VARCHAR(255) DEFAULT 'whatsapp';

-- =====================================================
-- 2. EXTEND settings TABLE
--    Facebook Page ID and Access Token
--    Instagram Account ID and Access Token
--    SMS configuration flags
-- =====================================================
ALTER TABLE public.settings
    ADD COLUMN IF NOT EXISTS meta_fb_page_id VARCHAR(255),
    ADD COLUMN IF NOT EXISTS meta_fb_page_access_token TEXT,
    ADD COLUMN IF NOT EXISTS meta_ig_account_id VARCHAR(255),
    ADD COLUMN IF NOT EXISTS meta_ig_access_token TEXT,
    ADD COLUMN IF NOT EXISTS sms_enabled BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS sms_provider VARCHAR(50) DEFAULT 'twilio',
    ADD COLUMN IF NOT EXISTS sms_from VARCHAR(50),
    ADD COLUMN IF NOT EXISTS sms_account_sid VARCHAR(255),
    ADD COLUMN IF NOT EXISTS sms_api_key TEXT,
    ADD COLUMN IF NOT EXISTS sms_endpoint VARCHAR(500);

-- =====================================================
-- 3. EXTEND broadcast_recipients TABLE
--    Add channel column to track which channel each
--    recipient was contacted on, plus provider_message_id
--    is already present — we keep it as TEXT for any ID.
-- =====================================================
ALTER TABLE public.broadcast_recipients
    ADD COLUMN IF NOT EXISTS channel VARCHAR(50) DEFAULT 'whatsapp';

-- =====================================================
-- 4. INDEXES for the new columns
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_broadcast_recipients_channel ON public.broadcast_recipients(channel);
CREATE INDEX IF NOT EXISTS idx_broadcasts_channel ON public.broadcasts(channel);
CREATE INDEX IF NOT EXISTS idx_settings_fb_page_id ON public.settings(meta_fb_page_id);
CREATE INDEX IF NOT EXISTS idx_settings_ig_account_id ON public.settings(meta_ig_account_id);
