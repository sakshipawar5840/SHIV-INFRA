import React, { useState, useEffect, useRef } from 'react';
import { getStoredData, saveStoredData, INITIAL_DOCUMENTS, logSystemAction } from '../lib/mockData';
import { DocumentItem } from '../types';
import { Dialog } from '../components/Dialog';
import { Plus, Search, FileText, Download, Trash2, FolderOpen, AlertCircle, UploadCloud } from 'lucide-react';

export const Documents: React.FC = () => {
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Blueprints');
  const [formSize, setFormSize] = useState('4.5 MB');

  useEffect(() => {
    setDocs(getStoredData<DocumentItem[]>('documents', INITIAL_DOCUMENTS));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormName(file.name);
      const sizeInMB = file.size / (1024 * 1024);
      setFormSize(`${sizeInMB.toFixed(2)} MB`);
    }
  };

  const handleSaveDocs = (data: DocumentItem[]) => {
    setDocs(data);
    saveStoredData('documents', data);
  };

  const handleAddDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) return;

    const newDoc: DocumentItem = {
      id: `doc_${Date.now()}`,
      name: formName.endsWith('.pdf') ? formName : `${formName}.pdf`,
      category: formCategory,
      size: formSize,
      type: 'PDF',
      uploaded_at: new Date().toISOString().split('T')[0]
    };

    const updated = [newDoc, ...docs];
    handleSaveDocs(updated);
    logSystemAction('Create', `Municipal document registered inside vault: "${formName}"`);
    setIsAddOpen(false);
  };

  const handleDeleteDoc = (id: string, name: string) => {
    const updated = docs.filter(d => d.id !== id);
    handleSaveDocs(updated);
    logSystemAction('Delete', `Document "${name}" unlinked from vault`);
  };

  const simulateDownload = (name: string) => {
    // Basic browser trigger
    logSystemAction('Access', `Downloaded secure file "${name}" from server vault`);
    alert(`File downloading started locally: ${name}`);
  };

  const filteredDocs = docs.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Legal Document Vault</h2>
          <p className="text-xs text-slate-400 mt-0.5">Secure repository for site blueprints, RERA legal approvals, municipal NOCs, and financial audits.</p>
        </div>
        <button
          onClick={() => {
            setFormName('');
            setIsAddOpen(true);
          }}
          className="flex items-center space-x-1.5 bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-medium text-xs px-4 py-2.5 rounded-xl shadow-lg cursor-pointer"
        >
          <Plus size={14} />
          <span>Upload Document</span>
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
            placeholder="Search document names, legal categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-500 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none"
          />
        </div>
      </div>

      {/* Grid listing */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredDocs.map(doc => (
          <div key={doc.id} className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 hover:border-sky-500/40 transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-start space-x-3.5 pb-3 border-b border-slate-800/50">
                <div className="h-10 w-10 bg-slate-950 rounded-xl flex items-center justify-center text-sky-400 border border-slate-800 shrink-0">
                  <FolderOpen size={18} className="animate-pulse" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-200 truncate" title={doc.name}>{doc.name}</h4>
                  <span className="text-[10px] text-slate-500 font-semibold">{doc.category}</span>
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                <span>File Size: {doc.size}</span>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 px-2 py-0.5 rounded-full font-bold">SSL Secure</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-850 mt-4">
              <button
                onClick={() => simulateDownload(doc.name)}
                className="flex items-center space-x-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[10px] font-bold px-2.5 py-1.5 rounded-lg"
              >
                <Download size={11} className="text-sky-400" />
                <span>Download File</span>
              </button>
              <button
                onClick={() => handleDeleteDoc(doc.id, doc.name)}
                className="text-slate-500 hover:text-rose-400 p-1 hover:bg-slate-800 rounded transition-all cursor-pointer"
                title="Remove File"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Dialog isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Upload PDF Legal Approval / Blueprint">
        <form onSubmit={handleAddDoc} className="space-y-4 font-sans">
          
          {/* OS File Picker Panel */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-800 rounded-2xl p-6 text-center hover:border-sky-500/50 hover:bg-sky-500/5 transition-all bg-slate-950/40 cursor-pointer select-none group"
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden"
              accept=".pdf,.png,.xlsx,.csv,.jpg,.jpeg"
            />
            <UploadCloud size={32} className="mx-auto text-sky-400 mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="text-xs font-bold text-slate-200">Browse file from your system</h4>
            <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">Click to open native file browser. Automatically extracts name & size.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Document File Name</label>
            <input
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. skyline_heights_fire_noc"
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2 text-xs focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Category</label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none"
              >
                <option value="Blueprints">Site Blueprints / CAD plans</option>
                <option value="Legal Approvals">Municipal NOCs & Legal Approvals</option>
                <option value="Financial Ledgers">Financial ledgers & audits</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Simulated File Size</label>
              <input
                type="text"
                required
                value={formSize}
                onChange={(e) => setFormSize(e.target.value)}
                placeholder="e.g. 5.4 MB"
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2 text-xs focus:outline-none font-mono"
              />
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
              className="bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-medium text-xs px-4 py-2 rounded-xl shadow-lg cursor-pointer"
            >
              Secure Upload
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
export default Documents;
