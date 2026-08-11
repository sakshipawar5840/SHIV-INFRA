import React, { useState, useEffect } from 'react';
import { getStoredData, saveStoredData, logSystemAction, INITIAL_PROJECTS } from '../lib/mockData';
import { Project } from '../types';
import { Dialog } from '../components/Dialog';
import { useAuth } from '../contexts/AuthContext';
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

  const [projects, setProjects] = useState<Project[]>([]);
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
  const [formFlatType, setFormFlatType] = useState('2 BHK');
  const [formSqft, setFormSqft] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formStatus, setFormStatus] = useState<'Planning' | 'Ongoing' | 'Completed' | 'Upcoming'>('Ongoing');
  const [formProgress, setFormProgress] = useState('0');
  const [formDescription, setFormDescription] = useState('');
  const [formCompletionStatus, setFormCompletionStatus] = useState('');
  const [formPossessionDate, setFormPossessionDate] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');

  // Loaded from storage
  useEffect(() => {
    setProjects(getStoredData<Project[]>('projects', INITIAL_PROJECTS));
  }, []);

  const handleSaveProjects = (data: Project[]) => {
    setProjects(data);
    saveStoredData('projects', data);
  };

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
    setFormFlatType('2 BHK');
    setFormSqft('1000 - 1500 sqft');
    setFormPrice('6000000');
    setFormStatus('Ongoing');
    setFormProgress('0');
    setFormDescription('');
    setFormCompletionStatus('Excavation');
    setFormPossessionDate('2027-12-31');
    setFormImageUrl('https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=400&q=80');
    setIsAddOpen(true);
  };

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formLocation || !formPrice) return;

    const newProject: Project = {
      id: `p_${Date.now()}`,
      name: formName,
      location: formLocation,
      flat_type: formFlatType,
      sqft: formSqft,
      price: Number(formPrice),
      status: formStatus,
      description: formDescription,
      progress: Number(formProgress),
      completion_status: formCompletionStatus,
      possession_date: formPossessionDate,
      image_url: formImageUrl
    };

    const updated = [newProject, ...projects];
    handleSaveProjects(updated);
    logSystemAction('Create', `Project "${formName}" created with estimated budget ${formPrice}`);
    setIsAddOpen(false);
  };

  const handleDownloadBrochure = (project: Project) => {
    const textLines = [
      `==================================================`,
      `          SHIV INFRA CO. - OFFICIAL BROCHURE      `,
      `==================================================\n`,
      `PROJECT NAME       : ${project.name}`,
      `DEVELOPER          : SHIV INFRA AI SYSTEMS`,
      `LOCATION           : ${project.location}`,
      `CONFIGURATIONS     : ${project.flat_type}`,
      `DIMENSIONS         : ${project.sqft}`,
      `STARTING VALUATION : INR ${project.price.toLocaleString('en-IN')}`,
      `TARGET POSSESSION  : ${project.possession_date || '2027-12-31'}`,
      `CURRENT STATUS     : ${project.status} (${project.progress}% Complete)`,
      `MILESTONE          : ${project.completion_status || 'Under Civil Casting'}\n`,
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
    element.download = `ShivInfra_${project.name.replace(/\s+/g, '_')}_Brochure.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    logSystemAction('Access', `Brochure downloaded successfully for project ${project.name}`);
  };

  const handleSubmitEnquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactPhone || !detailedProject) return;

    // Create a new lead/inquiry record
    const storedInquiries = getStoredData<any[]>('inquiries', []);
    const newInquiry = {
      id: `inq_${Date.now()}`,
      customer_name: contactName,
      customer_phone: contactPhone,
      project_name: detailedProject.name,
      project_location: detailedProject.location,
      action_type: 'Project Enquiry', 
      message: contactMessage || `Interested in ${detailedProject.flat_type} properties at ${detailedProject.name}.`,
      status: 'new_lead',
      created_at: new Date().toISOString()
    };
    
    const updatedInquiries = [newInquiry, ...storedInquiries];
    saveStoredData('inquiries', updatedInquiries);

    // Create a real-time notification in the system
    const storedNotifications = getStoredData<any[]>('notifications', []);
    const newNotif = {
      id: `notif_${Date.now()}`,
      title: '🔔 New Customer Action',
      message: `Customer ${contactName} (${contactPhone}) booked an action "Project Enquiry" for ${detailedProject.name} project located at ${detailedProject.location}.`,
      type: 'alert',
      status: 'unread',
      created_at: new Date().toISOString()
    };
    const updatedNotifications = [newNotif, ...storedNotifications];
    saveStoredData('notifications', updatedNotifications);

    // Trigger WhatsApp notification via backend or fire event for immediate layout updates
    const event = new CustomEvent('new_notification_fired', { detail: newNotif });
    window.dispatchEvent(event);

    logSystemAction('Create', `Enquiry recorded for customer ${contactName} regarding project ${detailedProject.name}`);
    setContactSuccess(true);
    setTimeout(() => {
      setContactSuccess(false);
      setContactMessage('');
      setContactPhone('');
    }, 4000);
  };

  const openEditModal = (project: Project) => {
    setSelectedProject(project);
    setFormName(project.name);
    setFormLocation(project.location);
    setFormFlatType(project.flat_type);
    setFormSqft(project.sqft);
    setFormPrice(String(project.price));
    setFormStatus(project.status);
    setFormProgress(String(project.progress));
    setFormDescription(project.description);
    setFormCompletionStatus(project.completion_status || '');
    setFormPossessionDate(project.possession_date || '');
    setFormImageUrl(project.image_url || '');
    setIsEditOpen(true);
  };

  const handleEditProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !formName || !formLocation) return;

    const updated = projects.map(p => {
      if (p.id === selectedProject.id) {
        return {
          ...p,
          name: formName,
          location: formLocation,
          flat_type: formFlatType,
          sqft: formSqft,
          price: Number(formPrice),
          status: formStatus,
          progress: Number(formProgress),
          description: formDescription,
          completion_status: formCompletionStatus,
          possession_date: formPossessionDate,
          image_url: formImageUrl
        };
      }
      return p;
    });

    handleSaveProjects(updated);
    logSystemAction('Update', `Project "${formName}" details or progress updated`);
    setIsEditOpen(false);
  };

  const openDeleteModal = (project: Project) => {
    setSelectedProject(project);
    setIsDeleteOpen(true);
  };

  const handleDeleteProject = () => {
    if (!selectedProject) return;
    const updated = projects.filter(p => p.id !== selectedProject.id);
    handleSaveProjects(updated);
    logSystemAction('Delete', `Project "${selectedProject.name}" deleted from records`);
    setIsDeleteOpen(false);
  };

  // Filter and Search logic
  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.location.toLowerCase().includes(search.toLowerCase()) ||
                          p.description.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'price_asc') return a.price - b.price;
    if (sortBy === 'price_desc') return b.price - a.price;
    if (sortBy === 'progress') return b.progress - a.progress;
    return 0;
  });

  return (
    <div className="space-y-6 text-slate-100">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100 font-sans">
            Projects Directory
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {isAdmin 
              ? 'Manage and monitor physical construction progress across sites.' 
              : 'Explore premiums projects, amenities, location plans, and download catalogs.'}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={openAddModal}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-medium text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-sky-500/10 hover:shadow-sky-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <Plus size={14} />
            <span>Add Project</span>
          </button>
        )}
      </div>

      {/* Filter and Search queries */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search bar */}
        <div className="flex-1 relative max-w-sm">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-500">
            <Search size={14} />
          </div>
          <input
            type="text"
            placeholder="Search project name or site..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-500 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-sky-500/80"
          />
        </div>

        {/* Tab-styled filters */}
        <div className="flex items-center space-x-2 overflow-x-auto shrink-0">
          {['All', 'Planning', 'Ongoing', 'Completed', 'Upcoming'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-sky-600/10 border-sky-500 text-sky-400'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Sorting selection */}
        <div className="flex items-center space-x-2 shrink-0">
          <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg text-xs py-1.5 px-2.5 focus:outline-none focus:border-sky-500 text-slate-300"
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
        <div className="bg-slate-900 border border-slate-800 p-12 text-center rounded-2xl">
          <Building2 size={36} className="text-slate-600 mx-auto mb-3 animate-pulse" />
          <p className="text-sm font-semibold text-slate-400">No projects match filters</p>
          <p className="text-xs text-slate-500 mt-1">Try resetting search parameters or create a new project above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProjects.map((p) => (
            <div
              key={p.id}
              className="bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden hover:border-sky-500/40 transition-all flex flex-col group relative"
            >
              {/* Photo Banner */}
              <div className="h-44 w-full relative overflow-hidden bg-slate-950">
                <img
                  src={p.image_url || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=400&q=80'}
                  alt={p.name}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                
                {/* Badge status */}
                <span className={`absolute top-3 right-3 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  p.status === 'Completed' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' :
                  p.status === 'Ongoing' ? 'bg-sky-500/10 border border-sky-500/20 text-sky-400' :
                  p.status === 'Upcoming' ? 'bg-purple-500/10 border border-purple-500/20 text-purple-400' :
                  'bg-slate-500/10 border border-slate-500/20 text-slate-400'
                }`}>
                  {p.status}
                </span>

                {/* Overlaid Title and Info */}
                <div className="absolute bottom-3 left-4 right-4">
                  <h3 className="text-sm font-bold text-slate-100 font-sans tracking-tight">{p.name}</h3>
                  <p className="text-[10px] text-slate-400 flex items-center mt-1">
                    <MapPin size={10} className="mr-1 text-rose-500" /> {p.location}
                  </p>
                </div>
              </div>

              {/* Grid content */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div className="space-y-3.5">
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{p.description}</p>
                  
                  {/* Metadata matrix */}
                  <div className="grid grid-cols-2 gap-2 border-y border-slate-800/60 py-2.5 text-xs">
                    <div>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Unit Type</p>
                      <p className="text-slate-300 font-medium mt-0.5">{p.flat_type}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Dimensions</p>
                      <p className="text-slate-300 font-medium mt-0.5">{p.sqft}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Start Valuation</p>
                      <p className="text-sky-400 font-mono font-bold mt-0.5">
                        {p.price >= 10000000 ? `₹ ${(p.price / 10000000).toFixed(2)} Cr` : `₹ ${(p.price / 100000).toFixed(2)} L`}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Target Possession</p>
                      <p className="text-slate-300 font-medium mt-0.5">{p.possession_date || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Completion indicator */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-400 font-medium">{p.completion_status || 'Civil Casting'}</span>
                      <span className="font-mono text-sky-400 font-bold">{p.progress}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
                      <div className="h-full bg-sky-500 rounded-full transition-all duration-300" style={{ width: `${p.progress}%` }} />
                    </div>
                  </div>
                </div>

                {/* Interaction controls */}
                <div className="flex items-center justify-between space-x-2 mt-4 pt-3 border-t border-slate-800/40 w-full">
                  {!isAdmin ? (
                    <button
                      onClick={() => {
                        setDetailedProject(p);
                        setContactSuccess(false);
                        setIsDetailsOpen(true);
                      }}
                      className="w-full flex items-center justify-center space-x-1.5 bg-gradient-to-r from-sky-600/20 to-indigo-600/20 hover:from-sky-500 hover:to-indigo-500 border border-sky-500/30 text-sky-400 hover:text-slate-950 font-black text-[10px] py-2 px-3 rounded-xl uppercase tracking-wider transition-all duration-300 cursor-pointer active:scale-95"
                    >
                      <Sparkles size={11} />
                      <span>Explore & Brochure</span>
                    </button>
                  ) : (
                    <>
                      <span className="text-[9px] font-mono text-slate-500">ADMIN CONTROLS</span>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 text-slate-400 hover:text-sky-400 hover:bg-slate-800/60 rounded-lg transition-colors cursor-pointer"
                          title="Edit Details"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => openDeleteModal(p)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 rounded-lg transition-colors cursor-pointer"
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
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Project Name</label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Skyline Heights"
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Location / City</label>
              <input
                type="text"
                required
                value={formLocation}
                onChange={(e) => setFormLocation(e.target.value)}
                placeholder="e.g. Baner, Pune"
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Flat Configuration</label>
              <input
                type="text"
                value={formFlatType}
                onChange={(e) => setFormFlatType(e.target.value)}
                placeholder="e.g. 2 BHK, 3 BHK"
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Size/Area Dimension (Sqft)</label>
              <input
                type="text"
                value={formSqft}
                onChange={(e) => setFormSqft(e.target.value)}
                placeholder="e.g. 1000 - 1500 sqft"
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Estimated Valuation Price (INR)</label>
              <input
                type="number"
                required
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                placeholder="e.g. 6000000"
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Target Possession Date</label>
              <input
                type="date"
                value={formPossessionDate}
                onChange={(e) => setFormPossessionDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Status</label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-sky-500"
              >
                <option value="Planning">Planning</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
                <option value="Upcoming">Upcoming</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Completion Milestones</label>
              <input
                type="text"
                value={formCompletionStatus}
                onChange={(e) => setFormCompletionStatus(e.target.value)}
                placeholder="e.g. Brickwork"
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Progress Ratio (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formProgress}
                onChange={(e) => setFormProgress(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>
          </div>

          {/* Browser file input pick for images */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3.5">
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Project Cover Image / Render</span>
            <div className="flex flex-col sm:flex-row items-center sm:space-x-4 space-y-3 sm:space-y-0">
              <div className="h-16 w-24 rounded-lg overflow-hidden bg-slate-900 border border-slate-800">
                {formImageUrl ? (
                  <img src={formImageUrl} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-slate-600">
                    <Building2 size={18} />
                  </div>
                )}
              </div>
              <div className="flex-1 w-full relative">
                <label className="flex items-center justify-center space-x-1.5 bg-slate-900 hover:bg-slate-850 text-slate-200 text-xs px-4 py-2.5 rounded-xl border border-slate-700/80 cursor-pointer text-center select-none transition-all">
                  <Upload size={14} className="text-sky-400 animate-pulse" />
                  <span>Browse Device Photos...</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-[10px] text-slate-500 mt-1 text-center sm:text-left">Supports JPG, PNG formats locally.</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Project Description</label>
            <textarea
              rows={3}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Provide a luxury brand summary of the site and key architectural features..."
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-sky-500 resize-none"
            />
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
              className="bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-medium text-xs px-4 py-2 rounded-xl shadow-lg shadow-sky-500/10 hover:shadow-sky-500/20 transition-all cursor-pointer"
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
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Project Name</label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Location / City</label>
              <input
                type="text"
                required
                value={formLocation}
                onChange={(e) => setFormLocation(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Flat Configuration</label>
              <input
                type="text"
                value={formFlatType}
                onChange={(e) => setFormFlatType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Size/Area Dimension (Sqft)</label>
              <input
                type="text"
                value={formSqft}
                onChange={(e) => setFormSqft(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Valuation Price (INR)</label>
              <input
                type="number"
                required
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Target Possession Date</label>
              <input
                type="date"
                value={formPossessionDate}
                onChange={(e) => setFormPossessionDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Status</label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-sky-500"
              >
                <option value="Planning">Planning</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
                <option value="Upcoming">Upcoming</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Completion Milestones</label>
              <input
                type="text"
                value={formCompletionStatus}
                onChange={(e) => setFormCompletionStatus(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Progress Ratio (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formProgress}
                onChange={(e) => setFormProgress(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>
          </div>

          {/* Browser upload selection */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3.5">
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Project Cover Image / Render</span>
            <div className="flex items-center space-x-4">
              <div className="h-16 w-24 rounded-lg overflow-hidden bg-slate-900 border border-slate-800">
                {formImageUrl ? (
                  <img src={formImageUrl} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-slate-600">
                    <Building2 size={18} />
                  </div>
                )}
              </div>
              <div className="flex-1 relative">
                <label className="flex items-center justify-center space-x-1.5 bg-slate-900 hover:bg-slate-850 text-slate-200 text-xs px-4 py-2.5 rounded-xl border border-slate-700/80 cursor-pointer text-center select-none transition-all">
                  <Upload size={14} className="text-sky-400" />
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
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Project Description</label>
            <textarea
              rows={3}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-sky-500 resize-none"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-slate-200 px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-medium text-xs px-4 py-2 rounded-xl shadow-lg shadow-sky-500/10 hover:shadow-sky-500/20 transition-all cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Dialog>

      {/* DIALOG DELETE modal panel */}
      <Dialog isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Confirm Project Deletion">
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            Are you absolutely sure you want to delete <span className="font-semibold text-slate-100">{selectedProject?.name}</span>?
          </p>
          <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl text-xs text-rose-400 flex items-start space-x-2">
            <AlertTriangle size={16} className="shrink-0" />
            <span>This action cannot be undone. All database records associated with this construction project will be permanently unlinked.</span>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsDeleteOpen(false)}
              className="bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-slate-200 px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteProject}
              className="bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs px-4 py-2 rounded-xl shadow-lg shadow-rose-500/10 transition-all cursor-pointer"
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
        title={detailedProject?.name || "Project Specifications"}
      >
        {detailedProject && (
          <div className="space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar pr-1 text-slate-100">
            {/* Project Cover Render image */}
            <div className="h-48 w-full rounded-xl overflow-hidden relative border border-slate-800">
              <img 
                src={detailedProject.image_url || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80'} 
                alt={detailedProject.name} 
                className="h-full w-full object-cover" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <span className="flex items-center text-xs font-bold text-slate-100 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-full border border-slate-800">
                  <MapPin size={11} className="mr-1 text-rose-500" /> {detailedProject.location}
                </span>
                <span className="text-[10px] uppercase font-mono font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                  {detailedProject.status}
                </span>
              </div>
            </div>

            {/* Price, Configuration, Area specifications matrix */}
            <div className="grid grid-cols-3 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-850 text-center">
              <div>
                <p className="text-[9px] text-slate-500 uppercase tracking-widest font-black">Configuration</p>
                <p className="text-xs text-slate-200 font-bold mt-1">{detailedProject.flat_type}</p>
              </div>
              <div>
                <p className="text-[9px] text-slate-500 uppercase tracking-widest font-black">Dimensions</p>
                <p className="text-xs text-slate-200 font-bold mt-1">{detailedProject.sqft}</p>
              </div>
              <div>
                <p className="text-[9px] text-slate-500 uppercase tracking-widest font-black">Pricing Range</p>
                <p className="text-xs text-amber-400 font-mono font-black mt-1">
                  {detailedProject.price >= 10000000 
                    ? `₹ ${(detailedProject.price / 10000000).toFixed(2)} Cr` 
                    : `₹ ${(detailedProject.price / 100000).toFixed(2)} Lakh`}
                </p>
              </div>
            </div>

            {/* Description segment */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center">
                <Info size={12} className="mr-1.5 text-sky-400" /> Architectural Overview
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">{detailedProject.description || "Designed with premium smart aesthetics and optimal ventilation layouts."}</p>
            </div>

            {/* Amenities Section */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center">
                <Sparkles size={12} className="mr-1.5 text-amber-500" /> Project Specifications & Amenities
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                {(detailedProject.amenities && detailedProject.amenities.length > 0 ? detailedProject.amenities : ["Premium Swimming Pool", "Solar Electricity Grid", "State-of-the-Art Gymnasium", "CCTV Matrix Guarding", "24/7 Security Patrol", "Rainwater Harvesting"]).map((am, i) => (
                  <div key={i} className="flex items-center space-x-2 bg-slate-950/40 border border-slate-850 p-2.5 rounded-lg">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span className="font-medium text-[11px]">{am}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Neighborhood Location Map */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center">
                <MapPin size={12} className="mr-1.5 text-indigo-400" /> Geographic Neighborhood Connectivity
              </h4>
              <div className="bg-slate-950 border border-slate-850 rounded-xl p-3 space-y-2 text-xs font-sans">
                <div className="flex justify-between text-slate-400 border-b border-slate-900 pb-1.5">
                  <span>🚗 National Highway Expressway</span>
                  <span className="font-mono text-slate-200">5 Mins away</span>
                </div>
                <div className="flex justify-between text-slate-400 border-b border-slate-900 pb-1.5">
                  <span>🚇 Metro Station Transit Line</span>
                  <span className="font-mono text-slate-200">8 Mins away</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>🏢 IT Tech Park Zone</span>
                  <span className="font-mono text-slate-200">12 Mins away</span>
                </div>
              </div>
            </div>

            {/* Working PDF/Brochure catalog Download trigger */}
            <div className="bg-[#111625] border border-slate-855 p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-200">Construct & Structural Blueprint</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Includes area layout maps & RERA compliance documents.</p>
              </div>
              <button
                type="button"
                onClick={() => handleDownloadBrochure(detailedProject)}
                className="flex items-center space-x-1.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black text-[11px] py-2.5 px-3.5 rounded-lg uppercase tracking-wider transition-all duration-300 shadow-md shadow-amber-500/10 cursor-pointer active:scale-95"
              >
                <Download size={12} />
                <span>Download Brochure</span>
              </button>
            </div>

            {/* Inquiry/Contact Admin direct form */}
            <div className="border-t border-slate-800 pt-5 space-y-4">
              <div className="space-y-1">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center">
                  <Phone size={12} className="mr-1.5 text-emerald-400" /> Contact Admin & Request Callback
                </h4>
                <p className="text-[10px] text-slate-500">Submit a direct property walkthrough enquiry or callback request.</p>
              </div>

              {contactSuccess ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-center text-xs space-y-1 animate-pulse">
                  <p className="font-extrabold uppercase tracking-wider">🎉 Enquiry Logged successfully!</p>
                  <p className="text-[10px] text-slate-300">The corporate Admin has been alerted instantly. We will contact you soon.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmitEnquiry} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1 font-bold">Your Name</label>
                      <input 
                        type="text" 
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="e.g. Rahul Patil"
                        className="w-full bg-slate-950 border border-slate-855 text-slate-100 placeholder-slate-650 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1 font-bold">Phone Number</label>
                      <input 
                        type="tel" 
                        required
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="e.g. +91 98765 43210"
                        className="w-full bg-slate-950 border border-slate-855 text-slate-100 placeholder-slate-650 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1 font-bold">Message (Optional)</label>
                    <textarea 
                      rows={2}
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder="e.g. I would like to schedule a site visit this Saturday morning."
                      className="w-full bg-slate-950 border border-slate-855 text-slate-100 placeholder-slate-650 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-sky-500 resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-black text-xs py-2.5 rounded-xl uppercase tracking-wider transition-all duration-300 shadow-md shadow-emerald-500/10 cursor-pointer active:scale-95"
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
