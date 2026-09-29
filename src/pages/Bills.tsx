import React, { useState, useEffect } from 'react';
import { apiClient } from '../lib/axiosClient';
import { Bill, Project } from '../types';
import { Dialog } from '../components/Dialog';
import { jsPDF } from 'jspdf';
import { 
  Plus, 
  Search, 
  Receipt, 
  FileText, 
  Upload, 
  Download, 
  Trash2, 
  FileSpreadsheet, 
  Grid, 
  List, 
  Check, 
  Sparkles, 
  AlertCircle 
} from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

export const Bills: React.FC = () => {
  const toast = useToast();
  const [bills, setBills] = useState<Bill[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'spreadsheet'>('cards');

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [formFile, setFormFile] = useState<File | null>(null);

  const [formProjectId, setFormProjectId] = useState('');
  const [formVendor, setFormVendor] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formMaterial, setFormMaterial] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formInvoiceNumber, setFormInvoiceNumber] = useState('');
  const [formQuantity, setFormQuantity] = useState('');
  const [formUnit, setFormUnit] = useState('');
  const [formGst, setFormGst] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formRemarks, setFormRemarks] = useState('');

  useEffect(() => {
    const loadBills = async () => {
      try {
        const [billsRes, projectsRes] = await Promise.all([
          apiClient.get('/v1/bills'),
          apiClient.get('/v1/projects'),
        ]);
        setBills(billsRes.data?.data ?? []);
        setProjects(projectsRes.data?.data ?? []);
      } catch (err) {
        console.error('Failed to load bills from API', err);
        toast.showToast('Failed to load bills', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadBills();
  }, []);

  const downloadBillPDF = (bill: Bill) => {
    const doc = new jsPDF();
    const matchedProj = projects.find(p => p.id === bill.project_id)?.project_name || 'General Site';
    
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 38, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('SHIV INFRASTRUCTURES', 15, 18);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225);
    doc.text('Corporate Office: Shiv Towers, Baner Hill Road, Baner, Pune - 411045', 15, 26);
    doc.text('Contact: +91 20 44556677  |  Email: shivinfra55@gmail.com', 15, 32);
    
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('MATERIAL PURCHASE RECEIPT', 15, 52);
    
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(15, 56, 195, 56);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Invoice Details:', 15, 66);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice No:  ${bill.bill_number || bill.invoice_number || 'REC-' + bill.id.slice(2, 8).toUpperCase()}`, 15, 73);
    doc.text(`Date of Issue: ${bill.bill_date || 'N/A'}`, 15, 79);
    doc.text(`Project Site:  ${matchedProj}`, 15, 85);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Supplier/Vendor:', 115, 66);
    doc.setFont('helvetica', 'normal');
    doc.text(`Vendor:    ${bill.vendor_name || bill.vendor || 'N/A'}`, 115, 73);
    doc.text('GSTIN:     27AAACS1234F1Z9', 115, 79);
    doc.text('RERA Reg:  Approved Site', 115, 85);
    
    doc.setFillColor(248, 250, 252);
    doc.rect(15, 96, 180, 8, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.text('Material / Item Description', 18, 101);
    doc.text('Qty', 110, 101);
    doc.text('Unit', 130, 101);
    doc.text('Total Price', 165, 101);
    
    doc.setFont('helvetica', 'normal');
    doc.text(bill.material_name || bill.material || 'N/A', 18, 114);
    doc.text(String(bill.quantity || 1), 110, 114);
    doc.text(bill.unit || 'Units', 130, 114);
    doc.text(`Rs. ${bill.amount.toLocaleString('en-IN')}`, 165, 114);
    doc.line(15, 120, 195, 120);
    
    const gstRate = bill.gst_amount || bill.gst || 18;
    const baseValue = Math.round(bill.amount / (1 + gstRate/100));
    const taxValue = bill.amount - baseValue;
    
    doc.text('Subtotal (Base Value):', 120, 132);
    doc.text(`Rs. ${baseValue.toLocaleString('en-IN')}`, 165, 132);
    
    doc.text(`GST Inclusive (${gstRate}%):`, 120, 138);
    doc.text(`Rs. ${taxValue.toLocaleString('en-IN')}`, 165, 138);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Total Invoice Amount:', 120, 146);
    doc.text(`Rs. ${bill.amount.toLocaleString('en-IN')}`, 165, 146);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('1. Received materials in sound physical condition subject to site engineer approval.', 15, 175);
    doc.text('2. Payments are subject to audit clearance within 30 banking days.', 15, 180);
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.text('Authorized Signatory', 145, 195);
    doc.line(140, 190, 185, 190);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('SHIV INFRASTRUCTURES CO.', 144, 200);

    doc.save(`SHIV_INFRA_BILL_${bill.bill_number || bill.invoice_number || bill.id}.pdf`);
  };

  const openAddModal = () => {
    setFormProjectId('');
    setFormVendor('');
    setFormMaterial('');
    setFormAmount('');
    setFormDate('');
    setFormInvoiceNumber('');
    setFormQuantity('');
    setFormUnit('');
    setFormGst('');
    setFormRemarks('');
    setFormErrors({});
    setFormFile(null);
    setEditingBill(null);
    setIsAddOpen(true);
  };

  const openEditModal = (bill: Bill) => {
    setEditingBill(bill);
    setFormProjectId(bill.project_id || '');
    setFormVendor(bill.vendor_name || bill.vendor || '');
    setFormMaterial(bill.material_name || bill.material || '');
    setFormAmount(String(bill.amount || ''));
    setFormDate(bill.bill_date || '');
    setFormInvoiceNumber(bill.bill_number || bill.invoice_number || '');
    setFormQuantity(String(bill.quantity || ''));
    setFormUnit(bill.unit || '');
    setFormGst(String(bill.gst_amount || bill.gst || ''));
    setFormRemarks(bill.remarks || '');
    setFormErrors({});
    setFormFile(null);
    setIsEditOpen(true);
  };

  const uploadBillAPI = async (payload: any, file: File | null): Promise<any> => {
    if (file) {
      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          formData.append(key, String(value));
        }
      });
      formData.append('bill', file);
      const token = localStorage.getItem('token');
      const baseURL = apiClient.defaults.baseURL || '';
      const response = await fetch(`${baseURL}/v1/bills`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Upload failed');
      }
      return response.json();
    }
    return apiClient.post('/v1/bills', payload);
  };

  const handleAddBillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    
    if (!formVendor.trim()) errors.vendor = 'Vendor name is required';
    if (!formMaterial.trim()) errors.material = 'Material is required';
    if (!formAmount || Number(formAmount) <= 0) errors.amount = 'Enter a valid amount';
    if (!formDate) errors.date = 'Date is required';
    if (!formInvoiceNumber.trim()) errors.invoiceNumber = 'Invoice number is required';
    if (!formQuantity || Number(formQuantity) < 0) errors.quantity = 'Quantity must be positive';
    if (!formUnit) errors.unit = 'Unit is required';
    if (formGst === '' || Number(formGst) < 0 || Number(formGst) > 100) errors.gst = 'GST must be between 0 and 100';
    if (!formProjectId) errors.project = 'Project is required';
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.showToast('Please fill all required fields.', 'warning');
      return;
    }
    
    setFormErrors({});

    try {
      const payload: any = {
        project_id: formProjectId,
        vendor_name: formVendor,
        material_name: formMaterial,
        quantity: Number(formQuantity),
        unit: formUnit,
        amount: Number(formAmount),
        gst_amount: formGst === '' ? 0 : Number(formGst),
        bill_number: formInvoiceNumber,
        bill_date: formDate,
        payment_status: 'Pending',
        remarks: formRemarks
      };

      const res = await uploadBillAPI(payload, formFile);
      const newBill = res.data?.data ?? res.data;
      setBills(prev => [newBill, ...prev]);
      
      setIsAddOpen(false);
      setFormProjectId('');
      setFormVendor('');
      setFormMaterial('');
      setFormAmount('');
      setFormDate('');
      setFormInvoiceNumber('');
      setFormQuantity('');
      setFormUnit('');
      setFormGst('');
      setFormRemarks('');
      setFormErrors({});
      setFormFile(null);
      toast.showToast('Bill added successfully', 'success');
    } catch (err: any) {
      console.error('Failed to create bill', err);
      toast.showToast(err.response?.data?.message || err.message || 'Failed to create bill', 'error');
    }
  };

  const handleEditBillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBill) return;
    
    const errors: Record<string, string> = {};
    
    if (!formVendor.trim()) errors.vendor = 'Vendor name is required';
    if (!formMaterial.trim()) errors.material = 'Material is required';
    if (!formAmount || Number(formAmount) <= 0) errors.amount = 'Enter a valid amount';
    if (!formDate) errors.date = 'Date is required';
    if (!formInvoiceNumber.trim()) errors.invoiceNumber = 'Invoice number is required';
    if (!formQuantity || Number(formQuantity) < 0) errors.quantity = 'Quantity must be positive';
    if (!formUnit) errors.unit = 'Unit is required';
    if (formGst === '' || Number(formGst) < 0 || Number(formGst) > 100) errors.gst = 'GST must be between 0 and 100';
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.showToast('Please fill all required fields.', 'warning');
      return;
    }
    
    setFormErrors({});

    try {
      const payload: any = {
        vendor_name: formVendor,
        material_name: formMaterial,
        quantity: Number(formQuantity),
        unit: formUnit,
        amount: Number(formAmount),
        gst_amount: formGst === '' ? 0 : Number(formGst),
        bill_number: formInvoiceNumber,
        bill_date: formDate,
        payment_status: editingBill?.payment_status || 'Pending',
        remarks: formRemarks
      };

      if (formProjectId) {
        payload.project_id = formProjectId;
      }

      const res = await apiClient.put(`/v1/bills/${editingBill.id}`, payload);
      const updatedBill = res.data?.data ?? res.data;
      setBills(prev => prev.map(b => b.id === editingBill.id ? updatedBill : b));
      
      setIsEditOpen(false);
      setEditingBill(null);
      toast.showToast('Bill updated successfully', 'success');
    } catch (err: any) {
      console.error('Failed to update bill', err);
      toast.showToast(err.response?.data?.message || 'Failed to update bill', 'error');
    }
  };

  const startDelete = (bill: Bill) => {
    setSelectedBill(bill);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedBill) return;

    try {
      await apiClient.delete(`/v1/bills/${selectedBill.id}`);
      setBills(prev => prev.filter(b => b.id !== selectedBill.id));
      setIsDeleteOpen(false);
      setSelectedBill(null);
      toast.showToast('Bill deleted successfully', 'success');
    } catch (err: any) {
      console.error('Failed to delete bill', err);
      toast.showToast(err.response?.data?.message || 'Failed to delete bill', 'error');
    }
  };

  const filteredBills = bills.filter(b => {
    const matchedProj = projects.find(p => p.id === b.project_id)?.project_name || '';
    return (b.vendor_name || b.vendor || '').toLowerCase().includes(search.toLowerCase()) ||
           (b.material_name || b.material || '').toLowerCase().includes(search.toLowerCase()) ||
           (b.bill_number || b.invoice_number || '').toLowerCase().includes(search.toLowerCase()) ||
           matchedProj.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6 text-text-primary">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-text-primary font-sans">
            Procurement Bills & Expenses
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Procurement ledger with bill tracking and management.
          </p>
        </div>
        
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => {
              const headers = ['Invoice Number', 'Date', 'Site/Project', 'Vendor', 'Material Details', 'Quantity', 'Unit', 'GST Amount', 'Total Amount (INR)'];
              const rows = filteredBills.map(b => [
                b.bill_number || b.invoice_number || 'N/A',
                b.bill_date || 'N/A',
                projects.find(p => p.id === b.project_id)?.project_name || 'General Site',
                b.vendor_name || b.vendor || 'N/A',
                b.material_name || b.material || 'N/A',
                b.quantity || 1,
                b.unit || 'Units',
                b.gst_amount || b.gst || 0,
                b.amount
              ]);
              const csvContent = [headers, ...rows].map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
              const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.setAttribute('download', 'SHIV_INFRA_MASTER_PROCUREMENT_LEDGER.csv');
              link.click();
            }}
            className="flex items-center space-x-1.5 bg-surface border border-border hover:bg-bg-app text-success font-semibold text-xs px-3.5 py-2.5 rounded-xl transition-all cursor-pointer"
          >
            <FileSpreadsheet size={13} />
            <span>Download Master Excel</span>
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center space-x-1.5 bg-primary text-white font-medium text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-primary/10 cursor-pointer"
          >
            <Plus size={14} />
            <span>Upload Bill</span>
          </button>
        </div>
      </div>

      {/* Navigation views filters */}
      <div className="bg-surface border border-border p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 relative max-w-sm">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-text-secondary">
            <Search size={14} />
          </div>
          <input
            type="text"
            placeholder="Search vendor, invoice, material or project..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface/80 border border-border text-text-primary placeholder-text-secondary rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-primary/80"
          />
        </div>

        <div className="flex items-center bg-surface border border-border p-1 rounded-xl shrink-0">
          <button
            onClick={() => setViewMode('cards')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'cards' ? 'bg-black text-white' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Grid size={13} />
            <span>Audit Cards</span>
          </button>
          <button
            onClick={() => setViewMode('spreadsheet')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'spreadsheet' ? 'bg-black text-white' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <FileSpreadsheet size={13} />
            <span>Live MS Excel Grid</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-surface border border-border rounded-2xl p-12 text-center">
          <p className="text-sm font-semibold text-text-secondary">Loading bills...</p>
        </div>
      ) : (
      <>
      {/* Main content viewport */}
      {viewMode === 'cards' ? (
        /* Cards View */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredBills.map((b) => {
            const siteName = projects.find(p => p.id === b.project_id)?.project_name || 'General Site';
            return (
              <div
                key={b.id}
                className="bg-surface border border-border/80 rounded-2xl p-5 hover:border-primary transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start pb-3 border-b border-border/60">
                    <div>
                      <h4 className="text-xs font-bold text-text-primary">{b.vendor_name || b.vendor}</h4>
                      <p className="text-[10px] text-text-secondary flex items-center mt-0.5">Invoice: {b.bill_number || b.invoice_number || 'N/A'}</p>
                    </div>
                    <span className="text-[10px] font-mono text-success font-bold bg-success/5 border border-success/20 px-2.5 py-0.5 rounded-full">
                      {b.payment_status || 'Pending'}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <p className="text-text-secondary"><span className="text-text-secondary font-medium">Material:</span> {b.material_name || b.material}</p>
                    <p className="text-text-secondary"><span className="text-text-secondary font-medium">Site Link:</span> {siteName}</p>
                    <p className="text-text-secondary"><span className="text-text-secondary font-medium">Quantity:</span> {b.quantity || 1} {b.unit || 'Units'}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-border/40 mt-4 pt-3.5">
                  <span className="text-sm font-mono font-bold text-primary">
                    ₹ {b.amount.toLocaleString('en-IN')}
                  </span>
                  
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => downloadBillPDF(b)}
                      className="p-1.5 text-danger hover:bg-danger/5 rounded-lg transition-colors border border-rose-500/10 cursor-pointer"
                      title="Download PDF Invoice"
                    >
                      <Download size={13} />
                    </button>
                    <button
                      onClick={() => openEditModal(b)}
                      className="p-1.5 text-text-secondary hover:text-primary hover:bg-bg-app rounded-lg transition-all cursor-pointer"
                      title="Edit bill"
                    >
                      <FileText size={13} />
                    </button>
                    <button
                      onClick={() => startDelete(b)}
                      className="p-1.5 text-text-secondary hover:text-danger hover:bg-bg-app rounded-lg transition-all cursor-pointer"
                      title="Delete bill"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredBills.length === 0 && (
            <div className="col-span-full bg-surface border border-border rounded-2xl p-12 text-center">
              <Receipt size={36} className="text-text-secondary mx-auto mb-3" />
              <p className="text-sm font-semibold text-text-secondary">No procurement invoices logged</p>
            </div>
          )}
        </div>
      ) : (
        /* Dynamic Live Excel Spreadsheet Grid */
        <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-2xl">
          <div className="bg-surface/60 border-b border-border px-4 py-2 flex items-center space-x-2 text-[10px] font-mono text-success">
            <span className="h-2 w-2 bg-success rounded-full animate-ping"></span>
            <span>Live procurement ledger synchronized with database.</span>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-surface/80 text-text-secondary font-mono select-none uppercase tracking-wider text-[9px] border-b border-border">
                <tr>
                  <th className="py-3 px-4 border-r border-border">Invoice ID</th>
                  <th className="py-3 px-4 border-r border-border">Issue Date</th>
                  <th className="py-3 px-4 border-r border-border">Construction Site</th>
                  <th className="py-3 px-4 border-r border-border">Supplier/Vendor</th>
                  <th className="py-3 px-4 border-r border-border">Material Items</th>
                  <th className="py-3 px-4 border-r border-border">Qty</th>
                  <th className="py-3 px-4 border-r border-border text-right">Invoice Sum</th>
                  <th className="py-3 px-4 text-center">Download PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-mono text-text-secondary">
                {filteredBills.map((b) => {
                  const siteName = projects.find(p => p.id === b.project_id)?.project_name || 'General Site';
                  return (
                    <tr key={b.id} className="hover:bg-bg-app/40 transition-colors">
                      <td className="py-2.5 px-4 border-r border-border font-bold text-text-secondary">{b.bill_number || b.invoice_number || 'N/A'}</td>
                      <td className="py-2.5 px-4 border-r border-border">{b.bill_date || 'N/A'}</td>
                      <td className="py-2.5 px-4 border-r border-border text-text-secondary">{siteName}</td>
                      <td className="py-2.5 px-4 border-r border-border font-sans text-text-primary font-semibold">{b.vendor_name || b.vendor}</td>
                      <td className="py-2.5 px-4 border-r border-border font-sans">{b.material_name || b.material}</td>
                      <td className="py-2.5 px-4 border-r border-border text-text-secondary">{b.quantity || 1} {b.unit || 'Units'}</td>
                      <td className="py-2.5 px-4 border-r border-border text-right font-bold text-primary">₹ {b.amount.toLocaleString('en-IN')}</td>
                      <td className="py-2.5 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => downloadBillPDF(b)}
                            className="px-2.5 py-1 bg-danger/5 hover:bg-danger/10 text-danger border border-danger/20 rounded-lg text-[9px] font-bold transition-all cursor-pointer inline-flex items-center space-x-1"
                          >
                            <Download size={10} />
                            <span>PDF</span>
                          </button>
                          <button
                            onClick={() => openEditModal(b)}
                            className="px-2.5 py-1 bg-surface hover:bg-bg-app text-text-secondary border border-border rounded-lg text-[9px] font-bold transition-all cursor-pointer inline-flex items-center space-x-1"
                            title="Edit bill"
                          >
                            <FileText size={10} />
                            <span>Edit</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </>
      )}

      {/* DIALOG UPLOAD OCR billing modal */}
      <Dialog isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Upload Materials Receipt" size="lg">
        <form onSubmit={handleAddBillSubmit} className="space-y-4 font-sans">
            <div className="bg-surface border border-border p-6 rounded-xl text-center relative hover:border-primary transition-colors">
              <Upload size={28} className="text-text-secondary mx-auto mb-2.5" />
              <p className="text-xs font-semibold text-text-secondary">Attach receipt document (optional)</p>
              <p className="text-[10px] text-text-secondary mt-1 font-mono">Supports JPG, PNG, PDF receipts up to 10MB.</p>
              
              <div className="mt-4 flex justify-center">
                <label className="flex items-center space-x-1 bg-surface border border-border text-text-secondary px-3.5 py-1.5 rounded-lg text-[10px] font-semibold hover:bg-bg-app transition-colors cursor-pointer select-none">
                  <Sparkles size={11} className="text-warning animate-pulse" />
                  <span>{formFile ? formFile.name : 'Browse Device Files...'}</span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setFormFile(file);
                      }
                    }}
                    className="hidden"
                  />
                </label>
                {formFile && (
                  <button
                    type="button"
                    onClick={() => setFormFile(null)}
                    className="ml-2 text-[10px] text-danger hover:text-danger/80 underline"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            <div className="border-t border-border/80 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Supplier/Vendor *</label>
                <input
                  type="text"
                  value={formVendor}
                  onChange={(e) => setFormVendor(e.target.value)}
                  placeholder="e.g. ACC Cement Distributors"
                  className={`w-full bg-surface border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary ${formErrors.vendor ? 'border-rose-500 text-danger' : 'border-border text-text-primary'}`}
                />
                {formErrors.vendor && <p className="text-[10px] text-danger mt-1">{formErrors.vendor}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Material Details *</label>
                <input
                  type="text"
                  value={formMaterial}
                  onChange={(e) => setFormMaterial(e.target.value)}
                  placeholder="e.g. Cement Grade 53 (200 Bags)"
                  className={`w-full bg-surface border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary ${formErrors.material ? 'border-rose-500 text-danger' : 'border-border text-text-primary'}`}
                />
                {formErrors.material && <p className="text-[10px] text-danger mt-1">{formErrors.material}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Invoice Number *</label>
                <input
                  type="text"
                  value={formInvoiceNumber}
                  onChange={(e) => setFormInvoiceNumber(e.target.value)}
                  placeholder="e.g. INV-1204"
                  className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary font-mono font-bold text-text-secondary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Billing Date *</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className={`w-full bg-surface border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary font-mono ${formErrors.date ? 'border-rose-500 text-danger' : 'border-border text-text-primary'}`}
                />
                {formErrors.date && <p className="text-[10px] text-danger mt-1">{formErrors.date}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Quantity *</label>
                <input
                  type="number"
                  value={formQuantity}
                  onChange={(e) => setFormQuantity(e.target.value)}
                  className={`w-full bg-surface border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary font-mono ${formErrors.quantity ? 'border-rose-500 text-danger' : 'border-border text-text-primary'}`}
                />
                {formErrors.quantity && <p className="text-[10px] text-danger mt-1">{formErrors.quantity}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Unit *</label>
                <input
                  type="text"
                  value={formUnit}
                  onChange={(e) => setFormUnit(e.target.value)}
                  placeholder="Bags, Tons..."
                  className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary"
                />
                {formErrors.unit && <p className="text-[10px] text-danger mt-1">{formErrors.unit}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Total Bill Amount (INR) *</label>
                <input
                  type="number"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  placeholder="e.g. 125000"
                  className={`w-full bg-surface border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary font-mono font-bold text-primary ${formErrors.amount ? 'border-rose-500 text-danger' : 'border-border text-text-primary'}`}
                />
                {formErrors.amount && <p className="text-[10px] text-danger mt-1">{formErrors.amount}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Select Associated Project *</label>
                <select
                  value={formProjectId}
                  onChange={(e) => setFormProjectId(e.target.value)}
                  className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary"
                >
                  <option value="">Select Project</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.project_name || p.project_name}</option>
                  ))}
                </select>
                {formErrors.project && <p className="text-[10px] text-danger mt-1">{formErrors.project}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">GST Amount (INR)</label>
                <input
                  type="number"
                  value={formGst}
                  onChange={(e) => setFormGst(e.target.value)}
                  placeholder="e.g. 4500"
                  className={`w-full bg-surface border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary font-mono ${formErrors.gst ? 'border-rose-500 text-danger' : 'border-border text-text-primary'}`}
                />
                {formErrors.gst && <p className="text-[10px] text-danger mt-1">{formErrors.gst}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Remarks</label>
                <input
                  type="text"
                  value={formRemarks}
                  onChange={(e) => setFormRemarks(e.target.value)}
                  placeholder="Optional notes..."
                  className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-border font-sans">
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="bg-surface border border-border hover:bg-surface text-text-secondary hover:text-text-primary px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-primary text-white font-medium text-xs px-4 py-2 rounded-xl shadow-lg shadow-primary/10 cursor-pointer"
              >
                Confirm Invoice Approval
              </button>
            </div>
          </form>
        </Dialog>

      {/* DIALOG EDIT billing modal */}
      <Dialog isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Materials Receipt" size="lg">
        <form onSubmit={handleEditBillSubmit} className="space-y-4 font-sans">
          <div className="border-t border-border/80 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Supplier/Vendor *</label>
              <input
                type="text"
                value={formVendor}
                onChange={(e) => setFormVendor(e.target.value)}
                placeholder="e.g. ACC Cement Distributors"
                className={`w-full bg-surface border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary ${formErrors.vendor ? 'border-rose-500 text-danger' : 'border-border text-text-primary'}`}
              />
              {formErrors.vendor && <p className="text-[10px] text-danger mt-1">{formErrors.vendor}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Material Details *</label>
              <input
                type="text"
                value={formMaterial}
                onChange={(e) => setFormMaterial(e.target.value)}
                placeholder="e.g. Cement Grade 53 (200 Bags)"
                className={`w-full bg-surface border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary ${formErrors.material ? 'border-rose-500 text-danger' : 'border-border text-text-primary'}`}
              />
              {formErrors.material && <p className="text-[10px] text-danger mt-1">{formErrors.material}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Invoice Number *</label>
              <input
                type="text"
                value={formInvoiceNumber}
                onChange={(e) => setFormInvoiceNumber(e.target.value)}
                placeholder="e.g. INV-1204"
                className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary font-mono font-bold text-text-secondary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Billing Date *</label>
              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className={`w-full bg-surface border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary font-mono ${formErrors.date ? 'border-rose-500 text-danger' : 'border-border text-text-primary'}`}
              />
              {formErrors.date && <p className="text-[10px] text-danger mt-1">{formErrors.date}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Quantity *</label>
              <input
                type="number"
                value={formQuantity}
                onChange={(e) => setFormQuantity(e.target.value)}
                className={`w-full bg-surface border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary font-mono ${formErrors.quantity ? 'border-rose-500 text-danger' : 'border-border text-text-primary'}`}
              />
              {formErrors.quantity && <p className="text-[10px] text-danger mt-1">{formErrors.quantity}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Unit *</label>
              <input
                type="text"
                value={formUnit}
                onChange={(e) => setFormUnit(e.target.value)}
                placeholder="Bags, Tons..."
                className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary"
              />
              {formErrors.unit && <p className="text-[10px] text-danger mt-1">{formErrors.unit}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Total Bill Amount (INR) *</label>
              <input
                type="number"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                placeholder="e.g. 125000"
                className={`w-full bg-surface border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary font-mono font-bold text-primary ${formErrors.amount ? 'border-rose-500 text-danger' : 'border-border text-text-primary'}`}
              />
              {formErrors.amount && <p className="text-[10px] text-danger mt-1">{formErrors.amount}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Select Associated Project</label>
              <select
                value={formProjectId}
                onChange={(e) => setFormProjectId(e.target.value)}
                className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary"
              >
                <option value="">Select Project</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.project_name || p.project_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">GST Amount (INR)</label>
              <input
                type="number"
                value={formGst}
                onChange={(e) => setFormGst(e.target.value)}
                placeholder="e.g. 4500"
                className={`w-full bg-surface border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary font-mono ${formErrors.gst ? 'border-rose-500 text-danger' : 'border-border text-text-primary'}`}
              />
              {formErrors.gst && <p className="text-[10px] text-danger mt-1">{formErrors.gst}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Remarks</label>
              <input
                type="text"
                value={formRemarks}
                onChange={(e) => setFormRemarks(e.target.value)}
                placeholder="Optional notes..."
                className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-border font-sans">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="bg-surface border border-border hover:bg-surface text-text-secondary hover:text-text-primary px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-primary text-white font-medium text-xs px-4 py-2 rounded-xl shadow-lg shadow-primary/10 cursor-pointer"
            >
              Update Bill
            </button>
          </div>
        </form>
      </Dialog>

      <Dialog isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Unlink Invoice Bill">
        <div className="space-y-4 font-sans">
          <p className="text-sm text-text-secondary">
            Are you absolutely sure you want to delete bill for <span className="font-semibold text-text-primary">{selectedBill?.vendor_name || selectedBill?.vendor}</span>?
          </p>
          <div className="bg-danger/5 border border-danger/20 p-3 rounded-xl text-xs text-danger flex items-start space-x-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>This will permanently drop this bill row from the procurement ledger.</span>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setIsDeleteOpen(false)}
              className="bg-surface border border-border hover:bg-surface text-text-secondary hover:text-text-primary px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              className="bg-danger hover:bg-danger/90 text-white font-medium text-xs px-4 py-2 rounded-xl shadow-lg shadow-danger/10 transition-all cursor-pointer"
            >
              Remove Row
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default Bills;

