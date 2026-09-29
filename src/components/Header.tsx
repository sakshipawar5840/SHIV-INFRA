import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Bell, Search, Sparkles, LogOut, CheckCircle, AlertTriangle, Info, Clock, User, ShieldCheck } from 'lucide-react';
import { getStoredData, saveStoredData } from '../lib/mockData';

interface HeaderProps {
  onSearch?: (term: string) => void;
  openChat: () => void;
}

interface AlertItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  time: string;
  read: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onSearch, openChat }) => {
  const { user, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  // Real-time notification data in state with persistence
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  
  // Dynamic Live clock state
  const [timeStr, setTimeTimeStr] = useState('');
  const [dateStr, setTimeDateStr] = useState('');

  useEffect(() => {
    const defaultAlerts: AlertItem[] = [];
    setAlerts(getStoredData<AlertItem[]>('notifications', defaultAlerts));
  }, []);

  // Update dynamic clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeTimeStr(now.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setTimeDateStr(now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: '2-digit', year: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    if (onSearch) {
      onSearch(val);
    }
  };

  const markAllRead = () => {
    const updated = alerts.map(a => ({ ...a, read: true }));
    setAlerts(updated);
    saveStoredData('notifications', updated);
  };

  const clearAlerts = () => {
    setAlerts([]);
    saveStoredData('notifications', []);
  };

  const unreadCount = alerts.filter(a => !a.read).length;

  return (
    <header className="h-16 border-b border-border bg-surface backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Search query */}
      <div className="flex-1 max-w-md relative">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-text-secondary">
          <Search size={16} />
        </div>
        <input
          type="text"
          placeholder="Search projects, leads, bills..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full bg-surface border border-border text-text-primary placeholder-text-secondary rounded-full pl-10 pr-4 py-1.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all font-sans"
        />
      </div>

      {/* Utilities */}
      <div className="flex items-center space-x-4">
        {/* Dynamic IST Clock widget */}
        <div className="hidden md:flex items-center space-x-2 bg-surface border border-border rounded-full px-4 py-1 text-text-secondary text-xs font-mono">
          <Clock size={12} className="text-primary" />
          <span>{dateStr}</span>
          <span className="text-text-secondary">|</span>
          <span className="text-primary font-semibold">{timeStr}</span>
        </div>

        {/* WhatsApp connected badge */}
        <div className="hidden lg:flex items-center space-x-1.5 bg-success/5 border-success/20 text-success text-xs px-3 py-1 rounded-full font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse"></span>
          <span>WhatsApp Connected</span>
        </div>

        {/* AI command launch */}
        <button
          onClick={openChat}
          className="flex items-center space-x-1 bg-primary text-white font-medium text-xs px-3.5 py-1.5 rounded-full shadow-lg shadow-primary/10 hover:shadow-primary/20 hover:scale-105 active:scale-95 transition-all cursor-pointer cursor-pointer"
        >
          <Sparkles size={13} className="text-warning animate-pulse" />
          <span>AI Assistant</span>
        </button>

        {/* Alerts Bell Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg-app rounded-full transition-all relative cursor-pointer"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-4 w-4 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-surface border border-border rounded-xl shadow-2xl z-50 overflow-hidden text-text-primary">
              <div className="flex items-center justify-between px-4 py-3 bg-surface border-b border-border">
                <span className="text-xs font-semibold text-text-primary">Alert Center</span>
                <div className="flex space-x-2 text-[10px] text-text-secondary">
                  <button onClick={markAllRead} className="hover:text-primary cursor-pointer">Mark all read</button>
                  <span>•</span>
                  <button onClick={clearAlerts} className="hover:text-danger cursor-pointer">Clear all</button>
                </div>
              </div>
              <div className="max-h-72 overflow-y-auto custom-scrollbar">
                {alerts.length === 0 ? (
                  <div className="p-6 text-center text-xs text-text-secondary">
                    No active notifications
                  </div>
                ) : (
                  alerts.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3.5 border-b border-border/60 flex items-start space-x-2.5 hover:bg-bg-app transition-colors ${
                        !item.read ? 'bg-primary/5' : ''
                      }`}
                    >
                      <div className="mt-0.5">
                        {item.type === 'success' && <CheckCircle size={14} className="text-success" />}
                        {item.type === 'warning' && <AlertTriangle size={14} className="text-warning" />}
                        {item.type === 'info' && <Info size={14} className="text-primary" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                          <p className={`text-xs font-medium truncate ${!item.read ? 'text-text-primary font-semibold' : 'text-text-secondary'}`}>
                            {item.title}
                          </p>
                          <span className="text-[9px] text-text-secondary font-mono shrink-0 ml-1">{item.time}</span>
                        </div>
                          <p className="text-[11px] text-text-secondary mt-0.5 line-clamp-2">{item.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown Menu */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center space-x-2 p-1 pl-2 pr-3 bg-surface border border-border hover:bg-bg-app rounded-full transition-all cursor-pointer"
          >
            <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-white text-[10px] font-bold shadow-md shadow-primary/10">
              <User size={12} />
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-medium text-text-primary">Shiv Admin</p>
              <p className="text-[9px] text-text-secondary leading-none">Super Admin</p>
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-3 w-48 bg-surface border border-border rounded-xl shadow-2xl z-50 overflow-hidden text-text-primary">
              <div className="p-3 border-b border-border bg-surface text-left">
                <p className="text-xs font-semibold text-text-primary truncate">{user?.name || 'Shiv Admin'}</p>
                <p className="text-[10px] text-text-secondary truncate">{user?.email || 'shivinfra55@gmail.com'}</p>
              </div>
              <div className="p-1">
                 <button
                   onClick={() => { setShowProfileMenu(false); }}
                   className="w-full flex items-center space-x-2 px-3 py-2 text-xs text-text-primary hover:bg-bg-app hover:text-text-primary rounded-lg transition-all text-left cursor-pointer"
                 >
                   <User size={13} />
                   <span>Profile</span>
                 </button>
                 <button
                   onClick={() => { setShowProfileMenu(false); }}
                   className="w-full flex items-center space-x-2 px-3 py-2 text-xs text-text-primary hover:bg-bg-app hover:text-text-primary rounded-lg transition-all text-left cursor-pointer"
                 >
                   <ShieldCheck size={13} />
                   <span>Account information</span>
                 </button>
                <div className="border-t border-border my-1" />
                <button
                  onClick={logout}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-xs text-danger hover:bg-danger/10 hover:text-danger rounded-lg transition-all text-left cursor-pointer"
                >
                  <LogOut size={13} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
