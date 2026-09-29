import React, { useState, useEffect } from 'react';
import { apiClient } from '../lib/axiosClient';
import { SiteVisit, Lead } from '../types';
import { Dialog } from '../components/Dialog';
import { Plus, Calendar as CalendarIcon, User, MapPin, Check, X, ShieldAlert, Clock, Trash2 } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

export const SiteVisits: React.FC = () => {
  const toast = useToast();
  const [siteVisits, setSiteVisits] = useState<SiteVisit[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<SiteVisit | null>(null);

  const [formLeadId, setFormLeadId] = useState('');
  const [formDate, setFormDate] = useState('');
   const [formStatus, setFormStatus] = useState<SiteVisit['status'] | ''>('');
   const [formNotes, setFormNotes] = useState('');
   const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [selectedLeadId, setSelectedLeadId] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [visitsRes, leadsRes] = await Promise.all([
          apiClient.get('/v1/site-visits'),
          apiClient.get('/v1/leads'),
        ]);
        setSiteVisits(visitsRes.data?.data ?? []);
        setLeads(leadsRes.data?.data ?? []);
      } catch (err) {
        console.error('Failed to load site visits', err);
        toast.showToast('Failed to load site visits', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleBookVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formLeadId) errors.lead = 'Please select a lead';
    if (!formDate) errors.date = 'Date is required';
    if (!formNotes.trim()) errors.notes = 'Notes are required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.showToast('Please fill all required fields.', 'warning');
      return;
    }

    setFormErrors({});
    const matchedLead = leads.find(l => l.id === formLeadId);
    if (!matchedLead) return;

    try {
      const payload = {
        lead_id: formLeadId,
        customer_id: matchedLead.customer_id || null,
        project_id: matchedLead.project_id || null,
        visit_date: formDate,
        notes: formNotes || `Walkthrough`,
      };

      const res = await apiClient.post('/v1/site-visits', payload);
      if (res.data?.success) {
        setSiteVisits(prev => [res.data.data, ...prev]);
        toast.showToast('Site visit booked successfully', 'success');
        setIsAddOpen(false);
        setFormLeadId('');
        setFormDate('');
        setFormStatus('');
        setFormNotes('');
        setFormNotes('');
        setFormErrors({});
      }
    } catch (err) {
      console.error('Failed to book site visit', err);
      toast.showToast('Failed to book site visit', 'error');
    }
  };

  const handleStatusChange = async (id: string, newStatus: SiteVisit['status']) => {
    try {
      const res = await apiClient.put(`/v1/site-visits/${id}`, { status: newStatus });
      if (res.data?.success) {
        setSiteVisits(prev => prev.map(v => v.id === id ? { ...v, status: newStatus } : v));
        toast.showToast('Site visit status updated', 'success');
      }
    } catch (err) {
      console.error('Failed to update site visit', err);
      toast.showToast('Failed to update site visit', 'error');
    }
  };

  const handleDeleteVisit = async (id: string) => {
    try {
      const res = await apiClient.delete(`/v1/site-visits/${id}`);
      if (res.data?.success) {
        setSiteVisits(prev => prev.filter(v => v.id !== id));
        toast.showToast('Site visit deleted', 'success');
      }
    } catch (err) {
      console.error('Failed to delete site visit', err);
      toast.showToast('Failed to delete site visit', 'error');
    }
  };

  const daysInJuly = 31;
  const julyDays = Array.from({ length: daysInJuly }, (_, i) => i + 1);

  const getVisitsForDay = (day: number) => {
    const paddedDay = String(day).padStart(2, '0');
    const matchDateStr = `2026-07-${paddedDay}`;
    return siteVisits.filter(v => v.visit_date === matchDateStr);
  };

  return (
    <div className="space-y-6 text-text-primary font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-text-primary">Site Visits & Walkthroughs</h2>
          <p className="text-xs text-text-secondary mt-0.5">Schedule physical property tours, reschedule appointments, and track site walkthroughs.</p>
        </div>
        <button
          onClick={() => {
            setFormLeadId('');
            setFormDate('');
            setFormStatus('');
            setFormNotes('');
            setFormNotes('');
            setFormErrors({});
            setIsAddOpen(true);
          }}
          className="flex items-center space-x-1.5 bg-primary text-white font-medium text-xs px-4 py-2.5 rounded-xl shadow-lg cursor-pointer"
        >
          <Plus size={14} />
          <span>Book Visit</span>
        </button>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
        <span className="text-xs font-bold text-text-secondary uppercase tracking-widest flex items-center">
          <CalendarIcon size={14} className="mr-2 text-primary" /> July 2026 Calendar
        </span>
        <div className="grid grid-cols-7 gap-1 text-center text-[8px] font-bold text-text-secondary uppercase mb-2">
          <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
        </div>
        <div className="grid grid-cols-7 gap-1 text-[9px] font-mono text-center">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={`offset-${i}`} className="h-6 opacity-0"></div>
          ))}
          {Array.from({ length: 31 }, (_, idx) => {
            const dayNum = idx + 1;
            const paddedDay = String(dayNum).padStart(2, '0');
            const matchDate = `2026-07-${paddedDay}`;
            const hasTask = siteVisits.some(v => v.visit_date === matchDate);
            return (
              <div key={dayNum} className={`h-8 flex flex-col items-center justify-center rounded-lg relative ${
                hasTask ? 'bg-warning/10 border border-warning/20 text-warning font-bold' : 'text-text-secondary hover:bg-surface/40'
              }`}>
                <span>{dayNum}</span>
                {hasTask && <span className="absolute bottom-1 h-1 w-1 bg-warning rounded-full animate-ping"></span>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-surface font-mono text-[10px] uppercase text-text-secondary border-b border-border">
              <tr>
                <th className="py-3 px-4">Lead / Customer</th>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Assigned To</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-text-secondary font-mono">
{siteVisits.map(visit => (
                <tr key={visit.id} className="hover:bg-bg-app transition-colors">
                  <td className="py-3.5 px-4 font-sans font-bold text-text-primary">
                    {visit.leads?.customers?.full_name || visit.customers?.full_name || 'N/A'}
                  </td>
                  <td className="py-3.5 px-4 font-sans text-text-secondary">
                    {visit.leads?.projects?.project_name || visit.projects?.project_name || 'N/A'}
                  </td>
                  <td className="py-3.5 px-4 text-text-primary">{visit.visit_date}</td>
                  <td className="py-3.5 px-4 text-text-secondary">{visit.notes || 'N/A'}</td>
                  <td className="py-3.5 px-4 text-center">
                    <select
                      value={visit.status}
                      onChange={(e) => handleStatusChange(visit.id, e.target.value as SiteVisit['status'])}
                      className="bg-surface border border-border text-text-primary rounded-lg px-2 py-1 text-[10px] focus:outline-none"
                    >
                      <option value="Scheduled">Scheduled</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                      <option value="Postponed">Postponed</option>
                    </select>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button onClick={() => handleDeleteVisit(visit.id)} className="text-text-secondary hover:text-danger p-1 hover:bg-bg-app rounded transition-all cursor-pointer">
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
              {siteVisits.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-text-secondary">No site visits scheduled</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Book Site Visit">
        <form onSubmit={handleBookVisit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Select Lead</label>
            <select
              value={formLeadId}
              onChange={(e) => setFormLeadId(e.target.value)}
              className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none"
            >
              <option value="">Select Lead</option>
              {leads.map(lead => (
                <option key={lead.id} value={lead.id}>{lead.requirement} - {lead.preferred_location}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Visit Date</label>
              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Assigned To</label>
              <input
                type="text"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="e.g. Eng. Yash Deshmukh"
                className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Notes</label>
            <textarea
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              rows={3}
              className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none"
            />
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
              Book Visit
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};



