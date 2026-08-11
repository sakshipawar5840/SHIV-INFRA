import { Project, Lead, Customer, Bill, Expense, SiteVisit, InventoryItem, Vendor, TaskItem, DocumentItem, NotificationItem, InquiryItem, ActivityLog, SystemUser, SystemSettings } from '../types';

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'p1',
    name: 'Green Valley',
    location: 'Hinjewadi, Pune',
    flat_type: '2 BHK, 3 BHK',
    sqft: '950 - 1450 sqft',
    price: 6500000,
    status: 'Ongoing',
    description: 'Luxury apartments in the heart of the IT hub. Fully equipped with modern amenities.',
    progress: 45,
    completion_status: 'Slab Casting Phase',
    possession_date: '2027-12-31',
    image_url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'p2',
    name: 'Royal Residency',
    location: 'Wakad, Pune',
    flat_type: '2 BHK',
    sqft: '1000 - 1100 sqft',
    price: 5800000,
    status: 'Ongoing',
    description: 'Elegant homes crafted for fine living with exceptional connectivity to prime suburbs.',
    progress: 72,
    completion_status: 'Brickwork Phase',
    possession_date: '2026-10-15',
    image_url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'p3',
    name: 'Sky Heights',
    location: 'Baner, Pune',
    flat_type: '3 BHK, 4 BHK',
    sqft: '1400 - 2200 sqft',
    price: 7800000,
    status: 'Upcoming',
    description: 'Premium sky villas with panoramic hill views. Designed by architectural masters.',
    progress: 10,
    completion_status: 'Excavation Starting',
    possession_date: '2028-06-30',
    image_url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'p4',
    name: 'Shree Aura',
    location: "Kothrud, Pune",
    flat_type: '2 & 3 BHK',
    sqft: '1100 - 1600 sqft',
    price: 8200000,
    status: 'Completed',
    description: 'Ready to move-in super-premium residences. Grand clubhouse and garden landscapes.',
    progress: 100,
    completion_status: 'Handed Over',
    possession_date: '2026-03-01',
    image_url: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?auto=format&fit=crop&w=400&q=80'
  }
];

export const INITIAL_LEADS: Lead[] = [
  {
    id: 'l1',
    name: 'Rohit Patil',
    phone: '+91 9876543210',
    email: 'rohit.patil@gmail.com',
    requirement: '3 BHK flat',
    location: 'Baner, Pune',
    budget: 7500000,
    status: 'Interested',
    source: 'Facebook Ads',
    assigned_to: 'Vijay Shinde',
    notes: 'Likes high floor and open view. Looking for mid-2027 possession.',
    timelineLogs: [
      { timestamp: '2026-07-01 10:30', text: 'Lead captured from Facebook ad campaign.', author: 'System' },
      { timestamp: '2026-07-02 14:15', text: 'Called Rohit. He is interested in Sky Heights project. Budget is ₹1.2 Cr max.', author: 'Vijay Shinde' }
    ]
  },
  {
    id: 'l2',
    name: 'Sneha Jadhav',
    phone: '9865123456',
    email: 'sneha@yahoo.com',
    requirement: '2 BHK',
    status: 'Site Visit',
    source: 'Instagram Promo',
    assigned_to: 'Vijay Shinde',
    location: 'Wakad, Pune',
    budget: 6000000,
    notes: 'Site visit booked for next Saturday morning.',
    created_at: '2026-06-22T10:00:00Z',
    is_deleted: false,
    ai_score: 85,
    ai_summary: 'Highly motivated buyer with pre-approved loan of 45 Lakhs. Strongly prefers immediate Wakad properties.',
    timelineLogs: [
      { timestamp: '2026-06-22 10:00', text: 'Lead created via Instagram Form.', author: 'System' },
      { timestamp: '2026-06-23 11:20', text: 'Confirmed site visit for Royal Residency. She has an active home loan approval.', author: 'Vijay Shinde' }
    ]
  },
  {
    id: 'l3',
    name: 'Amit Sharma',
    phone: '9822334455',
    email: 'amit.sharma@outlook.com',
    requirement: '2 BHK flat',
    location: 'Hinjewadi, Pune',
    budget: 5500000,
    status: 'New',
    source: 'Google Search',
    assigned_to: 'Ajay Kadam',
    notes: 'Wants flat near tech park. Early stage buyer.',
    timelineLogs: [
      { timestamp: '2026-07-05 09:00', text: 'Lead registered through website query form.', author: 'System' }
    ]
  },
  {
    id: 'l4',
    name: 'Priya Deshmukh',
    phone: '9755566677',
    email: 'priya@gmail.com',
    requirement: '3 BHK flat',
    location: 'Baner, Pune',
    budget: 9000000,
    status: 'Negotiation',
    source: 'Direct Walk-in',
    assigned_to: 'Vijay Shinde',
    notes: 'Requested customized kitchen layout and discount. Reviewing token amount payment terms.',
    timelineLogs: [
      { timestamp: '2026-06-20 16:30', text: 'First site visit completed. Impressed with sample flat layout.', author: 'Vijay Shinde' },
      { timestamp: '2026-07-04 12:00', text: 'Offered 2% discount on bulk registration. Waiting for family confirmation.', author: 'Vijay Shinde' }
    ]
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'c1',
    name: 'Rahul Mehta',
    phone: '+91 9123456789',
    email: 'rahul.mehta@gmail.com',
    requirement: '3 BHK flat in Sky Heights',
    budget: 8000000,
    location_preference: 'Baner',
    status: 'VIP',
    notes: 'Closed deal with flat no 1204 in Sky Heights. Registration under progress.'
  },
  {
    id: 'c2',
    name: 'Ramesh Patil',
    phone: '+91 9988776655',
    email: 'ramesh.patil@outlook.com',
    requirement: '2 BHK flat in Royal Residency',
    budget: 5800000,
    location_preference: 'Wakad',
    status: 'Active',
    notes: 'Booked Flat No 402 in Royal Residency. First installment of ₹10 Lakhs paid.'
  },
  {
    id: 'c3',
    name: 'Aarti Joshi',
    phone: '+91 9112233445',
    email: 'aarti.j@gmail.com',
    requirement: '2 BHK flat in Green Valley',
    budget: 6500000,
    location_preference: 'Hinjewadi',
    status: 'Active',
    notes: 'Purchased Flat No 103 in Green Valley. Complete payment done. Possession pending.'
  }
];

