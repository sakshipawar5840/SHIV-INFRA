-- =========================================================================
-- SHIV INFRA AI: MISSING TABLES MIGRATION
-- Apply this migration in the Supabase SQL Editor if the following tables
-- are missing from the production database:
--   vendors, materials, site_visits, tasks, inquiries, reports, settings
-- =========================================================================

-- =========================================================================
-- HELPER FUNCTIONS (safe to re-run)
-- =========================================================================
CREATE OR REPLACE FUNCTION public.get_auth_user_company()
RETURNS UUID AS $$
BEGIN
    RETURN COALESCE(
        (current_setting('request.jwt.claims', true)::jsonb ->> 'company_id')::uuid,
        '00000000-0000-0000-0000-000000000000'::uuid
    );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.get_auth_user_role()
RETURNS VARCHAR AS $$
BEGIN
    RETURN COALESCE(
        (current_setting('request.jwt.claims', true)::jsonb ->> 'role')::varchar,
        'Customer'
    );
END;
$$ LANGUAGE plpgsql;

-- =========================================================================
-- 8. VENDORS & PROCUREMENT
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.vendors (
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

-- =========================================================================
-- 9. MATERIALS / INVENTORY
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    item_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    quantity NUMERIC(12,2) DEFAULT 0.00 NOT NULL,
    unit VARCHAR(50) NOT NULL,
    minimum_stock NUMERIC(12,2) DEFAULT 0.00,
    unit_price BIGINT DEFAULT 0,
    supplier_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_deleted BOOLEAN DEFAULT false NOT NULL
);

-- =========================================================================
-- 7. SITE VISITS
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.site_visits (
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

-- =========================================================================
-- TASKS
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
    due_date DATE,
    priority VARCHAR(50) DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
    status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Cancelled')),
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_deleted BOOLEAN DEFAULT false NOT NULL
);

-- =========================================================================
-- INQUIRY XL TRACKER
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.inquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    project VARCHAR(255),
    location VARCHAR(255),
    budget BIGINT,
    requirement TEXT,
    status VARCHAR(50) DEFAULT 'New',
    notes TEXT,
    date DATE,
    time TIME,
    filename VARCHAR(255),
    size VARCHAR(50),
    category VARCHAR(100),
    amount BIGINT,
    complaint_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_deleted BOOLEAN DEFAULT false NOT NULL
);

-- =========================================================================
-- REPORTS HISTORY
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    report_name VARCHAR(255) NOT NULL,
    report_type VARCHAR(50) CHECK (report_type IN ('Finance', 'Leads', 'Inventory', 'AuditLog')),
    file_format VARCHAR(10) CHECK (file_format IN ('PDF', 'Excel', 'CSV', 'ZIP')),
    file_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =========================================================================
