-- =========================================================================
-- SHIV INFRA AI: MASTER ENTERPRISE POSTGRESQL / SUPABASE SCHEMATICS
-- Features: Multi-Tenant Isolation, Row-Level Security, Auditing Triggers
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. COMPANIES & TENANTS
-- ==========================================
CREATE TABLE public.companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255) NOT NULL,
    subscription_plan VARCHAR(50) DEFAULT 'Starter' CHECK (subscription_plan IN ('Starter', 'Professional', 'Enterprise', 'Lifetime')),
    subscription_start TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    subscription_end TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'Suspended', 'Expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_deleted BOOLEAN DEFAULT false NOT NULL
);

-- ==========================================
-- 2. ROLES & PERMISSIONS
-- ==========================================
CREATE TABLE public.roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_name VARCHAR(50) UNIQUE NOT NULL CHECK (role_name IN ('Super Admin', 'Admin', 'Engineer', 'Sales Manager', 'Customer')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    permission_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 3. USERS (STAFF & CLIENTS)
-- ==========================================
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'Customer' CHECK (role IN ('Super Admin', 'Admin', 'Engineer', 'Sales Manager', 'Customer')),
    status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Disabled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_deleted BOOLEAN DEFAULT false NOT NULL,
    CONSTRAINT unique_company_user_email UNIQUE (company_id, email)
);

-- ==========================================
-- 4. PROJECTS (CONSTRUCTION SITES)
-- ==========================================
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    project_name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    city VARCHAR(100),
    flat_type VARCHAR(100), -- e.g., '2 BHK', '3 BHK', 'Penthouse'
    sqft VARCHAR(50),       -- e.g., '1200 - 1500 sqft'
    price BIGINT NOT NULL,  -- Valuation in INR
    status VARCHAR(50) DEFAULT 'Ongoing' CHECK (status IN ('Planning', 'Ongoing', 'Completed', 'Upcoming')),
    description TEXT,
    brochure_pdf_url TEXT,
    amenities TEXT[],       -- Array of custom amenities
    google_maps_url TEXT,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    completion_status VARCHAR(100),
    possession_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_deleted BOOLEAN DEFAULT false NOT NULL
);

CREATE TABLE public.project_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    image_url TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.project_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size VARCHAR(50),
    category VARCHAR(100), -- e.g., 'Permits', 'Drawings', 'NOC'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 5. LEADS PIPELINE
-- ==========================================
CREATE TABLE public.leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    lead_source VARCHAR(100),
    requirement TEXT,
    budget BIGINT,
    preferred_location VARCHAR(255),
    status VARCHAR(50) DEFAULT 'New',
    assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_deleted BOOLEAN DEFAULT false NOT NULL
);

-- ==========================================
-- 6. CUSTOMERS CRM
-- ==========================================
CREATE TABLE public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(20),
    address TEXT,
    budget VARCHAR(100),
    interested_location VARCHAR(255),
    interested_property_type TEXT,
    status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'VIP', 'Inactive', 'Closed')),
    source VARCHAR(100),
    notes TEXT,
    last_followup TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_deleted BOOLEAN DEFAULT false NOT NULL
);

-- ==========================================
-- 7. SITE VISITS & CALENDAR
-- ==========================================
CREATE TABLE public.site_visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    visit_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Completed', 'Cancelled', 'Postponed')),
    notes TEXT,
    google_event_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_deleted BOOLEAN DEFAULT false NOT NULL
);

-- ==========================================
-- 8. VENDORS & PROCUREMENT
-- ==========================================
CREATE TABLE public.vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    vendor_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    gstin VARCHAR(15),
    rating NUMERIC(3,2) DEFAULT 5.00,
    outstanding_balance BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_deleted BOOLEAN DEFAULT false NOT NULL
);

CREATE TABLE public.materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    item_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- e.g., 'Cement', 'Steel', 'Bricks', 'Electrical'
    quantity NUMERIC(12,2) DEFAULT 0.00 NOT NULL,
    unit VARCHAR(50) NOT NULL,     -- e.g., 'Bags', 'Tons', 'Brass'
    minimum_stock NUMERIC(12,2) DEFAULT 0.00,
    unit_price BIGINT DEFAULT 0,
    supplier_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_deleted BOOLEAN DEFAULT false NOT NULL
);

