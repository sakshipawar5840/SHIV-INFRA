import React, { useState, useEffect } from 'react';
import { createActivityLog } from '../lib/activityLogService';
import { createInquiry, fetchInquiries } from '../lib/inquiryService';
import { apiClient } from '../lib/axiosClient';
import { Project } from '../types';
import { Dialog } from '../components/Dialog';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { 
  Plus, 
  Search, 
  Building2, 
  MapPin, 
  Calculator, 
  Layers, 
  Trash2, 
  Edit2, 
  Calendar, 
  FileText, 
  Upload, 
  Check, 
  AlertTriangle,
  Download,
  Phone,
  Info,
  ExternalLink,
  MessageSquare,
  Sparkles
} from 'lucide-react';

export const Projects: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role !== 'Customer';
  const toast = useToast();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('name');
  
  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Customer detailed view modal state
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [detailedProject, setDetailedProject] = useState<Project | null>(null);

  // Contact / Enquiry form state
  const [contactName, setContactName] = useState(user?.name || '');
  const [contactPhone, setContactPhone] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSuccess, setContactSuccess] = useState(false);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formFlatType, setFormFlatType] = useState('');
  const [formSqft, setFormSqft] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formStatus, setFormStatus] = useState<'Planning' | 'Ongoing' | 'Completed' | 'Upcoming' | ''>('');
  const [formProgress, setFormProgress] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCompletionStatus, setFormCompletionStatus] = useState('');
  const [formPossessionDate, setFormPossessionDate] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Loaded from storage
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const res = await apiClient.get('/v1/projects');
        setProjects(res.data?.data ?? []);
      } catch (err) {
        console.error('Failed to load projects from API', err);
        toast.showToast('Failed to load projects', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadProjects();
  }, []);

  // Browser file picker base64 reader to select images locally
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const openAddModal = () => {
    setFormName('');
    setFormLocation('');
    setFormFlatType('');
    setFormSqft('');
    setFormPrice('');
    setFormStatus('');
    setFormProgress('');
    setFormDescription('');
    setFormCompletionStatus('');
    setFormPossessionDate('');
    setFormImageUrl('');
    setFormErrors({});
    setIsAddOpen(true);
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    
    if (!formName.trim()) errors.name = 'Project name is required';
    if (!formLocation.trim()) errors.location = 'Location is required';
    if (!formFlatType.trim()) errors.flatType = 'Flat configuration is required';
    if (!formSqft.trim()) errors.sqft = 'Size/area is required';
    if (!formPrice || Number(formPrice) <= 0) errors.price = 'Enter a valid price';
    if (!formStatus) errors.status = 'Status is required';
    if (!formCompletionStatus.trim()) errors.completionStatus = 'Completion milestone is required';
    if (!formPossessionDate) errors.possessionDate = 'Possession date is required';
    if (!formDescription.trim()) errors.description = 'Project description is required';
    if (formProgress === '' || Number(formProgress) < 0 || Number(formProgress) > 100) errors.progress = 'Progress must be between 0 and 100';
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.showToast('Please fill all required fields.', 'warning');
      return;
    }
    
    setFormErrors({});