-- SYSTEM SETTINGS
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.settings (
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

-- =========================================================================
-- INDEXES
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_vendors_company ON public.vendors(company_id);
CREATE INDEX IF NOT EXISTS idx_materials_company ON public.materials(company_id);
CREATE INDEX IF NOT EXISTS idx_site_visits_company ON public.site_visits(company_id);
CREATE INDEX IF NOT EXISTS idx_tasks_company ON public.tasks(company_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_company ON public.inquiries(company_id);
CREATE INDEX IF NOT EXISTS idx_reports_company ON public.reports(company_id);
CREATE INDEX IF NOT EXISTS idx_settings_company ON public.settings(company_id);

-- =========================================================================
-- ENABLE ROW LEVEL SECURITY
-- =========================================================================
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- RLS POLICIES
-- =========================================================================

-- =========================================================================
-- VENDORS
-- =========================================================================

-- Admin/Manager: full CRUD
DROP POLICY IF EXISTS "VendorAdminCRUD" ON public.vendors;
CREATE POLICY "VendorAdminCRUD"
ON public.vendors
FOR ALL
USING (
    company_id = public.get_auth_user_company()
    AND public.get_auth_user_role() IN ('Super Admin', 'Admin')
)
WITH CHECK (
    company_id = public.get_auth_user_company()
    AND public.get_auth_user_role() IN ('Super Admin', 'Admin')
);

-- Engineer: SELECT + INSERT + UPDATE
DROP POLICY IF EXISTS "VendorEngineerSelect" ON public.vendors;
CREATE POLICY "VendorEngineerSelect"
ON public.vendors
FOR SELECT
USING (
    company_id = public.get_auth_user_company()
    AND public.get_auth_user_role() = 'Engineer'
);

DROP POLICY IF EXISTS "VendorEngineerInsert" ON public.vendors;
CREATE POLICY "VendorEngineerInsert"
ON public.vendors
FOR INSERT
WITH CHECK (
    company_id = public.get_auth_user_company()
    AND public.get_auth_user_role() = 'Engineer'
);

DROP POLICY IF EXISTS "VendorEngineerUpdate" ON public.vendors;
CREATE POLICY "VendorEngineerUpdate"
ON public.vendors
FOR UPDATE
USING (
    company_id = public.get_auth_user_company()
    AND public.get_auth_user_role() = 'Engineer'
)
WITH CHECK (
    company_id = public.get_auth_user_company()
    AND public.get_auth_user_role() = 'Engineer'
);

-- Customer: SELECT only
DROP POLICY IF EXISTS "VendorCustomerRead" ON public.vendors;
CREATE POLICY "VendorCustomerRead"
ON public.vendors
FOR SELECT
USING (
    company_id = public.get_auth_user_company()
    AND public.get_auth_user_role() = 'Customer'
);

-- =========================================================================
-- MATERIALS
-- =========================================================================

-- Admin/Manager: full CRUD
DROP POLICY IF EXISTS "MaterialAdminCRUD" ON public.materials;
CREATE POLICY "MaterialAdminCRUD"
ON public.materials
FOR ALL
USING (
    company_id = public.get_auth_user_company()
    AND public.get_auth_user_role() IN ('Super Admin', 'Admin')
)
WITH CHECK (
    company_id = public.get_auth_user_company()
    AND public.get_auth_user_role() IN ('Super Admin', 'Admin')
);

-- Engineer: SELECT + INSERT + UPDATE
DROP POLICY IF EXISTS "MaterialEngineerSelect" ON public.materials;
CREATE POLICY "MaterialEngineerSelect"
ON public.materials
FOR SELECT
USING (
    company_id = public.get_auth_user_company()
    AND public.get_auth_user_role() = 'Engineer'
);

DROP POLICY IF EXISTS "MaterialEngineerInsert" ON public.materials;
CREATE POLICY "MaterialEngineerInsert"
ON public.materials
FOR INSERT
WITH CHECK (
    company_id = public.get_auth_user_company()
    AND public.get_auth_user_role() = 'Engineer'
);

DROP POLICY IF EXISTS "MaterialEngineerUpdate" ON public.materials;
CREATE POLICY "MaterialEngineerUpdate"
ON public.materials
FOR UPDATE
USING (
    company_id = public.get_auth_user_company()
    AND public.get_auth_user_role() = 'Engineer'
)
WITH CHECK (
    company_id = public.get_auth_user_company()
    AND public.get_auth_user_role() = 'Engineer'
);

-- Customer: SELECT only
DROP POLICY IF EXISTS "MaterialCustomerRead" ON public.materials;
CREATE POLICY "MaterialCustomerRead"
ON public.materials
FOR SELECT
USING (
    company_id = public.get_auth_user_company()
    AND public.get_auth_user_role() = 'Customer'
);

-- =========================================================================
-- SITE VISITS
-- =========================================================================

-- Admin/Manager: full CRUD
DROP POLICY IF EXISTS "SiteVisitAdminCRUD" ON public.site_visits;
CREATE POLICY "SiteVisitAdminCRUD"
ON public.site_visits
FOR ALL
USING (
    company_id = public.get_auth_user_company()
    AND public.get_auth_user_role() IN ('Super Admin', 'Admin')
)
WITH CHECK (
    company_id = public.get_auth_user_company()
    AND public.get_auth_user_role() IN ('Super Admin', 'Admin')
);

-- Engineer: SELECT + INSERT + UPDATE
DROP POLICY IF EXISTS "SiteVisitEngineerSelect" ON public.site_visits;
CREATE POLICY "SiteVisitEngineerSelect"
ON public.site_visits
FOR SELECT
USING (
    company_id = public.get_auth_user_company()
    AND public.get_auth_user_role() = 'Engineer'
);

DROP POLICY IF EXISTS "SiteVisitEngineerInsert" ON public.site_visits;
CREATE POLICY "SiteVisitEngineerInsert"
ON public.site_visits
FOR INSERT
WITH CHECK (
    company_id = public.get_auth_user_company()
    AND public.get_auth_user_role() = 'Engineer'
);

DROP POLICY IF EXISTS "SiteVisitEngineerUpdate" ON public.site_visits;
CREATE POLICY "SiteVisitEngineerUpdate"
ON public.site_visits
FOR UPDATE
USING (
    company_id = public.get_auth_user_company()
    AND public.get_auth_user_role() = 'Engineer'
)
WITH CHECK (
    company_id = public.get_auth_user_company()
    AND public.get_auth_user_role() = 'Engineer'
);

-- Customer: SELECT only
DROP POLICY IF EXISTS "SiteVisitCustomerRead" ON public.site_visits;
CREATE POLICY "SiteVisitCustomerRead"
ON public.site_visits
FOR SELECT
USING (
    company_id = public.get_auth_user_company()
    AND public.get_auth_user_role() = 'Customer'
);

-- =========================================================================
-- TASKS
-- =========================================================================

-- Admin/Manager: full CRUD
DROP POLICY IF EXISTS "TaskAdminCRUD" ON public.tasks;
CREATE POLICY "TaskAdminCRUD"
ON public.tasks
FOR ALL
USING (
    company_id = public.get_auth_user_company()
    AND public.get_auth_user_role() IN ('Super Admin', 'Admin')
)
WITH CHECK (
    company_id = public.get_auth_user_company()
    AND public.get_auth_user_role() IN ('Super Admin', 'Admin')
);

-- Engineer: SELECT + INSERT + UPDATE
DROP POLICY IF EXISTS "TaskEngineerSelect" ON public.tasks;
CREATE POLICY "TaskEngineerSelect"
ON public.tasks
FOR SELECT
USING (
    company_id = public.get_auth_user_company()
    AND public.get_auth_user_role() = 'Engineer'
);

DROP POLICY IF EXISTS "TaskEngineerInsert" ON public.tasks;
CREATE POLICY "TaskEngineerInsert"
ON public.tasks
FOR INSERT
WITH CHECK (
    company_id = public.get_auth_user_company()
    AND public.get_auth_user_role() = 'Engineer'
);

DROP POLICY IF EXISTS "TaskEngineerUpdate" ON public.tasks;
CREATE POLICY "TaskEngineerUpdate"
ON public.tasks
FOR UPDATE
USING (
    company_id = public.get_auth_user_company()
    AND public.get_auth_user_role() = 'Engineer'
)
WITH CHECK (
    company_id = public.get_auth_user_company()
    AND public.get_auth_user_role() = 'Engineer'
);

-- Customer: SELECT only
DROP POLICY IF EXISTS "TaskCustomerRead" ON public.tasks;
CREATE POLICY "TaskCustomerRead"
ON public.tasks
FOR SELECT
USING (
    company_id = public.get_auth_user_company()
    AND public.get_auth_user_role() = 'Customer'
);

-- =========================================================================
-- INQUIRIES
-- =========================================================================

-- Admin/Manager/Sales: full CRUD
DROP POLICY IF EXISTS "InquiryAdminCRUD" ON public.inquiries;
CREATE POLICY "InquiryAdminCRUD"
ON public.inquiries
FOR ALL
USING (
    company_id = public.get_auth_user_company()
    AND public.get_auth_user_role() IN ('Super Admin', 'Admin', 'Sales Manager')
)
WITH CHECK (
    company_id = public.get_auth_user_company()
    AND public.get_auth_user_role() IN ('Super Admin', 'Admin', 'Sales Manager')
);

-- Engineer: SELECT only
DROP POLICY IF EXISTS "InquiryEngineerRead" ON public.inquiries;
CREATE POLICY "InquiryEngineerRead"
ON public.inquiries
FOR SELECT
USING (
    company_id = public.get_auth_user_company()
    AND public.get_auth_user_role() = 'Engineer'
);

-- Customer: SELECT only
DROP POLICY IF EXISTS "InquiryCustomerRead" ON public.inquiries;
CREATE POLICY "InquiryCustomerRead"
ON public.inquiries
FOR SELECT
USING (
    company_id = public.get_auth_user_company()
    AND public.get_auth_user_role() = 'Customer'
);

-- =========================================================================
-- REPORTS
-- =========================================================================

-- Admin/Manager: full CRUD
DROP POLICY IF EXISTS "ReportAdminCRUD" ON public.reports;
CREATE POLICY "ReportAdminCRUD"
ON public.reports
FOR ALL
USING (
    company_id = public.get_auth_user_company()
    AND public.get_auth_user_role() IN ('Super Admin', 'Admin')
)
WITH CHECK (
    company_id = public.get_auth_user_company()
    AND public.get_auth_user_role() IN ('Super Admin', 'Admin')
);

-- Engineer: SELECT only
DROP POLICY IF EXISTS "ReportEngineerRead" ON public.reports;
CREATE POLICY "ReportEngineerRead"
ON public.reports
FOR SELECT
USING (
    company_id = public.get_auth_user_company()
    AND public.get_auth_user_role() = 'Engineer'
);

-- =========================================================================
-- SETTINGS
-- =========================================================================

-- Admin/Manager: full CRUD only
DROP POLICY IF EXISTS "SettingAdminCRUD" ON public.settings;
CREATE POLICY "SettingAdminCRUD"
ON public.settings
FOR ALL
USING (
    company_id = public.get_auth_user_company()
    AND public.get_auth_user_role() IN ('Super Admin', 'Admin')
)
WITH CHECK (
    company_id = public.get_auth_user_company()
    AND public.get_auth_user_role() IN ('Super Admin', 'Admin')
);
