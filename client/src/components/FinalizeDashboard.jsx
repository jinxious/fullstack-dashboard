import React, { useState } from 'react';
import { useDashboardStore } from '../store/useDashboardStore';
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { Widget } from './Widget';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, Download, Eye, Edit3, Save, Palette, AlignLeft, 
  Settings, Loader2, Code
} from 'lucide-react';
import api from '../lib/api';

export function FinalizeDashboard() {
  const { 
    dataset, widgets, layout: storeLayout, setLayout, 
    setStep, dashboardTitle, setDashboardTitle,
    dashboardMetadata, setMetadata,
    dashboardTheme, setTheme,
    isExporting, setIsExporting,
    dashboardId, schema, dataFilename
  } = useDashboardStore();

  const [previewMode, setPreviewMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exportingType, setExportingType] = useState(null); // 'pdf' | 'html' | null

  // Ensure layout covers all widgets
  const layout = widgets.map((w, i) => {
    const isHeader = w.type === 'header';
    const isText = w.type === 'text';
    const targetMinH = isHeader ? 1 : isText ? 2 : 3;

    const existing = storeLayout?.find(l => l.i === w.id);
    if (existing) {
      return { ...existing, minH: targetMinH };
    }
    
    return { 
      i: w.id, 
      x: (i * 6) % 12, 
      y: Infinity, 
      w: isHeader ? 12 : 6, 
      h: isHeader ? 1 : isText ? 3 : 4, 
      minW: 3, 
      minH: targetMinH 
    };
  });

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = { 
        title: dashboardTitle, 
        dataFilename, 
        schema, 
        widgets, 
        layout: storeLayout,
        metadata: dashboardMetadata,
        theme: dashboardTheme
      };
      
      if (dashboardId) {
        await api.put(`/api/dashboards/${dashboardId}`, payload);
        toast.success('Dashboard updated with new styles!');
      } else {
        const res = await api.post('/api/dashboards', payload);
        useDashboardStore.setState({ dashboardId: res.data.id });
        toast.success('Dashboard saved!');
      }
    } catch (err) {
      toast.error('Failed to save dashboard');
    } finally {
      setSaving(false);
    }
  };

  const generateHtmlExport = (elementHTML) => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${dashboardTitle} - Export</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      :root {
        --color-background: ${dashboardTheme.backgroundColor === 'dark' ? '#0f172a' : '#f8fafc'};
        --color-surface: ${dashboardTheme.backgroundColor === 'dark' ? '#1e293b' : '#ffffff'};
        --color-textMain: ${dashboardTheme.backgroundColor === 'dark' ? '#f8fafc' : '#0f172a'};
        --color-textMuted: ${dashboardTheme.backgroundColor === 'dark' ? '#94a3b8' : '#64748b'};
        --color-border: ${dashboardTheme.backgroundColor === 'dark' ? '#334155' : '#e2e8f0'};
      }
      body {
        background-color: var(--color-background);
        color: var(--color-textMain);
        font-family: ${dashboardTheme.fontFamily === 'serif' ? 'ui-serif, Georgia, serif' : dashboardTheme.fontFamily === 'mono' ? 'ui-monospace, monospace' : 'ui-sans-serif, system-ui, sans-serif'};
        padding: 40px;
        margin: 0;
      }
      .dashboard-canvas {
        max-width: 1200px;
        margin: 0 auto;
        background-color: var(--color-background);
      }
      .bg-surface { background-color: var(--color-surface); }
      .border-border { border-color: var(--color-border); }
      .text-textMain { color: var(--color-textMain); }
      .text-textMuted { color: var(--color-textMuted); }
      
      /* Reset grid layout absolute positioning for static export */
      .react-grid-layout { position: relative !important; height: auto !important; display: flex; flex-wrap: wrap; gap: 20px; }
      .react-grid-item { position: static !important; width: calc(50% - 10px) !important; transform: none !important; margin-bottom: 20px; overflow: visible !important; }
      .react-grid-item[style*="width: 1200px"] { width: 100% !important; }
      .react-grid-item[style*="width: 900px"] { width: 75% !important; }
      .react-grid-item[style*="width: 300px"] { width: 25% !important; }
      
      /* Recharts static view fixes */
      .recharts-wrapper svg { background: transparent !important; overflow: visible !important; }
      .recharts-tooltip-wrapper { display: none !important; }
    </style>
</head>
<body>
    <div class="dashboard-canvas">
        ${elementHTML}
    </div>