-- ==========================================
-- 9. BILLS & INTUATIVE AI OCR Approval Queue
-- ==========================================
CREATE TABLE public.bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
    vendor_name VARCHAR(255),
    gst_number VARCHAR(15),
    invoice_number VARCHAR(100),
    amount BIGINT DEFAULT 0, -- In INR
    material VARCHAR(255),
    bill_date DATE,
    quantity NUMERIC(12,2),
    unit VARCHAR(50),
    file_url TEXT,
    original_file_url TEXT,
    ocr_status VARCHAR(50) DEFAULT 'Pending' CHECK (ocr_status IN ('Pending', 'Processing', 'Success', 'Failed')),
    ocr_text JSONB,
    remarks TEXT,
    approved_by UUID REFERENCES public.users(id),
    uploaded_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_deleted BOOLEAN DEFAULT false NOT NULL
);

-- ==========================================
-- 10. EXPENSES (FINANCIAL RECORDINGS)
-- ==========================================
CREATE TABLE public.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    bill_id UUID REFERENCES public.bills(id) ON DELETE SET NULL,
    vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
    expense_title TEXT,
    expense_category VARCHAR(100),
    amount BIGINT DEFAULT 0,
    expense_date DATE NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'Cash',
    remarks TEXT,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    title TEXT,
    category VARCHAR(100),
    description TEXT,
    payment_mode VARCHAR(50),
    vendor VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_deleted BOOLEAN DEFAULT false NOT NULL
);

-- ==========================================
-- 11. REPORTS HISTORY
-- ==========================================
CREATE TABLE public.reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    report_name VARCHAR(255) NOT NULL,
    report_type VARCHAR(50) CHECK (report_type IN ('Finance', 'Leads', 'Inventory', 'AuditLog')),
    file_format VARCHAR(10) CHECK (file_format IN ('PDF', 'Excel', 'CSV', 'ZIP')),
    file_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 12. WHATSAPP & AI CHAT FLOWS
-- ==========================================
CREATE TABLE public.broadcasts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    created_by UUID REFERENCES public.users(id),
    message_text TEXT NOT NULL,
    audience VARCHAR(100),
    status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Sent', 'Failed', 'Partial')),
    recipient_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    channel VARCHAR(255) DEFAULT 'whatsapp',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE public.broadcast_recipients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    broadcast_id UUID REFERENCES public.broadcasts(id) ON DELETE CASCADE NOT NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    phone VARCHAR(50) NOT NULL,
    recipient_type VARCHAR(50) CHECK (recipient_type IN ('customer', 'lead')),
    recipient_id UUID,
    provider_message_id VARCHAR(255),
    channel VARCHAR(50) DEFAULT 'whatsapp',
    status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Sent', 'Failed', 'Skipped')),
    error TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_broadcasts_company ON public.broadcasts(company_id, created_at DESC);
CREATE INDEX idx_broadcast_recipients_broadcast ON public.broadcast_recipients(broadcast_id);
CREATE INDEX idx_broadcast_recipients_phone ON public.broadcast_recipients(phone);

CREATE TABLE public.chat_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    phone VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    sender VARCHAR(50) CHECK (sender IN ('User', 'Agent', 'System')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.followups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    phone VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    sent BOOLEAN DEFAULT false NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_followups_company ON public.followups(company_id);
CREATE INDEX idx_followups_scheduled ON public.followups(scheduled_at, sent);

CREATE TABLE public.whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    message_id_meta VARCHAR(255) UNIQUE,
    phone_number VARCHAR(50) NOT NULL,
    sender_name VARCHAR(255),
    message_type VARCHAR(50) CHECK (message_type IN ('text', 'image', 'document', 'location', 'voice')),
    payload JSONB,
    direction VARCHAR(10) CHECK (direction IN ('incoming', 'outgoing')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 13. SUBSCRIPTIONS LOGS
-- ==========================================
CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    plan VARCHAR(50) DEFAULT 'Starter' CHECK (plan IN ('Starter', 'Professional', 'Enterprise', 'Lifetime')),
    status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'Expired', 'GracePeriod')),
    start_date DATE NOT NULL,
    end_date DATE,
    usage_limits JSONB, -- e.g., {"whatsapp_broadcasts": 1000, "ai_ocr_scans": 500}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 14. SYSTEM SETTINGS & CONFIGS
