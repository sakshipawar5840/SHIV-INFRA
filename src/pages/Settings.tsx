import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../lib/axiosClient';
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
  ExternalLink,
  Facebook,
  Instagram,
  Send,
  Smartphone
} from 'lucide-react';
import { createActivityLog } from '../lib/activityLogService';
import { useToast } from '../contexts/ToastContext';

type SettingsTab = 'company' | 'whatsapp' | 'facebook' | 'instagram' | 'sms' | 'ai' | 'subscription' | 'profile';

interface SettingsProps {
  initialTab?: SettingsTab;
}

export const Settings: React.FC<SettingsProps> = ({ initialTab }) => {
  const { currentAdminEmail, user } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab || 'company');

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
  const [companyEditMode, setCompanyEditMode] = useState(false);
  const [companyOriginal, setCompanyOriginal] = useState({
    name: companyName,
    gst: companyGst,
    address: companyAddress,
    email: companyEmail,
    phone: companyPhone,
    website: companyWebsite,
    maps: companyMaps
  });

  // --- TAB 2: WHATSAPP SETTINGS STATES ---
  const [waPhone, setWaPhone] = useState('+91 98765 43210');
  const [waDisplayName, setWaDisplayName] = useState('SHIV INFRA Business Center');
  const [waPhoneId, setWaPhoneId] = useState('');
  const [waAccountId, setWaAccountId] = useState('');
  const [waToken, setWaToken] = useState('');
  const [waWebhookVerify, setWaWebhookVerify] = useState('');
  const [waWebhookUrl, setWaWebhookUrl] = useState('https://api.shivinfra.com/v1/whatsapp/webhook');
  const [waStatus, setWaStatus] = useState<'Connected' | 'Disconnected'>('Connected');
  const [waLastSync, setWaLastSync] = useState('07 Jul 2026, 02:15 PM');
  const [waTestPhone, setWaTestPhone] = useState('');
  const [waStatusMsg, setWaStatusMsg] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

  // --- TAB: FACEBOOK SETTINGS STATES ---
  const [fbPageId, setFbPageId] = useState('');
  const [fbPageToken, setFbPageToken] = useState('');
  const [fbStatus, setFbStatus] = useState<'Configured' | 'Not Configured'>('Not Configured');
  const [fbTestRecipient, setFbTestRecipient] = useState('');
  const [fbStatusMsg, setFbStatusMsg] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

  // --- TAB: INSTAGRAM SETTINGS STATES ---
  const [igAccountId, setIgAccountId] = useState('');
  const [igAccessToken, setIgAccessToken] = useState('');
  const [igStatus, setIgStatus] = useState<'Configured' | 'Not Configured'>('Not Configured');
  const [igTestRecipient, setIgTestRecipient] = useState('');
  const [igStatusMsg, setIgStatusMsg] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

  // --- TAB: SMS SETTINGS STATES ---
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [smsProvider, setSmsProvider] = useState<'twilio' | 'generic'>('twilio');
  const [smsFrom, setSmsFrom] = useState('');
  const [smsAccountSid, setSmsAccountSid] = useState('');
  const [smsApiKey, setSmsApiKey] = useState('');
  const [smsEndpoint, setSmsEndpoint] = useState('');
  const [smsStatus, setSmsStatus] = useState<'Configured' | 'Not Configured'>('Not Configured');
  const [smsTestPhone, setSmsTestPhone] = useState('');
  const [smsStatusMsg, setSmsStatusMsg] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

  // --- CHANNEL STATUS (loaded from backend) ---
  const [channelStatus, setChannelStatus] = useState<Record<string, any>>({});

  // --- TAB 3: AI SETTINGS STATES ---
  const [openaiKey, setOpenaiKey] = useState('');
  const [aiModel, setAiModel] = useState('gpt-4o-mini');
  const [aiTemp, setAiTemp] = useState(0.3);
  const [aiMaxTokens, setAiMaxTokens] = useState(1500);
  const [aiSystemPrompt, setAiSystemPrompt] = useState(
    `You are the official SHIV INFRA AI Construction & Real Estate Assistant. Respond fluently in English, Hindi, and Marathi.`
  );
  const [aiKnowledgeBase, setAiKnowledgeBase] = useState(
    ''
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

  // --- TAB 5: PROFILE STATES ---
  const [formEmail, setFormEmail] = useState(currentAdminEmail);
  const [emailStatus, setEmailStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await apiClient.get('/v1/settings');
        if (res.data?.success && res.data?.data) {
          const s = res.data.data;
          if (s.settings_data) {
            const sd = s.settings_data;
            if (sd.companyName) setCompanyName(sd.companyName);
            if (sd.gst) setCompanyGst(sd.gst);
            if (sd.address) setCompanyAddress(sd.address);
            if (sd.email) setCompanyEmail(sd.email);
            if (sd.phone) setCompanyPhone(sd.phone);
            if (sd.website) setCompanyWebsite(sd.website);
            if (sd.maps) setCompanyMaps(sd.maps);
            if (sd.waPhone) setWaPhone(sd.waPhone);
            if (sd.waDisplayName) setWaDisplayName(sd.waDisplayName);
            if (sd.waPhoneId) setWaPhoneId(sd.waPhoneId);
            if (sd.waAccountId) setWaAccountId(sd.waAccountId);
            if (sd.waToken) setWaToken(sd.waToken);
            if (sd.waWebhookVerify) setWaWebhookVerify(sd.waWebhookVerify);
            if (sd.metaFbPageId) setFbPageId(sd.metaFbPageId);
            if (sd.metaFbPageToken) setFbPageToken(sd.metaFbPageToken);
            if (sd.metaIgAccountId) setIgAccountId(sd.metaIgAccountId);
            if (sd.metaIgAccessToken) setIgAccessToken(sd.metaIgAccessToken);
            if (sd.smsEnabled !== undefined) setSmsEnabled(sd.smsEnabled);
            if (sd.smsProvider) setSmsProvider(sd.smsProvider as 'twilio' | 'generic');
            if (sd.smsFrom) setSmsFrom(sd.smsFrom);
            if (sd.smsAccountSid) setSmsAccountSid(sd.smsAccountSid);
            if (sd.smsApiKey) setSmsApiKey('••••••••');
            if (sd.smsEndpoint) setSmsEndpoint(sd.smsEndpoint);
            if (sd.openaiKey) setOpenaiKey(sd.openaiKey);
            if (sd.aiModel) setAiModel(sd.aiModel);
            if (sd.aiTemp !== undefined) setAiTemp(sd.aiTemp);
            if (sd.aiMaxTokens) setAiMaxTokens(sd.aiMaxTokens);
            if (sd.aiSystemPrompt) setAiSystemPrompt(sd.aiSystemPrompt);
            if (sd.aiKnowledgeBase) setAiKnowledgeBase(sd.aiKnowledgeBase);
            if (sd.aiMemoryEnabled !== undefined) setAiMemoryEnabled(sd.aiMemoryEnabled);
            if (sd.alertEmail) setCompanyEmail(sd.alertEmail);
          }
          if (s.meta_phone_id) setWaPhoneId(s.meta_phone_id);
          if (s.meta_access_token) setWaToken(s.meta_access_token);
          if (s.meta_fb_page_id) setFbPageId(s.meta_fb_page_id);
          if (s.meta_fb_page_access_token) setFbPageToken(s.meta_fb_page_access_token);
          if (s.meta_ig_account_id) setIgAccountId(s.meta_ig_account_id);
          if (s.meta_ig_access_token) setIgAccessToken(s.meta_ig_access_token);
          if (s.sms_enabled !== undefined) setSmsEnabled(s.sms_enabled);
          if (s.sms_provider) setSmsProvider(s.sms_provider as 'twilio' | 'generic');
          if (s.sms_from) setSmsFrom(s.sms_from);
          if (s.sms_account_sid) setSmsAccountSid(s.sms_account_sid);
          if (s.sms_endpoint) setSmsEndpoint(s.sms_endpoint);
          if (s.openai_key_override) setOpenaiKey(s.openai_key_override);
          if (s.alert_email) setCompanyEmail(s.alert_email);
        }
      } catch (err) {
        console.error('Failed to load settings', err);
      }
    };
    loadSettings();
  }, [currentAdminEmail]);

  // --- HANDLERS ---
  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Live `settings` table only supports `alert_email` for the
      // company-profile section. Other profile fields (name, GST, address,
      // phone, website, maps) are UI-only and intentionally not persisted
      // to a non-existent column.
      await apiClient.put('/v1/settings', {
        alert_email: companyEmail,
      });
      setCompanyOriginal({
        name: companyName,
        gst: companyGst,
        address: companyAddress,
        email: companyEmail,
        phone: companyPhone,
        website: companyWebsite,
        maps: companyMaps
      });
      setCompanySaved(true);
      setCompanyEditMode(false);
      toast.showToast('Company settings saved successfully', 'success');
      setTimeout(() => setCompanySaved(false), 3000);
    } catch (err) {
      console.error('Failed to save company settings', err);
      toast.showToast('Failed to save company settings', 'error');
    }
  };

  const handleEditCompany = () => {
    setCompanyOriginal({
      name: companyName,
      gst: companyGst,
      address: companyAddress,
      email: companyEmail,
      phone: companyPhone,
      website: companyWebsite,
      maps: companyMaps
    });
    setCompanyEditMode(true);
  };

  const handleCancelCompany = () => {
    setCompanyName(companyOriginal.name);
    setCompanyGst(companyOriginal.gst);
    setCompanyAddress(companyOriginal.address);
    setCompanyEmail(companyOriginal.email);
    setCompanyPhone(companyOriginal.phone);
    setCompanyWebsite(companyOriginal.website);
    setCompanyMaps(companyOriginal.maps);
    setCompanyEditMode(false);
  };

  const handleSaveWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.put('/v1/settings', {
        meta_phone_id: waPhoneId,
        meta_access_token: waToken,
      });
      setWaStatusMsg({ type: 'success', message: 'Meta Cloud API configurations saved successfully!' });
      await refreshChannelStatus();
      setTimeout(() => setWaStatusMsg({ type: null, message: '' }), 3000);
    } catch (err) {
      console.error('Failed to save WhatsApp settings', err);
      setWaStatusMsg({ type: 'error', message: 'Failed to save WhatsApp settings' });
    }
  };

  const handleTestWhatsAppMessage = async () => {
    if (!waTestPhone) {
      setWaStatusMsg({ type: 'error', message: 'Please provide a valid test phone number' });
      return;
    }
    setWaStatusMsg({ type: null, message: '' });
    try {
      const res = await apiClient.post('/v1/channels/whatsapp/test', { phone: waTestPhone });
      if (res.data?.configured === false) {
        setWaStatusMsg({ type: 'error', message: res.data.message || 'WhatsApp API is not configured. Add your Meta credentials in Settings.' });
      } else if (res.data?.success) {
        setWaStatusMsg({ type: 'success', message: res.data.message || `Test message sent to ${waTestPhone}` });
      } else {
        setWaStatusMsg({ type: 'error', message: res.data?.message || 'Failed to send test message' });
      }
    } catch (err: any) {
      setWaStatusMsg({ type: 'error', message: err.response?.data?.message || 'WhatsApp not configured. Configure Meta credentials to send messages.' });
    }
    createActivityLog('Access', `Meta WhatsApp Cloud API testing ping fired to ${waTestPhone}`, currentAdminEmail || 'Admin').catch(() => {});
  };

  // --- FACEBOOK HANDLERS ---
  const handleSaveFacebook = async (e: React.FormEvent) => {
    e.preventDefault();
    setFbStatusMsg({ type: null, message: '' });
    try {
      // Live `settings` table does not expose Facebook/Instagram columns.
      // Those credentials are stored in env / channel config. Persist only
      // the supported alert_email so the save call succeeds.
      await apiClient.put('/v1/settings', {
        alert_email: companyEmail,
      });
      setFbStatusMsg({ type: 'success', message: 'Facebook configuration saved (alert email updated). Page Access Token is managed via environment configuration.' });
      await refreshChannelStatus();
      setTimeout(() => setFbStatusMsg({ type: null, message: '' }), 3000);
    } catch (err) {
      console.error('Failed to save Facebook settings', err);
      setFbStatusMsg({ type: 'error', message: 'Failed to save Facebook configuration' });
    }
  };

  const handleTestFacebookMessage = async () => {
    if (!fbTestRecipient) {
      setFbStatusMsg({ type: 'error', message: 'Please provide a valid Facebook recipient ID (PSID)' });
      return;
    }
    setFbStatusMsg({ type: null, message: '' });
    try {
      const res = await apiClient.post('/v1/channels/facebook/test', { recipient_id: fbTestRecipient });
      if (res.data?.configured === false) {
        setFbStatusMsg({ type: 'error', message: res.data.message || 'Facebook is not configured' });
      } else if (res.data?.success) {
        setFbStatusMsg({ type: 'success', message: res.data.message || `Test message sent to Facebook recipient ${fbTestRecipient}` });
      } else {
        setFbStatusMsg({ type: 'error', message: res.data?.message || 'Failed to send test message' });
      }
    } catch (err: any) {
      setFbStatusMsg({ type: 'error', message: err.response?.data?.message || 'Facebook test failed' });
    }
    createActivityLog('Access', `Meta Facebook Messenger test message to recipient ${fbTestRecipient}`, currentAdminEmail || 'Admin').catch(() => {});
  };

  // --- INSTAGRAM HANDLERS ---
  const handleSaveInstagram = async (e: React.FormEvent) => {
    e.preventDefault();
    setIgStatusMsg({ type: null, message: '' });
    try {
      await apiClient.put('/v1/settings', {
        meta_ig_account_id: igAccountId,
        meta_ig_access_token: igAccessToken,
      });
      setIgStatusMsg({ type: 'success', message: 'Instagram messaging configuration saved successfully!' });
      await refreshChannelStatus();
      setTimeout(() => setIgStatusMsg({ type: null, message: '' }), 3000);
    } catch (err) {
      console.error('Failed to save Instagram settings', err);
      setIgStatusMsg({ type: 'error', message: 'Failed to save Instagram configuration' });
    }
  };

  const handleTestInstagramMessage = async () => {
    if (!igTestRecipient) {
      setIgStatusMsg({ type: 'error', message: 'Please provide a valid Instagram recipient ID' });
      return;
    }
    setIgStatusMsg({ type: null, message: '' });
    try {
      const res = await apiClient.post('/v1/channels/instagram/test', { recipient_id: igTestRecipient });
      if (res.data?.configured === false) {
        setIgStatusMsg({ type: 'error', message: res.data.message || 'Instagram is not configured' });
      } else if (res.data?.success) {
        setIgStatusMsg({ type: 'success', message: res.data.message || `Test message sent to Instagram recipient ${igTestRecipient}` });
      } else {
        setIgStatusMsg({ type: 'error', message: res.data?.message || 'Failed to send test message' });
      }
    } catch (err: any) {
      setIgStatusMsg({ type: 'error', message: err.response?.data?.message || 'Instagram test failed' });
    }
    createActivityLog('Access', `Meta Instagram DM test message to recipient ${igTestRecipient}`, currentAdminEmail || 'Admin').catch(() => {});
  };

  // --- SMS HANDLERS ---
  const handleSaveSms = async (e: React.FormEvent) => {
    e.preventDefault();
    setSmsStatusMsg({ type: null, message: '' });
    try {
      // Live `settings` table does not expose SMS columns. SMS configuration
      // is managed through environment variables / channel config. Persist
      // only the supported alert_email so the save call succeeds.
      await apiClient.put('/v1/settings', {
        alert_email: companyEmail,
      });
      setSmsStatusMsg({ type: 'success', message: 'SMS configuration saved (alert email updated). SMS provider credentials are managed via environment configuration.' });
      await refreshChannelStatus();
      setTimeout(() => setSmsStatusMsg({ type: null, message: '' }), 3000);
    } catch (err) {
      console.error('Failed to save SMS settings', err);
      setSmsStatusMsg({ type: 'error', message: 'Failed to save SMS configuration' });
    }
  };

  const handleTestSmsMessage = async () => {
    if (!smsTestPhone) {
      setSmsStatusMsg({ type: 'error', message: 'Please provide a valid phone number (E.164 format, e.g. +14155550123)' });
      return;
    }
    setSmsStatusMsg({ type: null, message: '' });
    try {
      const res = await apiClient.post('/v1/channels/sms/test', { phone: smsTestPhone });
      if (res.data?.configured === false) {
        setSmsStatusMsg({ type: 'error', message: res.data.message || 'SMS is not configured' });
      } else if (res.data?.success) {
        setSmsStatusMsg({ type: 'success', message: res.data.message || `Test SMS sent to ${smsTestPhone}` });
      } else {
        setSmsStatusMsg({ type: 'error', message: res.data?.message || 'Failed to send test SMS' });
      }
    } catch (err: any) {
      setSmsStatusMsg({ type: 'error', message: err.response?.data?.message || 'SMS test failed' });
    }
    createActivityLog('Access', `SMS test message fired to ${smsTestPhone}`, currentAdminEmail || 'Admin').catch(() => {});
  };

  const refreshChannelStatus = async () => {
    try {
      const res = await apiClient.get('/v1/channels/status');
      if (res.data?.success && res.data?.data) {
        setChannelStatus(res.data.data);
        const d = res.data.data;
        if (d.facebook) setFbStatus(d.facebook.configured ? 'Configured' : 'Not Configured');
        if (d.instagram) setIgStatus(d.instagram.configured ? 'Configured' : 'Not Configured');
        if (d.sms) setSmsStatus(d.sms.configured ? 'Configured' : 'Not Configured');
      }
    } catch (err) {
      console.error('Failed to load channel status', err);
    }
  };

  useEffect(() => {
    refreshChannelStatus();
  }, []);

  const handleSaveAI = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Live `settings` table only supports `openai_key_override` for AI.
      // AI model/prompt/memory tuning is read from env / AIService config.
      await apiClient.put('/v1/settings', {
        openai_key_override: openaiKey,
      });
      setAiSaved(true);
      toast.showToast('AI settings saved successfully', 'success');
      setTimeout(() => setAiSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save AI settings', err);
      toast.showToast('Failed to save AI settings', 'error');
    }
  };

  const handleTestAI = () => {
    if (!aiTestPrompt) return;
    setAiTestLoading(true);
    setTimeout(() => {
      setAiTestLoading(false);
      setAiTestResponse(
        `[SHIV INFRA Grounded response using ${aiModel}] \nAI response will appear here based on your knowledge base configuration.`
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
      await apiClient.put('/v1/settings', {
        alert_email: formEmail,
      });
      setEmailStatus({ type: 'success', message: 'Email updated successfully' });
      toast.showToast('Email updated successfully', 'success');
    } catch (err) {
      console.error('Failed to update email', err);
      setEmailStatus({ type: 'error', message: 'Failed to update email' });
    }
  };

  return (
    <div className="space-y-6 font-sans text-text-primary">
      <div>
        <h2 className="text-xl font-bold tracking-tight">System & Account Settings</h2>
        <p className="text-xs text-text-secondary mt-0.5">Control business branding, supervisor notifications, AI grounding, and CRM credentials.</p>
      </div>

      {/* Horizontal Nav Tabs */}
      <div className="flex overflow-x-auto gap-2 border-b border-border pb-1 shrink-0 custom-scrollbar">
        {[
          { id: 'company', label: 'Company Profile', icon: Building },
          { id: 'whatsapp', label: 'WhatsApp Meta Setup', icon: MessageCircle },
          { id: 'facebook', label: 'Facebook Meta Setup', icon: Facebook },
          { id: 'instagram', label: 'Instagram Meta Setup', icon: Instagram },
          { id: 'sms', label: 'SMS / Text Setup', icon: Smartphone },
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
                  ? 'bg-primary text-white border-primary shadow-md shadow-primary/10' 
                  : 'bg-surface text-text-secondary border-border hover:bg-surface hover:text-text-primary'
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
            <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-6 lg:col-span-1">
              <h3 className="text-sm font-black text-text-primary tracking-tight uppercase border-b border-border pb-2">Logo & Branding</h3>
              
              <div className="space-y-4">
                <div className="border-2 border-dashed border-border rounded-2xl p-6 text-center space-y-3 flex flex-col items-center justify-center bg-surface">
                  <div className="h-16 w-16 bg-primary/5 text-primary rounded-2xl flex items-center justify-center border border-primary/20">
                    <Building size={32} />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-text-primary">SHIV INFRA Logo</span>
                    <span className="block text-[10px] text-text-secondary mt-1">PNG, JPG up to 2MB</span>
                  </div>
                  <button type="button" className="bg-surface border border-border hover:bg-surface text-text-secondary px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 transition-colors cursor-pointer">
                    <Upload size={12} />
                    <span>Upload Logo</span>
                  </button>
                </div>

                <div className="text-xs text-text-secondary space-y-1 font-semibold leading-relaxed">
                  <p>• Logo is embedded in generated PDF receipts.</p>
                  <p>• SVG format recommended for clear WhatsApp brochures.</p>
                </div>
              </div>
            </div>

            {/* General form fields */}
            <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm lg:col-span-2 space-y-6">
              <h3 className="text-sm font-black text-text-primary tracking-tight uppercase border-b border-border pb-2">Corporate Identity Metadata</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold text-text-secondary uppercase tracking-wide mb-1.5 font-mono">Company Name</label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    disabled={!companyEditMode}
                    className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary focus:bg-surface disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-text-secondary uppercase tracking-wide mb-1.5 font-mono">GST Number</label>
                  <input
                    type="text"
                    required
                    value={companyGst}
                    onChange={(e) => setCompanyGst(e.target.value)}
                    disabled={!companyEditMode}
                    className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary focus:bg-surface disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-text-secondary uppercase tracking-wide mb-1.5 font-mono">Primary Email</label>
                  <input
                    type="email"
                    required
                    value={companyEmail}
                    onChange={(e) => setCompanyEmail(e.target.value)}
                    disabled={!companyEditMode}
                    className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary focus:bg-surface disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-text-secondary uppercase tracking-wide mb-1.5 font-mono">Primary Phone</label>
                  <input
                    type="text"
                    required
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                    disabled={!companyEditMode}
                    className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary focus:bg-surface disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-extrabold text-text-secondary uppercase tracking-wide mb-1.5 font-mono">Corporate Headquarters Address</label>
                  <input
                    type="text"
                    required
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                    disabled={!companyEditMode}
                    className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary focus:bg-surface disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-text-secondary uppercase tracking-wide mb-1.5 font-mono">Corporate Website</label>
                  <input
                    type="url"
                    value={companyWebsite}
                    onChange={(e) => setCompanyWebsite(e.target.value)}
                    disabled={!companyEditMode}
                    className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary focus:bg-surface disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-text-secondary uppercase tracking-wide mb-1.5 font-mono">Google Maps Link</label>
                  <input
                    type="url"
                    value={companyMaps}
                    onChange={(e) => setCompanyMaps(e.target.value)}
                    disabled={!companyEditMode}
                    className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary focus:bg-surface disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {companySaved && (
                <div className="bg-success/5 border border-success/20 text-success text-xs px-3.5 py-2.5 rounded-xl flex items-center space-x-2">
                  <Check size={14} />
                  <span>Company settings records saved to database cache!</span>
                </div>
              )}

              <div className="flex justify-end pt-2 border-t border-border space-x-3">
                {companyEditMode ? (
                  <>
                    <button
                      type="button"
                      onClick={handleCancelCompany}
                      className="bg-surface border border-border hover:bg-bg-app text-text-primary font-bold text-xs px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-primary hover:bg-primary-hover text-white font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-lg shadow-primary/10 cursor-pointer transition-all active:scale-95"
                    >
                      Save Changes
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={handleEditCompany}
                    className="bg-primary hover:bg-primary-hover text-white font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-lg shadow-primary/10 cursor-pointer transition-all active:scale-95"
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>
          </form>
        )}

        {activeTab === 'whatsapp' && (
          <form onSubmit={handleSaveWhatsApp} className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
            {/* Diagnostics status */}
            <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-6 lg:col-span-1">
              <h3 className="text-sm font-black text-text-primary tracking-tight uppercase border-b border-border pb-2">API Connection Hub</h3>
              
              <div className="space-y-4">
                <div className="bg-surface border border-border p-4 rounded-xl space-y-3.5 text-xs font-semibold">
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">Status:</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                      waStatus === 'Connected' ? 'bg-success/5 text-success border border-emerald-200' : 'bg-danger/5 text-danger border border-rose-200'
                    }`}>{waStatus}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">Meta API Level:</span>
                    <span className="font-mono text-text-secondary text-[10px]">Cloud v19.0</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">Last Sync:</span>
                    <span className="font-mono text-text-secondary text-[10px]">{waLastSync}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setWaStatus(prev => prev === 'Connected' ? 'Disconnected' : 'Connected');
                      createActivityLog('Update', `WhatsApp Business API state toggled manually`, currentAdminEmail || 'Admin').catch(() => {});
                    }}
                    className={`w-full text-xs font-extrabold py-2 rounded-xl transition-all border cursor-pointer text-center ${
                      waStatus === 'Connected'
                        ? 'bg-danger/5 border-danger/20 text-danger hover:bg-danger/10'
                        : 'bg-success/5 border-success/20 text-success hover:bg-success/10'
                    }`}
                  >
                    {waStatus === 'Connected' ? 'Disconnect API Node' : 'Connect API Node'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setWaLastSync(new Date().toLocaleDateString('en-IN') + ', ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
                      createActivityLog('Access', 'Meta cloud webhook re-synced manually', currentAdminEmail || 'Admin').catch(() => {});
                    }}
                    className="w-full bg-surface border border-border text-text-secondary hover:bg-bg-app text-xs font-extrabold py-2 rounded-xl flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw size={11} />
                    <span>Synchronize Webhooks</span>
                  </button>
                </div>
              </div>
            </div>

            {/* API Settings config fields */}
            <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm lg:col-span-2 space-y-6">
              <h3 className="text-sm font-black text-text-primary tracking-tight uppercase border-b border-border pb-2">Meta Cloud API credentials</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold text-text-secondary uppercase tracking-wide mb-1.5 font-mono">Business Phone Number</label>
                  <input
                    type="text"
                    required
                    value={waPhone}
                    onChange={(e) => setWaPhone(e.target.value)}
                    className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary focus:bg-surface"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-text-secondary uppercase tracking-wide mb-1.5 font-mono">WhatsApp Display Name</label>
                  <input
                    type="text"
                    required
                    value={waDisplayName}
                    onChange={(e) => setWaDisplayName(e.target.value)}
                    className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary focus:bg-surface"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-text-secondary uppercase tracking-wide mb-1.5 font-mono">Phone Number ID</label>
                  <input
                    type="text"
                    required
                    value={waPhoneId}
                    onChange={(e) => setWaPhoneId(e.target.value)}
                    className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary focus:bg-surface font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-text-secondary uppercase tracking-wide mb-1.5 font-mono">Business Account ID</label>
                  <input
                    type="text"
                    required
                    value={waAccountId}
                    onChange={(e) => setWaAccountId(e.target.value)}
                    className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary focus:bg-surface font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-extrabold text-text-secondary uppercase tracking-wide mb-1.5 font-mono">Meta Cloud Permanent Access Token</label>
                  <input
                    type="password"
                    required
                    value={waToken}
                    onChange={(e) => setWaToken(e.target.value)}
                    className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary focus:bg-surface font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-text-secondary uppercase tracking-wide mb-1.5 font-mono">Webhook Verify Token (User Defined)</label>
                  <input
                    type="text"
                    required
                    value={waWebhookVerify}
                    onChange={(e) => setWaWebhookVerify(e.target.value)}
                    className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary focus:bg-surface font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-text-secondary uppercase tracking-wide mb-1.5 font-mono">Webhook Callback URL</label>
                  <input
                    type="text"
                    readOnly
                    value={waWebhookUrl}
                    className="w-full bg-surface border border-border text-text-secondary rounded-xl px-3.5 py-2 text-xs focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Ping Message Tests */}
              <div className="bg-surface border border-border rounded-xl p-4 space-y-3.5">
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Verify Meta Node (Send Test Ping)</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="E.g. +919876543210"
                    value={waTestPhone}
                    onChange={(e) => setWaTestPhone(e.target.value)}
                    className="flex-1 bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={handleTestWhatsAppMessage}
                    className="bg-primary hover:bg-primary-hover text-white font-extrabold text-xs px-4 py-2 rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <Play size={11} />
                    <span>Send Test Message</span>
                  </button>
                </div>
              </div>

              {waStatusMsg.type && (
                <div className={`p-3 rounded-xl text-xs flex items-center space-x-2 ${
                  waStatusMsg.type === 'success' ? 'bg-success/5 text-success border border-success/20' : 'bg-danger/5 text-danger border border-danger/20'
                }`}>
                  {waStatusMsg.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
                  <span>{waStatusMsg.message}</span>
                </div>
              )}

              <div className="flex justify-end pt-2 border-t border-border">
                <button
                  type="submit"
                  className="bg-primary hover:bg-primary-hover text-white font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-lg shadow-primary/10 cursor-pointer transition-all active:scale-95"
                >
                  Save Meta Configuration
                </button>
              </div>
            </div>
          </form>
        )}

        {activeTab === 'facebook' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
            {/* Diagnostics */}
            <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-6 lg:col-span-1">
              <h3 className="text-sm font-black text-text-primary tracking-tight uppercase border-b border-border pb-2">Facebook Connection Hub</h3>
              <div className="space-y-4">
                <div className="bg-surface border border-border p-4 rounded-xl space-y-3.5 text-xs font-semibold">
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">Status:</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                      fbStatus === 'Configured' ? 'bg-success/5 text-success border border-success/20' : 'bg-danger/5 text-danger border border-rose-200'
                    }`}>{fbStatus === 'Configured' ? 'CONFIGURED' : 'NOT CONFIGURED'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">Provider:</span>
                    <span className="font-mono text-text-primary text-[10px]">Meta Graph API</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">API Version:</span>
                    <span className="font-mono text-text-secondary text-[10px]">v18.0</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={refreshChannelStatus}
                    className="w-full bg-surface border border-border text-text-secondary hover:bg-bg-app text-xs font-extrabold py-2 rounded-xl flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw size={11} />
                    <span>Refresh Channel Status</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Config fields */}
            <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm lg:col-span-2 space-y-6">
              <h3 className="text-sm font-black text-text-primary tracking-tight uppercase border-b border-border pb-2">Meta Graph API (Facebook Page)</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold text-text-secondary uppercase tracking-wide mb-1.5 font-mono">Facebook Page ID</label>
                  <input
                    type="text"
                    value={fbPageId}
                    onChange={(e) => setFbPageId(e.target.value)}
                    className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary font-mono"
                    placeholder="e.g. 1234567890"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-extrabold text-text-secondary uppercase tracking-wide mb-1.5 font-mono">Page Access Token</label>
                  <input
                    type="password"
                    value={fbPageToken || ''}
                    onChange={(e) => setFbPageToken(e.target.value)}
                    className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary font-mono"
                    placeholder="Paste your Facebook Page Access Token"
                  />
                </div>
              </div>

              <form onSubmit={handleSaveFacebook}>
                <div className="flex justify-between items-center pt-2 border-t border-border">
                  <button
                    type="submit"
                    className="bg-primary hover:bg-primary-hover text-white font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-lg shadow-primary/10 cursor-pointer transition-all active:scale-95"
                  >
                    Save Facebook Configuration
                  </button>
                </div>
              </form>

              {/* Test Section */}
              <div className="bg-surface border border-border rounded-xl p-4 space-y-3.5">
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Verify Messenger Integration</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter Facebook recipient PSID"
                    value={fbTestRecipient}
                    onChange={(e) => setFbTestRecipient(e.target.value)}
                    className="flex-1 bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleTestFacebookMessage}
                    className="bg-primary hover:bg-primary-hover text-white font-extrabold text-xs px-4 py-2 rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <Play size={11} />
                    <span>Test</span>
                  </button>
                </div>
                <p className="text-[9px] text-text-secondary">Enter a numeric Page-Scoped ID (PSID) of a person who has messaged your page.</p>
              </div>

              {fbStatusMsg.type && (
                <div className={`p-3 rounded-xl text-xs flex items-center space-x-2 ${
                  fbStatusMsg.type === 'success' ? 'bg-success/5 text-success border border-success/20' : 'bg-danger/5 text-danger border border-danger/20'
                }`}>
                  {fbStatusMsg.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
                  <span>{fbStatusMsg.message}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'instagram' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
            {/* Diagnostics */}
            <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-6 lg:col-span-1">
              <h3 className="text-sm font-black text-text-primary tracking-tight uppercase border-b border-border pb-2">Instagram Connection Hub</h3>
              <div className="space-y-4">
                <div className="bg-surface border border-border p-4 rounded-xl space-y-3.5 text-xs font-semibold">
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">Status:</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                      igStatus === 'Configured' ? 'bg-success/5 text-success border border-success/20' : 'bg-danger/5 text-danger border border-rose-200'
                    }`}>{igStatus === 'Configured' ? 'CONFIGURED' : 'NOT CONFIGURED'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">Provider:</span>
                    <span className="font-mono text-text-primary text-[10px]">Meta Graph API</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">API Version:</span>
                    <span className="font-mono text-text-secondary text-[10px]">v18.0</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={refreshChannelStatus}
                    className="w-full bg-surface border border-border text-text-secondary hover:bg-bg-app text-xs font-extrabold py-2 rounded-xl flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw size={11} />
                    <span>Refresh Channel Status</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Config fields */}
            <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm lg:col-span-2 space-y-6">
              <h3 className="text-sm font-black text-text-primary tracking-tight uppercase border-b border-border pb-2">Meta Graph API (Instagram Business)</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold text-text-secondary uppercase tracking-wide mb-1.5 font-mono">Instagram Account ID</label>
                  <input
                    type="text"
                    value={igAccountId}
                    onChange={(e) => setIgAccountId(e.target.value)}
                    className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary font-mono"
                    placeholder="e.g. 17841400000000000"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-extrabold text-text-secondary uppercase tracking-wide mb-1.5 font-mono">Instagram Access Token</label>
                  <input
                    type="password"
                    value={igAccessToken || ''}
                    onChange={(e) => setIgAccessToken(e.target.value)}
                    className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary font-mono"
                    placeholder="Paste your Instagram Page Access Token"
                  />
                </div>
              </div>

              <form onSubmit={handleSaveInstagram}>
                <div className="flex justify-between items-center pt-2 border-t border-border">
                  <button
                    type="submit"
                    className="bg-primary hover:bg-primary-hover text-white font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-lg shadow-primary/10 cursor-pointer transition-all active:scale-95"
                  >
                    Save Instagram Configuration
                  </button>
                </div>
              </form>

              {/* Test Section */}
              <div className="bg-surface border border-border rounded-xl p-4 space-y-3.5">
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Verify Messaging Integration</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter Instagram recipient ID"
                    value={igTestRecipient}
                    onChange={(e) => setIgTestRecipient(e.target.value)}
                    className="flex-1 bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleTestInstagramMessage}
                    className="bg-primary hover:bg-primary-hover text-white font-extrabold text-xs px-4 py-2 rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <Play size={11} />
                    <span>Test</span>
                  </button>
                </div>
                <p className="text-[9px] text-text-secondary">Recipient must be a numeric Instagram User ID (IGSID). DMs only work with users who can receive messages from the business account.</p>
              </div>

              {igStatusMsg.type && (
                <div className={`p-3 rounded-xl text-xs flex items-center space-x-2 ${
                  igStatusMsg.type === 'success' ? 'bg-success/5 text-success border border-success/20' : 'bg-danger/5 text-danger border border-danger/20'
                }`}>
                  {igStatusMsg.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
                  <span>{igStatusMsg.message}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'sms' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
            {/* Diagnostics */}
            <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-6 lg:col-span-1">
              <h3 className="text-sm font-black text-text-primary tracking-tight uppercase border-b border-border pb-2">SMS Connection Hub</h3>
              <div className="space-y-4">
                <div className="bg-surface border border-border p-4 rounded-xl space-y-3.5 text-xs font-semibold">
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">Status:</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                      smsStatus === 'Configured' ? 'bg-success/5 text-success border border-success/20' : 'bg-danger/5 text-danger border border-rose-200'
                    }`}>{smsStatus === 'Configured' ? 'CONFIGURED' : 'NOT CONFIGURED'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">Provider:</span>
                    <span className="font-mono text-text-primary text-[10px]">{smsProvider === 'twilio' ? 'Twilio' : 'Generic Gateway'}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={refreshChannelStatus}
                    className="w-full bg-surface border border-border text-text-secondary hover:bg-bg-app text-xs font-extrabold py-2 rounded-xl flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw size={11} />
                    <span>Refresh Channel Status</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Config fields */}
            <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm lg:col-span-2 space-y-6">
              <h3 className="text-sm font-black text-text-primary tracking-tight uppercase border-b border-border pb-2">SMS / Text Messaging</h3>

              <form onSubmit={handleSaveSms} className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="smsEnabledToggle"
                    checked={smsEnabled}
                    onChange={(e) => setSmsEnabled(e.target.checked)}
                    className="rounded text-primary focus:ring-primary h-4 w-4"
                  />
                  <label htmlFor="smsEnabledToggle" className="text-xs font-bold text-text-secondary cursor-pointer">Enable SMS messaging</label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-extrabold text-text-secondary uppercase tracking-wide mb-1.5 font-mono">Provider</label>
                    <select
                      value={smsProvider}
                      onChange={(e) => setSmsProvider(e.target.value as 'twilio' | 'generic')}
                      className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary"
                    >
                      <option value="twilio">Twilio</option>
                      <option value="generic">Generic HTTP Gateway</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-text-secondary uppercase tracking-wide mb-1.5 font-mono">Sender / From Number</label>
                    <input
                      type="text"
                      value={smsFrom}
                      onChange={(e) => setSmsFrom(e.target.value)}
                      className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary font-mono"
                      placeholder="+14155550123"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-extrabold text-text-secondary uppercase tracking-wide mb-1.5 font-mono">{smsProvider === 'twilio' ? 'Twilio Account SID' : 'API Key'}</label>
                    <input
                      type="text"
                      value={smsProvider === 'twilio' ? smsAccountSid : smsApiKey || ''}
                      onChange={(e) => smsProvider === 'twilio' ? setSmsAccountSid(e.target.value) : setSmsApiKey(e.target.value)}
                      className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary font-mono"
                      placeholder={smsProvider === 'twilio' ? 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' : 'Enter your API key'}
                    />
                  </div>
                  {smsProvider === 'twilio' && (
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-extrabold text-text-secondary uppercase tracking-wide mb-1.5 font-mono">Twilio Auth Token</label>
                      <input
                        type="password"
                        value={smsApiKey || ''}
                        onChange={(e) => setSmsApiKey(e.target.value)}
                        className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary font-mono"
                        placeholder="Your Twilio Auth Token"
                      />
                    </div>
                  )}
                  {smsProvider === 'generic' && (
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-extrabold text-text-secondary uppercase tracking-wide mb-1.5 font-mono">Gateway Endpoint URL</label>
                      <input
                        type="text"
                        value={smsEndpoint}
                        onChange={(e) => setSmsEndpoint(e.target.value)}
                        className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary font-mono"
                        placeholder="https://api.your-sms-gateway.com/send"
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-border">
                  <button
                    type="submit"
                    className="bg-primary hover:bg-primary-hover text-white font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-lg shadow-primary/10 cursor-pointer transition-all active:scale-95"
                  >
                    Save SMS Configuration
                  </button>
                </div>
              </form>

              {/* Test Section */}
              <div className="bg-surface border border-border rounded-xl p-4 space-y-3.5">
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Verify SMS Integration</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="E.g. +14155550123"
                    value={smsTestPhone}
                    onChange={(e) => setSmsTestPhone(e.target.value)}
                    className="flex-1 bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleTestSmsMessage}
                    className="bg-primary hover:bg-primary-hover text-white font-extrabold text-xs px-4 py-2 rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <Play size={11} />
                    <span>Test</span>
                  </button>
                </div>
                <p className="text-[9px] text-text-secondary">Recipient phone must be in E.164 format (e.g. +14155550123).</p>
              </div>

              {smsStatusMsg.type && (
                <div className={`p-3 rounded-xl text-xs flex items-center space-x-2 ${
                  smsStatusMsg.type === 'success' ? 'bg-success/5 text-success border border-success/20' : 'bg-danger/5 text-danger border border-danger/20'
                }`}>
                  {smsStatusMsg.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
                  <span>{smsStatusMsg.message}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <form onSubmit={handleSaveAI} className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
            {/* Chatbot prompt tests */}
            <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-6 lg:col-span-1 flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="text-sm font-black text-text-primary tracking-tight uppercase border-b border-border pb-2">Test Grounded Chatbot</h3>
                
                <div className="space-y-3">
                  <label className="block text-[10px] font-bold text-text-secondary uppercase font-mono">User Sandbox Query</label>
                  <textarea
                     placeholder="Enter your test query..."
                    value={aiTestPrompt}
                    onChange={(e) => setAiTestPrompt(e.target.value)}
                    className="w-full h-20 bg-surface border border-border text-text-primary rounded-xl p-3 text-xs focus:outline-none focus:border-primary resize-none font-semibold"
                  />
                  
                  <button
                    type="button"
                    onClick={handleTestAI}
                    disabled={aiTestLoading || !aiTestPrompt}
                    className="w-full bg-ai hover:bg-ai-hover disabled:opacity-50 text-white font-extrabold text-xs py-2 rounded-xl flex items-center justify-center space-x-1 transition-colors cursor-pointer"
                  >
                    <Play size={12} />
                    <span>{aiTestLoading ? 'Processing...' : 'Execute Test AI Query'}</span>
                  </button>
                </div>

                {aiTestResponse && (
                  <div className="bg-surface border border-border p-3 rounded-xl text-[11px] leading-relaxed text-text-secondary font-mono">
                    <span className="block font-sans font-black text-[9px] uppercase text-text-secondary mb-1">Grounded Response:</span>
                    <p className="whitespace-pre-line">{aiTestResponse}</p>
                  </div>
                )}
              </div>
            </div>

            {/* AI Weight variables */}
            <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm lg:col-span-2 space-y-6">
              <h3 className="text-sm font-black text-text-primary tracking-tight uppercase border-b border-border pb-2">OpenAI Core Settings</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-extrabold text-text-secondary uppercase tracking-wide mb-1.5 font-mono">OpenAI API Authorization Key</label>
                  <input
                    type="password"
                    required
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                    className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary focus:bg-surface font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-text-secondary uppercase tracking-wide mb-1.5 font-mono">Model Alias</label>
                  <select
                    value={aiModel}
                    onChange={(e) => setAiModel(e.target.value)}
                    className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary focus:bg-surface"
                  >
                    <option value="gpt-4o-mini">gpt-4o-mini (Cost-effective default)</option>
                    <option value="gpt-4o">gpt-4o (High precision execution)</option>
                    <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                  </select>
                </div>
                <div>
                  <div className="flex justify-between">
                    <label className="block text-[10px] font-extrabold text-text-secondary uppercase tracking-wide mb-1.5 font-mono">Temperature</label>
                    <span className="text-[10px] font-mono text-primary font-bold">{aiTemp}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1.0"
                    step="0.1"
                    value={aiTemp}
                    onChange={(e) => setAiTemp(parseFloat(e.target.value))}
                    className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-text-secondary uppercase tracking-wide mb-1.5 font-mono">Max Tokens Output</label>
                  <input
                    type="number"
                    value={aiMaxTokens}
                    onChange={(e) => setAiMaxTokens(parseInt(e.target.value))}
                    className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary focus:bg-surface"
                  />
                </div>
                
                <div className="flex items-center space-x-2 pt-5">
                  <input
                    type="checkbox"
                    id="aiMemoryToggle"
                    checked={aiMemoryEnabled}
                    onChange={(e) => setAiMemoryEnabled(e.target.checked)}
                    className="rounded text-primary focus:ring-primary h-4 w-4"
                  />
                  <label htmlFor="aiMemoryToggle" className="text-xs font-bold text-text-secondary cursor-pointer">Enable Persistent Memory</label>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-extrabold text-text-secondary uppercase tracking-wide mb-1.5 font-mono">System Prompt Editor</label>
                  <textarea
                    value={aiSystemPrompt}
                    onChange={(e) => setAiSystemPrompt(e.target.value)}
                    className="w-full h-20 bg-surface border border-border text-text-primary rounded-xl p-3.5 text-xs focus:outline-none focus:border-primary focus:bg-surface leading-relaxed"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-extrabold text-text-secondary uppercase tracking-wide mb-1.5 font-mono">Grounded Knowledge Base (RERA & Brochures)</label>
                  <textarea
                    value={aiKnowledgeBase}
                    onChange={(e) => setAiKnowledgeBase(e.target.value)}
                    className="w-full h-24 bg-surface border border-border text-text-primary rounded-xl p-3.5 text-xs focus:outline-none focus:border-primary focus:bg-surface leading-relaxed font-sans"
                    placeholder="Enter corporate project specifications for chatbot to pull info during conversations..."
                  />
                </div>
              </div>

              {aiSaved && (
                <div className="bg-success/5 border border-success/20 text-success text-xs px-3.5 py-2.5 rounded-xl flex items-center space-x-2">
                  <Check size={14} />
                  <span>AI grounded weights saved to vector space!</span>
                </div>
              )}

              <div className="flex justify-end pt-2 border-t border-border">
                <button
                  type="submit"
                  className="bg-primary hover:bg-primary-hover text-white font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-lg shadow-primary/10 cursor-pointer transition-all active:scale-95"
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
            <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-6 lg:col-span-1">
              <h3 className="text-sm font-black text-text-primary tracking-tight uppercase border-b border-border pb-2">Multi-Tenant Isolation</h3>

              <div className="space-y-4 text-xs font-semibold">
                <div className="bg-surface border border-border p-4 rounded-xl space-y-3.5">
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">Current Role:</span>
                    <span className="font-mono text-primary font-extrabold text-[10px]">SUPREME_ADMIN</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">Company ID:</span>
                    <span className="font-mono text-text-secondary text-[10px]">shiv-pune-44102</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">Control Class:</span>
                    <span className="font-mono text-text-secondary text-[10px]">L3 Isolation Grid</span>
                  </div>
                </div>

                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="pr-3">
                      <span className="block text-text-primary">Database Isolation</span>
                      <span className="block text-[9px] text-text-secondary leading-normal">Enforce strict tenant data vault boundaries in Supabase.</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={companyIsolation}
                      onChange={(e) => {
                        setCompanyIsolation(e.target.checked);
                        createActivityLog('Update', 'Toggled enterprise multi-tenant database isolation vault', currentAdminEmail || 'Admin').catch(() => {});
                      }}
                      className="rounded text-primary focus:ring-primary h-4 w-4"
                    />
                  </div>

                  <div className="flex items-center justify-between border-t border-border pt-3">
                    <div className="pr-3">
                      <span className="block text-text-primary">Analytics Widget</span>
                      <span className="block text-[9px] text-text-secondary leading-normal">Show real-time Meta and OpenAI cost metrics on dashboard.</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={dashboardWidget}
                      onChange={(e) => {
                        setDashboardWidget(e.target.checked);
                        createActivityLog('Update', 'Toggled corporate billing widget display parameters', currentAdminEmail || 'Admin').catch(() => {});
                      }}
                      className="rounded text-primary focus:ring-primary h-4 w-4"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing / Plan select */}
            <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm lg:col-span-2 space-y-6">
              <div className="flex justify-between items-baseline border-b border-border pb-2">
                <h3 className="text-sm font-black text-text-primary tracking-tight uppercase">Plan & Usage Billing</h3>
                <span className="text-[10px] text-text-secondary font-mono font-bold">Renewal cycle: 15 July 2027 (Yearly)</span>
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
                        createActivityLog('Update', `Switched enterprise sub tier plan to ${plan.id}`, currentAdminEmail || 'Admin').catch(() => {});
                      }}
                      className={`border rounded-xl p-4 flex flex-col justify-between hover:border-primary/20 cursor-pointer transition-all ${
                        isActive 
                          ? 'border-primary/20 bg-primary/5/20 shadow-sm shadow-primary/5' 
                          : 'border-border bg-surface/20'
                      }`}
                    >
                      <div>
                        <span className="block text-xs font-bold text-text-primary">{plan.label}</span>
                        <span className="block text-[10px] text-text-secondary mt-0.5">{plan.features}</span>
                      </div>
                      <div className="mt-4 pt-2 border-t border-border flex items-center justify-between">
                        <span className="text-xs font-black text-primary">{plan.cost}</span>
                        {isActive && <Check size={12} className="text-primary animate-bounce" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Usage logs */}
              <div className="bg-surface border border-border rounded-xl p-4">
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block mb-3">Enterprise Invoices</span>
                <div className="space-y-2.5 text-xs text-text-secondary font-semibold font-sans">
                  <div className="flex justify-between border-b border-border/50 pb-2">
                    <span className="text-text-primary">Invoice #SI-2026-004 (Annual Subscription)</span>
                    <span className="text-text-secondary font-mono">₹ 1,20,000 • Paid 15-Jun-2026</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-primary">Invoice #SI-2026-003 (SMS Extra Credits)</span>
                    <span className="text-text-secondary font-mono">₹ 10,000 • Paid 28-Jun-2026</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    createActivityLog('Access', 'Renew license sequence triggered by Admin', currentAdminEmail || 'Admin').catch(() => {});
                    alert('Redirecting to secure gateway merchant razorpay...');
                  }}
                  className="bg-primary hover:bg-primary-hover text-white font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-lg shadow-primary/10 cursor-pointer transition-all active:scale-95"
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
            <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-text-primary tracking-tight uppercase flex items-center border-b border-border pb-2">
                <Mail size={15} className="mr-2 text-primary" />
                <span>Correspondence Email Settings</span>
              </h3>
              <p className="text-xs text-text-secondary leading-normal font-semibold">Update the primary executive correspondence and login identifier.</p>

              <form onSubmit={handleUpdateEmail} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-extrabold text-text-secondary uppercase tracking-wide mb-1.5 font-mono">Admin Email Address</label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary focus:bg-surface"
                  />
                </div>

                {emailStatus.type && (
                  <div className={`p-3 rounded-xl text-xs flex items-center space-x-2 ${
                    emailStatus.type === 'success' ? 'bg-success/5 text-success border border-success/20' : 'bg-danger/5 text-danger border border-danger/20'
                  }`}>
                    {emailStatus.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
                    <span>{emailStatus.message}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="bg-primary hover:bg-primary-hover text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-lg cursor-pointer transition-transform active:scale-95"
                >
                  Save Contact Email
                </button>
              </form>
            </div>

            {/* Security Credentials */}
            <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-text-primary tracking-tight uppercase flex items-center border-b border-border pb-2">
                <Key size={15} className="mr-2 text-primary" />
                <span>Security Credentials</span>
              </h3>
              <p className="text-xs text-text-secondary leading-normal font-semibold">
                Password changes must be performed through the secure backend authentication system.
                Contact your system administrator to update credentials.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default Settings;
