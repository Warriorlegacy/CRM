'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  Bot, Plus, Trash2, Power, PowerOff, Save, X, MessageSquare, HelpCircle,
  GitBranch, Zap, Flag, Circle, ChevronDown, Loader2, Instagram
} from 'lucide-react';

interface FlowNode {
  id: string;
  type: 'start' | 'message' | 'question' | 'condition' | 'action' | 'end';
  label?: string;
  content?: string;
  positionX: number;
  positionY: number;
  config?: string;
}

interface FlowEdge {
  id: string;
  sourceId: string;
  targetId: string;
  label?: string;
  condition?: string;
}

interface ChatbotFlow {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  trigger: string;
  triggerKeyword?: string;
  channels: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  _count?: { nodes: number; edges: number; executions: number };
}

const NODE_TYPES = [
  { type: 'message', label: 'Message', icon: MessageSquare, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { type: 'question', label: 'Question', icon: HelpCircle, color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  { type: 'condition', label: 'Condition', icon: GitBranch, color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  { type: 'action', label: 'Action', icon: Zap, color: 'bg-red-500/20 text-red-400 border-red-500/30' },
];

export default function ChatbotPage() {
  const { user, workspace, isLoading: authLoading } = useAuth();
  const USER_ID = user?.id || '';
  const WORKSPACE_ID = workspace?.id || '';
  const [flows, setFlows] = useState<ChatbotFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFlow, setSelectedFlow] = useState<ChatbotFlow | null>(null);
  const [editingFlow, setEditingFlow] = useState<ChatbotFlow | null>(null);
  const [showNewFlow, setShowNewFlow] = useState(false);
  const [newFlowName, setNewFlowName] = useState('');
  const [newFlowDesc, setNewFlowDesc] = useState('');
  const [newFlowTrigger, setNewFlowTrigger] = useState('keyword');
  const [newFlowKeyword, setNewFlowKeyword] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const headers = {
    'x-user-id': USER_ID,
    'x-workspace-id': WORKSPACE_ID,
  };

  useEffect(() => {
    if (!USER_ID || !WORKSPACE_ID || authLoading) return;
    loadFlows();
  }, [USER_ID, WORKSPACE_ID, authLoading]);

  const loadFlows = async () => {
    try {
      const data = await api.get<{ flows: ChatbotFlow[] }>('/chatbot-flows', { headers });
      setFlows(Array.isArray(data?.flows) ? data.flows : []);
    } catch (error) {
      console.error('Failed to load flows:', error);
      setFlows([]);
    } finally {
      setLoading(false);
    }
  };

  const createFlow = async () => {
    if (!newFlowName) return;
    setSaving(true);
    try {
      const startId = crypto.randomUUID();
      const msgId = crypto.randomUUID();
      const endId = crypto.randomUUID();

      const data = await api.post<{ flow: ChatbotFlow }>('/chatbot-flows', {
        name: newFlowName,
        description: newFlowDesc,
        trigger: newFlowTrigger,
        triggerKeyword: newFlowKeyword || undefined,
        channels: 'whatsapp,instagram',
        nodes: [
          { id: startId, type: 'start', label: 'Start', positionX: 250, positionY: 50 },
          { id: msgId, type: 'message', content: 'Hello! How can I help you today?', positionX: 250, positionY: 200 },
          { id: endId, type: 'end', label: 'End', positionX: 250, positionY: 350 },
        ],
        edges: [
          { id: crypto.randomUUID(), sourceId: startId, targetId: msgId },
          { id: crypto.randomUUID(), sourceId: msgId, targetId: endId },
        ],
      }, { headers });

      setFlows(prev => [data.flow, ...prev]);
      setShowNewFlow(false);
      setNewFlowName('');
      setNewFlowDesc('');
      setNewFlowKeyword('');
      setSelectedFlow(data.flow);
    } catch (error) {
      console.error('Failed to create flow:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleFlow = async (flowId: string) => {
    try {
      const data = await api.patch<{ isActive: boolean }>(`/chatbot-flows/${flowId}/toggle`, {}, { headers });
      setFlows(prev => prev.map(f => f.id === flowId ? { ...f, isActive: data.isActive } : f));
      if (selectedFlow?.id === flowId) {
        setSelectedFlow(prev => prev ? { ...prev, isActive: data.isActive } : null);
      }
    } catch (error) {
      console.error('Failed to toggle flow:', error);
    }
  };

  const deleteFlow = async (flowId: string) => {
    if (!confirm('Delete this flow?')) return;
    try {
      await api.delete(`/chatbot-flows/${flowId}`, { headers });
      setFlows(prev => prev.filter(f => f.id !== flowId));
      if (selectedFlow?.id === flowId) setSelectedFlow(null);
    } catch (error) {
      console.error('Failed to delete flow:', error);
    }
  };

  const addNode = (type: FlowNode['type']) => {
    if (!editingFlow) return;
    const newNode: FlowNode = {
      id: crypto.randomUUID(),
      type,
      content: type === 'message' ? 'Hello!' : type === 'question' ? 'What can I help you with?' : '',
      label: type.charAt(0).toUpperCase() + type.slice(1),
      positionX: 250,
      positionY: (editingFlow.nodes.length) * 150 + 50,
    };

    const updated = {
      ...editingFlow,
      nodes: [...editingFlow.nodes, newNode],
    };
    setEditingFlow(updated);
    setSelectedNode(newNode);
  };

  const updateNode = (nodeId: string, updates: Partial<FlowNode>) => {
    if (!editingFlow) return;
    const updatedNodes = editingFlow.nodes.map(n =>
      n.id === nodeId ? { ...n, ...updates } : n
    );
    setEditingFlow({ ...editingFlow, nodes: updatedNodes });
    if (selectedNode?.id === nodeId) {
      setSelectedNode({ ...selectedNode, ...updates });
    }
  };

  const deleteNode = (nodeId: string) => {
    if (!editingFlow) return;
    setEditingFlow({
      ...editingFlow,
      nodes: editingFlow.nodes.filter(n => n.id !== nodeId),
      edges: editingFlow.edges.filter(e => e.sourceId !== nodeId && e.targetId !== nodeId),
    });
    if (selectedNode?.id === nodeId) setSelectedNode(null);
  };

  const connectNodes = (sourceId: string, targetId: string, label?: string) => {
    if (!editingFlow) return;
    const newEdge: FlowEdge = {
      id: crypto.randomUUID(),
      sourceId,
      targetId,
      label,
    };
    setEditingFlow({
      ...editingFlow,
      edges: [...editingFlow.edges, newEdge],
    });
  };

  const removeEdge = (edgeId: string) => {
    if (!editingFlow) return;
    setEditingFlow({
      ...editingFlow,
      edges: editingFlow.edges.filter(e => e.id !== edgeId),
    });
  };

  const saveFlow = async () => {
    if (!editingFlow) return;
    setSaving(true);
    try {
      const data = await api.patch<{ flow: ChatbotFlow }>(`/chatbot-flows/${editingFlow.id}`, {
        nodes: editingFlow.nodes,
        edges: editingFlow.edges,
      }, { headers });

      setFlows(prev => prev.map(f => f.id === data.flow.id ? data.flow : f));
      setSelectedFlow(data.flow);
      setEditingFlow(null);
    } catch (error) {
      console.error('Failed to save flow:', error);
    } finally {
      setSaving(false);
    }
  };

  const getNodeTypeConfig = (type: string) => {
    return NODE_TYPES.find(t => t.type === type) || NODE_TYPES[0];
  };

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-80px)] gap-4">
      {/* Flow List */}
      <div className="w-80 border-r border-zinc-800 bg-zinc-900/30 rounded-2xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-zinc-800">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-white">Chatbot Flows</h2>
            <button
              onClick={() => setShowNewFlow(true)}
              className="p-2 bg-white text-black rounded-lg hover:bg-zinc-100 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-zinc-500">{flows.length} flows</p>
        </div>

        {showNewFlow && (
          <div className="p-4 border-b border-zinc-800 space-y-3 bg-zinc-800/30">
            <input
              type="text"
              value={newFlowName}
              onChange={(e) => setNewFlowName(e.target.value)}
              placeholder="Flow name"
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 outline-none"
            />
            <input
              type="text"
              value={newFlowDesc}
              onChange={(e) => setNewFlowDesc(e.target.value)}
              placeholder="Description (optional)"
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 outline-none"
            />
            <select
              value={newFlowTrigger}
              onChange={(e) => setNewFlowTrigger(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white outline-none"
            >
              <option value="keyword">Keyword</option>
              <option value="new_contact">New Contact</option>
              <option value="new_ig_contact">New Instagram Contact</option>
            </select>
            {newFlowTrigger === 'keyword' && (
              <input
                type="text"
                value={newFlowKeyword}
                onChange={(e) => setNewFlowKeyword(e.target.value)}
                placeholder="Trigger keyword"
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 outline-none"
              />
            )}
            <div className="flex gap-2">
              <button
                onClick={() => setShowNewFlow(false)}
                className="flex-1 px-3 py-2 bg-zinc-800 text-zinc-300 rounded-lg text-sm hover:bg-zinc-700"
              >
                Cancel
              </button>
              <button
                onClick={createFlow}
                disabled={!newFlowName || saving}
                className="flex-1 px-3 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-zinc-100 disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {(!flows || flows.length === 0) ? (
            <div className="p-8 text-center">
              <Bot className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <p className="text-zinc-500 text-sm">No flows yet</p>
              <p className="text-xs text-zinc-600 mt-1">Create your first chatbot flow</p>
            </div>
          ) : (
            flows.map((flow) => (
              <div
                key={flow.id}
                onClick={() => { setSelectedFlow(flow); setEditingFlow(null); setSelectedNode(null); }}
                className={`p-4 border-b border-zinc-800/50 cursor-pointer transition-colors ${
                  selectedFlow?.id === flow.id ? 'bg-zinc-800' : 'hover:bg-zinc-800/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-zinc-400" />
                    <span className="font-medium text-white text-sm">{flow.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFlow(flow.id); }}
                      className={`p-1 rounded transition-colors ${flow.isActive ? 'text-green-400 hover:bg-green-500/20' : 'text-zinc-500 hover:bg-zinc-800'}`}
                    >
                      {flow.isActive ? <Power className="w-3.5 h-3.5" /> : <PowerOff className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteFlow(flow.id); }}
                      className="p-1 text-zinc-500 hover:text-red-400 hover:bg-red-500/20 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {flow.description && (
                  <p className="text-xs text-zinc-500 mt-1">{flow.description}</p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-2 py-0.5 text-xs rounded-full ${flow.isActive ? 'bg-green-500/20 text-green-400' : 'bg-zinc-700 text-zinc-400'}`}>
                    {flow.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span className="text-xs text-zinc-600">{flow._count?.nodes || 0} nodes</span>
                  <span className="text-xs text-zinc-600 capitalize">{flow.trigger}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Canvas / Editor */}
      <div className="flex-1 flex flex-col bg-zinc-900/30 rounded-2xl overflow-hidden">
        {editingFlow ? (
          <>
            {/* Editor Header */}
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={editingFlow.name}
                  onChange={(e) => setEditingFlow({ ...editingFlow, name: e.target.value })}
                  className="bg-transparent text-white font-semibold text-lg outline-none border-b border-transparent hover:border-zinc-700 focus:border-white transition-colors"
                />
                <span className="text-sm text-zinc-500">{editingFlow.nodes.length} nodes</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setEditingFlow(null); setSelectedNode(null); }}
                  className="px-3 py-1.5 bg-zinc-800 text-zinc-300 text-sm rounded-lg hover:bg-zinc-700"
                >
                  Cancel
                </button>
                <button
                  onClick={saveFlow}
                  disabled={saving}
                  className="px-3 py-1.5 bg-white text-black text-sm font-medium rounded-lg hover:bg-zinc-100 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Flow'}
                </button>
              </div>
            </div>

            <div className="flex-1 flex">
              {/* Node Palette */}
              <div className="w-48 border-r border-zinc-800 p-3 space-y-2">
                <p className="text-xs text-zinc-500 mb-2">Add Node</p>
                {NODE_TYPES.map((nt) => (
                  <button
                    key={nt.type}
                    onClick={() => addNode(nt.type as FlowNode['type'])}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors hover:opacity-80 ${nt.color}`}
                  >
                    <nt.icon className="w-4 h-4" />
                    {nt.label}
                  </button>
                ))}

                {/* Connect mode hint */}
                <div className="mt-4 p-3 bg-zinc-800/50 rounded-lg">
                  <p className="text-xs text-zinc-500">Click nodes in the canvas to edit. Use the connect dropdown to link nodes.</p>
                </div>
              </div>

              {/* Canvas */}
              <div className="flex-1 relative overflow-auto" ref={canvasRef}>
                <div className="absolute inset-0 p-8">
                  {/* Nodes */}
                  <div className="space-y-4">
                    {editingFlow.nodes.map((node, index) => {
                      const config = getNodeTypeConfig(node.type);
                      const isSelected = selectedNode?.id === node.id;

                      return (
                        <div key={node.id} className="flex items-center gap-4">
                          {/* Connection line */}
                          {index > 0 && (
                            <div className="w-px h-8 bg-zinc-700 ml-8" />
                          )}

                          <div
                            onClick={() => setSelectedNode(node)}
                            className={`flex-1 max-w-md p-4 rounded-xl border-2 cursor-pointer transition-all ${
                              isSelected
                                ? 'border-white shadow-lg shadow-white/10'
                                : `border-zinc-800 hover:border-zinc-700 ${config.color}`
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <config.icon className="w-4 h-4" />
                                <span className="text-sm font-medium text-white capitalize">{node.type}</span>
                              </div>
                              {node.type !== 'start' && node.type !== 'end' && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); deleteNode(node.id); }}
                                  className="p-1 text-zinc-500 hover:text-red-400 rounded"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                            {node.content && (
                              <p className="text-sm text-zinc-300 truncate">{node.content}</p>
                            )}

                            {/* Show connected edges */}
                            {editingFlow.edges.filter(e => e.sourceId === node.id).map(edge => {
                              const targetNode = editingFlow.nodes.find(n => n.id === edge.targetId);
                              return (
                                <div key={edge.id} className="flex items-center gap-1 mt-2 text-xs text-zinc-500">
                                  <span>→</span>
                                  <span>{targetNode?.type || 'unknown'}</span>
                                  {edge.label && <span className="text-zinc-600">({edge.label})</span>}
                                  <button
                                    onClick={(e) => { e.stopPropagation(); removeEdge(edge.id); }}
                                    className="ml-1 text-zinc-600 hover:text-red-400"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Properties Panel */}
              {selectedNode && (
                <div className="w-72 border-l border-zinc-800 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-white">Node Properties</h3>
                    <button onClick={() => setSelectedNode(null)} className="text-zinc-500 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Type</label>
                    <div className="px-3 py-2 bg-zinc-800 rounded-lg text-sm text-white capitalize">
                      {selectedNode.type}
                    </div>
                  </div>

                  {(selectedNode.type === 'message' || selectedNode.type === 'question') && (
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">Message Content</label>
                      <textarea
                        value={selectedNode.content || ''}
                        onChange={(e) => updateNode(selectedNode.id, { content: e.target.value })}
                        rows={4}
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 outline-none resize-none"
                        placeholder="Use {name}, {phone}, {channel} for variables"
                      />
                    </div>
                  )}

                  {selectedNode.type === 'question' && (
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">Quick Reply Options</label>
                      <p className="text-xs text-zinc-600 mb-2">Add options as comma-separated values</p>
                      <input
                        type="text"
                        defaultValue={
                          selectedNode.config ? (() => {
                            try { return JSON.parse(selectedNode.config).options?.map((o: any) => o.label).join(', ') || ''; } catch { return ''; }
                          })() : ''
                        }
                        onBlur={(e) => {
                          const options = e.target.value.split(',').map(s => s.trim()).filter(Boolean).map(label => ({ label }));
                          updateNode(selectedNode.id, { config: JSON.stringify({ options }) });
                        }}
                        placeholder="Yes, No, Maybe"
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 outline-none"
                      />
                    </div>
                  )}

                  {selectedNode.type === 'condition' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">Field</label>
                        <select
                          defaultValue={
                            selectedNode.config ? (() => {
                              try { return JSON.parse(selectedNode.config).field || ''; } catch { return ''; }
                            })() : ''
                          }
                          onChange={(e) => {
                            const existing = selectedNode.config ? JSON.parse(selectedNode.config || '{}') : {};
                            updateNode(selectedNode.id, { config: JSON.stringify({ ...existing, field: e.target.value }) });
                          }}
                          className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white outline-none"
                        >
                          <option value="">Select field</option>
                          <option value="channel">Channel</option>
                          <option value="answer:last">Last Answer</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">Operator</label>
                        <select
                          defaultValue={
                            selectedNode.config ? (() => {
                              try { return JSON.parse(selectedNode.config).operator || ''; } catch { return ''; }
                            })() : ''
                          }
                          onChange={(e) => {
                            const existing = selectedNode.config ? JSON.parse(selectedNode.config || '{}') : {};
                            updateNode(selectedNode.id, { config: JSON.stringify({ ...existing, operator: e.target.value }) });
                          }}
                          className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white outline-none"
                        >
                          <option value="equals">Equals</option>
                          <option value="contains">Contains</option>
                          <option value="not_empty">Not Empty</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">Value</label>
                        <input
                          type="text"
                          defaultValue={
                            selectedNode.config ? (() => {
                              try { return JSON.parse(selectedNode.config).value || ''; } catch { return ''; }
                            })() : ''
                          }
                          onBlur={(e) => {
                            const existing = selectedNode.config ? JSON.parse(selectedNode.config || '{}') : {};
                            updateNode(selectedNode.id, { config: JSON.stringify({ ...existing, value: e.target.value }) });
                          }}
                          className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {selectedNode.type === 'action' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">Action Type</label>
                        <select
                          defaultValue={
                            selectedNode.config ? (() => {
                              try { return JSON.parse(selectedNode.config).action || ''; } catch { return ''; }
                            })() : ''
                          }
                          onChange={(e) => {
                            const existing = selectedNode.config ? JSON.parse(selectedNode.config || '{}') : {};
                            updateNode(selectedNode.id, { config: JSON.stringify({ ...existing, action: e.target.value }) });
                          }}
                          className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white outline-none"
                        >
                          <option value="update_stage">Update Stage</option>
                          <option value="add_tag">Add Tag</option>
                          <option value="assign">Assign to Team</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">Value</label>
                        <input
                          type="text"
                          defaultValue={
                            selectedNode.config ? (() => {
                              try { return JSON.parse(selectedNode.config).value || ''; } catch { return ''; }
                            })() : ''
                          }
                          onBlur={(e) => {
                            const existing = selectedNode.config ? JSON.parse(selectedNode.config || '{}') : {};
                            updateNode(selectedNode.id, { config: JSON.stringify({ ...existing, value: e.target.value }) });
                          }}
                          placeholder="e.g. followup, hot_lead"
                          className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* Connect to another node */}
                  {selectedNode.type !== 'end' && (
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">Connect to</label>
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            connectNodes(selectedNode.id, e.target.value);
                            e.target.value = '';
                          }
                        }}
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white outline-none"
                        defaultValue=""
                      >
                        <option value="">Select target node</option>
                        {editingFlow.nodes
                          .filter(n => n.id !== selectedNode.id)
                          .map(n => (
                            <option key={n.id} value={n.id}>
                              {n.type} - {n.content?.slice(0, 30) || n.label || n.id.slice(0, 8)}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        ) : selectedFlow ? (
          <>
            {/* Flow Detail View */}
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-white">{selectedFlow.name}</h2>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${selectedFlow.isActive ? 'bg-green-500/20 text-green-400' : 'bg-zinc-700 text-zinc-400'}`}>
                    {selectedFlow.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {selectedFlow.description && (
                  <p className="text-sm text-zinc-500 mt-1">{selectedFlow.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleFlow(selectedFlow.id)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    selectedFlow.isActive
                      ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {selectedFlow.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => setEditingFlow(selectedFlow)}
                  className="px-3 py-1.5 bg-white text-black text-sm font-medium rounded-lg hover:bg-zinc-100"
                >
                  Edit Flow
                </button>
              </div>
            </div>

            {/* Flow Info */}
            <div className="flex-1 p-6">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-zinc-800/30 rounded-xl">
                  <div className="text-2xl font-bold text-white font-mono">{selectedFlow.nodes?.length || 0}</div>
                  <div className="text-sm text-zinc-500">Nodes</div>
                </div>
                <div className="p-4 bg-zinc-800/30 rounded-xl">
                  <div className="text-2xl font-bold text-white font-mono">{selectedFlow._count?.executions || 0}</div>
                  <div className="text-sm text-zinc-500">Executions</div>
                </div>
                <div className="p-4 bg-zinc-800/30 rounded-xl">
                  <div className="text-2xl font-bold text-white font-mono capitalize">{selectedFlow.trigger}</div>
                  <div className="text-sm text-zinc-500">Trigger</div>
                </div>
              </div>

              {/* Flow Preview */}
              <div className="bg-zinc-800/20 rounded-xl p-6">
                <h3 className="text-sm font-medium text-zinc-400 mb-4">Flow Preview</h3>
                <div className="space-y-3">
                  {selectedFlow.nodes?.map((node) => {
                    const config = getNodeTypeConfig(node.type);
                    return (
                      <div key={node.id} className={`flex items-center gap-3 p-3 rounded-lg border ${config.color}`}>
                        <config.icon className="w-4 h-4" />
                        <div className="flex-1">
                          <span className="text-sm font-medium capitalize">{node.type}</span>
                          {node.content && (
                            <p className="text-xs text-zinc-400 truncate mt-0.5">{node.content}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Bot className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <p className="text-zinc-500">Select a flow or create a new one</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