export const INITIAL_BILLS: Bill[] = [
  {
    id: 'b1',
    project_id: 'p1',
    vendor: 'ABC Cement Ltd',
    amount: 125000,
    material: 'Premium Grade Cement (250 Bags)',
    bill_date: '2026-07-02',
    file_name: 'cement_receipt_7822.pdf',
    ocr_status: 'Success',
    invoice_number: 'INV-1256',
    quantity: 250,
    unit: 'Bags',
    gst: 22500
  },
  {
    id: 'b2',
    project_id: 'p2',
    vendor: 'Shree Steel Traders',
    amount: 425000,
    material: 'Reinforcement Steel Rods (10 Tons)',
    bill_date: '2026-06-28',
    file_name: 'steel_invoice_9910.pdf',
    ocr_status: 'Success',
    invoice_number: 'INV-1255',
    quantity: 10,
    unit: 'Tons',
    gst: 76500
  },
  {
    id: 'b3',
    project_id: 'p1',
    vendor: 'Pune Tiles & Marble',
    amount: 185000,
    material: 'Vitrified Living Room Tiles',
    bill_date: '2026-07-05',
    file_name: 'tiles_bill_045.jpg',
    ocr_status: 'Success',
    invoice_number: 'INV-1254',
    quantity: 1200,
    unit: 'Sqft',
    gst: 33300
  }
];

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'e1',
    project_id: 'p1',
    category: 'Material Procurement',
    amount: 125000,
    date: '2026-07-02',
    payment_method: 'RTGS',
    notes: 'Paid ABC Cement invoice INV-1256'
  },
  {
    id: 'e2',
    project_id: 'p2',
    category: 'Labour Wages',
    amount: 85000,
    date: '2026-07-04',
    payment_method: 'UPI',
    notes: 'Weekly labor payouts for Wakad site foundation.'
  },
  {
    id: 'e3',
    project_id: 'p1',
    category: 'Site Power & Utility',
    amount: 12000,
    date: '2026-07-01',
    payment_method: 'Net Banking',
    notes: 'MSEDCL electricity bill payment.'
  }
];

export const INITIAL_SITE_VISITS: SiteVisit[] = [
  {
    id: 'v1',
    lead_id: 'l2',
    customer_name: 'Sneha Jadhav',
    project_name: 'Royal Residency',
    visit_date: '2026-07-11',
    status: 'Scheduled',
    engineer: 'Yash Deshmukh'
  },
  {
    id: 'v2',
    lead_id: 'l1',
    customer_name: 'Rohit Patil',
    project_name: 'Sky Heights',
    visit_date: '2026-07-12',
    status: 'Scheduled',
    engineer: 'Rahul Salunkhe'
  },
  {
    id: 'v3',
    lead_id: 'l4',
    customer_name: 'Priya Deshmukh',
    project_name: 'Sky Heights',
    visit_date: '2026-07-05',
    status: 'Completed',
    engineer: 'Yash Deshmukh'
  }
];

