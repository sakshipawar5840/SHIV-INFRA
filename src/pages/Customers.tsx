import React, { useState, useEffect } from 'react';
import { apiClient } from '../lib/axiosClient';
import { Customer } from '../types';
import { Dialog } from '../components/Dialog';
import { Plus, Search, Users, Phone, Mail, Award, Edit2, Trash2, ShieldAlert, MessageSquare } from 'lucide-react';
import { WhatsAppIcon } from '../components/WhatsAppIcon';
import { useToast } from '../contexts/ToastContext';

export const Customers: React.FC = () => {
  const toast = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formCountryCode, setFormCountryCode] = useState('+91');
  const [formEmail, setFormEmail] = useState('');
  const [formRequirement, setFormRequirement] = useState('');
  const [formBudget, setFormBudget] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formStatus, setFormStatus] = useState<Customer['status'] | ''>('');
  const [formNotes, setFormNotes] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const res = await apiClient.get('/v1/customers');
        setCustomers(res.data?.data ?? []);
      } catch (err) {
        console.error('Failed to load customers from API', err);
        toast.showToast('Failed to load customers', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadCustomers();
  }, []);

  const openAddModal = () => {
    setFormName('');
    setFormPhone('');
    setFormCountryCode('+91');
    setFormEmail('');
    setFormRequirement('');
    setFormBudget('');
    setFormLocation('');
    setFormStatus('');
    setFormNotes('');
    setIsAddOpen(true);
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    
    if (!formName.trim()) errors.name = 'Customer name is required';
    if (!formPhone.trim()) errors.phone = 'Phone number is required';
    if (!formEmail.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formEmail)) errors.email = 'Enter a valid email address';
    if (!formRequirement.trim()) errors.requirement = 'Requirement is required';
    if (!formBudget || Number(formBudget) <= 0) errors.budget = 'Enter a valid budget';
    if (!formLocation.trim()) errors.location = 'Location is required';
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.showToast('Please fill all required fields.', 'warning');
      return;
    }
    
    setFormErrors({});

    try {
      const payload: any = {
        full_name: formName,
        phone: `${formCountryCode}${formPhone}`,
        email: formEmail,
        interested_property_type: formRequirement,
        budget: Number(formBudget),
        interested_location: formLocation,
        status: formStatus,
        notes: formNotes
      };

      await apiClient.post('/v1/customers', payload);

      toast.showToast('Customer saved successfully', 'success');
      setIsAddOpen(false);
      setFormName('');
      setFormPhone('');
      setFormCountryCode('+91');
      setFormEmail('');
      setFormRequirement('');
      setFormBudget('');
      setFormLocation('');
      setFormStatus('');
      setFormNotes('');

      const res = await apiClient.get('/v1/customers');
      setCustomers(res.data?.data ?? []);
    } catch (err: any) {
      console.error('Failed to create customer', err);
      toast.showToast(err.response?.data?.message || 'Failed to create customer', 'error');
    }
  };

  const openEditModal = (cust: Customer) => {
    setSelectedCustomer(cust);
    setEditName(cust.full_name);
    setEditPhone(cust.phone);
    setEditEmail(cust.email);
  };

  // State for editing
  const [editId, setEditId] = useState('');
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRequirement, setEditRequirement] = useState('');
  const [editBudget, setEditBudget] = useState(0);
  const [editLoc, setEditLoc] = useState('');
  const [editStatus, setEditStatus] = useState<Customer['status']>('active');
  const [editNotes, setEditNotes] = useState('');

  const [isOpenAddModal, setIsOpenAddModal] = useState(false);

  const startEdit = (cust: Customer) => {
    setEditId(cust.id);
    setEditName(cust.full_name);
    setEditPhone(cust.phone);
    setEditEmail(cust.email);
    setEditRequirement(cust.interested_property_type || '');
    setEditBudget(cust.budget || 0);
    setEditLoc(cust.interested_location || '');
    setEditStatus(cust.status);
    setEditNotes(cust.notes || '');
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;

    try {
      const payload: any = {
        full_name: editName,
        phone: editPhone,
        email: editEmail,
        interested_property_type: editRequirement,
        budget: Number(editBudget),
        interested_location: editLoc,
        status: editStatus,
        notes: editNotes
      };

      await apiClient.put(`/v1/customers/${editId}`, payload);

      toast.showToast('Customer updated successfully', 'success');
      setIsEditOpen(false);

      const res = await apiClient.get('/v1/customers');
      setCustomers(res.data?.data ?? []);
    } catch (err: any) {
      console.error('Failed to update customer', err);
      toast.showToast(err.response?.data?.message || 'Failed to update customer', 'error');
    }
  };

  const startDelete = (cust: Customer) => {
    setSelectedCustomer(cust);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCustomer) return;

    try {
      await apiClient.delete(`/v1/customers/${selectedCustomer.id}`);
      toast.showToast('Customer deleted successfully', 'success');
      setIsDeleteOpen(false);

      const res = await apiClient.get('/v1/customers');
      setCustomers(res.data?.data ?? []);
    } catch (err: any) {
      console.error('Failed to delete customer', err);
      toast.showToast(err.response?.data?.message || 'Failed to delete customer', 'error');
    }
  };

  const filteredCustomers = customers.filter(c => {
    const name = c.full_name || '';
    const phone = c.phone || '';
    const email = c.email || '';
    const matchesSearch = name.toLowerCase().includes(search.toLowerCase()) ||
                          phone.includes(search) ||
                          email.toLowerCase().includes(search);
    return matchesSearch;
  });

  return (
    <div className="space-y-6 text-text-primary">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-text-primary font-sans">
            Customers CRM Registry
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Database of registered buyers with active bookings and legal contract parameters.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center space-x-1.5 bg-primary text-white font-medium text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-primary/10 cursor-pointer"
        >
          <Plus size={14} />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-surface border border-border p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 relative max-w-sm">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-text-secondary">
            <Search size={14} />
          </div>
          <input
            type="text"
            placeholder="Search CRM buyers directory..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface/80 border border-border text-text-primary placeholder-text-secondary rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-primary/80"
          />
        </div>

        <div className="flex items-center text-text-secondary">
          <Phone size={12} className="mr-1" />
          <span className="text-[10px] font-bold uppercase">Showing all customers</span>
        </div>
      </div>

      {/* CRM Customer List Grid */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-surface border border-border p-12 text-center rounded-2xl">
          <Users size={36} className="text-text-secondary mx-auto mb-3" />
          <p className="text-sm font-semibold text-text-secondary">No customers registered</p>
          <p className="text-xs text-text-secondary mt-1">Add client listings dynamically via the Add button above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredCustomers.map((cust) => (
            <div
              key={cust.id}
              className="bg-surface border border-border/80 rounded-2xl p-5 hover:border-primary/40 transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Visual Avatar Header */}
                <div className="flex items-center justify-between pb-3.5 border-b border-border/50">
                  <div className="flex items-center space-x-3">
                     <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-primary/80 to-primary-hover/80 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-primary/10">
                       {(cust.full_name || '?')[0]}
                     </div>
                     <div>
                       <h4 className="text-sm font-bold text-text-primary">{cust.full_name}</h4>
                       <span className={`text-[9px] font-bold uppercase tracking-wider ${
                         cust.status === 'active' ? 'text-success' : 'text-text-secondary'
                       }`}>
                         {cust.status} Buyer
                       </span>
                     </div>
                   </div>
                   {cust.status === 'active' && (
                    <div className="bg-warning/5 border border-warning/20 p-1 rounded-lg text-warning" title="Premium Closed Lead">
                      <Award size={14} className="animate-pulse" />
                    </div>
                  )}
                </div>

                {/* Primary Contacts */}
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center text-text-secondary">
                    <Phone size={13} className="text-text-secondary mr-2 shrink-0" />
                    <span className="font-mono">{cust.phone}</span>
                    {cust.phone && (
                      <button
                        onClick={() => {
                          const phone = cust.phone.replace(/[\s+\-()]/g, '');
                          window.open(`https://wa.me/${phone}`, '_blank', 'noopener,noreferrer');
                        }}
                        className="ml-2 p-1 text-emerald-500 hover:text-emerald-400 hover:bg-surface rounded-lg transition-colors cursor-pointer shrink-0"
                        title="Chat with customer on WhatsApp"
                        aria-label="Chat with customer on WhatsApp"
                      >
                        <WhatsAppIcon size={13} />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center text-text-secondary">
                    <Mail size={13} className="text-text-secondary mr-2 shrink-0 truncate" />
                    <span className="truncate">{cust.email}</span>
                  </div>
                   <div className="border-t border-border/40 pt-2.5 space-y-1 bg-surface/20 p-2.5 rounded-xl">
                     <p className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">Acquisition details</p>
                     <p className="text-text-secondary"><span className="text-text-secondary">Property:</span> {cust.interested_property_type || '-'}</p>
                     <p className="text-text-secondary"><span className="text-text-secondary">Value:</span> <span className="font-mono text-primary font-bold">₹ {((cust.budget || 0) / 100000).toFixed(2)} L</span></p>
                     <p className="text-text-secondary"><span className="text-text-secondary">Zone:</span> {cust.interested_location || '-'}</p>
                   </div>
                </div>

                {/* Staff commentary notes */}
                {cust.notes && (
                  <p className="text-[11px] text-text-secondary leading-relaxed italic bg-surface/30 p-2.5 rounded-lg border border-border/30">
                    "{cust.notes}"
                  </p>
                )}
              </div>

              {/* Administrative actions */}
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-border/40 mt-4">
                {cust.phone && (
                  <button
                    onClick={() => {
                      const phone = cust.phone.replace(/[\s+\-()]/g, '');
                      window.open(`https://wa.me/${phone}`, '_blank', 'noopener,noreferrer');
                    }}
                    className="p-1.5 text-emerald-500 hover:text-emerald-400 hover:bg-surface rounded-lg transition-colors cursor-pointer shrink-0"
                    title="Chat with customer on WhatsApp"
                    aria-label="Chat with customer on WhatsApp"
                  >
                    <WhatsAppIcon size={13} />
                  </button>
                )}
                <button
                  onClick={() => startEdit(cust)}
                  className="p-1.5 text-text-secondary hover:text-primary hover:bg-bg-app rounded-lg transition-colors cursor-pointer"
                  title="Modify Account"
                >
                  <Edit2 size={13} />
                </button>
                <button
                  onClick={() => startDelete(cust)}
                  className="p-1.5 text-text-secondary hover:text-danger hover:bg-bg-app rounded-lg transition-colors cursor-pointer"
                  title="Remove Account"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DIALOG ADD modal panel */}
      <Dialog isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Register Customer Profile">
        <form onSubmit={handleAddCustomer} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Full Client Name</label>
                <input
                  type="tel"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="9988776655"
                  className="flex-1 bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary font-mono"
                />
                {formErrors.phone && <p className="text-[10px] text-danger mt-1">{formErrors.phone}</p>}
              {formErrors.name && <p className="text-[10px] text-danger mt-1">{formErrors.name}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Mobile Phone No</label>
              <div className="flex space-x-2">
                <select
                  value={formCountryCode}
                  onChange={(e) => setFormCountryCode(e.target.value)}
                  className="w-24 bg-surface border border-border text-text-primary rounded-xl px-2 py-2 text-xs focus:outline-none focus:border-primary"
                >
                  <option value="+91">+91</option>
                  <option value="+1">+1</option>
                  <option value="+44">+44</option>
                  <option value="+61">+61</option>
                  <option value="+971">+971</option>
                  <option value="+65">+65</option>
                  <option value="+60">+60</option>
                  <option value="+49">+49</option>
                </select>
                <input
                  type="tel"

                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="9988776655"
                  className="flex-1 bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Primary Email</label>
              <input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="e.g. ramesh@gmail.com"
                className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary"
              />
              {formErrors.email && <p className="text-[10px] text-danger mt-1">{formErrors.email}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Closed Unit / Requirement</label>
              <input
                type="text"
                value={formRequirement}
                onChange={(e) => setFormRequirement(e.target.value)}
                placeholder="e.g. Flat No 103 (2 BHK)"
                className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary"
              />
              {formErrors.requirement && <p className="text-[10px] text-danger mt-1">{formErrors.requirement}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Final Sale Valuation (INR)</label>
              <input
                type="number"
                value={formBudget}
                onChange={(e) => setFormBudget(e.target.value)}
                placeholder="e.g. 5800000"
                className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Property Location</label>
              <input
                type="text"
                value={formLocation}
                onChange={(e) => setFormLocation(e.target.value)}
                placeholder="e.g. Hinjewadi, Pune"
                className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary"
              />
              {formErrors.location && <p className="text-[10px] text-danger mt-1">{formErrors.location}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Classification Tier</label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as any)}
                className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary"
              >
                <option value="">Select Status</option>
                <option value="active">Active Account</option>
                <option value="inactive">Inactive/On Hold</option>
              </select>
              {formErrors.status && <p className="text-[10px] text-danger mt-1">{formErrors.status}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Key Client Notes</label>
            <textarea
              rows={2}
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="First booking installment cleared. Legal registration expected next week..."
              className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary resize-none"
            />
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
              Save Customer
            </button>
          </div>
        </form>
      </Dialog>

      {/* DIALOG EDIT modal panel */}
      <Dialog isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Modify Customer Details">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Full Client Name</label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Mobile Phone No</label>
              <input
                type="text"
                required
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Primary Email</label>
              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Closed Unit / Requirement</label>
              <input
                type="text"
                value={editRequirement}
                onChange={(e) => setEditRequirement(e.target.value)}
                className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Final Sale Valuation (INR)</label>
              <input
                type="number"
                value={editBudget}
                onChange={(e) => setEditBudget(Number(e.target.value))}
                className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Property Location</label>
              <input
                type="text"
                value={editLoc}
                onChange={(e) => setEditLoc(e.target.value)}
                className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Classification Tier</label>
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value as any)}
              className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary"
            >
              <option value="active">Active Account</option>
              <option value="inactive">Inactive/On Hold</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Key Client Notes</label>
            <textarea
              rows={2}
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary resize-none"
            />
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
              Save Changes
            </button>
          </div>
        </form>
      </Dialog>

      {/* DIALOG DELETE modal panel */}
      <Dialog isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Unlink Customer Profile">
        <div className="space-y-4 font-sans">
          <p className="text-sm text-text-secondary">
            Are you absolutely sure you want to remove customer account for <span className="font-semibold text-text-primary">{selectedCustomer?.full_name}</span>?
          </p>
          <div className="bg-danger/5 border border-danger/20 p-3 rounded-xl text-xs text-danger flex items-start space-x-2">
            <ShieldAlert size={16} className="shrink-0" />
            <span>This action will disconnect the buyer's billing, logs, and property details from active dashboard viewports.</span>
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
              Delete Account
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
