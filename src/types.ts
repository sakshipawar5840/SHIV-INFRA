export interface Project {
  id: string;
  name: string;
  location: string;
  flat_type: string;
  sqft: string;
  price: number;
  status: 'Planning' | 'Ongoing' | 'Completed' | 'Upcoming';
  description: string;
  progress: number;
  completion_status?: string;
  possession_date?: string;
  image_url?: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  requirement: string;
  location: string;
  budget: number; // in INR
  status: 'New' | 'Contacted' | 'Interested' | 'Site Visit' | 'Negotiation' | 'Booked' | 'Rejected';
  source: string;
  assigned_to?: string;
  notes?: string;
  timelineLogs?: { timestamp: string; text: string; author: string }[];
  created_at?: string;
  is_deleted?: boolean;
  ai_score?: number;
  ai_summary?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  requirement: string;
  budget: number;
  location_preference: string;
  status: 'Active' | 'VIP' | 'Inactive' | 'Closed';
  notes?: string;
}

export interface Bill {
  id: string;
  project_id: string;
  vendor: string;
  amount: number;
  material: string;
  bill_date: string;
  file_name?: string;
  ocr_status: 'Pending' | 'Success' | 'Failed';
  invoice_number?: string;
  quantity?: number;
  unit?: string;
  gst?: number;
}

export interface Expense {
  id: string;
  project_id: string;
  category: string;
  amount: number;
  date: string;
  payment_method: string;
  notes?: string;
}

export interface SiteVisit {
  id: string;
  lead_id: string;
  customer_name: string;
  project_name: string;
  visit_date: string; // YYYY-MM-DD
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  engineer?: string;
}

export interface InventoryItem {
  id: string;
  item_name: string;
  category: string;
  quantity: number;
  unit: string;
  minimum_level: number;
  unit_price: number;
  warehouse_location: string;
}

export interface Vendor {
  id: string;
  name: string;
  phone: string;
  email: string;
  material_type: string;
  pending_balance: number;
  rating: number;
}

export interface TaskItem {
  id: string;
  title: string;
  due_date: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Completed' | 'Pending';
  assigned_to: string;
}

export interface DocumentItem {
  id: string;
  name: string;
  type: string; // PDF, PNG, XLSX, etc.
  category: string;
  size: string;
  uploaded_at: string;
}

export interface NotificationItem {
  id: string;
  company_id: string;
  user_id: string;
  customer_id: string;
  title: string;
  message: string;
  type: string; // 'enquiry' | 'visit' | 'payment' | 'bill' | 'support' etc.
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
  interest_level: 'High' | 'Medium' | 'Low' | 'VIP';
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  type: 'Access' | 'Create' | 'Update' | 'Delete';
  description: string;
  user: string;
}

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: 'Super Admin' | 'Admin' | 'Engineer' | 'Sales Executive' | 'Customer';
  status: 'Active' | 'Inactive';
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
