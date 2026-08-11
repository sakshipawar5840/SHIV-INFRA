import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { getStoredData, saveStoredData, INITIAL_NOTIFICATIONS } from './lib/mockData';
import { NotificationItem } from './types';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { Leads } from './pages/Leads';
import { Customers } from './pages/Customers';
import { SiteVisits } from './pages/SiteVisits';
import { Bills } from './pages/Bills';
import { Inventory } from './pages/Inventory';
import { Vendors } from './pages/Vendors';
import { Tasks } from './pages/Tasks';
import { Documents } from './pages/Documents';
import { WhatsAppCenter } from './pages/WhatsAppCenter';
import { AIAssistant } from './pages/AIAssistant';
import { AICommandCenter } from './pages/AICommandCenter';
import { Users } from './pages/Users';
import { Reports } from './pages/Reports';
import { ActivityLogs } from './pages/ActivityLogs';
import { Settings } from './pages/Settings';
import { InquirySpreadsheet } from './pages/InquirySpreadsheet';
import { 
  LayoutDashboard,
  HardHat,
  Users as LucideUsers,
  Briefcase,
  Calendar,
  Receipt,
  Package,
  Truck,
  CheckSquare,
  FileLock,
  MessageCircle,
  Sparkles,
  Brain,
  TrendingUp,
  Terminal,
  Settings as SettingsIcon,
  LogOut,
  Clock,
  Menu,
  X,
  Search,
  Bell,
  FileSpreadsheet
} from 'lucide-react';

