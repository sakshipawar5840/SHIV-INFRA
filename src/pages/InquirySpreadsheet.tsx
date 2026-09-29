import React, { useState, useEffect } from 'react';
import { apiClient } from '../lib/axiosClient';
import { InquiryItem } from '../types';
import {
  FileSpreadsheet,
  Search,
  Plus,
  CheckCircle,
  AlertCircle,
  Trash2
} from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

export const InquirySpreadsheet: React.FC = () => {
  const toast = useToast();
  const [inquiries, setInquiries] = useState<InquiryItem[]>([]);
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeCell, setActiveCell] = useState<{ rowId: string; colName: string } | null>(null);
  const [hoveredInquiry, setHoveredInquiry] = useState<InquiryItem | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // Form Fields for new Inquiry manually
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newProject, setNewProject] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newBudget, setNewBudget] = useState('');
  const [newReq, setNewReq] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Load inquiries
  useEffect(() => {
    const loadInquiries = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get('/v1/inquiries');
        setInquiries(res.data?.data ?? []);
      } catch (err) {
        console.error('Failed to load inquiries', err);
        toast.showToast('Failed to load inquiries', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadInquiries();
  }, []);

const handleUpdateInquiryField = async (rowId: string, field: keyof InquiryItem, value: any) => {
    const inquiry = inquiries.find(inq => inq.id === rowId);
    if (!inquiry) return;
    try {
      const payload: any = { [field]: value };
      if (field === 'status') payload.status = value;
      if (field === 'replied') payload.replied = value;
      if (field === 'interest_level') payload.interest_level = value;
      if (field === 'notes') payload.notes = value;

      const res = await apiClient.put(`/v1/inquiries/${rowId}`, payload);
      if (res.data?.success) {
        setInquiries(prev => prev.map(inq => inq.id === rowId ? { ...inq, [field]: value } : inq));
      }
    } catch (err) {
      console.error('Failed to update inquiry', err);
      toast.showToast('Failed to update inquiry', 'error');
    }
  };

  const handleDeleteRow = (id: string, name: string) => {
    setDeleteConfirm({ id, name });
  };

  const confirmDeleteRow = async () => {
    if (!deleteConfirm) return;
    try {
      const res = await apiClient.delete(`/v1/inquiries/${deleteConfirm.id}`);
      if (res.data?.success) {
        setInquiries(prev => prev.filter(inq => inq.id !== deleteConfirm.id));
        toast.showToast('Inquiry deleted successfully', 'success');
      }
    } catch (err) {
      console.error('Failed to delete inquiry', err);
      toast.showToast('Failed to delete inquiry', 'error');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const cancelDeleteRow = () => {
    setDeleteConfirm(null);
  };

  const handleAddManualInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!newName.trim()) errors.name = 'Client name is required';
    if (!newPhone.trim()) errors.phone = 'Phone number is required';
    if (!newProject.trim()) errors.project = 'Project is required';
    if (!newLocation.trim()) errors.location = 'Location is required';
    if (!newBudget.trim()) errors.budget = 'Budget is required';
    if (!newReq.trim()) errors.requirement = 'Requirement is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.showToast('Please fill all required fields.', 'warning');
      return;
    }

    setFormErrors({});

    try {
      const payload = {
        name: newName,
        phone: newPhone,
        project: newProject,
        location: newLocation,
        budget: parseFloat(newBudget.replace(/[^0-9]/g, '')) || 0,
        requirement: newReq,
        interest_level: 'High',
      };

      const res = await apiClient.post('/v1/inquiries', payload);
      if (res.data?.success) {
        setInquiries(prev => [res.data.data, ...prev]);
        setNewName('');
        setNewPhone('');
        setNewProject('');
        setNewLocation('');
        setNewBudget('');
        setNewReq('');
        setIsFormOpen(false);
        toast.showToast('Inquiry added successfully', 'success');
      }
    } catch (err) {
      console.error('Failed to add inquiry', err);
      toast.showToast('Failed to add inquiry', 'error');
    }
  };

  const filtered = inquiries.filter(inq => 
    inq.name.toLowerCase().includes(search.toLowerCase()) ||
    inq.phone.includes(search) ||
    inq.project.toLowerCase().includes(search.toLowerCase()) ||
    inq.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans">
      
      {/* Upper header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-6 rounded-2xl border border-border shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <div className="h-9 w-9 bg-success/5 rounded-xl flex items-center justify-center text-success">
              <FileSpreadsheet size={18} />
            </div>
            <h2 className="text-lg font-extrabold text-text-primary tracking-tight">Customer Inquiry Spreadsheet</h2>
          </div>
<p className="text-xs text-text-secondary mt-1">Real-time ledger matching customer website forms, site visit bookings, call requests, and interactive triggers.</p>
        </div>
      </div>

{/* Manual Quick Add Form */}
      {!isFormOpen ? (
        <button
          type="button"
          onClick={() => setIsFormOpen(true)}
          className="w-full bg-surface border border-border rounded-2xl p-5 shadow-sm space-y-4 cursor-pointer hover:border-primary/50 transition-colors"
        >
          <h3 className="text-xs font-black uppercase text-text-secondary tracking-wider">Quick Append Spreadsheet Row</h3>
          <p className="text-xs text-text-secondary">Click here to append a new row</p>
        </button>
      ) : (
        <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase text-text-secondary tracking-wider">Quick Append Spreadsheet Row</h3>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="text-[10px] text-text-secondary hover:text-text-primary cursor-pointer"
            >
              Cancel
            </button>
          </div>
          <form onSubmit={handleAddManualInquiry} className="grid grid-cols-1 sm:grid-cols-7 gap-3.5">
          <div className="sm:col-span-1 flex flex-col space-y-1">
            <input
              type="text"
              placeholder="Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none"
            />
            {formErrors.name && (
              <span className="text-[10px] text-danger">{formErrors.name}</span>
            )}
          </div>
          <div className="sm:col-span-1 flex flex-col space-y-1">
            <input
              type="text"
              placeholder="Phone"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              className="bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none"
            />
            {formErrors.phone && (
              <span className="text-[10px] text-danger">{formErrors.phone}</span>
            )}
          </div>
          <div className="sm:col-span-1 flex flex-col space-y-1">
            <input
              type="text"
              placeholder="Project"
              value={newProject}
              onChange={(e) => setNewProject(e.target.value)}
              className="bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none"
            />
            {formErrors.project && (
              <span className="text-[10px] text-danger">{formErrors.project}</span>
            )}
          </div>
          <div className="sm:col-span-1 flex flex-col space-y-1">
            <input
              type="text"
              placeholder="Location"
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              className="bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none"
            />
            {formErrors.location && (
              <span className="text-[10px] text-danger">{formErrors.location}</span>
            )}
          </div>
          <div className="sm:col-span-1 flex flex-col space-y-1">
            <input
              type="text"
              placeholder="Budget"
              value={newBudget}
              onChange={(e) => setNewBudget(e.target.value)}
              className="bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none"
            />
            {formErrors.budget && (
              <span className="text-[10px] text-danger">{formErrors.budget}</span>
            )}
          </div>
          <div className="sm:col-span-1 flex flex-col space-y-1">
            <input
              type="text"
              placeholder="Requirement"
              value={newReq}
              onChange={(e) => setNewReq(e.target.value)}
              className="bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none"
            />
            {formErrors.requirement && (
              <span className="text-[10px] text-danger">{formErrors.requirement}</span>
            )}
          </div>
          <button
            type="submit"
            className="sm:col-span-1 bg-gradient-to-r from-success to-success/80 text-text-primary font-extrabold text-[11px] uppercase tracking-wider rounded-xl shadow-md shadow-success/10 cursor-pointer hover:scale-[1.01] active:scale-95 transition-all"
          >
            Save
          </button>
        </form>
      </div>
      )}

      {/* Grid Filter Search & Spreadsheet Grid View */}
      <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden">
        
        {/* Spreadsheet search bar */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-surface">
          <div className="relative w-72">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-text-secondary">
              <Search size={13} />
            </span>
            <input
              type="text"
              placeholder="Search ledger rows..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface border border-border text-text-primary placeholder-text-secondary rounded-xl pl-9 pr-4 py-1.5 text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
            />
          </div>
          <span className="text-[10px] text-text-secondary font-mono">
            Showing <strong className="text-text-primary">{filtered.length}</strong> of {inquiries.length} spreadsheet records
          </span>
        </div>

        {/* Excel GRID Container */}
        <div className="overflow-x-auto max-w-full">
          <table className="w-full border-collapse text-left text-xs font-sans">
            
{/* Excel Headers A, B, C, D... */}
            <thead>
              <tr className="bg-bg-app border-b border-border select-none">
                <th className="w-12 text-center border-r border-border font-mono text-[10px] text-text-secondary py-1 bg-surface"></th>
                <th className="px-4 py-2 border-r border-border font-mono text-[10px] text-text-secondary uppercase">Client Name</th>
                <th className="px-4 py-2 border-r border-border font-mono text-[10px] text-text-secondary uppercase">Phone</th>
                <th className="px-4 py-2 border-r border-border font-mono text-[10px] text-text-secondary uppercase">Project</th>
                <th className="px-4 py-2 border-r border-border font-mono text-[10px] text-text-secondary uppercase">Location</th>
                <th className="px-4 py-2 border-r border-border font-mono text-[10px] text-text-secondary uppercase">Budget</th>
                <th className="px-4 py-2 border-r border-border font-mono text-[10px] text-text-secondary uppercase">Requirement</th>
                <th className="px-4 py-2 border-r border-border font-mono text-[10px] text-text-secondary uppercase w-32">Replied Status</th>
                <th className="px-4 py-2 border-r border-border font-mono text-[10px] text-text-secondary uppercase w-36">Interest Level</th>
                <th className="px-4 py-2 border-r border-border font-mono text-[10px] text-text-secondary uppercase">Action Notes</th>
                <th className="px-8 py-2 text-center w-20 font-mono text-[10px] text-text-secondary uppercase">Edit</th>
              </tr>
            </thead>

            {/* Excel Grid Body */}
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-text-secondary">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-medium">Loading inquiries...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-text-secondary">
                    <div className="flex flex-col items-center space-y-2">
                      <FileSpreadsheet size={24} className="text-text-secondary/50" />
                      <span className="text-xs font-medium">No inquiries found</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.map((item, idx) => {
                const rowNum = idx + 1;
                return (
                  <tr key={item.id} className="hover:bg-surface/80 transition-colors">
                    
                    {/* Row Index Number */}
                    <td className="w-12 text-center font-mono text-[10px] text-text-secondary border-r border-border bg-surface py-3.5 select-none font-bold">
                      {rowNum}
                    </td>

                    {/* Client Name cell */}
                    <td 
                      className={`px-4 py-2.5 border-r border-border font-medium ${
                        activeCell?.rowId === item.id && activeCell?.colName === 'name' ? 'bg-primary/5 ring-1 ring-primary/20' : ''
                      }`}
                      onClick={() => setActiveCell({ rowId: item.id, colName: 'name' })}
                      onMouseMove={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setHoveredInquiry(item);
                        setHoverPosition({ x: e.clientX - rect.left + 12, y: e.clientY - rect.top + 12 });
                      }}
                      onMouseLeave={() => setHoveredInquiry(null)}
                    >
                      <input
                        type="text"
                        value={item.name || 'Unnamed Client'}
                        onChange={(e) => handleUpdateInquiryField(item.id, 'name', e.target.value)}
                        className="w-full bg-transparent focus:outline-none focus:bg-surface border-none rounded text-xs py-0.5 px-1 font-semibold text-text-primary"
                      />
                    </td>

                    {/* Phone cell */}
                    <td 
                      className={`px-4 py-2.5 border-r border-border font-mono text-text-secondary ${
                        activeCell?.rowId === item.id && activeCell?.colName === 'phone' ? 'bg-primary/5 ring-1 ring-primary/20' : ''
                      }`}
                      onClick={() => setActiveCell({ rowId: item.id, colName: 'phone' })}
                    >
                      <input
                        type="text"
                        value={item.phone}
                        onChange={(e) => handleUpdateInquiryField(item.id, 'phone', e.target.value)}
                        className="w-full bg-transparent focus:outline-none focus:bg-surface border-none rounded text-xs py-0.5 px-1"
                      />
                    </td>

                    {/* Project cell */}
                    <td 
                      className="px-4 py-2.5 border-r border-border text-text-primary font-semibold"
                    >
                      <input
                        type="text"
                        value={item.project}
                        onChange={(e) => handleUpdateInquiryField(item.id, 'project', e.target.value)}
                        className="w-full bg-transparent focus:outline-none focus:bg-surface border-none rounded text-xs py-0.5 px-1 text-text-primary"
                      />
                    </td>

                    {/* Location cell */}
                    <td 
                      className="px-4 py-2.5 border-r border-border text-text-primary"
                    >
                      <input
                        type="text"
                        value={item.location}
                        onChange={(e) => handleUpdateInquiryField(item.id, 'location', e.target.value)}
                        className="w-full bg-transparent focus:outline-none focus:bg-surface border-none rounded text-xs py-0.5 px-1"
                      />
                    </td>

                    {/* Budget cell */}
                    <td 
                      className="px-4 py-2.5 border-r border-border font-mono font-bold text-text-primary"
                    >
                      <span className="text-text-secondary">₹</span> {typeof item.budget === 'number' ? (item.budget / 100000).toFixed(1) + ' Lakhs' : item.budget}
                    </td>

                    {/* Requirement cell */}
                    <td 
                      className="px-4 py-2.5 border-r border-border text-text-secondary"
                    >
                      <input
                        type="text"
                        value={item.requirement}
                        onChange={(e) => handleUpdateInquiryField(item.id, 'requirement', e.target.value)}
                        className="w-full bg-transparent focus:outline-none focus:bg-surface border-none rounded text-xs py-0.5 px-1 text-text-secondary"
                      />
                    </td>

                    {/* Replied Status Cell */}
                    <td className="px-4 py-2.5 border-r border-border">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={item.replied}
                          onChange={(e) => handleUpdateInquiryField(item.id, 'replied', e.target.checked)}
                          className="h-3.5 w-3.5 rounded border-border text-success focus:ring-success/20 cursor-pointer"
                        />
                        <span className={`text-[10px] font-black uppercase tracking-wider ${
                          item.replied 
                            ? 'text-success bg-success/5 border border-success/20 px-2.5 py-0.5 rounded-full' 
                            : 'text-danger bg-danger/5 border border-danger/20 px-2.5 py-0.5 rounded-full animate-pulse'
                        }`}>
                          {item.replied ? 'REPLIED' : 'PENDING'}
                        </span>
                      </div>
                    </td>

                    {/* Interest level selection */}
                    <td className="px-4 py-2.5 border-r border-border">
                      <select
                        value={item.interest_level || 'High'}
                        onChange={(e) => handleUpdateInquiryField(item.id, 'interest_level', e.target.value)}
                        className={`w-full bg-surface border border-border rounded-lg px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider focus:outline-none ${
                          item.interest_level === 'High' || item.interest_level === 'VIP' ? 'text-warning font-black bg-warning/5' : 'text-text-secondary'
                        }`}
                      >
                        <option value="VIP">⭐ VIP Client</option>
                        <option value="High">🔥 High Interest</option>
                        <option value="Medium">⚡ Medium</option>
                        <option value="Low">💤 Cold</option>
                        <option value="Not Interested">❌ Closed</option>
                      </select>
                    </td>

                    {/* Action notes column */}
                    <td 
                      className="px-4 py-2.5 border-r border-border"
                    >
                      <input
                        type="text"
                        value={item.notes || ''}
                        placeholder="Type updates, followups..."
                        onChange={(e) => handleUpdateInquiryField(item.id, 'notes', e.target.value)}
                        className="w-full bg-transparent focus:outline-none focus:bg-surface border-none rounded text-xs py-0.5 px-1 italic text-text-secondary"
                      />
                    </td>

                    {/* Delete action row */}
                    <td className="px-4 py-2.5 text-center">
                      <button
                        onClick={() => handleDeleteRow(item.id, item.name)}
                        className="p-1.5 text-text-secondary hover:text-danger rounded hover:bg-bg-app transition-all cursor-pointer"
                        title="Delete Inquiry Record"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>

                  </tr>
                );
              })}
            </tbody>

          </table>
        </div>

      </div>

      {/* Hover Tooltip for Inquiry Details */}
      {hoveredInquiry && (
        <div
          className="fixed z-[999] pointer-events-none bg-surface border border-border rounded-xl shadow-xl p-3 text-xs max-w-xs"
          style={{
            left: hoverPosition.x + 'px',
            top: hoverPosition.y + 'px',
          }}
        >
          <div className="space-y-1.5">
            <div>
              <span className="text-[9px] text-text-secondary uppercase font-bold">Client Name</span>
              <p className="text-text-primary font-semibold">{hoveredInquiry.name}</p>
            </div>
            <div>
              <span className="text-[9px] text-text-secondary uppercase font-bold">Phone</span>
              <p className="text-text-primary font-mono">{hoveredInquiry.phone || 'N/A'}</p>
            </div>
            <div>
              <span className="text-[9px] text-text-secondary uppercase font-bold">Email</span>
              <p className="text-text-primary break-all">{hoveredInquiry.email || 'N/A'}</p>
            </div>
            <div>
              <span className="text-[9px] text-text-secondary uppercase font-bold">Address</span>
              <p className="text-text-primary">{hoveredInquiry.address || 'N/A'}</p>
            </div>
            <div>
              <span className="text-[9px] text-text-secondary uppercase font-bold">Project</span>
              <p className="text-text-primary">{hoveredInquiry.project || 'N/A'}</p>
            </div>
            <div>
              <span className="text-[9px] text-text-secondary uppercase font-bold">Location</span>
              <p className="text-text-primary">{hoveredInquiry.location || 'N/A'}</p>
            </div>
            <div>
              <span className="text-[9px] text-text-secondary uppercase font-bold">Source</span>
              <p className="text-text-primary">{hoveredInquiry.source || 'N/A'}</p>
            </div>
            <div>
              <span className="text-[9px] text-text-secondary uppercase font-bold">Budget</span>
              <p className="text-text-primary font-mono font-bold">₹ {hoveredInquiry.budget || 0}</p>
            </div>
            <div>
              <span className="text-[9px] text-text-secondary uppercase font-bold">Requirement</span>
              <p className="text-text-primary">{hoveredInquiry.requirement || 'N/A'}</p>
            </div>
            <div>
              <span className="text-[9px] text-text-secondary uppercase font-bold">Interest</span>
              <p className="text-text-primary">{hoveredInquiry.interest_level || 'N/A'}</p>
            </div>
            <div>
              <span className="text-[9px] text-text-secondary uppercase font-bold">Status</span>
              <p className="text-text-primary">{hoveredInquiry.status || 'N/A'}</p>
            </div>
            <div>
              <span className="text-[9px] text-text-secondary uppercase font-bold">Follow-up</span>
              <p className="text-text-primary">{hoveredInquiry.follow_up || 'N/A'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={cancelDeleteRow} />
          <div className="relative w-full max-w-md bg-surface border border-border rounded-2xl shadow-xl z-10 p-6">
            <h3 className="text-lg font-bold text-text-primary mb-2">Delete Inquiry?</h3>
            <p className="text-sm text-text-secondary mb-4">
              Are you sure you want to delete the inquiry for <span className="font-semibold text-text-primary">{deleteConfirm.name}</span>? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3 pt-4 border-t border-border">
              <button
                onClick={cancelDeleteRow}
                className="bg-surface border border-border hover:bg-bg-app text-text-primary px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteRow}
                className="bg-danger hover:bg-danger/90 text-text-primary font-bold text-xs px-4 py-2 rounded-xl shadow-lg shadow-danger/10 transition-all cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default InquirySpreadsheet;







