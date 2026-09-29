import React, { useState, useEffect } from 'react';
import { apiClient } from '../lib/axiosClient';
import { Vendor } from '../types';
import { Dialog } from '../components/Dialog';
import { Plus, Search, Star, MessageSquare, Phone, Mail, Award, Trash2, AlertCircle } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

export const Vendors: React.FC = () => {
  const toast = useToast();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formType, setFormType] = useState('');
  const [formBalance, setFormBalance] = useState('');
  const [formRating, setFormRating] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadVendors = async () => {
      try {
        const res = await apiClient.get('/v1/vendors', { params: { q: search || undefined } });
        setVendors(res.data?.data ?? []);
      } catch (err) {
        console.error('Failed to load vendors', err);
        toast.showToast('Failed to load vendors', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadVendors();
  }, []);

  const handleAddVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formName.trim()) errors.name = 'Supplier name is required';
    if (!formPhone.trim()) errors.phone = 'Contact phone is required';
    if (!formEmail.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formEmail)) errors.email = 'Enter a valid email address';
    if (!formType) errors.type = 'Material type is required';
    if (!formBalance || Number(formBalance) < 0) errors.balance = 'Enter a valid balance';
    if (!formRating) errors.rating = 'Quality rating is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.showToast('Please fill all required fields.', 'warning');
      return;
    }

    setFormErrors({});

    try {
      const payload = {
        vendor_name: formName,
        contact_person: formName,
        phone: formPhone,
        email: formEmail,
        gstin: '',
        rating: Number(formRating),
        outstanding_balance: Number(formBalance),
      };

      const res = await apiClient.post('/v1/vendors', payload);
      if (res.data?.success) {
        setVendors(prev => [res.data.data, ...prev]);
        toast.showToast('Vendor added successfully', 'success');
        setIsAddOpen(false);
        setFormName('');
        setFormPhone('');
        setFormEmail('');
        setFormType('');
        setFormBalance('');
        setFormRating('');
        setFormErrors({});
      }
    } catch (err) {
      console.error('Failed to add vendor', err);
      toast.showToast('Failed to add vendor', 'error');
    }
  };

  const handleDeleteVendor = (id: string, name: string) => {
    const vendor = vendors.find(v => v.id === id);
    setSelectedVendor(vendor || null);
    setIsDeleteOpen(true);
  };

  const confirmDeleteVendor = async () => {
    if (!selectedVendor) return;
    try {
      const res = await apiClient.delete(`/v1/vendors/${selectedVendor.id}`);
      if (res.data?.success) {
        setVendors(prev => prev.filter(v => v.id !== selectedVendor.id));
        toast.showToast('Vendor removed successfully', 'success');
      }
    } catch (err) {
      console.error('Failed to delete vendor', err);
      toast.showToast('Failed to delete vendor', 'error');
    } finally {
      setIsDeleteOpen(false);
      setSelectedVendor(null);
    }
  };

  const filteredVendors = vendors.filter(v =>
    v.vendor_name.toLowerCase().includes(search.toLowerCase()) ||
    (v.contact_person || '').toLowerCase().includes(search.toLowerCase()) ||
    (v.phone || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 text-text-primary font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-text-primary">Suppliers & Vendors Registry</h2>
          <p className="text-xs text-text-secondary mt-0.5">Manage material contractor directories, ratings, and active payables balances.</p>
        </div>
        <button
          onClick={() => {
            setFormName('');
            setFormPhone('');
            setFormEmail('');
            setFormType('');
            setFormBalance('');
            setFormRating('');
            setFormErrors({});
            setIsAddOpen(true);
          }}
          className="flex items-center space-x-1.5 bg-primary text-white font-medium text-xs px-4 py-2.5 rounded-xl shadow-lg cursor-pointer"
        >
          <Plus size={14} />
          <span>Add Vendor</span>
        </button>
      </div>

      <div className="bg-surface border border-border p-4 rounded-2xl">
        <div className="relative max-w-sm">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-text-secondary">
            <Search size={14} />
          </div>
          <input
            type="text"
            placeholder="Search verified supplier by contractor name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface/80 border border-border text-text-primary placeholder-text-secondary rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredVendors.map(vendor => (
          <div key={vendor.id} className="bg-surface border border-border/80 rounded-2xl p-5 hover:border-teal/40 transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-start pb-3 border-b border-border/50">
                <div>
                  <h4 className="text-sm font-bold text-text-primary">{vendor.vendor_name}</h4>
                  <span className="text-[10px] text-text-secondary font-semibold">{vendor.contact_person || 'Vendor'}</span>
                </div>
                <div className="flex items-center space-x-1 text-warning text-xs font-bold font-mono">
                  <Star size={12} className="fill-warning text-warning shrink-0" />
                  <span>{vendor.rating.toFixed(1)}</span>
                </div>
              </div>

              <div className="space-y-2 text-xs text-text-secondary font-mono">
                <p className="flex items-center"><Phone size={12} className="text-text-secondary mr-2" /> {vendor.phone || 'N/A'}</p>
                <p className="flex items-center"><Mail size={12} className="text-text-secondary mr-2 truncate" /> <span className="truncate">{vendor.email || 'N/A'}</span></p>

                <div className="bg-surface/40 border border-border p-2.5 rounded-xl flex items-center justify-between mt-2.5">
                  <span className="text-[10px] text-text-secondary font-sans font-bold uppercase">Pending Balance:</span>
                  <span className="text-xs font-bold text-danger">₹ {vendor.outstanding_balance.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
              {vendor.outstanding_balance > 0 ? (
                <a
                  href={`https://api.whatsapp.com/send?phone=${vendor.phone}&text=Hello%20${vendor.vendor_name},%20Greetings%20from%20SHIV%20INFRA.%20We%20wanted%20to%20confirm%20your%20pending%20outstanding%20of%20Rs.%20${vendor.outstanding_balance}.%20Our%20accounts%20team%20is%20reconciliation.`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center space-x-1 bg-success/5 hover:bg-success/10 text-success text-[10px] font-bold px-2.5 py-1.5 rounded-lg border border-success/20 transition-colors"
                >
                  <MessageSquare size={11} />
                  <span>Send Balance Alert</span>
                </a>
              ) : (
                <span className="text-[10px] font-bold bg-success bg-success/5 border border-success/20 px-2.5 py-1.5 rounded-lg inline-flex items-center">
                  <Award size={11} className="mr-1" /> Account Settled
                </span>
              )}

              <button
                onClick={() => handleDeleteVendor(vendor.id, vendor.vendor_name)}
                className="text-text-secondary hover:text-danger p-1 hover:bg-bg-app rounded transition-all cursor-pointer"
                title="Remove Supplier"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Dialog isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Register Supplier/Vendor Profile">
        <form onSubmit={handleAddVendor} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Supplier Name</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. ACC Cement Distributors"
                className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Contact Phone</label>
              <input
                type="text"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="e.g. +91 9988776655"
                className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Email Address</label>
              <input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="sales@vendor.com"
                className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Material Supplies Type</label>
              <input
                type="text"
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
                placeholder="e.g. Plumbing Hardware"
                className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Outstanding Balance (INR)</label>
              <input
                type="number"
                value={formBalance}
                onChange={(e) => setFormBalance(e.target.value)}
                className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Contractor Quality Rating</label>
              <select
                value={formRating}
                onChange={(e) => setFormRating(e.target.value)}
                className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none"
              >
                <option value="">Select Quality Rating</option>
                <option value="5">5.0 Star - Highly Reliable</option>
                <option value="4">4.0 Star - Solid Standard</option>
                <option value="3">3.0 Star - Basic Terms</option>
              </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="bg-surface border border-border hover:bg-surface text-text-secondary hover:text-text-primary px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-primary text-white font-medium text-xs px-4 py-2 rounded-xl shadow-lg cursor-pointer"
            >
              Register Supplier
            </button>
          </div>
        </form>
      </Dialog>

      <Dialog isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Remove Vendor">
        <div className="space-y-4 font-sans">
          <p className="text-sm text-text-secondary">
            Are you sure you want to remove <span className="font-semibold text-text-primary">{selectedVendor?.vendor_name}</span> from the directory?
          </p>
          <div className="bg-danger/5 border border-danger/20 p-3 rounded-xl text-xs text-danger flex items-start space-x-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>This action cannot be undone. The vendor will be permanently removed.</span>
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
              onClick={confirmDeleteVendor}
              className="bg-danger hover:bg-danger/90 text-white font-medium text-xs px-4 py-2 rounded-xl shadow-lg shadow-danger/10 transition-all cursor-pointer"
            >
              Delete
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
