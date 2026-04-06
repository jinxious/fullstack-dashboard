import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardStore } from '../store/useDashboardStore';
import { ShareModal } from './ShareModal';
import api from '../lib/api';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, Plus, Trash2, Copy, Edit3, BarChart2,
  Clock, FileSpreadsheet, Loader2, Globe, Lock, Share2,
  Eye, ChevronRight
} from 'lucide-react';

export function MyDashboards() {
  const [dashboards, setDashboards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [shareTarget, setShareTarget] = useState(null); // { id, title }
  const { loadDashboard, resetDashboard } = useDashboardStore();
  const navigate = useNavigate();

  const fetchDashboards = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/dashboards');
      setDashboards(res.data.dashboards || []);
    } catch (err) {
      toast.error('Failed to load dashboards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboards(); }, []);

  const handleOpen = async (id) => {
    try {
      const res = await api.get(`/api/dashboards/${id}`);
      loadDashboard(res.data.dashboard, res.data.data);
      navigate('/dashboard');
    } catch (err) {
      toast.error('Failed to load dashboard');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this dashboard? This cannot be undone.')) return;
    try {
      setDeletingId(id);
      await api.delete(`/api/dashboards/${id}`);
      setDashboards(prev => prev.filter(d => (d._id || d.id) !== id));
      toast.success('Dashboard deleted');
    } catch (err) {
      toast.error('Failed to delete dashboard');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDuplicate = async (id) => {
    try {
      await api.post(`/api/dashboards/${id}/duplicate`);
      toast.success('Dashboard duplicated');
      fetchDashboards();
    } catch (err) {
      toast.error('Failed to duplicate dashboard');
    }
  };

  const handleNew = () => {
    resetDashboard();
    navigate('/dashboard');
  };

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });

  const copyShareLink = (shareId) => {
    const url = `${window.location.origin}/view/${shareId}`;
    navigator.clipboard.writeText(url).then(() => toast.success('Link copied!'));
  };

  // After ShareModal closes, refresh so public/private badge updates
  const handleShareClose = () => {
    setShareTarget(null);
    fetchDashboards();
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-primary" />
            My Dashboards
          </h2>
          <p className="text-textMuted mt-1">Manage and edit your saved dashboards</p>
        </div>
        <button
          onClick={handleNew}
          className="flex items-center gap-2 bg-primary hover:bg-primaryHover text-white px-5 py-2.5 rounded-lg transition-all font-medium shadow-lg shadow-primary/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          New Dashboard
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      )}

      {/* Empty State */}
      {!loading && dashboards.length === 0 && (
        <div className="text-center py-20 border border-dashed border-border rounded-2xl bg-surface/50">
          <FileSpreadsheet className="w-16 h-16 text-border mx-auto mb-4" />
          <h3 className="text-xl font-medium mb-2">No dashboards yet</h3>
          <p className="text-textMuted mb-6 max-w-sm mx-auto">
            Upload an Excel file and build your first dashboard to see it here.
          </p>
          <button
            onClick={handleNew}
            className="inline-flex items-center gap-2 bg-primary hover:bg-primaryHover text-white px-5 py-2.5 rounded-lg transition-all font-medium"
          >
            <Plus className="w-4 h-4" />
            Create First Dashboard
          </button>
        </div>
      )}

      {/* Dashboards Grid */}
      {!loading && dashboards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {dashboards.map((dash) => {
            const id = dash._id || dash.id;
            const isPublic = dash.isPublic || false;
            const hasShareLink = !!dash.shareId;

            return (
              <div
                key={id}
                className="bg-surface border border-border rounded-xl overflow-hidden group hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5 flex flex-col"
              >
                {/* Top gradient bar */}
                <div className="h-2 bg-gradient-to-r from-primary to-indigo-500 shrink-0" />

                <div className="p-5 flex flex-col flex-1">
                  {/* Title row + public/private badge */}
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-lg truncate">{dash.title || 'Untitled'}</h3>
                    {/* Public / Private badge */}
                    {hasShareLink ? (
                      <span className={`shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        isPublic
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-surface text-textMuted border-border'
                      }`}>
                        {isPublic ? <Globe className="w-2.5 h-2.5" /> : <Lock className="w-2.5 h-2.5" />}
                        {isPublic ? 'Public' : 'Private'}
                      </span>
                    ) : (
                      <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-surface text-textMuted border-border">
                        <Lock className="w-2.5 h-2.5" /> Not shared
                      </span>
                    )}
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-4 text-xs text-textMuted mb-3">
                    <span className="flex items-center gap-1">
                      <BarChart2 className="w-3 h-3" />
                      {dash.widgets?.length || 0} widgets
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(dash.updatedAt || dash.createdAt)}
                    </span>
                    {isPublic && dash.viewCount > 0 && (
                      <span className="flex items-center gap-1 text-emerald-400">
                        <Eye className="w-3 h-3" />
                        {dash.viewCount} views
                      </span>
                    )}
                  </div>

                  {/* Schema tags */}
                  <div className="flex flex-wrap gap-1 mb-4 flex-1">
                    {(dash.schema || []).slice(0, 4).map((col) => (
                      <span key={col.name} className="text-[10px] px-2 py-0.5 bg-background border border-border rounded-full text-textMuted">
                        {col.name}
                      </span>
                    ))}
                    {(dash.schema || []).length > 4 && (
                      <span className="text-[10px] px-2 py-0.5 bg-background border border-border rounded-full text-textMuted">
                        +{dash.schema.length - 4} more
                      </span>
                    )}
                  </div>

                  {/* Quick copy link (only if has shareId and is public) */}
                  {hasShareLink && isPublic && (
                    <button
                      onClick={() => copyShareLink(dash.shareId)}
                      className="w-full flex items-center justify-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/20 py-1.5 rounded-lg transition-colors mb-3 font-medium"
                    >
                      <ChevronRight className="w-3 h-3" />
                      Copy share link
                    </button>
                  )}

                  {/* Action buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpen(id)}
                      className="flex-1 flex items-center justify-center gap-1 text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 py-2 rounded-lg transition-colors border border-primary/20"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Open
                    </button>

                    {/* Share button */}
                    <button
                      onClick={() => setShareTarget({ id, title: dash.title || 'Untitled' })}
                      className={`p-2 rounded-lg transition-colors border ${
                        isPublic
                          ? 'text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 bg-emerald-500/5'
                          : 'text-textMuted hover:text-primary hover:bg-primary/10 border-border'
                      }`}
                      title="Share"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDuplicate(id)}
                      className="p-2 text-textMuted hover:text-textMain hover:bg-background rounded-lg transition-colors border border-border"
                      title="Duplicate"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(id)}
                      disabled={deletingId === id}
                      className="p-2 text-textMuted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-border disabled:opacity-50"
                      title="Delete"
                    >
                      {deletingId === id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Share Modal */}
      {shareTarget && (
        <ShareModal
          dashboardId={shareTarget.id}
          dashboardTitle={shareTarget.title}
          onClose={handleShareClose}
        />
      )}
    </div>
  );
}
