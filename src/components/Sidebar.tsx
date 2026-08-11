import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  HardHat,
  Users,
  Briefcase,
  Calendar,
  Receipt,
  FileText,
  MessageSquare,
  Sparkles,
  Settings,
  ClipboardList,
  FolderOpen,
  Warehouse,
  Truck,
  Users2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onChangeTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (col: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onChangeTab,
  collapsed,
  setCollapsed,
}) => {
  const { user } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, category: 'CORE' },
    { id: 'projects', label: 'Projects', icon: HardHat, category: 'OPERATIONS' },
    { id: 'leads', label: 'Leads Pipeline', icon: Users, category: 'CRM' },
    { id: 'customers', label: 'Customers CRM', icon: Users2, category: 'CRM' },
    { id: 'site-visits', label: 'Site Visits', icon: Calendar, category: 'OPERATIONS' },
    { id: 'bills', label: 'Bills & Expenses', icon: Receipt, category: 'ACCOUNTS' },
    { id: 'inventory', label: 'Site Inventory', icon: Warehouse, category: 'OPERATIONS' },
    { id: 'vendors', label: 'Vendor Supplies', icon: Truck, category: 'OPERATIONS' },
    { id: 'tasks', label: 'Tasks & Calendar', icon: ClipboardList, category: 'OPERATIONS' },
    { id: 'documents', label: 'Doc Locker', icon: FolderOpen, category: 'ACCOUNTS' },
    { id: 'reports', label: 'Reports Hub', icon: FileText, category: 'ACCOUNTS' },
    { id: 'whatsapp', label: 'WhatsApp Center', icon: MessageSquare, category: 'MARKETING' },
    { id: 'ai-assistant', label: 'AI Assistant', icon: Sparkles, category: 'INTELLIGENCE' },
    { id: 'users', label: 'Staff Management', icon: Briefcase, category: 'ADMIN' },
    { id: 'settings', label: 'System Settings', icon: Settings, category: 'ADMIN' },
  ];

  // Group items by category for cleaner structure
  const categories = ['CORE', 'CRM', 'OPERATIONS', 'ACCOUNTS', 'MARKETING', 'INTELLIGENCE', 'ADMIN'];

  return (
    <aside
      className={`h-screen bg-slate-950 border-r border-slate-800 flex flex-col justify-between transition-all duration-300 relative select-none ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Brand logo container */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800 bg-slate-950">
        <div className="flex items-center space-x-2.5 overflow-hidden">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-sky-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20 shrink-0">
            <HardHat size={16} className="text-white animate-pulse" />
          </div>
          {!collapsed && (
            <span className="text-md font-bold text-slate-100 font-sans tracking-tight truncate bg-clip-text bg-gradient-to-r from-slate-100 to-slate-400">
              SHIV INFRA AI
            </span>
          )}
        </div>

        {/* Toggle Collapse */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex p-1 text-slate-500 hover:text-slate-300 hover:bg-slate-900 border border-slate-800/80 rounded-md transition-colors shrink-0 cursor-pointer"
        >
          {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>
      </div>

      {/* Nav menus */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-4 space-y-4">
        {categories.map((cat) => {
          const itemsInCat = menuItems.filter((i) => i.category === cat);
          if (itemsInCat.length === 0) return null;

          return (
            <div key={cat} className="space-y-1">
              {!collapsed && (
                <p className="text-[9px] font-bold text-slate-500 tracking-widest pl-2 mb-1">
                  {cat}
                </p>
              )}
              {itemsInCat.map((item) => {
                const IconComp = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onChangeTab(item.id)}
                    className={`w-full flex items-center px-3 py-2 rounded-xl text-xs font-medium transition-all group cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-sky-600/90 to-indigo-600/90 text-white shadow-lg shadow-sky-500/10'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                    }`}
                    title={collapsed ? item.label : undefined}
                  >
                    <IconComp
                      size={15}
                      className={`shrink-0 transition-transform group-hover:scale-110 ${
                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                      }`}
                    />
                    {!collapsed && (
                      <span className="ml-3 truncate">{item.label}</span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Footer block */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60">
        <div className="flex items-center space-x-2 overflow-hidden">
          <div className="h-7 w-7 rounded-full bg-slate-800 border border-slate-700/80 flex items-center justify-center shrink-0">
            <span className="text-[10px] font-semibold text-slate-300">AD</span>
          </div>
          {!collapsed && (
            <div className="text-left min-w-0">
              <p className="text-[10px] font-medium text-slate-200 truncate">{user?.name || 'Shiv Admin'}</p>
              <p className="text-[8px] font-mono text-slate-500 leading-none truncate">shivinfra55@gmail.com</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
