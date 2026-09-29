import React, { useState, useEffect } from 'react';
import { apiClient } from '../lib/axiosClient';
import { SystemUser } from '../types';
import { Dialog } from '../components/Dialog';
import { Plus, Search, Shield, User, UserCheck, Key, Mail, Trash2, AlertCircle } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

export const Users: React.FC = () => {
  const toast = useToast();
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);

  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<'Admin' | 'Engineer' | 'Sales Manager' | 'Customer' | ''>('');
  const [formPhone, setFormPhone] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await apiClient.get('/v1/users', { params: { q: search || undefined } });
        setUsers(res.data?.data ?? []);
      } catch (err) {
        console.error('Failed to load users', err);
        toast.showToast('Failed to load users', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formName.trim()) errors.name = 'Name is required';
    if (!formEmail.trim()) errors.email = 'Email is required';
    if (!formRole) errors.role = 'Role is required';
    if (!formPassword.trim()) errors.password = 'Password is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.showToast('Please fill all required fields.', 'warning');
      return;
    }

    setFormErrors({});

    try {
      const payload = {
        name: formName,
        email: formEmail,
        phone: formPhone,
        role: formRole,
        password_hash: formPassword,
        status: 'active',
      };

      const res = await apiClient.post('/v1/users', payload);
      if (res.data?.success) {
        setUsers(prev => [res.data.data, ...prev]);
        toast.showToast('User added successfully', 'success');
        setIsAddOpen(false);
        setFormName('');
        setFormEmail('');
        setFormRole('');
        setFormPhone('');
        setFormPassword('');
        setFormErrors({});
      }
    } catch (err: any) {
      console.error('Failed to add user', err);
      toast.showToast(err.response?.data?.message || 'Failed to add user', 'error');
    }
  };

  const handleDeleteUser = (id: string, name: string) => {
    const user = users.find(u => u.id === id);
    setSelectedUser(user || null);
    setIsDeleteOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      const res = await apiClient.delete(`/v1/users/${selectedUser.id}`);
      if (res.data?.success) {
        setUsers(prev => prev.filter(u => u.id !== selectedUser.id));
        toast.showToast('User removed successfully', 'success');
      }
    } catch (err) {
      console.error('Failed to delete user', err);
      toast.showToast('Failed to delete user', 'error');
    } finally {
      setIsDeleteOpen(false);
      setSelectedUser(null);
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 text-text-primary font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-text-primary">ERP Team Roster</h2>
          <p className="text-xs text-text-secondary mt-0.5">Control employee access control parameters, site project delegations, and platform permissions.</p>
        </div>
        <button
          onClick={() => {
            setFormName('');
            setFormEmail('');
            setFormRole('');
            setFormPhone('');
            setFormPassword('');
            setFormErrors({});
            setIsAddOpen(true);
          }}
          className="flex items-center space-x-1.5 bg-primary text-white font-medium text-xs px-4 py-2.5 rounded-xl shadow-lg cursor-pointer"
        >
          <Plus size={14} />
          <span>Add User</span>
        </button>
      </div>

      <div className="bg-surface border border-border p-4 rounded-2xl">
        <div className="relative max-w-sm">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-text-secondary">
            <Search size={14} />
          </div>
          <input
            type="text"
            placeholder="Search users by name, email, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface/80 border border-border text-text-primary placeholder-text-secondary rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none"
          />
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-surface font-mono text-[10px] uppercase text-text-secondary border-b border-border">
              <tr>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-text-secondary font-mono">
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-bg-app transition-colors">
                  <td className="py-3.5 px-4 font-sans font-bold text-text-primary">{user.name}</td>
                  <td className="py-3.5 px-4 text-text-secondary">{user.email}</td>
                  <td className="py-3.5 px-4">
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      user.role === 'Admin' || user.role === 'Super Admin' ? 'bg-danger/5 text-danger border border-danger/20' :
                      user.role === 'Engineer' ? 'bg-warning/5 text-warning border border-warning/20' :
                      'bg-success/5 text-success border border-success/20'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-text-secondary">{user.status}</td>
                  <td className="py-3.5 px-4 text-center">
                    <button onClick={() => handleDeleteUser(user.id, user.name)} className="text-text-secondary hover:text-danger p-1 hover:bg-bg-app rounded transition-all cursor-pointer">
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-text-secondary">No users found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Team Member">
        <form onSubmit={handleAddUser} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Full Name</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Email</label>
              <input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="e.g. john@shivinfra.com"
                className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Phone</label>
              <input
                type="text"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="e.g. +91 9876543210"
                className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Role</label>
              <select
                value={formRole}
                onChange={(e) => setFormRole(e.target.value as any)}
                className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none"
              >
                <option value="">Select Role</option>
                <option value="Admin">Admin</option>
                <option value="Engineer">Engineer</option>
                <option value="Sales Manager">Sales Manager</option>
                <option value="Customer">Customer</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Initial Password</label>
            <input
              type="password"
              value={formPassword}
              onChange={(e) => setFormPassword(e.target.value)}
              placeholder="Set initial password"
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
              Add User
            </button>
          </div>
        </form>
      </Dialog>

      <Dialog isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Remove User">
        <div className="space-y-4 font-sans">
          <p className="text-sm text-text-secondary">
            Are you sure you want to remove <span className="font-semibold text-text-primary">{selectedUser?.name}</span> from the platform?
          </p>
          <div className="bg-danger/5 border border-danger/20 p-3 rounded-xl text-xs text-danger flex items-start space-x-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>This action cannot be undone. The user will be deactivated.</span>
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
              onClick={confirmDeleteUser}
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