function DashboardLayout() {
  const { user, logout, currentAdminEmail } = useAuth();
  const [activeTab, setActiveTab] = useState<string>(() => {
    return user?.role === 'Customer' ? 'projects' : 'dashboard';
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [bellOpen, setBellOpen] = useState(false);

  useEffect(() => {
    setNotifications(getStoredData<NotificationItem[]>('notifications', INITIAL_NOTIFICATIONS));

    // Listen for sandbox actions triggering real-time additions
    const handleNewNotification = (e: Event) => {
      const customEvent = e as CustomEvent<NotificationItem>;
      if (customEvent.detail) {
        setNotifications(prev => [customEvent.detail, ...prev]);
      }
    };

    window.addEventListener('new_notification_fired', handleNewNotification);
    return () => {
      window.removeEventListener('new_notification_fired', handleNewNotification);
    };
  }, []);

  const unreadCount = notifications.filter(n => n.status === 'unread').length;

  const markNotificationRead = (id: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, status: 'read' as const } : n);
    setNotifications(updated);
    saveStoredData('notifications', updated);
  };

  const markAllNotificationsRead = () => {
    const updated = notifications.map(n => ({ ...n, status: 'read' as const }));
    setNotifications(updated);
    saveStoredData('notifications', updated);
  };

  const deleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = notifications.filter(n => n.id !== id);
    setNotifications(updated);
    saveStoredData('notifications', updated);
  };

  // Nav configuration precisely matching the video
  const rawNavigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'projects', label: 'Projects', icon: HardHat },
    { id: 'leads', label: 'Leads', icon: LucideUsers },
    { id: 'inquiries', label: 'Inquiry XL Tracker', icon: FileSpreadsheet },
    { id: 'customers', label: 'Customers', icon: Briefcase },
    { id: 'site_visits', label: 'Site Visits', icon: Calendar },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'vendors', label: 'Vendors', icon: Truck },
    { id: 'bills', label: 'Bills', icon: Receipt },
    { id: 'documents', label: 'Documents', icon: FileLock },
    { id: 'reports', label: 'Reports', icon: TrendingUp },
    { id: 'activity_logs', label: 'Activity Logs', icon: Terminal },
    { id: 'whatsapp', label: 'WhatsApp Center', icon: MessageCircle },
    { id: 'ai_assistant', label: 'AI Assistant', icon: Sparkles },
    { id: 'ai_command_center', label: 'AI Command Center', icon: Brain },
    { id: 'users', label: 'Users', icon: LucideUsers },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  // Dynamic role-based navigation links
  const navigationItems = rawNavigationItems.filter((item) => {
    if (user?.role === 'Customer') {
      // Customer has ONLY projects access
      return item.id === 'projects';
    }
    return true;
  });

  // Helper mapping of active tab to its elegant Header title as seen in the video
  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Enterprise Dashboard';
      case 'projects': return 'Projects Directory';
      case 'leads': return 'Leads Pipeline';
      case 'inquiries': return 'Customer Inquiry XL Tracker';
      case 'customers': return 'Customers Registry';
      case 'site_visits': return 'Site Visits Planner';
      case 'tasks': return 'Tasks Checklist';
      case 'inventory': return 'Site Inventory';
      case 'vendors': return 'Vendors Registry';
      case 'bills': return 'Bills & Invoices';
      case 'documents': return 'Secure Vault';
      case 'reports': return 'Business Reports';
      case 'activity_logs': return 'Security Audits';
      case 'whatsapp': return 'WhatsApp Center';
      case 'ai_assistant': return 'AI Assistant';
      case 'ai_command_center': return 'AI Command Center';
      case 'users': return 'Staff Directory';
      case 'settings': return 'System Settings';
      default: return 'Enterprise Dashboard';
    }
  };

  // Render current tab body
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard onNavigate={(tab) => setActiveTab(tab)} openChat={() => setActiveTab('ai_assistant')} />;
      case 'projects': return <Projects />;
      case 'leads': return <Leads />;
      case 'inquiries': return <InquirySpreadsheet />;
      case 'customers': return <Customers />;
      case 'site_visits': return <SiteVisits />;
      case 'bills': return <Bills />;
      case 'inventory': return <Inventory />;
      case 'vendors': return <Vendors />;
      case 'tasks': return <Tasks />;
      case 'documents': return <Documents />;
      case 'whatsapp': return <WhatsAppCenter />;
      case 'ai_assistant': return <AIAssistant />;
      case 'ai_command_center': return <AICommandCenter />;
      case 'users': return <Users />;
      case 'reports': return <Reports />;
      case 'activity_logs': return <ActivityLogs />;
      case 'settings': return <Settings />;
      default: return <Dashboard onNavigate={(tab) => setActiveTab(tab)} openChat={() => setActiveTab('ai_assistant')} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col md:flex-row antialiased">
      {/* Sidebar for Desktop - High-End Dark styling matching the video */}
      <aside className="hidden md:flex flex-col w-64 bg-[#090e1a] border-r border-[#15203c] shrink-0">
        {/* Brand/Header */}
        <div className="h-20 px-6 border-b border-[#15203c] flex items-center space-x-3 bg-[#070b14]">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/10">
            <HardHat size={20} className="animate-pulse text-white" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold tracking-wide text-white font-sans">SHIV INFRA AI</h1>
            <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">CONSTRUCTION CRM</p>
          </div>
        </div>

        {/* Dynamic navigation links scroll container */}
        <nav className="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/15' 
                    : 'text-slate-400 hover:text-slate-100 hover:bg-[#121c32]/50'
                }`}
              >
                <Icon size={15} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer info & Logout */}
        <div className="p-4 border-t border-[#15203c] bg-[#070b14]/55 space-y-3">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold font-mono text-blue-400 border border-slate-700">
              {user?.name.slice(0, 2).toUpperCase() || 'AD'}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-slate-100 truncate">{user?.name || 'Shiv Admin'}</p>
              <p className="text-[9px] text-slate-400 font-mono truncate">{user?.email || currentAdminEmail}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center space-x-2 bg-slate-900 border border-slate-800 hover:bg-rose-500/10 hover:border-rose-500/20 hover:text-rose-400 px-3 py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-wider text-slate-400 transition-colors cursor-pointer"
          >
            <LogOut size={12} />
            <span>Sign Out Session</span>
          </button>
        </div>
      </aside>

      {/* Mobile view controller header */}
      <header className="md:hidden h-16 bg-[#090e1a] border-b border-[#15203c] px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white">
            <HardHat size={16} />
          </div>
          <h1 className="text-xs font-bold tracking-wider text-white">SHIV INFRA ERP</h1>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 text-slate-400 hover:text-slate-200 cursor-pointer"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Mobile navigation side drawer overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-[#090e1a]/95 flex flex-col">
          <div className="h-16 px-4 border-b border-[#15203c] flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-white">Menu Navigation</span>
            <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400"><X size={20} /></button>
          </div>
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-medium tracking-wide cursor-pointer ${
                    isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-[#121c32]/50'
                  }`}
                >
                  <Icon size={14} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
          <div className="p-4 border-t border-[#15203c]">
            <button
              onClick={logout}
              className="w-full bg-rose-600/10 text-rose-400 border border-rose-500/10 py-2.5 rounded-xl text-xs font-bold"
            >
              Log Out Session
            </button>
          </div>
        </div>
      )}

      {/* Main page content area - Light-Workspace background */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#f8fafc]">
        {/* Dynamic header panel - White background, crisp details matching video */}
        <header className="hidden md:flex h-20 bg-white border-b border-slate-200 px-8 items-center justify-between shrink-0 shadow-sm z-10">
          {/* Title block */}
          <div className="flex items-center space-x-3">
            <h2 className="text-lg font-extrabold tracking-tight text-slate-800 font-sans">
              {getTabTitle()}
            </h2>
          </div>

          {/* Search Box */}
          <div className="relative w-80">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
              <Search size={15} />
            </div>
            <input
              type="text"
              placeholder="Search projects, leads, bills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 rounded-full pl-10 pr-4 py-2 text-xs font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/25 transition-all"
            />
          </div>

          {/* Actions & Profile */}
          <div className="flex items-center space-x-4">
            {/* WhatsApp Connection Badge */}
            <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-200 rounded-full px-4 py-1.5 text-emerald-700 text-xs font-bold">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>WhatsApp API Connected</span>
            </div>

            {/* AI Assistant Button */}
            <button
              onClick={() => setActiveTab('ai_assistant')}
              className="flex items-center space-x-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold text-xs px-4 py-2 rounded-full shadow-lg shadow-blue-500/15 hover:shadow-blue-500/25 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <Sparkles size={13} className="text-amber-300 animate-pulse" />
              <span>AI Assistant</span>
            </button>

            {/* Notification Bell with Dynamic Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setBellOpen(!bellOpen)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-all relative cursor-pointer"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-4 w-4 bg-rose-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {bellOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden font-sans">
                  {/* Header */}
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Alerts Notification</span>
                    {unreadCount > 0 && (
                      <button 
                        onClick={markAllNotificationsRead}
                        className="text-[10px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  {/* Body List */}
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-xs">
                        No recent alerts. Everything clear!
                      </div>
                    ) : (
                      notifications.map(item => (
                        <div 
                          key={item.id} 
                          onClick={() => markNotificationRead(item.id)}
                          className={`p-3.5 text-left transition-colors cursor-pointer hover:bg-slate-50 ${
                            item.status === 'unread' ? 'bg-blue-50/20' : ''
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <span className="text-[11px] font-bold text-slate-800 leading-tight">
                              {item.title}
                            </span>
                            <button 
                              onClick={(e) => deleteNotification(item.id, e)}
                              className="text-[10px] text-slate-400 hover:text-rose-500 ml-1.5 cursor-pointer shrink-0"
                              title="Delete Alert"
                            >
                              ✕
                            </button>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                            {item.message}
                          </p>
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-[8px] font-mono text-slate-400">
                              {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {item.status === 'unread' && (
                              <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Footer */}
                  <div className="p-2 border-t border-slate-100 text-center bg-slate-50">
                    <button 
                      onClick={() => { setActiveTab('inquiries'); setBellOpen(false); }}
                      className="text-[10px] font-black uppercase text-slate-500 hover:text-slate-800 tracking-wider py-1.5 w-full cursor-pointer"
                    >
                      View Inquiry Spreadsheet
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="h-6 w-[1px] bg-slate-200" />

            {/* Profile info */}
            <div className="flex items-center space-x-2.5">
              <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-extrabold text-xs shadow-inner">
                {user?.name.slice(0, 2).toUpperCase() || 'AD'}
              </div>
              <div className="text-left hidden lg:block">
                <p className="text-xs font-extrabold text-slate-800 leading-none">{user?.name || 'Admin User'}</p>
                <p className="text-[10px] text-slate-400 font-bold leading-none mt-1">
                  {user?.role === 'Customer' ? 'Guest Customer' : 'Super Admin'}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Routed dynamic body viewport with scrolling container */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

function RootApp() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="h-10 w-10 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-mono text-slate-500 animate-pulse">Establishing Shiv Infra Secure Node connection...</p>
      </div>
    );
  }

  return user ? <DashboardLayout /> : <Login />;
}

export default function App() {
  return (
    <AuthProvider>
      <RootApp />
    </AuthProvider>
  );
}
