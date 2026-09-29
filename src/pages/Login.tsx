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
    <div className="min-h-screen bg-bg-app flex flex-col justify-between antialiased font-sans select-none" style={{
      backgroundImage: `
        radial-gradient(circle at 15% 20%, rgba(37,99,235,0.08), transparent 35%),
        radial-gradient(circle at 85% 80%, rgba(79,70,229,0.06), transparent 35%)
      `,
      backgroundAttachment: 'fixed'
    }}>
      {/* Main split-screen container */}
      <div className="flex-1 flex flex-col lg:flex-row">
        
        {/* Left Side: Dark-blue slate Login form column */}
        <div id="login-form-panel" className="w-full lg:w-[42%] bg-white flex flex-col justify-between p-8 lg:p-12 shadow-xl relative z-10">
          
          {/* Top Logo and branding header */}
          <div className="text-center space-y-2 mt-4">
            <svg viewBox="0 0 100 80" className="w-18 h-18 mx-auto mb-2" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Verticals with gradient */}
              <path d="M42 20H48V48H42V20Z" fill="url(#logoGrad)" />
              <path d="M50 12H56V48H50V12Z" fill="url(#logoGrad)" />
              <path d="M58 25H64V48H58V25Z" fill="url(#logoGrad)" />
              <path d="M34 28H40V48H34V28Z" fill="url(#logoGrad)" />
              
              {/* Horizontal stripes representing building windows */}
              <path d="M34 32H40V34H34V32ZM34 38H40V40H34V38ZM42 24H48V26H42V24ZM42 30H48V32H42V30ZM42 36H48V38H42V36ZM50 16H56V18H50V16ZM50 22H56V24H50V22ZM50 28H56V30H50V28ZM50 34H56V36H50V34ZM58 29H64V31H58V29ZM58 35H64V37H58V35Z" fill="#0F172A" />

              {/* Triangular roof overlaying */}
              <path d="M25 48L50 35L75 48" stroke="url(#logoGrad)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              {/* Base of the roof */}
              <path d="M35 48H65" stroke="url(#logoGrad)" strokeWidth="2" strokeLinecap="round"/>
              {/* Small window/box on house */}
              <rect x="47" y="42" width="6" height="5" fill="url(#logoGrad)" rx="0.5"/>
              <path d="M50 42V47M47 44.5H53" stroke="#0F172A" strokeWidth="0.8"/>

              <defs>
                <linearGradient id="logoGrad" x1="34" y1="12" x2="64" y2="48" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#174EA6" />
                  <stop offset="50%" stopColor="#4F46E5" />
                  <stop offset="100%" stopColor="#0F8B8D" />
                </linearGradient>
              </defs>
            </svg>
             <h1 className="text-xl font-black tracking-widest text-black font-display">SHIV INFRA AI</h1>
             <p className="text-[9px] text-primary font-extrabold tracking-[0.25em] uppercase">— CONSTRUCTION AI —</p>
          </div>

          {/* Center Welcome and input card */}
          <div className="my-8 space-y-6">
            <div className="space-y-1.5 text-center">
<h2 className="text-3xl font-black tracking-tight text-black font-display">Welcome Back</h2>
                <p className="text-sm text-text-secondary font-medium">Sign in to your SHIV INFRA AI account</p>
            </div>

        
            {/* Lock illustration circle */}
            <div className="flex flex-col items-center justify-center space-y-2 py-2">
