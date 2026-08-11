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
    name VARCHAR(255) NOT NULL,
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
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    requirement VARCHAR(255),
    status VARCHAR(50) DEFAULT 'New' CHECK (status IN ('New', 'Contacted', 'Interested', 'Site Visit Scheduled', 'Negotiation', 'Booked', 'Rejected', 'Not Interested', 'Won', 'Lost')),
    source VARCHAR(100), -- e.g., 'Instagram Ads', 'Facebook Ads', 'Google Search'
    assigned_sales_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    location VARCHAR(255),
    budget VARCHAR(100),
    notes TEXT,
    ai_score INTEGER CHECK (ai_score >= 0 AND ai_score <= 100),
    ai_summary TEXT,
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
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    requirement TEXT,
    budget VARCHAR(100),
    location_preference VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'VIP', 'Inactive', 'Closed')),
    lead_source VARCHAR(100),
    notes TEXT,
    assigned_salesperson_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    last_followup TIMESTAMP WITH TIME ZONE,
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
    file_url TEXT,
    original_file_url TEXT,
    ocr_status VARCHAR(50) DEFAULT 'Pending' CHECK (ocr_status IN ('Pending', 'Processing', 'Success', 'Failed')),
    approved_by UUID REFERENCES public.users(id),
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
    vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
    category VARCHAR(100) NOT NULL, -- e.g., 'Procurement', 'Labor Wages', 'Permit Fees', 'Fuel'
    amount BIGINT DEFAULT 0,
    description TEXT,
    expense_date DATE NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'Cash',
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
    message_text TEXT NOT NULL,
    audience VARCHAR(100), -- e.g., 'All Customers', 'Warm Leads', 'Site Engineers'
    status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Sent', 'Failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.chat_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    phone VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    sender VARCHAR(50) CHECK (sender IN ('User', 'Agent', 'System')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

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
    openai_key_override TEXT,
    google_drive_folder_id VARCHAR(255),
    google_calendar_id VARCHAR(255),
    alert_email VARCHAR(255) DEFAULT 'shivinfra55@gmail.com',
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
