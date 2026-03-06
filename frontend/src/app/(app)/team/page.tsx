'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Crown, User, Mail, Shield, UserPlus, X, Check, Clock } from 'lucide-react';

interface TeamMember {
  id: string;
  userId: string;
  role: 'admin' | 'agent';
  user: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  members: TeamMember[];
}

export default function TeamPage() {
  const { user, workspace, isLoading: authLoading } = useAuth();
  const USER_ID = user?.id || '';
  const WORKSPACE_ID = workspace?.id || '';
  const [workspaceData, setWorkspaceData] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'agent'>('agent');

  const headers = {
    'x-user-id': USER_ID,
    'x-workspace-id': WORKSPACE_ID,
  };

  useEffect(() => {
    if (!USER_ID || !WORKSPACE_ID || authLoading) return;
    loadWorkspace();
  }, [USER_ID, WORKSPACE_ID, authLoading]);

  const loadWorkspace = async () => {
    try {
      const data = await api.get<{ workspace: Workspace }>('/workspaces/current', { headers });
      setWorkspaceData(data.workspace);
    } catch (error) {
      console.error('Failed to load workspace:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    // This would typically call an invite endpoint
    // For now, just show a success message
    alert(`Invitation would be sent to ${inviteEmail} with ${inviteRole} role`);
    setShowInviteModal(false);
    setInviteEmail('');
    setInviteRole('agent');
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="w-4 h-4 text-yellow-400" />;
      case 'agent':
        return <User className="w-4 h-4 text-zinc-400" />;
      default:
        return <User className="w-4 h-4 text-zinc-400" />;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'agent':
        return 'bg-blue-500/20 text-blue-400';
      default:
        return 'bg-zinc-500/20 text-zinc-400';
    }
  };

  const isOwner = (member: TeamMember) => member.userId === workspaceData?.ownerId;

  if (loading || authLoading) {
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
          <h1 className="text-2xl font-bold text-white">Team</h1>
          <p className="text-zinc-500">
            {workspaceData?.members.length || 0} team members in {workspaceData?.name}
          </p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-xl font-medium hover:bg-zinc-100 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Invite Member
        </button>
      </div>

      {/* Team Members List */}
      <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800">
          <h2 className="font-semibold text-white">Workspace Members</h2>
        </div>
        
        <div className="divide-y divide-zinc-800">
            {workspaceData?.members.map((member) => (
            <div key={member.id} className="p-4 flex items-center justify-between hover:bg-zinc-800/30 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center">
                  {getRoleIcon(member.role)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-white">{member.user.name}</h3>
                    {isOwner(member) && (
                      <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-xs rounded">
                        Owner
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-zinc-500 mt-0.5">
                    <Mail className="w-3 h-3" />
                    {member.user.email}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 text-xs rounded-full ${getRoleBadge(member.role)}`}>
                  {member.role}
                </span>
                {!isOwner(member) && (
                  <button className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-red-400 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Role Information */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-zinc-900/30 border border-zinc-800 rounded-2xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <Crown className="w-5 h-5 text-yellow-400" />
            </div>
            <h3 className="font-semibold text-white">Admin</h3>
          </div>
          <ul className="space-y-2 text-sm text-zinc-400">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-400" />
              Full workspace access
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-400" />
              Manage team members
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-400" />
              Configure settings
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-400" />
              View all analytics
            </li>
          </ul>
        </div>

        <div className="p-4 bg-zinc-900/30 border border-zinc-800 rounded-2xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <User className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="font-semibold text-white">Agent</h3>
          </div>
          <ul className="space-y-2 text-sm text-zinc-400">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-400" />
              Send & receive messages
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-400" />
              Manage assigned contacts
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-400" />
              Create follow-ups
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-400" />
              Use templates
            </li>
          </ul>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Invite Team Member</h2>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-2 hover:bg-zinc-800 rounded-lg"
              >
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-600 outline-none focus:border-zinc-600"
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-1">Role</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setInviteRole('agent')}
                    className={`p-3 border rounded-xl text-left transition-colors ${
                      inviteRole === 'agent'
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-zinc-700 hover:border-zinc-600'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-4 h-4 text-blue-400" />
                      <span className="font-medium text-white">Agent</span>
                    </div>
                    <p className="text-xs text-zinc-500">Can message and manage contacts</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInviteRole('admin')}
                    className={`p-3 border rounded-xl text-left transition-colors ${
                      inviteRole === 'admin'
                        ? 'border-yellow-500 bg-yellow-500/10'
                        : 'border-zinc-700 hover:border-zinc-600'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Crown className="w-4 h-4 text-yellow-400" />
                      <span className="font-medium text-white">Admin</span>
                    </div>
                    <p className="text-xs text-zinc-500">Full access to workspace</p>
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-4 py-2 bg-zinc-800 text-white rounded-xl hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-white text-black rounded-xl font-medium hover:bg-zinc-100 transition-colors"
                >
                  Send Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