export const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: 'i1',
    item_name: 'Ultratech Cement Bags',
    category: 'Cement',
    quantity: 1450,
    unit: 'Bags',
    minimum_level: 300,
    unit_price: 450,
    warehouse_location: 'Hinjewadi Central Yard'
  },
  {
    id: 'i2',
    item_name: 'TATA Tiscon Steel Rods 12mm',
    category: 'Steel',
    quantity: 18.5,
    unit: 'Tons',
    minimum_level: 5.0,
    unit_price: 62000,
    warehouse_location: 'Wakad Yard Sector 4'
  },
  {
    id: 'i3',
    item_name: 'River Plaster Sand',
    category: 'Sand',
    quantity: 45,
    unit: 'Brass',
    minimum_level: 15,
    unit_price: 7500,
    warehouse_location: 'Hinjewadi Central Yard'
  },
  {
    id: 'i4',
    item_name: 'Red Clay Bricks (Class A)',
    category: 'Bricks',
    quantity: 12000,
    unit: 'Pieces',
    minimum_level: 5000,
    unit_price: 9,
    warehouse_location: 'Ravet Base Warehouse'
  }
];

export const INITIAL_VENDORS: Vendor[] = [
  {
    id: 'v_abc',
    name: 'ABC Cement Ltd',
    phone: '+91 91523 00411',
    email: 'info@abccement.com',
    material_type: 'Cement Supplies',
    pending_balance: 45000,
    rating: 4.8
  },
  {
    id: 'v_shree',
    name: 'Shree Steel Traders',
    phone: '+91 98902 44331',
    email: 'shreesteel@pune.co.in',
    material_type: 'Reinforcement Steel Rods',
    pending_balance: 185000,
    rating: 4.5
  },
  {
    id: 'v_pune_tiles',
    name: 'Pune Tiles & Marble',
    phone: '+91 88771 99002',
    email: 'sales@punetiles.com',
    material_type: 'Vitrifed Tile & Marbles',
    pending_balance: 0,
    rating: 4.2
  }
];

export const INITIAL_TASKS: TaskItem[] = [
  {
    id: 't1',
    title: 'Wakad 5th Floor Slab Casting Quality Inspection',
    due_date: '2026-07-08',
    priority: 'High',
    status: 'Pending',
    assigned_to: 'Eng. Yash Deshmukh'
  },
  {
    id: 't2',
    title: 'Hinjewadi Brickwork & Plastering Evaluation',
    due_date: '2026-07-10',
    priority: 'Medium',
    status: 'Pending',
    assigned_to: 'Eng. Rahul Salunkhe'
  },
  {
    id: 't3',
    title: 'Procure 500 bags of Portland Cement',
    due_date: '2026-07-06',
    priority: 'High',
    status: 'Completed',
    assigned_to: 'Admin Shinde'
  }
];

export const INITIAL_DOCUMENTS: DocumentItem[] = [
  {
    id: 'd1',
    name: 'Skyline_Heights_Structural_Plan.pdf',
    type: 'PDF',
    category: 'Blueprints',
    size: '14.2 MB',
    uploaded_at: '2026-06-15'
  },
  {
    id: 'd2',
    name: 'Wakad_Municipal_Corporation_NOC.pdf',
    type: 'PDF',
    category: 'Legal Approvals',
    size: '4.8 MB',
    uploaded_at: '2026-06-20'
  },
  {
    id: 'd3',
    name: 'Procurement_Ledger_Q1_2026.xlsx',
    type: 'XLSX',
    category: 'Financial Ledgers',
    size: '1.2 MB',
    uploaded_at: '2026-07-01'
  }
];

export const INITIAL_ACTIVITY_LOGS: ActivityLog[] = [
  {
    id: 'act1',
    timestamp: '2026-07-07 09:15',
    type: 'Access',
    description: 'System login successful for Admin Account',
    user: 'shivinfra55@gmail.com'
  },
  {
    id: 'act2',
    timestamp: '2026-07-06 14:30',
    type: 'Create',
    description: 'New Lead Sneha Jadhav added to pipeline',
    user: 'shivinfra55@gmail.com'
  },
  {
    id: 'act3',
    timestamp: '2026-07-06 17:10',
    type: 'Update',
    description: 'Project progress updated for Green Valley to 45%',
    user: 'Yash Deshmukh'
  }
];

export const INITIAL_USERS: SystemUser[] = [
  {
    id: 'u1',
    name: 'Admin User',
    email: 'shivinfra55@gmail.com',
    role: 'Super Admin',
    status: 'Active'
  },
  {
    id: 'u2',
    name: 'Vijay Shinde',
    email: 'vijay@shivinfra.com',
    role: 'Sales Executive',
    status: 'Active'
  },
  {
    id: 'u3',
    name: 'Yash Deshmukh',
    email: 'yash@shivinfra.com',
    role: 'Engineer',
    status: 'Active'
  }
];

