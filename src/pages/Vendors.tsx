import React, { useState, useEffect } from 'react';
import { getStoredData, saveStoredData, INITIAL_VENDORS, logSystemAction } from '../lib/mockData';
import { Vendor } from '../types';
import { Dialog } from '../components/Dialog';
import { Plus, Search, Star, MessageSquare, Phone, Mail, Award, Trash2 } from 'lucide-react';

export const Vendors: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formType, setFormType] = useState('Cement Supplies');
  const [formBalance, setFormBalance] = useState('0');
  const [formRating, setFormRating] = useState('5');

  useEffect(() => {
    setVendors(getStoredData<Vendor[]>('vendors', INITIAL_VENDORS));
  }, []);

  const handleSaveVendors = (data: Vendor[]) => {
    setVendors(data);
    saveStoredData('vendors', data);
  };

  const handleAddVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formPhone) return;

    const newVendor: Vendor = {
      id: `v_${Date.now()}`,
      name: formName,
      phone: formPhone,
      email: formEmail || 'sales@vendor.com',
      material_type: formType,
      pending_balance: Number(formBalance),
      rating: Number(formRating)
    };

    const updated = [newVendor, ...vendors];
    handleSaveVendors(updated);
    logSystemAction('Create', `Supplier vendor "${formName}" added to directory`);
    setIsAddOpen(false);
  };

  const handleDeleteVendor = (id: string, name: string) => {
    const updated = vendors.filter(v => v.id !== id);
    handleSaveVendors(updated);
    logSystemAction('Delete', `Supplier vendor "${name}" unlinked`);
  };

  const filteredVendors = vendors.filter(v => 
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.material_type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Suppliers & Vendors Registry</h2>
          <p className="text-xs text-slate-400 mt-0.5">Manage material contractor directories, ratings, and active payables balances.</p>
        </div>
        <button
          onClick={() => {
            setFormName('');
            setFormPhone('');
            setIsAddOpen(true);
          }}
          className="flex items-center space-x-1.5 bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-medium text-xs px-4 py-2.5 rounded-xl shadow-lg cursor-pointer"
        >
          <Plus size={14} />
          <span>Add Vendor</span>
        </button>
      </div>

      {/* Filter block */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="relative max-w-sm">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-500">
            <Search size={14} />
          </div>
          <input
            type="text"
            placeholder="Search verified supplier by contractor name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-500 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none"
          />
        </div>
      </div>

      {/* Vendors grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredVendors.map(vendor => (
          <div key={vendor.id} className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 hover:border-sky-500/40 transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-start pb-3 border-b border-slate-800/50">
                <div>
                  <h4 className="text-sm font-bold text-slate-200">{vendor.name}</h4>
                  <span className="text-[10px] text-slate-500 font-semibold">{vendor.material_type}</span>
                </div>
                <div className="flex items-center space-x-1 text-amber-400 text-xs font-bold font-mono">
                  <Star size={12} className="fill-amber-400 text-amber-400 shrink-0" />
                  <span>{vendor.rating.toFixed(1)}</span>
                </div>
              </div>

              {/* Contacts */}
              <div className="space-y-2 text-xs text-slate-300 font-mono">
                <p className="flex items-center"><Phone size={12} className="text-slate-500 mr-2" /> {vendor.phone}</p>
                <p className="flex items-center"><Mail size={12} className="text-slate-500 mr-2 truncate" /> <span className="truncate">{vendor.email}</span></p>
                
                <div className="bg-slate-950/40 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between mt-2.5">
                  <span className="text-[10px] text-slate-500 font-sans font-bold uppercase">Pending Balance:</span>
                  <span className="text-xs font-bold text-rose-400">₹ {vendor.pending_balance.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-850">
              {vendor.pending_balance > 0 ? (
                <a
                  href={`https://api.whatsapp.com/send?phone=${vendor.phone}&text=Hello%20${vendor.name},%20Greetings%20from%20SHIV%20INFRA.%20We%20wanted%20to%20confirm%20your%20pending%20outstanding%20of%20Rs.%20${vendor.pending_balance}.%20Our%20accounts%20team%20is%20reconciliation.`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center space-x-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2.5 py-1.5 rounded-lg border border-emerald-500/10 transition-colors"
                >
                  <MessageSquare size={11} />
                  <span>Send Balance Alert</span>
                </a>
              ) : (
                <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/10 px-2.5 py-1.5 rounded-lg inline-flex items-center">
                  <Award size={11} className="mr-1" /> Account Settled
                </span>
              )}

              <button
                onClick={() => handleDeleteVendor(vendor.id, vendor.name)}
                className="text-slate-500 hover:text-rose-400 p-1 hover:bg-slate-800 rounded transition-all cursor-pointer"
                title="Remove Supplier"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Dialog Add Vendor */}
      <Dialog isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Register Supplier/Vendor Profile">
        <form onSubmit={handleAddVendor} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Supplier Name</label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. ACC Cement Distributors"
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2 text-xs focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Contact Phone</label>
              <input
                type="text"
                required
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="e.g. +91 9988776655"
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2 text-xs focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
              <input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="sales@vendor.com"
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2 text-xs focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Material Supplies Type</label>
              <input
                type="text"
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
                placeholder="e.g. Plumbing Hardware"
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2 text-xs focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Outstanding Balance (INR)</label>
              <input
                type="number"
                value={formBalance}
                onChange={(e) => setFormBalance(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2 text-xs focus:outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Contractor Quality Rating</label>
            <select
              value={formRating}
              onChange={(e) => setFormRating(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none"
            >
              <option value="5">5.0 Star - Highly Reliable</option>
              <option value="4">4.0 Star - Solid Standard</option>
              <option value="3">3.0 Star - Basic Terms</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-slate-200 px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-medium text-xs px-4 py-2 rounded-xl shadow-lg cursor-pointer"
            >
              Register Supplier
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
export default Vendors;