</body>
</html>`;
  };

  const handleExport = async (type) => {
    try {
      setExportingType(type);
      
      // 1. Temporarily enable exporting mode so charts render static labels, remove borders, etc.
      setIsExporting(true);
      
      // Give React a moment to re-render the DOM with LabelLists before capturing
      await new Promise(resolve => setTimeout(resolve, 500));

      const dashboardElement = document.querySelector('.dashboard-export-wrapper');
      if (!dashboardElement) throw new Error('No dashboard found');

      // Add a slight delay to ensure Recharts SVG animations have finished
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const htmlContent = generateHtmlExport(dashboardElement.innerHTML);

      if (type === 'html') {
        // Download as HTML
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${dashboardTitle.replace(/\s+/g, '_')}.html`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        toast.success('HTML exported!');
      } else if (type === 'pdf') {
        // Download as PDF via backend
        const response = await api.post('/api/export/pdf', { htmlContent }, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${dashboardTitle.replace(/\s+/g, '_')}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        toast.success('PDF exported!');
      }

    } catch (err) {
      console.error(err);
      toast.error(`Failed to export ${type.toUpperCase()}`);
    } finally {
      setExportingType(null);
      setIsExporting(false); // Switch back to interactive mode
    }
  };

  // Determine styles purely for the editor preview (so it maps perfectly to export)
  const previewStyle = {
    fontFamily: dashboardTheme.fontFamily === 'serif' ? 'ui-serif, Georgia, serif' : 
                dashboardTheme.fontFamily === 'mono' ? 'ui-monospace, monospace' : 
                'ui-sans-serif, system-ui, sans-serif',
    backgroundColor: dashboardTheme.backgroundColor === 'dark' ? '#0f172a' : '#f8fafc',
    color: dashboardTheme.backgroundColor === 'dark' ? '#f8fafc' : '#0f172a',
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-background">
      {/* Top Bar */}
      <div className="h-16 border-b border-border bg-surface px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setStep(3)}
            className="p-2 hover:bg-background rounded-lg transition-colors text-textMuted hover:text-textMain"
            title="Back to Data Builder"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="h-6 w-px bg-border"></div>
          <h2 className="font-semibold flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Finalize Dashboard
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
              previewMode 
                ? 'bg-primary/10 border-primary/20 text-primary' 
                : 'bg-surface border-border hover:bg-background'
            }`}
          >
            {previewMode ? <Edit3 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {previewMode ? 'Back to Editor' : 'Live Preview'}
          </button>

          <div className="h-6 w-px bg-border mx-1"></div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-border bg-surface hover:bg-background"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Progress
          </button>

          <button
            onClick={() => handleExport('html')}
            disabled={exportingType !== null}
            className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg shadow-indigo-500/20 transition-all text-sm font-medium disabled:opacity-50"
          >
            {exportingType === 'html' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Code className="w-4 h-4" />}
            Export HTML
          </button>

          <button
            onClick={() => handleExport('pdf')}
            disabled={exportingType !== null}
            className="flex items-center gap-2 bg-primary hover:bg-primaryHover text-white px-4 py-2 rounded-lg shadow-lg shadow-primary/20 transition-all text-sm font-medium disabled:opacity-50"
          >
            {exportingType === 'pdf' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export PDF
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Settings Sidebar */}
        {!previewMode && (
          <div className="w-80 bg-surface border-r border-border overflow-y-auto p-5 space-y-8 custom-scrollbar">
            {/* General Content */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2 border-b border-border pb-2">
                <AlignLeft className="w-4 h-4 text-primary" />
                Report Content
              </h3>
              
              <div>
                <label className="text-xs text-textMuted uppercase tracking-wider block mb-1">Report Title</label>
                <input 
                  type="text" 
                  value={dashboardTitle}
                  onChange={(e) => setDashboardTitle(e.target.value)}
                  className="w-full bg-background border border-border rounded items-center px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="text-xs text-textMuted uppercase tracking-wider block mb-1">Subtitle / Description</label>
                <textarea 
                  value={dashboardMetadata.subtitle}
                  onChange={(e) => setMetadata({ subtitle: e.target.value })}
                  placeholder="e.g., Q3 Performance Overview"
                  rows={2}
                  className="w-full bg-background border border-border rounded items-center px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-textMuted uppercase tracking-wider block mb-1">Author / Company</label>
                  <input 
                    type="text" 
                    value={dashboardMetadata.author}
                    onChange={(e) => setMetadata({ author: e.target.value })}
                    placeholder="Acme Corp"
                    className="w-full bg-background border border-border rounded items-center px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="text-xs text-textMuted uppercase tracking-wider block mb-1">Date</label>
                  <input 
                    type="text" 
                    value={dashboardMetadata.date}
                    onChange={(e) => setMetadata({ date: e.target.value })}
                    className="w-full bg-background border border-border rounded items-center px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>

            {/* Styling */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2 border-b border-border pb-2">
                <Palette className="w-4 h-4 text-primary" />
                Styling & Theme
              </h3>
              
              <div>
                <label className="text-xs text-textMuted uppercase tracking-wider block mb-2">Background Theme</label>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setTheme({ backgroundColor: 'light' })}
                    className={`flex-1 py-2 text-xs font-medium border rounded-lg transition-all ${dashboardTheme.backgroundColor === 'light' ? 'bg-primary text-white border-primary shadow-md' : 'bg-background text-textMuted border-border hover:bg-surface'}`}
                  >Light</button>
                  <button 
                    onClick={() => setTheme({ backgroundColor: 'dark' })}
                    className={`flex-1 py-2 text-xs font-medium border rounded-lg transition-all ${dashboardTheme.backgroundColor === 'dark' ? 'bg-primary text-white border-primary shadow-md' : 'bg-background text-textMuted border-border hover:bg-surface'}`}
                  >Dark</button>
                </div>
              </div>

              <div>
                <label className="text-xs text-textMuted uppercase tracking-wider block mb-1">Typography</label>
                <select 
                  value={dashboardTheme.fontFamily}
                  onChange={(e) => setTheme({ fontFamily: e.target.value })}
                  className="w-full bg-background border border-border rounded items-center px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                >
                  <option value="sans">Modern Sans (Inter/System)</option>
                  <option value="serif">Classic Serif (Georgia/Times)</option>
                  <option value="mono">Technical (Monospace)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-textMuted uppercase tracking-wider block mb-2">Chart Color Palette</label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { id: 'default', name: 'Standard Flow', colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'] },
                    { id: 'monochrome', name: 'Executive Slate', colors: ['#334155', '#475569', '#64748b', '#94a3b8', '#cbd5e1'] },
                    { id: 'vibrant', name: 'Vibrant Berry', colors: ['#ff0a54', '#ff477e', '#ff7096', '#ff85a1', '#fbb1bd'] },
                    { id: 'pastel', name: 'Soft Pastel', colors: ['#fec5bb', '#fcd5ce', '#fae1dd', '#f8edeb', '#e8e8e4'] },
                  ].map(palette => (
                    <button
                      key={palette.id}
                      onClick={() => setTheme({ chartPalette: palette.id })}
                      className={`flex items-center justify-between px-3 py-2 border rounded-lg transition-all w-full
                        ${dashboardTheme.chartPalette === palette.id ? 'border-primary ring-1 ring-primary/20 bg-primary/5' : 'border-border hover:bg-background'}`}
                    >
                      <span className="text-xs font-medium">{palette.name}</span>
                      <div className="flex gap-1">
                        {palette.colors.map((c, idx) => (
                          <div key={idx} className="w-3 h-3 rounded-full" style={{ backgroundColor: c }}></div>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl">
              <p className="text-xs text-primary font-medium mb-1">Inline Editing</p>
              <p className="text-[11px] text-textMuted">
                Click on any chart title, section header, or text block directly in the canvas to edit it instantly.
              </p>
            </div>
          </div>
        )}

        {/* Main Canvas Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-black/5" style={{ backgroundColor: previewMode ? dashboardTheme.backgroundColor === 'dark' ? '#000' : '#f1f5f9' : undefined }}>
          {/* Wrapper for Export Capture */}
          <div className="dashboard-export-wrapper max-w-[1200px] mx-auto shadow-2xl rounded-sm overflow-hidden" style={previewStyle}>
            
            {/* Report Header */}
            <div className="px-8 pt-10 pb-6 border-b" style={{ borderColor: dashboardTheme.backgroundColor === 'dark' ? '#334155' : '#e2e8f0' }}>
              <div className="flex justify-between items-end gap-6">
                <div>
                  <h1 className="text-3xl font-bold mb-2 tracking-tight">{dashboardTitle}</h1>
                  {dashboardMetadata.subtitle && (
                    <p className="text-lg opacity-80" style={{ color: dashboardTheme.backgroundColor === 'dark' ? '#94a3b8' : '#475569' }}>
                      {dashboardMetadata.subtitle}
                    </p>
                  )}
                </div>
                <div className="text-right text-sm">
                  {dashboardMetadata.author && <p className="font-semibold">{dashboardMetadata.author}</p>}
                  {dashboardMetadata.date && <p style={{ color: dashboardTheme.backgroundColor === 'dark' ? '#94a3b8' : '#64748b' }}>{dashboardMetadata.date}</p>}
                </div>
              </div>
            </div>

            {/* Dashboard Grid */}
            <div className="p-6 pb-12 min-h-[600px] dashboard-canvas-layout">
              {widgets.length === 0 ? (
                <div className="flex items-center justify-center h-full opacity-50 py-20">
                  <p>No widgets added to this dashboard.</p>
                </div>
              ) : (
                <GridLayout 
                  className={`layout ${isExporting ? 'export-mode' : ''}`}
                  layout={layout} 
                  onLayoutChange={(newLayout) => !previewMode && !isExporting && setLayout(newLayout)}
                  cols={12} 
                  rowHeight={80} 
                  width={1152} // 1200px wrapper - 48px padding
                  isDraggable={!previewMode && !isExporting}
                  isResizable={!previewMode && !isExporting}
                  margin={[20, 20]} // Added more spacing for reporting
                >
                  {widgets.map(widget => (
                    <div key={widget.id}>
                      <Widget 
                        config={widget} 
                        dataset={dataset} 
                        inFinalizeMode={!previewMode && !isExporting} 
                        // We do NOT pass onRemove here to prevent accidental deletion in Finalize mode
                      />
                    </div>
                  ))}
                </GridLayout>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
