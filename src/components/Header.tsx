import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Bell, Search, Sparkles, LogOut, CheckCircle, AlertTriangle, Info, Clock, User } from 'lucide-react';
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
    // Seed and get stored notifications
    const defaultAlerts: AlertItem[] = [
      { id: 'al_1', title: 'New Lead Registered', message: 'Rohit Patil registered interest in Sky Heights', type: 'info', time: '10 mins ago', read: false },
      { id: 'al_2', title: 'Invoice Scanning Success', message: 'Gemini AI successfully processed ACC Cement receipt', type: 'success', time: '2 hours ago', read: false },
      { id: 'al_3', title: 'Low Stock Alert', message: 'TATA Steel rods are below the 5.0 Tons minimum safety limit', type: 'warning', time: '1 day ago', read: false }
    ];
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
    <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Search query */}
      <div className="flex-1 max-w-md relative">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
          <Search size={16} />
        </div>
        <input
          type="text"
          placeholder="Search projects, leads, bills..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-500 rounded-full pl-10 pr-4 py-1.5 text-sm focus:outline-none focus:border-sky-500/80 focus:ring-1 focus:ring-sky-500/50 transition-all font-sans"
        />
      </div>

      {/* Utilities */}
      <div className="flex items-center space-x-4">
        {/* Dynamic IST Clock widget */}
        <div className="hidden md:flex items-center space-x-2 bg-slate-950/40 border border-slate-800/80 rounded-full px-4 py-1 text-slate-400 text-xs font-mono">
          <Clock size={12} className="text-sky-400" />
          <span>{dateStr}</span>
          <span className="text-slate-600">|</span>
          <span className="text-sky-300 font-semibold">{timeStr}</span>
        </div>

        {/* WhatsApp connected badge */}
        <div className="hidden lg:flex items-center space-x-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-3 py-1 rounded-full font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>WhatsApp Connected</span>
        </div>

        {/* AI command launch */}
        <button
          onClick={openChat}
          className="flex items-center space-x-1 bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-medium text-xs px-3.5 py-1.5 rounded-full shadow-lg shadow-sky-500/10 hover:shadow-sky-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer cursor-pointer"
        >
          <Sparkles size={13} className="text-amber-300 animate-pulse" />
          <span>AI Assistant</span>
        </button>

        {/* Alerts Bell Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-full transition-all relative cursor-pointer"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-4 w-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden text-slate-300">
              <div className="flex items-center justify-between px-4 py-3 bg-slate-950/60 border-b border-slate-800">
                <span className="text-xs font-semibold text-slate-200">Alert Center</span>
                <div className="flex space-x-2 text-[10px] text-slate-400">
                  <button onClick={markAllRead} className="hover:text-sky-400 cursor-pointer">Mark all read</button>
                  <span>•</span>
                  <button onClick={clearAlerts} className="hover:text-rose-400 cursor-pointer">Clear all</button>
                </div>
              </div>
              <div className="max-h-72 overflow-y-auto custom-scrollbar">
                {alerts.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    No active notifications
                  </div>
                ) : (
                  alerts.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3.5 border-b border-slate-800/60 flex items-start space-x-2.5 hover:bg-slate-800/40 transition-colors ${
                        !item.read ? 'bg-sky-950/10' : ''
                      }`}
                    >
                      <div className="mt-0.5">
                        {item.type === 'success' && <CheckCircle size={14} className="text-emerald-400" />}
                        {item.type === 'warning' && <AlertTriangle size={14} className="text-amber-400" />}
                        {item.type === 'info' && <Info size={14} className="text-sky-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                          <p className={`text-xs font-medium truncate ${!item.read ? 'text-slate-100 font-semibold' : 'text-slate-300'}`}>
                            {item.title}
                          </p>
                          <span className="text-[9px] text-slate-500 font-mono shrink-0 ml-1">{item.time}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{item.message}</p>
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
            className="flex items-center space-x-2 p-1 pl-2 pr-3 bg-slate-950/40 hover:bg-slate-800 border border-slate-800 rounded-full transition-all cursor-pointer"
          >
            <div className="h-6 w-6 rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 flex items-center justify-center text-white text-[10px] font-bold shadow-md shadow-sky-500/10">
              <User size={12} />
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-medium text-slate-200">Shiv Admin</p>
              <p className="text-[9px] text-slate-500 leading-none">Super Admin</p>
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-3 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden text-slate-300">
              <div className="p-3 border-b border-slate-800 bg-slate-950/40 text-left">
                <p className="text-xs font-semibold text-slate-200 truncate">{user?.name || 'Shiv Admin'}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email || 'shivinfra55@gmail.com'}</p>
              </div>
              <div className="p-1">
                <button
                  onClick={logout}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 rounded-lg transition-all text-left cursor-pointer"
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
