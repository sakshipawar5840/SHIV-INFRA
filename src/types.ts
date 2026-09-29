export interface Project {
  id: string;
  company_id: string;
  project_name: string;
  project_type?: string;
  location: string;
  city?: string;
  state?: string;
  pincode?: string;
  description?: string;
  flat_types?: string[] | null;
  total_units?: number | null;
  available_units?: number | null;
  area_sqft?: number | null;
  price: number;
  brochure_url?: string | null;
  thumbnail_url?: string | null;
  gallery?: string[] | null;
  amenities?: string[] | null;
  contact_person?: string | null;
  contact_number?: string | null;
  status: 'Planning' | 'Ongoing' | 'Completed' | 'Upcoming';
  progress?: number;
  completion_status?: string;
  possession_date?: string;
  created_at?: string;
  updated_at?: string;
  images?: any[];
  is_deleted?: boolean;
  deleted_at?: string;
}

export interface Lead {
  id: string;
  company_id: string;
  customer_id?: string | null;
  project_id?: string | null;
  lead_source: string;
  requirement: string;
  budget: number;
  preferred_location: string;
  status: 'New' | 'Follow Up' | 'Hot' | 'Closed' | 'Lost';
  assigned_to?: string | null;
  remarks?: string;
  created_at?: string;
  updated_at?: string;
  is_deleted?: boolean;
  ai_score?: number;
  ai_summary?: string;
  customers?: {
    id: string;
    full_name: string;
    phone: string;
    email: string;
  };
  projects?: {
    id: string;
    project_name: string;
    location: string;
  };
  name?: string;
  phone?: string;
  email?: string;
  location?: string;
  source?: string;
  notes?: string;
  timelineLogs?: { timestamp: string; text: string; author: string }[];
}

export interface Customer {
  id: string;
  company_id: string;
  full_name: string;
  phone: string;
  email?: string;
  city?: string;
  state?: string;
  pincode?: string;
  address?: string;
  budget?: number | null;
  interested_location?: string;
  interested_property_type?: string;
  status: 'active' | 'inactive';
  source?: string;
  notes?: string;
  last_followup?: string;
  deleted_at?: string;
  created_at?: string;
  updated_at?: string;
  is_deleted?: boolean;
}

export interface Bill {
  id: string;
  company_id: string;
  project_id?: string | null;
  uploaded_by?: string | null;
  vendor_name: string;
  material_name: string;
  quantity?: number | null;
  unit?: string;
  amount: number;
  gst_amount?: number;
  bill_number?: string;
  bill_date?: string;
  payment_status: string;
  bill_file_url?: string;
  ocr_text?: any;
  remarks?: string;
  approved_by?: string | null;
  created_at?: string;
  updated_at?: string;
  vendor?: string;
  material?: string;
  invoice_number?: string;
  gst?: number;
  file_name?: string;
  ocr_status?: 'Pending' | 'Success' | 'Failed';
}

export interface Expense {
  id: string;
  company_id: string;
  project_id?: string | null;
  bill_id?: string | null;
  expense_title?: string;
  title?: string;
  description?: string;
  category?: string;
  expense_category?: string;
  amount: number;
  expense_date: string;
  payment_method?: string;
  payment_mode?: string;
  vendor?: string;
  remarks?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  category_display?: string;
  date?: string;
  payment_method_display?: string;
  notes?: string;
}

export interface SiteVisit {
  id: string;
  company_id: string;
  lead_id?: string | null;
  customer_id?: string | null;
  project_id: string;
  visit_date: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled' | 'Postponed';
  notes?: string;
  google_event_id?: string;
  created_at?: string;
  updated_at?: string;
  is_deleted?: boolean;
  leads?: {
    id: string;
    requirement: string;
    preferred_location: string;
    customer_id?: string | null;
    project_id?: string | null;
    customers?: {
      full_name: string;
      phone: string;
    };
    projects?: {
      project_name: string;
      location: string;
    };
  } | null;
  customers?: {
    full_name: string;
    phone: string;
  } | null;
  projects?: {
    project_name: string;
    location: string;
  } | null;
}

export interface InventoryItem {
  id: string;
  company_id: string;
  project_id?: string | null;
  item_name: string;
  category: string;
  quantity: number;
  unit: string;
  minimum_stock?: number;
  unit_price?: number;
  supplier_id?: string | null;
  created_at?: string;
  updated_at?: string;
  is_deleted?: boolean;
}

export interface Vendor {
  id: string;
  company_id: string;
  vendor_name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  gstin?: string;
  rating?: number;
  outstanding_balance?: number;
  created_at?: string;
  updated_at?: string;
  is_deleted?: boolean;
}

export interface TaskItem {
  id: string;
  company_id: string;
  project_id?: string | null;
  title: string;
  description?: string;
  due_date: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
  assigned_to?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface DocumentItem {
  id: string;
  company_id: string;
  project_id?: string;
  document_name: string;
  document_type: string;
  file_url: string;
  file_size: number;
  uploaded_by?: string;
  created_at?: string;
}

export interface NotificationItem {
  id: string;
  company_id: string;
  user_id: string | null;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  status: 'read' | 'unread';
  created_at: string;
}

export interface InquiryItem {
  id: string;
  name: string;
  phone: string;
  project: string;
  location: string;
  budget: number;
  requirement: string;
  created_at: string;
  status: 'New' | 'Interested' | 'Replied' | 'Follow up' | 'Not Interested';
  replied: boolean;
  notes?: string;
  interest_level: 'High' | 'Medium' | 'Low' | 'VIP' | 'Not Interested';
  address?: string;
  email?: string;
  source?: string;
  follow_up?: string;
}

export interface ActivityLog {
  id: string;
  company_id: string;
  user_id?: string | null;
  action: string;
  module: string;
  description: string;
  ip_address?: string | null;
  created_at: string;
}

export interface SystemUser {
  id: string;
  company_id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'Super Admin' | 'Admin' | 'Engineer' | 'Sales Manager' | 'Customer';
  status: 'Active' | 'Inactive' | 'Disabled';
  created_at?: string;
  updated_at?: string;
  is_deleted?: boolean;
}

export interface SystemSettings {
  companyName: string;
  logoUrl?: string;
  email: string;
  phone: string;
  address: string;
  gstNumber: string;
  whatsappApiKey?: string;
  openaiApiKey?: string;
}
