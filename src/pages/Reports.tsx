import React, { useState, useEffect } from 'react';
import { apiClient } from '../lib/axiosClient';
import { Bill, Expense, Project } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { TrendingUp, FileText, Download, DollarSign, Users2, ShieldCheck, FileSpreadsheet, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

type ReportType = 'financial-summary' | 'bills' | 'expenses' | 'project-financial';

export const Reports: React.FC = () => {
  const toast = useToast();
  const [reportType, setReportType] = useState<ReportType>('financial-summary');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [financialSummary, setFinancialSummary] = useState<any>(null);
  const [billsReport, setBillsReport] = useState<any>(null);
  const [expensesReport, setExpensesReport] = useState<any>(null);
  const [projectFinancial, setProjectFinancial] = useState<any>(null);

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('');
  const [selectedProjectForFinancial, setSelectedProjectForFinancial] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    loadReportData();
  }, [reportType, fromDate, toDate, selectedProjectId, paymentStatus, expenseCategory, selectedProjectForFinancial]);

  const loadProjects = async () => {
    try {
      const res = await apiClient.get('/v1/projects');
      setProjects(res.data?.data ?? []);
    } catch (err) {
      console.error('Failed to load projects', err);
    }
  };

  const loadReportData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (reportType === 'financial-summary') {
        const params: any = {};
        if (fromDate) params.from_date = fromDate;
        if (toDate) params.to_date = toDate;
        if (selectedProjectId) params.project_id = selectedProjectId;
        const res = await apiClient.get('/v1/reports/financial-summary', { params });
        setFinancialSummary(res.data?.data ?? null);
        setBillsReport(null);
        setExpensesReport(null);
        setProjectFinancial(null);
      } else if (reportType === 'bills') {
        const params: any = {};
        if (fromDate) params.from_date = fromDate;
        if (toDate) params.to_date = toDate;
        if (selectedProjectId) params.project_id = selectedProjectId;
        if (paymentStatus) params.payment_status = paymentStatus;
        const res = await apiClient.get('/v1/reports/bills', { params });
        setBillsReport(res.data?.data ?? null);
        setFinancialSummary(null);
        setExpensesReport(null);
        setProjectFinancial(null);
      } else if (reportType === 'expenses') {
        const params: any = {};
        if (fromDate) params.from_date = fromDate;
        if (toDate) params.to_date = toDate;
        if (selectedProjectId) params.project_id = selectedProjectId;
        if (expenseCategory) params.category = expenseCategory;
        const res = await apiClient.get('/v1/reports/expenses', { params });
        setExpensesReport(res.data?.data ?? null);
        setFinancialSummary(null);
        setBillsReport(null);
        setProjectFinancial(null);
      } else if (reportType === 'project-financial') {
        if (!selectedProjectForFinancial) {
          setProjectFinancial(null);
        } else {
          const res = await apiClient.get(`/v1/reports/project/${selectedProjectForFinancial}`);
          setProjectFinancial(res.data?.data ?? null);
        }
        setFinancialSummary(null);
        setBillsReport(null);
        setExpensesReport(null);
      }
    } catch (err: any) {
      console.error('Failed to load report data', err);
      setError(err.response?.data?.message || 'Failed to load report data');
      toast.showToast(err.response?.data?.message || 'Failed to load report data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'excel' | 'pdf' | 'csv') => {
    try {
      const backendType = reportType === 'financial-summary' ? 'FinancialSummary'
        : reportType === 'bills' ? 'Bills'
        : reportType === 'expenses' ? 'Expenses'
        : reportType === 'project-financial' ? 'ProjectFinancial'
        : reportType;
      const params: any = { type: backendType, format: format.toUpperCase() };
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;
      if (selectedProjectId) params.project_id = selectedProjectId;
      if (paymentStatus) params.payment_status = paymentStatus;
      if (expenseCategory) params.category = expenseCategory;

      const res = await apiClient.get('/v1/reports/generate', { params, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      const ext = format === 'excel' ? 'xlsx' : format === 'pdf' ? 'pdf' : 'csv';
      link.setAttribute('download', `SHIVINFRA_${reportType.toUpperCase()}_REPORT.${ext}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.showToast('Report exported successfully', 'success');
    } catch (err: any) {
      console.error('Failed to export report', err);
      toast.showToast(err.response?.data?.message || 'Failed to export report', 'error');
    }
  };

  const renderFinancialSummary = () => {
    if (!financialSummary) return null;
    const { summary, totals } = financialSummary;

    const expenseData = summary.map((s: any) => ({
      name: s.project_name.split(' ')[0],
      amount: s.total_outflow,
    }));

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-surface border border-border p-4 rounded-2xl">
            <span className="text-[10px] text-text-secondary font-bold uppercase">Total Bills</span>
            <h3 className="text-lg font-bold font-mono text-text-primary mt-1">₹ {totals.bills_total.toLocaleString('en-IN')}</h3>
            <span className="text-[9px] text-text-secondary font-mono">{totals.bill_count} bills</span>
          </div>
          <div className="bg-surface border border-border p-4 rounded-2xl">
            <span className="text-[10px] text-text-secondary font-bold uppercase">Total Expenses</span>
            <h3 className="text-lg font-bold font-mono text-text-primary mt-1">₹ {totals.expenses_total.toLocaleString('en-IN')}</h3>
            <span className="text-[9px] text-text-secondary font-mono">{totals.expense_count} expenses</span>
          </div>
          <div className="bg-surface border border-border p-4 rounded-2xl">
            <span className="text-[10px] text-text-secondary font-bold uppercase">Total Outflow</span>
            <h3 className="text-lg font-bold font-mono text-primary mt-1">₹ {totals.total_outflow.toLocaleString('en-IN')}</h3>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-widest">Project-wise Financial Summary</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-surface/80 text-text-secondary font-mono select-none uppercase tracking-wider text-[9px] border-b border-border">
                <tr>
                  <th className="py-3 px-4 border-r border-border">Project</th>
                  <th className="py-3 px-4 border-r border-border">Location</th>
                  <th className="py-3 px-4 border-r border-border text-right">Bills Total</th>
                  <th className="py-3 px-4 border-r border-border text-right">Expenses Total</th>
                  <th className="py-3 px-4 border-r border-border text-right">Total Outflow</th>
                  <th className="py-3 px-4 border-r border-border text-center">Bills Count</th>
                  <th className="py-3 px-4 text-center">Expenses Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-mono text-text-secondary">
                {summary.map((s: any) => (
                  <tr key={s.project_id} className="hover:bg-bg-app/40 transition-colors">
                    <td className="py-2.5 px-4 border-r border-border font-sans text-text-primary font-semibold">{s.project_name}</td>
                    <td className="py-2.5 px-4 border-r border-border">{s.location || 'N/A'}</td>
                    <td className="py-2.5 px-4 border-r border-border text-right">₹ {s.bills_total.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-4 border-r border-border text-right">₹ {s.expenses_total.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-4 border-r border-border text-right font-bold text-primary">₹ {s.total_outflow.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-4 border-r border-border text-center">{s.bill_count}</td>
                    <td className="py-2.5 px-4 text-center">{s.expense_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-surface border border-border p-5 rounded-2xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-widest">Total Outflow by Project</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={expenseData}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }} labelStyle={{ color: '#94a3b8', fontSize: '10px', fontWeight: 'bold' }} />
                <Bar dataKey="amount" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  const renderBillsReport = () => {
    if (!billsReport) return null;
    const { bills, totals } = billsReport;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-surface border border-border p-4 rounded-2xl">
            <span className="text-[10px] text-text-secondary font-bold uppercase">Total Bills</span>
            <h3 className="text-lg font-bold font-mono text-text-primary mt-1">{totals.count}</h3>
          </div>
          <div className="bg-surface border border-border p-4 rounded-2xl">
            <span className="text-[10px] text-text-secondary font-bold uppercase">Total Amount</span>
            <h3 className="text-lg font-bold font-mono text-text-primary mt-1">₹ {totals.total_amount.toLocaleString('en-IN')}</h3>
          </div>
          <div className="bg-surface border border-border p-4 rounded-2xl">
            <span className="text-[10px] text-text-secondary font-bold uppercase">Paid</span>
            <h3 className="text-lg font-bold font-mono text-success mt-1">₹ {totals.paid_amount.toLocaleString('en-IN')}</h3>
          </div>
          <div className="bg-surface border border-border p-4 rounded-2xl">
            <span className="text-[10px] text-text-secondary font-bold uppercase">Pending</span>
            <h3 className="text-lg font-bold font-mono text-warning mt-1">₹ {totals.pending_amount.toLocaleString('en-IN')}</h3>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-widest">Procurement Bills Report</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-surface/80 text-text-secondary font-mono select-none uppercase tracking-wider text-[9px] border-b border-border">
                <tr>
                  <th className="py-3 px-4 border-r border-border">Bill Number</th>
                  <th className="py-3 px-4 border-r border-border">Date</th>
                  <th className="py-3 px-4 border-r border-border">Project</th>
                  <th className="py-3 px-4 border-r border-border">Vendor</th>
                  <th className="py-3 px-4 border-r border-border">Material</th>
                  <th className="py-3 px-4 border-r border-border">Qty</th>
                  <th className="py-3 px-4 border-r border-border">Unit</th>
                  <th className="py-3 px-4 border-r border-border text-right">GST</th>
                  <th className="py-3 px-4 border-r border-border text-right">Amount</th>
                  <th className="py-3 px-4 border-r border-border text-center">Status</th>
                  <th className="py-3 px-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-mono text-text-secondary">
                {bills.map((b: Bill) => {
                  const proj = projects.find(p => p.id === b.project_id);
                  return (
                    <tr key={b.id} className="hover:bg-bg-app/40 transition-colors">
                      <td className="py-2.5 px-4 border-r border-border font-bold text-text-secondary">{b.bill_number || 'N/A'}</td>
                      <td className="py-2.5 px-4 border-r border-border">{b.bill_date || 'N/A'}</td>
                      <td className="py-2.5 px-4 border-r border-border">{proj?.project_name || 'General'}</td>
                      <td className="py-2.5 px-4 border-r border-border font-sans text-text-primary font-semibold">{b.vendor_name}</td>
                      <td className="py-2.5 px-4 border-r border-border font-sans">{b.material_name}</td>
                      <td className="py-2.5 px-4 border-r border-border">{b.quantity || '-'}</td>
                      <td className="py-2.5 px-4 border-r border-border">{b.unit || '-'}</td>
                      <td className="py-2.5 px-4 border-r border-border text-right">₹ {Number(b.gst_amount || 0).toLocaleString('en-IN')}</td>
                      <td className="py-2.5 px-4 border-r border-border text-right font-bold text-primary">₹ {b.amount.toLocaleString('en-IN')}</td>
                      <td className="py-2.5 px-4 border-r border-border text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${b.payment_status === 'Paid' ? 'bg-success/10 text-success' : b.payment_status === 'Cancelled' ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'}`}>
                          {b.payment_status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">{b.remarks || '-'}</td>
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

  const renderExpensesReport = () => {
    if (!expensesReport) return null;
    const { expenses, totals, by_category } = expensesReport;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-surface border border-border p-4 rounded-2xl">
            <span className="text-[10px] text-text-secondary font-bold uppercase">Total Expenses</span>
            <h3 className="text-lg font-bold font-mono text-text-primary mt-1">₹ {totals.total_amount.toLocaleString('en-IN')}</h3>
            <span className="text-[9px] text-text-secondary font-mono">{totals.count} records</span>
          </div>
          <div className="bg-surface border border-border p-4 rounded-2xl">
            <span className="text-[10px] text-text-secondary font-bold uppercase">Category-wise Breakdown</span>
            <div className="mt-2 space-y-1">
              {Object.entries(by_category).map(([cat, amt]: [string, any]) => (
                <div key={cat} className="flex justify-between text-xs font-mono">
                  <span className="text-text-secondary">{cat}</span>
                  <span className="text-text-primary font-bold">₹ {Number(amt).toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-widest">Expenses Report</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-surface/80 text-text-secondary font-mono select-none uppercase tracking-wider text-[9px] border-b border-border">
                <tr>
                  <th className="py-3 px-4 border-r border-border">Title</th>
                  <th className="py-3 px-4 border-r border-border">Category</th>
                  <th className="py-3 px-4 border-r border-border">Project</th>
                  <th className="py-3 px-4 border-r border-border">Vendor</th>
                  <th className="py-3 px-4 border-r border-border text-right">Amount</th>
                  <th className="py-3 px-4 border-r border-border">Date</th>
                  <th className="py-3 px-4 border-r border-border">Payment</th>
                  <th className="py-3 px-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-mono text-text-secondary">
                {expenses.map((e: Expense) => {
                  const proj = projects.find(p => p.id === e.project_id);
                  return (
                    <tr key={e.id} className="hover:bg-bg-app/40 transition-colors">
                      <td className="py-2.5 px-4 border-r border-border font-sans text-text-primary font-semibold">{e.expense_title || e.title || 'N/A'}</td>
                      <td className="py-2.5 px-4 border-r border-border">{e.expense_category || e.category || 'General'}</td>
                      <td className="py-2.5 px-4 border-r border-border">{proj?.project_name || 'General'}</td>
                      <td className="py-2.5 px-4 border-r border-border">{e.vendor || '-'}</td>
                      <td className="py-2.5 px-4 border-r border-border text-right font-bold text-primary">₹ {Number(e.amount).toLocaleString('en-IN')}</td>
                      <td className="py-2.5 px-4 border-r border-border">{e.expense_date || 'N/A'}</td>
                      <td className="py-2.5 px-4 border-r border-border">{e.payment_method || e.payment_mode || 'N/A'}</td>
                      <td className="py-2.5 px-4">{e.remarks || '-'}</td>
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

  const renderProjectFinancial = () => {
    if (!projectFinancial) return <div className="text-sm text-text-secondary text-center py-12">Select a project to view financial details.</div>;
    const { project, bills, expenses, bills_total, expenses_total, combined_total } = projectFinancial;

    return (
      <div className="space-y-6">
        <div className="bg-surface border border-border p-5 rounded-2xl">
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-widest mb-4">Project Financial Detail</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="text-[10px] text-text-secondary font-bold uppercase">Project</span>
              <p className="text-sm font-bold text-text-primary">{project?.project_name}</p>
            </div>
            <div>
              <span className="text-[10px] text-text-secondary font-bold uppercase">Location</span>
              <p className="text-sm font-bold text-text-primary">{project?.location || 'N/A'}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-surface border border-border p-4 rounded-2xl">
            <span className="text-[10px] text-text-secondary font-bold uppercase">Bills Total</span>
            <h3 className="text-lg font-bold font-mono text-text-primary mt-1">₹ {bills_total.toLocaleString('en-IN')}</h3>
            <span className="text-[9px] text-text-secondary font-mono">{bills.length} bills</span>
          </div>
          <div className="bg-surface border border-border p-4 rounded-2xl">
            <span className="text-[10px] text-text-secondary font-bold uppercase">Expenses Total</span>
            <h3 className="text-lg font-bold font-mono text-text-primary mt-1">₹ {expenses_total.toLocaleString('en-IN')}</h3>
            <span className="text-[9px] text-text-secondary font-mono">{expenses.length} expenses</span>
          </div>
          <div className="bg-surface border border-border p-4 rounded-2xl">
            <span className="text-[10px] text-text-secondary font-bold uppercase">Combined Total</span>
            <h3 className="text-lg font-bold font-mono text-primary mt-1">₹ {combined_total.toLocaleString('en-IN')}</h3>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-widest">Bills</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-surface/80 text-text-secondary font-mono select-none uppercase tracking-wider text-[9px] border-b border-border">
                <tr>
                  <th className="py-3 px-4 border-r border-border">Bill Number</th>
                  <th className="py-3 px-4 border-r border-border">Date</th>
                  <th className="py-3 px-4 border-r border-border">Vendor</th>
                  <th className="py-3 px-4 border-r border-border">Material</th>
                  <th className="py-3 px-4 border-r border-border text-right">Amount</th>
                  <th className="py-3 px-4 border-r border-border text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-mono text-text-secondary">
                {bills.map((b: Bill) => (
                  <tr key={b.id} className="hover:bg-bg-app/40 transition-colors">
                    <td className="py-2.5 px-4 border-r border-border font-bold text-text-secondary">{b.bill_number || 'N/A'}</td>
                    <td className="py-2.5 px-4 border-r border-border">{b.bill_date || 'N/A'}</td>
                    <td className="py-2.5 px-4 border-r border-border font-sans text-text-primary font-semibold">{b.vendor_name}</td>
                    <td className="py-2.5 px-4 border-r border-border font-sans">{b.material_name}</td>
                    <td className="py-2.5 px-4 border-r border-border text-right font-bold text-primary">₹ {b.amount.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-4 border-r border-border text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${b.payment_status === 'Paid' ? 'bg-success/10 text-success' : b.payment_status === 'Cancelled' ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'}`}>
                        {b.payment_status}
                      </span>
                    </td>
                  </tr>
                ))}
                {bills.length === 0 && (
                  <tr><td colSpan={6} className="py-6 text-center text-text-secondary">No bills found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-widest">Expenses</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-surface/80 text-text-secondary font-mono select-none uppercase tracking-wider text-[9px] border-b border-border">
                <tr>
                  <th className="py-3 px-4 border-r border-border">Title</th>
                  <th className="py-3 px-4 border-r border-border">Category</th>
                  <th className="py-3 px-4 border-r border-border">Vendor</th>
                  <th className="py-3 px-4 border-r border-border text-right">Amount</th>
                  <th className="py-3 px-4 border-r border-border">Date</th>
                  <th className="py-3 px-4">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-mono text-text-secondary">
                {expenses.map((e: Expense) => (
                  <tr key={e.id} className="hover:bg-bg-app/40 transition-colors">
                    <td className="py-2.5 px-4 border-r border-border font-sans text-text-primary font-semibold">{e.expense_title || e.title || 'N/A'}</td>
                    <td className="py-2.5 px-4 border-r border-border">{e.expense_category || e.category || 'General'}</td>
                    <td className="py-2.5 px-4 border-r border-border">{e.vendor || '-'}</td>
                    <td className="py-2.5 px-4 border-r border-border text-right font-bold text-primary">₹ {Number(e.amount).toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-4 border-r border-border">{e.expense_date || 'N/A'}</td>
                    <td className="py-2.5 px-4 border-r border-border">{e.payment_method || e.payment_mode || 'N/A'}</td>
                  </tr>
                ))}
                {expenses.length === 0 && (
                  <tr><td colSpan={6} className="py-6 text-center text-text-secondary">No expenses found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 text-text-primary font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-text-primary">Reports & Analytics</h2>
          <p className="text-xs text-text-secondary mt-0.5">Real-time financial and procurement reports from live database.</p>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={() => handleExport('excel')} className="flex items-center space-x-1.5 bg-surface border border-border hover:bg-bg-app text-text-secondary hover:text-text-primary font-semibold text-xs px-3.5 py-2.5 rounded-xl transition-all cursor-pointer">
            <FileSpreadsheet size={13} />
            <span>Export Excel</span>
          </button>
          <button onClick={() => handleExport('pdf')} className="flex items-center space-x-1.5 bg-primary text-white font-medium text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-primary/10 cursor-pointer">
            <FileText size={13} />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      <div className="bg-surface border border-border p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as ReportType)}
            className="bg-surface border border-border text-text-primary rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-primary"
          >
            <option value="financial-summary">Financial Summary</option>
            <option value="bills">Bills Report</option>
            <option value="expenses">Expenses Report</option>
            <option value="project-financial">Project Financial</option>
          </select>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="bg-surface border border-border text-text-primary rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-primary font-mono"
            placeholder="From date"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="bg-surface border border-border text-text-primary rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-primary font-mono"
            placeholder="To date"
          />
          {reportType !== 'project-financial' && (
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-surface border border-border text-text-primary rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-primary"
            >
              <option value="">All Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.project_name}</option>
              ))}
            </select>
          )}
          {reportType === 'bills' && (
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="bg-surface border border-border text-text-primary rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-primary"
            >
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Paid">Paid</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          )}
          {reportType === 'expenses' && (
            <input
              type="text"
              value={expenseCategory}
              onChange={(e) => setExpenseCategory(e.target.value)}
              placeholder="Category filter"
              className="bg-surface border border-border text-text-primary rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-primary"
            />
          )}
          {reportType === 'project-financial' && (
            <select
              value={selectedProjectForFinancial}
              onChange={(e) => setSelectedProjectForFinancial(e.target.value)}
              className="bg-surface border border-border text-text-primary rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-primary"
            >
              <option value="">Select Project</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.project_name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {loading ? (
        <div className="bg-surface border border-border rounded-2xl p-12 text-center">
          <Loader2 className="text-primary animate-spin mx-auto mb-3" size={28} />
          <p className="text-sm font-semibold text-text-secondary">Loading report data...</p>
        </div>
      ) : error ? (
        <div className="bg-danger/5 border border-danger/20 rounded-2xl p-6 text-center">
          <AlertCircle className="text-danger mx-auto mb-2" size={24} />
          <p className="text-sm font-semibold text-danger">{error}</p>
        </div>
      ) : reportType === 'financial-summary' && !financialSummary?.summary?.length ? (
        <div className="bg-surface border border-border rounded-2xl p-12 text-center">
          <p className="text-sm font-semibold text-text-secondary">No financial summary data found for the selected filters.</p>
        </div>
      ) : reportType === 'bills' && !billsReport?.bills?.length ? (
        <div className="bg-surface border border-border rounded-2xl p-12 text-center">
          <p className="text-sm font-semibold text-text-secondary">No bills found for the selected filters.</p>
        </div>
      ) : reportType === 'expenses' && !expensesReport?.expenses?.length ? (
        <div className="bg-surface border border-border rounded-2xl p-12 text-center">
          <p className="text-sm font-semibold text-text-secondary">No expenses found for the selected filters.</p>
        </div>
      ) : (
        <>
          {reportType === 'financial-summary' && renderFinancialSummary()}
          {reportType === 'bills' && renderBillsReport()}
          {reportType === 'expenses' && renderExpensesReport()}
          {reportType === 'project-financial' && renderProjectFinancial()}
        </>
      )}
    </div>
  );
};

export default Reports;