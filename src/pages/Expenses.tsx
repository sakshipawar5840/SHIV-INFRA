import React, { useState, useEffect } from 'react';
import { apiClient } from '../lib/axiosClient';
import { Expense, Project } from '../types';
import { Dialog } from '../components/Dialog';
import { 
  Plus, 
  Search, 
  Receipt, 
  Trash2, 
  Filter, 
  FilterX,
  Calendar,
  DollarSign,
  Wallet,
  AlertCircle,
  FileText
} from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

export const Expenses: React.FC = () => {
  const toast = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [projectFilter, setProjectFilter] = useState('All');

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const [formProjectId, setFormProjectId] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formPaymentMethod, setFormPaymentMethod] = useState('Cash');
  const [formVendor, setFormVendor] = useState('');
  const [formRemarks, setFormRemarks] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadExpenses = async () => {
      try {
        const [expensesRes, projectsRes] = await Promise.all([
          apiClient.get('/v1/expenses'),
          apiClient.get('/v1/projects'),
        ]);
        setExpenses(expensesRes.data?.data ?? []);
        setProjects(projectsRes.data?.data ?? []);
      } catch (err) {
        console.error('Failed to load expenses from API', err);
        toast.showToast('Failed to load expenses', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadExpenses();
  }, []);

  const openAddModal = () => {
    setFormProjectId('');
    setFormTitle('');
    setFormCategory('');
    setFormAmount('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormPaymentMethod('Cash');
    setFormVendor('');
    setFormRemarks('');
    setFormErrors({});
    setEditingExpense(null);
    setIsAddOpen(true);
  };

  const openEditModal = (expense: Expense) => {
    setEditingExpense(expense);
    setFormProjectId(expense.project_id || '');
    setFormTitle(expense.expense_title || expense.title || '');
    setFormCategory(expense.expense_category || expense.category || '');
    setFormAmount(String(expense.amount));
    setFormDate(expense.expense_date || '');
    setFormPaymentMethod(expense.payment_method || expense.payment_mode || 'Cash');
    setFormVendor(expense.vendor || '');
    setFormRemarks(expense.remarks || '');
    setFormErrors({});
    setIsEditOpen(true);
  };

  const handleAddExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    
    if (!formTitle.trim()) errors.title = 'Title is required';
    if (!formAmount || Number(formAmount) <= 0) errors.amount = 'Enter a valid amount';
    if (!formDate) errors.date = 'Date is required';
    if (!formPaymentMethod) errors.paymentMethod = 'Payment method is required';
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.showToast('Please fill all required fields.', 'warning');
      return;
    }
    
    setFormErrors({});

    try {
      const payload: any = {
        project_id: formProjectId || null,
        expense_title: formTitle,
        title: formTitle,
        category: formCategory,
        expense_category: formCategory,
        amount: Number(formAmount),
        expense_date: formDate,
        payment_method: formPaymentMethod,
        payment_mode: formPaymentMethod,
        vendor: formVendor,
        remarks: formRemarks
      };

      const res = await apiClient.post('/v1/expenses', payload);
      const newExpense = res.data?.data ?? res.data;
      setExpenses(prev => [newExpense, ...prev]);
      
      setIsAddOpen(false);
      setFormProjectId('');
      setFormTitle('');
      setFormCategory('');
      setFormAmount('');
      setFormDate('');
      setFormPaymentMethod('Cash');
      setFormVendor('');
      setFormRemarks('');
      setFormErrors({});
      toast.showToast('Expense added successfully', 'success');
    } catch (err: any) {
      console.error('Failed to create expense', err);
      toast.showToast(err.response?.data?.message || 'Failed to create expense', 'error');
    }
  };

  const handleEditExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;
    
    const errors: Record<string, string> = {};
    
    if (!formTitle.trim()) errors.title = 'Title is required';
    if (!formAmount || Number(formAmount) <= 0) errors.amount = 'Enter a valid amount';
    if (!formDate) errors.date = 'Date is required';
    if (!formPaymentMethod) errors.paymentMethod = 'Payment method is required';
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.showToast('Please fill all required fields.', 'warning');
      return;
    }
    
    setFormErrors({});

    try {
      const payload: any = {
        expense_title: formTitle,
        title: formTitle,
        category: formCategory,
        expense_category: formCategory,
        amount: Number(formAmount),
        expense_date: formDate,
        payment_method: formPaymentMethod,
        payment_mode: formPaymentMethod,
        vendor: formVendor,
        remarks: formRemarks
      };

      if (formProjectId) {
        payload.project_id = formProjectId;
      }

      const res = await apiClient.put(`/v1/expenses/${editingExpense.id}`, payload);
      const updatedExpense = res.data?.data ?? res.data;
      setExpenses(prev => prev.map(e => e.id === editingExpense.id ? updatedExpense : e));
      
      setIsEditOpen(false);
      setEditingExpense(null);
      toast.showToast('Expense updated successfully', 'success');
    } catch (err: any) {
      console.error('Failed to update expense', err);
      toast.showToast(err.response?.data?.message || 'Failed to update expense', 'error');
    }
  };

  const startDelete = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedExpense) return;

    try {
      await apiClient.delete(`/v1/expenses/${selectedExpense.id}`);
      setExpenses(prev => prev.filter(e => e.id !== selectedExpense.id));
      setIsDeleteOpen(false);
      setSelectedExpense(null);
      toast.showToast('Expense deleted successfully', 'success');
    } catch (err: any) {
      console.error('Failed to delete expense', err);
      toast.showToast(err.response?.data?.message || 'Failed to delete expense', 'error');
    }
  };

  const filteredExpenses = expenses.filter(e => {
    const matchesSearch = (e.expense_title || e.title || '').toLowerCase().includes(search.toLowerCase()) ||
                          (e.vendor || '').toLowerCase().includes(search.toLowerCase()) ||
                          (e.remarks || '').toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || (e.expense_category || e.category) === categoryFilter;
    const matchesProject = projectFilter === 'All' || e.project_id === projectFilter;
    return matchesSearch && matchesCategory && matchesProject;
  });

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  return (
    <div className="space-y-6 text-text-primary">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-text-primary font-sans">
            Expense Ledger
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Track and manage project expenses and vendor payments.
          </p>
        </div>
        
        <div className="flex items-center space-x-2 shrink-0">
          <div className="bg-surface border border-border px-3 py-2 rounded-xl">
            <p className="text-[10px] text-text-secondary font-semibold uppercase">Total Expenses</p>
            <p className="text-sm font-bold text-primary font-mono">₹ {totalExpenses.toLocaleString('en-IN')}</p>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center space-x-1.5 bg-primary text-white font-medium text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-primary/10 cursor-pointer"
          >
            <Plus size={14} />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-surface border border-border p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 relative max-w-sm">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-text-secondary">
            <Search size={14} />
          </div>
          <input
            type="text"
            placeholder="Search expenses by title, vendor, or remarks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface/80 border border-border text-text-primary placeholder-text-secondary rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-primary/80"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="flex items-center space-x-2">
            <Filter size={11} className="text-text-secondary" />
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="bg-surface border border-border text-text-primary rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-primary"
            >
              <option value="All">All Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.project_name}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => { setSearch(''); setCategoryFilter('All'); setProjectFilter('All'); }}
            className="flex items-center space-x-1 bg-surface border border-border hover:bg-bg-app text-text-secondary hover:text-text-primary px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer"
          >
            <FilterX size={10} />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Main content */}
      {loading ? (
        <div className="bg-surface border border-border rounded-2xl p-12 text-center">
          <p className="text-sm font-semibold text-text-secondary">Loading expenses...</p>
        </div>
      ) : filteredExpenses.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl p-12 text-center">
          <Receipt size={36} className="text-text-secondary mx-auto mb-3" />
          <p className="text-sm font-semibold text-text-secondary">No expenses found</p>
          <p className="text-xs text-text-secondary mt-1">Try adjusting your search or add a new expense.</p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-surface/80 text-text-secondary font-mono select-none uppercase tracking-wider text-[9px] border-b border-border">
                <tr>
                  <th className="py-3 px-4 border-r border-border">Title</th>
                  <th className="py-3 px-4 border-r border-border">Category</th>
                  <th className="py-3 px-4 border-r border-border">Project</th>
                  <th className="py-3 px-4 border-r border-border text-right">Amount</th>
                  <th className="py-3 px-4 border-r border-border">Date</th>
                  <th className="py-3 px-4 border-r border-border">Payment</th>
                  <th className="py-3 px-4 border-r border-border">Vendor</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-mono text-text-secondary">
                {filteredExpenses.map((e) => {
                  const project = projects.find(p => p.id === e.project_id);
                  return (
                    <tr key={e.id} className="hover:bg-bg-app/40 transition-colors">
                      <td className="py-2.5 px-4 border-r border-border font-sans text-text-primary font-semibold">
                        {e.expense_title || e.title || 'N/A'}
                      </td>
                      <td className="py-2.5 px-4 border-r border-border">
                        <span className="px-2 py-0.5 bg-primary/5 text-primary rounded-full text-[9px] font-bold">
                          {e.expense_category || e.category || 'General'}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 border-r border-border text-text-secondary">
                        {project?.project_name || 'General'}
                      </td>
                      <td className="py-2.5 px-4 border-r border-border text-right font-bold text-primary">
                        ₹ {Number(e.amount).toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-4 border-r border-border font-mono">
                        {e.expense_date || 'N/A'}
                      </td>
                      <td className="py-2.5 px-4 border-r border-border">
                        {e.payment_method || e.payment_mode || 'N/A'}
                      </td>
                      <td className="py-2.5 px-4 border-r border-border text-text-secondary">
                        {e.vendor || 'N/A'}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => openEditModal(e)}
                            className="p-1.5 text-text-secondary hover:text-primary hover:bg-bg-app rounded-lg transition-all cursor-pointer"
                            title="Edit expense"
                          >
                            <FileText size={13} />
                          </button>
                          <button
                            onClick={() => startDelete(e)}
                            className="p-1.5 text-text-secondary hover:text-danger hover:bg-bg-app rounded-lg transition-all cursor-pointer"
                            title="Delete expense"
                          >
                            <Trash2 size={13} />
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

      {/* DIALOG Add Expense */}
      <Dialog isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Register New Expense" size="lg">
        <form onSubmit={handleAddExpenseSubmit} className="space-y-4 font-sans">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Expense Title *</label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. Cement Purchase"
                className={`w-full bg-surface border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary ${formErrors.title ? 'border-rose-500 text-danger' : 'border-border text-text-primary'}`}
              />
              {formErrors.title && <p className="text-[10px] text-danger mt-1">{formErrors.title}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Category</label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary"
              >
                <option value="">Select Category</option>
                <option value="Materials">Materials</option>
                <option value="Labor">Labor</option>
                <option value="Transport">Transport</option>
                <option value="Equipment">Equipment</option>
                <option value="Utilities">Utilities</option>
                <option value="General">General</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Amount (INR) *</label>
              <input
                type="number"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                placeholder="e.g. 25000"
                className={`w-full bg-surface border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary font-mono ${formErrors.amount ? 'border-rose-500 text-danger' : 'border-border text-text-primary'}`}
              />
              {formErrors.amount && <p className="text-[10px] text-danger mt-1">{formErrors.amount}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Date *</label>
              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className={`w-full bg-surface border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary font-mono ${formErrors.date ? 'border-rose-500 text-danger' : 'border-border text-text-primary'}`}
              />
              {formErrors.date && <p className="text-[10px] text-danger mt-1">{formErrors.date}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Payment Method *</label>
              <select
                value={formPaymentMethod}
                onChange={(e) => setFormPaymentMethod(e.target.value)}
                className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary"
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Bank">Bank Transfer</option>
                <option value="Card">Card</option>
                <option value="Cheque">Cheque</option>
                <option value="Online">Online</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Vendor</label>
              <input
                type="text"
                value={formVendor}
                onChange={(e) => setFormVendor(e.target.value)}
                placeholder="e.g. ABC Suppliers"
                className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Project</label>
              <select
                value={formProjectId}
                onChange={(e) => setFormProjectId(e.target.value)}
                className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary"
              >
                <option value="">Select Project</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.project_name}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Remarks</label>
              <textarea
                value={formRemarks}
                onChange={(e) => setFormRemarks(e.target.value)}
                placeholder="Optional notes..."
                className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary resize-none"
                rows={2}
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
              Save Expense
            </button>
          </div>
        </form>
      </Dialog>

      {/* DIALOG Edit Expense */}
      <Dialog isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Expense" size="lg">
        <form onSubmit={handleEditExpenseSubmit} className="space-y-4 font-sans">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Expense Title *</label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. Cement Purchase"
                className={`w-full bg-surface border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary ${formErrors.title ? 'border-rose-500 text-danger' : 'border-border text-text-primary'}`}
              />
              {formErrors.title && <p className="text-[10px] text-danger mt-1">{formErrors.title}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Category</label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary"
              >
                <option value="">Select Category</option>
                <option value="Materials">Materials</option>
                <option value="Labor">Labor</option>
                <option value="Transport">Transport</option>
                <option value="Equipment">Equipment</option>
                <option value="Utilities">Utilities</option>
                <option value="General">General</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Amount (INR) *</label>
              <input
                type="number"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                placeholder="e.g. 25000"
                className={`w-full bg-surface border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary font-mono ${formErrors.amount ? 'border-rose-500 text-danger' : 'border-border text-text-primary'}`}
              />
              {formErrors.amount && <p className="text-[10px] text-danger mt-1">{formErrors.amount}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Date *</label>
              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className={`w-full bg-surface border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary font-mono ${formErrors.date ? 'border-rose-500 text-danger' : 'border-border text-text-primary'}`}
              />
              {formErrors.date && <p className="text-[10px] text-danger mt-1">{formErrors.date}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Payment Method *</label>
              <select
                value={formPaymentMethod}
                onChange={(e) => setFormPaymentMethod(e.target.value)}
                className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary"
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Bank">Bank Transfer</option>
                <option value="Card">Card</option>
                <option value="Cheque">Cheque</option>
                <option value="Online">Online</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Vendor</label>
              <input
                type="text"
                value={formVendor}
                onChange={(e) => setFormVendor(e.target.value)}
                placeholder="e.g. ABC Suppliers"
                className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Project</label>
              <select
                value={formProjectId}
                onChange={(e) => setFormProjectId(e.target.value)}
                className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary"
              >
                <option value="">Select Project</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.project_name}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Remarks</label>
              <textarea
                value={formRemarks}
                onChange={(e) => setFormRemarks(e.target.value)}
                placeholder="Optional notes..."
                className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary resize-none"
                rows={2}
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
              Update Expense
            </button>
          </div>
        </form>
      </Dialog>

      {/* DIALOG Confirm Delete */}
      <Dialog isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete Expense">
        <div className="space-y-4 font-sans">
          <p className="text-sm text-text-secondary">
            Are you sure you want to delete expense <span className="font-semibold text-text-primary">{selectedExpense?.expense_title || selectedExpense?.title}</span>?
          </p>
          <div className="bg-danger/5 border border-danger/20 p-3 rounded-xl text-xs text-danger flex items-start space-x-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>This action cannot be undone. The expense record will be permanently removed.</span>
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
              Delete
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default Expenses;



