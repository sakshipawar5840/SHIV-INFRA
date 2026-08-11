import React, { useState, useEffect } from 'react';
import { getStoredData, saveStoredData, logSystemAction, INITIAL_BILLS, INITIAL_PROJECTS } from '../lib/mockData';
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
  Loader2, 
  AlertCircle 
} from 'lucide-react';

export const Bills: React.FC = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'spreadsheet'>('cards');

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  // Form Fields
  const [formProjectId, setFormProjectId] = useState('');
  const [formVendor, setFormVendor] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formMaterial, setFormMaterial] = useState('');
  const [formDate, setFormDate] = useState('2026-07-07');
  const [formInvoiceNumber, setFormInvoiceNumber] = useState('');
  const [formQuantity, setFormQuantity] = useState('100');
  const [formUnit, setFormUnit] = useState('Bags');
  const [formGst, setFormGst] = useState('18');

  useEffect(() => {
    setBills(getStoredData<Bill[]>('bills', INITIAL_BILLS));
    setProjects(getStoredData<Project[]>('projects', INITIAL_PROJECTS));
  }, []);

  const handleSaveBills = (data: Bill[]) => {
    setBills(data);
    saveStoredData('bills', data);
  };

  // Automated Excel Master Spreadsheet Update logic
  // The moment we call handleSaveBills, the underlying storage synchronizes.
  // Thus, the Live Grid and downloable files are instantly updated.

  // Professional individual Bill soft-copy A4 PDF Generator
  const downloadBillPDF = (bill: Bill) => {
    const doc = new jsPDF();
    const matchedProj = projects.find(p => p.id === bill.project_id)?.name || 'General Site';
    
    // Header Branding Banner
    doc.setFillColor(15, 23, 42); // slate-900 background
    doc.rect(0, 0, 210, 38, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('SHIV INFRASTRUCTURES', 15, 18);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225); // slate-300
    doc.text('Corporate Office: Shiv Towers, Baner Hill Road, Baner, Pune - 411045', 15, 26);
    doc.text('Contact: +91 20 44556677  |  Email: shivinfra55@gmail.com', 15, 32);
    
    // Receipt body
    doc.setTextColor(15, 23, 42); // Reset to slate
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('MATERIAL PURCHASE RECEIPT', 15, 52);
    
    // Divider line
    doc.setDrawColor(226, 232, 240); // border-slate-200
    doc.setLineWidth(0.5);
    doc.line(15, 56, 195, 56);
    
    // General info columns
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Invoice Details:', 15, 66);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice No:  ${bill.invoice_number || 'REC-' + bill.id.slice(2, 8).toUpperCase()}`, 15, 73);
    doc.text(`Date of Issue: ${bill.bill_date}`, 15, 79);
    doc.text(`Project Site:  ${matchedProj}`, 15, 85);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Supplier/Vendor:', 115, 66);
    doc.setFont('helvetica', 'normal');
    doc.text(`Vendor:    ${bill.vendor}`, 115, 73);
    doc.text('GSTIN:     27AAACS1234F1Z9', 115, 79);
    doc.text('RERA Reg:  Approved Site', 115, 85);
    
    // Table Grid
    doc.setFillColor(248, 250, 252); // grey background
    doc.rect(15, 96, 180, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('Material / Item Description', 18, 101);
    doc.text('Qty', 110, 101);
    doc.text('Unit', 130, 101);
    doc.text('Total Price', 165, 101);
    
    // Table content row
    doc.setFont('helvetica', 'normal');
    doc.text(bill.material, 18, 114);
    doc.text(String(bill.quantity || 1), 110, 114);
    doc.text(bill.unit || 'Units', 130, 114);
    doc.text(`Rs. ${bill.amount.toLocaleString('en-IN')}`, 165, 114);
    doc.line(15, 120, 195, 120);
    
    // Tax aggregations
    const gstRate = bill.gst || 18;
    const baseValue = Math.round(bill.amount / (1 + gstRate/100));
    const taxValue = bill.amount - baseValue;
    
    doc.text('Subtotal (Base Value):', 120, 132);
    doc.text(`Rs. ${baseValue.toLocaleString('en-IN')}`, 165, 132);
    
    doc.text(`GST Inclusive (${gstRate}%):`, 120, 138);
    doc.text(`Rs. ${taxValue.toLocaleString('en-IN')}`, 165, 138);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Total Invoice Amount:', 120, 146);
    doc.text(`Rs. ${bill.amount.toLocaleString('en-IN')}`, 165, 146);
    
    // Disclaimers and Signatures
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

    // Prompt save
    doc.save(`SHIV_INFRA_BILL_${bill.invoice_number || bill.id}.pdf`);
  };

  // Simulating the Gemini OCR Receipt parser with real scanner overlays
  const triggerImageOCR = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    // Artifical scanning delay with cyber scanners
    setTimeout(() => {
      // Intelligently prefill forms using file naming heuristics or mock extraction
      const isSteel = file.name.toLowerCase().includes('steel') || file.name.toLowerCase().includes('iron');
      const isPaint = file.name.toLowerCase().includes('paint') || file.name.toLowerCase().includes('color');
      
      if (isSteel) {
        setFormVendor('Kamdhenu Steel Corp');
        setFormMaterial('Reinforcement TMT Bars Fe 500D (5 Tons)');
        setFormAmount('285000');
        setFormQuantity('5');
        setFormUnit('Tons');
        setFormInvoiceNumber('INV-2089');
      } else if (isPaint) {
        setFormVendor('Asian Paints Warehouse');
        setFormMaterial('Apex Ultima Exterior Weatherproof (120 Litres)');
        setFormAmount('72000');
        setFormQuantity('120');
        setFormUnit('Litres');
        setFormInvoiceNumber('INV-0411');
      } else {
        setFormVendor('Ultratech Cement Distributor');
        setFormMaterial('Premium Portland Cement Grade 53 (150 Bags)');
        setFormAmount('67500');
        setFormQuantity('150');
        setFormUnit('Bags');
        setFormInvoiceNumber('INV-3320');
      }

      setIsScanning(false);
      logSystemAction('Update', `AI OCR scanned document ${file.name} successfully`);
    }, 2000);
  };

  const openAddModal = () => {
    if (projects.length > 0) {
      setFormProjectId(projects[0].id);
    }
    setFormVendor('');
    setFormMaterial('');
    setFormAmount('');
    setFormInvoiceNumber(`INV-${Math.floor(1000 + Math.random() * 9000)}`);
    setFormQuantity('100');
    setFormUnit('Bags');
    setFormGst('18');
    setIsAddOpen(true);
  };

  const handleAddBillSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formVendor || !formMaterial || !formAmount) return;

    const newBill: Bill = {
      id: `b_${Date.now()}`,
      project_id: formProjectId,
      vendor: formVendor,
      amount: Number(formAmount),
      material: formMaterial,
      bill_date: formDate,
      ocr_status: 'Success',
      invoice_number: formInvoiceNumber,
      quantity: Number(formQuantity),
      unit: formUnit,
      gst: Number(formGst)
    };

    // Auto-update master storage - this guarantees it appears instantly in the live grid and downloadable file reads from this updated state!
    const updated = [newBill, ...bills];
    handleSaveBills(updated);
    logSystemAction('Create', `New Procurement Bill added for "${formVendor}" of ₹${formAmount}`);
    setIsAddOpen(false);
  };

  const startDelete = (bill: Bill) => {
    setSelectedBill(bill);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!selectedBill) return;
    const updated = bills.filter(b => b.id !== selectedBill.id);
    handleSaveBills(updated);
    logSystemAction('Delete', `Procurement Bill unlinked for "${selectedBill.vendor}"`);
    setIsDeleteOpen(false);
  };

  // Filter & searches
  const filteredBills = bills.filter(b => {
    const matchedProj = projects.find(p => p.id === b.project_id)?.name || '';
    return b.vendor.toLowerCase().includes(search.toLowerCase()) ||
           b.material.toLowerCase().includes(search.toLowerCase()) ||
           b.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
           matchedProj.toLowerCase().includes(search.toLowerCase());
  });

  // Dynamic Excel exporter
  const exportFullSpreadsheet = () => {
    // Generate clean CSV representing the live updated Excel Spreadsheet
    const headers = ['Invoice Number', 'Date', 'Site/Project', 'Vendor', 'Material Details', 'Quantity', 'Unit', 'GST (%)', 'Total Amount (INR)'];
    const rows = filteredBills.map(b => [
      b.invoice_number || 'N/A',
      b.bill_date,
      projects.find(p => p.id === b.project_id)?.name || 'General Site',
      b.vendor,
      b.material,
      b.quantity || 1,
      b.unit || 'Units',
      b.gst || 18,
      b.amount
    ]);

    const csvContent = [headers, ...rows].map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'SHIV_INFRA_MASTER_PROCUREMENT_LEDGER.csv');
    link.click();
    logSystemAction('Access', 'Exported master procurement excel ledger CSV');
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100 font-sans">
            Procurement Bills & Expenses
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Dynamic MS Excel Spreadsheet interface with integrated Gemini AI OCR scanner.
          </p>
        </div>
        
        {/* Exporter Controls */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={exportFullSpreadsheet}
            className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-emerald-400 font-semibold text-xs px-3.5 py-2.5 rounded-xl transition-all cursor-pointer"
          >
            <FileSpreadsheet size={13} />
            <span>Download Master Excel</span>
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-medium text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-sky-500/10 cursor-pointer"
          >
            <Plus size={14} />
            <span>Upload Bill</span>
          </button>
        </div>
      </div>

      {/* Navigation views filters */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 relative max-w-sm">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-500">
            <Search size={14} />
          </div>
          <input
            type="text"
            placeholder="Search vendor, invoice, material or project..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-500 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-sky-500/80"
          />
        </div>

        {/* View toggles */}
        <div className="flex items-center bg-slate-950 border border-slate-800 p-1 rounded-xl shrink-0">
          <button
            onClick={() => setViewMode('cards')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'cards' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Grid size={13} />
            <span>Audit Cards</span>
          </button>
          <button
            onClick={() => setViewMode('spreadsheet')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'spreadsheet' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet size={13} />
            <span>Live MS Excel Grid</span>
          </button>
        </div>
      </div>

      {/* Main content viewport */}
      {viewMode === 'cards' ? (
        /* Cards View */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredBills.map((b) => {
            const siteName = projects.find(p => p.id === b.project_id)?.name || 'General Site';
            return (
              <div
                key={b.id}
                className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 hover:border-sky-500/40 transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start pb-3 border-b border-slate-800/60">
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">{b.vendor}</h4>
                      <p className="text-[10px] text-slate-400 flex items-center mt-0.5">Invoice: {b.invoice_number || 'N/A'}</p>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                      Verified
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <p className="text-slate-300"><span className="text-slate-500 font-medium">Material:</span> {b.material}</p>
                    <p className="text-slate-300"><span className="text-slate-500 font-medium">Site Link:</span> {siteName}</p>
                    <p className="text-slate-300"><span className="text-slate-500 font-medium">Quantity:</span> {b.quantity || 1} {b.unit || 'Units'}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-slate-800/40 mt-4 pt-3.5">
                  <span className="text-sm font-mono font-bold text-sky-400">
                    ₹ {b.amount.toLocaleString('en-IN')}
                  </span>
                  
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => downloadBillPDF(b)}
                      className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors border border-rose-500/10 cursor-pointer"
                      title="Download PDF Invoice"
                    >
                      <Download size={13} />
                    </button>
                    <button
                      onClick={() => startDelete(b)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
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
            <div className="col-span-full bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
              <Receipt size={36} className="text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-400">No procurement invoices logged</p>
            </div>
          )}
        </div>
      ) : (
        /* Dynamic Live Excel Spreadsheet Grid */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="bg-slate-950/60 border-b border-slate-800 px-4 py-2 flex items-center space-x-2 text-[10px] font-mono text-emerald-400">
            <span className="h-2 w-2 bg-emerald-400 rounded-full animate-ping"></span>
            <span>Spreadsheet Master synchronized with storage. Editing auto-saves.</span>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-mono select-none uppercase tracking-wider text-[9px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 border-r border-slate-800">Invoice ID</th>
                  <th className="py-3 px-4 border-r border-slate-800">Issue Date</th>
                  <th className="py-3 px-4 border-r border-slate-800">Construction Site</th>
                  <th className="py-3 px-4 border-r border-slate-800">Supplier/Vendor</th>
                  <th className="py-3 px-4 border-r border-slate-800">Material Items</th>
                  <th className="py-3 px-4 border-r border-slate-800">Qty</th>
                  <th className="py-3 px-4 border-r border-slate-800 text-right">Invoice Sum</th>
                  <th className="py-3 px-4 text-center">Download PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                {filteredBills.map((b) => {
                  const siteName = projects.find(p => p.id === b.project_id)?.name || 'General Site';
                  return (
                    <tr key={b.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-4 border-r border-slate-800 font-bold text-slate-400">{b.invoice_number || 'N/A'}</td>
                      <td className="py-2.5 px-4 border-r border-slate-800">{b.bill_date}</td>
                      <td className="py-2.5 px-4 border-r border-slate-800 text-slate-400">{siteName}</td>
                      <td className="py-2.5 px-4 border-r border-slate-800 font-sans text-slate-200 font-semibold">{b.vendor}</td>
                      <td className="py-2.5 px-4 border-r border-slate-800 font-sans">{b.material}</td>
                      <td className="py-2.5 px-4 border-r border-slate-800 text-slate-400">{b.quantity || 1} {b.unit || 'Bags'}</td>
                      <td className="py-2.5 px-4 border-r border-slate-800 text-right font-bold text-sky-400">₹ {b.amount.toLocaleString('en-IN')}</td>
                      <td className="py-2.5 px-4 text-center">
                        <button
                          onClick={() => downloadBillPDF(b)}
                          className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg text-[9px] font-bold transition-all cursor-pointer inline-flex items-center space-x-1"
                        >
                          <Download size={10} />
                          <span>PDF</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DIALOG UPLOAD OCR billing modal */}
      <Dialog isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Upload Materials Receipt" size="lg">
        {/* Interactive OCR Laser Scan screen overlay */}
        {isScanning ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
            <div className="relative h-20 w-36 border border-dashed border-sky-500/60 rounded-xl overflow-hidden bg-sky-950/10 flex items-center justify-center">
              <Loader2 className="text-sky-400 animate-spin" size={24} />
              {/* Blue Scan Laser Line */}
              <div className="absolute inset-x-0 h-1 bg-sky-400 top-0 animate-bounce shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
            </div>
            <p className="text-xs font-semibold text-slate-200 animate-pulse">Gemini OCR Invoice Analyzer scanning invoice document...</p>
            <p className="text-[10px] text-slate-500 font-mono">Extracting material tags, GSTIN details, and amounts...</p>
          </div>
        ) : (
          <form onSubmit={handleAddBillSubmit} className="space-y-4 font-sans">
            {/* Direct browser upload drag area with trigger */}
            <div className="bg-slate-950 border border-slate-800 p-6 rounded-xl text-center relative hover:border-sky-500/40 transition-colors">
              <Upload size={28} className="text-slate-600 mx-auto mb-2.5" />
              <p className="text-xs font-semibold text-slate-300">Drag your raw receipt file here, or browse local device</p>
              <p className="text-[10px] text-slate-500 mt-1 font-mono">Supports JPG, PNG, PDF receipts up to 10MB.</p>
              
              <div className="mt-4 flex justify-center">
                <label className="flex items-center space-x-1 bg-slate-900 border border-slate-800 text-slate-300 px-3.5 py-1.5 rounded-lg text-[10px] font-semibold hover:bg-slate-850 transition-colors cursor-pointer select-none">
                  <Sparkles size={11} className="text-amber-300 animate-pulse" />
                  <span>Browse Device Files...</span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={triggerImageOCR}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Extracted form controls */}
            <div className="border-t border-slate-800/80 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Supplier/Vendor</label>
                <input
                  type="text"
                  required
                  value={formVendor}
                  onChange={(e) => setFormVendor(e.target.value)}
                  placeholder="e.g. ACC Cement Distributors"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Material Details</label>
                <input
                  type="text"
                  required
                  value={formMaterial}
                  onChange={(e) => setFormMaterial(e.target.value)}
                  placeholder="e.g. Cement Grade 53 (200 Bags)"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Invoice Number</label>
                <input
                  type="text"
                  value={formInvoiceNumber}
                  onChange={(e) => setFormInvoiceNumber(e.target.value)}
                  placeholder="e.g. INV-1204"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-sky-500 font-mono font-bold text-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Billing Date</label>
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Quantity</label>
                <input
                  type="number"
                  value={formQuantity}
                  onChange={(e) => setFormQuantity(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Unit</label>
                <input
                  type="text"
                  value={formUnit}
                  onChange={(e) => setFormUnit(e.target.value)}
                  placeholder="Bags, Tons..."
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Total Bill Amount (INR)</label>
                <input
                  type="number"
                  required
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  placeholder="e.g. 125000"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-sky-500 font-mono font-bold text-sky-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Select Associated Project</label>
                <select
                  value={formProjectId}
                  onChange={(e) => setFormProjectId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-sky-500"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800 font-sans">
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-slate-200 px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-medium text-xs px-4 py-2 rounded-xl shadow-lg shadow-sky-500/10 cursor-pointer"
              >
                Confirm Invoice Approval
              </button>
            </div>
          </form>
        )}
      </Dialog>

      {/* DIALOG Confirm Delete */}
      <Dialog isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Unlink Invoice Bill">
        <div className="space-y-4 font-sans">
          <p className="text-sm text-slate-300">
            Are you absolutely sure you want to delete bill for <span className="font-semibold text-slate-100">{selectedBill?.vendor}</span>?
          </p>
          <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl text-xs text-rose-400 flex items-start space-x-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>This will permanently drop this bill row from the Master Excel Spreadsheet ledgers.</span>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsDeleteOpen(false)}
              className="bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-slate-200 px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              className="bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs px-4 py-2 rounded-xl shadow-lg shadow-rose-500/10 transition-all cursor-pointer"
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
