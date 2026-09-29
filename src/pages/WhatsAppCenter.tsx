import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../lib/axiosClient';
import { 
  CheckCircle2, 
  MessageSquare, 
  Send, 
  Clock, 
  User, 
  ShieldCheck, 
  RefreshCw, 
  ExternalLink,
  PhoneCall,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { createActivityLog } from '../lib/activityLogService';
import { useToast } from '../contexts/ToastContext';

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

interface ChannelStatus {
  whatsapp: {
    configured: boolean;
    phoneNumber?: string;
    businessName?: string;
  };
}

export const WhatsAppCenter: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [activeConvId, setActiveConvId] = useState('c1');
  const [inputMessage, setInputMessage] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [channelStatus, setChannelStatus] = useState<ChannelStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Custom pre-composed template buttons
  const templates = [
    { id: 't_welcome', label: 'Welcome/Brochure', text: 'Hello, Thank you for contacting SHIV INFRA. Here is the brochure of our project.' },
    { id: 't_visit', label: 'Site Tour Alert', text: 'Dear Client, Your Site Visit is confirmed for Saturday 11:00 AM.' },
    { id: 't_receipt', label: 'Billing Confirmation', text: 'Dear Client, Payment has been received. PDF Receipt generated.' }
  ];

  const activeConv = conversations.find(c => c.id === activeConvId) || conversations[0];

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
    loadChannelStatus();
  }, []);

  // Load messages when active conversation changes
  useEffect(() => {
    if (activeConvId && activeConvId !== 'c1') {
      loadMessages(activeConvId);
    }
  }, [activeConvId]);

  const loadConversations = async () => {
    try {
      const res = await apiClient.get('/api/v1/whatsapp/conversations');
      if (res.data.success && res.data.conversations) {
        const formattedConversations: Conversation[] = res.data.conversations.map((conv: any, index: number) => ({
          id: conv.phone,
          name: conv.name || `Client ${index + 1}`,
          phone: conv.phone,
          avatar: conv.name ? conv.name.charAt(0).toUpperCase() : 'C',
          lastMessage: conv.lastMessage || 'No messages yet',
          time: conv.lastMessageTime ? new Date(conv.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--',
          unread: conv.unreadCount > 0,
          history: []
        }));
        setConversations(formattedConversations);
        if (formattedConversations.length > 0 && activeConvId === 'c1') {
          setActiveConvId(formattedConversations[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
      showToast('Failed to load conversations', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (phone: string) => {
    try {
      const res = await apiClient.get(`/api/v1/whatsapp/conversations/${phone}/messages`);
      if (res.data.success && res.data.messages) {
        const formattedMessages: ChatMessage[] = res.data.messages.map((msg: any) => ({
          id: msg.id,
          sender: msg.direction === 'outbound' ? 'admin' : 'client',
          text: msg.content,
          time: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }));
        setConversations(prev => prev.map(c => 
          c.id === phone ? { ...c, history: formattedMessages } : c
        ));
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
      showToast('Failed to load messages', 'error');
    }
  };

  const loadChannelStatus = async () => {
    try {
      const res = await apiClient.get('/api/v1/channels/status');
      if (res.data.success) {
        setChannelStatus(res.data);
      }
    } catch (error) {
      console.error('Failed to load channel status:', error);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    if (!activeConv) return;
    
    const text = textToSend || inputMessage.trim();
    if (!text) return;

    setSending(true);
    try {
      const res = await apiClient.post('/api/v1/whatsapp/send', {
        phone: activeConv.phone,
        message: text
      });
      
      if (res.data.success) {
        if (!textToSend) setInputMessage('');
        createActivityLog('Update', `WhatsApp Business API message dispatched to ${activeConv.name}`, 'Admin').catch(() => {});
        showToast('Message sent successfully', 'success');
        // Reload real messages after successful send
        await loadMessages(activeConv.phone);
      } else {
        showToast(res.data.message || 'Failed to send message', 'error');
      }
    } catch (error: any) {
      console.error('Failed to send message:', error);
      showToast(error.response?.data?.message || 'Failed to send message', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 text-text-primary font-sans h-[calc(100vh-6rem)] flex flex-col justify-between">
      {/* HUD metrics and Control header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 bg-surface border border-border p-4 rounded-2xl">
        <div className="flex items-center space-x-3">
          <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${channelStatus?.whatsapp?.configured ? 'bg-success/5 border border-success/20 text-success' : 'bg-destructive/5 border border-destructive/20 text-destructive'}`}>
            <MessageSquare size={18} className={channelStatus?.whatsapp?.configured ? 'animate-pulse' : ''} />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight">WhatsApp Business control center</h2>
            <p className="text-[10px] text-text-secondary mt-0.5">Meta API Webhook diagnostics & live marketing center.</p>
          </div>
        </div>

        {/* API connection statuses */}
        <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono font-semibold">
          {channelStatus?.whatsapp?.configured ? (
            <>
              <span className="flex items-center bg-success/5 border border-success/20 text-success px-2 py-1 rounded-lg">
                <CheckCircle2 size={11} className="mr-1" /> Meta API: Connected
              </span>
              <span className="flex items-center bg-success/5 border border-success/20 text-success px-2 py-1 rounded-lg">
                <ShieldCheck size={11} className="mr-1" /> SSL Webhook: Verified
              </span>
              <span className="text-text-secondary bg-surface/60 px-2 py-1 rounded-lg border border-border">
                Business No: {channelStatus.whatsapp.phoneNumber || 'Not set'}
              </span>
            </>
          ) : (
            <span className="flex items-center bg-destructive/5 border border-destructive/20 text-destructive px-2 py-1 rounded-lg">
              <AlertCircle size={11} className="mr-1" /> WhatsApp: NOT CONFIGURED
            </span>
          )}
        </div>
      </div>

      {/* Main split-screen box */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0 py-2">
        {/* Left Inbox List */}
        <div className="lg:col-span-1 bg-surface border border-border rounded-2xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border bg-surface/40">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Client Conversations</span>
          </div>
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 size={24} className="animate-spin text-primary" />
            </div>
          ) : !channelStatus?.whatsapp?.configured ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-3 p-4">
                <AlertCircle size={40} className="mx-auto text-destructive opacity-50" />
                <p className="text-sm text-text-secondary">WhatsApp is not configured</p>
                <p className="text-[10px] text-text-secondary">Add META_WHATSAPP_TOKEN and META_WHATSAPP_PHONE_NUMBER_ID to environment variables</p>
              </div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-3">
                <MessageSquare size={40} className="mx-auto text-text-secondary opacity-50" />
                <p className="text-sm text-text-secondary">No conversations yet</p>
                <p className="text-[10px] text-text-secondary">Messages will appear here when received</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-border">
              {conversations.map(c => (
                <button
                  key={c.id}
                  onClick={() => setActiveConvId(c.id)}
                  className={`w-full text-left p-3.5 flex items-start space-x-3 hover:bg-bg-app/40 transition-all cursor-pointer ${
                    activeConvId === c.id ? 'bg-black/5 border-l-2 border-emerald-500' : ''
                  }`}
                >
                  <div className="h-8 w-8 rounded-full bg-surface border border-border flex items-center justify-center font-bold text-xs text-primary">
                    {c.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <p className="text-xs font-bold text-text-primary truncate">{c.name}</p>
                      <span className="text-[8px] text-text-secondary font-mono shrink-0">{c.time}</span>
                    </div>
                    <p className="text-[10px] text-text-secondary truncate mt-1">{c.lastMessage}</p>
                  </div>
                  {c.unread && (
                    <span className="h-1.5 w-1.5 rounded-full bg-success self-center animate-ping"></span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Chat Terminal & Actions Panel */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6 min-h-0">
          {!activeConv ? (
            <div className="md:col-span-2 bg-surface border border-border rounded-2xl flex flex-col justify-between overflow-hidden">
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-3">
                  <MessageSquare size={40} className="mx-auto text-text-secondary opacity-50" />
                  <p className="text-sm text-text-secondary">Select a conversation</p>
                  <p className="text-[10px] text-text-secondary">Choose a conversation from the list to start messaging</p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Active chat window */}
              <div className="md:col-span-2 bg-surface border border-border rounded-2xl flex flex-col justify-between overflow-hidden">
                {/* Header info */}
                <div className="px-4 py-3 bg-surface/60 border-b border-border flex justify-between items-center shrink-0">
                  <div>
                    <h3 className="text-xs font-bold text-text-primary">{activeConv.name}</h3>
                    <p className="text-[9px] text-text-secondary font-mono mt-0.5">{activeConv.phone}</p>
                  </div>
                  <a
                    href={`tel:${activeConv.phone}`}
                    className="p-1.5 text-primary hover:bg-bg-app border border-border rounded-lg transition-colors"
                    title="Direct Phone Call"
                  >
                    <PhoneCall size={12} />
                  </a>
                </div>

                {/* Bubble logs container */}
                <div className="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-3 bg-surface/20">
                  {activeConv.history.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-text-secondary text-xs">
                      No messages in this conversation
                    </div>
                  ) : (
                    activeConv.history.map(msg => {
                      const isAdmin = msg.sender === 'admin';
                      return (
                        <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] p-3 rounded-2xl text-xs space-y-1 ${
                            isAdmin 
                              ? 'bg-primary text-white rounded-br-none shadow-md shadow-primary/5' 
                              : 'bg-surface border border-border text-text-primary rounded-bl-none'
                          }`}>
                            <p className="leading-relaxed whitespace-pre-line">{msg.text}</p>
                            <span className="block text-[8px] text-text-secondary text-right font-mono">{msg.time}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Input sending bar */}
                <div className="p-3 bg-surface/40 border-t border-border shrink-0 flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Type dynamic message chat here..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSendMessage();
                    }}
                    disabled={sending || !channelStatus?.whatsapp?.configured}
                    className="flex-1 bg-surface border border-border text-text-primary placeholder-text-secondary rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={sending || !inputMessage.trim() || !channelStatus?.whatsapp?.configured}
                    className="bg-success hover:bg-success/90 text-white p-2.5 rounded-xl transition-all shadow-lg shadow-success/10 shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  </button>
                </div>
              </div>

              {/* Preset Marketing templates */}
              <div className="md:col-span-1 bg-surface border border-border rounded-2xl p-4 space-y-4 overflow-y-auto custom-scrollbar">
                <span className="text-xs font-bold text-text-secondary uppercase tracking-widest flex items-center">
                  <RefreshCw size={12} className="mr-1 text-success animate-spin" /> Send Templates
                </span>
                <p className="text-[10px] text-text-secondary leading-normal">Transmit pre-approved business templates instantly to active chat numbers.</p>
                
                <div className="space-y-3.5">
                  {templates.map(tpl => (
                    <button
                      key={tpl.id}
                      onClick={() => handleSendMessage(tpl.text)}
                      disabled={sending || !channelStatus?.whatsapp?.configured}
                      className="w-full text-left bg-surface border border-border p-3 rounded-xl hover:border-emerald-500/40 transition-all text-xs space-y-2 group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="text-[9px] font-bold text-success bg-success/5 border border-success/20 px-2 py-0.5 rounded-full uppercase">
                        {tpl.label}
                      </span>
                      <p className="text-text-secondary group-hover:text-text-primary transition-colors leading-relaxed line-clamp-3">{tpl.text}</p>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
export default WhatsAppCenter;
