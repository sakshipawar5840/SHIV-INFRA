import React, { useState, useEffect } from 'react';
import { getStoredData, INITIAL_BILLS, INITIAL_LEADS, INITIAL_PROJECTS } from '../lib/mockData';
import { Bill, Lead, Project } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { TrendingUp, FileText, Download, DollarSign, Users2, ShieldCheck, FileSpreadsheet } from 'lucide-react';
import { logSystemAction } from '../lib/mockData';

export const Reports: React.FC = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    setBills(getStoredData<Bill[]>('bills', INITIAL_BILLS));
    setLeads(getStoredData<Lead[]>('leads', INITIAL_LEADS));
    setProjects(getStoredData<Project[]>('projects', INITIAL_PROJECTS));
  }, []);

  // Compute stats
  const totalSpend = bills.reduce((sum, b) => sum + b.amount, 0);
  const hotLeadsCount = leads.filter(l => l.status === 'Contacted' || l.status === 'Proposal Sent').length;
  
  // Group bill expenses by project for charts
  const expenseData = projects.map(proj => {
    const projBillsSum = bills.filter(b => b.project_id === proj.id).reduce((sum, b) => sum + b.amount, 0);
    return {
      name: proj.name.split(' ')[0],
      amount: projBillsSum
    };
  });

  // Leads distribution by status
  const leadStatuses = ['New', 'Contacted', 'Proposal Sent', 'Converted', 'Lost'];
  const colors = ['#38bdf8', '#818cf8', '#fbbf24', '#34d399', '#f87171'];

  const leadDistribution = leadStatuses.map(status => ({
    name: status,
    value: leads.filter(l => l.status === status).length
  }));

  const triggerPDFDownload = () => {
    logSystemAction('Access', 'Exported full consolidated quarterly financial audit report PDF');
    alert('Consolidated executive quarterly financial report downloading initiated.');
  };

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Executive Intelligence & Analytics</h2>
          <p className="text-xs text-slate-400 mt-0.5">Real-time consolidated balance sheet charts, lead conversion metrics, and procurement audit charts.</p>
        </div>
        
        {/* PDF audit print button */}
        <button
          onClick={triggerPDFDownload}
          className="flex items-center space-x-1.5 bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-medium text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-sky-500/10 cursor-pointer hover:scale-105 transition-all"
        >
          <FileText size={13} />
          <span>Export Analytics Audit</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase">Quarterly Procurement Volume</span>
            <h3 className="text-lg font-bold font-mono text-slate-200 mt-1">₹ {totalSpend.toLocaleString('en-IN')}</h3>
            <span className="text-[9px] text-emerald-400 flex items-center mt-1 font-mono">
              <TrendingUp size={10} className="mr-1" /> +12.4% vs last quarter
            </span>
          </div>
          <DollarSign size={20} className="text-emerald-400 bg-emerald-500/10 p-1.5 rounded-xl h-8 w-8" />
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase">CRM Active Pipeline Prospecting</span>
            <h3 className="text-lg font-bold font-mono text-slate-200 mt-1">{leads.length} Hot Leads</h3>
            <span className="text-[9px] text-sky-400 flex items-center mt-1 font-mono">
              {hotLeadsCount} active negotiations
            </span>
          </div>
          <Users2 size={20} className="text-sky-400 bg-sky-500/10 p-1.5 rounded-xl h-8 w-8" />
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase">Compliance Audit Grade</span>
            <h3 className="text-lg font-bold font-mono text-emerald-400 mt-1">Grade A+ (Verified)</h3>
            <span className="text-[9px] text-emerald-400 flex items-center mt-1 font-mono">
              All properties RERA accredited
            </span>
          </div>
          <ShieldCheck size={20} className="text-indigo-400 bg-indigo-500/10 p-1.5 rounded-xl h-8 w-8" />
        </div>
      </div>

      {/* Recharts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project expenses */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest">Expenses Breakdown by Construction Site</h3>
            <span className="text-[9px] text-emerald-400 bg-emerald-500/5 px-2.5 py-0.5 rounded border border-emerald-500/10 font-bold">INR</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={expenseData}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                  labelStyle={{ color: '#94a3b8', fontSize: '10px', fontWeight: 'bold' }}
                />
                <Bar dataKey="amount" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead stage distributions */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest">Leads Pipeline Stage Allocations</h3>
            <span className="text-[9px] text-sky-400 bg-sky-500/5 px-2.5 py-0.5 rounded border border-sky-500/10 font-bold">CRM count</span>
          </div>

          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={leadDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {leadDistribution.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={colors[idx % colors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                  labelStyle={{ fontSize: '10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Color Indicators Grid */}
          <div className="grid grid-cols-5 gap-2 pt-3 border-t border-slate-850/60 text-[9px] font-mono text-center">
            {leadDistribution.map((item, idx) => (
              <div key={item.name} className="space-y-1">
                <span className="block h-1 w-full rounded-full" style={{ backgroundColor: colors[idx] }} />
                <p className="text-slate-500 truncate font-semibold">{item.name}</p>
                <p className="text-slate-200 font-bold">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default Reports;
