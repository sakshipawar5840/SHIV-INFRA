import React, { useState, useEffect } from 'react';
import { 
  getStoredData, 
  saveStoredData, 
  INITIAL_INQUIRIES, 
  logSystemAction,
  INITIAL_NOTIFICATIONS
} from '../lib/mockData';
import { InquiryItem, NotificationItem } from '../types';
import { 
  FileSpreadsheet, 
  Search, 
  Plus, 
  CheckCircle, 
  AlertCircle, 
  Download, 
  Trash2, 
  Play, 
  MessageSquare, 
  PhoneCall, 
  UserCheck,
  Building2,
  TrendingUp,
  MapPin,
  Sparkles
} from 'lucide-react';

export const InquirySpreadsheet: React.FC = () => {
  const [inquiries, setInquiries] = useState<InquiryItem[]>([]);
  const [search, setSearch] = useState('');
  const [showSandbox, setShowSandbox] = useState(true);
  const [activeCell, setActiveCell] = useState<{ rowId: string; colName: string } | null>(null);

  // Form Fields for new Inquiry manually
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newProject, setNewProject] = useState('Green Valley');
  const [newLocation, setNewLocation] = useState('Hadapsar');
  const [newBudget, setNewBudget] = useState('₹ 65 Lakhs');
  const [newReq, setNewReq] = useState('2 BHK flat');

  // Load inquiries
  useEffect(() => {
    setInquiries(getStoredData<InquiryItem[]>('inquiries', INITIAL_INQUIRIES));
  }, []);

  const handleSaveInquiries = (data: InquiryItem[]) => {
    setInquiries(data);
    saveStoredData('inquiries', data);
  };

  // Export to CSV helper
  const handleExportCSV = () => {
    const headers = ['Row', 'Client Name', 'Phone', 'Project Name', 'Location', 'Budget (INR)', 'Requirement', 'Interest Level', 'Replied Status', 'Action Notes', 'Date'];
    const rows = inquiries.map((inq, index) => [
      index + 1,
      inq.name,
      inq.phone,
      inq.project,
      inq.location,
      inq.budget,
      inq.requirement,
      inq.interest_level,
      inq.replied ? 'Replied' : 'Pending',
      inq.notes || '',
      inq.created_at
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SHIV_INFRA_Inquiries_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    logSystemAction('Access', 'Exported Customer Inquiries XL Sheet to local device');
  };

  // Export to Formatted Excel Helper
  const handleExportExcel = () => {
    const title = "SHIV INFRA CO. - REAL-TIME CUSTOMER INQUIRY LEDGER";
    const dateStr = new Date().toLocaleDateString('en-IN', { dateStyle: 'long' });
    const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    // Build highly styled inline HTML spreadsheet that Microsoft Excel parses perfectly
    let html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Customer Inquiries</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <meta http-equiv="content-type" content="text/plain; charset=UTF-8">
        <style>
          body { font-family: 'Segoe UI', system-ui, sans-serif; }
          table { border-collapse: collapse; width: 100%; border: 2px solid #0f172a; }
          td, th { border: 1px solid #cbd5e1; padding: 10px 12px; font-size: 13px; text-align: left; }
          th { background-color: #0f172a; color: #ffffff; font-weight: bold; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; text-align: center; }
          .title-row { background-color: #1e3a8a; color: #ffffff; font-size: 18px; font-weight: bold; text-align: center; padding: 15px; }
          .meta-label { font-weight: bold; color: #475569; background-color: #f1f5f9; }
          .meta-value { color: #0f172a; background-color: #f8fafc; font-weight: 500; }
          .zebra-even { background-color: #f8fafc; }
          .zebra-odd { background-color: #ffffff; }
          
          /* Interest level styling */
          .interest-high { color: #991b1b; background-color: #fee2e2; font-weight: bold; text-align: center; }
          .interest-medium { color: #854d0e; background-color: #fef9c3; font-weight: bold; text-align: center; }
          .interest-low { color: #1e3a8a; background-color: #dbeafe; font-weight: bold; text-align: center; }
          .interest-vip { color: #6b21a8; background-color: #f3e8ff; font-weight: bold; text-align: center; }
          
          /* Status badge styling */
          .status-new { color: #1e40af; background-color: #eff6ff; font-weight: bold; text-align: center; }
          .status-interested { color: #15803d; background-color: #f0fdf4; font-weight: bold; text-align: center; }
          .status-replied { color: #115e59; background-color: #ccfbf1; font-weight: bold; text-align: center; }
          .status-followup { color: #9a3412; background-color: #ffedd5; font-weight: bold; text-align: center; }
          .status-notinterested { color: #475569; background-color: #f1f5f9; text-align: center; }
          
          .currency { text-align: right; font-weight: bold; color: #1e3a8a; }
        </style>
      </head>
      <body>
        <table>
          <tr>
            <td colspan="11" class="title-row">${title}</td>
          </tr>
          <tr>
            <td colspan="2" class="meta-label">Export Date</td>
            <td colspan="3" class="meta-value">${dateStr} (${timeStr})</td>
            <td colspan="2" class="meta-label">Active Records</td>
            <td colspan="4" class="meta-value">${inquiries.length} Lead Inquiries Captured</td>
          </tr>
          <tr>
            <td colspan="11" style="height: 12px; background-color: #ffffff; border: none;"></td>
          </tr>
          <thead>
            <tr>
              <th style="width: 50px;">SR No.</th>
              <th style="width: 180px;">Customer Name</th>
              <th style="width: 140px;">WhatsApp/Phone</th>
              <th style="width: 160px;">Project Site</th>
              <th style="width: 120px;">Location Sector</th>
              <th style="width: 150px;">Budget Estimate</th>
              <th style="width: 220px;">Customer Requirements</th>
              <th style="width: 110px;">Interest Rating</th>
              <th style="width: 110px;">Workflow Status</th>
              <th style="width: 80px;">Replied?</th>
              <th style="width: 280px;">Action Notes / CRM Ledger</th>
            </tr>
          </thead>
          <tbody>
    `;

    inquiries.forEach((inq, index) => {
      const isEven = index % 2 === 0;
      const zebraClass = isEven ? 'zebra-even' : 'zebra-odd';
      
      let interestClass = 'interest-medium';
      if (inq.interest_level === 'High') interestClass = 'interest-high';
      else if (inq.interest_level === 'Low') interestClass = 'interest-low';
      else if (inq.interest_level === 'VIP') interestClass = 'interest-vip';

      let statusClass = 'status-new';
      if (inq.status === 'Interested') statusClass = 'status-interested';
      else if (inq.status === 'Replied') statusClass = 'status-replied';
      else if (inq.status === 'Follow up') statusClass = 'status-followup';
      else if (inq.status === 'Not Interested') statusClass = 'status-notinterested';

      const formattedBudget = inq.budget >= 10000000 
        ? `₹ ${(inq.budget / 10000000).toFixed(2)} Cr` 
        : `₹ ${(inq.budget / 100000).toFixed(2)} Lakh`;

      html += `
        <tr class="${zebraClass}">
          <td style="text-align: center; font-weight: 500;">${index + 1}</td>
          <td style="font-weight: bold; color: #0f172a;">${inq.name}</td>
          <td>${inq.phone}</td>
          <td>${inq.project}</td>
          <td>${inq.location}</td>
          <td class="currency">${formattedBudget}</td>
          <td>${inq.requirement}</td>
          <td class="${interestClass}">${inq.interest_level}</td>
          <td class="${statusClass}">${inq.status}</td>
          <td style="text-align: center; font-weight: bold; color: ${inq.replied ? '#059669' : '#e11d48'};">
            ${inq.replied ? 'YES' : 'NO'}
          </td>
          <td style="color: #475569; font-size: 11px;">${inq.notes || ''}</td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `SHIV_INFRA_Formatted_Inquiries_${new Date().toISOString().split('T')[0]}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    logSystemAction('Access', 'Exported highly-formatted corporate Excel customer spreadsheet');
  };

  // Simulated Customer portal action trigger
  const triggerCustomerAction = async (
    type: string, 
    customData?: Partial<InquiryItem> & { date?: string; time?: string; filename?: string; size?: string; category?: string; amount?: string; complaintText?: string }
  ) => {
    const randomNames = ['Rahul Patil', 'Aditya Joshi', 'Snehal Shinde', 'Vijay Karande', 'Kiran Deshmukh', 'Meera Rao'];
    const randomPhones = ['+91 98220 12345', '+91 97645 88201', '+91 91580 44556', '+91 88880 12121', '+91 95455 33002'];
    const randomBudgets = [6000000, 7500000, 5500000, 8500000, 12000000];
    const randomLocations = ['Hadapsar', 'Baner', 'Wakad', 'Hinjewadi', 'Kothrud'];
    const randomProjects = ['Green Valley', 'Sky Heights', 'Royal Residency', 'Shree Aura'];

    const clientName = customData?.name || randomNames[Math.floor(Math.random() * randomNames.length)];
    const clientPhone = customData?.phone || randomPhones[Math.floor(Math.random() * randomPhones.length)];
    const selectedProj = customData?.project || randomProjects[Math.floor(Math.random() * randomProjects.length)];
    const selectedLoc = customData?.location || randomLocations[Math.floor(Math.random() * randomLocations.length)];
    const selectedBudget = customData?.budget || randomBudgets[Math.floor(Math.random() * randomBudgets.length)];
    const reqText = customData?.requirement || '2 BHK premium layout flat';

    // 1. Create Spreadsheet Entry if relevant
    const newInquiry: InquiryItem = {
      id: `inq_${Date.now()}`,
      name: clientName,
      phone: clientPhone,
      project: selectedProj,
      location: selectedLoc,
      budget: selectedBudget,
      requirement: reqText,
      created_at: new Date().toISOString().split('T')[0],
      status: 'New',
      replied: false,
      interest_level: 'High',
      notes: `Simulated Customer Action: ${type}`,
    };

    const updatedInqs = [newInquiry, ...inquiries];
    handleSaveInquiries(updatedInqs);

    // 2. Trigger Real-Time Notification on Backend & WhatsApp Simulation
    const titleMap: Record<string, string> = {
      enquiry: '🔔 New Project Enquiry',
      interested: '🔥 Customer Marked Interested',
      visit: '📅 New Site Visit Booked',
      cancel_visit: '❌ Site Visit Cancelled',
      reschedule_visit: '🔄 Site Visit Rescheduled',
      call_request: '📞 Call Me Request',
      whatsapp_chat: '💬 WhatsApp Inbound Message',
      lead_created: '👤 New Lead Registered',
      document: '📂 New Document Uploaded',
      payment: '💳 New Payment Done',
      bill_uploaded: '🧾 Engineer Uploaded Bill',
      complaint: '⚠️ Customer Complaint Registered',
      support: '🛠️ Customer Support Request'
    };

    const messageMap: Record<string, string> = {
      enquiry: `Customer ${clientName} submitted an enquiry for ${selectedProj}. Budget: ₹ ${selectedBudget.toLocaleString('en-IN')}, Location: ${selectedLoc}.`,
      interested: `Customer ${clientName} clicked "Interested" in the project ${selectedProj}.`,
      visit: `Customer ${clientName} booked site visit for ${selectedProj} on 15 July 2026, 11:00 AM.`,
      cancel_visit: `Customer ${clientName} cancelled scheduled site visit for ${selectedProj}.`,
      reschedule_visit: `Customer ${clientName} rescheduled site visit for ${selectedProj} to 18 July 2026, 4:00 PM.`,
      call_request: `Customer ${clientName} clicked "Call Me" request button. Callback immediately.`,
      whatsapp_chat: `Customer ${clientName} sent WhatsApp inquiry: "Please send cost sheets."`,
      lead_created: `New Lead ${clientName} added to pipeline from social campaigns.`,
      document: `Customer ${clientName} uploaded RERA self-declaration and bank sanction PDF.`,
      payment: `Customer ${clientName} uploaded token payment screenshot of ₹ 2,00,000.`,
      bill_uploaded: `Site supervisor uploaded procurement invoice of ₹ 4.5 Lakhs for steel purchase.`,
      complaint: `Customer ${clientName} submitted concern: "Slab casting feedback delayed."`,
      support: `Customer ${clientName} initiated support ticket: "Require RERA layout drawings."`
    };

    // Store notification
    const storedAlerts = getStoredData<NotificationItem[]>('notifications', INITIAL_NOTIFICATIONS);
    const newAlert: NotificationItem = {
      id: `not_${Date.now()}`,
      company_id: 'shiv_infra_co',
      user_id: 'u1',
      customer_id: newInquiry.id,
      title: titleMap[type] || '🔔 New Customer Alert',
      message: messageMap[type] || `Customer performed ${type}`,
      type: type,
      status: 'unread',
      created_at: new Date().toISOString()
    };
    saveStoredData('notifications', [newAlert, ...storedAlerts]);

    // Dispatch event listeners
    window.dispatchEvent(new CustomEvent('new_notification_fired', { detail: newAlert }));

    // Flash simulated WhatsApp message
    const formattedWA = `*🟢 SHIV INFRA WHATSAPP NOTIFICATION*\n\n*${titleMap[type]}*\n*Customer*: ${clientName}\n*Phone*: ${clientPhone}\n*Project*: ${selectedProj}\n*Location*: ${selectedLoc}\n*Notes*: ${messageMap[type]}\n\n_Auto-logged in ERP Spreadsheet database._`;
    
    // Show premium visual feedback toast representing simulated WhatsApp send
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-6 right-6 bg-[#0c1a1a] border border-emerald-500/30 text-emerald-100 rounded-2xl p-5 shadow-2xl max-w-sm z-50 animate-bounce font-sans';
    toast.innerHTML = `
      <div class="flex items-start space-x-3">
        <div class="h-8 w-8 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-400 shrink-0">
          <svg viewBox="0 0 24 24" class="w-4.5 h-4.5" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.003 5.324 5.328 0 11.859 0c3.166.001 6.141 1.233 8.375 3.469 2.235 2.236 3.465 5.213 3.464 8.381-.003 6.535-5.328 11.859-11.859 11.859-.1.000-.199-.001-.299-.002-1.99-.059-3.95-.595-5.658-1.551L0 24zm6.59-4.859c1.6.953 3.19 1.456 5.247 1.458 5.434 0 9.851-4.417 9.854-9.851.002-2.633-1.021-5.109-2.882-6.971C16.948 1.914 14.475.892 11.84 1.89c-5.432 0-9.851 4.418-9.854 9.852a9.789 9.789 0 001.483 5.149L2.45 21.55l4.197-1.409z"/></svg>
        </div>
        <div>
          <div class="flex justify-between items-center">
            <h4 class="text-xs font-black uppercase text-emerald-400 tracking-wider">WhatsApp Sent To Admin</h4>
            <span class="text-[9px] text-slate-500 font-mono">Just Now</span>
          </div>
          <pre class="text-[10px] text-slate-300 font-mono mt-1.5 whitespace-pre-wrap leading-relaxed">${formattedWA}</pre>
        </div>
      </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 7000);

    logSystemAction('Create', `Customer simulated action logged: ${type}`);
  };

  const handleUpdateInquiryField = (rowId: string, field: keyof InquiryItem, value: any) => {
    const updated = inquiries.map(inq => {
      if (inq.id === rowId) {
        return { ...inq, [field]: value };
      }
      return inq;
    });
    handleSaveInquiries(updated);
  };

  const handleDeleteRow = (id: string, name: string) => {
    const updated = inquiries.filter(inq => inq.id !== id);
    handleSaveInquiries(updated);
    logSystemAction('Delete', `Inquiry row for "${name}" deleted from XL Database`);
  };

  const handleAddManualInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPhone) return;

    const newInq: InquiryItem = {
      id: `inq_${Date.now()}`,
      name: newName,
      phone: newPhone,
      project: newProject,
      location: newLocation,
      budget: parseFloat(newBudget.replace(/[^0-9]/g, '')) || 6500000,
      requirement: newReq,
      created_at: new Date().toISOString().split('T')[0],
      status: 'New',
      replied: false,
      interest_level: 'High',
      notes: 'Manually logged row'
    };

    handleSaveInquiries([newInq, ...inquiries]);
    setNewName('');
    setNewPhone('');
    logSystemAction('Create', `Manual customer enquiry added: ${newName}`);
  };

  const filtered = inquiries.filter(inq => 
    inq.name.toLowerCase().includes(search.toLowerCase()) ||
    inq.phone.includes(search) ||
    inq.project.toLowerCase().includes(search.toLowerCase()) ||
    inq.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans">
      
      {/* Upper header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <div className="h-9 w-9 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
              <FileSpreadsheet size={18} />
            </div>
            <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">Customer Inquiry Spreadsheet</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">Real-time ledger matching customer website forms, site visit bookings, call requests, and interactive triggers.</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowSandbox(!showSandbox)}
            className="flex items-center space-x-1 bg-slate-900 text-white font-extrabold text-[10px] px-3.5 py-2 rounded-xl hover:bg-slate-850 transition-colors uppercase tracking-wider cursor-pointer"
          >
            <Play size={12} className="text-amber-400 animate-pulse" />
            <span>{showSandbox ? 'Hide Sandbox' : 'Show Sandbox'}</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1 bg-slate-100 border border-slate-300 text-slate-700 font-extrabold text-[10px] px-3.5 py-2 rounded-xl hover:bg-slate-200 transition-colors uppercase tracking-wider cursor-pointer"
            title="Download unstyled CSV file"
          >
            <Download size={12} />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-[10px] px-4 py-2 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-md shadow-emerald-600/10 hover:shadow-emerald-600/25 uppercase tracking-wider cursor-pointer"
            title="Download highly-formatted corporate Excel ledger"
          >
            <FileSpreadsheet size={12} className="text-emerald-100" />
            <span>Export Formatted Excel</span>
          </button>
        </div>
      </div>

      {/* Real-time Sandbox Simulator */}
      {showSandbox && (
        <div className="bg-slate-950 border border-slate-850 rounded-2xl p-5 text-slate-100 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-850 pb-2">
            <div className="flex items-center space-x-2">
              <Sparkles size={14} className="text-amber-400 animate-pulse" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">Customer Actions Portal Sandbox</h3>
            </div>
            <span className="text-[9px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono">Simulate Interactive Events</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            <button
              onClick={() => triggerCustomerAction('enquiry')}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500 hover:bg-blue-950/20 transition-all text-center space-y-1 cursor-pointer"
            >
              <Building2 size={15} className="text-blue-400" />
              <span className="text-[10px] font-bold text-slate-300">Project Enquiry</span>
            </button>
            <button
              onClick={() => triggerCustomerAction('interested')}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500 hover:bg-amber-950/20 transition-all text-center space-y-1 cursor-pointer"
            >
              <TrendingUp size={15} className="text-amber-400" />
              <span className="text-[10px] font-bold text-slate-300">Interested</span>
            </button>
            <button
              onClick={() => triggerCustomerAction('visit', { project: 'Sky Heights', location: 'Baner' })}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500 hover:bg-emerald-950/20 transition-all text-center space-y-1 cursor-pointer"
            >
              <CheckCircle size={15} className="text-emerald-400" />
              <span className="text-[10px] font-bold text-slate-300">Book Visit</span>
            </button>
            <button
              onClick={() => triggerCustomerAction('cancel_visit')}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-rose-500 hover:bg-rose-950/20 transition-all text-center space-y-1 cursor-pointer"
            >
              <Trash2 size={15} className="text-rose-400" />
              <span className="text-[10px] font-bold text-slate-300">Cancel Visit</span>
            </button>
            <button
              onClick={() => triggerCustomerAction('reschedule_visit')}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-sky-500 hover:bg-sky-950/20 transition-all text-center space-y-1 cursor-pointer"
            >
              <MapPin size={15} className="text-sky-400" />
              <span className="text-[10px] font-bold text-slate-300">Reschedule Visit</span>
            </button>
            <button
              onClick={() => triggerCustomerAction('call_request')}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500 hover:bg-indigo-950/20 transition-all text-center space-y-1 cursor-pointer"
            >
              <PhoneCall size={15} className="text-indigo-400" />
              <span className="text-[10px] font-bold text-slate-300">Call Request</span>
            </button>
            <button
              onClick={() => triggerCustomerAction('whatsapp_chat')}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-400 hover:bg-emerald-950/20 transition-all text-center space-y-1 cursor-pointer"
            >
              <MessageSquare size={15} className="text-emerald-400" />
              <span className="text-[10px] font-bold text-slate-300">WhatsApp Chat</span>
            </button>
            <button
              onClick={() => triggerCustomerAction('lead_created')}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500 hover:bg-purple-950/20 transition-all text-center space-y-1 cursor-pointer"
            >
              <UserCheck size={15} className="text-purple-400" />
              <span className="text-[10px] font-bold text-slate-300">Lead Created</span>
            </button>
            <button
              onClick={() => triggerCustomerAction('document', { filename: 'bank_statement_pune_rera.pdf', size: '5.4 MB', category: 'Financial' })}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-teal-500 hover:bg-teal-950/20 transition-all text-center space-y-1 cursor-pointer"
            >
              <FileSpreadsheet size={15} className="text-teal-400" />
              <span className="text-[10px] font-bold text-slate-300">Doc Uploaded</span>
            </button>
            <button
              onClick={() => triggerCustomerAction('payment', { amount: '₹ 2,50,000' })}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-lime-500 hover:bg-lime-950/20 transition-all text-center space-y-1 cursor-pointer"
            >
              <Plus size={15} className="text-lime-400" />
              <span className="text-[10px] font-bold text-slate-300">Payment Done</span>
            </button>
            <button
              onClick={() => triggerCustomerAction('bill_uploaded', { filename: 'cement_procure_q3.pdf', amount: '₹ 8.5 Lakhs' })}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-pink-500 hover:bg-pink-950/20 transition-all text-center space-y-1 cursor-pointer"
            >
              <FileSpreadsheet size={15} className="text-pink-400" />
              <span className="text-[10px] font-bold text-slate-300">Bill Uploaded</span>
            </button>
            <button
              onClick={() => triggerCustomerAction('complaint', { complaintText: 'Water pipe connection delayed in B Wing.' })}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-red-500 hover:bg-red-950/20 transition-all text-center space-y-1 cursor-pointer"
            >
              <AlertCircle size={15} className="text-red-400" />
              <span className="text-[10px] font-bold text-slate-300">Complaint</span>
            </button>
            <button
              onClick={() => triggerCustomerAction('support')}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-violet-500 hover:bg-violet-950/20 transition-all text-center space-y-1 cursor-pointer"
            >
              <Sparkles size={15} className="text-violet-400" />
              <span className="text-[10px] font-bold text-slate-300">Support Req</span>
            </button>
          </div>
        </div>
      )}

      {/* Manual Quick Add Form */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">Quick Append Spreadsheet Row</h3>
        <form onSubmit={handleAddManualInquiry} className="grid grid-cols-1 sm:grid-cols-6 gap-3.5">
          <input
            type="text"
            required
            placeholder="Name (e.g. Ramesh Patil)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="sm:col-span-1 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none"
          />
          <input
            type="text"
            required
            placeholder="Phone (e.g. +91 91122 33445)"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            className="sm:col-span-1 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none"
          />
          <input
            type="text"
            placeholder="Project (e.g. Royal Residency)"
            value={newProject}
            onChange={(e) => setNewProject(e.target.value)}
            className="sm:col-span-1 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none"
          />
          <input
            type="text"
            placeholder="Location (e.g. Wakad)"
            value={newLocation}
            onChange={(e) => setNewLocation(e.target.value)}
            className="sm:col-span-1 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none"
          />
          <input
            type="text"
            placeholder="Requirement"
            value={newReq}
            onChange={(e) => setNewReq(e.target.value)}
            className="sm:col-span-1 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none"
          />
          <button
            type="submit"
            className="sm:col-span-1 bg-gradient-to-r from-emerald-600 to-green-600 text-white font-extrabold text-[11px] uppercase tracking-wider rounded-xl shadow-md shadow-emerald-500/10 cursor-pointer hover:scale-[1.01] active:scale-95 transition-all"
          >
            Append Row
          </button>
        </form>
      </div>

      {/* Grid Filter Search & Spreadsheet Grid View */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        
        {/* Spreadsheet search bar */}
        <div className="p-4 border-b border-slate-150 flex items-center justify-between bg-slate-50">
          <div className="relative w-72">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
              <Search size={13} />
            </span>
            <input
              type="text"
              placeholder="Search ledger rows..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 text-slate-800 placeholder-slate-400 rounded-xl pl-9 pr-4 py-1.5 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/25"
            />
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            Showing <strong className="text-slate-800">{filtered.length}</strong> of {inquiries.length} spreadsheet records
          </span>
        </div>

        {/* Excel GRID Container */}
        <div className="overflow-x-auto max-w-full">
          <table className="w-full border-collapse text-left text-xs font-sans">
            
            {/* Excel Headers A, B, C, D... */}
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 select-none">
                <th className="w-12 text-center border-r border-slate-200 font-mono text-[10px] text-slate-400 py-1 bg-slate-200/50"></th>
                <th className="px-4 py-2 border-r border-slate-200 font-mono text-[10px] text-slate-500 uppercase">Col A (Client Name)</th>
                <th className="px-4 py-2 border-r border-slate-200 font-mono text-[10px] text-slate-500 uppercase">Col B (Phone)</th>
                <th className="px-4 py-2 border-r border-slate-200 font-mono text-[10px] text-slate-500 uppercase">Col C (Project)</th>
                <th className="px-4 py-2 border-r border-slate-200 font-mono text-[10px] text-slate-500 uppercase">Col D (Location)</th>
                <th className="px-4 py-2 border-r border-slate-200 font-mono text-[10px] text-slate-500 uppercase">Col E (Budget)</th>
                <th className="px-4 py-2 border-r border-slate-200 font-mono text-[10px] text-slate-500 uppercase">Col F (Requirement)</th>
                <th className="px-4 py-2 border-r border-slate-200 font-mono text-[10px] text-slate-500 uppercase w-32">Col G (Replied Status)</th>
                <th className="px-4 py-2 border-r border-slate-200 font-mono text-[10px] text-slate-500 uppercase w-36">Col H (Interest Level)</th>
                <th className="px-4 py-2 border-r border-slate-200 font-mono text-[10px] text-slate-500 uppercase">Col I (Action Notes)</th>
                <th className="px-8 py-2 text-center w-20 font-mono text-[10px] text-slate-500 uppercase">Edit</th>
              </tr>
            </thead>

            {/* Excel Grid Body */}
            <tbody className="divide-y divide-slate-150">
              {filtered.map((item, idx) => {
                const rowNum = idx + 1;
                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    
                    {/* Row Index Number */}
                    <td className="w-12 text-center font-mono text-[10px] text-slate-400 border-r border-slate-200 bg-slate-50 py-3.5 select-none font-bold">
                      {rowNum}
                    </td>

                    {/* Client Name cell */}
                    <td 
                      className={`px-4 py-2.5 border-r border-slate-150 font-medium text-slate-800 ${
                        activeCell?.rowId === item.id && activeCell?.colName === 'name' ? 'bg-blue-50/40 ring-1 ring-blue-400/50' : ''
                      }`}
                      onClick={() => setActiveCell({ rowId: item.id, colName: 'name' })}
                    >
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleUpdateInquiryField(item.id, 'name', e.target.value)}
                        className="w-full bg-transparent focus:outline-none focus:bg-white border-none rounded text-xs py-0.5 px-1 font-semibold"
                      />
                    </td>

                    {/* Phone cell */}
                    <td 
                      className={`px-4 py-2.5 border-r border-slate-150 font-mono text-slate-600 ${
                        activeCell?.rowId === item.id && activeCell?.colName === 'phone' ? 'bg-blue-50/40 ring-1 ring-blue-400/50' : ''
                      }`}
                      onClick={() => setActiveCell({ rowId: item.id, colName: 'phone' })}
                    >
                      <input
                        type="text"
                        value={item.phone}
                        onChange={(e) => handleUpdateInquiryField(item.id, 'phone', e.target.value)}
                        className="w-full bg-transparent focus:outline-none focus:bg-white border-none rounded text-xs py-0.5 px-1"
                      />
                    </td>

                    {/* Project cell */}
                    <td 
                      className="px-4 py-2.5 border-r border-slate-150 text-slate-700 font-semibold"
                    >
                      <input
                        type="text"
                        value={item.project}
                        onChange={(e) => handleUpdateInquiryField(item.id, 'project', e.target.value)}
                        className="w-full bg-transparent focus:outline-none focus:bg-white border-none rounded text-xs py-0.5 px-1 text-slate-800"
                      />
                    </td>

                    {/* Location cell */}
                    <td 
                      className="px-4 py-2.5 border-r border-slate-150 text-slate-700"
                    >
                      <input
                        type="text"
                        value={item.location}
                        onChange={(e) => handleUpdateInquiryField(item.id, 'location', e.target.value)}
                        className="w-full bg-transparent focus:outline-none focus:bg-white border-none rounded text-xs py-0.5 px-1"
                      />
                    </td>

                    {/* Budget cell */}
                    <td 
                      className="px-4 py-2.5 border-r border-slate-150 font-mono font-bold text-slate-700"
                    >
                      <span className="text-slate-500">₹</span> {typeof item.budget === 'number' ? (item.budget / 100000).toFixed(1) + ' Lakhs' : item.budget}
                    </td>

                    {/* Requirement cell */}
                    <td 
                      className="px-4 py-2.5 border-r border-slate-150 text-slate-600"
                    >
                      <input
                        type="text"
                        value={item.requirement}
                        onChange={(e) => handleUpdateInquiryField(item.id, 'requirement', e.target.value)}
                        className="w-full bg-transparent focus:outline-none focus:bg-white border-none rounded text-xs py-0.5 px-1 text-slate-600"
                      />
                    </td>

                    {/* Replied Status Cell */}
                    <td className="px-4 py-2.5 border-r border-slate-150">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={item.replied}
                          onChange={(e) => handleUpdateInquiryField(item.id, 'replied', e.target.checked)}
                          className="h-3.5 w-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/20 cursor-pointer"
                        />
                        <span className={`text-[10px] font-black uppercase tracking-wider ${
                          item.replied 
                            ? 'text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full' 
                            : 'text-rose-500 bg-rose-50 border border-rose-100 px-2.5 py-0.5 rounded-full animate-pulse'
                        }`}>
                          {item.replied ? 'REPLIED' : 'PENDING'}
                        </span>
                      </div>
                    </td>

                    {/* Interest level selection */}
                    <td className="px-4 py-2.5 border-r border-slate-150">
                      <select
                        value={item.interest_level || 'High'}
                        onChange={(e) => handleUpdateInquiryField(item.id, 'interest_level', e.target.value)}
                        className={`w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider focus:outline-none ${
                          item.interest_level === 'High' || item.interest_level === 'VIP' ? 'text-amber-600 font-black bg-amber-50' : 'text-slate-500'
                        }`}
                      >
                        <option value="VIP">⭐ VIP Client</option>
                        <option value="High">🔥 High Interest</option>
                        <option value="Medium">⚡ Medium</option>
                        <option value="Low">💤 Cold</option>
                        <option value="Not Interested">❌ Closed</option>
                      </select>
                    </td>

                    {/* Action notes column */}
                    <td 
                      className="px-4 py-2.5 border-r border-slate-150"
                    >
                      <input
                        type="text"
                        value={item.notes || ''}
                        placeholder="Type updates, followups..."
                        onChange={(e) => handleUpdateInquiryField(item.id, 'notes', e.target.value)}
                        className="w-full bg-transparent focus:outline-none focus:bg-white border-none rounded text-xs py-0.5 px-1 italic text-slate-500"
                      />
                    </td>

                    {/* Delete action row */}
                    <td className="px-4 py-2.5 text-center">
                      <button
                        onClick={() => handleDeleteRow(item.id, item.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded hover:bg-slate-100 transition-all cursor-pointer"
                        title="Delete Inquiry Record"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>

                  </tr>
                );
              })}
            </tbody>

          </table>
        </div>

      </div>

    </div>
  );
};

export default InquirySpreadsheet;
