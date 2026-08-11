import React, { useState, useEffect } from 'react';
import { getStoredData, saveStoredData, logSystemAction, INITIAL_LEADS } from '../lib/mockData';
import { Lead } from '../types';
import { Dialog } from '../components/Dialog';
import { Plus, Search, HelpCircle, Phone, MessageSquare, PlusCircle, Trash2, Calendar, Clipboard, Filter, FilterX, Clock } from 'lucide-react';

const COLUMNS: ('New' | 'Contacted' | 'Interested' | 'Site Visit' | 'Negotiation' | 'Booked' | 'Rejected')[] = [
  'New',
  'Contacted',
  'Interested',
  'Site Visit',
  'Negotiation',
  'Booked',
  'Rejected'
];

export const Leads: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  
  // Modals state
  const [isDetailsOpen, setIsEditOpen] = useState(false);
  const [isAddFullOpen, setIsAddFullOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Quick Inline Add fields (keyed by column id)
  const [inlineNames, setInlineNames] = useState<Record<string, string>>({});
  const [inlinePhones, setInlinePhones] = useState<Record<string, string>>({});

  // Full form fields
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRequirement, setFormRequirement] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formBudget, setFormBudget] = useState('');
  const [formStatus, setFormStatus] = useState<Lead['status']>('New');
  const [formSource, setFormSource] = useState('Facebook Ads');
  const [formAssigned, setFormAssigned] = useState('Vijay Shinde');
  const [formNotes, setFormNotes] = useState('');

  // Log timeline entry field inside lead details
  const [newLogText, setNewLogText] = useState('');

  useEffect(() => {
    setLeads(getStoredData<Lead[]>('leads', INITIAL_LEADS));
  }, []);

  const handleSaveLeads = (data: Lead[]) => {
    setLeads(data);
    saveStoredData('leads', data);
  };

  // Drag & Drop
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStatus: Lead['status']) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    const updated = leads.map(l => {
      if (l.id === id && l.status !== targetStatus) {
        logSystemAction('Update', `Lead "${l.name}" shifted stage from ${l.status} to ${targetStatus}`);
        return { 
          ...l, 
          status: targetStatus,
          timelineLogs: [
            ...(l.timelineLogs || []),
            { timestamp: new Date().toLocaleString(), text: `Stage changed to ${targetStatus}`, author: 'System' }
          ]
        };
      }
      return l;
    });
    handleSaveLeads(updated);
  };

  // Quick inline add handler
  const handleQuickAdd = (column: Lead['status']) => {
    const name = inlineNames[column]?.trim();
    const phone = inlinePhones[column]?.trim();
    if (!name || !phone) return;

    const newLead: Lead = {
      id: `l_${Date.now()}`,
      name,
      phone,
      requirement: '2 BHK Flat',
      location: 'Pune',
      budget: 6000000,
      status: column,
      source: 'Direct Walk-in',
      assigned_to: 'Vijay Shinde',
      notes: 'Quick added from pipeline.',
      timelineLogs: [{ timestamp: new Date().toLocaleString(), text: 'Lead quick added in pipeline.', author: 'System' }]
    };

    const updated = [newLead, ...leads];
    handleSaveLeads(updated);
    logSystemAction('Create', `Lead "${name}" quick registered under ${column} column`);
    
    // Clear inline fields
    setInlineNames(prev => ({ ...prev, [column]: '' }));
    setInlinePhones(prev => ({ ...prev, [column]: '' }));
  };

  // Full manual lead creation
  const handleFullAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formPhone) return;

    const newLead: Lead = {
      id: `l_${Date.now()}`,
      name: formName,
      phone: formPhone,
      email: formEmail,
      requirement: formRequirement || '2 BHK Flat',
      location: formLocation || 'Baner, Pune',
      budget: Number(formBudget) || 5000000,
      status: formStatus,
      source: formSource,
      assigned_to: formAssigned,
      notes: formNotes,
      timelineLogs: [{ timestamp: new Date().toLocaleString(), text: 'Lead manually captured in CRM registry.', author: 'Admin' }]
    };

    const updated = [newLead, ...leads];
    handleSaveLeads(updated);
    logSystemAction('Create', `Lead "${formName}" added with requirement "${formRequirement}"`);
    setIsAddFullOpen(false);
  };

  // Append logs/timeline details inside specific lead profile
  const handleAddTimelineLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !newLogText.trim()) return;

    const newLogItem = {
      timestamp: new Date().toLocaleString(),
      text: newLogText,
      author: 'Admin User'
    };

    const updated = leads.map(l => {
      if (l.id === selectedLead.id) {
        const logs = l.timelineLogs || [];
        const updatedLogs = [...logs, newLogItem];
        const updatedLead = { ...l, timelineLogs: updatedLogs };
        setSelectedLead(updatedLead); // Update selected state immediately
        return updatedLead;
      }
      return l;
    });

    handleSaveLeads(updated);
    setNewLogText('');
    logSystemAction('Update', `Activity log added for lead ${selectedLead.name}`);
  };

  const handleDeleteLead = (id: string) => {
    const updated = leads.filter(l => l.id !== id);
    handleSaveLeads(updated);
    logSystemAction('Delete', `Lead deleted from CRM`);
    setIsEditOpen(false);
  };

  const openFullAddModal = () => {
    setFormName('');
    setFormPhone('');
    setFormEmail('');
    setFormRequirement('2 BHK Flat');
    setFormLocation('Baner, Pune');
    setFormBudget('6000000');
    setFormStatus('New');
    setFormSource('Direct Walk-in');
    setFormAssigned('Vijay Shinde');
    setFormNotes('');
    setIsAddFullOpen(true);
  };

  // Filters & Formatting
  const formatINR = (val: number) => {
    if (val >= 10000000) {
      return `₹ ${(val / 10000000).toFixed(2)} Cr`;
    } else if (val >= 100000) {
      return `₹ ${(val / 100000).toFixed(2)} L`;
    }
    return `₹ ${val.toLocaleString('en-IN')}`;
  };

  const filteredLeads = leads.filter(l => {
    const matchesSearch = l.name.toLowerCase().includes(search.toLowerCase()) || 
                          l.phone.includes(search) || 
                          l.requirement.toLowerCase().includes(search.toLowerCase());
    const matchesSource = sourceFilter === 'All' || l.source === sourceFilter;
    return matchesSearch && matchesSource;
  });

  return (
    <div className="space-y-6 text-slate-100">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100 font-sans">
            CRM Leads Pipeline
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Visualize client conversions, drag card states, and log communication notes chronological logs.
          </p>
        </div>
        <button
          onClick={openFullAddModal}
          className="flex items-center space-x-1.5 bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-medium text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-sky-500/10 cursor-pointer"
        >
          <Plus size={14} />
          <span>Add CRM Lead</span>
        </button>
      </div>

      {/* Advanced filters */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="flex-1 relative max-w-sm">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-500">
            <Search size={14} />
          </div>
          <input
            type="text"
            placeholder="Search prospect name, phone, demand..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-500 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-sky-500/80"
          />
        </div>

        {/* Source Filters */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center">
            <Filter size={11} className="mr-1" /> Channels:
          </span>
          {['All', 'Facebook Ads', 'Google Search', 'Direct Walk-in', 'Instagram Promo'].map((src) => (
            <button
              key={src}
              onClick={() => setSourceFilter(src)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer border ${
                sourceFilter === src
                  ? 'bg-sky-500/10 border-sky-500/50 text-sky-400'
                  : 'bg-slate-950 border-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              {src}
            </button>
          ))}
        </div>
      </div>

      {/* Kanban Board Row */}
      <div className="flex space-x-4 overflow-x-auto pb-4 custom-scrollbar items-start">
        {COLUMNS.map((column) => {
          const colLeads = filteredLeads.filter(l => l.status === column);
          const colSumBudget = colLeads.reduce((acc, curr) => acc + (curr.budget || 0), 0);

          return (
            <div
              key={column}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column)}
              className="w-72 bg-slate-950/60 border border-slate-900 rounded-2xl p-4 shrink-0 flex flex-col space-y-3 min-h-[30rem] hover:border-slate-800 transition-colors"
            >
              {/* Column Header */}
              <div className="flex justify-between items-center border-b border-slate-800/60 pb-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-100 flex items-center">
                    <span className={`h-1.5 w-1.5 rounded-full mr-2 ${
                      column === 'Booked' ? 'bg-emerald-400 animate-pulse' :
                      column === 'Rejected' ? 'bg-rose-500' : 'bg-sky-400'
                    }`}></span>
                    {column}
                  </h4>
                  <p className="text-[9px] text-slate-500 font-mono mt-0.5 font-bold uppercase">
                    Worth: {formatINR(colSumBudget)}
                  </p>
                </div>
                <span className="text-[10px] font-bold bg-slate-900 text-slate-400 px-2 py-0.5 rounded-full">
                  {colLeads.length}
                </span>
              </div>

              {/* Cards List Stack */}
              <div className="flex-1 space-y-3 overflow-y-auto max-h-[22rem] pr-1 custom-scrollbar">
                {colLeads.map((item) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item.id)}
                    onClick={() => {
                      setSelectedLead(item);
                      setIsEditOpen(true);
                    }}
                    className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl hover:border-sky-500/40 transition-all cursor-pointer group active:scale-95 duration-200 select-none"
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-[9px] font-semibold text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded font-mono">
                        {item.source}
                      </span>
                      <span className="text-[10px] font-bold text-sky-400 font-mono">
                        {formatINR(item.budget)}
                      </span>
                    </div>

                    <h5 className="text-xs font-bold text-slate-200 group-hover:text-sky-300 transition-colors mt-2">{item.name}</h5>
                    <p className="text-[10px] text-slate-400 mt-1 truncate">{item.requirement} • {item.location}</p>
                    
                    <div className="flex items-center justify-between text-[9px] text-slate-500 border-t border-slate-800/40 mt-3 pt-2">
                      <span className="flex items-center"><Clock size={9} className="mr-1" /> {item.assigned_to || 'Assigned'}</span>
                      <span className="font-mono">{item.phone}</span>
                    </div>
                  </div>
                ))}

                {colLeads.length === 0 && (
                  <div className="border border-dashed border-slate-800 rounded-xl p-6 text-center text-[10px] text-slate-600">
                    No leads at this stage
                  </div>
                )}
              </div>

              {/* Quick Inline Creator */}
              <div className="border-t border-slate-800/40 pt-2 bg-slate-950/25 space-y-1.5">
                <input
                  type="text"
                  placeholder="Lead Name"
                  value={inlineNames[column] || ''}
                  onChange={(e) => setInlineNames(prev => ({ ...prev, [column]: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-850 rounded-lg px-2.5 py-1 text-[11px] placeholder-slate-600 text-slate-200 focus:outline-none"
                />
                <div className="flex space-x-1.5">
                  <input
                    type="text"
                    placeholder="Phone No"
                    value={inlinePhones[column] || ''}
                    onChange={(e) => setInlinePhones(prev => ({ ...prev, [column]: e.target.value }))}
                    className="flex-1 bg-slate-900 border border-slate-850 rounded-lg px-2.5 py-1 text-[11px] placeholder-slate-600 text-slate-200 focus:outline-none"
                  />
                  <button
                    onClick={() => handleQuickAdd(column)}
                    className="bg-sky-600 hover:bg-sky-700 text-white rounded-lg p-1 transition-colors shrink-0 flex items-center justify-center cursor-pointer"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* DIALOG CRM Lead Details Hub */}
      <Dialog isOpen={isDetailsOpen} onClose={() => setIsEditOpen(false)} title="CRM Lead Details Hub" size="lg">
        {selectedLead && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Details Grid */}
            <div className="md:col-span-1 space-y-4">
              <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl space-y-3.5">
                <div className="text-center pb-2 border-b border-slate-800">
                  <div className="h-10 w-10 bg-sky-500/10 text-sky-400 rounded-full flex items-center justify-center text-md font-bold mx-auto">
                    {selectedLead.name[0]}
                  </div>
                  <h4 className="text-sm font-bold text-slate-200 mt-2">{selectedLead.name}</h4>
                  <span className="text-[9px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase mt-1 inline-block">
                    {selectedLead.status}
                  </span>
                </div>

                {/* Primary properties */}
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold uppercase">Primary Demand</span>
                    <p className="text-slate-300 font-medium">{selectedLead.requirement}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold uppercase">Max Budget Limit</span>
                    <p className="text-sky-400 font-mono font-bold">{formatINR(selectedLead.budget)}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold uppercase">Preferred Location</span>
                    <p className="text-slate-300 font-medium">{selectedLead.location}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold uppercase">Lead Source Code</span>
                    <p className="text-slate-300 font-medium">{selectedLead.source}</p>
                  </div>
                </div>

                {/* Immediate click communication APIs */}
                <div className="flex space-x-2 pt-2 border-t border-slate-800">
                  <a
                    href={`tel:${selectedLead.phone}`}
                    className="flex-1 flex items-center justify-center space-x-1 bg-slate-900 border border-slate-800 text-slate-300 py-1.5 rounded-lg text-[10px] font-semibold hover:bg-slate-850"
                  >
                    <Phone size={10} className="text-sky-400" />
                    <span>Direct Call</span>
                  </a>
                  <a
                    href={`https://api.whatsapp.com/send?phone=${selectedLead.phone}&text=Hello%20${selectedLead.name},%20Greetings%20from%20SHIV%20INFRA.%20We%20wanted%20to%20follow%20up%20on%20your%2520requirement.`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 flex items-center justify-center space-x-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 py-1.5 rounded-lg text-[10px] font-semibold hover:bg-emerald-500/20"
                  >
                    <MessageSquare size={10} />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>

              {/* Danger triggers */}
              <button
                onClick={() => handleDeleteLead(selectedLead.id)}
                className="w-full bg-rose-600/10 border border-rose-600/20 text-rose-400 text-xs py-2 rounded-xl flex items-center justify-center space-x-1 hover:bg-rose-600/20 transition-all cursor-pointer"
              >
                <Trash2 size={12} />
                <span>Delete Prospect Record</span>
              </button>
            </div>

            {/* Right Audit/Timeline panel */}
            <div className="md:col-span-2 space-y-4 flex flex-col justify-between">
              {/* Interaction list */}
              <div className="space-y-3.5 bg-slate-950 p-4 rounded-xl border border-slate-800 max-h-[16rem] overflow-y-auto custom-scrollbar">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center">
                  <Clock size={11} className="mr-1 text-sky-400" /> Interaction Timeline Logs
                </span>
                <div className="space-y-3">
                  {(selectedLead.timelineLogs || []).map((log, idx) => (
                    <div key={idx} className="border-l border-slate-800 pl-3 space-y-0.5 text-xs relative">
                      <span className="absolute -left-1 top-1.5 h-2 w-2 rounded-full bg-sky-500"></span>
                      <p className="text-slate-300 font-sans leading-relaxed">{log.text}</p>
                      <p className="text-[9px] text-slate-500 font-mono font-bold">[{log.timestamp}] • {log.author}</p>
                    </div>
                  ))}
                  {(selectedLead.timelineLogs || []).length === 0 && (
                    <p className="text-xs text-center text-slate-600 py-4">No followups logged yet.</p>
                  )}
                </div>
              </div>

              {/* Form append notes */}
              <form onSubmit={handleAddTimelineLog} className="space-y-2 border-t border-slate-800 pt-3">
                <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Log New Interaction/Call notes</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    required
                    placeholder="Type client response, home budget criteria or schedule details..."
                    value={newLogText}
                    onChange={(e) => setNewLogText(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-sky-500"
                  />
                  <button
                    type="submit"
                    className="bg-sky-600 hover:bg-sky-700 text-white rounded-xl px-4 text-xs font-semibold shrink-0 cursor-pointer"
                  >
                    Add Log
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </Dialog>

      {/* DIALOG ADD Leads full detail manual creation modal */}
      <Dialog isOpen={isAddFullOpen} onClose={() => setIsAddFullOpen(false)} title="Register CRM Lead">
        <form onSubmit={handleFullAdd} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Prospect Name</label>
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
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Mobile Phone (With Country Code)</label>
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
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
              <input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="e.g. ramesh@gmail.com"
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Requirement Spec</label>
              <input
                type="text"
                value={formRequirement}
                onChange={(e) => setFormRequirement(e.target.value)}
                placeholder="e.g. 2 BHK Premium Flat"
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Preferred Area Location</label>
              <input
                type="text"
                value={formLocation}
                onChange={(e) => setFormLocation(e.target.value)}
                placeholder="e.g. Wakad, Pune"
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Purchase Budget Limit (INR)</label>
              <input
                type="number"
                value={formBudget}
                onChange={(e) => setFormBudget(e.target.value)}
                placeholder="e.g. 6500000"
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Acquisition Source</label>
              <select
                value={formSource}
                onChange={(e) => setFormSource(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-sky-500"
              >
                <option value="Facebook Ads">Facebook Ads</option>
                <option value="Google Search">Google Search</option>
                <option value="Direct Walk-in">Direct Walk-in</option>
                <option value="Instagram Promo">Instagram Promo</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Assigned Agent</label>
              <input
                type="text"
                value={formAssigned}
                onChange={(e) => setFormAssigned(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Initial Stage</label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-sky-500"
              >
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Interested">Interested</option>
                <option value="Site Visit">Site Visit</option>
                <option value="Negotiation">Negotiation</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Client Remarks / Notes</label>
            <textarea
              rows={2}
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="Wants high floor flat with home automation provisions..."
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-sky-500 resize-none"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddFullOpen(false)}
              className="bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-slate-200 px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-medium text-xs px-4 py-2 rounded-xl shadow-lg shadow-sky-500/10 cursor-pointer"
            >
              Capture Lead
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
