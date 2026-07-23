'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Phone, User, Plus, DollarSign, Award, X } from 'lucide-react';

interface Stage {
  id: string;
  name: string;
  order: number;
  color: string;
  probability: number;
}

interface Deal {
  id: string;
  title: string;
  value: number;
  currency: string;
  stageId: string;
  status: string;
  lostReason?: string;
  contact: { id: string; name: string; phone: string; email: string };
}

interface Contact {
  id: string;
  name: string;
  phone: string;
  stage: string;
}

export default function PipelinePage() {
  const { user, workspace, isLoading: authLoading } = useAuth();
  const [stages, setStages] = useState<Stage[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedDeal, setDraggedDeal] = useState<Deal | null>(null);

  // New Deal modal state
  const [showAddDeal, setShowAddDeal] = useState(false);
  const [newDeal, setNewDeal] = useState({ contactId: '', title: '', value: 1000, stageId: '' });

  useEffect(() => {
    if (authLoading) return;
    loadPipelineData();
  }, [authLoading]);

  const loadPipelineData = async () => {
    try {
      const [stageRes, dealRes, contactRes] = await Promise.all([
        api.get<{ stages: Stage[] }>('/deals/stages'),
        api.get<{ stages: (Stage & { deals: Deal[] })[] }>('/deals'),
        api.get<{ contacts: Contact[] }>('/contacts'),
      ]);

      const loadedStages = Array.isArray(stageRes?.stages) ? stageRes.stages : [];
      const loadedDealsGroup = Array.isArray(dealRes?.stages) ? dealRes.stages : [];
      const loadedContacts = Array.isArray(contactRes?.contacts) ? contactRes.contacts : [];

      setStages(loadedStages);
      setContacts(loadedContacts);

      const allDeals: Deal[] = [];
      loadedStages.forEach(st => {
        const found = loadedDealsGroup.find(s => s.id === st.id);
        if (found && Array.isArray(found.deals)) {
          allDeals.push(...found.deals);
        }
      });
      setDeals(allDeals);
      if (loadedStages.length > 0) {
        setNewDeal(prev => ({ ...prev, stageId: loadedStages[0].id }));
      }
    } catch (error) {
      console.error('Failed to load pipeline data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (deal: Deal) => {
    setDraggedDeal(deal);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStageId: string) => {
    e.preventDefault();
    if (!draggedDeal || draggedDeal.stageId === targetStageId) return;

    try {
      setDeals(prev =>
        prev.map(d => (d.id === draggedDeal.id ? { ...d, stageId: targetStageId } : d))
      );
      await api.patch(`/deals/${draggedDeal.id}/stage`, { stageId: targetStageId });
    } catch (error) {
      console.error('Failed to update deal stage:', error);
      loadPipelineData();
    }
    setDraggedDeal(null);
  };

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeal.contactId || !newDeal.title || !newDeal.stageId) return;

    try {
      await api.post('/deals', newDeal);
      setShowAddDeal(false);
      setNewDeal({ contactId: '', title: '', value: 1000, stageId: stages[0]?.id || '' });
      loadPipelineData();
    } catch (err) {
      console.error('Failed to create deal:', err);
    }
  };

  const totalValue = deals.reduce((acc, d) => acc + (d.value || 0), 0);
  const wonValue = deals.filter(d => d.status === 'won').reduce((acc, d) => acc + (d.value || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 h-[calc(100vh-80px)] overflow-x-auto">
      {/* Metrics Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl">
        <div className="flex items-center gap-6">
          <div>
            <span className="text-xs text-zinc-400">Total Pipeline Value</span>
            <div className="text-xl font-bold text-white flex items-center gap-1">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              {totalValue.toLocaleString()}
            </div>
          </div>
          <div className="h-8 w-px bg-zinc-800" />
          <div>
            <span className="text-xs text-zinc-400">Won Revenue</span>
            <div className="text-xl font-bold text-emerald-400 flex items-center gap-1">
              <Award className="w-5 h-5 text-emerald-400" />
              {wonValue.toLocaleString()}
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowAddDeal(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg flex items-center gap-2 text-sm transition"
        >
          <Plus className="w-4 h-4" />
          New Opportunity
        </button>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 min-w-max pb-4">
        {stages.map(stage => {
          const stageDeals = deals.filter(d => d.stageId === stage.id);
          const stageValue = stageDeals.reduce((acc, d) => acc + (d.value || 0), 0);

          return (
            <div
              key={stage.id}
              className="w-80 flex-shrink-0"
              onDragOver={handleDragOver}
              onDrop={e => handleDrop(e, stage.id)}
            >
              <div className="flex items-center justify-between mb-3 bg-zinc-900/80 p-3 rounded-lg border border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color }} />
                  <h3 className="font-semibold text-white text-sm">{stage.name}</h3>
                  <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-xs rounded-full">
                    {stageDeals.length}
                  </span>
                </div>
                <span className="text-xs text-emerald-400 font-mono">${stageValue.toLocaleString()}</span>
              </div>

              <div className="space-y-3 min-h-[300px]">
                {stageDeals.map(deal => (
                  <div
                    key={deal.id}
                    draggable
                    onDragStart={() => handleDragStart(deal)}
                    className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl cursor-move hover:border-indigo-500/50 transition"
                  >
                    <div className="flex items-start justify-between">
                      <h4 className="font-medium text-white text-sm">{deal.title}</h4>
                      <span className="text-xs text-emerald-400 font-mono font-semibold">
                        ${deal.value.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-3 text-xs text-zinc-400">
                      <User className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{deal.contact?.name || 'Unassigned Contact'}</span>
                    </div>
                    {deal.contact?.phone && (
                      <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
                        <Phone className="w-3.5 h-3.5" />
                        <span>{deal.contact.phone}</span>
                      </div>
                    )}
                  </div>
                ))}

                {stageDeals.length === 0 && (
                  <div className="p-8 text-center border-2 border-dashed border-zinc-800/80 rounded-xl">
                    <p className="text-zinc-600 text-xs">Drop opportunities here</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Deal Modal */}
      {showAddDeal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-lg font-bold text-white">Create New Opportunity</h3>
              <button onClick={() => setShowAddDeal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDeal} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Opportunity Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Enterprise Software License"
                  value={newDeal.title}
                  onChange={e => setNewDeal({ ...newDeal, title: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Target Contact</label>
                <select
                  required
                  value={newDeal.contactId}
                  onChange={e => setNewDeal({ ...newDeal, contactId: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Select a contact...</option>
                  {contacts.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name || c.phone} ({c.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Estimated Deal Value ($)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={newDeal.value}
                  onChange={e => setNewDeal({ ...newDeal, value: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Initial Stage</label>
                <select
                  value={newDeal.stageId}
                  onChange={e => setNewDeal({ ...newDeal, stageId: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  {stages.map(st => (
                    <option key={st.id} value={st.id}>
                      {st.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddDeal(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg"
                >
                  Create Opportunity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
