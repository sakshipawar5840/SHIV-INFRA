import React, { useState, useEffect } from 'react';
import { getStoredData, saveStoredData, INITIAL_USERS, logSystemAction } from '../lib/mockData';
import { SystemUser } from '../types';
import { Dialog } from '../components/Dialog';
import { Plus, Search, Shield, User, UserCheck, Key, Mail, Trash2 } from 'lucide-react';

export const Users: React.FC = () => {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<'Admin' | 'Engineer' | 'Sales Executive'>('Engineer');

  useEffect(() => {
    setUsers(getStoredData<SystemUser[]>('users_list', INITIAL_USERS));
  }, []);

  const handleSaveUsers = (data: SystemUser[]) => {
    setUsers(data);
    saveStoredData('users_list', data);
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formEmail) return;

    const newUser: SystemUser = {
      id: `u_${Date.now()}`,
      name: formName,
      email: formEmail,
      role: formRole,
      status: 'Active'
    };

    const updated = [newUser, ...users];
    handleSaveUsers(updated);
    logSystemAction('Create', `Admin registered new team member: "${formName}" with role ${formRole}`);
    setIsAddOpen(false);
  };

  const handleDeleteUser = (id: string, name: string) => {
    const updated = users.filter(u => u.id !== id);
    handleSaveUsers(updated);
    logSystemAction('Delete', `Team user "${name}" removed from platform`);
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">ERP Team Roster</h2>
          <p className="text-xs text-slate-400 mt-0.5">Control employee access control parameters, site project delegations, and platform permissions.</p>
        </div>
        <button
          onClick={() => {
            setFormName('');
            setFormEmail('');
            setIsAddOpen(true);
          }}
          className="flex items-center space-x-1.5 bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-medium text-xs px-4 py-2.5 rounded-xl shadow-lg cursor-pointer"
        >
          <Plus size={14} />
          <span>Invite Member</span>
        </button>
      </div>

      {/* Filter and search */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="relative max-w-sm">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-500">
            <Search size={14} />
          </div>
          <input
            type="text"
            placeholder="Search employee names, emails, roles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-500 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none"
          />
        </div>
      </div>

      {/* Grid viewport */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredUsers.map(member => (
          <div key={member.id} className="bg-slate-900 border border-slate-800/85 rounded-2xl p-5 hover:border-sky-500/30 transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-start pb-3 border-b border-slate-850">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="h-8 w-8 rounded-lg bg-slate-950 flex items-center justify-center text-sky-400 border border-slate-850 shrink-0">
                    <User size={14} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-200 truncate">{member.name}</h4>
                    <span className="text-[9px] text-slate-500 font-semibold">{member.role}</span>
                  </div>
                </div>
                <span className="text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/10">
                  {member.status}
                </span>
              </div>

              {/* Contacts info */}
              <div className="space-y-2 text-xs text-slate-300 font-mono">
                <p className="flex items-center"><Mail size={12} className="text-slate-500 mr-2 truncate" /> <span className="truncate">{member.email}</span></p>
                <p className="flex items-center"><Key size={12} className="text-slate-500 mr-2" /> RERA Permission: Approved</p>
              </div>
            </div>

            {/* Remove user */}
            <div className="flex justify-end pt-3 border-t border-slate-850 mt-4">
              {member.email === 'shivinfra55@gmail.com' ? (
                <span className="text-[9px] font-bold text-slate-500">System Owner Account</span>
              ) : (
                <button
                  onClick={() => handleDeleteUser(member.id, member.name)}
                  className="text-slate-500 hover:text-rose-400 p-1 hover:bg-slate-800 rounded transition-all cursor-pointer"
                  title="Remove Employee"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Dialog Invite Member */}
      <Dialog isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Executive Employee Access">
        <form onSubmit={handleAddUser} className="space-y-4 font-sans">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Employee Name</label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Rahul Salunkhe"
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2 text-xs focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Official Email</label>
              <input
                type="email"
                required
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="e.g. rahul@shivinfra.com"
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2 text-xs focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Platform Security Role & Permissions</label>
            <select
              value={formRole}
              onChange={(e) => setFormRole(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none"
            >
              <option value="Admin">Executive Administrator (Full Read/Write/Delete)</option>
              <option value="Engineer">Supervising Site Engineer (Inventory & Workloads Only)</option>
              <option value="Sales Executive">Sales CRM Consultant (Leads & Site-visit Calendars Only)</option>
            </select>
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
              className="bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-medium text-xs px-4 py-2 rounded-xl shadow-lg cursor-pointer"
            >
              Grant Access
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
export default Users;
