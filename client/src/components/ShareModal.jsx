import React, { useState, useEffect, useCallback } from 'react';
import { 
  Share2, X, Copy, Check, Globe, Lock, Users, Plus, Trash2, 
  ChevronDown, Eye, MessageSquare, Edit3, Crown, Loader2, Link2
} from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

const ROLE_CONFIG = {
  viewer:    { label: 'Viewer',    icon: Eye,           color: 'text-blue-400',   desc: 'Can view only' },
  commenter: { label: 'Commenter', icon: MessageSquare, color: 'text-amber-400',  desc: 'Can view & comment' },
  editor:    { label: 'Editor',    icon: Edit3,         color: 'text-emerald-400', desc: 'Can edit & configure' },
  owner:     { label: 'Owner',     icon: Crown,         color: 'text-primary',    desc: 'Full control' },
};

function RoleSelect({ value, onChange, exclude = ['owner'] }) {
  const [open, setOpen] = useState(false);
  const roles = Object.entries(ROLE_CONFIG).filter(([k]) => !exclude.includes(k));
  const current = ROLE_CONFIG[value];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border border-border bg-background hover:border-primary/50 transition-colors"
      >
        <current.icon className={`w-3.5 h-3.5 ${current.color}`} />
        <span>{current.label}</span>
        <ChevronDown className="w-3 h-3 text-textMuted" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-surface border border-border rounded-xl shadow-2xl z-50 overflow-hidden min-w-[160px]">
          {roles.map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => { onChange(key); setOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-background text-sm transition-colors text-left ${value === key ? 'bg-primary/5' : ''}`}
            >
              <cfg.icon className={`w-3.5 h-3.5 ${cfg.color}`} />
              <div>
                <p className="font-medium">{cfg.label}</p>
                <p className="text-[10px] text-textMuted">{cfg.desc}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ShareModal({ dashboardId, dashboardTitle, onClose }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const [shareId, setShareId] = useState(null);
  const [isPublic, setIsPublic] = useState(false);
  const [linkAccess, setLinkAccess] = useState('viewer');
  const [permissions, setPermissions] = useState([]);
  const [viewCount, setViewCount] = useState(0);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');
  const [inviting, setInviting] = useState(false);

  const shareUrl = shareId ? `${window.location.origin}/view/${shareId}` : null;

  useEffect(() => {
    loadSharingSettings();
  }, [dashboardId]);

  const loadSharingSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/share/${dashboardId}`);
      const s = res.data.sharing;
      setShareId(s.shareId);
      setIsPublic(s.isPublic);
      setLinkAccess(s.linkAccess);
      setPermissions(s.permissions || []);
      setViewCount(s.viewCount || 0);
    } catch (err) {
      // Dashboard not yet shared — defaults
    } finally {
      setLoading(false);
    }
  };

  const enableSharing = async () => {
    try {
      setSaving(true);
      const res = await api.post(`/api/share/${dashboardId}/enable`, { isPublic: true, linkAccess });
      setShareId(res.data.shareId);
      setIsPublic(true);
      toast.success('Sharing enabled!');
    } catch (err) {
      toast.error('Failed to enable sharing');
    } finally {
      setSaving(false);
    }
  };

  const updateSettings = async (updates) => {
    try {
      if (!shareId) { await enableSharing(); return; }
      await api.patch(`/api/share/${dashboardId}`, updates);
      if (updates.isPublic !== undefined) setIsPublic(updates.isPublic);
      if (updates.linkAccess !== undefined) setLinkAccess(updates.linkAccess);
    } catch (err) {
      toast.error('Failed to update settings');
    }
  };

  const copyLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      toast.success('Link copied!');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const inviteUser = async () => {
    if (!inviteEmail.trim()) return;
    try {
      setInviting(true);
      if (!shareId) await enableSharing();
      const res = await api.post(`/api/share/${dashboardId}/permissions`, {
        email: inviteEmail.trim(),
        role: inviteRole
      });
      setPermissions(res.data.permissions);
      setInviteEmail('');
      toast.success(`Invited ${inviteEmail}`);
    } catch (err) {
      toast.error('Failed to invite user');
    } finally {
      setInviting(false);
    }
  };

  const removeUser = async (email) => {
    try {
      const res = await api.delete(`/api/share/${dashboardId}/permissions/${encodeURIComponent(email)}`);
      setPermissions(res.data.permissions);
      toast.success('Access removed');
    } catch (err) {
      toast.error('Failed to remove user');
    }
  };

  const updatePermission = async (email, role) => {
    try {
      const res = await api.post(`/api/share/${dashboardId}/permissions`, { email, role });
      setPermissions(res.data.permissions);
    } catch (err) {
      toast.error('Failed to update role');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-surface border border-border shadow-2xl rounded-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
              <Share2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-base">Share Dashboard</h2>
              <p className="text-xs text-textMuted truncate max-w-[240px]">{dashboardTitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-background rounded-lg transition-colors text-textMuted">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
            
            {/* Public / Private toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-background">
              <div className="flex items-center gap-3">
                {isPublic 
                  ? <Globe className="w-5 h-5 text-emerald-400" />
                  : <Lock className="w-5 h-5 text-textMuted" />
                }
                <div>
                  <p className="font-semibold text-sm">{isPublic ? 'Public' : 'Private'}</p>
                  <p className="text-xs text-textMuted">
                    {isPublic ? 'Anyone with the link can access' : 'Only invited users can access'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => updateSettings({ isPublic: !isPublic })}
                className={`relative w-12 h-6 rounded-full transition-colors ${isPublic ? 'bg-emerald-500' : 'bg-border'}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${isPublic ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>

            {/* Shareable Link */}
            <div>
              <label className="text-xs text-textMuted uppercase tracking-wider block mb-2 flex items-center gap-1">
                <Link2 className="w-3 h-3" /> Shareable Link
              </label>
              {shareId ? (
                <div className="flex gap-2">
                  <div className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-textMuted font-mono truncate">
                    {shareUrl}
                  </div>
                  <button
                    onClick={copyLink}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      copied ? 'bg-emerald-500 text-white' : 'bg-primary text-white hover:bg-primaryHover'
                    }`}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              ) : (
                <button
                  onClick={enableSharing}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primaryHover text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
                  Generate Share Link
                </button>
              )}
            </div>

            {/* Link access level */}
            {shareId && isPublic && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-background border border-border">
                <p className="text-sm font-medium">Anyone with the link can</p>
                <RoleSelect value={linkAccess} onChange={(r) => updateSettings({ linkAccess: r })} />
              </div>
            )}

            {viewCount > 0 && (
              <p className="text-xs text-textMuted text-center">
                👁 Viewed {viewCount} time{viewCount !== 1 ? 's' : ''}
              </p>
            )}

            {/* Invite specific users */}
            <div>
              <label className="text-xs text-textMuted uppercase tracking-wider block mb-2 flex items-center gap-1">
                <Users className="w-3 h-3" /> Invite People
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter email address..."
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && inviteUser()}
                  className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                />
                <RoleSelect value={inviteRole} onChange={setInviteRole} />
                <button
                  onClick={inviteUser}
                  disabled={inviting || !inviteEmail.trim()}
                  className="flex items-center gap-1 bg-primary hover:bg-primaryHover text-white px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
                >
                  {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Permissions list */}
            {permissions.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs text-textMuted uppercase tracking-wider block">People with access</label>
                {permissions.map(p => (
                  <div key={p.email} className="flex items-center justify-between p-3 rounded-xl bg-background border border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center text-primary text-xs font-bold">
                        {(p.name || p.email)[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{p.name || p.email}</p>
                        <p className="text-xs text-textMuted">{p.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <RoleSelect value={p.role} onChange={(r) => updatePermission(p.email, r)} />
                      <button
                        onClick={() => removeUser(p.email)}
                        className="p-1.5 text-textMuted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
