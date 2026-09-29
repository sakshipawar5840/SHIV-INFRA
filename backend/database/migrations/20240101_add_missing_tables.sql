-- =========================================
-- SHIVINFRA MISSING TABLES MIGRATION
-- Day 1 Production Conversion
-- =========================================

-- 1. TASKS
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

-- 2. DOCUMENTS (General documents)
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

-- 3. INQUIRIES
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

-- =========================================
-- TRIGGERS FOR UPDATED_AT
-- =========================================

CREATE TRIGGER update_tasks_modtime BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE PROCEDURE public.update_modified_column();
CREATE TRIGGER update_documents_modtime BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE PROCEDURE public.update_modified_column();
CREATE TRIGGER update_inquiries_modtime BEFORE UPDATE ON public.inquiries FOR EACH ROW EXECUTE PROCEDURE public.update_modified_column();