try {
      const payload: any = {
        project_name: formName,
        location: formLocation,
        flat_type: formFlatType,
        sqft: String(formSqft),
        price: Number(formPrice),
        status: formStatus,
        description: formDescription,
        progress: Number(formProgress),
        completion_status: formCompletionStatus,
        possession_date: formPossessionDate,
        brochure_pdf_url: formImageUrl,
      };

      await apiClient.post('/v1/projects', payload);

      toast.showToast('Project created successfully', 'success');
      setIsAddOpen(false);
      setFormName('');
      setFormLocation('');
      setFormFlatType('');
      setFormSqft('');
      setFormPrice('');
      setFormStatus('');
      setFormProgress('');
      setFormDescription('');
      setFormCompletionStatus('');
      setFormPossessionDate('');
      setFormImageUrl('');
      setFormErrors({});

      const res = await apiClient.get('/v1/projects');
      setProjects(res.data?.data ?? []);
    } catch (err: any) {
      console.error('Failed to create project', err);
      toast.showToast(err.response?.data?.message || 'Failed to create project', 'error');
    }
  };

  const handleDownloadBrochure = (project: Project) => {
    const textLines = [
      `==================================================`,
      `          SHIV INFRA CO. - OFFICIAL BROCHURE      `,
      `==================================================\n`,
      `PROJECT NAME       : ${project.project_name}`,
      `DEVELOPER          : SHIV INFRA AI SYSTEMS`,
      `LOCATION           : ${project.location}`,
      `CONFIGURATIONS     : ${(project.flat_types?.[0] || "")}`,
      `DIMENSIONS         : ${(project.area_sqft || "")}`,
      `STARTING VALUATION : INR ${project.price.toLocaleString('en-IN')}`,
      `TARGET POSSESSION  : ${'2027-12-31'}`,
      `CURRENT STATUS     : ${project.status} (${0}% Complete)`,
      `MILESTONE          : ${'Under Civil Casting'}\n`,
      `--------------------------------------------------`,
      `              PREMIUM SITE AMENITIES              `,
      `--------------------------------------------------`,
      `• Premium Swimming Pool with Wooden Sun Deck`,
      `• Solar Rooftop Panel Energy Grid Integration`,
      `• State-of-the-Art Crossfit Gymnasium`,
      `• Landscaped Multipurpose Jogging Track`,
      `• 24/7 Automated Security with CCTV Matrix`,
      `• Rainwater Harvesting & Greywater Recycling\n`,
      `--------------------------------------------------`,
      `             NEIGHBORHOOD CONNECTIVITY            `,
      `--------------------------------------------------`,
      `• Proximity to National Highway (5 mins)`,
      `• Nearby High-tech IT SEZ Corridors`,
      `• Metro Station and Rapid Transport (10 mins)\n`,
      `==================================================`,
      `Thank you for choosing SHIV INFRA - Building Dreams`,
      `For bookings, contact us directly on WhatsApp or Email`,
      `==================================================`
    ];
    const element = document.createElement("a");
    const file = new Blob([textLines.join("\n")], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `ShivInfra_${project.project_name.replace(/\s+/g, '_')}_Brochure.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    createActivityLog('Access', `Brochure downloaded successfully for project ${project.project_name}`, 'User').catch(() => {});
  };

  const handleSubmitEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactPhone || !detailedProject) return;

    try {
      // Create inquiry via backend API
      await createInquiry({
        name: contactName,
        phone: contactPhone,
        project: detailedProject.project_name,
        location: detailedProject.location,
        requirement: detailedProject.flat_types?.[0] || '',
        status: 'New',
        notes: contactMessage || `Interested in ${detailedProject.flat_types?.[0] || ''} properties at ${detailedProject.project_name}.`,
      });

      createActivityLog('Create', `Enquiry recorded for customer ${contactName} regarding project ${detailedProject.project_name}`, contactName).catch(() => {});
      setContactSuccess(true);
      setTimeout(() => {
        setContactSuccess(false);
        setContactMessage('');
        setContactPhone('');
      }, 4000);
    } catch (error) {
      console.error('Failed to create inquiry:', error);
    }
  };

const openEditModal = (project: Project) => {
    setSelectedProject(project);
    setFormName(project.project_name);
    setFormLocation(project.location);
    setFormFlatType((project.flat_types?.[0] || ""));
    setFormSqft(String(project.area_sqft || ''));
    setFormPrice(String(project.price));
    setFormStatus(project.status);
    setFormProgress(String(project.progress || 0));
    setFormDescription(project.description);
    setFormCompletionStatus(project.completion_status || '');
    setFormPossessionDate(project.possession_date || '');
    setFormImageUrl(project.images?.[0] || '');
    setIsEditOpen(true);
  };

  const handleEditProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !formName || !formLocation) return;

    try {
      const payload: any = {
        project_name: formName,
        location: formLocation,
        flat_type: formFlatType,
        sqft: formSqft,
        price: Number(formPrice),
        status: formStatus,
        progress: Number(formProgress),
        description: formDescription,
        completion_status: formCompletionStatus,
        possession_date: formPossessionDate,
      };

      await apiClient.put(`/v1/projects/${selectedProject.id}`, payload);

      toast.showToast('Project updated successfully', 'success');
      setIsEditOpen(false);

      const res = await apiClient.get('/v1/projects');
      setProjects(res.data?.data ?? []);
    } catch (err: any) {
      console.error('Failed to update project', err);
      toast.showToast(err.response?.data?.message || 'Failed to update project', 'error');
    }
  };

  const openDeleteModal = (project: Project) => {
    setSelectedProject(project);
    setIsDeleteOpen(true);
  };

  const handleDeleteProject = async () => {
    if (!selectedProject) return;

    try {
      await apiClient.delete(`/v1/projects/${selectedProject.id}`);
      toast.showToast('Project deleted successfully', 'success');
      setIsDeleteOpen(false);

      const res = await apiClient.get('/v1/projects');
      setProjects(res.data?.data ?? []);
    } catch (err: any) {
      console.error('Failed to delete project', err);
      toast.showToast(err.response?.data?.message || 'Failed to delete project', 'error');
    }
  };

// Filter and Search logic
  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.project_name.toLowerCase().includes(search.toLowerCase()) || 
                          p.location.toLowerCase().includes(search.toLowerCase()) ||
                          p.description.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === 'name') return a.project_name.localeCompare(b.project_name);
    if (sortBy === 'price_asc') return a.price - b.price;
    if (sortBy === 'price_desc') return b.price - a.price;
    if (sortBy === 'progress') return (b.progress || 0) - (a.progress || 0);
    return 0;
  });

  return (
    <div className="space-y-6 text-text-primary">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-text-primary font-sans">
            Projects Directory
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            {isAdmin 
              ? 'Manage and monitor physical construction progress across sites.' 
              : 'Explore premiums projects, amenities, location plans, and download catalogs.'}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={openAddModal}
            className="flex items-center space-x-1.5 bg-primary text-white font-medium text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-primary/10 hover:shadow-primary/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <Plus size={14} />
            <span>Add Project</span>
          </button>
        )}
      </div>

      {/* Filter and Search queries */}
      <div className="bg-surface border border-border p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search bar */}
        <div className="flex-1 relative max-w-sm">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-text-secondary">
            <Search size={14} />
          </div>
          <input
            type="text"
            placeholder="Search project name or site..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface/80 border border-border text-text-primary placeholder-text-secondary rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-primary/80"
          />
        </div>

        {/* Tab-styled filters */}
        <div className="flex items-center space-x-2 overflow-x-auto shrink-0">
          {['All', 'Planning', 'Ongoing', 'Completed'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-primary/10 border-primary/20 text-primary'
                  : 'bg-surface border-border text-text-secondary hover:text-text-primary'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Sorting selection */}
        <div className="flex items-center space-x-2 shrink-0">
          <span className="text-[10px] text-text-secondary font-semibold uppercase tracking-wider">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-surface border border-border rounded-lg text-xs py-1.5 px-2.5 focus:outline-none focus:border-primary text-text-secondary"
          >
            <option value="name">Alphabetical</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="progress">Progress Completion</option>
          </select>
        </div>
      </div>

      {/* Grid listing */}
      {filteredProjects.length === 0 ? (
        <div className="bg-surface border border-border p-12 text-center rounded-2xl">
          <Building2 size={36} className="text-text-secondary mx-auto mb-3 animate-pulse" />
          <p className="text-sm font-semibold text-text-secondary">No projects match filters</p>
          <p className="text-xs text-text-secondary mt-1">Try resetting search parameters or create a new project above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProjects.map((p) => (
            <div
              key={p.id}
              className="bg-surface border border-border/80 rounded-2xl overflow-hidden hover:border-primary/40 transition-all flex flex-col group relative"
            >
              {/* Photo Banner */}
              <div className="h-44 w-full relative overflow-hidden bg-surface">
                <img
                  src={p.images?.[0] || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=400&q=80'}
                  alt={p.project_name}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface/80 via-surface/20 to-transparent" />
                
                {/* Badge status */}
                <span className={`absolute top-3 right-3 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  p.status === 'Completed' ? 'bg-success/5 border border-success/20 text-success' :
                  p.status === 'Ongoing' ? 'bg-primary/10 border border-primary/20 text-primary' :
                  p.status === 'Upcoming' ? 'bg-primary/10 border border-primary/20 text-primary' :
                  'bg-surface border border-border text-text-secondary'
                }`}>
                  {p.status}
                </span>

                {/* Overlaid Title and Info */}
                <div className="absolute bottom-3 left-4 right-4">
                  <h3 className="text-sm font-bold text-text-primary font-sans tracking-tight">{p.project_name}</h3>
                  <p className="text-[10px] text-text-secondary flex items-center mt-1">
                    <MapPin size={10} className="mr-1 text-danger" /> {p.location}
                  </p>
                </div>
              </div>

              {/* Grid content */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div className="space-y-3.5">
                  <p className="text-[11px] text-text-secondary line-clamp-2 leading-relaxed">{p.description}</p>
                  
                  {/* Metadata matrix */}
                  <div className="grid grid-cols-2 gap-2 border-y border-border/60 py-2.5 text-xs">
                    <div>
                      <p className="text-[9px] font-bold text-text-secondary uppercase tracking-wider">Unit Type</p>
                      <p className="text-text-secondary font-medium mt-0.5">{p.flat_types?.[0] || ""}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-text-secondary uppercase tracking-wider">Dimensions</p>
                      <p className="text-text-secondary font-medium mt-0.5">{p.area_sqft || ""}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-text-secondary uppercase tracking-wider">Start Valuation</p>
                      <p className="text-primary font-mono font-bold mt-0.5">
                        {p.price >= 10000000 ? `₹ ${(p.price / 10000000).toFixed(2)} Cr` : `₹ ${(p.price / 100000).toFixed(2)} L`}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-text-secondary uppercase tracking-wider">Target Possession</p>
                       <p className="text-text-secondary font-medium mt-0.5">{'N/A'}</p>
                    </div>
                  </div>

{/* Completion indicator */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px]">
                       <span className="text-text-secondary font-medium">{'Civil Casting'}</span>
                       <span className="font-mono text-primary font-bold">{(p.progress || 0)}%</span>
                      </div>
                      <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${p.progress || 0}%` }} />
                     </div>
                   </div>
                </div>

                {/* Interaction controls */}
                <div className="flex items-center justify-between space-x-2 mt-4 pt-3 border-t border-border/40 w-full">
                  {!isAdmin ? (
                    <button
                      onClick={() => {
                        setDetailedProject(p);
                        setContactSuccess(false);
                        setIsDetailsOpen(true);
                      }}
                      className="w-full flex items-center justify-center space-x-1.5 bg-primary/20 hover:from-primary hover:to-primary-hover border border-primary/30 text-primary hover:text-text-primary font-black text-[10px] py-2 px-3 rounded-xl uppercase tracking-wider transition-all duration-300 cursor-pointer active:scale-95"
                    >
                      <Sparkles size={11} />
                      <span>Explore & Brochure</span>
                    </button>
                  ) : (
                    <>
                      <span className="text-[9px] font-mono text-text-secondary">ADMIN CONTROLS</span>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 text-text-secondary hover:text-primary hover:bg-bg-app rounded-lg transition-colors cursor-pointer"
                          title="Edit Details"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => openDeleteModal(p)}
                          className="p-1.5 text-text-secondary hover:text-danger hover:bg-bg-app rounded-lg transition-colors cursor-pointer"
                          title="Remove Project"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DIALOG ADD modal panel */}
      <Dialog isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Register Construction Project">
        <form onSubmit={handleAddProject} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Project Name</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Skyline Heights"
                className={`w-full bg-surface border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary ${formErrors.name ? 'border-rose-500 text-danger' : 'border-border text-text-primary'}`}
              />
              {formErrors.name && <p className="text-[10px] text-danger mt-1">{formErrors.name}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Location</label>
              <input
                type="text"
                value={formLocation}
                onChange={(e) => setFormLocation(e.target.value)}
                placeholder="e.g. Baner, Pune"
                className={`w-full bg-surface border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary ${formErrors.location ? 'border-rose-500 text-danger' : 'border-border text-text-primary'}`}
              />
              {formErrors.location && <p className="text-[10px] text-danger mt-1">{formErrors.location}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Flat Configuration</label>
              <input
                type="text"
                value={formFlatType}
                onChange={(e) => setFormFlatType(e.target.value)}
                placeholder="e.g. 2 BHK, 3 BHK"
                className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Size/Area Dimension (Sqft)</label>
              <input
                type="text"
                value={formSqft}
                onChange={(e) => setFormSqft(e.target.value)}
                placeholder="e.g. 1000 - 1500 sqft"
                className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Estimated Valuation Price (INR)</label>
              <input
                type="number"
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                placeholder="e.g. 6000000"
                className={`w-full bg-surface border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary font-mono ${formErrors.price ? 'border-rose-500 text-danger' : 'border-border text-text-primary'}`}
              />
              {formErrors.price && <p className="text-[10px] text-danger mt-1">{formErrors.price}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Target Possession Date</label>
              <input
                type="date"
                value={formPossessionDate}
                onChange={(e) => setFormPossessionDate(e.target.value)}
                className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Status</label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as any)}
                className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary"
              >
                <option value="">Select Status</option>
                <option value="Planning">Planning</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Completion Milestones</label>
              <input
                type="text"
                value={formCompletionStatus}
                onChange={(e) => setFormCompletionStatus(e.target.value)}
                placeholder="e.g. Brickwork"
                className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Progress Ratio (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formProgress}
                onChange={(e) => setFormProgress(e.target.value)}
                className={`w-full bg-surface border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary font-mono ${formErrors.progress ? 'border-rose-500 text-danger' : 'border-border text-text-primary'}`}
              />
              {formErrors.progress && <p className="text-[10px] text-danger mt-1">{formErrors.progress}</p>}
            </div>
          </div>

          {/* Browser file input pick for images */}
          <div className="bg-surface border border-border rounded-xl p-4 space-y-3.5">
            <span className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">Project Cover Image / Render</span>
            <div className="flex flex-col sm:flex-row items-center sm:space-x-4 space-y-3 sm:space-y-0">
              <div className="h-16 w-24 rounded-lg overflow-hidden bg-surface border border-border">
                {formImageUrl ? (
                  <img src={formImageUrl} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-text-secondary">
                    <Building2 size={18} />
                  </div>
                )}
              </div>
              <div className="flex-1 w-full relative">
                <label className="flex items-center justify-center space-x-1.5 bg-surface hover:bg-bg-app text-text-primary text-xs px-4 py-2.5 rounded-xl border border-border cursor-pointer text-center select-none transition-all">
                  <Upload size={14} className="text-primary animate-pulse" />
                  <span>Browse Device Photos...</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-[10px] text-text-secondary mt-1 text-center sm:text-left">Supports JPG, PNG formats locally.</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Project Description</label>
            <textarea
              rows={3}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Provide a luxury brand summary of the site and key architectural features..."
              className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary resize-none"
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
              className="bg-primary text-white font-medium text-xs px-4 py-2 rounded-xl shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all cursor-pointer"
            >
              Save Project
            </button>
          </div>
        </form>
      </Dialog>

      {/* DIALOG EDIT modal panel */}
      <Dialog isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Modify Project Information">
        <form onSubmit={handleEditProject} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Project Name</label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Location</label>
              <input
                type="text"
                required
                value={formLocation}
                onChange={(e) => setFormLocation(e.target.value)}
                className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Flat Configuration</label>
              <input
                type="text"
                value={formFlatType}
                onChange={(e) => setFormFlatType(e.target.value)}
                className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Size/Area Dimension (Sqft)</label>
              <input
                type="text"
                value={formSqft}
                onChange={(e) => setFormSqft(e.target.value)}
                className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Valuation Price (INR)</label>
              <input
                type="number"
                required
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Target Possession Date</label>
              <input
                type="date"
                value={formPossessionDate}
                onChange={(e) => setFormPossessionDate(e.target.value)}
                className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Status</label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as any)}
                className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary"
              >
                <option value="">Select Status</option>
                <option value="Planning">Planning</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Completion Milestones</label>
              <input
                type="text"
                value={formCompletionStatus}
                onChange={(e) => setFormCompletionStatus(e.target.value)}
                className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Progress Ratio (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formProgress}
                onChange={(e) => setFormProgress(e.target.value)}
                className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary font-mono"
              />
            </div>
          </div>

          {/* Browser upload selection */}
          <div className="bg-surface border border-border rounded-xl p-4 space-y-3.5">
            <span className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">Project Cover Image / Render</span>
            <div className="flex items-center space-x-4">
              <div className="h-16 w-24 rounded-lg overflow-hidden bg-surface border border-border">
                {formImageUrl ? (
                  <img src={formImageUrl} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-text-secondary">
                    <Building2 size={18} />
                  </div>
                )}
              </div>
              <div className="flex-1 relative">
                <label className="flex items-center justify-center space-x-1.5 bg-surface hover:bg-bg-app text-text-primary text-xs px-4 py-2.5 rounded-xl border border-border cursor-pointer text-center select-none transition-all">
                  <Upload size={14} className="text-primary" />
                  <span>Update Photo...</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Project Description</label>
            <textarea
              rows={3}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary resize-none"
            />
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
              className="bg-primary text-white font-medium text-xs px-4 py-2 rounded-xl shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Dialog>

      {/* DIALOG DELETE modal panel */}
      <Dialog isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Confirm Project Deletion">
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Are you absolutely sure you want to delete <span className="font-semibold text-text-primary">{selectedProject?.project_name}</span>?
          </p>
          <div className="bg-danger/5 border border-danger/20 p-3 rounded-xl text-xs text-danger flex items-start space-x-2">
            <AlertTriangle size={16} className="shrink-0" />
            <span>This action cannot be undone. All database records associated with this construction project will be permanently unlinked.</span>
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
              onClick={handleDeleteProject}
              className="bg-danger hover:bg-danger/90 text-white font-medium text-xs px-4 py-2 rounded-xl shadow-lg shadow-danger/10 transition-all cursor-pointer"
            >
              Delete Project
            </button>
          </div>
        </div>
      </Dialog>

      {/* DIALOG CUSTOMER DETAILS & BROCHURE MODAL */}
      <Dialog 
        isOpen={isDetailsOpen && detailedProject !== null} 
        onClose={() => { setIsDetailsOpen(false); setDetailedProject(null); }} 
        title={detailedProject?.project_name || "Project Specifications"}
      >
        {detailedProject && (
          <div className="space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar pr-1 text-text-primary">
            {/* Project Cover Render image */}
            <div className="h-48 w-full rounded-xl overflow-hidden relative border border-border">
              <img 
                src={detailedProject.images?.[0] || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80'} 
                alt={detailedProject.project_name} 
                className="h-full w-full object-cover" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface/80 via-surface/20 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <span className="flex items-center text-xs font-bold text-text-primary bg-surface/80 backdrop-blur-md px-3 py-1 rounded-full border border-border">
                  <MapPin size={11} className="mr-1 text-danger" /> {detailedProject.location}
                </span>
                <span className="text-[10px] uppercase font-mono font-black text-warning bg-warning/5 border border-warning/20 px-2.5 py-1 rounded-lg">
                  {detailedProject.status}
                </span>
              </div>
            </div>

            {/* Price, Configuration, Area specifications matrix */}
            <div className="grid grid-cols-3 gap-3 bg-surface p-4 rounded-xl border border-border text-center">
              <div>
                 <p className="text-[9px] text-text-secondary uppercase tracking-widest font-black">Configuration</p>
                 <p className="text-xs text-text-primary font-bold mt-1">{detailedProject.flat_types?.[0] || ''}</p>
               </div>
               <div>
                 <p className="text-[9px] text-text-secondary uppercase tracking-widest font-black">Dimensions</p>
                 <p className="text-xs text-text-primary font-bold mt-1">{detailedProject.area_sqft || ''}</p>
              </div>
              <div>
                <p className="text-[9px] text-text-secondary uppercase tracking-widest font-black">Pricing Range</p>
                <p className="text-xs text-warning font-mono font-black mt-1">
                  {detailedProject.price >= 10000000 
                    ? `₹ ${(detailedProject.price / 10000000).toFixed(2)} Cr` 
                    : `₹ ${(detailedProject.price / 100000).toFixed(2)} Lakh`}
                </p>
              </div>
            </div>

            {/* Description segment */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-text-secondary flex items-center">
                <Info size={12} className="mr-1.5 text-primary" /> Architectural Overview
              </h4>
              <p className="text-xs text-text-secondary leading-relaxed font-sans">{detailedProject.description || "Designed with premium smart aesthetics and optimal ventilation layouts."}</p>
            </div>

            {/* Amenities Section */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-black uppercase tracking-wider text-text-secondary flex items-center">
                <Sparkles size={12} className="mr-1.5 text-warning" /> Project Specifications & Amenities
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs text-text-secondary">
                {(detailedProject.amenities && detailedProject.amenities.length > 0 ? detailedProject.amenities : ["Premium Swimming Pool", "Solar Electricity Grid", "State-of-the-Art Gymnasium", "CCTV Matrix Guarding", "24/7 Security Patrol", "Rainwater Harvesting"]).map((am, i) => (
                  <div key={i} className="flex items-center space-x-2 bg-surface/40 border border-border p-2.5 rounded-lg">
                    <span className="h-1.5 w-1.5 rounded-full bg-success" />
                    <span className="font-medium text-[11px]">{am}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Neighborhood Location Map */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-black uppercase tracking-wider text-text-secondary flex items-center">
                <MapPin size={12} className="mr-1.5 text-primary" /> Geographic Neighborhood Connectivity
              </h4>
              <div className="bg-surface border border-border rounded-xl p-3 space-y-2 text-xs font-sans">
                <div className="flex justify-between text-text-secondary border-b border-border pb-1.5">
                  <span>🚗 National Highway Expressway</span>
                  <span className="font-mono text-text-primary">5 Mins away</span>
                </div>
                <div className="flex justify-between text-text-secondary border-b border-border pb-1.5">
                  <span>🚇 Metro Station Transit Line</span>
                  <span className="font-mono text-text-primary">8 Mins away</span>
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>🏢 IT Tech Park Zone</span>
                  <span className="font-mono text-text-primary">12 Mins away</span>
                </div>
              </div>
            </div>

            {/* Working PDF/Brochure catalog Download trigger */}
            <div className="bg-surface border border-border p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-text-primary">Construct & Structural Blueprint</p>
                <p className="text-[10px] text-text-secondary mt-0.5">Includes area layout maps & RERA compliance documents.</p>
              </div>
              <button
                type="button"
                onClick={() => handleDownloadBrochure(detailedProject)}
                className="flex items-center space-x-1.5 bg-primary hover:bg-primary/90 text-white font-black text-[11px] py-2.5 px-3.5 rounded-lg uppercase tracking-wider transition-all duration-300 shadow-md shadow-primary/10 cursor-pointer active:scale-95"
              >
                <Download size={12} />
                <span>Download Brochure</span>
              </button>
            </div>

            {/* Inquiry/Contact Admin direct form */}
            <div className="border-t border-border pt-5 space-y-4">
              <div className="space-y-1">
                <h4 className="text-xs font-black uppercase tracking-wider text-text-primary flex items-center">
                  <Phone size={12} className="mr-1.5 text-success" /> Contact Admin & Request Callback
                </h4>
                <p className="text-[10px] text-text-secondary">Submit a direct property walkthrough enquiry or callback request.</p>
              </div>

              {contactSuccess ? (
                <div className="bg-success/5 border border-success/20 text-success p-4 rounded-xl text-center text-xs space-y-1 animate-pulse">
                  <p className="font-extrabold uppercase tracking-wider">🎉 Enquiry Logged successfully!</p>
                  <p className="text-[10px] text-text-secondary">The corporate Admin has been alerted instantly. We will contact you soon.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmitEnquiry} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-text-secondary uppercase tracking-wider mb-1 font-bold">Your Name</label>
                      <input 
                        type="text" 
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="e.g. Rahul Patil"
                        className="w-full bg-surface border border-border text-text-primary placeholder-text-secondary rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-text-secondary uppercase tracking-wider mb-1 font-bold">Phone Number</label>
                      <input 
                        type="tel" 
                        required
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="e.g. +91 98765 43210"
                        className="w-full bg-surface border border-border text-text-primary placeholder-text-secondary rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-text-secondary uppercase tracking-wider mb-1 font-bold">Message (Optional)</label>
                    <textarea 
                      rows={2}
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder="e.g. I would like to schedule a site visit this Saturday morning."
                      className="w-full bg-surface border border-border text-text-primary placeholder-text-secondary rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-success hover:bg-success/90 text-white font-black text-xs py-2.5 rounded-xl uppercase tracking-wider transition-all duration-300 shadow-md shadow-success/10 cursor-pointer active:scale-95"
                  >
                    Send Property Enquiry
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};


