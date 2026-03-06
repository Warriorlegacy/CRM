'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Phone, User, MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  phone: string;
  stage: string;
  tags: string;
  assignedToId: string | null;
  assignedTo: { id: string; name: string; email: string } | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

interface Conversation {
  id: string;
  contactId: string;
}

const STAGES = [
  { id: 'new', name: 'New', color: 'bg-blue-500' },
  { id: 'followup', name: 'Follow-up', color: 'bg-yellow-500' },
  { id: 'negotiation', name: 'Negotiation', color: 'bg-purple-500' },
  { id: 'won', name: 'Won', color: 'bg-green-500' },
  { id: 'lost', name: 'Lost', color: 'bg-red-500' },
];

export default function PipelinePage() {
  const { user, workspace, isLoading: authLoading } = useAuth();
  const USER_ID = user?.id || '';
  const WORKSPACE_ID = workspace?.id || '';
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedContact, setDraggedContact] = useState<Contact | null>(null);

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

  const handleDragStart = (contact: Contact) => {
    setDraggedContact(contact);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, stage: string) => {
    e.preventDefault();
    if (!draggedContact || draggedContact.stage === stage) return;

    try {
      // Find conversation for this contact
      const convoData = await api.get<{ conversations: Conversation[] }>('/inbox/conversations', { headers });
      const conversation = convoData.conversations.find(
        (c) => c.contactId === draggedContact.id
      );

      if (conversation) {
        await api.patch(`/inbox/conversations/${conversation.id}/stage`, { stage }, { headers });
        
        // Update local state
        setContacts((prev) =>
          prev.map((c) => (c.id === draggedContact.id ? { ...c, stage } : c))
        );
      }
    } catch (error) {
      console.error('Failed to update stage:', error);
    }
    setDraggedContact(null);
  };

  const getStageContacts = (stageId: string) => {
    return contacts.filter((c) => c.stage === stageId);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'No activity';
    const date = new Date(dateStr);
    const today = new Date();
    const daysDiff = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 0) return 'Today';
    if (daysDiff === 1) return 'Yesterday';
    if (daysDiff < 7) return `${daysDiff} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] overflow-x-auto">
      <div className="flex gap-4 min-w-max pb-4">
        {STAGES.map((stage) => {
          const stageContacts = getStageContacts(stage.id);
          
          return (
            <div
              key={stage.id}
              className="w-80 flex-shrink-0"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              {/* Stage Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${stage.color}`}></div>
                  <h3 className="font-semibold text-white">{stage.name}</h3>
                  <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-xs rounded-full">
                    {stageContacts.length}
                  </span>
                </div>
              </div>

              {/* Contacts List */}
              <div className="space-y-2 min-h-[200px]">
                {stageContacts.map((contact) => (
                  <div
                    key={contact.id}
                    draggable
                    onDragStart={() => handleDragStart(contact)}
                    className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl cursor-move hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                          <User className="w-5 h-5 text-zinc-400" />
                        </div>
                        <div>
                          <h4 className="font-medium text-white text-sm">{contact.name}</h4>
                          <div className="flex items-center gap-1 text-xs text-zinc-500">
                            <Phone className="w-3 h-3" />
                            {contact.phone}
                          </div>
                        </div>
                      </div>
                      <button className="p-1 hover:bg-zinc-800 rounded">
                        <MoreHorizontal className="w-4 h-4 text-zinc-500" />
                      </button>
                    </div>

                    {contact.tags && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {contact.tags.split(',').map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-xs rounded"
                          >
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-800">
                      <span className="text-xs text-zinc-500">
                        {formatDate(contact.lastMessageAt)}
                      </span>
                      {contact.assignedTo && (
                        <div className="flex items-center gap-1">
                          <div className="w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center text-xs text-zinc-300">
                            {contact.assignedTo.name.charAt(0)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {stageContacts.length === 0 && (
                  <div className="p-8 text-center border-2 border-dashed border-zinc-800 rounded-xl">
                    <p className="text-zinc-600 text-sm">Drop contacts here</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
