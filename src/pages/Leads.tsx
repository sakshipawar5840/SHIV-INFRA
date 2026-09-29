import React, { useState, useEffect } from 'react';
import { apiClient } from '../lib/axiosClient';
import { Lead } from '../types';
import { Dialog } from '../components/Dialog';
import { Plus, Search, HelpCircle, Phone, MessageSquare, PlusCircle, Trash2, Calendar, Clipboard, Filter, FilterX, Clock, AlertCircle } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

const COLUMNS: Lead['status'][] = [
  'New',
  'Follow Up',
  'Hot',
  'Closed',
  'Lost'
];

const mapApiLead = (lead: any): Lead => {
  return {
    ...lead,
    name: lead.customers?.full_name || lead.requirement || 'Unknown Lead',
    phone: lead.customers?.phone || '',
    email: lead.customers?.email || '',
    location: lead.preferred_location || lead.projects?.location || '',
    source: lead.lead_source || '',
    notes: lead.remarks || '',
    timelineLogs: []
  };
};

export const Leads: React.FC = () => {
  const toast = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  
  const [isDetailsOpen, setIsEditOpen] = useState(false);
  const [isAddFullOpen, setIsAddFullOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const [inlineNames, setInlineNames] = useState<Record<string, string>>({});
  const [inlinePhones, setInlinePhones] = useState<Record<string, string>>({});

  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formCountryCode, setFormCountryCode] = useState('+91');
  const [formEmail, setFormEmail] = useState('');
  const [formRequirement, setFormRequirement] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formBudget, setFormBudget] = useState('');
  const [formStatus, setFormStatus] = useState<Lead['status'] | ''>('');
  const [formSource, setFormSource] = useState('');
  const [formAssigned, setFormAssigned] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [newLogText, setNewLogText] = useState('');

  useEffect(() => {
    const loadLeads = async () => {
      try {
        const res = await apiClient.get('/v1/leads');
        const rawLeads = res.data?.data ?? [];
        setLeads(rawLeads.map(mapApiLead));
      } catch (err) {
        console.error('Failed to load leads from API', err);
        toast.showToast('Failed to load leads', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadLeads();
  }, []);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: Lead['status']) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    const lead = leads.find(l => l.id === id);
    if (!lead || lead.status === targetStatus) return;

    try {
      const payload: any = {
        status: targetStatus,
        updated_at: new Date().toISOString()
      };
      await apiClient.put(`/v1/leads/${id}`, payload);
      
      const updated = leads.map(l => {
        if (l.id === id) {
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
      setLeads(updated);
      toast.showToast('Lead stage updated', 'success');
    } catch (err: any) {
      console.error('Failed to update lead status', err);
      toast.showToast(err.response?.data?.message || 'Failed to update lead', 'error');
    }
  };

  const handleQuickAdd = async (column: Lead['status']) => {
    const name = inlineNames[column]?.trim();
    const phone = inlinePhones[column]?.trim();
    if (!name || !phone) return;

    try {
      const payload: any = {
        requirement: name,
        preferred_location: phone,
        budget: 0,
        status: column,
        lead_source: 'Direct Walk-in',
        remarks: 'Quick added from pipeline.'
      };

      const res = await apiClient.post('/v1/leads', payload);
      const newLead = mapApiLead(res.data?.data ?? res.data);
      setLeads(prev => [newLead, ...prev]);
      
      setInlineNames(prev => ({ ...prev, [column]: '' }));
      setInlinePhones(prev => ({ ...prev, [column]: '' }));
      toast.showToast('Lead quick added', 'success');
    } catch (err: any) {
      console.error('Failed to quick add lead', err);
      toast.showToast(err.response?.data?.message || 'Failed to add lead', 'error');
    }
  };

  const handleFullAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    
    if (!formRequirement.trim()) errors.requirement = 'Requirement is required';
    if (!formLocation.trim()) errors.location = 'Preferred location is required';
    if (!formBudget || Number(formBudget) <= 0) errors.budget = 'Enter a valid budget amount';
    if (!formSource) errors.source = 'Acquisition source is required';
    if (!formStatus) errors.status = 'Initial stage is required';
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.showToast('Please fill all required fields.', 'warning');
      return;
    }
    
    setFormErrors({});

    try {
const payload: any = {
        lead_source: formSource,
        requirement: formRequirement,
        budget: Number(formBudget),
        preferred_location: formLocation,
        status: formStatus,
        assigned_to: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(formAssigned) ? formAssigned : null,
        remarks: formNotes || ''
      };

      const res = await apiClient.post('/v1/leads', payload);
      const newLead = mapApiLead(res.data?.data ?? res.data);
      setLeads(prev => [newLead, ...prev]);
      
      setIsAddFullOpen(false);
      setFormName('');
      setFormPhone('');
      setFormCountryCode('+91');
      setFormEmail('');
      setFormRequirement('');
      setFormLocation('');
      setFormBudget('');
      setFormStatus('' as Lead['status'] | '');
      setFormSource('');
      setFormAssigned('');
      setFormNotes('');
      setFormErrors({});
      toast.showToast('Lead captured successfully', 'success');
    } catch (err: any) {
      console.error('Failed to create lead', err);
      toast.showToast(err.response?.data?.message || 'Failed to create lead', 'error');
    }
  };

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
        setSelectedLead(updatedLead);
        return updatedLead;
      }
      return l;
    });

    setLeads(updated);
    setNewLogText('');
    toast.showToast('Log added', 'success');
  };

  const handleDeleteLead = (id: string) => {
    const lead = leads.find(l => l.id === id);
    setSelectedLead(lead || null);
    setIsDeleteOpen(true);
  };

  const confirmDeleteLead = async () => {
    if (!selectedLead) return;

    try {
      await apiClient.delete(`/v1/leads/${selectedLead.id}`);
      setLeads(prev => prev.filter(l => l.id !== selectedLead.id));
      setIsDeleteOpen(false);
      setSelectedLead(null);
      toast.showToast('Lead deleted successfully', 'success');
    } catch (err: any) {
      console.error('Failed to delete lead', err);
      toast.showToast(err.response?.data?.message || 'Failed to delete lead', 'error');
    }
  };

  const openFullAddModal = () => {
    setFormName('');
    setFormPhone('');
    setFormCountryCode('+91');
    setFormEmail('');
    setFormRequirement('');
    setFormLocation('');
    setFormBudget('');
    setFormStatus('' as Lead['status'] | '');
    setFormSource('');
    setFormAssigned('');
    setFormNotes('');
    setFormErrors({});
    setIsAddFullOpen(true);
  };

  const formatINR = (val: number | null | undefined) => {
    const v = val || 0;
    if (v >= 10000000) {
      return `₹ ${(v / 10000000).toFixed(2)} Cr`;
    } else if (v >= 100000) {
      return `₹ ${(v / 100000).toFixed(2)} L`;
    }
    return `₹ ${v.toLocaleString('en-IN')}`;
  };

  const filteredLeads = leads.filter(l => {
    const name = l.name || '';
    const phone = l.phone || '';
    const requirement = l.requirement || '';
    const source = l.source || '';
    const matchesSearch = name.toLowerCase().includes(search.toLowerCase()) ||
                          phone.includes(search) ||
                          requirement.toLowerCase().includes(search.toLowerCase());
    const matchesSource = sourceFilter === 'All' || source === sourceFilter;
    return matchesSearch && matchesSource;
  });

  return (
    <div className="space-y-6 text-text-primary">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-text-primary font-sans">
            CRM Leads Pipeline
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Visualize client conversions, drag card states, and log communication notes chronological logs.
          </p>
        </div>
        <button
          onClick={openFullAddModal}
          className="flex items-center space-x-1.5 bg-primary text-white font-medium text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-primary/10 cursor-pointer"
        >
          <Plus size={14} />
          <span>Add CRM Lead</span>
        </button>
      </div>

      {/* Advanced filters */}
      <div className="bg-surface border border-border p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 relative max-w-sm">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-text-secondary">
            <Search size={14} />
          </div>
          <input
            type="text"
            placeholder="Search prospect name, phone, demand..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface/80 border border-border text-text-primary placeholder-text-secondary rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-primary/80"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider flex items-center">
            <Filter size={11} className="mr-1" /> Channels:
          </span>
          {['All', 'Facebook', 'Google', 'Instagram', 'WhatsApp'].map((src) => (
            <button
              key={src}
              onClick={() => setSourceFilter(src)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer border ${
                sourceFilter === src
                  ? 'bg-primary/10 border-primary/20 text-primary'
                  : 'bg-surface border-border/80 text-text-secondary hover:text-text-primary'
              }`}
            >
              {src}
            </button>
          ))}
        </div>
      </div>

      {/* Kanban Board Row */}
      {loading ? (
        <div className="bg-surface border border-border rounded-2xl p-12 text-center">
          <p className="text-sm font-semibold text-text-secondary">Loading leads...</p>
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl p-12 text-center">
          <Search size={36} className="text-text-secondary mx-auto mb-3" />
          <p className="text-sm font-semibold text-text-secondary">No leads found</p>
          <p className="text-xs text-text-secondary mt-1">Try adjusting your search or add a new lead.</p>
        </div>
      ) : (
        <div className="flex space-x-4 overflow-x-auto pb-4 custom-scrollbar items-start">
        {COLUMNS.map((column) => {
          const colLeads = filteredLeads.filter(l => l.status === column);
          const colSumBudget = colLeads.reduce((acc, curr) => acc + (curr.budget || 0), 0);

          return (
            <div
              key={column}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column)}
              className="w-72 bg-surface/60 border border-border rounded-2xl p-4 shrink-0 flex flex-col space-y-3 min-h-[30rem] hover:border-border transition-colors"
            >
              <div className="flex justify-between items-center border-b border-border/60 pb-2">
                <div>
                  <h4 className="text-xs font-bold text-text-primary flex items-center">
                     <span className={`h-1.5 w-1.5 rounded-full mr-2 ${
                       column === 'Closed' ? 'bg-success animate-pulse' :
                       column === 'Lost' ? 'bg-danger' : 'bg-primary'
                     }`}></span>
                    {column}
                  </h4>
                  <p className="text-[9px] text-text-secondary font-mono mt-0.5 font-bold uppercase">
                    Worth: {formatINR(colSumBudget)}
                  </p>
                </div>
                <span className="text-[10px] font-bold bg-surface text-text-secondary px-2 py-0.5 rounded-full">
                  {colLeads.length}
                </span>
              </div>

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
                    className="bg-surface border border-border p-3.5 rounded-xl hover:border-primary/40 transition-all cursor-pointer group active:scale-95 duration-200 select-none"
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-[9px] font-semibold text-text-secondary bg-surface px-1.5 py-0.5 rounded font-mono">
                        {item.source}
                      </span>
                      <span className="text-[10px] font-bold text-primary font-mono">
                        {formatINR(item.budget)}
                      </span>
                    </div>

                    <h5 className="text-xs font-bold text-text-primary group-hover:text-primary transition-colors mt-2">{item.name}</h5>
                    <p className="text-[10px] text-text-secondary mt-1 truncate">{item.requirement} • {item.location}</p>
                    
                    <div className="flex items-center justify-between text-[9px] text-text-secondary border-t border-border/40 mt-3 pt-2">
                      <span className="flex items-center"><Clock size={9} className="mr-1" /> {item.assigned_to || 'Assigned'}</span>
                      <span className="font-mono">{item.phone}</span>
                    </div>
                  </div>
                ))}

                {colLeads.length === 0 && (
                  <div className="border border-dashed border-border rounded-xl p-6 text-center text-[10px] text-text-secondary">
                    No leads at this stage
                  </div>
                )}
              </div>

              <div className="border-t border-border/40 pt-2 bg-surface/25 space-y-1.5">
                <input
                  type="text"
                  placeholder="Lead Name"
                  value={inlineNames[column] || ''}
                  onChange={(e) => setInlineNames(prev => ({ ...prev, [column]: e.target.value }))}
                  className="w-full bg-surface border border-border rounded-lg px-2.5 py-1 text-[11px] placeholder-text-secondary text-text-primary focus:outline-none"
                />
                <div className="flex space-x-1.5">
                  <input
                    type="text"
                    placeholder="Phone No"
                    value={inlinePhones[column] || ''}
                    onChange={(e) => setInlinePhones(prev => ({ ...prev, [column]: e.target.value }))}
                    className="flex-1 bg-surface border border-border rounded-lg px-2.5 py-1 text-[11px] placeholder-text-secondary text-text-primary focus:outline-none"
                  />
                  <button
                    onClick={() => handleQuickAdd(column)}
                    className="bg-primary hover:bg-primary-hover text-white rounded-lg p-1 transition-colors shrink-0 flex items-center justify-center cursor-pointer"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}

      <Dialog isOpen={isDetailsOpen} onClose={() => setIsEditOpen(false)} title="CRM Lead Details Hub" size="lg">
        {selectedLead && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-4">
              <div className="bg-surface p-4 border border-border rounded-xl space-y-3.5">
                <div className="text-center pb-2 border-b border-border">
                  <div className="h-10 w-10 bg-primary/10 text-primary rounded-full flex items-center justify-center text-md font-bold mx-auto">
                    {selectedLead.name[0]}
                  </div>
                  <h4 className="text-sm font-bold text-text-primary mt-2">{selectedLead.name}</h4>
                  <span className="text-[9px] font-mono text-success font-bold bg-success/5 px-2 py-0.5 rounded-full uppercase mt-1 inline-block">
                    {selectedLead.status}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] text-text-secondary font-semibold uppercase">Primary Demand</span>
                    <p className="text-text-secondary font-medium">{selectedLead.requirement}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-secondary font-semibold uppercase">Max Budget Limit</span>
                    <p className="text-primary font-mono font-bold">{formatINR(selectedLead.budget)}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-secondary font-semibold uppercase">Preferred Location</span>
                    <p className="text-text-secondary font-medium">{selectedLead.location}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-secondary font-semibold uppercase">Lead Source Code</span>
                    <p className="text-text-secondary font-medium">{selectedLead.source}</p>
                  </div>
                </div>

                <div className="flex space-x-2 pt-2 border-t border-border">
                  <a
                    href={`tel:${selectedLead.phone}`}
                    className="flex-1 flex items-center justify-center space-x-1 bg-surface border border-border text-text-secondary py-1.5 rounded-lg text-[10px] font-semibold hover:bg-bg-app"
                  >
                    <Phone size={10} className="text-primary" />
                    <span>Direct Call</span>
                  </a>
                  <a
                     href={`https://api.whatsapp.com/send?phone=${selectedLead.phone}&text=Hello%20${encodeURIComponent(selectedLead.name)},%20Greetings%20from%20our%20team.%20We%20wanted%20to%20follow%20up%20on%20your%20requirement.`}
                     target="_blank"
                     rel="noreferrer"
                     className="flex-1 flex items-center justify-center space-x-1 bg-success/5 border border-success/20 text-success py-1.5 rounded-lg text-[10px] font-semibold hover:bg-success/10"
                  >
                    <MessageSquare size={10} />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>

              <button
                onClick={() => handleDeleteLead(selectedLead.id)}
                className="w-full bg-danger/5 border border-danger/20 text-danger text-xs py-2 rounded-xl flex items-center justify-center space-x-1 hover:bg-danger/10 transition-all cursor-pointer"
              >
                <Trash2 size={12} />
                <span>Delete Prospect Record</span>
              </button>
            </div>

            <div className="md:col-span-2 space-y-4 flex flex-col justify-between">
              <div className="space-y-3.5 bg-surface p-4 rounded-xl border border-border max-h-[16rem] overflow-y-auto custom-scrollbar">
                <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider flex items-center">
                  <Clock size={11} className="mr-1 text-primary" /> Interaction Timeline Logs
                </span>
                <div className="space-y-3">
                  {(selectedLead.timelineLogs || []).map((log, idx) => (
                    <div key={idx} className="border-l border-border pl-3 space-y-0.5 text-xs relative">
                      <span className="absolute -left-1 top-1.5 h-2 w-2 rounded-full bg-primary"></span>
                      <p className="text-text-secondary font-sans leading-relaxed">{log.text}</p>
                      <p className="text-[9px] text-text-secondary font-mono font-bold">[{log.timestamp}] • {log.author}</p>
                    </div>
                  ))}
                  {(selectedLead.timelineLogs || []).length === 0 && (
                    <p className="text-xs text-center text-text-secondary py-4">No followups logged yet.</p>
                  )}
                </div>
              </div>

              <form onSubmit={handleAddTimelineLog} className="space-y-2 border-t border-border pt-3">
                <label className="block text-[10px] text-text-secondary font-bold uppercase tracking-wider">Log New Interaction/Call notes</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newLogText}
                    onChange={(e) => setNewLogText(e.target.value)}
                    placeholder="Type client response, home budget criteria or schedule details..."
                    className="flex-1 bg-surface border border-border text-text-primary placeholder-text-secondary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary"
                  />
                  <button
                    type="submit"
                    className="bg-primary hover:bg-primary-hover text-white rounded-xl px-4 text-xs font-semibold shrink-0 cursor-pointer"
                  >
                    Add Log
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </Dialog>

      <Dialog isOpen={isAddFullOpen} onClose={() => setIsAddFullOpen(false)} title="Register CRM Lead">
        <form onSubmit={handleFullAdd} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Prospect Name</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Ramesh Deshmukh"
                className={`w-full bg-surface border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary ${formErrors.name ? 'border-rose-500 text-danger' : 'border-border text-text-primary'}`}
              />
              {formErrors.name && <p className="text-[10px] text-danger mt-1">{formErrors.name}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Mobile Phone (With Country Code)</label>
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
                  className={`flex-1 bg-surface border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary font-mono ${formErrors.phone ? 'border-rose-500 text-danger' : 'border-border text-text-primary'}`}
                />
              </div>
              {formErrors.phone && <p className="text-[10px] text-danger mt-1">{formErrors.phone}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Email Address</label>
              <input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="e.g. ramesh@gmail.com"
                className={`w-full bg-surface border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary ${formErrors.email ? 'border-rose-500 text-danger' : 'border-border text-text-primary'}`}
              />
              {formErrors.email && <p className="text-[10px] text-danger mt-1">{formErrors.email}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Requirement Spec</label>
              <input
                type="text"
                value={formRequirement}
                onChange={(e) => setFormRequirement(e.target.value)}
                placeholder="e.g. 2 BHK Premium Flat"
                className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary"
              />
              {formErrors.requirement && <p className="text-[10px] text-danger mt-1">{formErrors.requirement}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Preferred Area Location</label>
              <input
                type="text"
                value={formLocation}
                onChange={(e) => setFormLocation(e.target.value)}
                placeholder="e.g. Wakad, Pune"
                className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary"
              />
              {formErrors.location && <p className="text-[10px] text-danger mt-1">{formErrors.location}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Purchase Budget Limit (INR)</label>
              <input
                type="number"
                value={formBudget}
                onChange={(e) => setFormBudget(e.target.value)}
                placeholder="e.g. 6500000"
                className={`w-full bg-surface border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary font-mono ${formErrors.budget ? 'border-rose-500 text-danger' : 'border-border text-text-primary'}`}
              />
              {formErrors.budget && <p className="text-[10px] text-danger mt-1">{formErrors.budget}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Acquisition Source</label>
<select
                value={formSource}
                onChange={(e) => setFormSource(e.target.value)}
                className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary"
              >
                <option value="">Select Acquisition Source</option>
                <option value="Facebook">Facebook</option>
                <option value="Google">Google</option>
                <option value="Instagram">Instagram</option>
                <option value="WhatsApp">WhatsApp</option>
              </select>
              {formErrors.source && <p className="text-[10px] text-danger mt-1">{formErrors.source}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Assigned Agent</label>
              <input
                type="text"
                value={formAssigned}
                onChange={(e) => setFormAssigned(e.target.value)}
                className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Initial Stage</label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as Lead['status'])}
                className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary"
              >
                <option value="">Select Stage</option>
                <option value="New">New</option>
                <option value="Follow Up">Follow Up</option>
                <option value="Hot">Hot</option>
                <option value="Closed">Closed</option>
                <option value="Lost">Lost</option>
              </select>
              {formErrors.status && <p className="text-[10px] text-danger mt-1">{formErrors.status}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Client Remarks / Notes</label>
            <textarea
              rows={2}
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="Wants high floor flat with home automation provisions..."
              className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary resize-none"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setIsAddFullOpen(false)}
              className="bg-surface border border-border hover:bg-surface text-text-secondary hover:text-text-primary px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-primary text-white font-medium text-xs px-4 py-2 rounded-xl shadow-lg shadow-primary/10 cursor-pointer"
            >
              Capture Lead
            </button>
          </div>
        </form>
      </Dialog>

      <Dialog isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete Lead">
        <div className="space-y-4 font-sans">
          <p className="text-sm text-text-secondary">
            Are you sure you want to delete <span className="font-semibold text-text-primary">{selectedLead?.name}</span>?
          </p>
          <div className="bg-danger/5 border border-danger/20 p-3 rounded-xl text-xs text-danger flex items-start space-x-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>This action cannot be undone. The lead record will be permanently removed.</span>
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
              onClick={confirmDeleteLead}
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

