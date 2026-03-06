'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { User, Phone, Search, Plus, Filter, MoreHorizontal } from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  stage: string;
  tags: string;
  assignedToId: string | null;
  assignedTo: { id: string; name: string; email: string } | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

const STAGE_COLORS: Record<string, string> = {
  new: 'bg-blue-500/20 text-blue-400',
  followup: 'bg-yellow-500/20 text-yellow-400',
  negotiation: 'bg-purple-500/20 text-purple-400',
  won: 'bg-green-500/20 text-green-400',
  lost: 'bg-red-500/20 text-red-400',
};

interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  stage: string;
  tags: string;
  assignedToId: string | null;
  assignedTo: { id: string; name: string; email: string } | null;
  lastMessageAt: string | null;
  unreadCount: number;
  notes?: string;
  company?: string;
  position?: string;
}

export default function ContactsPage() {
  const { user, workspace, isLoading: authLoading } = useAuth();
  const USER_ID = user?.id || '';
  const WORKSPACE_ID = workspace?.id || '';
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [newContact, setNewContact] = useState({ 
    name: '', 
    phone: '', 
    email: '', 
    tags: '',
    notes: '',
    company: '',
    position: ''
  });

  const headers = {
    'x-user-id': USER_ID,
    'x-workspace-id': WORKSPACE_ID,
  };

  useEffect(() => {
    if (!USER_ID || !WORKSPACE_ID || authLoading) return;
    loadContacts();
  }, [USER_ID, WORKSPACE_ID, authLoading]);

  const loadContacts = async () => {
    try {
      const data = await api.get<{ contacts: Contact[] }>('/contacts', { headers });
      setContacts(data.contacts);
    } catch (error) {
      console.error('Failed to load contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/contacts', newContact, { headers });
      setShowAddModal(false);
      setNewContact({ name: '', phone: '', email: '', tags: '', notes: '', company: '', position: '' });
      loadContacts();
    } catch (error) {
      console.error('Failed to add contact:', error);
      alert('Failed to add contact');
    }
  };

  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
  );

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Contacts</h1>
          <p className="text-zinc-500">{contacts.length} total contacts</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-xl font-medium hover:bg-zinc-100 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Contact
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 outline-none focus:border-zinc-700"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors">
          <Filter className="w-4 h-4" />
          Filter
        </button>
      </div>

      {/* Contacts Table */}
      <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400">Contact</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400">Stage</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400">Tags</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400">Assigned To</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400">Last Activity</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody>
            {filteredContacts.map((contact) => (
              <tr key={contact.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                      <User className="w-5 h-5 text-zinc-400" />
                    </div>
                    <div>
                      <div className="font-medium text-white">{contact.name}</div>
                      <div className="flex items-center gap-1 text-sm text-zinc-500">
                        <Phone className="w-3 h-3" />
                        {contact.phone}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 text-xs rounded-full ${STAGE_COLORS[contact.stage] || 'bg-zinc-500/20 text-zinc-400'}`}>
                    {contact.stage}
                  </span>
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
                <td className="px-6 py-4 text-sm text-zinc-400">
                  {formatDate(contact.lastMessageAt)}
                </td>
                <td className="px-6 py-4">
                  <button className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
                    <MoreHorizontal className="w-4 h-4 text-zinc-400" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredContacts.length === 0 && (
          <div className="p-12 text-center">
            <User className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-500">No contacts found</p>
          </div>
        )}
      </div>

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
                  required
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white outline-none focus:border-zinc-600"
                />
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
