'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { Bell, Check, Plus, Calendar, User, Phone, Clock, X } from 'lucide-react';

interface Followup {
  id: string;
  contactId: string;
  contact: { id: string; name: string; phone: string };
  dueAt: string;
  note: string | null;
  status: 'pending' | 'done';
  assignedToId: string | null;
  assignedTo: { id: string; name: string } | null;
  createdAt: string;
}

interface Contact {
  id: string;
  name: string;
  phone: string;
}

export default function FollowupsPage() {
  const { user, workspace, isLoading: authLoading } = useAuth();
  const { addNotification } = useNotification();
  const USER_ID = user?.id || '';
  const WORKSPACE_ID = workspace?.id || '';
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'done'>('all');
  const [newFollowup, setNewFollowup] = useState({
    contactId: '',
    dueAt: '',
    note: '',
  });

  const headers = {
    'x-user-id': USER_ID,
    'x-workspace-id': WORKSPACE_ID,
  };

  useEffect(() => {
    if (!USER_ID || !WORKSPACE_ID || authLoading) return;
    loadData();
  }, [USER_ID, WORKSPACE_ID, authLoading]);

  const loadData = async () => {
    try {
      const [followupsData, contactsData] = await Promise.all([
        api.get<{ followups: Followup[] }>('/followups', { headers }),
        api.get<{ contacts: Contact[] }>('/contacts', { headers }),
      ]);
      setFollowups(followupsData.followups);
      setContacts(contactsData.contacts);
    } catch (error) {
      console.error('Failed to load followups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFollowup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/followups', {
        ...newFollowup,
        assignedToId: USER_ID,
      }, { headers });
      setShowAddModal(false);
      setNewFollowup({ contactId: '', dueAt: '', note: '' });
      loadData();
    } catch (error) {
      console.error('Failed to add followup:', error);
      addNotification({ type: 'error', title: 'Failed to create follow-up' });
    }
  };

  const markAsDone = async (id: string) => {
    try {
      await api.patch(`/followups/${id}/done`, {}, { headers });
      loadData();
    } catch (error) {
      console.error('Failed to mark as done:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const isOverdue = (dateStr: string) => {
    return new Date(dateStr) < new Date();
  };

  const filteredFollowups = followups.filter(f => {
    if (filter === 'pending') return f.status === 'pending';
    if (filter === 'done') return f.status === 'done';
    return true;
  });

  const pendingCount = followups.filter(f => f.status === 'pending').length;
  const overdueCount = followups.filter(f => f.status === 'pending' && isOverdue(f.dueAt)).length;

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
          <h1 className="text-2xl font-bold text-white">Follow-ups</h1>
          <div className="flex items-center gap-4 mt-1">
            <p className="text-zinc-500">{followups.length} total reminders</p>
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-sm rounded-full">
                {pendingCount} pending
              </span>
            )}
            {overdueCount > 0 && (
              <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-sm rounded-full">
                {overdueCount} overdue
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-xl font-medium hover:bg-zinc-100 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Follow-up
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(['all', 'pending', 'done'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filter === tab
                ? 'bg-white text-black'
                : 'bg-zinc-900/50 text-zinc-400 hover:text-white'
              }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === 'pending' && pendingCount > 0 && (
              <span className="ml-2 px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Follow-ups List */}
      <div className="space-y-3">
        {filteredFollowups.length === 0 ? (
          <div className="p-12 text-center bg-zinc-900/30 rounded-2xl border border-zinc-800">
            <Bell className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-500">No follow-ups found</p>
            <p className="text-zinc-600 text-sm mt-1">
              {filter === 'all' ? 'Create your first follow-up reminder' : `No ${filter} follow-ups`}
            </p>
          </div>
        ) : (
          filteredFollowups.map((followup) => (
            <div
              key={followup.id}
              className={`p-4 bg-zinc-900/30 border rounded-2xl transition-colors ${followup.status === 'done'
                  ? 'border-zinc-800 opacity-60'
                  : isOverdue(followup.dueAt)
                    ? 'border-red-800/50 bg-red-900/10'
                    : 'border-zinc-800'
                }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                      <User className="w-5 h-5 text-zinc-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-white">{followup.contact.name}</h3>
                      <div className="flex items-center gap-1 text-sm text-zinc-500">
                        <Phone className="w-3 h-3" />
                        {followup.contact.phone}
                      </div>
                    </div>
                  </div>

                  {followup.note && (
                    <p className="text-zinc-300 mt-3 mb-3">{followup.note}</p>
                  )}

                  <div className="flex items-center gap-4 text-sm">
                    <div className={`flex items-center gap-1 ${followup.status === 'pending' && isOverdue(followup.dueAt)
                        ? 'text-red-400'
                        : 'text-zinc-400'
                      }`}>
                      <Clock className="w-4 h-4" />
                      {formatDate(followup.dueAt)}
                      {followup.status === 'pending' && isOverdue(followup.dueAt) && (
                        <span className="ml-2 text-red-400 font-medium">(Overdue)</span>
                      )}
                    </div>
                    {followup.assignedTo && (
                      <div className="flex items-center gap-1 text-zinc-500">
                        <User className="w-3 h-3" />
                        Assigned to {followup.assignedTo.name}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {followup.status === 'pending' ? (
                    <button
                      onClick={() => markAsDone(followup.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-sm hover:bg-green-500/30 transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      Mark Done
                    </button>
                  ) : (
                    <span className="flex items-center gap-1 px-3 py-1.5 bg-zinc-800 text-zinc-400 rounded-lg text-sm">
                      <Check className="w-4 h-4" />
                      Completed
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Add Follow-up</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-zinc-800 rounded-lg"
              >
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>
            <form onSubmit={handleAddFollowup} className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Contact</label>
                <select
                  required
                  value={newFollowup.contactId}
                  onChange={(e) => setNewFollowup({ ...newFollowup, contactId: e.target.value })}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white outline-none focus:border-zinc-600"
                >
                  <option value="">Select a contact</option>
                  {contacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.name} ({contact.phone})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Due Date & Time
                </label>
                <input
                  type="datetime-local"
                  required
                  value={newFollowup.dueAt}
                  onChange={(e) => setNewFollowup({ ...newFollowup, dueAt: e.target.value })}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white outline-none focus:border-zinc-600"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Note (optional)</label>
                <textarea
                  value={newFollowup.note}
                  onChange={(e) => setNewFollowup({ ...newFollowup, note: e.target.value })}
                  placeholder="What needs to be done?"
                  rows={3}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-600 outline-none focus:border-zinc-600 resize-none"
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
