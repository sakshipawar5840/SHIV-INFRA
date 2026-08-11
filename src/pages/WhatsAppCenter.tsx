import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  CheckCircle2, 
  MessageSquare, 
  Send, 
  Clock, 
  User, 
  ShieldCheck, 
  RefreshCw, 
  ExternalLink,
  PhoneCall
} from 'lucide-react';
import { logSystemAction } from '../lib/mockData';

interface ChatMessage {
  id: string;
  sender: 'client' | 'admin';
  text: string;
  time: string;
}

interface Conversation {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: boolean;
  history: ChatMessage[];
}

export const WhatsAppCenter: React.FC = () => {
  const { user } = useAuth();
  const [activeConvId, setActiveConvId] = useState('c1');
  const [inputMessage, setInputMessage] = useState('');
  
  // Custom pre-composed template buttons
  const templates = [
    { id: 't_welcome', label: 'Welcome/Brochure', text: 'Hello, Thank you for contacting SHIV INFRA. Here is the brochure of our Green Valley project.' },
    { id: 't_visit', label: 'Site Tour Alert', text: 'Dear Client, Your Site Visit for Sky Heights is confirmed for Saturday 11:00 AM.' },
    { id: 't_receipt', label: 'Billing Confirmation', text: 'Dear Client, Payment of Rs. 10 Lakhs has been received against Flat No 402. PDF Receipt generated.' }
  ];

  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: 'c1',
      name: 'Rahul Mehta',
      phone: '+91 91234 56789',
      avatar: 'RM',
      lastMessage: 'Sure, I will proceed with downpayment terms today.',
      time: 'Just now',
      unread: true,
      history: [
        { id: 'm1', sender: 'client', text: 'Hello, I want to check the progress of Sky Heights flat 1204.', time: '11:00 AM' },
        { id: 'm2', sender: 'admin', text: 'Dear Rahul, slab casting of 5th floor is complete. We are on schedule.', time: '11:05 AM' },
        { id: 'm3', sender: 'client', text: 'Sure, I will proceed with downpayment terms today.', time: '11:10 AM' }
      ]
    },
    {
      id: 'c2',
      name: 'Ramesh Patil',
      phone: '+91 99887 76655',
      avatar: 'RP',
      lastMessage: 'Please email me the layout blueprint for Wakad site.',
      time: '2 hours ago',
      unread: false,
      history: [
        { id: 'm4', sender: 'admin', text: 'Hello Ramesh, checking if you received the municipal NOC certificate copy.', time: '09:00 AM' },
        { id: 'm5', sender: 'client', text: 'Please email me the layout blueprint for Wakad site.', time: '09:15 AM' }
      ]
    },
    {
      id: 'c3',
      name: 'Aarti Joshi',
      phone: '+91 91122 33445',
      avatar: 'AJ',
      lastMessage: 'Thank you for updating the RERA timelines.',
      time: '1 day ago',
      unread: false,
      history: [
        { id: 'm6', sender: 'admin', text: 'Hello Aarti, RERA project registration approved for Green Valley site.', time: 'Yesterday' },
        { id: 'm7', sender: 'client', text: 'Thank you for updating the RERA timelines.', time: 'Yesterday' }
      ]
    }
  ]);

  const activeConv = conversations.find(c => c.id === activeConvId) || conversations[0];

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputMessage.trim();
    if (!text) return;

    const newAdminMsg: ChatMessage = {
      id: `m_${Date.now()}`,
      sender: 'admin',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedConvHistory = [...activeConv.history, newAdminMsg];
    
    // Update active conversation text and history
    const updatedConversations = conversations.map(c => {
      if (c.id === activeConv.id) {
        return {
          ...c,
          lastMessage: text,
          time: 'Just now',
          unread: false,
          history: updatedConvHistory
        };
      }
      return c;
    });

    setConversations(updatedConversations);
    if (!textToSend) setInputMessage('');
    logSystemAction('Update', `WhatsApp Business API message dispatched to ${activeConv.name}`);

    // Simulate Client response based on content
    setTimeout(() => {
      const responses = [
        "Perfect, thank you! I will verify this with my banker.",
        "Acknowledged. Let's schedule a call tomorrow afternoon.",
        "Got it, sounds great. Appreciate the instant update!",
        "Thanks for the transparency. Let's finalize the paperwork."
      ];
      const clientResponseText = responses[Math.floor(Math.random() * responses.length)];

      const newClientMsg: ChatMessage = {
        id: `m_c_${Date.now()}`,
        sender: 'client',
        text: clientResponseText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const finalHistory = [...updatedConvHistory, newClientMsg];

      setConversations(prev => prev.map(c => {
        if (c.id === activeConv.id) {
          return {
            ...c,
            lastMessage: clientResponseText,
            time: 'Just now',
            unread: true,
            history: finalHistory
          };
        }
        return c;
      }));

      logSystemAction('Access', `Inbound WhatsApp webhook received from ${activeConv.name}`);
    }, 1500);
  };

  return (
    <div className="space-y-6 text-slate-100 font-sans h-[calc(100vh-6rem)] flex flex-col justify-between">
      {/* HUD metrics and Control header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <MessageSquare size={18} className="animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight">WhatsApp Business control center</h2>
            <p className="text-[10px] text-slate-400 mt-0.5">Meta API Webhook diagnostics & live marketing center.</p>
          </div>
        </div>

        {/* API connection statuses */}
        <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono font-semibold">
          <span className="flex items-center bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-1 rounded-lg">
            <CheckCircle2 size={11} className="mr-1" /> Meta API: Online
          </span>
          <span className="flex items-center bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-1 rounded-lg">
            <ShieldCheck size={11} className="mr-1" /> SSL Webhook: Verified
          </span>
          <span className="text-slate-500 bg-slate-950/60 px-2 py-1 rounded-lg border border-slate-850">
            Business No: +91 98765 43210
          </span>
        </div>
      </div>

      {/* Main split-screen box */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0 py-2">
        {/* Left Inbox List */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-800 bg-slate-950/40">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Client Conversations</span>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-slate-800/40">
            {conversations.map(c => (
              <button
                key={c.id}
                onClick={() => setActiveConvId(c.id)}
                className={`w-full text-left p-3.5 flex items-start space-x-3 hover:bg-slate-850/40 transition-all cursor-pointer ${
                  activeConvId === c.id ? 'bg-slate-800/60 border-l-2 border-emerald-500' : ''
                }`}
              >
                <div className="h-8 w-8 rounded-full bg-slate-850 border border-slate-800 flex items-center justify-center font-bold text-xs text-sky-400">
                  {c.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <p className="text-xs font-bold text-slate-200 truncate">{c.name}</p>
                    <span className="text-[8px] text-slate-500 font-mono shrink-0">{c.time}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate mt-1">{c.lastMessage}</p>
                </div>
                {c.unread && (
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 self-center animate-ping"></span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Right Chat Terminal & Actions Panel */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6 min-h-0">
          {/* Active chat window */}
          <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between overflow-hidden">
            {/* Header info */}
            <div className="px-4 py-3 bg-slate-950/60 border-b border-slate-800 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-xs font-bold text-slate-200">{activeConv.name}</h3>
                <p className="text-[9px] text-slate-500 font-mono mt-0.5">{activeConv.phone}</p>
              </div>
              <a
                href={`tel:${activeConv.phone}`}
                className="p-1.5 text-sky-400 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors"
                title="Direct Phone Call"
              >
                <PhoneCall size={12} />
              </a>
            </div>

            {/* Bubble logs container */}
            <div className="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-3 bg-slate-950/20">
              {activeConv.history.map(msg => {
                const isAdmin = msg.sender === 'admin';
                return (
                  <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-2xl text-xs space-y-1 ${
                      isAdmin 
                        ? 'bg-sky-600 text-white rounded-br-none shadow-md shadow-sky-500/5' 
                        : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'
                    }`}>
                      <p className="leading-relaxed whitespace-pre-line">{msg.text}</p>
                      <span className="block text-[8px] text-slate-400 text-right font-mono">{msg.time}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input sending bar */}
            <div className="p-3 bg-slate-950/40 border-t border-slate-800 shrink-0 flex items-center space-x-2">
              <input
                type="text"
                placeholder="Type dynamic message chat here..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendMessage();
                }}
                className="flex-1 bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-sky-500"
              />
              <button
                onClick={() => handleSendMessage()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 rounded-xl transition-all shadow-lg shadow-emerald-500/10 shrink-0 cursor-pointer"
              >
                <Send size={14} />
              </button>
            </div>
          </div>

          {/* Preset Marketing templates */}
          <div className="md:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4 overflow-y-auto custom-scrollbar">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center">
              <RefreshCw size={12} className="mr-1 text-emerald-400 animate-spin" /> Send Templates
            </span>
            <p className="text-[10px] text-slate-500 leading-normal">Transmit pre-approved business templates instantly to active chat numbers.</p>
            
            <div className="space-y-3.5">
              {templates.map(tpl => (
                <button
                  key={tpl.id}
                  onClick={() => handleSendMessage(tpl.text)}
                  className="w-full text-left bg-slate-950 border border-slate-850 p-3 rounded-xl hover:border-emerald-500/40 transition-all text-xs space-y-2 group cursor-pointer"
                >
                  <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 px-2 py-0.5 rounded-full uppercase">
                    {tpl.label}
                  </span>
                  <p className="text-slate-400 group-hover:text-slate-200 transition-colors leading-relaxed line-clamp-3">{tpl.text}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default WhatsAppCenter;
