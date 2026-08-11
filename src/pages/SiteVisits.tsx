import React, { useState, useEffect } from 'react';
import { getStoredData, saveStoredData, logSystemAction, INITIAL_SITE_VISITS, INITIAL_LEADS } from '../lib/mockData';
import { SiteVisit, Lead } from '../types';
import { Dialog } from '../components/Dialog';
import { Plus, Calendar as CalendarIcon, User, MapPin, Check, X, ShieldAlert, Clock } from 'lucide-react';

export const SiteVisits: React.FC = () => {
  const [siteVisits, setSiteVisits] = useState<SiteVisit[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<SiteVisit | null>(null);

  // Form Fields
  const [formLeadId, setFormLeadId] = useState('');
  const [formDate, setFormDate] = useState('2026-07-10');
  const [formStatus, setFormStatus] = useState<SiteVisit['status']>('Scheduled');
  const [formEngineer, setFormEngineer] = useState('Yash Deshmukh');

  useEffect(() => {
    setSiteVisits(getStoredData<SiteVisit[]>('site_visits', INITIAL_SITE_VISITS));
    setLeads(getStoredData<Lead[]>('leads', INITIAL_LEADS));
  }, []);

  const handleSaveVisits = (data: SiteVisit[]) => {
    setSiteVisits(data);
    saveStoredData('site_visits', data);
  };

  const handleBookVisit = (e: React.FormEvent) => {
    e.preventDefault();
    const matchedLead = leads.find(l => l.id === formLeadId);
    if (!matchedLead) return;

    const newVisit: SiteVisit = {
      id: `v_${Date.now()}`,
      lead_id: selectedLeadId || formLeadId,
      customer_name: matchedLead.name,
      project_name: matchedLead.location.split(',')[0],
      visit_date: formDate,
      status: 'Scheduled',
      engineer: formEngineer
    };

    const updated = [newVisit, ...siteVisits];
    handleSaveVisits(updated);
    logSystemAction('Create', `Site tour scheduled for "${matchedLead.name}" at site "${newVisit.project_name}"`);
    setIsAddOpen(false);
  };

  const handleStatusChange = (id: string, newStatus: SiteVisit['status']) => {
    const updated = siteVisits.map(v => {
      if (v.id === id) {
        logSystemAction('Update', `Site visit status changed to ${newStatus} for customer ${v.customer_name}`);
        return { ...v, status: newStatus };
      }
      return v;
    });
    handleSaveVisits(updated);
  };

  // State to hold the lead ID inside booking trigger
  const [selectedLeadId, setSelectedLeadId] = useState('');

  // Calendar parameters (Focusing on July 2026)
  const daysInJuly = 31;
  const julyDays = Array.from({ length: daysInJuly }, (_, i) => i + 1);

  // Group visits by day for calendar view
  const getVisitsForDay = (day: number) => {
    const paddedDay = String(day).padStart(2, '0');
    const matchDateStr = `2026-07-${paddedDay}`;
    return siteVisits.filter(v => v.visit_date === matchDateStr);
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100 font-sans">
            Site Visits Calendar
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Coordinate with prospective buyers and supervise on-site walkthroughs.
          </p>
        </div>
        <button
          onClick={() => {
            if (leads.length > 0) {
              setFormLeadId(leads[0].id);
            }
            setFormDate('2026-07-10');
            setFormEngineer('Yash Deshmukh');
            setIsAddOpen(true);
          }}
          className="flex items-center space-x-1.5 bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-medium text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-sky-500/10 hover:shadow-sky-500/20 hover:scale-105 transition-all cursor-pointer"
        >
          <Plus size={14} />
          <span>Book Walkthrough</span>
        </button>
      </div>

      {/* Calendar grid view */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* July 2026 calendar panel */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center">
              <CalendarIcon size={15} className="mr-2 text-sky-400" /> July 2026 SITE TOURS
            </h3>
            <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-2.5 py-0.5 rounded-md font-bold uppercase">IST Time Sync</span>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-widest">
            <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Blank offset days for July 2026 starting on Wednesday */}
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={`offset-${idx}`} className="h-16 bg-slate-950/20 border border-transparent rounded-lg opacity-25"></div>
            ))}

            {/* July Dates */}
            {julyDays.map((day) => {
              const dayVisits = getVisitsForDay(day);
              return (
                <div
                  key={day}
                  className="min-h-16 bg-slate-950/40 border border-slate-800/60 rounded-xl p-1.5 flex flex-col justify-between hover:border-slate-700 transition-colors group relative"
                >
                  <span className="text-[10px] font-mono font-bold text-slate-500 group-hover:text-slate-300 transition-colors">
                    {day}
                  </span>
                  {dayVisits.length > 0 && (
                    <div className="space-y-1 mt-1.5">
                      {dayVisits.slice(0, 2).map((visit) => (
                        <div
                          key={visit.id}
                          className={`text-[8px] font-semibold px-1 py-0.5 rounded-md truncate ${
                            visit.status === 'Completed'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10'
                              : visit.status === 'Cancelled'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/10'
                              : 'bg-sky-500/10 text-sky-400 border border-sky-500/15 animate-pulse'
                          }`}
                          title={`${visit.customer_name} - ${visit.project_name}`}
                        >
                          {visit.customer_name.split(' ')[0]}
                        </div>
                      ))}
                      {dayVisits.length > 2 && (
                        <p className="text-[7px] text-slate-500 font-mono text-center font-bold">+{dayVisits.length - 2} more</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic visit lists */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200">Scheduled Inbound Tours</h3>
          
          <div className="space-y-3.5 max-h-[22rem] overflow-y-auto custom-scrollbar pr-1">
            {siteVisits.map((visit) => (
              <div
                key={visit.id}
                className="bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-xl space-y-2.5 hover:border-slate-700 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">{visit.customer_name}</h4>
                    <p className="text-[10px] text-slate-400 flex items-center mt-0.5">
                      <MapPin size={10} className="mr-1 text-rose-400" /> {visit.project_name} Site
                    </p>
                  </div>
                  <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    visit.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' :
                    visit.status === 'Cancelled' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/10' :
                    'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                  }`}>
                    {visit.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-900/60 pt-2 font-mono">
                  <span className="flex items-center">
                    <Clock size={11} className="mr-1 text-sky-400" /> {visit.visit_date}
                  </span>
                  <span className="flex items-center">
                    <User size={11} className="mr-1 text-indigo-400" /> {visit.engineer || 'Supervisor'}
                  </span>
                </div>

                {visit.status === 'Scheduled' && (
                  <div className="flex space-x-1.5 pt-1.5 border-t border-slate-900/40">
                    <button
                      onClick={() => handleStatusChange(visit.id, 'Completed')}
                      className="flex-1 flex items-center justify-center space-x-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 py-1 rounded-lg text-[9px] font-bold transition-colors cursor-pointer"
                    >
                      <Check size={10} />
                      <span>Approve Checked</span>
                    </button>
                    <button
                      onClick={() => handleStatusChange(visit.id, 'Cancelled')}
                      className="flex-1 flex items-center justify-center space-x-1 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 py-1 rounded-lg text-[9px] font-bold transition-colors cursor-pointer"
                    >
                      <X size={10} />
                      <span>Cancel Visit</span>
                    </button>
                  </div>
                )}
              </div>
            ))}

            {siteVisits.length === 0 && (
              <p className="text-xs text-center text-slate-600 py-6">No scheduled visits registered</p>
            )}
          </div>
        </div>
      </div>

      {/* DIALOG scheduling booking walkthrough */}
      <Dialog isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Book Site Inspection Visit">
        <form onSubmit={handleBookVisit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Select CRM Pipeline Prospect</label>
            <select
              value={formLeadId}
              onChange={(e) => setFormLeadId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-sky-500"
            >
              {leads.map(l => (
                <option key={l.id} value={l.id}>{l.name} - ({l.requirement} at {l.location})</option>
              ))}
              {leads.length === 0 && (
                <option>No active pipeline prospects found</option>
              )}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Date of Inspection</label>
              <input
                type="date"
                required
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Supervising Site Engineer</label>
              <select
                value={formEngineer}
                onChange={(e) => setFormEngineer(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-sky-500"
              >
                <option value="Yash Deshmukh">Eng. Yash Deshmukh</option>
                <option value="Rahul Salunkhe">Eng. Rahul Salunkhe</option>
                <option value="Vijay Shinde">Sales Rep. Vijay Shinde</option>
              </select>
            </div>
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
              disabled={leads.length === 0}
              className="bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-medium text-xs px-4 py-2 rounded-xl shadow-lg shadow-sky-500/10 cursor-pointer disabled:opacity-50"
            >
              Book Walkthrough
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
export default SiteVisits;
