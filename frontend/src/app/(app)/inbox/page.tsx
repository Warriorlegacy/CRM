'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { useRealtime } from '@/hooks/useRealtime';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { useNotificationSound } from '@/hooks/useNotificationSound';
import { useAuth } from '@/contexts/AuthContext';
import { Send, User, Check, CheckCheck, Phone, Tag, MoreVertical, Loader2, MessageSquare, Search, Filter, X, FileText, ChevronDown, UserPlus, Clock } from 'lucide-react';

interface Conversation {
  id: string;
  contactId: string;
  name: string;
  phone: string;
  stage: string;
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
  const [showFilters, setShowFilters] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const [showAssignMenu, setShowAssignMenu] = useState(false);
  const [showStageMenu, setShowStageMenu] = useState(false);
  const [showFollowupModal, setShowFollowupModal] = useState(false);
  const [followupData, setFollowupData] = useState({ dueAt: '', note: '' });
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

  // Load conversations only when authenticated
  useEffect(() => {
    if (!USER_ID || !WORKSPACE_ID || authLoading) return;
    loadConversations();
    loadTemplates();
    loadTeamMembers();
  }, [USER_ID, WORKSPACE_ID, authLoading]);

  // Close menus when clicking outside
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

  // Load messages when conversation selected
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation?.id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Real-time events
  useRealtime(WORKSPACE_ID, (event) => {
    if (event.type === 'new_message') {
      const msg = event.data;
      
      // Update conversations list
      setConversations((prev) => {
        const updated = prev.map((c) =>
          c.id === msg.conversationId
            ? { ...c, lastMessage: msg.bodyText, lastMessageAt: msg.createdAt }
            : c
        );
        return updated.sort((a, b) => 
          new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime()
        );
      });

      // Add to current chat if open
      if (selectedConversation?.id === msg.conversationId) {
        setMessages((prev) => [...prev, msg]);
      } else {
        // Play sound for messages in other conversations
        playNotification();
        // Increment unread count
        setConversations((prev) =>
          prev.map((c) =>
            c.id === msg.conversationId ? { ...c, unreadCount: c.unreadCount + 1 } : c
          )
        );
      }
    }
  });

  const loadConversations = async () => {
    try {
      const data = await api.get('/inbox/conversations', { headers });
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
      const data = await api.get('/templates', { headers });
      setTemplates(data.templates);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const loadTeamMembers = async () => {
    try {
      const data = await api.get('/workspaces/current', { headers });
      const members = data.workspace.members.map((m: any) => ({
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
    // Replace variables with contact data
    if (selectedConversation) {
      body = body.replace(/{name}/g, selectedConversation.name);
      body = body.replace(/{phone}/g, selectedConversation.phone);
      body = body.replace(/{date}/g, new Date().toLocaleDateString());
    }
    setNewMessage(body);
    setShowTemplateMenu(false);
  };

  const assignConversation = async (userId: string | null) => {
    if (!selectedConversation) return;
    try {
      await api.patch(`/inbox/conversations/${selectedConversation.id}/assign`, {
        assignedToId: userId,
      }, { headers });
      // Update local state
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
      // Update local state
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
      alert('Follow-up created successfully!');
    } catch (error) {
      console.error('Failed to create followup:', error);
      alert('Failed to create follow-up');
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const data = await api.get(`/inbox/conversations/${conversationId}/messages`, { headers });
      setMessages(data.messages);
      // Reset unread count in UI
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
        contactId: selectedConversation.contactId,
        body: newMessage,
        type: 'text',
      }, { headers });
      
      setNewMessage('');
      // Reload messages to show the new one
      await loadMessages(selectedConversation.id);
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message');
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

  // Filter conversations
  const filteredConversations = conversations.filter((conversation) => {
    const matchesSearch = 
      conversation.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conversation.phone.includes(searchQuery) ||
      conversation.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStage = stageFilter === 'all' || conversation.stage === stageFilter;
    
    return matchesSearch && matchesStage;
  });

  if (authLoading) {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
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

          {/* Stage Filter */}
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
              {(searchQuery || stageFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStageFilter('all');
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
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white truncate">
                          {conversation.name}
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
                    <span className="text-xs text-zinc-600 whitespace-nowrap">
                      {formatDate(conversation.lastMessageAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
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
              <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                <User className="w-5 h-5 text-zinc-400" />
              </div>
              <div>
                <h3 className="font-medium text-white">{selectedConversation.name}</h3>
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

              {/* Follow-up Button */}
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
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.direction === 'outbound' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[70%] px-4 py-2.5 rounded-2xl ${
                    message.direction === 'outbound'
                      ? 'bg-white text-black rounded-br-md'
                      : 'bg-zinc-800 text-white rounded-bl-md'
                  }`}
                >
                  <p className="text-sm">{message.bodyText}</p>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <span className="text-xs opacity-60">
                      {formatTime(message.createdAt)}
                    </span>
                    {message.direction === 'outbound' && (
                      message.readReceipts.length > 0 ? (
                        <CheckCheck className="w-3 h-3 opacity-60" />
                      ) : (
                        <Check className="w-3 h-3 opacity-60" />
                      )
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Typing Indicator */}
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
            <div className="flex items-center gap-2 bg-zinc-800/50 rounded-2xl px-4 py-3">
              {/* Template Button */}
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
                {showTemplateMenu && templates.length === 0 && (
                  <div className="absolute bottom-full left-0 mb-2 w-64 bg-zinc-900 border border-zinc-800 rounded-xl shadow-lg z-50 p-4">
                    <p className="text-sm text-zinc-500">No templates yet</p>
                    <p className="text-xs text-zinc-600 mt-1">Create templates in the Templates page</p>
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
                placeholder="Type a message..."
                className="flex-1 bg-transparent text-white placeholder-zinc-500 outline-none text-sm"
              />
              <button
                onClick={sendMessage}
                disabled={sending || !newMessage.trim()}
                className="p-2 bg-white text-black rounded-xl hover:bg-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                <div className="px-4 py-2 bg-zinc-800 rounded-xl text-white">
                  {selectedConversation.name} ({selectedConversation.phone})
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
