'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { useRealtime } from '@/hooks/useRealtime';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { useNotificationSound } from '@/hooks/useNotificationSound';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { Send, Check, CheckCheck, Phone, Loader2, MessageSquare, Search, Filter, X, FileText, ChevronDown, UserPlus, Clock, Instagram } from 'lucide-react';
import ChannelBadge, { ChannelDot } from '@/components/ChannelBadge';
import { RealtimeMessage } from '@/hooks/useRealtime';

interface Conversation {
  id: string;
  contactId: string;
  name: string;
  phone: string;
  stage: string;
  channel: string;
  assignedToId: string | null;
  assignedTo: { id: string; name: string; email: string } | null;
  unreadCount: number;
  lastMessage: string;
  lastMessageAt: string | null;
  status: string;
}

interface Message {
  id: string;
  bodyText: string;
  direction: 'inbound' | 'outbound';
  type: string;
  channel: string;
  createdAt: string;
  sentByUserId: string | null;
  sentByUser: { id: string; name: string } | null;
  readReceipts: { userId: string; user: { id: string; name: string } }[];
}

interface Template {
  id: string;
  title: string;
  body: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
}

export default function InboxPage() {
  const { user, workspace, isLoading: authLoading } = useAuth();
  const { addNotification } = useNotification();
  const USER_ID = user?.id || '';
  const WORKSPACE_ID = workspace?.id || '';
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const [showAssignMenu, setShowAssignMenu] = useState(false);
  const [showStageMenu, setShowStageMenu] = useState(false);
  const [showFollowupModal, setShowFollowupModal] = useState(false);
  const [followupData, setFollowupData] = useState({ dueAt: '', note: '' });
  const [smartReplies, setSmartReplies] = useState<string[]>([]);
  const [loadingSmartReplies, setLoadingSmartReplies] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const templateMenuRef = useRef<HTMLDivElement>(null);
  const assignMenuRef = useRef<HTMLDivElement>(null);
  const stageMenuRef = useRef<HTMLDivElement>(null);
  const { playNotificationSound: playNotification } = useNotificationSound();
  const { typingUsers, sendTyping } = useTypingIndicator(selectedConversation?.id || '', WORKSPACE_ID, USER_ID);

  const headers = {
    'x-user-id': USER_ID,
    'x-workspace-id': WORKSPACE_ID,
  };

  useEffect(() => {
    if (!USER_ID || !WORKSPACE_ID || authLoading) return;
    loadConversations();
    loadTemplates();
    loadTeamMembers();
  }, [USER_ID, WORKSPACE_ID, authLoading]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (templateMenuRef.current && !templateMenuRef.current.contains(event.target as Node)) {
        setShowTemplateMenu(false);
      }
      if (assignMenuRef.current && !assignMenuRef.current.contains(event.target as Node)) {
        setShowAssignMenu(false);
      }
      if (stageMenuRef.current && !stageMenuRef.current.contains(event.target as Node)) {
        setShowStageMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useRealtime(WORKSPACE_ID, (event) => {
    const eventType = event.type;
    if (eventType === 'inbound_message' || eventType === 'outbound_message') {
      const conversationId = event.conversationId;
      const message = event.message;
      if (!conversationId || !message?.id) return;
      const conversation = conversations.find((c) => c.id === conversationId);
      const normalizedMessage = normalizeRealtimeMessage(
        message,
        conversation?.channel || selectedConversation?.channel || 'whatsapp'
      );

      setConversations((prev) => {
        const updated: Conversation[] = prev.map((c) =>
          c.id === conversationId
            ? {
                ...c,
                lastMessage: normalizedMessage.bodyText || c.lastMessage,
                lastMessageAt: normalizedMessage.createdAt,
              }
            : c
        );
        return updated.sort((a, b) =>
          new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime()
        );
      });

      if (selectedConversation?.id === conversationId) {
        setMessages((prev) =>
          prev.some((existing) => existing.id === normalizedMessage.id)
            ? prev
            : [...prev, normalizedMessage]
        );
      } else {
        playNotification();
        setConversations((prev) =>
          prev.map((c) =>
            c.id === conversationId ? { ...c, unreadCount: c.unreadCount + 1 } : c
          )
        );
      }

      if (eventType === 'inbound_message' && event.unreadCount !== undefined) {
        // unreadCount already handled above via increment, but if backend sends full count we can use it
      }
    }
  });

  function normalizeRealtimeMessage(message: RealtimeMessage, fallbackChannel: string): Message {
    return {
      id: message.id,
      bodyText: message.bodyText || '',
      direction: message.direction || 'inbound',
      type: message.type || 'text',
      channel: message.channel || fallbackChannel,
      createdAt: message.createdAt || new Date().toISOString(),
      sentByUserId: message.sentByUserId || null,
      sentByUser: message.sentByUser || null,
      readReceipts: message.readReceipts || [],
    };
  }

  const loadConversations = async () => {
    try {
      const params = new URLSearchParams();
      if (channelFilter !== 'all') params.set('channel', channelFilter);
      const data = await api.get<{ conversations: Conversation[] }>(`/inbox/conversations?${params}`, { headers });
      setConversations(data.conversations);
      if (data.conversations.length > 0 && !selectedConversation) {
        setSelectedConversation(data.conversations[0]);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const data = await api.get<{ templates: Template[] }>('/templates', { headers });
      setTemplates(data.templates);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const loadTeamMembers = async () => {
    try {
      const data = await api.get<{ workspace: { members: { user: { id: string; name: string; email: string } }[] } }>('/workspaces/current', { headers });
      const members = data.workspace.members.map((m) => ({
        id: m.user.id,
        name: m.user.name,
        email: m.user.email,
      }));
      setTeamMembers(members);
    } catch (error) {
      console.error('Failed to load team members:', error);
    }
  };

  const insertTemplate = (template: Template) => {
    let body = template.body;
    if (selectedConversation) {
      body = body.replace(/{name}/g, selectedConversation.name);
      body = body.replace(/{phone}/g, selectedConversation.phone);
      body = body.replace(/{date}/g, new Date().toLocaleDateString());
    }
    setNewMessage(body);
    setShowTemplateMenu(false);
  };

  const fetchSmartReplies = async () => {
    if (!selectedConversation || messages.length === 0) return;
    setLoadingSmartReplies(true);
    try {
      const lastMsg = messages[messages.length - 1];
      const res = await api.post<{ suggestions: string[] }>('/ai/smart-reply', {
        conversationId: selectedConversation.id,
        lastMessage: lastMsg.bodyText || '',
      }, { headers });
      setSmartReplies(res.suggestions || []);
    } catch {
      setSmartReplies([]);
    } finally {
      setLoadingSmartReplies(false);
    }
  };

  const applySmartReply = (reply: string) => {
    setNewMessage(reply);
    setSmartReplies([]);
  };

  const assignConversation = async (userId: string | null) => {
    if (!selectedConversation) return;
    try {
      await api.patch(`/inbox/conversations/${selectedConversation.id}/assign`, {
        assignedToId: userId,
      }, { headers });
      setConversations(prev => prev.map(c =>
        c.id === selectedConversation.id
          ? { ...c, assignedToId: userId, assignedTo: userId ? teamMembers.find(m => m.id === userId) || null : null }
          : c
      ));
      if (selectedConversation) {
        setSelectedConversation({
          ...selectedConversation,
          assignedToId: userId,
          assignedTo: userId ? teamMembers.find(m => m.id === userId) || null : null,
        });
      }
      setShowAssignMenu(false);
    } catch (error) {
      console.error('Failed to assign conversation:', error);
    }
  };

  const changeStage = async (stage: string) => {
    if (!selectedConversation) return;
    try {
      await api.patch(`/inbox/conversations/${selectedConversation.id}/stage`, { stage }, { headers });
      setConversations(prev => prev.map(c =>
        c.id === selectedConversation.id ? { ...c, stage } : c
      ));
      setSelectedConversation({ ...selectedConversation, stage });
      setShowStageMenu(false);
    } catch (error) {
      console.error('Failed to change stage:', error);
    }
  };

  const createFollowup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConversation) return;
    try {
      await api.post('/followups', {
        contactId: selectedConversation.contactId,
        dueAt: followupData.dueAt,
        note: followupData.note,
        assignedToId: USER_ID,
      }, { headers });
      setShowFollowupModal(false);
      setFollowupData({ dueAt: '', note: '' });
      addNotification({ type: 'success', title: 'Follow-up created successfully!' });
    } catch (error) {
      console.error('Failed to create followup:', error);
      addNotification({ type: 'error', title: 'Failed to create follow-up' });
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const data = await api.get<{ messages: Message[] }>(`/inbox/conversations/${conversationId}/messages`, { headers });
      setMessages(data.messages);
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c))
      );
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;
    setSending(true);
    try {
      await api.post('/messages/send', {
        conversationId: selectedConversation.id,
        text: newMessage,
      }, { headers });
      setNewMessage('');
      await loadMessages(selectedConversation.id);
    } catch (error) {
      console.error('Failed to send message:', error);
      addNotification({ type: 'error', title: 'Failed to send message' });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return formatTime(dateStr);
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      new: 'bg-blue-500/20 text-blue-400',
      followup: 'bg-yellow-500/20 text-yellow-400',
      negotiation: 'bg-purple-500/20 text-purple-400',
      won: 'bg-green-500/20 text-green-400',
      lost: 'bg-red-500/20 text-red-400',
    };
    return colors[stage] || 'bg-zinc-500/20 text-zinc-400';
  };

  const filteredConversations = conversations.filter((conversation) => {
    const matchesSearch =
      conversation.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conversation.phone.includes(searchQuery) ||
      conversation.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStage = stageFilter === 'all' || conversation.stage === stageFilter;
    const matchesChannel = channelFilter === 'all' || conversation.channel === channelFilter;
    return matchesSearch && matchesStage && matchesChannel;
  });

  // Count unread per channel
  const waUnread = conversations.filter(c => c.channel === 'whatsapp').reduce((sum, c) => sum + c.unreadCount, 0);
  const igUnread = conversations.filter(c => c.channel === 'instagram').reduce((sum, c) => sum + c.unreadCount, 0);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!user || !workspace) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-zinc-400">Please log in to view your inbox</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-80px)] gap-4">
      {/* Conversations List */}
      <div className="w-80 border-r border-zinc-800 bg-zinc-900/30 rounded-2xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white">Inbox</h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-colors ${showFilters ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800'}`}
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>

          {/* Channel Tabs */}
          <div className="flex gap-1 bg-zinc-800/50 rounded-xl p-1">
            {[
              { key: 'all', label: 'All', count: waUnread + igUnread },
              { key: 'whatsapp', label: 'WA', count: waUnread, icon: MessageSquare },
              { key: 'instagram', label: 'IG', count: igUnread, icon: Instagram },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setChannelFilter(tab.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  channelFilter === tab.key
                    ? tab.key === 'instagram'
                      ? 'bg-pink-500/20 text-pink-400'
                      : tab.key === 'whatsapp'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-white text-black'
                    : 'text-zinc-500 hover:text-white'
                }`}
              >
                {tab.icon && <tab.icon className="w-3 h-3" />}
                {tab.label}
                {tab.count > 0 && (
                  <span className="ml-0.5 px-1 py-0.5 bg-red-500 text-white text-[10px] rounded-full min-w-[14px] text-center">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-500 outline-none focus:border-zinc-600"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {showFilters && (
            <div className="flex flex-wrap gap-2">
              {['all', 'new', 'followup', 'negotiation', 'won', 'lost'].map((stage) => (
                <button
                  key={stage}
                  onClick={() => setStageFilter(stage)}
                  className={`px-2 py-1 text-xs rounded-lg transition-colors ${
                    stageFilter === stage
                      ? 'bg-white text-black'
                      : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {stage === 'all' ? 'All' : stage.charAt(0).toUpperCase() + stage.slice(1)}
                </button>
              ))}
            </div>
          )}

          <p className="text-sm text-zinc-500">
            {filteredConversations.length} of {conversations.length} conversations
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <p className="text-zinc-500 text-sm">No conversations found</p>
              {(searchQuery || stageFilter !== 'all' || channelFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStageFilter('all');
                    setChannelFilter('all');
                  }}
                  className="mt-2 text-sm text-blue-400 hover:text-blue-300"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <>
              {filteredConversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation)}
                  className={`w-full p-4 text-left border-b border-zinc-800/50 transition-colors ${
                    selectedConversation?.id === conversation.id
                      ? 'bg-zinc-800'
                      : 'hover:bg-zinc-800/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <ChannelDot channel={conversation.channel} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white truncate">
                            {conversation.name || 'Unknown'}
                          </span>
                          {conversation.unreadCount > 0 && (
                            <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full min-w-[18px] text-center">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-zinc-500 truncate mt-0.5">
                          {conversation.lastMessage || 'No messages yet'}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-zinc-600 whitespace-nowrap">
                      {formatDate(conversation.lastMessageAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2 ml-4">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${getStageColor(conversation.stage)}`}>
                      {conversation.stage}
                    </span>
                    {conversation.assignedTo && (
                      <span className="text-xs text-zinc-500">
                        {conversation.assignedTo.name}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Chat Area */}
      {selectedConversation ? (
        <div className="flex-1 flex flex-col bg-zinc-900/30 rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                selectedConversation.channel === 'instagram'
                  ? 'bg-pink-500/20'
                  : 'bg-emerald-500/20'
              }`}>
                {selectedConversation.channel === 'instagram' ? (
                  <Instagram className="w-5 h-5 text-pink-400" />
                ) : (
                  <MessageSquare className="w-5 h-5 text-emerald-400" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-white">{selectedConversation.name || 'Unknown'}</h3>
                  <ChannelBadge channel={selectedConversation.channel} showLabel />
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-500">
                  <Phone className="w-3 h-3" />
                  {selectedConversation.phone}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Stage Dropdown */}
              <div className="relative" ref={stageMenuRef}>
                <button
                  onClick={() => setShowStageMenu(!showStageMenu)}
                  className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded-full ${getStageColor(selectedConversation.stage)} hover:opacity-80 transition-opacity`}
                >
                  {selectedConversation.stage}
                  <ChevronDown className="w-3 h-3" />
                </button>
                {showStageMenu && (
                  <div className="absolute right-0 top-full mt-2 w-40 bg-zinc-900 border border-zinc-800 rounded-xl shadow-lg z-50 py-1">
                    {['new', 'followup', 'negotiation', 'won', 'lost'].map((stage) => (
                      <button
                        key={stage}
                        onClick={() => changeStage(stage)}
                        className={`w-full px-4 py-2 text-left text-sm capitalize hover:bg-zinc-800 transition-colors ${
                          selectedConversation.stage === stage ? 'text-white' : 'text-zinc-400'
                        }`}
                      >
                        {stage}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Assign Dropdown */}
              <div className="relative" ref={assignMenuRef}>
                <button
                  onClick={() => setShowAssignMenu(!showAssignMenu)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-zinc-800 text-zinc-300 text-xs rounded-full hover:bg-zinc-700 transition-colors"
                >
                  <UserPlus className="w-3 h-3" />
                  {selectedConversation.assignedTo ? selectedConversation.assignedTo.name : 'Unassigned'}
                  <ChevronDown className="w-3 h-3" />
                </button>
                {showAssignMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-lg z-50 py-1">
                    <button
                      onClick={() => assignConversation(null)}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-zinc-800 transition-colors ${
                        !selectedConversation.assignedToId ? 'text-white' : 'text-zinc-400'
                      }`}
                    >
                      Unassigned
                    </button>
                    {teamMembers.map((member) => (
                      <button
                        key={member.id}
                        onClick={() => assignConversation(member.id)}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-zinc-800 transition-colors ${
                          selectedConversation.assignedToId === member.id ? 'text-white' : 'text-zinc-400'
                        }`}
                      >
                        {member.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowFollowupModal(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-zinc-800 text-zinc-300 text-xs rounded-full hover:bg-zinc-700 transition-colors"
                title="Create follow-up"
              >
                <Clock className="w-3 h-3" />
                Follow-up
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => {
              const isOutbound = message.direction === 'outbound';
              const isIg = message.channel === 'instagram' || selectedConversation.channel === 'instagram';

              return (
                <div
                  key={message.id}
                  className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] px-4 py-2.5 rounded-2xl ${
                      isOutbound
                        ? isIg
                          ? 'bg-pink-500 text-white rounded-br-md'
                          : 'bg-emerald-600 text-white rounded-br-md'
                        : 'bg-zinc-800 text-white rounded-bl-md'
                    }`}
                  >
                    <p className="text-sm">{message.bodyText}</p>
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <span className="text-xs opacity-60">
                        {formatTime(message.createdAt)}
                      </span>
                      {isOutbound && (
                        message.readReceipts.length > 0 ? (
                          <CheckCheck className="w-3 h-3 opacity-60" />
                        ) : (
                          <Check className="w-3 h-3 opacity-60" />
                        )
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {typingUsers.length > 0 && (
              <div className="flex justify-start">
                <div className="bg-zinc-800 px-4 py-3 rounded-2xl rounded-bl-md">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-zinc-800">
            {smartReplies.length > 0 && (
              <div className="flex gap-2 px-4 py-2">
                {smartReplies.map((reply, i) => (
                  <button
                    key={i}
                    onClick={() => applySmartReply(reply)}
                    className="px-3 py-1.5 bg-purple-900/30 border border-purple-800/50 text-purple-300 rounded-full text-xs hover:bg-purple-900/50 transition-colors"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2 bg-zinc-800/50 rounded-2xl px-4 py-3">
              <div className="relative" ref={templateMenuRef}>
                <button
                  onClick={() => setShowTemplateMenu(!showTemplateMenu)}
                  className="p-2 text-zinc-400 hover:text-white transition-colors"
                  title="Use template"
                >
                  <FileText className="w-5 h-5" />
                </button>
                {showTemplateMenu && templates.length > 0 && (
                  <div className="absolute bottom-full left-0 mb-2 w-64 bg-zinc-900 border border-zinc-800 rounded-xl shadow-lg z-50 py-1 max-h-64 overflow-y-auto">
                    <div className="px-3 py-2 text-xs text-zinc-500 border-b border-zinc-800">
                      Quick Templates
                    </div>
                    {templates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => insertTemplate(template)}
                        className="w-full px-4 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
                      >
                        <div className="font-medium">{template.title}</div>
                        <div className="text-xs text-zinc-500 truncate">{template.body.slice(0, 50)}...</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <input
                type="text"
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  sendTyping();
                }}
                onKeyPress={handleKeyPress}
                placeholder={`Message via ${selectedConversation.channel === 'instagram' ? 'Instagram' : 'WhatsApp'}...`}
                className="flex-1 bg-transparent text-white placeholder-zinc-500 outline-none text-sm"
              />
              <button
                onClick={fetchSmartReplies}
                disabled={loadingSmartReplies || messages.length === 0}
                className="p-2 text-purple-400 hover:text-purple-300 transition-colors disabled:opacity-50"
                title="AI Smart Replies"
              >
                {loadingSmartReplies ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span className="text-lg">✨</span>
                )}
              </button>
              <button
                onClick={sendMessage}
                disabled={sending || !newMessage.trim()}
                className={`p-2 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  selectedConversation.channel === 'instagram'
                    ? 'bg-pink-500 text-white hover:bg-pink-600'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-zinc-900/30 rounded-2xl">
          <div className="text-center">
            <MessageSquare className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-500">Select a conversation to start chatting</p>
          </div>
        </div>
      )}

      {/* Follow-up Modal */}
      {showFollowupModal && selectedConversation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Create Follow-up</h2>
              <button
                onClick={() => setShowFollowupModal(false)}
                className="p-2 hover:bg-zinc-800 rounded-lg"
              >
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>
            <form onSubmit={createFollowup} className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Contact</label>
                <div className="px-4 py-2 bg-zinc-800 rounded-xl text-white flex items-center gap-2">
                  <ChannelDot channel={selectedConversation.channel} />
                  {selectedConversation.name || 'Unknown'} ({selectedConversation.phone})
                </div>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Due Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={followupData.dueAt}
                  onChange={(e) => setFollowupData({ ...followupData, dueAt: e.target.value })}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white outline-none focus:border-zinc-600"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Note</label>
                <textarea
                  value={followupData.note}
                  onChange={(e) => setFollowupData({ ...followupData, note: e.target.value })}
                  placeholder="What needs to be done?"
                  rows={3}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-600 outline-none focus:border-zinc-600 resize-none"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowFollowupModal(false)}
                  className="flex-1 px-4 py-2 bg-zinc-800 text-white rounded-xl hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-white text-black rounded-xl font-medium hover:bg-zinc-100 transition-colors"
                >
                  Create Follow-up
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