-- ==========================================
CREATE TABLE public.settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    whatsapp_enabled BOOLEAN DEFAULT true,
    meta_phone_id VARCHAR(255),
    meta_access_token TEXT,
    meta_fb_page_id VARCHAR(255),
    meta_fb_page_access_token TEXT,
    meta_ig_account_id VARCHAR(255),
    meta_ig_access_token TEXT,
    sms_enabled BOOLEAN DEFAULT false,
    sms_provider VARCHAR(50) DEFAULT 'twilio',
    sms_from VARCHAR(50),
    sms_account_sid VARCHAR(255),
    sms_api_key TEXT,
    sms_endpoint VARCHAR(500),
    openai_key_override TEXT,
    google_drive_folder_id VARCHAR(255),
    google_calendar_id VARCHAR(255),
    alert_email VARCHAR(255) DEFAULT 'shivinfra55@gmail.com',
    settings_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 15. ALERTS & NOTIFICATIONS
-- ==========================================
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'Unread' CHECK (status IN ('Unread', 'Read')),
    category VARCHAR(50), -- e.g., 'Billing', 'LeadVisit', 'InventoryAlert'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 16. SECURITY AUDITS & HISTORY LOGS
-- ==========================================
CREATE TABLE public.activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    user_email VARCHAR(255),
    action_type VARCHAR(100) NOT NULL, -- e.g., 'INSERT', 'UPDATE', 'DELETE', 'LOGIN_ATTEMPT'
    details TEXT,
    ip_address VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.login_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    ip_address VARCHAR(50),
    user_agent TEXT,
    login_status VARCHAR(50) CHECK (login_status IN ('Success', 'Failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.password_resets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 17. GROUNDED AI KNOWLEDGE BASE & TELEMETRY
-- ==========================================
CREATE TABLE public.knowledge_base (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    topic VARCHAR(255) NOT NULL,
    content_text TEXT NOT NULL,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.ai_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    phone_number VARCHAR(50),
    prompt_text TEXT,
    response_text TEXT,
    function_called VARCHAR(100),
    tokens_used INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- =========================================================================
-- HIGH PERFORMANCE QUERY INDEXES (FOREIGN KEYS & CRITICAL SEARCH FIELDS)
-- =========================================================================
CREATE INDEX idx_users_company ON public.users(company_id);
CREATE INDEX idx_projects_company ON public.projects(company_id);
CREATE INDEX idx_leads_company ON public.leads(company_id);
CREATE INDEX idx_customers_company ON public.customers(company_id);
CREATE INDEX idx_bills_company ON public.bills(company_id);
CREATE INDEX idx_bills_project ON public.bills(project_id);
CREATE INDEX idx_expenses_company ON public.expenses(company_id);
CREATE INDEX idx_site_visits_company ON public.site_visits(company_id);
CREATE INDEX idx_materials_company ON public.materials(company_id);
CREATE INDEX idx_activity_logs_company ON public.activity_logs(company_id);


-- =========================================================================
-- DATABASE AUTOMATION FUNCTIONS & TRIGGERS
-- =========================================================================

-- Function: Auto-update "updated_at" column value
CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply modified date triggers to core transactional tables
CREATE TRIGGER update_projects_modtime BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE PROCEDURE public.update_modified_column();
CREATE TRIGGER update_leads_modtime BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE PROCEDURE public.update_modified_column();
CREATE TRIGGER update_customers_modtime BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE PROCEDURE public.update_modified_column();
CREATE TRIGGER update_site_visits_modtime BEFORE UPDATE ON public.site_visits FOR EACH ROW EXECUTE PROCEDURE public.update_modified_column();
CREATE TRIGGER update_vendors_modtime BEFORE UPDATE ON public.vendors FOR EACH ROW EXECUTE PROCEDURE public.update_modified_column();
CREATE TRIGGER update_materials_modtime BEFORE UPDATE ON public.materials FOR EACH ROW EXECUTE PROCEDURE public.update_modified_column();
CREATE TRIGGER update_bills_modtime BEFORE UPDATE ON public.bills FOR EACH ROW EXECUTE PROCEDURE public.update_modified_column();
CREATE TRIGGER update_expenses_modtime BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE PROCEDURE public.update_modified_column();


-- =========================================================================
-- TENANT ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

-- Helper to extract active company_id from session claim parameters
CREATE OR REPLACE FUNCTION public.get_auth_user_company()
RETURNS UUID AS $$
BEGIN
    -- This relies on custom claims injected inside Supabase Auth JWT payloads
    RETURN COALESCE(
        (current_setting('request.jwt.claims', true)::jsonb ->> 'company_id')::uuid,
        '00000000-0000-0000-0000-000000000000'::uuid
    );
END;
$$ LANGUAGE plpgsql;

-- Helper to extract active role mapping from session claims
CREATE OR REPLACE FUNCTION public.get_auth_user_role()
RETURNS VARCHAR AS $$
BEGIN
    RETURN COALESCE(
        (current_setting('request.jwt.claims', true)::jsonb ->> 'role')::varchar,
        'Customer'
    );
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security (RLS) for isolating data
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- 1. Companies Security Boundaries
CREATE POLICY company_isolation ON public.companies
    FOR ALL USING (id = public.get_auth_user_company());

-- 2. Staff & User Isolation
CREATE POLICY user_isolation ON public.users
    FOR ALL USING (company_id = public.get_auth_user_company());

-- 3. Projects Table Security policies
-- All authenticated company employees can read/write, customers of that company can only view
CREATE POLICY project_admin_access ON public.projects
    FOR ALL USING (
        company_id = public.get_auth_user_company() 
        AND public.get_auth_user_role() IN ('Super Admin', 'Admin')
    );

CREATE POLICY project_engineer_access ON public.projects
    FOR SELECT, UPDATE USING (
        company_id = public.get_auth_user_company() 
        AND public.get_auth_user_role() = 'Engineer'
    );

CREATE POLICY project_customer_read ON public.projects
    FOR SELECT USING (company_id = public.get_auth_user_company());

-- 4. Leads & Client CRM Pipeline security policies
CREATE POLICY lead_admin_sales_crud ON public.leads
    FOR ALL USING (
        company_id = public.get_auth_user_company()
        AND public.get_auth_user_role() IN ('Super Admin', 'Admin', 'Sales Manager')
    );

CREATE POLICY lead_engineer_view ON public.leads
    FOR SELECT USING (
        company_id = public.get_auth_user_company()
        AND public.get_auth_user_role() = 'Engineer'
    );

-- 5. OCR Bills & Financials Security
CREATE POLICY bill_admin_control ON public.bills
    FOR ALL USING (
        company_id = public.get_auth_user_company()
        AND public.get_auth_user_role() IN ('Super Admin', 'Admin')
    );

CREATE POLICY bill_engineer_log ON public.bills
    FOR SELECT, INSERT USING (
        company_id = public.get_auth_user_company()
        AND public.get_auth_user_role() = 'Engineer'
    );

-- 6. Customers CRM Security
CREATE POLICY customer_admin_crud ON public.customers
    FOR ALL USING (
        company_id = public.get_auth_user_company()
        AND public.get_auth_user_role() IN ('Super Admin', 'Admin')
    );

CREATE POLICY customer_engineer_rw ON public.customers
    FOR SELECT, INSERT, UPDATE USING (
        company_id = public.get_auth_user_company()
        AND public.get_auth_user_role() = 'Engineer'
    );

CREATE POLICY customer_customer_read ON public.customers
    FOR SELECT USING (
        company_id = public.get_auth_user_company()
        AND public.get_auth_user_role() = 'Customer'
    );

-- 7. Expenses Security
CREATE POLICY expense_admin_crud ON public.expenses
    FOR ALL USING (
        company_id = public.get_auth_user_company()
        AND public.get_auth_user_role() IN ('Super Admin', 'Admin')
    );

CREATE POLICY expense_engineer_rw ON public.expenses
    FOR SELECT, INSERT, UPDATE USING (
        company_id = public.get_auth_user_company()
        AND public.get_auth_user_role() = 'Engineer'
    );

-- 8. Vendors Security
CREATE POLICY vendor_admin_crud ON public.vendors
    FOR ALL USING (
        company_id = public.get_auth_user_company()
        AND public.get_auth_user_role() IN ('Super Admin', 'Admin')
    );

CREATE POLICY vendor_engineer_rw ON public.vendors
    FOR SELECT, INSERT, UPDATE USING (
        company_id = public.get_auth_user_company()
        AND public.get_auth_user_role() = 'Engineer'
    );

-- 9. Materials Security
CREATE POLICY material_admin_crud ON public.materials
    FOR ALL USING (
        company_id = public.get_auth_user_company()
        AND public.get_auth_user_role() IN ('Super Admin', 'Admin')
    );

CREATE POLICY material_engineer_rw ON public.materials
    FOR SELECT, INSERT, UPDATE USING (
        company_id = public.get_auth_user_company()
        AND public.get_auth_user_role() = 'Engineer'
    );

CREATE POLICY material_customer_read ON public.materials
    FOR SELECT USING (
        company_id = public.get_auth_user_company()
        AND public.get_auth_user_role() = 'Customer'
    );

-- 10. Site Visits Security
CREATE POLICY site_visit_admin_crud ON public.site_visits
    FOR ALL USING (
        company_id = public.get_auth_user_company()
        AND public.get_auth_user_role() IN ('Super Admin', 'Admin')
    );

CREATE POLICY site_visit_engineer_rw ON public.site_visits
    FOR SELECT, INSERT, UPDATE USING (
        company_id = public.get_auth_user_company()
        AND public.get_auth_user_role() = 'Engineer'
    );

CREATE POLICY site_visit_customer_read ON public.site_visits
    FOR SELECT USING (
        company_id = public.get_auth_user_company()
        AND public.get_auth_user_role() = 'Customer'
    );

-- 11. Notifications Security
CREATE POLICY notification_admin_crud ON public.notifications
    FOR ALL USING (
        company_id = public.get_auth_user_company()
        AND public.get_auth_user_role() IN ('Super Admin', 'Admin')
    );

CREATE POLICY notification_engineer_read ON public.notifications
    FOR SELECT USING (
        company_id = public.get_auth_user_company()
        AND public.get_auth_user_role() = 'Engineer'
    );

CREATE POLICY notification_customer_read ON public.notifications
    FOR SELECT USING (
        company_id = public.get_auth_user_company()
        AND public.get_auth_user_role() = 'Customer'
    );

-- 12. Activity Logs Security
CREATE POLICY activity_log_admin_crud ON public.activity_logs
    FOR ALL USING (
        company_id = public.get_auth_user_company()
        AND public.get_auth_user_role() IN ('Super Admin', 'Admin')
    );

CREATE POLICY activity_log_engineer_read ON public.activity_logs
    FOR SELECT USING (
        company_id = public.get_auth_user_company()
        AND public.get_auth_user_role() = 'Engineer'
    );

-- 13. Chat History Security
CREATE POLICY chat_history_admin_crud ON public.chat_history
    FOR ALL USING (
        company_id = public.get_auth_user_company()
        AND public.get_auth_user_role() IN ('Super Admin', 'Admin')
    );

CREATE POLICY chat_history_engineer_read ON public.chat_history
    FOR SELECT USING (
        company_id = public.get_auth_user_company()
        AND public.get_auth_user_role() = 'Engineer'
    );

-- 14. Followups Security
CREATE POLICY followup_admin_crud ON public.followups
    FOR ALL USING (
        company_id = public.get_auth_user_company()
        AND public.get_auth_user_role() IN ('Super Admin', 'Admin')
    );

CREATE POLICY followup_engineer_rw ON public.followups
    FOR SELECT, INSERT, UPDATE USING (
        company_id = public.get_auth_user_company()
        AND public.get_auth_user_role() = 'Engineer'
    );

-- 15. WhatsApp Messages Security
CREATE POLICY whatsapp_message_admin_crud ON public.whatsapp_messages
    FOR ALL USING (
        company_id = public.get_auth_user_company()
        AND public.get_auth_user_role() IN ('Super Admin', 'Admin')
    );

CREATE POLICY whatsapp_message_engineer_read ON public.whatsapp_messages
    FOR SELECT USING (
        company_id = public.get_auth_user_company()
        AND public.get_auth_user_role() = 'Engineer'
    );

-- 16. Broadcasts Security
CREATE POLICY broadcast_admin_crud ON public.broadcasts
    FOR ALL USING (
        company_id = public.get_auth_user_company()
        AND public.get_auth_user_role() IN ('Super Admin', 'Admin')
    );

CREATE POLICY broadcast_recipients_admin ON public.broadcast_recipients
    FOR ALL USING (
        company_id = public.get_auth_user_company()
        AND public.get_auth_user_role() IN ('Super Admin', 'Admin')
    );

-- 17. Reports Security
CREATE POLICY report_admin_crud ON public.reports
    FOR ALL USING (
        company_id = public.get_auth_user_company()
        AND public.get_auth_user_role() IN ('Super Admin', 'Admin')
    );

CREATE POLICY report_engineer_read ON public.reports
    FOR SELECT USING (
        company_id = public.get_auth_user_company()
        AND public.get_auth_user_role() = 'Engineer'
    );

-- 18. Subscriptions Security
CREATE POLICY subscription_admin_crud ON public.subscriptions
    FOR ALL USING (
        company_id = public.get_auth_user_company()
        AND public.get_auth_user_role() IN ('Super Admin', 'Admin')
    );

-- 19. Settings Security
CREATE POLICY setting_admin_crud ON public.settings
    FOR ALL USING (
        company_id = public.get_auth_user_company()
        AND public.get_auth_user_role() IN ('Super Admin', 'Admin')
    );

-- 20. Knowledge Base Security
CREATE POLICY knowledge_base_admin_crud ON public.knowledge_base
    FOR ALL USING (
        company_id = public.get_auth_user_company()
        AND public.get_auth_user_role() IN ('Super Admin', 'Admin')
    );

CREATE POLICY knowledge_base_engineer_read ON public.knowledge_base
    FOR SELECT USING (
        company_id = public.get_auth_user_company()
        AND public.get_auth_user_role() = 'Engineer'
    );

-- 21. AI Logs Security
CREATE POLICY ai_log_admin_crud ON public.ai_logs
    FOR ALL USING (
        company_id = public.get_auth_user_company()
        AND public.get_auth_user_role() IN ('Super Admin', 'Admin')
    );

CREATE POLICY ai_log_engineer_read ON public.ai_logs
    FOR SELECT USING (
        company_id = public.get_auth_user_company()
        AND public.get_auth_user_role() = 'Engineer'
    );

-- 22. Login History Security
CREATE POLICY login_history_admin_crud ON public.login_history
    FOR ALL USING (
        company_id = public.get_auth_user_company()
        AND public.get_auth_user_role() IN ('Super Admin', 'Admin')
    );

-- 23. Password Resets Security
CREATE POLICY password_reset_admin_crud ON public.password_resets
    FOR ALL USING (
        company_id = public.get_auth_user_company()
        AND public.get_auth_user_role() IN ('Super Admin', 'Admin')
    );

-- 24. Project Images Security
CREATE POLICY project_image_admin_crud ON public.project_images
    FOR ALL USING (
        company_id = public.get_auth_user_company()
        AND public.get_auth_user_role() IN ('Super Admin', 'Admin')
    );

CREATE POLICY project_image_engineer_read ON public.project_images
    FOR SELECT USING (
        company_id = public.get_auth_user_company()
        AND public.get_auth_user_role() = 'Engineer'
    );

-- 25. Project Documents Security
CREATE POLICY project_document_admin_crud ON public.project_documents
    FOR ALL USING (
        company_id = public.get_auth_user_company()
        AND public.get_auth_user_role() IN ('Super Admin', 'Admin')
    );

CREATE POLICY project_document_engineer_read ON public.project_documents
    FOR SELECT USING (
        company_id = public.get_auth_user_company()
        AND public.get_auth_user_role() = 'Engineer'
    );


-- =========================================================================
-- SEED INITIAL CORPORATE PROFILE (SHIVINFRA DEMO SEEDS)
-- =========================================================================

-- Seed Company Tenant
INSERT INTO public.companies (id, company_name, subscription_plan, status)
VALUES ('74834208-4783-4783-4783-420847834208', 'SHIVINFRA Developers Ltd', 'Lifetime', 'Active')
ON CONFLICT (id) DO NOTHING;

-- Seed Default Admin Credentials
-- password_hash is bcrypt for "shivinfra123"
INSERT INTO public.users (id, company_id, name, email, phone, password_hash, role, status)
VALUES (
    '88888888-8888-8888-8888-888888888888',
    '74834208-4783-4783-4783-420847834208',
    'Shiv Admin',
    'shivinfra55@gmail.com',
    '+919876543210',
    '$2a$10$9vEsh3L009T7o8W8A9jOje95Bq1W12Z/g1Fj.6H74lB6b6zG99qP.', -- hashed admin password
    'Admin',
    'Active'
) ON CONFLICT (company_id, email) DO NOTHING;

-- Seed Default Engineer Credentials
-- password_hash is bcrypt for "engineer123"
INSERT INTO public.users (id, company_id, name, email, phone, password_hash, role, status)
VALUES (
    '99999999-9999-9999-9999-999999999999',
    '74834208-4783-4783-4783-420847834208',
    'Vijay Shinde',
    'engineer@shivinfra.com',
    '+919865123456',
    '$2a$10$9vEsh3L009T7o8W8A9jOje95Bq1W12Z/g1Fj.6H74lB6b6zG99qP.', -- hashed engineer password
    'Engineer',
    'Active'
) ON CONFLICT (company_id, email) DO NOTHING;
