import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2, 
  ShieldCheck,
  Building2,
  Users,
  Clock,
  TrendingUp
} from 'lucide-react';
// @ts-ignore
import loginBg from '../assets/images/login_bg_construction_1783433281335.jpg';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const [password, setPassword] = useState('');
  const role = 'Admin';
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [adminEmail] = useState(() => {
    try {
      const stored = localStorage.getItem('admin_email');
      return stored ? JSON.parse(stored) : 'admin@test.com';
    } catch {
      return 'admin@test.com';
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(adminEmail, password);
      if (!res.success) {
        setError(res.error || 'Incorrect access key.');
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b12] flex flex-col justify-between antialiased font-sans select-none">
      {/* Main split-screen container */}
      <div className="flex-1 flex flex-col lg:flex-row">
        
        {/* Left Side: Dark-blue slate Login form column */}
        <div id="login-form-panel" className="w-full lg:w-[42%] bg-[#0c101b] flex flex-col justify-between p-8 lg:p-12 border-r border-slate-900/60 shadow-2xl relative z-10">
          
          {/* Top Logo and branding header */}
          <div className="text-center space-y-2 mt-4">
            <svg viewBox="0 0 100 80" className="w-18 h-18 mx-auto mb-2" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Verticals with gradient */}
              <path d="M42 20H48V48H42V20Z" fill="url(#logoGrad)" />
              <path d="M50 12H56V48H50V12Z" fill="url(#logoGrad)" />
              <path d="M58 25H64V48H58V25Z" fill="url(#logoGrad)" />
              <path d="M34 28H40V48H34V28Z" fill="url(#logoGrad)" />
              
              {/* Horizontal stripes representing building windows */}
              <path d="M34 32H40V34H34V32ZM34 38H40V40H34V38ZM42 24H48V26H42V24ZM42 30H48V32H42V30ZM42 36H48V38H42V36ZM50 16H56V18H50V16ZM50 22H56V24H50V22ZM50 28H56V30H50V28ZM50 34H56V36H50V34ZM58 29H64V31H58V29ZM58 35H64V37H58V35Z" fill="#0c101b" />

              {/* Triangular roof overlaying */}
              <path d="M25 48L50 35L75 48" stroke="url(#logoGrad)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              {/* Base of the roof */}
              <path d="M35 48H65" stroke="url(#logoGrad)" strokeWidth="2" strokeLinecap="round"/>
              {/* Small window/box on house */}
              <rect x="47" y="42" width="6" height="5" fill="url(#logoGrad)" rx="0.5"/>
              <path d="M50 42V47M47 44.5H53" stroke="#0c101b" strokeWidth="0.8"/>

              <defs>
                <linearGradient id="logoGrad" x1="34" y1="12" x2="64" y2="48" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#F59E0B" />
                  <stop offset="50%" stopColor="#D97706" />
                  <stop offset="100%" stopColor="#B45309" />
                </linearGradient>
              </defs>
            </svg>
            <h1 className="text-xl font-black tracking-widest text-white font-display">SHIV INFRA</h1>
            <p className="text-[9px] text-amber-500 font-extrabold tracking-[0.25em] uppercase">— BUILDING DREAMS —</p>
          </div>

          {/* Center Welcome and input card */}
          <div className="my-8 space-y-6">
            <div className="space-y-1.5 text-center">
              <h2 className="text-2xl font-black tracking-tight text-white font-display">Welcome Back!</h2>
              <p className="text-xs text-slate-400 font-medium">Select your portal role to continue</p>
            </div>

        
            {/* Lock illustration circle */}
            <div className="flex flex-col items-center justify-center space-y-2 py-2">
              <div className="relative flex items-center justify-center h-16 w-16 rounded-full border border-dashed border-amber-500/40 bg-amber-500/5">
                <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-sm shadow-amber-500/5">
                  <Lock size={18} />
                </div>
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 mt-2 font-display">
                Enter Admin Password
              </h3>
             <p className="text-[11px] text-slate-500 text-center px-4">
                Use administrative password to access SHIV INFRA Admin Dashboard.
             </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 max-w-sm w-full mx-auto">
              {role === 'Admin' && (
                <div className="space-y-2">
                  <div className="relative">
                    <span className="absolute inset-y-0 left-4 flex items-center text-slate-500 pointer-events-none">
                      <Lock size={15} />
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter Password"
                      className="w-full bg-[#111625] border border-slate-850 text-slate-100 placeholder-slate-600 rounded-xl pl-11 pr-11 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500/30 focus:border-amber-500 transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-4 flex items-center text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <p className="text-[11px] text-rose-400 text-center font-mono font-bold uppercase tracking-wider bg-rose-500/10 border border-rose-500/20 py-2.5 rounded-xl">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-slate-950 font-extrabold text-xs py-3 rounded-xl shadow-lg shadow-amber-500/10 flex items-center justify-center space-x-2 transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 size={15} className="animate-spin text-slate-950" />
                ) : (
                  <>
                    <Lock size={14} className="text-slate-950" />
                    <span className="uppercase tracking-wider">
                    Login as Admin
                    </span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Bottom Secure Shield indicator */}
          <div className="flex items-center justify-center space-x-2 text-[10px] text-slate-500 font-mono mt-4">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>Secure access to SHIV INFRA Dashboard</span>
          </div>

        </div>

        {/* Right Side: Cinematic Sunset Hero Banner with White Helmet Foreground */}
        <div 
          id="hero-banner-panel" 
          className="hidden lg:flex lg:w-[58%] relative min-h-screen flex-col justify-between p-12 bg-slate-950 overflow-hidden"
        >
          {/* Generated Construction Sunset with helmet background image */}
          <div 
            className="absolute inset-0 bg-cover bg-center z-0 filter saturate-[1.1]" 
            style={{ backgroundImage: `url(${loginBg})` }}
          />
          
          {/* Multi-layered custom cinematic overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#070b12] via-transparent to-[#070b12]/30 z-1" />
          <div className="absolute inset-0 bg-slate-950/20 z-1" />

          {/* Top blank space spacer */}
          <div className="z-10" />

          {/* Bottom overlapping metrics display bar */}
          <div className="w-full bg-[#0c101b]/90 border border-slate-800/50 rounded-2xl p-6 grid grid-cols-4 gap-4 backdrop-blur-md z-10 shadow-2xl relative">
            
            {/* Feature 1 */}
            <div className="flex flex-col items-center text-center space-y-2.5">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/10">
                <Building2 size={18} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">Quality Construction</span>
            </div>

            {/* Feature 2 */}
            <div className="flex flex-col items-center text-center space-y-2.5">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/10">
                <Users size={18} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">Expert Team</span>
            </div>

            {/* Feature 3 */}
            <div className="flex flex-col items-center text-center space-y-2.5">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/10">
                <Clock size={18} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">On-Time Delivery</span>
            </div>

            {/* Feature 4 */}
            <div className="flex flex-col items-center text-center space-y-2.5">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/10">
                <TrendingUp size={18} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">Customer Satisfaction</span>
            </div>

          </div>

        </div>

      </div>

      {/* Global standard brand copyright footer */}
      <footer className="bg-[#05070e] border-t border-slate-900 py-3 text-center text-[10px] text-slate-500 tracking-wider relative z-20">
        © 2026 SHIV INFRA. All rights reserved.
      </footer>
    </div>
  );
};

export default Login;
