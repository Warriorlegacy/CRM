'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { User, Phone, Search, Plus, Filter, MoreHorizontal, X, MessageSquare, Instagram, StickyNote, ChevronDown, Tag as TagIcon } from 'lucide-react';
import { ConversationTag } from '@/lib/types';
import ChannelBadge, { ChannelDot } from '@/components/ChannelBadge';

interface Contact {
  id: string;
  name: string | null;
  phone: string;
  email: string | null;
  igUsername: string | null;
  stage: string;
  tags: string;
  leadScore: number;
  channel: string;
  assignedToId: string | null;
  assignedTo: { id: string; name: string; email: string } | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

interface ContactNote {
  id: string;
  content: string;
  category: string;
  channel: string | null;
  createdAt: string;
}

const STAGE_COLORS: Record<string, string> = {
  new: 'bg-blue-500/20 text-blue-400',
  followup: 'bg-yellow-500/20 text-yellow-400',
  negotiation: 'bg-purple-500/20 text-purple-400',
  won: 'bg-green-500/20 text-green-400',
  lost: 'bg-red-500/20 text-red-400',
};

const LEAD_TEMP_COLORS: Record<string, string> = {
  very_hot: 'bg-red-500/20 text-red-400',
  hot: 'bg-orange-500/20 text-orange-400',
  warm: 'bg-yellow-500/20 text-yellow-400',
  cold: 'bg-blue-500/20 text-blue-400',
};

function getLeadTemp(score: number): string {
  if (score >= 51) return 'very_hot';
  if (score >= 26) return 'hot';
  if (score >= 11) return 'warm';
  return 'cold';
}

export default function ContactsPage() {
  const { user, workspace, isLoading: authLoading } = useAuth();
  const { addNotification } = useNotification();
  const USER_ID = user?.id || '';
  const WORKSPACE_ID = workspace?.id || '';
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [contactNotes, setContactNotes] = useState<ContactNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [newContact, setNewContact] = useState({
    name: '',
    phone: '',
    email: '',
    tags: '',
    igUsername: '',
    channel: 'whatsapp',
  });
  const [allTags, setAllTags] = useState<ConversationTag[]>([]);
  const [conversationTagMap, setConversationTagMap] = useState<Record<string, ConversationTag[]>>({});

  const headers = {
    'x-user-id': USER_ID,
    'x-workspace-id': WORKSPACE_ID,
  };

  useEffect(() => {
    if (!USER_ID || !WORKSPACE_ID || authLoading) return;
    loadContacts();
    loadAllTags();
  }, [USER_ID, WORKSPACE_ID, authLoading]);

  const loadContacts = async () => {
    try {
      const query = new URLSearchParams();
      if (searchQuery) query.set('search', searchQuery);
      if (stageFilter !== 'all') query.set('stage', stageFilter);

      const data = await api.get<{ contacts: Contact[] }>(`/contacts?${query}`, { headers });
      setContacts(data.contacts);
    } catch (error) {
      console.error('Failed to load contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllTags = async () => {
    try {
      const data = await api.get<{ tags: ConversationTag[] }>('/contacts/conversations/tags', { headers });
      setAllTags(data.tags || []);
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  };

  useEffect(() => {
    if (!USER_ID || !WORKSPACE_ID || authLoading) return;
    const timer = setTimeout(() => loadContacts(), 300);
    return () => clearTimeout(timer);
  }, [searchQuery, stageFilter, USER_ID, WORKSPACE_ID, authLoading]);

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/contacts', newContact, { headers });
      setShowAddModal(false);
      setNewContact({ name: '', phone: '', email: '', tags: '', igUsername: '', channel: 'whatsapp' });
      loadContacts();
    } catch (error) {
      console.error('Failed to add contact:', error);
      addNotification({ type: 'error', title: 'Failed to add contact' });
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;
    try {
      await api.delete(`/contacts/${contactId}`, { headers });
      loadContacts();
      if (selectedContact?.id === contactId) {
        setSelectedContact(null);
        setShowDetailPanel(false);
      }
    } catch (error) {
      console.error('Failed to delete contact:', error);
    }
  };

  const openDetailPanel = async (contact: Contact) => {
    setSelectedContact(contact);
    setShowDetailPanel(true);
    try {
      const notesData = await api.get<{ notes: ContactNote[] }>(`/contacts/${contact.id}/notes`, { headers });
      setContactNotes(notesData.notes);

      const convosData = await api.get<{ conversations: any[] }>(`/inbox/conversations`, { headers });
      const contactConvos = (convosData.conversations || []).filter((c: any) => c.contactId === contact.id);
      if (contactConvos.length > 0) {
        const firstConvo = contactConvos[0];
        setConversationTagMap(prev => ({
          ...prev,
          [contact.id]: (firstConvo.tags || []).map((t: any) => ({
            id: t.id,
            workspaceId: '',
            name: t.name,
            color: t.color,
            description: null,
            createdAt: '',
            updatedAt: '',
          })),
        }));
      } else {
        setConversationTagMap(prev => ({ ...prev, [contact.id]: [] }));
      }
    } catch (error) {
      console.error('Failed to load detail panel data:', error);
    }
  };

  const addNote = async () => {
    if (!selectedContact || !newNote.trim()) return;
    try {
      await api.post(`/contacts/${selectedContact.id}/notes`, {
        content: newNote,
        category: 'general',
      }, { headers });
      setNewNote('');
      const data = await api.get<{ notes: ContactNote[] }>(`/contacts/${selectedContact.id}/notes`, { headers });
      setContactNotes(data.notes);
    } catch (error) {
      console.error('Failed to add note:', error);
    }
  };

  const deleteNote = async (noteId: string) => {
    if (!selectedContact) return;
    try {
      await api.delete(`/contacts/${selectedContact.id}/notes/${noteId}`, { headers });
      setContactNotes(prev => prev.filter(n => n.id !== noteId));
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  const updateContactStage = async (stage: string) => {
    if (!selectedContact) return;
    try {
      await api.patch(`/contacts/${selectedContact.id}`, { stage }, { headers });
      setSelectedContact({ ...selectedContact, stage });
      setContacts(prev => prev.map(c => c.id === selectedContact.id ? { ...c, stage } : c));
    } catch (error) {
      console.error('Failed to update stage:', error);
    }
  };

  // Conversation tag assignment - finds or creates a conversation for this contact and assigns tag
  const assignConversationTag = async (tagId: string) => {
    if (!selectedContact) return;
    try {
      const conversationsData = await api.get<{ conversations: any[] }>(
        `/inbox/conversations`,
        { headers: { ...headers } }
      );

      const existingConvo = (conversationsData.conversations || []).find(
        (c: any) => c.contactId === selectedContact.id
      );

      if (!existingConvo) {
        addNotification({ type: 'error', title: 'No conversation found for this contact' });
        return;
      }

      await api.post(`/contacts/conversations/${existingConvo.id}/tags`, { tagId }, { headers });
      const tag = allTags.find((t) => t.id === tagId);
      addNotification({ type: 'success', title: `Tag "${tag?.name || tagId}" assigned` });
      setConversationTagMap(prev => ({
        ...prev,
        [selectedContact.id]: [...(prev[selectedContact.id] || []), { ...tag!, id: tagId, workspaceId: '', description: null, createdAt: '', updatedAt: '' }],
      }));
    } catch (error) {
      console.error('Failed to assign tag:', error);
      addNotification({ type: 'error', title: 'Failed to assign tag' });
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const filteredContacts = contacts.filter(c => {
    const matchesChannel = channelFilter === 'all' || c.channel === channelFilter;
    return matchesChannel;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-80px)] gap-4">
      {/* Main Contacts Table */}
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Contacts</h1>
            <p className="text-zinc-500">{filteredContacts.length} total contacts</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-xl font-medium hover:bg-zinc-100 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Contact
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search contacts by name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 outline-none focus:border-zinc-700"
            />
          </div>
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="px-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-xl text-white outline-none focus:border-zinc-700"
          >
            <option value="all">All Stages</option>
            <option value="new">New</option>
            <option value="followup">Follow-up</option>
            <option value="negotiation">Negotiation</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
          </select>
          <div className="flex gap-1 bg-zinc-900/50 border border-zinc-800 rounded-xl p-1">
            {['all', 'whatsapp', 'instagram'].map((ch) => (
              <button
                key={ch}
                onClick={() => setChannelFilter(ch)}
                className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                  channelFilter === ch
                    ? ch === 'instagram' ? 'bg-pink-500/20 text-pink-400' : ch === 'whatsapp' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white text-black'
                    : 'text-zinc-500 hover:text-white'
                }`}
              >
                {ch === 'all' ? 'All' : ch === 'whatsapp' ? 'WA' : 'IG'}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400">Contact</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400">Channel</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400">Stage</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400">Lead Score</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400">Tags</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400">Assigned To</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody>
              {filteredContacts.map((contact) => {
                const leadTemp = getLeadTemp(contact.leadScore);
                return (
                  <tr
                    key={contact.id}
                    onClick={() => openDetailPanel(contact)}
                    className="border-b border-zinc-800/50 hover:bg-zinc-800/30 cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                          <User className="w-5 h-5 text-zinc-400" />
                        </div>
                        <div>
                          <div className="font-medium text-white">{contact.name || 'Unknown'}</div>
                          <div className="flex items-center gap-1 text-sm text-zinc-500">
                            <Phone className="w-3 h-3" />
                            {contact.phone}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <ChannelBadge channel={contact.channel} showLabel />
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs rounded-full ${STAGE_COLORS[contact.stage] || 'bg-zinc-500/20 text-zinc-400'}`}>
                        {contact.stage}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-white">{contact.leadScore}</span>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${LEAD_TEMP_COLORS[leadTemp]}`}>
                          {leadTemp.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {contact.tags ? (
                          contact.tags.split(',').map((tag) => (
                            <span key={tag} className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-xs rounded">
                              {tag.trim()}
                            </span>
                          ))
                        ) : (
                          <span className="text-zinc-600 text-sm">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {contact.assignedTo ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-xs text-zinc-300">
                            {contact.assignedTo.name.charAt(0)}
                          </div>
                          <span className="text-sm text-zinc-300">{contact.assignedTo.name}</span>
                        </div>
                      ) : (
                        <span className="text-zinc-600 text-sm">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteContact(contact.id); }}
                        className="p-2 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredContacts.length === 0 && (
            <div className="p-12 text-center">
              <User className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <p className="text-zinc-500">No contacts found</p>
            </div>
          )}
        </div>
      </div>

      {/* Detail Side Panel */}
      {showDetailPanel && selectedContact && (
        <div className="w-96 border-l border-zinc-800 bg-zinc-900/30 rounded-2xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                selectedContact.channel === 'instagram' ? 'bg-pink-500/20' : 'bg-emerald-500/20'
              }`}>
                {selectedContact.channel === 'instagram' ? (
                  <Instagram className="w-5 h-5 text-pink-400" />
                ) : (
                  <MessageSquare className="w-5 h-5 text-emerald-400" />
                )}
              </div>
              <div>
                <h3 className="font-medium text-white">{selectedContact.name || 'Unknown'}</h3>
                <div className="flex items-center gap-2">
                  <ChannelBadge channel={selectedContact.channel} size="sm" />
                  <span className="text-xs text-zinc-500 font-mono">{selectedContact.phone}</span>
                </div>
              </div>
            </div>
            <button onClick={() => setShowDetailPanel(false)} className="text-zinc-500 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Lead Score */}
            <div className="p-4 bg-zinc-800/30 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-zinc-400">Lead Score</span>
                <span className={`px-2 py-0.5 text-xs rounded-full ${LEAD_TEMP_COLORS[getLeadTemp(selectedContact.leadScore)]}`}>
                  {getLeadTemp(selectedContact.leadScore).replace('_', ' ')}
                </span>
              </div>
              <div className="text-3xl font-bold text-white font-mono">{selectedContact.leadScore}</div>
              <div className="h-2 bg-zinc-700 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 via-yellow-500 to-red-500 rounded-full transition-all"
                  style={{ width: `${Math.min(selectedContact.leadScore / 60 * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Stage */}
            <div className="p-4 bg-zinc-800/30 rounded-xl">
              <span className="text-sm text-zinc-400 block mb-2">Pipeline Stage</span>
              <div className="flex flex-wrap gap-2">
                {['new', 'followup', 'negotiation', 'won', 'lost'].map((stage) => (
                  <button
                    key={stage}
                    onClick={() => updateContactStage(stage)}
                    className={`px-3 py-1 text-xs rounded-full transition-colors ${
                      selectedContact.stage === stage
                        ? STAGE_COLORS[stage]
                        : 'bg-zinc-800 text-zinc-500 hover:text-white'
                    }`}
                  >
                    {stage}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className="p-4 bg-zinc-800/30 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-zinc-400">Conversation Tags</span>
                {allTags.length > 0 && (
                  <span className="text-xs text-zinc-600">{allTags.length} tag types defined</span>
                )}
              </div>
              {(() => {
                const currentTags = conversationTagMap[selectedContact.id] || [];
                const available = allTags.filter((t) => !currentTags.find((ct) => ct.id === t.id));
                if (currentTags.length === 0 && available.length === 0) {
                  return <p className="text-xs text-zinc-600">No tags defined. Create tags via the Inbox panel.</p>;
                }
                return (
                  <>
                    {currentTags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {currentTags.map((tag) => (
                          <button
                            key={tag.id}
                            onClick={async () => {
                              try {
                                const convosData = await api.get<{ conversations: { id: string }[] }>(`/inbox/conversations`, { headers });
                                const contactConvos = convosData.conversations.filter((c: any) => c.contactId === selectedContact.id);
                                for (const c of contactConvos) {
                                  await api.delete(`/contacts/conversations/${c.id}/tags/${tag.id}`, { headers });
                                }
                                setConversationTagMap(prev => ({
                                  ...prev,
                                  [selectedContact.id]: (prev[selectedContact.id] || []).filter((t) => t.id !== tag.id),
                                }));
                              } catch (err) {
                                console.error('Failed to remove tag:', err);
                              }
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-lg hover:opacity-80 transition-opacity"
                            style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                          >
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                            {tag.name}
                            <X className="w-3 h-3 ml-0.5 opacity-60" />
                          </button>
                        ))}
                      </div>
                    )}
                    {currentTags.length === 0 && (
                      <p className="text-xs text-zinc-600 mb-2">No tags assigned to conversations yet.</p>
                    )}
                    {available.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        <span className="text-xs text-zinc-600 block w-full mb-1">Assign to conversation:</span>
                        {available.map((tag) => (
                          <button
                            key={tag.id}
                            onClick={() => assignConversationTag(tag.id)}
                            className="inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded-lg transition-colors border border-dashed hover:opacity-80"
                            style={{ color: tag.color, borderColor: `${tag.color}60`, backgroundColor: `${tag.color}15` }}
                          >
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                            {tag.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {/* Notes */}
            <div className="p-4 bg-zinc-800/30 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <StickyNote className="w-4 h-4 text-zinc-400" />
                <span className="text-sm text-zinc-400">Notes</span>
              </div>

              <div className="space-y-2 mb-3">
                {contactNotes.map((note) => (
                  <div key={note.id} className="p-3 bg-zinc-800 rounded-lg group">
                    <p className="text-sm text-zinc-300">{note.content}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-zinc-600">{formatDate(note.createdAt)}</span>
                      <button
                        onClick={() => deleteNote(note.id)}
                        className="text-xs text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                {contactNotes.length === 0 && (
                  <p className="text-xs text-zinc-600">No notes yet</p>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addNote()}
                  placeholder="Add a note..."
                  className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 outline-none"
                />
                <button
                  onClick={addNote}
                  disabled={!newNote.trim()}
                  className="px-3 py-2 bg-white text-black text-sm rounded-lg hover:bg-zinc-100 disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Info */}
            <div className="p-4 bg-zinc-800/30 rounded-xl space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Email</span>
                <span className="text-white">{selectedContact.email || '-'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Instagram</span>
                <span className="text-white">{selectedContact.igUsername || '-'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Last Activity</span>
                <span className="text-white">{formatDate(selectedContact.lastMessageAt)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Add Contact</h2>
            <form onSubmit={handleAddContact} className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Name</label>
                <input
                  type="text"
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white outline-none focus:border-zinc-600"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Channel</label>
                <div className="flex gap-2">
                  {['whatsapp', 'instagram'].map((ch) => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => setNewContact({ ...newContact, channel: ch })}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl border text-sm transition-colors ${
                        newContact.channel === ch
                          ? ch === 'instagram' ? 'border-pink-500 bg-pink-500/10 text-pink-400' : 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                          : 'border-zinc-700 text-zinc-400 hover:border-zinc-600'
                      }`}
                    >
                      {ch === 'instagram' ? <Instagram className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                      {ch.charAt(0).toUpperCase() + ch.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Phone</label>
                <input
                  type="tel"
                  required
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white outline-none focus:border-zinc-600"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Email (optional)</label>
                <input
                  type="email"
                  value={newContact.email}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white outline-none focus:border-zinc-600"
                />
              </div>
              {newContact.channel === 'instagram' && (
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Instagram Username</label>
                  <input
                    type="text"
                    value={newContact.igUsername}
                    onChange={(e) => setNewContact({ ...newContact, igUsername: e.target.value })}
                    placeholder="@username"
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white outline-none focus:border-zinc-600"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  value={newContact.tags}
                  onChange={(e) => setNewContact({ ...newContact, tags: e.target.value })}
                  placeholder="Hot, Warm, Cold"
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white outline-none focus:border-zinc-600"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 bg-zinc-800 text-white rounded-xl hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-white text-black rounded-xl font-medium hover:bg-zinc-100 transition-colors"
                >
                  Add Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
