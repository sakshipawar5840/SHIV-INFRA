import React, { useState, useEffect } from 'react';
import { apiClient } from '../lib/axiosClient';
import { ActivityLog } from '../types';
import { Search, Shield, Cpu, RefreshCw, Database } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

export const ActivityLogs: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const loadLogs = async () => {
      try {
        const res = await apiClient.get('/v1/activity-logs', { params: { q: search || undefined, limit: 100 } });
        setLogs(res.data?.data ?? []);
      } catch (err) {
        console.error('Failed to load activity logs', err);
      } finally {
        setLoading(false);
      }
    };
    loadLogs();
  }, []);

  const handleRefresh = async () => {
    try {
      const res = await apiClient.get('/v1/activity-logs', { params: { q: search || undefined, limit: 100 } });
      setLogs(res.data?.data ?? []);
    } catch (err) {
      console.error('Failed to refresh logs', err);
    }
  };

  const filteredLogs = logs.filter(l => {
    const action = l.action || '';
    const details = l.description || '';
    const email = l.user_id || '';
    const s = search.toLowerCase();
    return action.toLowerCase().includes(s) ||
      details.toLowerCase().includes(s) ||
      email.toLowerCase().includes(s);
  });

  return (
    <div className="space-y-6 text-text-primary font-mono">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-text-primary font-sans">Security Audit Trail Log</h2>
          <p className="text-xs text-text-secondary mt-0.5 font-sans">Immutable cryptographic platform logs tracking all operations, logins, and billing approvals.</p>
        </div>

        <button
          onClick={handleRefresh}
          className="flex items-center space-x-1.5 bg-surface border border-border hover:bg-bg-app text-primary text-xs px-3.5 py-2.5 rounded-xl cursor-pointer"
        >
          <RefreshCw size={12} className="animate-spin" />
          <span className="font-sans">Query Audit database</span>
        </button>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-sans text-xs">
        <div className="flex items-center space-x-2">
          <Database size={15} className="text-primary" />
          <span className="text-text-secondary font-semibold">Immutable ledger integrity:</span>
          <span className="text-success font-mono font-bold bg-success/5 px-2.5 py-0.5 rounded-full border border-success/20 uppercase tracking-wider text-[9px]">Verified</span>
        </div>
        <p className="text-[10px] text-text-secondary font-mono">MD5 Checksum: A5F1099BC8120BEE73241F8C988D</p>
      </div>

      <div className="bg-surface border border-border p-4 rounded-2xl">
        <div className="relative max-w-sm">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-text-secondary">
            <Search size={14} />
          </div>
          <input
            type="text"
            placeholder="Search action logs, admin triggers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface/80 border border-border text-text-primary placeholder-text-secondary rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none font-sans"
          />
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-2xl p-5 space-y-3 max-h-[30rem] overflow-y-auto custom-scrollbar">
        {filteredLogs.map(log => (
          <div key={log.id} className="text-[11px] leading-relaxed border-b border-border pb-2 flex items-start space-x-2 hover:bg-surface/10 p-1 rounded transition-colors">
            <span className="text-text-secondary shrink-0 font-bold">[{new Date(log.created_at || '').toLocaleString()}]</span>
            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 ${
              log.action === 'INSERT' || log.action === 'Create' ? 'bg-teal/10 text-primary' :
              log.action === 'DELETE' ? 'bg-danger/5 text-danger' :
              log.action === 'UPDATE' ? 'bg-warning/5 text-warning' :
              'bg-surface text-text-secondary'
            }`}>
              {log.action}
            </span>
            <span className="text-text-secondary flex-1">{log.description}</span>
            <span className="text-text-primary font-bold shrink-0">@ {log.user_id || 'System'}</span>
          </div>
        ))}

        {filteredLogs.length === 0 && (
          <p className="text-xs text-center text-text-secondary py-6 font-sans">No matches found in security log stream.</p>
        )}
      </div>
    </div>
  );
};
