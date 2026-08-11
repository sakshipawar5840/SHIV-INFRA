import { v4 as uuidv4 } from "uuid";

// Define structured SaaS interfaces matching the PostgreSQL DB schema
export interface Company {
  id: string;
  company_name: string;
  subscription_plan: "Starter" | "Professional" | "Enterprise" | "Lifetime";
  status: "Active" | "Suspended" | "Expired";
  created_at: string;
}

export interface User {
  id: string;
  company_id: string;
  name: string;
  email: string;
  phone: string;
  role: "Super Admin" | "Admin" | "Engineer" | "Sales Manager" | "Customer";
  status: "Active" | "Inactive" | "Disabled";
  created_at: string;
}

export interface Project {
  id: string;
  company_id: string;
  name: string;
  location: string;
  city: string;
  flat_type: string;
  sqft: string;
  price: number;
  status: "Planning" | "Ongoing" | "Completed" | "Upcoming";
  description: string;
  progress: number;
  brochure_pdf_url?: string;
  amenities: string[];
  google_maps_url?: string;
  created_at: string;
}

export interface Lead {
  id: string;
  company_id: string;
  name: string;
  phone: string;
  email?: string;
  requirement?: string;
  status: "New" | "Contacted" | "Interested" | "Site Visit Scheduled" | "Negotiation" | "Booked" | "Rejected" | "Not Interested" | "Won" | "Lost";
  source?: string;
  assigned_sales_id?: string | null;
  location?: string;
  budget?: string;
  notes?: string;
  created_at: string;
}

export interface Customer {
  id: string;
  company_id: string;
  name: string;
  phone: string;
  email?: string;
  requirement?: string;
  budget?: string;
  location_preference?: string;
  status: "Active" | "VIP" | "Inactive" | "Closed";
  notes?: string;
  created_at: string;
}

export interface SiteVisit {
  id: string;
  company_id: string;
  lead_id?: string;
  customer_id?: string;
  project_id: string;
  visit_date: string;
  status: "Scheduled" | "Completed" | "Cancelled" | "Postponed";
  notes?: string;
  google_event_id?: string;
  created_at: string;
}

export interface Bill {
  id: string;
  company_id: string;
  project_id?: string;
  vendor_id?: string;
  vendor_name?: string;
  gst_number?: string;
  invoice_number?: string;
  amount: number;
  material?: string;
  bill_date: string;
  file_url?: string;
  ocr_status: "Pending" | "Processing" | "Success" | "Failed";
  created_at: string;
}

export interface Expense {
  id: string;
  company_id: string;
  project_id?: string;
  vendor_id?: string;
  category: string;
  amount: number;
  description?: string;
  expense_date: string;
  payment_method?: string;
  created_at: string;
}

export interface Vendor {
  id: string;
  company_id: string;
  vendor_name: string;
  contact_person?: string;
  phone?: string;
  gstin?: string;
  created_at: string;
}

export interface Material {
  id: string;
  company_id: string;
  project_id?: string;
  item_name: string;
  category: string;
  quantity: number;
  unit: string;
  unit_price: number;
  created_at: string;
}

// Global In-Memory Database Seed Objects
export const mockCompanies: Company[] = [
  {
    id: "74834208-4783-4783-4783-420847834208",
    company_name: "SHIVINFRA Developers Ltd",
    subscription_plan: "Lifetime",
    status: "Active",
    created_at: new Date().toISOString(),
  },
];

export const mockUsers: User[] = [
  {
    id: "88888888-8888-8888-8888-888888888888",
    company_id: "74834208-4783-4783-4783-420847834208",
    name: "Shiv Admin",
    email: "shivinfra55@gmail.com",
    phone: "+919876543210",
    role: "Admin",
    status: "Active",
    created_at: new Date().toISOString(),
  },
  {
    id: "99999999-9999-9999-9999-999999999999",
    company_id: "74834208-4783-4783-4783-420847834208",
    name: "Vijay Shinde",
    email: "engineer@shivinfra.com",
    phone: "+919865123456",
    role: "Engineer",
    status: "Active",
    created_at: new Date().toISOString(),
  },
];

export const mockProjects: Project[] = [
  {
    id: "p1",
    company_id: "74834208-4783-4783-4783-420847834208",
    name: "Shiv Horizon",
    location: "Kharadi, Pune",
    city: "Pune",
    flat_type: "2 & 3 BHK",
    sqft: "1050 - 1450 sqft",
    price: 7800000,
    status: "Ongoing",
    description: "Premium luxury residential towers featuring 20+ smart architectural amenities, a modular multi-purpose clubhouse, and an indoor automated sports lounge.",
    progress: 65,
    amenities: ["Swimming Pool", "Rooftop Gym", "EV Charging Station", "Clubhouse", "Children's Park"],
    google_maps_url: "https://maps.google.com/?q=Kharadi+Pune",
    created_at: new Date().toISOString(),
  },
  {
    id: "p2",
    company_id: "74834208-4783-4783-4783-420847834208",
    name: "Shiv Solitaire",
    location: "Baner, Pune",
    city: "Pune",
    flat_type: "3 & 4 BHK",
    sqft: "1550 - 2200 sqft",
    price: 13500000,
    status: "Ongoing",
    description: "Elite lifestyle apartments in Baner Hills, incorporating automated lighting grids, double-height ceiling lobbies, and dedicated jogging tracks.",
    progress: 40,
    amenities: ["Clubhouse", "24/7 Security", "Jogging Track", "Power Backup", "Sky Lounge"],
    google_maps_url: "https://maps.google.com/?q=Baner+Pune",
    created_at: new Date().toISOString(),
  },
  {
    id: "p3",
    company_id: "74834208-4783-4783-4783-420847834208",
    name: "Shiv Residency",
    location: "Hadapsar, Pune",
    city: "Pune",
    flat_type: "1 & 2 BHK",
    sqft: "650 - 950 sqft",
    price: 4500000,
    status: "Planning",
    description: "Affordable housing modules targeting working professionals in SP Infocity. Standard amenities, fire systems, and rainwater harvesting built in.",
    progress: 10,
    amenities: ["Children's Park", "Rainwater Harvesting", "Solar Lighting"],
    google_maps_url: "https://maps.google.com/?q=Hadapsar+Pune",
    created_at: new Date().toISOString(),
  },
];