<div className="relative flex items-center justify-center h-16 w-16 rounded-full border border-dashed border-primary/30 bg-primary/5">
                  <div className="h-10 w-10 rounded-full bg-primary/5 flex items-center justify-center text-primary shadow-sm shadow-primary/5">
                  <Lock size={18} />
                </div>
              </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-black mt-2 font-display">
                  Enter Admin Password
                </h3>
              <p className="text-[11px] text-text-secondary text-center px-4">
                Secure access to SHIV INFRA AI workspace.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 max-w-sm w-full mx-auto">
              {role === 'Admin' && (
                <div className="space-y-2">
                  <div className="relative">
                     <span className="absolute inset-y-0 left-4 flex items-center text-text-secondary pointer-events-none">
                      <Lock size={15} />
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter Password"
                       className="w-full bg-surface border border-border text-text-primary placeholder-text-secondary rounded-xl pl-11 pr-11 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-4 flex items-center text-text-secondary hover:text-black transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <p className="text-[11px] text-danger text-center font-mono font-bold uppercase tracking-wider bg-danger/5 border border-danger/20 py-2.5 rounded-xl">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white font-extrabold text-xs py-3 rounded-xl shadow-lg shadow-primary/10 flex items-center justify-center space-x-2 transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 size={15} className="animate-spin text-black" />
                ) : (
                  <>
                    <Lock size={14} className="text-black" />
                    <span className="uppercase tracking-wider">
                    Sign In
                    </span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Bottom Secure Shield indicator */}
          <div className="flex items-center justify-center space-x-2 text-[10px] text-text-secondary font-mono mt-4">
            <ShieldCheck size={14} className="text-success" />
             <span>Secure access to SHIV INFRA AI</span>
          </div>

        </div>

        {/* Right Side: Cinematic Sunset Hero Banner with White Helmet Foreground */}
        <div 
          id="hero-banner-panel" 
          className="hidden lg:flex lg:w-[58%] relative min-h-screen flex-col justify-between p-12 bg-bg-app overflow-hidden"
        >
          {/* Generated Construction Sunset with helmet background image */}
          <div 
            className="absolute inset-0 bg-cover bg-center z-0 filter saturate-[1.1]" 
            style={{ backgroundImage: `url(${loginBg})` }}
          />
          
          {/* Multi-layered custom cinematic overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/5 z-1" />
          <div className="absolute inset-0 bg-white/5 z-1" />

          {/* Top blank space spacer */}
          <div className="z-10" />

          {/* Bottom overlapping metrics display bar */}
          <div className="w-full bg-surface border border-border rounded-2xl p-6 grid grid-cols-4 gap-4 backdrop-blur-md z-10 shadow-2xl relative">
            
            {/* Feature 1 */}
            <div className="flex flex-col items-center text-center space-y-2.5">
<div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                  <Building2 size={18} />
                </div>
               <span className="text-[10px] font-black uppercase tracking-wider text-text-primary">Quality Construction</span>
            </div>

            {/* Feature 2 */}
            <div className="flex flex-col items-center text-center space-y-2.5">
<div className="h-10 w-10 rounded-xl bg-ai/5 flex items-center justify-center text-ai border border-ai/10">
                  <Users size={18} />
                </div>
               <span className="text-[10px] font-black uppercase tracking-wider text-text-primary">Expert Team</span>
            </div>

            {/* Feature 3 */}
            <div className="flex flex-col items-center text-center space-y-2.5">
<div className="h-10 w-10 rounded-xl bg-teal/5 flex items-center justify-center text-teal border border-teal/10">
                  <Clock size={18} />
                </div>
               <span className="text-[10px] font-black uppercase tracking-wider text-text-primary">On-Time Delivery</span>
            </div>

            {/* Feature 4 */}
            <div className="flex flex-col items-center text-center space-y-2.5">
<div className="h-10 w-10 rounded-xl bg-warning/5 flex items-center justify-center text-warning border border-warning/10">
                  <TrendingUp size={18} />
                </div>
               <span className="text-[10px] font-black uppercase tracking-wider text-text-primary">Customer Satisfaction</span>
            </div>

          </div>

        </div>

      </div>

      {/* Global standard brand copyright footer */}
      <footer className="bg-surface border-t border-border py-3 text-center text-[10px] text-text-secondary tracking-wider relative z-20">
        © 2026 SHIV INFRA AI
      </footer>
    </div>
  );
};

export default Login;
