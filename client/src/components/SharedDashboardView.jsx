import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { Widget } from './Widget';
import { FilterPanel } from './FilterPanel';
import { useFilterStore } from '../store/useFilterStore';
import { Eye, Edit3, MessageSquare, Crown, Lock, Loader2, AlertTriangle } from 'lucide-react';

const ROLE_CONFIG = {
  viewer:    { label: 'View Only',  icon: Eye,           color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  commenter: { label: 'Commenter',  icon: MessageSquare, color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  editor:    { label: 'Editor',     icon: Edit3,         color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  owner:     { label: 'Owner',      icon: Crown,         color: 'bg-primary/10 text-primary border-primary/20' },
};

export function SharedDashboardView() {
  const { shareId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [dataset, setDataset] = useState(null);
  const [role, setRole] = useState(null);

  const { filteredDataset, initFilters } = useFilterStore();
  const activeDataset = filteredDataset ?? dataset;

  useEffect(() => {
    const backendUrl = import.meta.env.VITE_API_URL || 'https://fullstack-dashboard-5wd1.onrender.com';
    
    fetch(`${backendUrl}/api/share/view/${shareId}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('metricsflow_token') || ''}` }
    })
      .then(r => r.json())
      .then(res => {
        if (!res.success) throw new Error(res.message || 'Access denied');
        setDashboard(res.dashboard);
        setDataset(res.data);
        setRole(res.role);
        // Initialize filters  
        initFilters(res.dashboard.schema, res.data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [shareId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-textMuted">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-8">
        <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center">
          {error.includes('private') ? <Lock className="w-8 h-8 text-red-400" /> : <AlertTriangle className="w-8 h-8 text-red-400" />}
        </div>
        <h1 className="text-2xl font-bold">Dashboard Unavailable</h1>
        <p className="text-textMuted text-center max-w-sm">{error}</p>
        <a href="/" className="bg-primary hover:bg-primaryHover text-white px-6 py-2.5 rounded-lg font-medium transition-colors">
          Go to MetricsFlow
        </a>
      </div>
    );
  }

  const roleCfg = ROLE_CONFIG[role] || ROLE_CONFIG.viewer;
  const RoleIcon = roleCfg.icon;
  const canEdit = role === 'editor' || role === 'owner';

  const layout = dashboard.widgets.map((w, i) => {
    const existing = dashboard.layout?.find(l => l.i === w.id);
    if (existing) return existing;
    return { i: w.id, x: (i * 6) % 12, y: Infinity, w: 6, h: 4 };
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="h-14 bg-surface border-b border-border flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white text-sm font-bold">M</div>
          <h1 className="font-bold text-base truncate max-w-xs">{dashboard.title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${roleCfg.color}`}>
            <RoleIcon className="w-3 h-3" />
            {roleCfg.label}
          </span>
          <a
            href="/"
            className="text-sm text-textMuted hover:text-primary transition-colors"
          >
            Open MetricsFlow →
          </a>
        </div>
      </header>

      {/* Filter panel */}
      <div className="border-b border-border bg-surface/40">
        <FilterPanel readOnly={!canEdit} />
      </div>

      {/* Canvas */}
      <main className="flex-1 overflow-y-auto p-6">
        {dashboard.widgets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-textMuted">
            <p className="text-lg font-medium">No widgets on this dashboard</p>
          </div>
        ) : (
          <GridLayout
            className="layout"
            layout={layout}
            cols={12}
            rowHeight={80}
            width={1200}
            isDraggable={canEdit}
            isResizable={canEdit}
            resizeHandles={canEdit ? ['s', 'w', 'e', 'n', 'sw', 'nw', 'se', 'ne'] : []}
          >
            {dashboard.widgets.map(widget => (
              <div key={widget.id} className="h-full rounded-xl">
                <Widget
                  config={widget}
                  dataset={activeDataset}
                  onRemove={null}
                  onSettings={null}
                  inFinalizeMode={false}
                />
              </div>
            ))}
          </GridLayout>
        )}
      </main>
    </div>
  );
}