export const mockLeads: Lead[] = [
  {
    id: "l1",
    company_id: "74834208-4783-4783-4783-420847834208",
    name: "Rahul Patil",
    phone: "+919833445566",
    email: "rahul.patil@gmail.com",
    requirement: "3 BHK Premium Flat",
    status: "Interested",
    source: "Instagram Campaign",
    assigned_sales_id: "88888888-8888-8888-8888-888888888888",
    budget: "1.2 Cr",
    location: "Baner",
    notes: "Requires a north-facing flat with higher floor preference. Requested photos of model flat via WhatsApp.",
    created_at: new Date().toISOString(),
  },
  {
    id: "l2",
    company_id: "74834208-4783-4783-4783-420847834208",
    name: "Pooja Mehta",
    phone: "+919711223344",
    email: "pooja.mehta@yahoo.com",
    requirement: "2 BHK Flat",
    status: "Site Visit Scheduled",
    source: "Google Organic Search",
    assigned_sales_id: "88888888-8888-8888-8888-888888888888",
    budget: "80 Lakh",
    location: "Kharadi",
    notes: "Site visit booked for coming Saturday morning. Vijay Shinde assigned as site coordinator.",
    created_at: new Date().toISOString(),
  },
];

export const mockCustomers: Customer[] = [
  {
    id: "c1",
    company_id: "74834208-4783-4783-4783-420847834208",
    name: "Amit Deshmukh",
    phone: "+919655443322",
    email: "amit.desh@gmail.com",
    requirement: "Bought Flat 402, Shiv Horizon",
    budget: "85 Lakh",
    location_preference: "Kharadi",
    status: "Active",
    notes: "Regular installment paid on time. Registration documentation successfully compiled on Google Drive.",
    created_at: new Date().toISOString(),
  },
];

export const mockSiteVisits: SiteVisit[] = [
  {
    id: "v1",
    company_id: "74834208-4783-4783-4783-420847834208",
    lead_id: "l2",
    project_id: "p1",
    visit_date: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 2 days later
    status: "Scheduled",
    notes: "Provide project brochure print and material cost estimates to customer.",
    google_event_id: "calendar_evt_92813",
    created_at: new Date().toISOString(),
  },
];

export const mockBills: Bill[] = [
  {
    id: "b1",
    company_id: "74834208-4783-4783-4783-420847834208",
    project_id: "p1",
    vendor_name: "Ambuja Cements Ltd",
    gst_number: "27AAACA5681A1Z1",
    invoice_number: "INV-2026-9021",
    amount: 145000,
    material: "Portland Pozzolana Cement (PPC)",
    bill_date: "2026-07-02",
    ocr_status: "Success",
    created_at: new Date().toISOString(),
  },
  {
    id: "b2",
    company_id: "74834208-4783-4783-4783-420847834208",
    project_id: "p2",
    vendor_name: "Mahavir Steel Emporium",
    gst_number: "27AAACV1029C2Z8",
    invoice_number: "INV-2026-1029",
    amount: 420000,
    material: "Reinforced Fe-550 TMT Steel Bars",
    bill_date: "2026-07-05",
    ocr_status: "Success",
    created_at: new Date().toISOString(),
  },
];

export const mockExpenses: Expense[] = [
  {
    id: "e1",
    company_id: "74834208-4783-4783-4783-420847834208",
    project_id: "p1",
    category: "Procurement",
    amount: 145000,
    description: "Procured 400 Bags of Ambuja PPC cement for foundation grid completion.",
    expense_date: "2026-07-02",
    payment_method: "RTGS Bank Transfer",
    created_at: new Date().toISOString(),
  },
  {
    id: "e2",
    company_id: "74834208-4783-4783-4783-420847834208",
    project_id: "p2",
    category: "Procurement",
    amount: 420000,
    description: "Paid outstanding invoice to Mahavir steel for reinforced structural bars.",
    expense_date: "2026-07-05",
    payment_method: "Bank Cheque",
    created_at: new Date().toISOString(),
  },
  {
    id: "e3",
    company_id: "74834208-4783-4783-4783-420847834208",
    project_id: "p1",
    category: "Labor Wages",
    amount: 85000,
    description: "Weekly contractor labor compensation disbursements for core slab casting.",
    expense_date: "2026-07-06",
    payment_method: "Cash",
    created_at: new Date().toISOString(),
  },
];

export const mockVendors: Vendor[] = [
  {
    id: "vd1",
    company_id: "74834208-4783-4783-4783-420847834208",
    vendor_name: "Ambuja Cements Ltd",
    contact_person: "Mukund Gokhale",
    phone: "+919922003311",
    gstin: "27AAACA5681A1Z1",
    created_at: new Date().toISOString(),
  },
];

export const mockMaterials: Material[] = [
  {
    id: "m1",
    company_id: "74834208-4783-4783-4783-420847834208",
    project_id: "p1",
    item_name: "Ambuja PPC Cement",
    category: "Cement",
    quantity: 450,
    unit: "Bags",
    unit_price: 362,
    created_at: new Date().toISOString(),
  },
];
