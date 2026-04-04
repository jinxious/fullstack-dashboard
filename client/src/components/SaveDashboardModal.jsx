import React, { useState } from 'react';
import { useDashboardStore } from '../store/useDashboardStore';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Save, Copy, Layers, X, Loader2 } from 'lucide-react';

export function SaveDashboardModal({ isOpen, onClose }) {
  const {
    dashboardId, dashboardTitle, setDashboardTitle,
    dataFilename, schema, widgets, layout
  } = useDashboardStore();

  const [title, setTitle] = useState(dashboardTitle || 'Untitled Dashboard');
  const [saveAsNew, setSaveAsNew] = useState(false);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    try {
      setSaving(true);

      // Update title in store
      setDashboardTitle(title);

      const payload = { title, dataFilename, schema, widgets, layout };

      // Save/update dashboard
      if (dashboardId && !saveAsNew) {
        // Update existing
        await api.put(`/api/dashboards/${dashboardId}`, payload);
        toast.success('Dashboard updated!');
      } else {
        // Create new
        const res = await api.post('/api/dashboards', payload);
        // Update the store with the new ID
        useDashboardStore.setState({ dashboardId: res.data.id });
        toast.success('Dashboard saved!');
      }

      // Also save as template if checked
      if (saveAsTemplate && templateName.trim()) {
        const expectedColumns = (schema || []).map(col => {
          // Determine role based on widget usage
          let role = 'none';
          for (const w of widgets) {
            if (w.xAxis === col.name) { role = 'xAxis'; break; }
            if (w.yAxis === col.name) { role = 'yAxis'; break; }
            if (w.filters?.some(f => f.column === col.name)) { role = 'filter'; break; }
          }
          return { name: col.name, type: col.type, role };
        });

        await api.post('/api/templates', {
          name: templateName.trim(),
          description: templateDesc.trim(),
          expectedColumns,
          widgets,
          layout
        });
        toast.success('Template saved!');
      }

      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-border rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold">Save Dashboard</h3>
          <button onClick={onClose} className="p-1 text-textMuted hover:text-textMain rounded"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-textMuted mb-1.5">Dashboard Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
              placeholder="My Dashboard"
            />
          </div>

          {/* Save As New option (if editing) */}
          {dashboardId && (
            <label className="flex items-center gap-3 p-3 bg-background rounded-lg border border-border cursor-pointer hover:border-primary/30 transition-colors">
              <input
                type="checkbox"
                checked={saveAsNew}
                onChange={(e) => setSaveAsNew(e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20"
              />
              <div>
                <span className="text-sm font-medium flex items-center gap-1.5">
                  <Copy className="w-3.5 h-3.5 text-textMuted" />
                  Save as New Dashboard
                </span>
                <p className="text-xs text-textMuted mt-0.5">Creates a copy instead of updating the original</p>
              </div>
            </label>
          )}

          {/* Save as Template */}
          <label className="flex items-center gap-3 p-3 bg-background rounded-lg border border-border cursor-pointer hover:border-primary/30 transition-colors">
            <input
              type="checkbox"
              checked={saveAsTemplate}
              onChange={(e) => setSaveAsTemplate(e.target.checked)}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20"
            />
            <div>
              <span className="text-sm font-medium flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-textMuted" />
                Also Save as Template
              </span>
              <p className="text-xs text-textMuted mt-0.5">Reuse this layout with different data files</p>
            </div>
          </label>

          {/* Template fields */}
          {saveAsTemplate && (
            <div className="pl-4 border-l-2 border-primary/30 space-y-3">
              <div>
                <label className="block text-sm font-medium text-textMuted mb-1.5">Template Name</label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
                  placeholder="e.g. Monthly Sales Report"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-textMuted mb-1.5">Description (optional)</label>
                <textarea
                  value={templateDesc}
                  onChange={(e) => setTemplateDesc(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary resize-none"
                  rows={2}
                  placeholder="Describe when to use this template..."
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 text-sm text-textMuted hover:text-textMain py-2.5 rounded-lg border border-border hover:bg-background transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !title.trim() || (saveAsTemplate && !templateName.trim())}
            className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primaryHover text-white py-2.5 rounded-lg font-medium shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {dashboardId && !saveAsNew ? 'Update' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
