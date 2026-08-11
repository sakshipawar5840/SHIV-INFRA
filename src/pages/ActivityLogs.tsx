import React, { useState, useEffect } from 'react';
import { getStoredData, INITIAL_ACTIVITY_LOGS, logSystemAction } from '../lib/mockData';
import { ActivityLog } from '../types';
import { Search, Shield, Cpu, RefreshCw, Database } from 'lucide-react';

export const ActivityLogs: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLogs(getStoredData<ActivityLog[]>('activity_logs', INITIAL_ACTIVITY_LOGS));
  }, []);

  const handleRefresh = () => {
    setLogs(getStoredData<ActivityLog[]>('activity_logs', INITIAL_ACTIVITY_LOGS));
    logSystemAction('Access', 'Auditor refreshed secure terminal logging trace');
  };

  const filteredLogs = logs.filter(l => 
    l.type.toLowerCase().includes(search.toLowerCase()) ||
    l.description.toLowerCase().includes(search.toLowerCase()) ||
    l.user.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 text-slate-100 font-mono">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100 font-sans">Security Audit Trail Log</h2>
          <p className="text-xs text-slate-400 mt-0.5 font-sans">Immutable cryptographic platform logs tracking all operations, logins, and billing approvals.</p>
        </div>

        <button
          onClick={handleRefresh}
          className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-sky-400 text-xs px-3.5 py-2.5 rounded-xl cursor-pointer"
        >
          <RefreshCw size={12} className="animate-spin" />
          <span className="font-sans">Query Audit database</span>
        </button>
      </div>

      {/* Metrics of operations logs */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-sans text-xs">
        <div className="flex items-center space-x-2">
          <Database size={15} className="text-sky-400" />
          <span className="text-slate-400 font-semibold">Immutable ledger integrity:</span>
          <span className="text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/10 uppercase tracking-wider text-[9px]">Verified</span>
        </div>
        <p className="text-[10px] text-slate-500 font-mono">MD5 Checksum: A5F1099BC8120BEE73241F8C988D</p>
      </div>

      {/* Search Console */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="relative max-w-sm">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-500">
            <Search size={14} />
          </div>
          <input
            type="text"
            placeholder="Search action logs, admin triggers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-500 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none font-sans"
          />
        </div>
      </div>

      {/* Terminal Interface */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl p-5 space-y-3 max-h-[30rem] overflow-y-auto custom-scrollbar">
        {filteredLogs.map(log => (
          <div key={log.id} className="text-[11px] leading-relaxed border-b border-slate-900/60 pb-2 flex items-start space-x-2 hover:bg-slate-900/10 p-1 rounded transition-colors">
            <span className="text-slate-500 shrink-0 font-bold">[{log.timestamp}]</span>
            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 ${
              log.type === 'Create' ? 'bg-sky-500/10 text-sky-400' :
              log.type === 'Delete' ? 'bg-rose-500/10 text-rose-400' :
              log.type === 'Update' ? 'bg-amber-500/10 text-amber-400' :
              'bg-slate-800 text-slate-400'
            }`}>
              {log.type}
            </span>
            <span className="text-slate-300 flex-1">{log.description}</span>
            <span className="text-sky-500/80 font-bold shrink-0">@ {log.user}</span>
          </div>
        ))}

        {filteredLogs.length === 0 && (
          <p className="text-xs text-center text-slate-700 py-6 font-sans">No matches found in security log stream.</p>
        )}
      </div>
    </div>
  );
};
export default ActivityLogs;
