-- =========================================
-- SHIVINFRA MISSING TABLES MIGRATION
-- Day 1 Production Conversion
-- =========================================

-- =========================================
-- 1. TASKS
-- =========================================
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE NOT NULL,
    priority VARCHAR(50) DEFAULT 'Medium' CHECK (priority IN ('High', 'Medium', 'Low')),
    status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Cancelled')),
    assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_deleted BOOLEAN DEFAULT false NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tasks_company ON public.tasks(company_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);

-- =========================================
-- 2. DOCUMENTS (General documents)
-- =========================================
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    storage_path TEXT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size BIGINT NOT NULL,
    uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_deleted BOOLEAN DEFAULT false NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_documents_company ON public.documents(company_id);
CREATE INDEX IF NOT EXISTS idx_documents_project ON public.documents(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_customer ON public.documents(customer_id);

-- =========================================
-- 3. INQUIRIES
-- =========================================
CREATE TABLE IF NOT EXISTS public.inquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    project VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    budget BIGINT NOT NULL,
    requirement TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'New' CHECK (status IN ('New', 'Interested', 'Replied', 'Follow up', 'Not Interested')),
    replied BOOLEAN DEFAULT false NOT NULL,
    interest_level VARCHAR(50) DEFAULT 'Medium' CHECK (interest_level IN ('High', 'Medium', 'Low', 'VIP')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_deleted BOOLEAN DEFAULT false NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_inquiries_company ON public.inquiries(company_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON public.inquiries(status);

-- =========================================
-- 4. SITE VISITS (from existing schema)
-- =========================================
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

CREATE INDEX IF NOT EXISTS idx_site_visits_company ON public.site_visits(company_id);
CREATE INDEX IF NOT EXISTS idx_site_visits_project ON public.site_visits(project_id);

-- =========================================
-- 5. VENDORS (from existing schema)
-- =========================================
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

CREATE INDEX IF NOT EXISTS idx_vendors_company ON public.vendors(company_id);

-- =========================================
-- 6. MATERIALS (from existing schema)
-- =========================================
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

CREATE INDEX IF NOT EXISTS idx_materials_company ON public.materials(company_id);
CREATE INDEX IF NOT EXISTS idx_materials_project ON public.materials(project_id);

-- =========================================
-- 7. ACTIVITY LOGS (from existing schema)
-- =========================================
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    user_email VARCHAR(255),
    action_type VARCHAR(100) NOT NULL,
    details TEXT,
    ip_address VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_company ON public.activity_logs(company_id);

-- =========================================
-- 8. SETTINGS (from existing schema)
-- =========================================
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
    settings_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_settings_company ON public.settings(company_id);

-- =========================================
-- 9. DOCUMENTS STORAGE BUCKET (via Supabase Storage)
-- =========================================
-- Note: Supabase Storage buckets must be created via Supabase Dashboard or API
-- Bucket name: documents
-- This migration only creates the metadata table above.
-- Actual file storage requires bucket creation in Supabase Dashboard.

-- =========================================
-- RLS POLICIES FOR NEW TABLES
-- =========================================

-- Tasks
CREATE POLICY task_admin_crud ON public.tasks
    FOR ALL USING (
        company_id = public.get_auth_user_company()
        AND public.get_auth_user_role() IN ('Super Admin', 'Admin')
    );

CREATE POLICY task_engineer_rw ON public.tasks
    FOR SELECT, INSERT, UPDATE USING (
        company_id = public.get_auth_user_company()
        AND public.get_auth_user_role() = 'Engineer'
    );

CREATE POLICY task_customer_read ON public.tasks
    FOR SELECT USING (
        company_id = public.get_auth_user_company()
        AND public.get_auth_user_role() = 'Customer'
    );

-- Documents
CREATE POLICY document_admin_crud ON public.documents
    FOR ALL USING (
        company_id = public.get_auth_user_company()
        AND public.get_auth_user_role() IN ('Super Admin', 'Admin')
    );

CREATE POLICY document_engineer_rw ON public.documents
    FOR SELECT, INSERT, UPDATE USING (
        company_id = public.get_auth_user_company()
        AND public.get_auth_user_role() = 'Engineer'
    );

CREATE POLICY document_customer_read ON public.documents
    FOR SELECT USING (
        company_id = public.get_auth_user_company()
        AND public.get_auth_user_role() = 'Customer'
    );

-- Inquiries
CREATE POLICY inquiry_admin_crud ON public.inquiries
    FOR ALL USING (
        company_id = public.get_auth_user_company()
        AND public.get_auth_user_role() IN ('Super Admin', 'Admin', 'Sales Manager')
    );

CREATE POLICY inquiry_engineer_read ON public.inquiries
    FOR SELECT USING (
        company_id = public.get_auth_user_company()
        AND public.get_auth_user_role() = 'Engineer'
    );

-- Site Visits
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

-- Vendors
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

CREATE POLICY vendor_customer_read ON public.vendors
    FOR SELECT USING (
        company_id = public.get_auth_user_company()
        AND public.get_auth_user_role() = 'Customer'
    );

-- Materials
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

-- Activity Logs
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

-- Settings
CREATE POLICY setting_admin_crud ON public.settings
    FOR ALL USING (
        company_id = public.get_auth_user_company()
        AND public.get_auth_user_role() IN ('Super Admin', 'Admin')
    );

-- =========================================
-- TRIGGERS FOR UPDATED_AT
-- =========================================

CREATE TRIGGER update_tasks_modtime BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE PROCEDURE public.update_modified_column();
CREATE TRIGGER update_documents_modtime BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE PROCEDURE public.update_modified_column();
CREATE TRIGGER update_inquiries_modtime BEFORE UPDATE ON public.inquiries FOR EACH ROW EXECUTE PROCEDURE public.update_modified_column();
CREATE TRIGGER update_site_visits_modtime BEFORE UPDATE ON public.site_visits FOR EACH ROW EXECUTE PROCEDURE public.update_modified_column();
CREATE TRIGGER update_vendors_modtime BEFORE UPDATE ON public.vendors FOR EACH ROW EXECUTE PROCEDURE public.update_modified_column();
CREATE TRIGGER update_materials_modtime BEFORE UPDATE ON public.materials FOR EACH ROW EXECUTE PROCEDURE public.update_modified_column();
CREATE TRIGGER update_settings_modtime BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE PROCEDURE public.update_modified_column();
