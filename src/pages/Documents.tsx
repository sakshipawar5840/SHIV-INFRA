import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '../lib/axiosClient';
import { DocumentItem } from '../types';
import { Dialog } from '../components/Dialog';
import { Plus, Search, FileText, Download, Trash2, FolderOpen, AlertCircle, UploadCloud } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

export const Documents: React.FC = () => {
  const toast = useToast();
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formFileSelected, setFormFileSelected] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadDocs = async () => {
      try {
        const res = await apiClient.get('/v1/documents');
        setDocs(res.data?.data ?? []);
      } catch (err) {
        console.error('Failed to load documents', err);
        toast.showToast('Failed to load documents', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadDocs();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.showToast('Only PDF documents are allowed.', 'error');
        e.target.value = '';
        return;
      }
      setFormName(file.name.replace(/\.pdf$/i, ''));
      setFormFileSelected(true);
    }
  };

  const handleAddDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formFileSelected) errors.file = 'Please upload a PDF document.';
    if (!formName.trim()) errors.name = 'Document name is required';
    if (!formCategory) errors.category = 'Category is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.showToast('Please fill all required fields.', 'warning');
      return;
    }

    setFormErrors({});

    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast.showToast('Please select a file', 'error');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_name', formName.endsWith('.pdf') ? formName : `${formName}.pdf`);
      formData.append('document_type', file.type);

      const res = await apiClient.post('/v1/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success) {
        setDocs(prev => [res.data.data, ...prev]);
        toast.showToast('Document uploaded successfully', 'success');
        setIsAddOpen(false);
        setFormName('');
        setFormCategory('');
        setFormFileSelected(false);
        setFormErrors({});
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Failed to upload document', err);
      toast.showToast('Failed to upload document', 'error');
    }
  };

  const handleDeleteDoc = (id: string, name: string) => {
    const doc = docs.find(d => d.id === id);
    setSelectedDoc(doc || null);
    setIsDeleteOpen(true);
  };

  const handleEditDoc = (doc: DocumentItem) => {
    setSelectedDoc(doc);
    setEditName(doc.document_name);
    setEditCategory(doc.document_type || '');
    setEditErrors({});
    setIsEditOpen(true);
  };

  const handleUpdateDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!editName.trim()) errors.name = 'Document name is required';

    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }

    setEditErrors({});

    if (!selectedDoc) return;

    try {
      const res = await apiClient.put(`/v1/documents/${selectedDoc.id}`, {
        document_name: editName.endsWith('.pdf') ? editName : `${editName}.pdf`,
        document_type: editCategory || selectedDoc.document_type,
      });

      if (res.data?.success) {
        setDocs(prev => prev.map(d => d.id === selectedDoc.id ? { ...d, ...res.data.data } : d));
        toast.showToast('Document updated successfully', 'success');
        setIsEditOpen(false);
        setSelectedDoc(null);
      }
    } catch (err) {
      console.error('Failed to update document', err);
      toast.showToast('Failed to update document', 'error');
    }
  };

  const confirmDeleteDoc = async () => {
    if (!selectedDoc) return;
    try {
      const res = await apiClient.delete(`/v1/documents/${selectedDoc.id}`);
      if (res.data?.success) {
        setDocs(prev => prev.filter(d => d.id !== selectedDoc.id));
        toast.showToast('Document deleted successfully', 'success');
      }
    } catch (err) {
      console.error('Failed to delete document', err);
      toast.showToast('Failed to delete document', 'error');
    } finally {
      setIsDeleteOpen(false);
      setSelectedDoc(null);
    }
  };

  const handleDownload = async (doc: DocumentItem) => {
    try {
      const res = await apiClient.get(`/v1/documents/${doc.file_url}/signed-url`);
      if (res.data?.data?.signedUrl) {
        window.open(res.data.data.signedUrl, '_blank');
      }
    } catch (err) {
      console.error('Failed to get download link', err);
      toast.showToast('Failed to get download link', 'error');
    }
  };

  const filteredDocs = docs.filter(d =>
    (d.document_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (d.document_type || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 text-text-primary font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-text-primary">Document Vault</h2>
          <p className="text-xs text-text-secondary mt-0.5">Store permits, drawings, NOCs, and client agreements with encrypted cloud backup.</p>
        </div>
        <button
          onClick={() => {
            setFormName('');
            setFormCategory('');
            setFormFileSelected(false);
            setFormErrors({});
            setIsAddOpen(true);
          }}
          className="flex items-center space-x-1.5 bg-primary text-white font-medium text-xs px-4 py-2.5 rounded-xl shadow-lg cursor-pointer"
        >
          <Plus size={14} />
          <span>Upload Document</span>
        </button>
      </div>

      <div className="bg-surface border border-border p-4 rounded-2xl">
        <div className="relative max-w-sm">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-text-secondary">
            <Search size={14} />
          </div>
          <input
            type="text"
            placeholder="Search documents by name or category..."
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
                <th className="py-3 px-4">Document Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Size</th>
                <th className="py-3 px-4">Uploaded</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-text-secondary font-mono">
              {filteredDocs.map(doc => (
                <tr key={doc.id} className="hover:bg-bg-app transition-colors">
                  <td className="py-3.5 px-4 font-sans font-bold text-text-primary flex items-center space-x-2">
                    <FileText size={14} className="text-primary" />
                    <span>{doc.document_name}</span>
                  </td>
                  <td className="py-3.5 px-4"><span className="bg-surface px-2 py-0.5 rounded border border-border text-text-secondary">{doc.document_type || '—'}</span></td>
                  <td className="py-3.5 px-4 text-text-secondary">{doc.file_size ? (doc.file_size / 1024).toFixed(1) : '—'} KB</td>
                  <td className="py-3.5 px-4 text-text-secondary">{doc.created_at ? new Date(doc.created_at).toLocaleDateString('en-IN') : '—'}</td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <button onClick={() => handleDownload(doc)} className="text-primary hover:text-primary-hover p-1 hover:bg-bg-app rounded transition-all cursor-pointer" title="Download">
                        <Download size={13} />
                      </button>
                      <button onClick={() => handleEditDoc(doc)} className="text-primary hover:text-primary-hover p-1 hover:bg-bg-app rounded transition-all cursor-pointer" title="Edit">
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                      </button>
                      <button onClick={() => handleDeleteDoc(doc.id, doc.document_name)} className="text-text-secondary hover:text-danger p-1 hover:bg-bg-app rounded transition-all cursor-pointer" title="Delete">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredDocs.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-text-secondary">No documents found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Upload Document">
        <form onSubmit={handleAddDoc} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Upload PDF Document</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none"
            />
            {formErrors.file && <p className="text-[10px] text-danger mt-1">{formErrors.file}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Document Name</label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Building Permit - Phase 1"
              className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Category</label>
            <select
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value)}
              className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none"
            >
              <option value="">Select Category</option>
              <option value="Permits">Permits</option>
              <option value="Drawings">Drawings</option>
              <option value="NOC">NOC</option>
              <option value="Agreements">Agreements</option>
              <option value="Reports">Reports</option>
            </select>
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
              Upload
            </button>
          </div>
        </form>
      </Dialog>

      <Dialog isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Document">
        <form onSubmit={handleUpdateDoc} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Document Name</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="e.g. Building Permit - Phase 1"
              className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none"
            />
            {editErrors.name && <p className="text-[10px] text-danger mt-1">{editErrors.name}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Category</label>
            <select
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value)}
              className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none"
            >
              <option value="">Select Category</option>
              <option value="Permits">Permits</option>
              <option value="Drawings">Drawings</option>
              <option value="NOC">NOC</option>
              <option value="Agreements">Agreements</option>
              <option value="Reports">Reports</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="bg-surface border border-border hover:bg-surface text-text-secondary hover:text-text-primary px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-primary text-white font-medium text-xs px-4 py-2 rounded-xl shadow-lg cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Dialog>

      <Dialog isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete Document">
        <div className="space-y-4 font-sans">
          <p className="text-sm text-text-secondary">
            Are you sure you want to delete <span className="font-semibold text-text-primary">{selectedDoc?.document_name}</span>?
          </p>
          <div className="bg-danger/5 border border-danger/20 p-3 rounded-xl text-xs text-danger flex items-start space-x-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>This action cannot be undone. The document will be permanently removed.</span>
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
              onClick={confirmDeleteDoc}
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