export const INITIAL_SETTINGS: SystemSettings = {
  companyName: 'SHIV INFRA',
  email: 'shivinfra55@gmail.com',
  phone: '+91 20 44556677',
  address: 'Shiv Towers, Sector 4, Baner Hill Road, Baner, Pune, MH - 411045',
  gstNumber: '27AAACS1234F1Z9',
  whatsappApiKey: 'wa_key_prod_882001',
  openaiApiKey: 'sk_proj_99011'
};

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'not_1',
    company_id: 'shiv_infra_co',
    user_id: 'u1',
    customer_id: 'c1',
    title: '🔔 New Site Visit Booked',
    message: 'Customer Rahul Patil booked site visit for Sky Heights on 15 July 2026, 11:00 AM. Location: Baner.',
    type: 'visit',
    status: 'unread',
    created_at: '2026-07-07T09:15:00.000Z'
  },
  {
    id: 'not_2',
    company_id: 'shiv_infra_co',
    user_id: 'u1',
    customer_id: 'c2',
    title: '📞 Call Me Request Received',
    message: 'Customer Ramesh Patil clicked "Call Me" request. Wants urgent callback about Wakad flat specifications.',
    type: 'call',
    status: 'unread',
    created_at: '2026-07-07T08:30:00.000Z'
  },
  {
    id: 'not_3',
    company_id: 'shiv_infra_co',
    user_id: 'u1',
    customer_id: 'c3',
    title: '📂 New Document Uploaded',
    message: 'Sales executive Vijay Shinde uploaded "Wakad_Structural_Plan_Approved.pdf" size 6.2 MB.',
    type: 'document',
    status: 'read',
    created_at: '2026-07-06T15:00:00.000Z'
  }
];

export const INITIAL_INQUIRIES: InquiryItem[] = [
  {
    id: 'inq_1',
    name: 'Rahul Patil',
    phone: '+91 98220 11223',
    project: 'Green Valley',
    location: 'Hadapsar',
    budget: 6500000,
    requirement: '2 BHK Premium flat',
    created_at: '2026-07-07',
    status: 'Interested',
    replied: true,
    interest_level: 'High',
    notes: 'Called him, wants corner flat, ready to book after site visit.'
  },
  {
    id: 'inq_2',
    name: 'Amit Sharma',
    phone: '+91 97654 32100',
    project: 'Sky Heights',
    location: 'Baner',
    budget: 8200000,
    requirement: '3 BHK hill facing villa',
    created_at: '2026-07-06',
    status: 'New',
    replied: false,
    interest_level: 'VIP',
    notes: 'Enquired via website portal. Budget is high. Needs follow-up.'
  },
  {
    id: 'inq_3',
    name: 'Suhas Deshmukh',
    phone: '+91 91234 44556',
    project: 'Royal Residency',
    location: 'Wakad',
    budget: 5800000,
    requirement: '2 BHK with covered parking',
    created_at: '2026-07-05',
    status: 'Follow up',
    replied: true,
    interest_level: 'Medium',
    notes: 'Sent floor layout plans on WhatsApp. Waiting for spouse confirmation.'
  },
  {
    id: 'inq_4',
    name: 'Pooja Joshi',
    phone: '+91 95455 12121',
    project: 'Green Valley',
    location: 'Hinjewadi',
    budget: 5500000,
    requirement: '2 BHK compact flat',
    created_at: '2026-07-04',
    status: 'Not Interested',
    replied: true,
    interest_level: 'Low',
    notes: 'Budget is too low, refused to increase. Closed lead.'
  }
];

// Generic storage handlers
export function getStoredData<T>(key: string, defaults: T): T {
  try {
    const raw = localStorage.getItem(`shiv_infra_${key}`);
    if (!raw) {
      localStorage.setItem(`shiv_infra_${key}`, JSON.stringify(defaults));
      return defaults;
    }
    return JSON.parse(raw) as T;
  } catch (err) {
    return defaults;
  }
}

export function saveStoredData<T>(key: string, data: T): void {
  try {
    localStorage.setItem(`shiv_infra_${key}`, JSON.stringify(data));
  } catch (err) {
    console.error('Error writing to localStorage', err);
  }
}

// Global logger helper
export function logSystemAction(type: 'Access' | 'Create' | 'Update' | 'Delete', description: string, user: string = 'shivinfra55@gmail.com'): void {
  const logs = getStoredData<ActivityLog[]>('activity_logs', INITIAL_ACTIVITY_LOGS);
  const now = new Date();
  const formatTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  const newLog: ActivityLog = {
    id: `act_${Date.now()}`,
    timestamp: formatTime,
    type,
    description,
    user
  };
  
  logs.unshift(newLog);
  saveStoredData('activity_logs', logs.slice(0, 100)); // Limit to last 100 logs
}
