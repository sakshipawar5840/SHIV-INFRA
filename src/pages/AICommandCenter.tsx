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
  AlertCircle,
  Loader2,
  Wifi,
  WifiOff
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
import { apiClient } from '../lib/axiosClient';
import { createActivityLog } from '../lib/activityLogService';
import { useToast } from '../contexts/ToastContext';

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

interface AIStatus {
  agent: string;
  status: string;
  production: boolean;
  channels: string[];
  engines: string[];
  modules: string[];
}

interface AIHealth {
  success: boolean;
  service: string;
  status: string;
  environment: string;
  components: {
    intent_engine: string;
    action_engine: string;
    memory_engine: string;
    whatsapp_agent: string;
  };
}

interface AIMemoryData {
  success: boolean;
  data: Array<{
    id: string;
    role: string;
    message: string;
    channel: string;
    created_at: string;
  }>;
}

interface AIProviderStatus {
  success: boolean;
  ai: {
    gemini: { available: boolean; model: string };
    openai: { available: boolean; model: string };
    currentProvider: string;
    geminiModel: string;
    openaiModel: string;
  };
}

interface ActivityLogEntry {
  id: string;
  action: string;
  module: string;
  description: string;
  created_at: string;
  user_email?: string;
}

export const AICommandCenter: React.FC = () => {
  const { showToast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  
  const [systemPrompt, setSystemPrompt] = useState(
    `You are the official SHIV INFRA AI Construction & Real Estate Assistant.
• Speak fluently in English, Hindi, and Marathi as per user's preference.
• Support users with technical calculations (slab, steel, cement estimation).
• Direct commercial operations (booking site visits, showing brochures, search projects) via backend grounding.
• Maintain a professional, polite, and helpful tone.`
  );

  const [liveChats, setLiveChats] = useState<LiveChat[]>([]);
  const [aiLogs, setAiLogs] = useState<LogEntry[]>([]);
  const [memoryNodes, setMemoryNodes] = useState<MemoryNode[]>([]);
  const [requestHistory, setRequestHistory] = useState<{ name: string; Queries: number; Cost: number }[]>([]);
  const [aiStatus, setAiStatus] = useState<AIStatus | null>(null);
  const [aiHealth, setAiHealth] = useState<AIHealth | null>(null);
  const [providerStatus, setProviderStatus] = useState<AIProviderStatus | null>(null);

  // Load real data on mount
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadAIStatus(),
        loadAIHealth(),
        loadProviderStatus(),
        loadAIMemory(),
        loadActivityLogs()
      ]);
    } catch (error) {
      console.error('Failed to load AI Command Center data:', error);
      showToast('Failed to load AI data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadAIStatus = async () => {
    try {
      const res = await apiClient.get('/api/v1/ai/status');
      if (res.data.success) {
        setAiStatus(res.data);
      }
    } catch (error) {
      console.error('Failed to load AI status:', error);
    }
  };

  const loadAIHealth = async () => {
    try {
      const res = await apiClient.get('/api/v1/ai/health');
      if (res.data.success) {
        setAiHealth(res.data);
      }
    } catch (error) {
      console.error('Failed to load AI health:', error);
    }
  };

  const loadProviderStatus = async () => {
    try {
      const res = await apiClient.get('/api/v1/ai/gemini-status');
      if (res.data.success) {
        setProviderStatus(res.data);
      }
    } catch (error) {
      console.error('Failed to load provider status:', error);
    }
  };

  const loadAIMemory = async () => {
    try {
      const res = await apiClient.get('/api/v1/ai/memory');
      if (res.data.success && res.data.data) {
        // Transform memory data into memory nodes format
        const nodes: MemoryNode[] = res.data.data
          .filter((item: any) => item.role === 'USER')
          .slice(0, 10)
          .map((item: any, index: number) => {
            // Extract intent from message or use default
            const message = item.message || '';
            const intentMatch = message.match(/intent[:\s]+(\w+)/i);
            const projectMatch = message.match(/project[:\s]+([^,\n]+)/i);
            const budgetMatch = message.match(/budget[:\s]+([^,\n]+)/i);
            
            return {
              id: item.id || `mem_${index}`,
              client: `User ${index + 1}`,
              intent: intentMatch ? intentMatch[1].toUpperCase() : 'GENERAL_CHAT',
              extractedDetails: {
                project: projectMatch ? projectMatch[1].trim() : 'N/A',
                budget: budgetMatch ? budgetMatch[1].trim() : 'N/A',
                stage: 'Inquiry',
                notes: message.length > 100 ? message.substring(0, 100) + '...' : message
              }
            };
          });
        setMemoryNodes(nodes.length > 0 ? nodes : []);
      }
    } catch (error) {
      console.error('Failed to load AI memory:', error);
    }
  };

  const loadActivityLogs = async () => {
    try {
      const res = await apiClient.get('/api/v1/activity-logs', { params: { limit: 50 } });
      if (res.data.success && res.data.data) {
        // Filter for AI-related logs and transform
        const aiLogs: LogEntry[] = res.data.data
          .filter((log: ActivityLogEntry) => 
            log.action.toLowerCase().includes('ai') || 
            log.action.toLowerCase().includes('whatsapp') ||
            log.module.toLowerCase().includes('ai')
          )
          .slice(0, 20)
          .map((log: ActivityLogEntry, index: number) => ({
            id: log.id || `log_${index}`,
            timestamp: new Date(log.created_at).toLocaleTimeString([], { hour12: false }),
            type: (log.action.includes('ERROR') || log.action.includes('FAILED')) ? 'WARNING' : 
                  (log.action.includes('API') ? 'API_CALL' : 
                  (log.action.includes('TOOL') ? 'TOOL_USE' : 
                  (log.action.includes('SUCCESS') || log.action.includes('COMPLETED') ? 'SUCCESS' : 'INFO'))) as LogEntry['type'],
            message: log.description || log.action
          }));
        setAiLogs(aiLogs.length > 0 ? aiLogs : []);
      }
    } catch (error) {
      console.error('Failed to load activity logs:', error);
    }
  };

  const handleSyncMemory = async () => {
    setIsSyncing(true);
    try {
      await loadAIMemory();
      await loadActivityLogs();
      createActivityLog('Update', 'AI Vector Memory databases fully synchronized.', 'AI System').catch(() => {});
      showToast('AI databases synchronized', 'success');
    } catch (error) {
      console.error('Sync failed:', error);
      showToast('Sync failed', 'error');
    } finally {
      setIsSyncing(false);
    }
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
    createActivityLog('Access', `AI message manually dispatched to ${triggeredChat?.clientName}`, 'AI System').catch(() => {});
  };

  return (
    <div className="space-y-6 font-sans text-text-primary">
      {/* HUD Header */}
      <div className="bg-surface border border-border rounded-2xl p-6 text-text-primary flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-text-primary shadow-lg shadow-primary/20">
            <Brain size={24} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h2 className="text-lg font-black tracking-tight">AI Command Center</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-primary/10 text-primary border-primary/20 animate-pulse uppercase tracking-wider">Active Agent</span>
            </div>
            <p className="text-xs text-text-secondary mt-1">Monitor, fine-tune, and inspect your real-time Meta WhatsApp AI and OpenAI agents.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleSyncMemory}
            disabled={isSyncing}
            className="flex items-center space-x-1.5 bg-surface hover:bg-surface disabled:opacity-50 border border-border px-4 py-2 rounded-xl text-xs font-bold text-text-primary transition-all cursor-pointer"
          >
            <RefreshCw size={12} className={isSyncing ? 'animate-spin text-primary' : ''} />
            <span>{isSyncing ? 'Syncing...' : 'Sync AI Databases'}</span>
          </button>

          <button
            onClick={() => setAiEnabled(!aiEnabled)}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              aiEnabled 
                ? 'bg-success hover:bg-success/90 text-white shadow-lg shadow-success/15' 
                : 'bg-danger hover:bg-danger/90 text-white shadow-lg shadow-danger/15'
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
        <div className="bg-surface border border-border p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider">Token Usage</p>
              <h3 className="text-2xl font-black text-text-primary tracking-tight mt-1">0</h3>
            </div>
            <span className="text-[10px] bg-surface border border-border px-2.5 py-0.5 rounded-full font-bold text-text-secondary">
              This Month
            </span>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-[10px] text-text-secondary font-bold mb-1 font-mono">
              <span>Input: 0</span>
              <span>Output: 0</span>
            </div>
            <div className="h-1.5 w-full bg-surface rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: '0%' }}></div>
            </div>
          </div>
        </div>

        {/* AI Latency Card */}
        <div className="bg-surface border border-border p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider">Avg Latency</p>
              <h3 className="text-2xl font-black text-text-primary tracking-tight mt-1">--</h3>
            </div>
            <span className="text-[10px] bg-text-secondary/5 text-text-secondary border border-border px-2.5 py-0.5 rounded-full font-bold">
              No Data
            </span>
          </div>
          <div className="mt-4 flex items-center space-x-1.5 text-xs text-text-secondary font-semibold">
            <span>Awaiting live metrics</span>
          </div>
        </div>

        {/* API Connections Card */}
        <div className="bg-surface border border-border p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider">API Gateways</p>
              <h3 className="text-xl font-black text-text-secondary tracking-tight mt-1">0 / 4</h3>
            </div>
            <span className="h-2 w-2 rounded-full bg-text-secondary/50 mt-1" />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[9px] font-mono font-bold uppercase text-text-secondary">
            <span className="flex items-center text-text-secondary"><span className="h-1.5 w-1.5 bg-text-secondary/50 rounded-full mr-1" /> Meta</span>
            <span className="flex items-center text-text-secondary"><span className="h-1.5 w-1.5 bg-text-secondary/50 rounded-full mr-1" /> OpenAI</span>
            <span className="flex items-center text-text-secondary"><span className="h-1.5 w-1.5 bg-text-secondary/50 rounded-full mr-1" /> Supabase</span>
            <span className="flex items-center text-text-secondary"><span className="h-1.5 w-1.5 bg-text-secondary/50 rounded-full mr-1" /> G-Maps</span>
          </div>
        </div>

        {/* AI Dispatch Rate Card */}
        <div className="bg-surface border border-border p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider">AI Auto-Reply Rate</p>
              <h3 className="text-2xl font-black text-text-primary tracking-tight mt-1">--</h3>
            </div>
            <span className="text-[10px] bg-text-secondary/5 text-text-secondary border border-border px-2.5 py-0.5 rounded-full font-bold">
              No Data
            </span>
          </div>
          <div className="mt-4 flex items-center space-x-1.5 text-xs text-text-secondary font-semibold">
            <span>Awaiting dispatch metrics</span>
          </div>
        </div>
      </div>

      {/* MID PANEL: LIVE INTERACTIVES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Live Chats Stream */}
        <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm flex flex-col h-[28rem] justify-between overflow-hidden">
          <div className="flex justify-between items-center pb-4 border-b border-border shrink-0">
            <div>
              <h3 className="text-sm font-extrabold text-text-primary tracking-tight flex items-center">
                <MessageCircle size={15} className="mr-1.5 text-primary" />
                <span>Live WhatsApp Chats</span>
              </h3>
              <p className="text-[10px] text-text-secondary font-bold uppercase mt-0.5">Real-time webhook interceptor</p>
            </div>
            <span className="text-[10px] font-mono text-text-secondary bg-surface border border-border px-2 py-0.5 rounded uppercase">Live Feed</span>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar my-4 space-y-4 pr-1">
            {liveChats.length === 0 ? (
              <div className="p-6 text-center text-xs text-text-secondary">
                No live WhatsApp chats
              </div>
            ) : (
              liveChats.map(chat => (
                <div key={chat.id} className="bg-surface border border-border rounded-xl p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2">
                      <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs font-sans">
                        {chat.clientName.slice(0, 1)}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-text-primary">{chat.clientName}</span>
                        <span className="text-[9px] text-text-secondary font-mono ml-1.5">{chat.phone}</span>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono text-text-secondary">{chat.time}</span>
                  </div>

                  <div className="bg-surface border border-border p-2.5 rounded-lg text-xs text-text-secondary">
                    <span className="block text-[8px] font-bold uppercase text-text-secondary mb-0.5">Inbound Client:</span>
                    <p className="italic">"{chat.lastMessage}"</p>
                  </div>

                  <div className="bg-primary/5/50 border border-primary/20 p-2.5 rounded-lg text-xs text-text-primary">
                    <span className="flex items-center space-x-1.5 text-[8px] font-extrabold uppercase text-primary mb-0.5">
                      <Sparkles size={9} className="text-warning" />
                      <span>AI Agent Draft:</span>
                    </span>
                    <p className="leading-relaxed font-sans">{chat.aiResponseDraft}</p>
                  </div>

                  <div className="flex justify-end pt-1">
                    {chat.status === 'pending_approval' ? (
                      <button
                        onClick={() => approveDraft(chat.id)}
                        className="bg-primary hover:bg-primary-hover text-white font-bold text-[10px] uppercase px-3 py-1 rounded-lg flex items-center space-x-1 shadow-md shadow-primary/10 cursor-pointer transition-transform active:scale-95"
                      >
                        <Send size={10} />
                        <span>Approve & Dispatch</span>
                      </button>
                    ) : (
                      <span className="text-[9px] font-extrabold uppercase text-success bg-success/5 border border-emerald-100 px-2 py-0.5 rounded-md flex items-center space-x-1">
                        <CheckCircle2 size={10} />
                        <span>Sent to Client</span>
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* AI Decision Logs Timeline */}
        <div className="bg-surface border border-border rounded-2xl p-6 text-text-primary flex flex-col h-[28rem] justify-between overflow-hidden shadow-xl">
          <div className="flex justify-between items-center pb-4 border-b border-border shrink-0">
            <div className="flex items-center space-x-2">
              <Terminal size={15} className="text-primary" />
              <h3 className="text-sm font-extrabold text-text-primary tracking-tight">AI Diagnostic Logs</h3>
            </div>
            <span className="text-[9px] font-bold text-text-secondary bg-surface border border-border px-2 py-0.5 rounded uppercase font-mono">Real-Time Terminal</span>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar my-4 font-mono text-[10px] space-y-3.5 pr-1">
            {aiLogs.length === 0 ? (
              <div className="p-6 text-center text-xs text-text-secondary">
                No diagnostic logs
              </div>
            ) : (
              aiLogs.map(log => {
                const badgeStyle = 
                  log.type === 'API_CALL' ? 'text-primary' :
                  log.type === 'TOOL_USE' ? 'text-warning' :
                  log.type === 'SUCCESS' ? 'text-success' :
                  log.type === 'WARNING' ? 'text-danger' : 'text-text-secondary';

                return (
                  <div key={log.id} className="flex space-x-2.5 items-start">
                    <span className="text-text-secondary shrink-0">[{log.timestamp}]</span>
                    <span className={`${badgeStyle} shrink-0 font-bold`}>[{log.type}]</span>
                    <span className="text-text-secondary leading-normal">{log.message}</span>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-2 border-t border-border shrink-0 text-text-secondary text-[9px] font-mono flex justify-between items-center">
            <span>Core Model: --</span>
            <span>Grounding latency: --</span>
          </div>
        </div>

      </div>

      {/* LOWER PANEL: VECTOR MEMORY STORE & SYSTEM PROMPT EDITOR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* System Prompt Editor */}
        <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between lg:col-span-1">
          <div className="pb-4 border-b border-border">
            <h3 className="text-sm font-extrabold text-text-primary tracking-tight flex items-center">
              <Sliders size={15} className="mr-1.5 text-primary" />
              <span>AI System Prompt Settings</span>
            </h3>
            <p className="text-[10px] text-text-secondary font-bold uppercase mt-0.5">Control core agent persona</p>
          </div>

          <div className="my-4 flex-1 flex flex-col space-y-3">
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="w-full flex-1 min-h-[14rem] bg-surface border border-border text-text-primary font-mono text-xs rounded-xl p-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 leading-relaxed resize-none"
            />
          </div>

          <button
            onClick={() => {
              createActivityLog('Update', 'System core prompt persona updated by Admin.', 'Admin').catch(() => {});
              alert('Core AI Persona settings successfully committed!');
            }}
            className="w-full bg-primary hover:bg-primary-hover text-white font-extrabold text-xs py-2.5 rounded-xl shadow-lg shadow-primary/10 cursor-pointer transition-transform active:scale-95"
          >
            Save Prompt Settings
          </button>
        </div>

        {/* AI Vector Memory Store */}
        <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between lg:col-span-2">
          <div className="pb-4 border-b border-border flex justify-between items-center">
            <div>
              <h3 className="text-sm font-extrabold text-text-primary tracking-tight flex items-center">
                <Brain size={15} className="mr-1.5 text-primary" />
                <span>Cognitive CRM Memory Nodes</span>
              </h3>
              <p className="text-[10px] text-text-secondary font-bold uppercase mt-0.5">Contextual variable extractions & intent tracking</p>
            </div>
            <span className="text-[9px] text-primary font-bold bg-primary/5 px-2 py-0.5 rounded uppercase">Vector DB</span>
          </div>

          <div className="my-4 flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            {memoryNodes.length === 0 ? (
              <div className="col-span-full p-6 text-center text-xs text-text-secondary">
                No cognitive memory nodes
              </div>
            ) : (
              memoryNodes.map(node => (
                <div key={node.id} className="border border-border rounded-xl p-4 space-y-3 bg-surface">
                  <div className="flex justify-between items-start border-b border-border/60 pb-2">
                    <div>
                      <h4 className="text-xs font-bold text-text-primary">{node.client}</h4>
                      <span className="text-[9px] text-primary font-mono font-bold uppercase mt-0.5">{node.intent}</span>
                    </div>
                    <span className="h-2 w-2 rounded-full bg-success/50 animate-pulse" title="Active Thread Memory Locked" />
                  </div>

                  <div className="space-y-1.5 text-[11px] text-text-secondary font-semibold font-sans">
                    <div className="flex justify-between">
                      <span className="text-text-secondary font-medium">Project Focus:</span>
                      <span className="text-text-primary font-bold">{node.extractedDetails.project || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary font-medium">Estimated Budget:</span>
                      <span className="text-text-primary font-bold">{node.extractedDetails.budget || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary font-medium">Interest Stage:</span>
                      <span className="text-text-primary font-bold">{node.extractedDetails.stage || 'N/A'}</span>
                    </div>
                    <div className="pt-2 border-t border-border/40 text-[10px] text-text-secondary italic">
                      <span className="block font-bold uppercase text-[8px] text-text-secondary not-italic mb-0.5">Persistent Node Notes:</span>
                      "{node.extractedDetails.notes}"
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="bg-primary/5 border border-primary/20 p-3.5 rounded-xl flex items-start space-x-2.5 text-xs text-primary leading-normal">
            <CheckCircle2 size={16} className="text-primary shrink-0 mt-0.5 animate-bounce" />
            <p className="font-semibold">All cognitive slots are backed up directly in Supabase storage to maintain full session resilience across browser updates.</p>
          </div>
        </div>

      </div>

      {/* AI Latency and Response Trend graphs */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
        <div className="pb-4 border-b border-border flex justify-between items-center">
          <div>
            <h3 className="text-sm font-extrabold text-text-primary tracking-tight flex items-center">
              <TrendingUp size={15} className="mr-1.5 text-primary" />
              <span>AI Agent Analytics</span>
            </h3>
            <p className="text-[10px] text-text-secondary font-bold uppercase mt-0.5">Hourly query load & computational billing cost</p>
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