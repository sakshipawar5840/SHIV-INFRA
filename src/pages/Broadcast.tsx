import React, { useState, useEffect } from 'react';
import { apiClient } from '../lib/axiosClient';
import {
  Megaphone,
  Send,
  Users,
  Target,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Loader2,
  Eye,
  ChevronDown,
  ChevronUp,
  Phone,
  MessageSquare,
  Check,
  Globe,
  Instagram,
  Smartphone,
  PauseCircle,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

interface Broadcast {
  id: string;
  message_text: string;
  audience: string;
  status: 'Pending' | 'Sent' | 'Failed' | 'Partial';
  recipient_count: number;
  success_count: number;
  failure_count: number;
  skipped_count?: number;
  channel: string;
  created_at: string;
  completed_at: string | null;
}

interface BroadcastRecipient {
  id: string;
  phone: string;
  recipient_type: string;
  status: string;
  error: string | null;
  sent_at: string | null;
  channel: string;
}

interface BroadcastStats {
  total_broadcasts: number;
  total_recipients: number;
  total_sent: number;
  total_failed: number;
  by_status: {
    Pending: number;
    Sent: number;
    Partial: number;
    Failed: number;
  };
}

interface ChannelStatus {
  configured: boolean;
  status: string;
  label: string;
}

interface ChannelStatusData {
  whatsapp: ChannelStatus;
  facebook: ChannelStatus;
  instagram: ChannelStatus;
  sms: ChannelStatus;
}

export const Broadcast: React.FC = () => {
  const toast = useToast();
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [stats, setStats] = useState<BroadcastStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [recipients, setRecipients] = useState<Record<string, BroadcastRecipient[]>>({});
  const [channelStatus, setChannelStatus] = useState<ChannelStatusData | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  // Form state
  const [messageText, setMessageText] = useState('');
  const [audience, setAudience] = useState('CUSTOMERS');
  const [selectedChannels, setSelectedChannels] = useState<string[]>(['whatsapp']);

  const channelOptions = [
    { id: 'whatsapp', label: 'WhatsApp', icon: <MessageSquare size={14} className="text-whatsapp" /> },
    { id: 'facebook', label: 'Facebook', icon: <Globe size={14} className="text-primary" /> },
    { id: 'instagram', label: 'Instagram', icon: <Instagram size={14} className="text-primary" /> },
    { id: 'sms', label: 'SMS / Text', icon: <Phone size={14} className="text-primary" /> },
  ];

  const toggleChannel = (channelId: string) => {
    setSelectedChannels(prev =>
      prev.includes(channelId)
        ? prev.filter(c => c !== channelId)
        : [...prev, channelId]
    );
  };

  useEffect(() => {
    loadData();
    loadChannelStatus();
  }, []);

  const loadChannelStatus = async () => {
    try {
      const res = await apiClient.get('/v1/channels/status');
      if (res.data?.success && res.data?.data) {
        setChannelStatus(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load channel status', err);
    } finally {
      setStatusLoading(false);
    }
  };

  const loadData = async () => {
    try {
      const [broadcastsRes, statsRes] = await Promise.all([
        apiClient.get('/v1/broadcasts'),
        apiClient.get('/v1/broadcasts/stats'),
      ]);
      setBroadcasts(broadcastsRes.data?.data ?? []);
      setStats(statsRes.data?.data ?? null);
    } catch (err) {
      console.error('Failed to load broadcasts', err);
      toast.showToast('Failed to load broadcasts', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageText.trim()) {
      toast.showToast('Message is required', 'warning');
      return;
    }

    if (selectedChannels.length === 0) {
      toast.showToast('Select at least one channel', 'warning');
      return;
    }

    setSending(true);
    try {
      const payload: any = {
        message_text: messageText,
        audience: audience,
        channels: selectedChannels,
      };

      const res = await apiClient.post('/v1/broadcasts', payload);

      if (res.data?.success) {
        toast.showToast(res.data.message || 'Broadcast dispatched successfully', 'success');
        setMessageText('');
        loadData();
      } else {
        toast.showToast(res.data?.message || 'Broadcast dispatched with issues', 'warning');
        loadData();
      }
    } catch (err: any) {
      console.error('Failed to send broadcast', err);
      // Even on backend error, reload to show latest state
      loadData();
    } finally {
      setSending(false);
    }
  };

  const toggleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }

    if (!recipients[id]) {
      try {
        const res = await apiClient.get(`/v1/broadcasts/${id}`);
        setRecipients((prev) => ({
          ...prev,
          [id]: res.data?.data?.recipients ?? [],
        }));
      } catch (err) {
        console.error('Failed to load recipients', err);
      }
    }
    setExpandedId(id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Sent':
        return 'text-green-400 bg-green-400/10';
      case 'Skipped':
        return 'text-yellow-400 bg-yellow-400/10';
      case 'Failed':
        return 'text-red-400 bg-red-400/10';
      case 'Pending':
        return 'text-blue-400 bg-blue-400/10';
      default:
        return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Sent':
        return <CheckCircle2 size={14} />;
      case 'Skipped':
        return <PauseCircle size={14} />;
      case 'Failed':
        return <XCircle size={14} />;
      case 'Pending':
        return <Clock size={14} />;
      default:
        return <Clock size={14} />;
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'whatsapp':
        return <MessageSquare size={10} className="text-whatsapp" />;
      case 'facebook':
        return <Globe size={10} className="text-blue-500" />;
      case 'instagram':
        return <Instagram size={10} className="text-primary" />;
      case 'sms':
        return <Phone size={10} className="text-purple-500" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary" size={32} />
        <span className="ml-3 text-text-secondary">Loading broadcasts...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black flex items-center gap-3">
            <Megaphone className="text-primary" size={28} />
            Multi-Channel Broadcast
          </h1>
          <p className="text-text-secondary mt-1">
            Send messages to customer and lead groups via WhatsApp, Facebook Messenger, Instagram DM, and SMS / Text
          </p>
        </div>
      </div>

      {/* Channel Configuration Status */}
      {!statusLoading && channelStatus && (
        <div className="bg-surface rounded-xl p-4 border border-border space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Channel Status</span>
            <RefreshCw onClick={loadChannelStatus} size={12} className="text-text-secondary hover:text-primary cursor-pointer" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {channelOptions.map((ch) => {
              const status = channelStatus[ch.id as keyof ChannelStatusData];
              const configured = status?.configured;
              return (
                <div
                  key={ch.id}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs ${
                    configured
                      ? 'border-success/20 bg-success/5 text-success'
                      : 'border-danger/20 bg-danger/5 text-danger'
                  }`}
                >
                  {ch.icon}
                  <span className="font-bold">{ch.label}</span>
                  <span className="ml-auto font-mono">{configured ? 'Ready' : 'NOT CONFIGURED'}</span>
                </div>
              );
            })}
          </div>
          {selectedChannels.some(ch => !channelStatus[ch as keyof ChannelStatusData]?.configured) && (
            <div className="text-xs text-warning bg-warning/5 border border-warning/20 text-warning px-3 py-2 rounded-lg">
              <AlertCircle size={12} className="inline mr-1" />
              One or more selected channels are not configured. Recipients for unconfigured channels will be marked as <strong>SKIPPED</strong>, not sent.
            </div>
          )}
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-surface rounded-xl p-4 border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Megaphone className="text-primary" size={20} />
              </div>
              <div>
                <p className="text-text-secondary text-sm">Total Broadcasts</p>
                <p className="text-xl font-bold text-black">{stats.total_broadcasts}</p>
              </div>
            </div>
          </div>
          <div className="bg-surface rounded-xl p-4 border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-400/10 rounded-lg">
                <Users className="text-blue-400" size={20} />
              </div>
              <div>
                <p className="text-text-secondary text-sm">Total Recipients</p>
                <p className="text-xl font-bold text-black">{stats.total_recipients}</p>
              </div>
            </div>
          </div>
          <div className="bg-surface rounded-xl p-4 border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-400/10 rounded-lg">
                <CheckCircle2 className="text-green-400" size={20} />
              </div>
              <div>
                <p className="text-text-secondary text-sm">Messages Sent</p>
                <p className="text-xl font-bold text-black">{stats.total_sent}</p>
              </div>
            </div>
          </div>
          <div className="bg-surface rounded-xl p-4 border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-400/10 rounded-lg">
                <XCircle className="text-red-400" size={20} />
              </div>
              <div>
                <p className="text-text-secondary text-sm">Failed</p>
                <p className="text-xl font-bold text-black">{stats.total_failed}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Send Broadcast Form */}
      <div className="bg-surface rounded-xl p-6 border border-border">
        <h2 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
          <Send size={20} className="text-primary" />
          Send New Broadcast
        </h2>
        <form onSubmit={handleSendBroadcast} className="space-y-4">
          <div>
            <label className="block text-sm text-text-secondary mb-2">Message</label>
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type your broadcast message..."
              rows={4}
              className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-black placeholder-text-secondary focus:outline-none focus:border-primary resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-text-secondary mb-2">Audience</label>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-black focus:outline-none focus:border-primary"
              >
                <option value="CUSTOMERS">All Customers</option>
                <option value="LEADS">All Leads</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-2">Channels</label>
              <div className="flex flex-wrap gap-2">
              {channelOptions.map((ch) => {
                const isSelected = selectedChannels.includes(ch.id);
                const channelStat = channelStatus?.[ch.id as keyof ChannelStatusData];
                const isReady = !channelStat || channelStat.configured;
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => toggleChannel(ch.id)}
                    disabled={!isReady && !isSelected}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border font-medium text-sm transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-black text-white border-black'
                        : 'bg-surface text-text-secondary border-border hover:bg-black/5 hover:border-black'
                    } ${
                      !isReady && !isSelected
                        ? 'opacity-50 cursor-not-allowed'
                        : ''
                    }`}
                  >
                    {ch.icon}
                    {isSelected ? <Check size={14} className="text-white" /> : null}
                    {ch.label}
                    {channelStat && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                        channelStat.configured
                          ? 'bg-success/10 text-success'
                          : 'bg-danger/10 text-danger'
                      }`}>
                        {channelStat.configured ? 'Active' : 'Not Configured'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {selectedChannels.length === 0 && (
              <p className="text-xs text-danger mt-2">Select at least one channel</p>
            )}
          </div>
          </div>

          <button
            type="submit"
            disabled={sending}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-black font-medium px-6 py-3 rounded-lg transition-colors"
          >
            {sending ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Dispatching...
              </>
            ) : (
              <>
                <Send size={18} />
                Send Broadcast
              </>
            )}
          </button>
        </form>
      </div>

      {/* Broadcast History */}
      <div className="bg-surface rounded-xl border border-border">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-black flex items-center gap-2">
            <Clock size={20} className="text-primary" />
            Broadcast History
          </h2>
        </div>

        {broadcasts.length === 0 ? (
          <div className="p-8 text-center">
            <Megaphone className="mx-auto text-text-secondary mb-3" size={48} />
            <p className="text-text-secondary">No broadcasts yet</p>
            <p className="text-text-secondary text-sm mt-1">
              Send your first broadcast using the form above
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {broadcasts.map((broadcast) => (
              <div key={broadcast.id} className="p-4">
                <div
                  className="flex items-start justify-between cursor-pointer"
                  onClick={() => toggleExpand(broadcast.id)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(broadcast.status)}`}>
                        {getStatusIcon(broadcast.status)}
                        {broadcast.status}
                      </span>
                      <span className="text-text-secondary text-xs">
                        {new Date(broadcast.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-black line-clamp-2 mb-2">
                      {broadcast.message_text}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-text-secondary">
                      <span className="flex items-center gap-1">
                        <Target size={14} />
                        {broadcast.audience}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={14} />
                        {broadcast.recipient_count} recipients
                      </span>
                      {broadcast.success_count > 0 && (
                        <span className="flex items-center gap-1 text-green-400">
                          <CheckCircle2 size={14} />
                          {broadcast.success_count} sent
                        </span>
                      )}
                      {broadcast.failure_count > 0 && (
                        <span className="flex items-center gap-1 text-red-400">
                          <XCircle size={14} />
                          {broadcast.failure_count} failed
                        </span>
                      )}
                      {broadcast.skipped_count !== undefined && broadcast.skipped_count > 0 && (
                        <span className="flex items-center gap-1 text-yellow-400">
                          <PauseCircle size={14} />
                          {broadcast.skipped_count} skipped
                        </span>
                      )}
                    </div>
                  </div>
                  <button className="text-text-secondary hover:text-black p-1">
                    {expandedId === broadcast.id ? (
                      <ChevronUp size={20} />
                    ) : (
                      <ChevronDown size={20} />
                    )}
                  </button>
                </div>

                {/* Expanded Recipients */}
                {expandedId === broadcast.id && (
                  <div className="mt-4 pl-4 border-l-2 border-border">
                    <h4 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
                      <Phone size={14} />
                      Recipients
                    </h4>
                    {recipients[broadcast.id] ? (
                      recipients[broadcast.id].length > 0 ? (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {recipients[broadcast.id].map((r) => (
                            <div
                              key={r.id}
                              className="flex items-center justify-between bg-surface rounded-lg px-3 py-2"
                            >
                              <div className="flex items-center gap-3">
                                {getChannelIcon(r.channel || 'whatsapp')}
                                <span className="text-black text-sm">{r.phone}</span>
                                <span className="text-text-secondary text-xs capitalize">
                                  {r.recipient_type}
                                </span>
                                <span className="text-text-secondary text-xs capitalize">
                                  {r.channel || 'whatsapp'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                {r.error && (
                                  <span className="text-[10px] text-danger max-w-[200px] truncate" title={r.error}>
                                    {r.error}
                                  </span>
                                )}
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${getStatusColor(r.status)}`}
                                >
                                  {getStatusIcon(r.status)}
                                  {r.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-text-secondary text-sm">No recipients found</p>
                      )
                    ) : (
                      <Loader2 className="animate-spin text-primary" size={16} />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Broadcast;
