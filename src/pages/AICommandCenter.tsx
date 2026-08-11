import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Brain, 
  MessageCircle, 
  Terminal, 
  Sliders, 
  Key, 
  Cpu, 
  TrendingUp, 
  CheckCircle2, 
  Activity, 
  RefreshCw, 
  Send, 
  ShieldAlert, 
  Database,
  Layers,
  Zap,
  Clock,
  History,
  AlertCircle
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { logSystemAction } from '../lib/mockData';

interface LiveChat {
  id: string;
  clientName: string;
  phone: string;
  lastMessage: string;
  aiResponseDraft: string;
  time: string;
  status: 'pending_approval' | 'auto_sent';
}

interface LogEntry {
  id: string;
  timestamp: string;
  type: 'INFO' | 'API_CALL' | 'TOOL_USE' | 'SUCCESS' | 'WARNING';
  message: string;
}

interface MemoryNode {
  id: string;
  client: string;
  intent: string;
  extractedDetails: {
    project?: string;
    budget?: string;
    stage?: string;
    notes?: string;
  };
}

export const AICommandCenter: React.FC = () => {
  // HUD states
  const [isSyncing, setIsSyncing] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  
  // Prompt settings
  const [systemPrompt, setSystemPrompt] = useState(
    `You are the official SHIV INFRA AI Construction & Real Estate Assistant.
• Speak fluently in English, Hindi, and Marathi as per user's preference.
• Support users with technical calculations (slab, steel, cement estimation).
• Direct commercial operations (booking site visits, showing brochures, search projects) via backend grounding.
• Maintain a professional, polite, and helpful tone.`
  );

  // Live Chats simulation
  const [liveChats, setLiveChats] = useState<LiveChat[]>([
    {
      id: 'lc1',
      clientName: 'Rahul Mehta',
      phone: '+91 91234 56789',
      lastMessage: 'मला स्काय हाईट्सचा ब्रोशर पाठवू शकता का?',
      aiResponseDraft: 'नक्कीच! स्काय हाईट्स (Sky Heights, Wakad) चा ब्रोशर डाऊनलोड करण्यासाठी खालील लिंकवर क्लिक करा: [Brochure Link]',
      time: 'Just now',
      status: 'pending_approval'
    },
    {
      id: 'lc2',
      clientName: 'Amit Deshmukh',
      phone: '+91 99887 76655',
      lastMessage: 'When is the 4th floor slab casting scheduled?',
      aiResponseDraft: 'The slab casting for the 4th floor at Shiv Residency is scheduled for July 12, 2026.',
      time: '5 mins ago',
      status: 'auto_sent'
    },
    {
      id: 'lc3',
      clientName: 'Yash Deshmukh (Site Engineer)',
      phone: '+91 88776 65544',
      lastMessage: 'Uploaded cement delivery bill of 400 bags.',
      aiResponseDraft: 'Bill detected: 400 Bags Cement from Ultratech. Running OCR extraction & syncing with Supabase...',
      time: '12 mins ago',
      status: 'auto_sent'
    }
  ]);

  // AI Logs simulation
  const [aiLogs, setAiLogs] = useState<LogEntry[]>([
    { id: 'l1', timestamp: '14:30:12', type: 'INFO', message: 'Inbound WhatsApp webhook received from +91 91234 56789' },
    { id: 'l2', timestamp: '14:30:13', type: 'API_CALL', message: 'Calling OpenAI API (gpt-4o-mini) - Temperature 0.3' },
    { id: 'l3', timestamp: '14:30:14', type: 'TOOL_USE', message: 'Executed function call: get_project_brochure({ project: "Sky Heights" })' },
    { id: 'l4', timestamp: '14:30:15', type: 'SUCCESS', message: 'Formulated responsive draft in Marathi. Ready for approval.' },
    { id: 'l5', timestamp: '14:28:44', type: 'INFO', message: 'Hourly sync of Supabase CRM data with AI Vector memory complete.' }
  ]);

  // AI Memory / Context store
  const [memoryNodes, setMemoryNodes] = useState<MemoryNode[]>([
    {
      id: 'm1',
      client: 'Rahul Mehta',
      intent: 'Project Brochure Request',
      extractedDetails: {
        project: 'Sky Heights Phase 2',
        budget: '₹ 1.2 Cr',
        stage: 'Interested (Hot)',
        notes: 'Prepares payment after layout verification'
      }
    },
    {
      id: 'm2',
      client: 'Amit Deshmukh',
      intent: 'Progress Update Check',
      extractedDetails: {
        project: 'Shiv Residency',
        budget: '₹ 85 L (Booked)',
        stage: 'Flat Owner (Flat 402)',
        notes: 'Tracks slab casting progress closely'
      }
    }
  ]);

  // Analytics graph data
  const requestHistory = [
    { name: '08:00', Queries: 12, Cost: 0.04 },
    { name: '10:00', Queries: 28, Cost: 0.12 },
    { name: '12:00', Queries: 45, Cost: 0.22 },
    { name: '14:00', Queries: 32, Cost: 0.15 },
    { name: '16:00', Queries: 54, Cost: 0.31 },
    { name: '18:00', Queries: 40, Cost: 0.21 },
  ];

  const handleSyncMemory = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      const newLog: LogEntry = {
        id: `l_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour12: false }),
        type: 'SUCCESS',
        message: 'Grounded warehouse inventory & leads list with AI Memory Storage successfully.'
      };
      setAiLogs(prev => [newLog, ...prev]);
      logSystemAction('Update', 'AI Vector Memory databases fully synchronized.');
    }, 1500);
  };

  const approveDraft = (chatId: string) => {
    setLiveChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        return { ...chat, status: 'auto_sent' };
      }
      return chat;
    }));

    const triggeredChat = liveChats.find(c => c.id === chatId);
    const newLog: LogEntry = {
      id: `l_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour12: false }),
      type: 'SUCCESS',
      message: `Dispatched approved draft to ${triggeredChat?.clientName || 'Client'} via WhatsApp Cloud API`
    };
    setAiLogs(prev => [newLog, ...prev]);
    logSystemAction('Access', `AI message manually dispatched to ${triggeredChat?.clientName}`);
  };

  return (
    <div className="space-y-6 font-sans text-slate-800">
      {/* HUD Header */}
      <div className="bg-[#090e1a] border border-[#15203c] rounded-2xl p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <Brain size={24} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h2 className="text-lg font-black tracking-tight">AI Command Center</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/20 animate-pulse uppercase tracking-wider">Active Agent</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Monitor, fine-tune, and inspect your real-time Meta WhatsApp AI and OpenAI agents.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleSyncMemory}
            disabled={isSyncing}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 border border-slate-700 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all cursor-pointer"
          >
            <RefreshCw size={12} className={isSyncing ? 'animate-spin text-blue-400' : ''} />
            <span>{isSyncing ? 'Syncing...' : 'Sync AI Databases'}</span>
          </button>

          <button
            onClick={() => setAiEnabled(!aiEnabled)}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              aiEnabled 
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/15' 
                : 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-500/15'
            }`}
          >
            <Zap size={12} />
            <span>{aiEnabled ? 'AI Status: Active' : 'AI Status: Suspended'}</span>
          </button>
        </div>
      </div>

      {/* TOP META-HUD (4 widgets grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Token Usage Card */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Token Usage</p>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight mt-1">119,600</h3>
            </div>
            <span className="text-[10px] bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-full font-bold text-slate-500">
              This Month
            </span>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-[10px] text-slate-500 font-bold mb-1 font-mono">
              <span>Input: 85.4k</span>
              <span>Output: 34.2k</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: '70%' }}></div>
            </div>
          </div>
        </div>

        {/* AI Latency Card */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Avg Latency</p>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight mt-1">240 ms</h3>
            </div>
            <span className="text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-2.5 py-0.5 rounded-full font-bold">
              Excellent
            </span>
          </div>
          <div className="mt-4 flex items-center space-x-1.5 text-xs text-slate-500 font-semibold">
            <CheckCircle2 size={12} className="text-emerald-500" />
            <span>Grounding queries optimized</span>
          </div>
        </div>

        {/* API Connections Card */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">API Gateways</p>
              <h3 className="text-xl font-black text-emerald-600 tracking-tight mt-1">4 / 4 Active</h3>
            </div>
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse mt-1" />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[9px] font-mono font-bold uppercase text-slate-500">
            <span className="flex items-center text-emerald-600"><span className="h-1.5 w-1.5 bg-emerald-500 rounded-full mr-1" /> Meta</span>
            <span className="flex items-center text-emerald-600"><span className="h-1.5 w-1.5 bg-emerald-500 rounded-full mr-1" /> OpenAI</span>
            <span className="flex items-center text-emerald-600"><span className="h-1.5 w-1.5 bg-emerald-500 rounded-full mr-1" /> Supabase</span>
            <span className="flex items-center text-emerald-600"><span className="h-1.5 w-1.5 bg-emerald-500 rounded-full mr-1" /> G-Maps</span>
          </div>
        </div>

        {/* AI Dispatch Rate Card */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">AI Auto-Reply Rate</p>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight mt-1">78.5%</h3>
            </div>
            <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-100 px-2.5 py-0.5 rounded-full font-bold">
              Auto Mode
            </span>
          </div>
          <div className="mt-4 flex items-center space-x-1.5 text-xs text-slate-500 font-semibold">
            <Zap size={12} className="text-amber-500" />
            <span>21.5% routed for admin check</span>
          </div>
        </div>
      </div>

      {/* MID PANEL: LIVE INTERACTIVES (Live WhatsApp stream & AI Logs) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Live Chats Stream */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col h-[28rem] justify-between overflow-hidden">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100 shrink-0">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 tracking-tight flex items-center">
                <MessageCircle size={15} className="mr-1.5 text-blue-500" />
                <span>Live WhatsApp Chats</span>
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Real-time webhook interceptor</p>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded uppercase">Live Feed</span>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar my-4 space-y-4 pr-1">
            {liveChats.map(chat => (
              <div key={chat.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs font-sans">
                      {chat.clientName.slice(0, 1)}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800">{chat.clientName}</span>
                      <span className="text-[9px] text-slate-400 font-mono ml-1.5">{chat.phone}</span>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono text-slate-400">{chat.time}</span>
                </div>

                {/* Client inbound bubble */}
                <div className="bg-white border border-slate-150 p-2.5 rounded-lg text-xs text-slate-600">
                  <span className="block text-[8px] font-bold uppercase text-slate-400 mb-0.5">Inbound Client:</span>
                  <p className="italic">"{chat.lastMessage}"</p>
                </div>

                {/* AI response draft bubble */}
                <div className="bg-blue-50/50 border border-blue-100 p-2.5 rounded-lg text-xs text-slate-700">
                  <span className="flex items-center space-x-1.5 text-[8px] font-extrabold uppercase text-blue-600 mb-0.5">
                    <Sparkles size={9} className="text-amber-500" />
                    <span>AI Agent Draft:</span>
                  </span>
                  <p className="leading-relaxed font-sans">{chat.aiResponseDraft}</p>
                </div>

                {/* Actions */}
                <div className="flex justify-end pt-1">
                  {chat.status === 'pending_approval' ? (
                    <button
                      onClick={() => approveDraft(chat.id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] uppercase px-3 py-1 rounded-lg flex items-center space-x-1 shadow-md shadow-blue-500/10 cursor-pointer transition-transform active:scale-95"
                    >
                      <Send size={10} />
                      <span>Approve & Dispatch</span>
                    </button>
                  ) : (
                    <span className="text-[9px] font-extrabold uppercase text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md flex items-center space-x-1">
                      <CheckCircle2 size={10} />
                      <span>Sent to Client</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Decision Logs Timeline */}
        <div className="bg-[#0b0f19] border border-[#1a233a] rounded-2xl p-6 text-slate-100 flex flex-col h-[28rem] justify-between overflow-hidden shadow-xl">
          <div className="flex justify-between items-center pb-4 border-b border-[#1a233a] shrink-0">
            <div className="flex items-center space-x-2">
              <Terminal size={15} className="text-blue-400" />
              <h3 className="text-sm font-extrabold text-white tracking-tight">AI Diagnostic Logs</h3>
            </div>
            <span className="text-[9px] font-bold text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded uppercase font-mono">Real-Time Terminal</span>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar my-4 font-mono text-[10px] space-y-3.5 pr-1">
            {aiLogs.map(log => {
              const badgeStyle = 
                log.type === 'API_CALL' ? 'text-cyan-400' :
                log.type === 'TOOL_USE' ? 'text-amber-400' :
                log.type === 'SUCCESS' ? 'text-emerald-400' :
                log.type === 'WARNING' ? 'text-rose-400' : 'text-slate-400';

              return (
                <div key={log.id} className="flex space-x-2.5 items-start">
                  <span className="text-slate-500 shrink-0">[{log.timestamp}]</span>
                  <span className={`${badgeStyle} shrink-0 font-bold`}>[{log.type}]</span>
                  <span className="text-slate-300 leading-normal">{log.message}</span>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-[#1a233a] shrink-0 text-slate-500 text-[9px] font-mono flex justify-between items-center">
            <span>Core Model: GPT-4o-mini v1.2</span>
            <span>Grounding latency: ~240ms</span>
          </div>
        </div>

      </div>

      {/* LOWER PANEL: VECTOR MEMORY STORE & SYSTEM PROMPT EDITOR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* System Prompt Editor */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between lg:col-span-1">
          <div className="pb-4 border-b border-slate-100">
            <h3 className="text-sm font-extrabold text-slate-800 tracking-tight flex items-center">
              <Sliders size={15} className="mr-1.5 text-blue-500" />
              <span>AI System Prompt Settings</span>
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Control core agent persona</p>
          </div>

          <div className="my-4 flex-1 flex flex-col space-y-3">
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="w-full flex-1 min-h-[14rem] bg-slate-50 border border-slate-200 text-slate-700 font-mono text-xs rounded-xl p-4 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 leading-relaxed resize-none"
            />
          </div>

          <button
            onClick={() => {
              logSystemAction('Update', 'System core prompt persona updated by Admin.');
              alert('Core AI Persona settings successfully committed!');
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-2.5 rounded-xl shadow-lg shadow-blue-500/10 cursor-pointer transition-transform active:scale-95"
          >
            Save Prompt Settings
          </button>
        </div>

        {/* AI Vector Memory Store */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between lg:col-span-2">
          <div className="pb-4 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 tracking-tight flex items-center">
                <Brain size={15} className="mr-1.5 text-indigo-500" />
                <span>Cognitive CRM Memory Nodes</span>
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Contextual variable extractions & intent tracking</p>
            </div>
            <span className="text-[9px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded uppercase">Vector DB</span>
          </div>

          <div className="my-4 flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            {memoryNodes.map(node => (
              <div key={node.id} className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50">
                <div className="flex justify-between items-start border-b border-slate-200/60 pb-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{node.client}</h4>
                    <span className="text-[9px] text-indigo-500 font-mono font-bold uppercase mt-0.5">{node.intent}</span>
                  </div>
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" title="Active Thread Memory Locked" />
                </div>

                <div className="space-y-1.5 text-[11px] text-slate-600 font-semibold font-sans">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Project Focus:</span>
                    <span className="text-slate-700 font-bold">{node.extractedDetails.project || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Estimated Budget:</span>
                    <span className="text-slate-700 font-bold">{node.extractedDetails.budget || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Interest Stage:</span>
                    <span className="text-slate-700 font-bold">{node.extractedDetails.stage || 'N/A'}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200/40 text-[10px] text-slate-500 italic">
                    <span className="block font-bold uppercase text-[8px] text-slate-400 not-italic mb-0.5">Persistent Node Notes:</span>
                    "{node.extractedDetails.notes}"
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-indigo-50 border border-indigo-100 p-3.5 rounded-xl flex items-start space-x-2.5 text-xs text-indigo-700 leading-normal">
            <CheckCircle2 size={16} className="text-indigo-600 shrink-0 mt-0.5 animate-bounce" />
            <p className="font-semibold">All cognitive slots are backed up directly in Supabase storage to maintain full session resilience across browser updates.</p>
          </div>
        </div>

      </div>

      {/* AI Latency and Response Trend graphs */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="pb-4 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-extrabold text-slate-800 tracking-tight flex items-center">
              <TrendingUp size={15} className="mr-1.5 text-blue-500" />
              <span>AI Agent Analytics</span>
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Hourly query load & computational billing cost</p>
          </div>
        </div>

        <div className="h-64 mt-6">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={requestHistory} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="colorQueries" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#818cf8" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '11px' }} />
              <Area type="monotone" dataKey="Queries" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorQueries)" />
              <Area type="monotone" dataKey="Cost" stroke="#818cf8" strokeWidth={2} fillOpacity={1} fill="url(#colorCost)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
export default AICommandCenter;
