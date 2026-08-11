import React, { useState, useEffect } from 'react';
import { getStoredData, saveStoredData, logSystemAction, INITIAL_CUSTOMERS } from '../lib/mockData';
import { Customer } from '../types';
import { Dialog } from '../components/Dialog';
import { Plus, Search, Users, Phone, Mail, Award, Edit2, Trash2, ShieldAlert } from 'lucide-react';

export const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRequirement, setFormRequirement] = useState('');
  const [formBudget, setFormBudget] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formStatus, setFormStatus] = useState<Customer['status']>('Active');
  const [formNotes, setFormNotes] = useState('');

  useEffect(() => {
    setCustomers(getStoredData<Customer[]>('customers', INITIAL_CUSTOMERS));
  }, []);

  const handleSaveCustomers = (data: Customer[]) => {
    setCustomers(data);
    saveStoredData('customers', data);
  };

  const openAddModal = () => {
    setFormName('');
    setFormPhone('');
    setFormEmail('');
    setFormRequirement('2 BHK flat');
    setFormBudget('6000000');
    setFormLocation('Wakad, Pune');
    setFormStatus('Active');
    setFormNotes('');
    setIsAddOpen(true);
  };

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formPhone) return;

    const newCust: Customer = {
      id: `c_${Date.now()}`,
      name: formName,
      phone: formPhone,
      email: formEmail || `${formName.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
      requirement: formRequirement,
      budget: Number(formBudget),
      location_preference: formLocation,
      status: formStatus,
      notes: formNotes
    };

    const updated = [newCust, ...customers];
    handleSaveCustomers(updated);
    logSystemAction('Create', `Customer profile registered for "${formName}"`);
    setIsOpenAddModal(false);
  };

  const openEditModal = (cust: Customer) => {
    setSelectedCustomer(cust);
    setEditName(cust.name);
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
  const [editStatus, setEditStatus] = useState<Customer['status']>('Active');
  const [editNotes, setEditNotes] = useState('');

  const [isOpenAddModal, setIsOpenAddModal] = useState(false);

  const startEdit = (cust: Customer) => {
    setEditId(cust.id);
    setEditName(cust.name);
    setEditPhone(cust.phone);
    setEditEmail(cust.email);
    setEditRequirement(cust.requirement);
    setEditBudget(cust.budget);
    setEditLoc(cust.location_preference);
    setEditStatus(cust.status);
    setEditNotes(cust.notes || '');
    setIsEditOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = customers.map(c => {
      if (c.id === editId) {
        return {
          ...c,
          name: editName,
          phone: editPhone,
          email: editEmail,
          requirement: editRequirement,
          budget: Number(editBudget),
          location_preference: editLoc,
          status: editStatus,
          notes: editNotes
        };
      }
      return c;
    });
    handleSaveCustomers(updated);
    logSystemAction('Update', `Customer profile for "${editName}" updated`);
    setIsEditOpen(false);
  };

  const startDelete = (cust: Customer) => {
    setSelectedCustomer(cust);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!selectedCustomer) return;
    const updated = customers.filter(c => c.id !== selectedCustomer.id);
    handleSaveCustomers(updated);
    logSystemAction('Delete', `Customer account unlinked for "${selectedCustomer.name}"`);
    setIsDeleteOpen(false);
  };

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                          c.phone.includes(search) || 
                          c.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100 font-sans">
            Customers CRM Registry
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Database of registered buyers with active bookings and legal contract parameters.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center space-x-1.5 bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-medium text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-sky-500/10 cursor-pointer"
        >
          <Plus size={14} />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 relative max-w-sm">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-500">
            <Search size={14} />
          </div>
          <input
            type="text"
            placeholder="Search CRM buyers directory..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-500 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-sky-500/80"
          />
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Status:</span>
          {['All', 'Active', 'VIP', 'Inactive'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-sky-500/10 border-sky-500/50 text-sky-400'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* CRM Customer List Grid */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 p-12 text-center rounded-2xl">
          <Users size={36} className="text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-400">No customers registered</p>
          <p className="text-xs text-slate-500 mt-1">Add client listings dynamically via the Add button above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredCustomers.map((cust) => (
            <div
              key={cust.id}
              className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 hover:border-sky-500/40 transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Visual Avatar Header */}
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-800/50">
                  <div className="flex items-center space-x-3">
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-sky-400 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-sky-500/10">
                      {cust.name[0]}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-200">{cust.name}</h4>
                      <span className={`text-[9px] font-bold uppercase tracking-wider ${
                        cust.status === 'VIP' ? 'text-amber-400' : 'text-slate-400'
                      }`}>
                        {cust.status} Buyer
                      </span>
                    </div>
                  </div>
                  {cust.status === 'VIP' && (
                    <div className="bg-amber-400/10 border border-amber-400/20 p-1 rounded-lg text-amber-400" title="Premium Closed Lead">
                      <Award size={14} className="animate-pulse" />
                    </div>
                  )}
                </div>

                {/* Primary Contacts */}
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center text-slate-300">
                    <Phone size={13} className="text-slate-500 mr-2 shrink-0" />
                    <span className="font-mono">{cust.phone}</span>
                  </div>
                  <div className="flex items-center text-slate-300">
                    <Mail size={13} className="text-slate-500 mr-2 shrink-0 truncate" />
                    <span className="truncate">{cust.email}</span>
                  </div>
                  <div className="border-t border-slate-800/40 pt-2.5 space-y-1 bg-slate-950/20 p-2.5 rounded-xl">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Acquisition details</p>
                    <p className="text-slate-300"><span className="text-slate-500">Unit:</span> {cust.requirement}</p>
                    <p className="text-slate-300"><span className="text-slate-500">Value:</span> <span className="font-mono text-sky-400 font-bold">₹ {(cust.budget / 100000).toFixed(2)} L</span></p>
                    <p className="text-slate-300"><span className="text-slate-500">Zone:</span> {cust.location_preference}</p>
                  </div>
                </div>

                {/* Staff commentary notes */}
                {cust.notes && (
                  <p className="text-[11px] text-slate-400 leading-relaxed italic bg-slate-950/30 p-2.5 rounded-lg border border-slate-800/30">
                    "{cust.notes}"
                  </p>
                )}
              </div>

              {/* Administrative actions */}
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800/40 mt-4">
                <button
                  onClick={() => startEdit(cust)}
                  className="p-1.5 text-slate-400 hover:text-sky-400 hover:bg-slate-800/60 rounded-lg transition-colors cursor-pointer"
                  title="Modify Account"
                >
                  <Edit2 size={13} />
                </button>
                <button
                  onClick={() => startDelete(cust)}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 rounded-lg transition-colors cursor-pointer"
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
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Full Client Name</label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Ramesh Deshmukh"
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Mobile Phone No</label>
              <input
                type="text"
                required
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="e.g. +91 9988776655"
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Primary Email</label>
              <input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="e.g. ramesh@gmail.com"
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Closed Unit / Requirement</label>
              <input
                type="text"
                value={formRequirement}
                onChange={(e) => setFormRequirement(e.target.value)}
                placeholder="e.g. Flat No 103 (2 BHK)"
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Final Sale Valuation (INR)</label>
              <input
                type="number"
                value={formBudget}
                onChange={(e) => setFormBudget(e.target.value)}
                placeholder="e.g. 5800000"
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Property Location</label>
              <input
                type="text"
                value={formLocation}
                onChange={(e) => setFormLocation(e.target.value)}
                placeholder="e.g. Hinjewadi, Pune"
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Classification Tier</label>
            <select
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-sky-500"
            >
              <option value="Active">Active Account</option>
              <option value="VIP">VIP Closed Account</option>
              <option value="Inactive">Inactive/On Hold</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Key Client Notes</label>
            <textarea
              rows={2}
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="First booking installment cleared. Legal registration expected next week..."
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-sky-500 resize-none"
            />
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
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Full Client Name</label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Mobile Phone No</label>
              <input
                type="text"
                required
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Primary Email</label>
              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Closed Unit / Requirement</label>
              <input
                type="text"
                value={editRequirement}
                onChange={(e) => setEditRequirement(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Final Sale Valuation (INR)</label>
              <input
                type="number"
                value={editBudget}
                onChange={(e) => setEditBudget(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Property Location</label>
              <input
                type="text"
                value={editLoc}
                onChange={(e) => setEditLoc(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Classification Tier</label>
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-sky-500"
            >
              <option value="Active">Active Account</option>
              <option value="VIP">VIP Closed Account</option>
              <option value="Inactive">Inactive/On Hold</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Key Client Notes</label>
            <textarea
              rows={2}
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-sky-500 resize-none"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800 font-sans">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-slate-200 px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-medium text-xs px-4 py-2 rounded-xl shadow-lg shadow-sky-500/10 cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Dialog>

      {/* DIALOG DELETE modal panel */}
      <Dialog isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Unlink Customer Profile">
        <div className="space-y-4 font-sans">
          <p className="text-sm text-slate-300">
            Are you absolutely sure you want to remove customer account for <span className="font-semibold text-slate-100">{selectedCustomer?.name}</span>?
          </p>
          <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl text-xs text-rose-400 flex items-start space-x-2">
            <ShieldAlert size={16} className="shrink-0" />
            <span>This action will disconnect the buyer's billing, logs, and property details from active dashboard viewports.</span>
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
              Delete Account
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
