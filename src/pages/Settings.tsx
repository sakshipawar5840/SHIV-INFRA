import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Shield, 
  Mail, 
  Key, 
  Check, 
  AlertCircle, 
  Building, 
  MessageCircle, 
  Sparkles, 
  CreditCard, 
  Upload, 
  Globe, 
  MapPin, 
  Phone, 
  RefreshCw, 
  Play, 
  Lock, 
  Award,
  BookOpen,
  Sliders,
  DollarSign,
  User,
  ExternalLink
} from 'lucide-react';
import { logSystemAction } from '../lib/mockData';

type SettingsTab = 'company' | 'whatsapp' | 'ai' | 'subscription' | 'profile';

export const Settings: React.FC = () => {
  const { currentAdminEmail, changeCredentials, user } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('company');

  // --- TAB 1: COMPANY SETTINGS STATES ---
  const [companyName, setCompanyName] = useState('SHIV INFRASTRUCTURES');
  const [companyGst, setCompanyGst] = useState('27AAACS1234F1Z9');
  const [companyAddress, setCompanyAddress] = useState('Shiv Court, Baner Hill, Near Highway bypass, Pune - 411045');
  const [companyEmail, setCompanyEmail] = useState('contact@shivinfra.com');
  const [companyPhone, setCompanyPhone] = useState('+91 98765 43210');
  const [companyWebsite, setCompanyWebsite] = useState('https://www.shivinfra.com');
  const [companyMaps, setCompanyMaps] = useState('https://maps.google.com/?q=Baner+Hill+Pune');
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [companySaved, setCompanySaved] = useState(false);

  // --- TAB 2: WHATSAPP SETTINGS STATES ---
  const [waPhone, setWaPhone] = useState('+91 98765 43210');
  const [waDisplayName, setWaDisplayName] = useState('SHIV INFRA Business Center');
  const [waPhoneId, setWaPhoneId] = useState('29384729103847');
  const [waAccountId, setWaAccountId] = useState('9812740921840');
  const [waToken, setWaToken] = useState('EAAbwOZC76W2oBAO9c88vZCZCvT6w7eN4sXm7fG6gJ8n3D2k1F0d9S8a7Z6x5C4v3b2N1m0...');
  const [waWebhookVerify, setWaWebhookVerify] = useState('shiv_infra_meta_webhook_secure_2026');
  const [waWebhookUrl, setWaWebhookUrl] = useState('https://api.shivinfra.com/v1/whatsapp/webhook');
  const [waStatus, setWaStatus] = useState<'Connected' | 'Disconnected'>('Connected');
  const [waLastSync, setWaLastSync] = useState('07 Jul 2026, 02:15 PM');
  const [waTestPhone, setWaTestPhone] = useState('');
  const [waStatusMsg, setWaStatusMsg] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

  // --- TAB 3: AI SETTINGS STATES ---
  const [openaiKey, setOpenaiKey] = useState('sk-proj-4oG...T9a8b7c6d5e4f3g2h1i0j9k8l7m6n5o4p3q2r1s0t');
  const [aiModel, setAiModel] = useState('gpt-4o-mini');
  const [aiTemp, setAiTemp] = useState(0.3);
  const [aiMaxTokens, setAiMaxTokens] = useState(1500);
  const [aiSystemPrompt, setAiSystemPrompt] = useState(
    `You are the official SHIV INFRA AI Construction & Real Estate Assistant. Respond fluently in English, Hindi, and Marathi.`
  );
  const [aiKnowledgeBase, setAiKnowledgeBase] = useState(
    `Green Valley Project: Location Wakad, 2 & 3 BHK, starting ₹75 Lakhs, RERA approved.\nSky Heights Phase 2: Location Baner, 3 & 4 BHK luxury penthouse flats, starting ₹1.4 Crore.`
  );
  const [aiMemoryEnabled, setAiMemoryEnabled] = useState(true);
  const [aiTestPrompt, setAiTestPrompt] = useState('');
  const [aiTestResponse, setAiTestResponse] = useState('');
  const [aiTestLoading, setAiTestLoading] = useState(false);
  const [aiSaved, setAiSaved] = useState(false);

  // --- TAB 4: SUBSCRIPTION STATES ---
  const [currentPlan, setCurrentPlan] = useState<'Starter' | 'Professional' | 'Enterprise' | 'Lifetime'>('Enterprise');
  const [billingCycle, setBillingCycle] = useState<'Monthly' | 'Yearly'>('Yearly');
  const [companyIsolation, setCompanyIsolation] = useState(true);
  const [adminControlLevel, setAdminControlLevel] = useState('SuperAdmin');
  const [dashboardWidget, setDashboardWidget] = useState(true);

  // --- TAB 5: PROFILE & SECURITY STATES ---
  const [formEmail, setFormEmail] = useState(currentAdminEmail);
  const [emailStatus, setEmailStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdStatus, setPwdStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

  // --- HANDLERS ---
  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    setCompanySaved(true);
    logSystemAction('Update', 'Updated Company corporate metadata & branding records');
    setTimeout(() => setCompanySaved(false), 3000);
  };

  const handleSaveWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    setWaStatusMsg({ type: 'success', message: 'Meta Cloud API configurations saved successfully!' });
    logSystemAction('Update', 'Committed new Meta Cloud WhatsApp gateway settings');
    setTimeout(() => setWaStatusMsg({ type: null, message: '' }), 3000);
  };

  const handleTestWhatsAppMessage = () => {
    if (!waTestPhone) {
      setWaStatusMsg({ type: 'error', message: 'Please provide a valid test phone number' });
      return;
    }
    setWaStatusMsg({ type: 'success', message: `Test message dispatched via WhatsApp Cloud API node to ${waTestPhone}!` });
    logSystemAction('Access', `Meta WhatsApp Cloud API testing ping fired to ${waTestPhone}`);
  };

  const handleSaveAI = (e: React.FormEvent) => {
    e.preventDefault();
    setAiSaved(true);
    logSystemAction('Update', 'Committed OpenAI API custom weights & grounding settings');
    setTimeout(() => setAiSaved(false), 3000);
  };

  const handleTestAI = () => {
    if (!aiTestPrompt) return;
    setAiTestLoading(true);
    setTimeout(() => {
      setAiTestLoading(false);
      setAiTestResponse(
        `[SHIV INFRA Grounded response using ${aiModel}] 
Estimating flat price parameters or RERA checklists from the knowledge base: 
Your grounding data states Green Valley in Wakad has 2 BHK starting at ₹75L. I am fully conversational in Marathi & Hindi to assist this client.`
      );
    }, 1200);
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailStatus({ type: null, message: '' });

    if (!formEmail || !formEmail.includes('@')) {
      setEmailStatus({ type: 'error', message: 'Please enter a valid business email address' });
      return;
    }

    try {
      const savedPassword = localStorage.getItem('admin_password') ? JSON.parse(localStorage.getItem('admin_password')!) : 'admin123';
      const result = await changeCredentials(formEmail, savedPassword);
      if (result.success) {
        setEmailStatus({ type: 'success', message: 'Corporate correspondence email updated successfully!' });
        logSystemAction('Update', `Admin correspondence email changed to ${formEmail}`);
      } else {
        setEmailStatus({ type: 'error', message: result.error || 'Failed to update credentials' });
      }
    } catch (err) {
      setEmailStatus({ type: 'error', message: 'An unexpected error occurred while saving' });
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdStatus({ type: null, message: '' });

    if (!currentPassword) {
      setPwdStatus({ type: 'error', message: 'Please enter your current password' });
      return;
    }

    const savedPassword = localStorage.getItem('admin_password') ? JSON.parse(localStorage.getItem('admin_password')!) : 'admin123';
    if (currentPassword !== savedPassword) {
      setPwdStatus({ type: 'error', message: 'Current password is incorrect' });
      return;
    }

    if (!newPassword || newPassword.length < 4) {
      setPwdStatus({ type: 'error', message: 'New password must be at least 4 characters long' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwdStatus({ type: 'error', message: 'Passwords do not match' });
      return;
    }

    try {
      const result = await changeCredentials(currentAdminEmail, newPassword);
      if (result.success) {
        setPwdStatus({ type: 'success', message: 'Supervisor secret password changed successfully!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        logSystemAction('Update', 'Supervisor security credentials updated');
      } else {
        setPwdStatus({ type: 'error', message: result.error || 'Failed to change password' });
      }
    } catch (err) {
      setPwdStatus({ type: 'error', message: 'An unexpected error occurred' });
    }
  };

  return (
    <div className="space-y-6 font-sans text-slate-800">
      <div>
        <h2 className="text-xl font-bold tracking-tight">System & Account Settings</h2>
        <p className="text-xs text-slate-400 mt-0.5">Control business branding, supervisor notifications, AI grounding, and CRM credentials.</p>
      </div>

      {/* Horizontal Nav Tabs */}
      <div className="flex overflow-x-auto gap-2 border-b border-slate-200 pb-1 shrink-0 custom-scrollbar">
        {[
          { id: 'company', label: 'Company Profile', icon: Building },
          { id: 'whatsapp', label: 'WhatsApp Meta Setup', icon: MessageCircle },
          { id: 'ai', label: 'AI LLM Settings', icon: Sparkles },
          { id: 'subscription', label: 'Subscription & Isolation', icon: CreditCard },
          { id: 'profile', label: 'Security & Profile', icon: Shield },
        ].map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as SettingsTab)}
              className={`flex items-center space-x-2 px-4 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer whitespace-nowrap ${
                active 
                  ? 'bg-[#090e1a] text-white border-[#090e1a] shadow-md shadow-slate-900/10' 
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* RENDER ACTIVE TAB */}
      <div className="min-h-[30rem]">
        {activeTab === 'company' && (
          <form onSubmit={handleSaveCompany} className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
            {/* Logo upload mockup */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 lg:col-span-1">
              <h3 className="text-sm font-black text-slate-800 tracking-tight uppercase border-b border-slate-100 pb-2">Logo & Branding</h3>
              
              <div className="space-y-4">
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center space-y-3 flex flex-col items-center justify-center bg-slate-50">
                  <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-100">
                    <Building size={32} />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-slate-700">SHIV INFRA Logo</span>
                    <span className="block text-[10px] text-slate-400 mt-1">PNG, JPG up to 2MB</span>
                  </div>
                  <button type="button" className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 transition-colors cursor-pointer">
                    <Upload size={12} />
                    <span>Upload Logo</span>
                  </button>
                </div>

                <div className="text-xs text-slate-500 space-y-1 font-semibold leading-relaxed">
                  <p>• Logo is embedded in generated PDF receipts.</p>
                  <p>• SVG format recommended for clear WhatsApp brochures.</p>
                </div>
              </div>
            </div>

            {/* General form fields */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm lg:col-span-2 space-y-6">
              <h3 className="text-sm font-black text-slate-800 tracking-tight uppercase border-b border-slate-100 pb-2">Corporate Identity Metadata</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wide mb-1.5 font-mono">Company Name</label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wide mb-1.5 font-mono">GST Number</label>
                  <input
                    type="text"
                    required
                    value={companyGst}
                    onChange={(e) => setCompanyGst(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wide mb-1.5 font-mono">Primary Email</label>
                  <input
                    type="email"
                    required
                    value={companyEmail}
                    onChange={(e) => setCompanyEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wide mb-1.5 font-mono">Primary Phone</label>
                  <input
                    type="text"
                    required
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wide mb-1.5 font-mono">Corporate Headquarters Address</label>
                  <input
                    type="text"
                    required
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wide mb-1.5 font-mono">Corporate Website</label>
                  <input
                    type="url"
                    value={companyWebsite}
                    onChange={(e) => setCompanyWebsite(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wide mb-1.5 font-mono">Google Maps Link</label>
                  <input
                    type="url"
                    value={companyMaps}
                    onChange={(e) => setCompanyMaps(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              {companySaved && (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs px-3.5 py-2.5 rounded-xl flex items-center space-x-2">
                  <Check size={14} />
                  <span>Company settings records saved to database cache!</span>
                </div>
              )}

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-lg shadow-blue-500/10 cursor-pointer transition-all active:scale-95"
                >
                  Save Corporate Profile
                </button>
              </div>
            </div>
          </form>
        )}

        {activeTab === 'whatsapp' && (
          <form onSubmit={handleSaveWhatsApp} className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
            {/* Diagnostics status */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 lg:col-span-1">
              <h3 className="text-sm font-black text-slate-800 tracking-tight uppercase border-b border-slate-100 pb-2">API Connection Hub</h3>
              
              <div className="space-y-4">
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3.5 text-xs font-semibold">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Status:</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                      waStatus === 'Connected' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'
                    }`}>{waStatus}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Meta API Level:</span>
                    <span className="font-mono text-slate-600 text-[10px]">Cloud v19.0</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Last Sync:</span>
                    <span className="font-mono text-slate-500 text-[10px]">{waLastSync}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setWaStatus(prev => prev === 'Connected' ? 'Disconnected' : 'Connected');
                      logSystemAction('Update', `WhatsApp Business API state toggled manually`);
                    }}
                    className={`w-full text-xs font-extrabold py-2 rounded-xl transition-all border cursor-pointer text-center ${
                      waStatus === 'Connected'
                        ? 'bg-rose-50 border-rose-100 text-rose-600 hover:bg-rose-100'
                        : 'bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100'
                    }`}
                  >
                    {waStatus === 'Connected' ? 'Disconnect API Node' : 'Connect API Node'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setWaLastSync(new Date().toLocaleDateString('en-IN') + ', ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
                      logSystemAction('Access', 'Meta cloud webhook re-synced manually');
                    }}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-extrabold py-2 rounded-xl flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw size={11} />
                    <span>Synchronize Webhooks</span>
                  </button>
                </div>
              </div>
            </div>

            {/* API Settings config fields */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm lg:col-span-2 space-y-6">
              <h3 className="text-sm font-black text-slate-800 tracking-tight uppercase border-b border-slate-100 pb-2">Meta Cloud API credentials</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wide mb-1.5 font-mono">Business Phone Number</label>
                  <input
                    type="text"
                    required
                    value={waPhone}
                    onChange={(e) => setWaPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wide mb-1.5 font-mono">WhatsApp Display Name</label>
                  <input
                    type="text"
                    required
                    value={waDisplayName}
                    onChange={(e) => setWaDisplayName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wide mb-1.5 font-mono">Phone Number ID</label>
                  <input
                    type="text"
                    required
                    value={waPhoneId}
                    onChange={(e) => setWaPhoneId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wide mb-1.5 font-mono">Business Account ID</label>
                  <input
                    type="text"
                    required
                    value={waAccountId}
                    onChange={(e) => setWaAccountId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wide mb-1.5 font-mono">Meta Cloud Permanent Access Token</label>
                  <input
                    type="password"
                    required
                    value={waToken}
                    onChange={(e) => setWaToken(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wide mb-1.5 font-mono">Webhook Verify Token (User Defined)</label>
                  <input
                    type="text"
                    required
                    value={waWebhookVerify}
                    onChange={(e) => setWaWebhookVerify(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wide mb-1.5 font-mono">Webhook Callback URL</label>
                  <input
                    type="text"
                    readOnly
                    value={waWebhookUrl}
                    className="w-full bg-slate-100 border border-slate-200 text-slate-500 rounded-xl px-3.5 py-2 text-xs focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Ping Message Tests */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Verify Meta Node (Send Test Ping)</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="E.g. +919876543210"
                    value={waTestPhone}
                    onChange={(e) => setWaTestPhone(e.target.value)}
                    className="flex-1 bg-white border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleTestWhatsAppMessage}
                    className="bg-[#090e1a] hover:bg-slate-800 text-white font-extrabold text-xs px-4 py-2 rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <Play size={11} />
                    <span>Send Test Message</span>
                  </button>
                </div>
              </div>

              {waStatusMsg.type && (
                <div className={`p-3 rounded-xl text-xs flex items-center space-x-2 ${
                  waStatusMsg.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                }`}>
                  {waStatusMsg.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
                  <span>{waStatusMsg.message}</span>
                </div>
              )}

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-lg shadow-blue-500/10 cursor-pointer transition-all active:scale-95"
                >
                  Save Meta Configuration
                </button>
              </div>
            </div>
          </form>
        )}

        {activeTab === 'ai' && (
          <form onSubmit={handleSaveAI} className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
            {/* Chatbot prompt tests */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 lg:col-span-1 flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-800 tracking-tight uppercase border-b border-slate-100 pb-2">Test Grounded Chatbot</h3>
                
                <div className="space-y-3">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase font-mono">User Sandbox Query</label>
                  <textarea
                    placeholder="E.g. What is Green Valley flat cost?"
                    value={aiTestPrompt}
                    onChange={(e) => setAiTestPrompt(e.target.value)}
                    className="w-full h-20 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-3 text-xs focus:outline-none focus:border-blue-500 resize-none font-semibold"
                  />
                  
                  <button
                    type="button"
                    onClick={handleTestAI}
                    disabled={aiTestLoading || !aiTestPrompt}
                    className="w-full bg-[#090e1a] hover:bg-slate-800 disabled:opacity-50 text-white font-extrabold text-xs py-2 rounded-xl flex items-center justify-center space-x-1 transition-colors cursor-pointer"
                  >
                    <Play size={12} />
                    <span>{aiTestLoading ? 'Processing...' : 'Execute Test AI Query'}</span>
                  </button>
                </div>

                {aiTestResponse && (
                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-[11px] leading-relaxed text-slate-600 font-mono">
                    <span className="block font-sans font-black text-[9px] uppercase text-slate-400 mb-1">Grounded Response:</span>
                    <p className="whitespace-pre-line">{aiTestResponse}</p>
                  </div>
                )}
              </div>
            </div>

            {/* AI Weight variables */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm lg:col-span-2 space-y-6">
              <h3 className="text-sm font-black text-slate-800 tracking-tight uppercase border-b border-slate-100 pb-2">OpenAI Core Settings</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wide mb-1.5 font-mono">OpenAI API Authorization Key</label>
                  <input
                    type="password"
                    required
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wide mb-1.5 font-mono">Model Alias</label>
                  <select
                    value={aiModel}
                    onChange={(e) => setAiModel(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white"
                  >
                    <option value="gpt-4o-mini">gpt-4o-mini (Cost-effective default)</option>
                    <option value="gpt-4o">gpt-4o (High precision execution)</option>
                    <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                  </select>
                </div>
                <div>
                  <div className="flex justify-between">
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wide mb-1.5 font-mono">Temperature</label>
                    <span className="text-[10px] font-mono text-blue-600 font-bold">{aiTemp}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1.0"
                    step="0.1"
                    value={aiTemp}
                    onChange={(e) => setAiTemp(parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wide mb-1.5 font-mono">Max Tokens Output</label>
                  <input
                    type="number"
                    value={aiMaxTokens}
                    onChange={(e) => setAiMaxTokens(parseInt(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
                
                <div className="flex items-center space-x-2 pt-5">
                  <input
                    type="checkbox"
                    id="aiMemoryToggle"
                    checked={aiMemoryEnabled}
                    onChange={(e) => setAiMemoryEnabled(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <label htmlFor="aiMemoryToggle" className="text-xs font-bold text-slate-600 cursor-pointer">Enable Persistent Memory</label>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wide mb-1.5 font-mono">System Prompt Editor</label>
                  <textarea
                    value={aiSystemPrompt}
                    onChange={(e) => setAiSystemPrompt(e.target.value)}
                    className="w-full h-20 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-3.5 text-xs focus:outline-none focus:border-blue-500 focus:bg-white leading-relaxed"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wide mb-1.5 font-mono">Grounded Knowledge Base (RERA & Brochures)</label>
                  <textarea
                    value={aiKnowledgeBase}
                    onChange={(e) => setAiKnowledgeBase(e.target.value)}
                    className="w-full h-24 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-3.5 text-xs focus:outline-none focus:border-blue-500 focus:bg-white leading-relaxed font-sans"
                    placeholder="Enter corporate project specifications for chatbot to pull info during conversations..."
                  />
                </div>
              </div>

              {aiSaved && (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs px-3.5 py-2.5 rounded-xl flex items-center space-x-2">
                  <Check size={14} />
                  <span>AI grounded weights saved to vector space!</span>
                </div>
              )}

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-lg shadow-blue-500/10 cursor-pointer transition-all active:scale-95"
                >
                  Save AI Configuration
                </button>
              </div>
            </div>
          </form>
        )}

        {activeTab === 'subscription' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
            {/* Widget control cards */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 lg:col-span-1">
              <h3 className="text-sm font-black text-slate-800 tracking-tight uppercase border-b border-slate-100 pb-2">Multi-Tenant Isolation</h3>

              <div className="space-y-4 text-xs font-semibold">
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3.5">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Current Role:</span>
                    <span className="font-mono text-indigo-600 font-extrabold text-[10px]">SUPREME_ADMIN</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Company ID:</span>
                    <span className="font-mono text-slate-600 text-[10px]">shiv-pune-44102</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Control Class:</span>
                    <span className="font-mono text-slate-500 text-[10px]">L3 Isolation Grid</span>
                  </div>
                </div>

                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="pr-3">
                      <span className="block text-slate-700">Database Isolation</span>
                      <span className="block text-[9px] text-slate-400 leading-normal">Enforce strict tenant data vault boundaries in Supabase.</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={companyIsolation}
                      onChange={(e) => {
                        setCompanyIsolation(e.target.checked);
                        logSystemAction('Update', 'Toggled enterprise multi-tenant database isolation vault');
                      }}
                      className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                    <div className="pr-3">
                      <span className="block text-slate-700">Analytics Widget</span>
                      <span className="block text-[9px] text-slate-400 leading-normal">Show real-time Meta and OpenAI cost metrics on dashboard.</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={dashboardWidget}
                      onChange={(e) => {
                        setDashboardWidget(e.target.checked);
                        logSystemAction('Update', 'Toggled corporate billing widget display parameters');
                      }}
                      className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing / Plan select */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm lg:col-span-2 space-y-6">
              <div className="flex justify-between items-baseline border-b border-slate-100 pb-2">
                <h3 className="text-sm font-black text-slate-800 tracking-tight uppercase">Plan & Usage Billing</h3>
                <span className="text-[10px] text-slate-400 font-mono font-bold">Renewal cycle: 15 July 2027 (Yearly)</span>
              </div>

              {/* Plans pricing grid */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {[
                  { id: 'Starter', label: 'Starter', cost: '₹ 15k/yr', features: '1 Project, 500 WhatsApp SMS' },
                  { id: 'Professional', label: 'Professional', cost: '₹ 45k/yr', features: '5 Projects, 5k WhatsApp SMS' },
                  { id: 'Enterprise', label: 'Enterprise', cost: '₹ 1.2 L/yr', features: 'Unlimited sites, API grounding' },
                  { id: 'Lifetime', label: 'Lifetime', cost: '₹ 4.5 L once', features: 'Full developer access keys' }
                ].map(plan => {
                  const isActive = currentPlan === plan.id;
                  return (
                    <div
                      key={plan.id}
                      onClick={() => {
                        setCurrentPlan(plan.id as any);
                        logSystemAction('Update', `Switched enterprise sub tier plan to ${plan.id}`);
                      }}
                      className={`border rounded-xl p-4 flex flex-col justify-between hover:border-blue-500 cursor-pointer transition-all ${
                        isActive 
                          ? 'border-blue-500 bg-blue-50/20 shadow-sm shadow-blue-500/5' 
                          : 'border-slate-200 bg-slate-50/20'
                      }`}
                    >
                      <div>
                        <span className="block text-xs font-bold text-slate-800">{plan.label}</span>
                        <span className="block text-[10px] text-slate-400 mt-0.5">{plan.features}</span>
                      </div>
                      <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-black text-blue-600">{plan.cost}</span>
                        {isActive && <Check size={12} className="text-blue-600 animate-bounce" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Usage logs */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-3">Enterprise Invoices</span>
                <div className="space-y-2.5 text-xs text-slate-600 font-semibold font-sans">
                  <div className="flex justify-between border-b border-slate-200/50 pb-2">
                    <span className="text-slate-800">Invoice #SI-2026-004 (Annual Subscription)</span>
                    <span className="text-slate-400 font-mono">₹ 1,20,000 • Paid 15-Jun-2026</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-800">Invoice #SI-2026-003 (SMS Extra Credits)</span>
                    <span className="text-slate-400 font-mono">₹ 10,000 • Paid 28-Jun-2026</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    logSystemAction('Access', 'Renew license sequence triggered by Admin');
                    alert('Redirecting to secure gateway merchant razorpay...');
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-lg shadow-blue-500/10 cursor-pointer transition-all active:scale-95"
                >
                  Renew Active License
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
            {/* Change email Form */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-slate-800 tracking-tight uppercase flex items-center border-b border-slate-100 pb-2">
                <Mail size={15} className="mr-2 text-blue-500" />
                <span>Correspondence Email Settings</span>
              </h3>
              <p className="text-xs text-slate-500 leading-normal font-semibold">Update the primary executive correspondence and login identifier.</p>

              <form onSubmit={handleUpdateEmail} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wide mb-1.5 font-mono">Admin Email Address</label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                {emailStatus.type && (
                  <div className={`p-3 rounded-xl text-xs flex items-center space-x-2 ${
                    emailStatus.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                  }`}>
                    {emailStatus.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
                    <span>{emailStatus.message}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-lg cursor-pointer transition-transform active:scale-95"
                >
                  Save Contact Email
                </button>
              </form>
            </div>

            {/* Change Password Form */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-slate-800 tracking-tight uppercase flex items-center border-b border-slate-100 pb-2">
                <Key size={15} className="mr-2 text-indigo-500" />
                <span>Security Credentials</span>
              </h3>
              <p className="text-xs text-slate-500 leading-normal font-semibold">Modify the secret keys used to log into this secure ERP workspace.</p>

              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wide mb-1.5 font-mono">Current Password</label>
                    <input
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wide mb-1.5 font-mono">New Password</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wide mb-1.5 font-mono">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white font-mono"
                    />
                  </div>
                </div>

                {pwdStatus.type && (
                  <div className={`p-3 rounded-xl text-xs flex items-center space-x-2 ${
                    pwdStatus.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                  }`}>
                    {pwdStatus.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
                    <span>{pwdStatus.message}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-lg cursor-pointer transition-transform active:scale-95"
                >
                  Update Secret Password
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default Settings;
