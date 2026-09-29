import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { apiClient } from './lib/axiosClient';
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
import { Expenses } from './pages/Expenses';
import { Broadcast } from './pages/Broadcast';

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
  Menu,
  X,
  Search,
  Bell,
  FileSpreadsheet,
  User,
  ShieldCheck,
  ChevronRight,
  Megaphone,
} from 'lucide-react';

/* =========================================================
   SHIVINFRA APP
   Premium Construction ERP Shell
   Logic preserved — UI/color system cleaned
========================================================= */

function DashboardLayout() {
  const { user, logout, currentAdminEmail } = useAuth();

  const [activeTab, setActiveTab] = useState<string>(() =>
    user?.role === 'Customer' ? 'projects' : 'dashboard'
  );

  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [bellOpen, setBellOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<
    string | undefined
  >(undefined);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);

  /* ---------------------------------------------------------
     Notifications
  --------------------------------------------------------- */

  useEffect(() => {
    let cancelled = false;

    async function loadNotifications() {
      setNotificationsLoading(true);
      setNotificationsError(null);
      try {
        const response = await apiClient.get('/notifications');
        const data = response.data;
        if (data?.success && Array.isArray(data.data)) {
          const mapped = data.data.map((row: any) => ({
            ...row,
            status: row.is_read ? 'read' : 'unread',
          }));
          setNotifications(mapped);
        } else {
          setNotifications([]);
        }
      } catch (err: any) {
        if (!cancelled) {
          setNotificationsError(err?.message || 'Failed to load notifications');
          setNotifications([]);
        }
      } finally {
        if (!cancelled) {
          setNotificationsLoading(false);
        }
      }
    }

    loadNotifications();

    const handleNewNotification = (event: Event) => {
      const customEvent = event as CustomEvent<NotificationItem>;

      if (customEvent.detail) {
        setNotifications((prev) => [
          customEvent.detail,
          ...prev,
        ]);
      }
    };

    window.addEventListener(
      'new_notification_fired',
      handleNewNotification
    );

    return () => {
      cancelled = true;
      window.removeEventListener(
        'new_notification_fired',
        handleNewNotification
      );
    };
  }, []);

  /* ---------------------------------------------------------
     Profile menu outside click / escape
  --------------------------------------------------------- */

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      if (!target.closest('.profile-menu-container')) {
        setProfileMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setProfileMenuOpen(false);
      }
    };

    if (profileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [profileMenuOpen]);

  /* ---------------------------------------------------------
     Notification helpers
  --------------------------------------------------------- */

  const unreadCount = notifications.filter(
    (notification) => notification.status === 'unread'
  ).length;

  const markNotificationRead = async (id: string) => {
    const updated = notifications.map((notification) =>
      notification.id === id
        ? { ...notification, status: 'read' as const }
        : notification
    );

    setNotifications(updated);
    try {
      await apiClient.put(`/notifications/${id}/read`);
    } catch {
      // keep local optimistic update even if API fails
    }
  };

  const markAllNotificationsRead = async () => {
    const updated = notifications.map((notification) => ({
      ...notification,
      status: 'read' as const,
    }));

    setNotifications(updated);
    try {
      await apiClient.put('/notifications/read-all');
    } catch {
      // keep local optimistic update even if API fails
    }
  };

  const deleteNotification = async (
    id: string,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();

    const updated = notifications.filter(
      (notification) => notification.id !== id
    );

    setNotifications(updated);
    try {
      await apiClient.delete(`/notifications/${id}`);
    } catch {
      // keep local optimistic update even if API fails
    }
  };

  /* ---------------------------------------------------------
     Logout
  --------------------------------------------------------- */

  const handleLogoutClick = () => {
    setLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setLogoutConfirm(false);
    logout();
  };

  const cancelLogout = () => {
    setLogoutConfirm(false);
  };

  /* ---------------------------------------------------------
     Navigation
  --------------------------------------------------------- */

  const rawNavigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'projects',
      label: 'Projects',
      icon: HardHat,
    },
    {
      id: 'leads',
      label: 'Leads',
      icon: LucideUsers,
    },
    {
      id: 'inquiries',
      label: 'Inquiry XL Tracker',
      icon: FileSpreadsheet,
    },
    {
      id: 'customers',
      label: 'Customers',
      icon: Briefcase,
    },
    {
      id: 'site_visits',
      label: 'Site Visits',
      icon: Calendar,
    },
    {
      id: 'tasks',
      label: 'Tasks',
      icon: CheckSquare,
    },
    {
      id: 'inventory',
      label: 'Inventory',
      icon: Package,
    },
    {
      id: 'vendors',
      label: 'Vendors',
      icon: Truck,
    },
    {
      id: 'bills',
      label: 'Bills',
      icon: Receipt,
    },
    {
      id: 'expenses',
      label: 'Expenses',
      icon: Receipt,
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: FileLock,
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: TrendingUp,
    },
    {
      id: 'activity_logs',
      label: 'Activity Logs',
      icon: Terminal,
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp Center',
      icon: MessageCircle,
    },
    {
      id: 'broadcast',
      label: 'Broadcast',
      icon: Megaphone,
    },
    {
      id: 'ai_assistant',
      label: 'AI Assistant',
      icon: Sparkles,
    },
    {
      id: 'ai_command_center',
      label: 'AI Command Center',
      icon: Brain,
    },
    {
      id: 'users',
      label: 'Users',
      icon: LucideUsers,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: SettingsIcon,
    },
  ];

  const navigationItems = rawNavigationItems.filter((item) => {
    if (user?.role === 'Customer') {
      return item.id === 'projects';
    }

    return true;
  });

  /* ---------------------------------------------------------
     Page title
  --------------------------------------------------------- */

  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Enterprise Dashboard';
      case 'projects':
        return 'Projects Directory';
      case 'leads':
        return 'Leads Pipeline';
      case 'inquiries':
        return 'Customer Inquiry XL Tracker';
      case 'customers':
        return 'Customers Registry';
      case 'site_visits':
        return 'Site Visits Planner';
      case 'tasks':
        return 'Tasks Checklist';
      case 'inventory':
        return 'Site Inventory';
      case 'vendors':
        return 'Vendors Registry';
      case 'bills':
        return 'Bills & Invoices';
      case 'expenses':
        return 'Expenses';
      case 'documents':
        return 'Secure Vault';
      case 'reports':
        return 'Business Reports';
      case 'activity_logs':
        return 'Security Audits';
      case 'whatsapp':
        return 'WhatsApp Center';
      case 'broadcast':
        return 'Broadcast Messaging';
      case 'ai_assistant':
        return 'AI Assistant';
      case 'ai_command_center':
        return 'AI Command Center';
      case 'users':
        return 'Staff Directory';
      case 'settings':
        return 'System Settings';
      default:
        return 'Enterprise Dashboard';
    }
  };

  /* ---------------------------------------------------------
     Render page
  --------------------------------------------------------- */

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            onNavigate={(tab) => setActiveTab(tab)}
            openChat={() => setActiveTab('ai_assistant')}
          />
        );

      case 'projects':
        return <Projects />;

      case 'leads':
        return <Leads />;

      case 'inquiries':
        return <InquirySpreadsheet />;

      case 'customers':
        return <Customers />;

      case 'site_visits':
        return <SiteVisits />;

      case 'bills':
        return <Bills />;

      case 'expenses':
        return <Expenses />;

      case 'inventory':
        return <Inventory />;

      case 'vendors':
        return <Vendors />;

      case 'tasks':
        return <Tasks />;

      case 'documents':
        return <Documents />;

      case 'whatsapp':
        return <WhatsAppCenter />;

      case 'broadcast':
        return <Broadcast />;

      case 'ai_assistant':
        return <AIAssistant />;

      case 'ai_command_center':
        return <AICommandCenter />;

      case 'users':
        return <Users />;

      case 'reports':
        return <Reports />;

      case 'activity_logs':
        return <ActivityLogs />;

      case 'settings':
        return (
          <Settings
            initialTab={settingsInitialTab as any}
          />
        );

      default:
        return (
          <Dashboard
            onNavigate={(tab) => setActiveTab(tab)}
            openChat={() => setActiveTab('ai_assistant')}
          />
        );
    }
  };

  const userInitials =
    user?.name?.slice(0, 2).toUpperCase() || 'AD';

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="min-h-screen bg-white text-black flex flex-col md:flex-row antialiased">

      {/* =====================================================
          DESKTOP SIDEBAR
      ===================================================== */}

      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-border shrink-0">

        {/* Brand */}
        <div className="h-20 px-5 border-b border-border/80 flex items-center gap-3 bg-white">

          <div className="relative h-10 w-10 rounded-xl bg-black flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <HardHat size={20} />
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-success border-2 border-border" />
          </div>

          <div className="min-w-0">
            <h1 className="text-sm font-black tracking-wide text-black">
              SHIV INFRA AI
            </h1>

            <p className="mt-0.5 text-[9px] text-text-secondary font-bold uppercase tracking-[0.16em]">
              Construction ERP
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 overflow-y-auto custom-scrollbar space-y-1">

          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'settings') {
                    setSettingsInitialTab('company');
                  }

                  setActiveTab(item.id);
                }}
                className={`
                  group relative w-full flex items-center gap-3
                  px-3.5 py-2.5 rounded-xl
                  text-xs font-semibold tracking-wide
                  transition-all duration-200 cursor-pointer
                  ${
isActive
                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                        : 'text-text-secondary hover:text-black hover:bg-black/5'
                   }
                `}
              >
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-teal" />
                )}

                <Icon
                  size={15}
                  className={
isActive
                       ? 'text-teal'
                       : 'text-text-secondary group-hover:text-teal'
                   }
                />

                <span className="truncate">{item.label}</span>

                {isActive && (
                  <ChevronRight
                    size={13}
                    className="ml-auto text-white/70"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-border/80 bg-white">

          <div className="rounded-2xl bg-white/70 border border-border p-3">

            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-black flex items-center justify-center text-xs font-black text-white">
                {userInitials}
              </div>

              <div className="min-w-0">
                <p className="text-[11px] font-bold text-black truncate">
                  {user?.name || 'Shiv Admin'}
                </p>

                <p className="text-[9px] text-text-secondary truncate">
                  {user?.email || currentAdminEmail}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogoutClick}
              className="mt-3 w-full flex items-center justify-center gap-2 bg-surface/70 border border-border hover:bg-danger/5 hover:border-danger/20 hover:text-danger px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider text-text-secondary transition-all cursor-pointer"
            >
              <LogOut size={12} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* =====================================================
          MOBILE HEADER
      ===================================================== */}

      <header className="md:hidden h-16 bg-white border-r border-border/80 px-4 flex items-center justify-between shrink-0">

        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-black flex items-center justify-center text-white">
            <HardHat size={17} />
          </div>

          <div>
            <h1 className="text-xs font-black tracking-wider text-white">
              SHIV INFRA AI
            </h1>

            <p className="text-[8px] text-text-secondary uppercase tracking-widest">
              ERP
            </p>
          </div>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="h-9 w-9 rounded-xl bg-white border border-border flex items-center justify-center text-black hover:text-black hover:border-border transition-all cursor-pointer"
        >
          {mobileMenuOpen ? (
            <X size={19} />
          ) : (
            <Menu size={19} />
          )}
        </button>
      </header>

      {/* =====================================================
          MOBILE DRAWER
      ===================================================== */}

      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-white/98 backdrop-blur-md flex flex-col">

          <div className="h-16 px-4 border-b border-border flex items-center justify-between">
            <div>
              <span className="text-xs font-black tracking-wider text-black">
                SHIV INFRA
              </span>
              <span className="ml-2 text-[9px] text-teal uppercase tracking-widest">
                Navigation
              </span>
            </div>

            <button
              onClick={() => setMobileMenuOpen(false)}
              className="h-9 w-9 rounded-xl bg-white border border-border flex items-center justify-center text-black hover:text-black"
            >
              <X size={18} />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-1.5">

            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'settings') {
                      setSettingsInitialTab('company');
                    }

                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3
                    px-4 py-3 rounded-xl
                    text-xs font-semibold
                    ${
isActive
                         ? 'bg-primary text-white'
                         : 'text-text-secondary hover:bg-black hover:text-black'
                     }
                  `}
                >
                  <Icon
                    size={15}
className={
                       isActive
                         ? 'text-teal'
                         : 'text-text-secondary'
                     }
                  />

                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-border">

            <button
              onClick={handleLogoutClick}
              className="w-full flex items-center justify-center gap-2 bg-danger/50/10 text-red-300 border border-red-500/20 py-3 rounded-xl text-xs font-bold"
            >
              <LogOut size={14} />
              Log Out
            </button>
          </div>
        </div>
      )}

      {/* =====================================================
          MAIN WORKSPACE
      ===================================================== */}

      <main className="flex-1 flex flex-col min-w-0 bg-bg-app">

        {/* ===================================================
            LOGOUT MODAL
        =================================================== */}

        {logoutConfirm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">

            <div
              className="absolute inset-0 bg-white/70 backdrop-blur-sm"
              onClick={cancelLogout}
            />

            <div className="relative w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl z-10 p-6">

              <div className="flex items-center gap-3 mb-4">

                <div className="h-10 w-10 rounded-full bg-danger/5 flex items-center justify-center text-danger">
                  <LogOut size={19} />
                </div>

                <div>
                  <h3 className="text-lg font-bold text-text-primary">
                    Logout?
                  </h3>

                  <p className="text-xs text-text-secondary">
                    Are you sure you want to logout?
                  </p>
                </div>
              </div>

              <p className="text-sm text-text-secondary mb-6">
                You will be returned to the login screen. Any unsaved changes may be lost.
              </p>

              <div className="flex justify-end gap-3">

                <button
                  onClick={cancelLogout}
                  className="bg-surface border border-border hover:bg-surface text-text-primary hover:text-text-primary px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  onClick={confirmLogout}
                  className="bg-danger hover:bg-danger/90 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-lg shadow-danger/20 transition-all cursor-pointer"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================
            DESKTOP TOP HEADER
        =================================================== */}

        <header className="hidden md:flex h-20 bg-surface border-b border-border px-8 items-center justify-between shrink-0 shadow-sm z-10">

          {/* Page title */}
          <div className="flex items-center gap-3 min-w-0">

            <div className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center">
              <LayoutDashboard
                size={17}
                className="text-primary"
              />
            </div>

            <div>
              <h2 className="text-lg font-black tracking-tight text-text-primary">
                {getTabTitle()}
              </h2>

              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-text-secondary">
                SHIV INFRA MANAGEMENT SYSTEM
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative w-80">

            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none"
            />

            <input
              type="text"
              placeholder="Search projects, leads, bills..."
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
              className="w-full bg-surface border border-border text-text-primary placeholder-text-secondary rounded-xl pl-10 pr-4 py-2.5 text-xs font-medium focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
            />
          </div>

          {/* Header actions */}
          <div className="flex items-center gap-3">

            {/* WhatsApp */}
            <div className="flex items-center gap-2 bg-whatsapp/10 border border-whatsapp/20 rounded-full px-3.5 py-2 text-whatsapp text-[10px] font-bold">
              <span className="h-2 w-2 rounded-full bg-warning animate-pulse" />
              <span>WhatsApp {import.meta.env.VITE_META_WHATSAPP_TOKEN ? "Connected" : "Pending Config"}</span>
            </div>

            {/* AI */}
            <button
              onClick={() => setActiveTab('ai_assistant')}
              className="flex items-center gap-1.5 bg-black text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
            >
              <Sparkles
                size={13}
                className="text-teal"
              />
              <span>AI Assistant</span>
            </button>

            {/* Notifications */}
            <div className="relative">

              <button
                onClick={() => setBellOpen(!bellOpen)}
                className="relative h-10 w-10 flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-app rounded-xl transition-all cursor-pointer"
              >
                <Bell size={18} />

                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 bg-danger/50 rounded-full text-[8px] font-black text-white flex items-center justify-center border-2 border-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {bellOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-surface border border-border rounded-2xl shadow-2xl z-50 overflow-hidden">

                  <div className="p-4 border-b border-border flex items-center justify-between bg-surface">

                    <div className="flex items-center gap-2">
                      <Bell
                        size={14}
                        className="text-primary"
                      />

                      <span className="text-xs font-black text-text-primary uppercase tracking-wider">
                        Notifications
                      </span>
                    </div>

                    <div className="flex items-center gap-2">

                      {unreadCount > 0 && (
                        <button
                          onClick={markAllNotificationsRead}
                          className="text-[9px] font-bold text-primary hover:text-primary cursor-pointer"
                        >
                          Mark all read
                        </button>
                      )}

                      <button
                        onClick={() => setBellOpen(false)}
                        className="text-text-secondary hover:text-text-secondary p-1 rounded-lg hover:bg-border transition-colors cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-border custom-scrollbar">

                    {notificationsLoading ? (
                      <div className="p-8 text-center">
                        <p className="text-xs text-text-secondary">Loading notifications...</p>
                      </div>
                    ) : notificationsError ? (
                      <div className="p-8 text-center">
                        <p className="text-xs text-danger">{notificationsError}</p>
                        <button
                          onClick={() => {
                            setNotificationsError(null);
                            setNotificationsLoading(true);
                            apiClient.get('/notifications')
                              .then(r => r.data?.data && setNotifications(r.data.data))
                              .catch(() => setNotificationsError('Failed to reload notifications'))
                              .finally(() => setNotificationsLoading(false));
                          }}
                          className="mt-2 text-[10px] font-bold text-primary cursor-pointer"
                        >
                          Retry
                        </button>
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <Bell
                          size={22}
                          className="mx-auto text-text-secondary mb-2"
                        />

                        <p className="text-xs text-text-secondary">
                          No recent alerts
                        </p>
                      </div>
                    ) : (
                      notifications.map((item) => (
                        <div
                          key={item.id}
                          onClick={() =>
                            markNotificationRead(item.id)
                          }
                          className={`
                            p-3.5 text-left transition-colors cursor-pointer
                            hover:bg-surface
                            ${
                              item.status === 'unread'
                                ? 'bg-white/5'
                                : ''
                            }
                          `}
                        >
                          <div className="flex justify-between items-start">

                            <span className="text-[11px] font-bold text-text-primary leading-tight">
                              {item.title}
                            </span>

                            <button
                              onClick={(event) =>
                                deleteNotification(
                                  item.id,
                                  event
                                )
                              }
                              className="text-[10px] text-text-secondary hover:text-danger ml-1.5 cursor-pointer shrink-0"
                              title="Delete Alert"
                            >
                              <X size={12} />
                            </button>
                          </div>

                          <p className="text-[10px] text-text-secondary mt-1 leading-relaxed">
                            {item.message}
                          </p>

                          <div className="flex justify-between items-center mt-2">

                            <span className="text-[8px] font-mono text-text-secondary">
                              {new Date(
                                item.created_at
                              ).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>

                            {item.status === 'unread' && (
                              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-2 border-t border-border text-center bg-surface">

                    <button
                      onClick={() => {
                        setActiveTab('inquiries');
                        setBellOpen(false);
                      }}
                      className="text-[10px] font-black uppercase text-text-secondary hover:text-primary tracking-wider py-1.5 w-full cursor-pointer"
                    >
                      View Inquiry Spreadsheet
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="h-7 w-px bg-border" />

            {/* Profile */}
            <div className="relative profile-menu-container">

              <button
                onClick={() =>
                  setProfileMenuOpen(!profileMenuOpen)
                }
                className="flex items-center gap-2.5 hover:bg-surface rounded-xl px-2 py-1.5 transition-all cursor-pointer"
              >

                <div className="h-9 w-9 rounded-full bg-black flex items-center justify-center text-white font-black text-xs shadow-md">
                  {userInitials}
                </div>

                <div className="text-left hidden lg:block">

                  <p className="text-xs font-extrabold text-text-primary leading-none">
                    {user?.name || 'Admin User'}
                  </p>

                  <p className="text-[10px] text-text-secondary font-semibold leading-none mt-1">
                    {user?.role === 'Customer'
                      ? 'Guest Customer'
                      : 'Super Admin'}
                  </p>
                </div>
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-surface border border-border rounded-2xl shadow-2xl z-[60] overflow-hidden">

                  <div className="p-2">

                    <button
                      onClick={() => {
                        setProfileMenuOpen(false);
                        setProfileModalOpen(true);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-text-secondary hover:bg-white/10 hover:text-primary rounded-xl transition-colors cursor-pointer"
                    >
                      <User
                        size={15}
                        className="text-text-secondary"
                      />
                      <span>Profile</span>
                    </button>

                    <button
                      onClick={() => {
                        setSettingsInitialTab('profile');
                        setProfileMenuOpen(false);
                        setActiveTab('settings');
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-text-secondary hover:bg-white/10 hover:text-primary rounded-xl transition-colors cursor-pointer"
                    >
                      <SettingsIcon
                        size={15}
                        className="text-text-secondary"
                      />
                      <span>Account Information</span>
                    </button>
                  </div>

                  <div className="p-2 border-t border-border">

                    <button
                      onClick={() => {
                        setProfileMenuOpen(false);
                        setLogoutConfirm(true);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-danger hover:bg-danger/5 rounded-xl transition-colors cursor-pointer"
                    >
                      <LogOut size={15} />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* =================================================
                PROFILE MODAL
            ================================================= */}

            {profileModalOpen && (
              <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">

                <div
                  className="absolute inset-0 bg-white/60 backdrop-blur-sm"
                  onClick={() =>
                    setProfileModalOpen(false)
                  }
                />

                <div className="relative bg-surface border border-border rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">

                  <div className="p-6 border-b border-border flex items-center justify-between">

                    <div className="flex items-center gap-2">
                      <ShieldCheck
                        size={16}
                        className="text-primary"
                      />

                      <h3 className="text-sm font-black text-text-primary uppercase tracking-wider">
                        Profile
                      </h3>
                    </div>

                    <button
                      onClick={() =>
                        setProfileModalOpen(false)
                      }
                      className="p-1.5 hover:bg-bg-app rounded-lg transition-colors cursor-pointer"
                    >
                      <X
                        size={14}
                        className="text-text-secondary"
                      />
                    </button>
                  </div>

                  <div className="p-6 space-y-5">

                    <div className="flex items-center gap-4">

                      <div className="h-14 w-14 rounded-full bg-black flex items-center justify-center text-white font-black text-lg shadow-lg">
                        {userInitials}
                      </div>

                      <div>
                        <p className="text-sm font-extrabold text-text-primary">
                          {user?.name || 'Admin User'}
                        </p>

                        <p className="text-xs text-text-secondary font-medium mt-1">
                          {user?.email ||
                            currentAdminEmail ||
                            'admin@shivinfra.com'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1">

                      <div className="flex justify-between py-3 border-b border-border">
                        <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                          Role
                        </span>

                        <span className="text-xs font-bold text-text-primary">
                          {user?.role || 'Super Admin'}
                        </span>
                      </div>

                      <div className="flex justify-between py-3 border-b border-border">
                        <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                          Email
                        </span>

                        <span className="text-xs font-bold text-text-primary max-w-[220px] truncate">
                          {user?.email ||
                            currentAdminEmail ||
                            'admin@shivinfra.com'}
                        </span>
                      </div>

                      <div className="flex justify-between py-3">
                        <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                          Status
                        </span>

                        <span className="flex items-center gap-1.5 text-xs font-bold text-success">
                          <span className="h-1.5 w-1.5 rounded-full bg-success" />
                          Active
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border-t border-border bg-surface flex justify-end">

                    <button
                      onClick={() =>
                        setProfileModalOpen(false)
                      }
                      className="px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-hover transition-colors cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* ===================================================
            PAGE CONTENT
        =================================================== */}

        <div className="flex-1 p-4 md:p-7 overflow-y-auto custom-scrollbar bg-bg-app">

          <div className="max-w-[1800px] mx-auto">
            {renderContent()}
          </div>

        </div>
      </main>
    </div>
  );
}

/* =========================================================
   ROOT APP
========================================================= */

function RootApp() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-5">

        <div className="relative">

          <div className="h-12 w-12 border-2 border-primary rounded-full" />

          <div className="absolute inset-0 h-12 w-12 border-2 border-transparent border-t-teal rounded-full animate-spin" />
        </div>

        <div className="text-center">
          <p className="text-sm font-black tracking-wider text-white">
            SHIV INFRA AI
          </p>

          <p className="mt-1 text-[10px] font-mono text-text-secondary animate-pulse">
            Establishing secure connection...
          </p>
        </div>
      </div>
    );
  }

  return user ? <DashboardLayout /> : <Login />;
}

/* =========================================================
   APP PROVIDERS
========================================================= */

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <RootApp />
      </ToastProvider>
    </AuthProvider>
  );
}
