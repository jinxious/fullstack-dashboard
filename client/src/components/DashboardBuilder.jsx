import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDashboardStore } from '../store/useDashboardStore';
import { SaveDashboardModal } from './SaveDashboardModal';
import {
  Settings, BarChart2, PieChart as PieIcon, TrendingUp,
  Plus, Trash2, Hash, Filter, Percent, Save, ArrowRight,
  Type, Heading, MousePointer2, ChevronDown
} from 'lucide-react';
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { Widget } from './Widget';

export function DashboardBuilder() {
  const {
    dataset, schema, widgets,
    addWidget, removeWidget, updateWidget,
    layout: storeLayout, setLayout, setStep
  } = useDashboardStore();

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [selectedWidgetId, setSelectedWidgetId] = useState(null);

  const canvasRef = useRef(null);
  const settingsRefs = useRef({}); // refs for each widget's settings card

  // ─── Document-level click handler (bypasses all RGL/Recharts event blocking) ───
  useEffect(() => {
    const handleClick = (e) => {
      // Walk up DOM from clicked element looking for a widget
      const widgetEl = e.target.closest('[data-widget-id]');
      if (widgetEl) {
        setSelectedWidgetId(widgetEl.dataset.widgetId);
        return;
      }
      // If click was inside canvas but not on a widget → deselect
      if (canvasRef.current && canvasRef.current.contains(e.target)) {
        setSelectedWidgetId(null);
      }
    };

    document.addEventListener('click', handleClick, true); // capture phase
    return () => document.removeEventListener('click', handleClick, true);
  }, []);

  // Auto-scroll sidebar to selected widget's settings card
  useEffect(() => {
    if (selectedWidgetId && settingsRefs.current[selectedWidgetId]) {
      settingsRefs.current[selectedWidgetId].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [selectedWidgetId]);

  // Deselect when a widget is deleted
  const handleRemove = useCallback((id) => {
    removeWidget(id);
    setSelectedWidgetId(prev => (prev === id ? null : prev));
  }, [removeWidget]);

  const handleCreateWidget = () => {
    const newId = Date.now().toString();
    addWidget({
      id: newId,
      type: 'bar',
      title: 'New Chart',
      xAxis: schema?.[0]?.name || '',
      yAxis: schema?.find(c => c.type === 'number')?.name || '',
      aggType: 'sum',
      filters: []
    });
    // Auto-select new widget
    setTimeout(() => setSelectedWidgetId(newId), 50);
  };

  const layout = widgets.map((w, i) => {
    const isHeader = w.type === 'header';
    const isText = w.type === 'text';
    const targetMinH = isHeader ? 1 : isText ? 2 : 3;
    const existing = storeLayout?.find(l => l.i === w.id);
    if (existing) return { ...existing, minH: targetMinH };
    return {
      i: w.id, x: (i * 6) % 12, y: Infinity,
      w: isHeader ? 12 : 6, h: isHeader ? 1 : isText ? 3 : 4,
      minW: 3, minH: targetMinH
    };
  });

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">

      {/* ── Sidebar ── */}
      <div className="w-80 bg-surface border-r border-border flex flex-col overflow-hidden">

        {/* Action buttons */}
        <div className="p-5 border-b border-border space-y-3 shrink-0">
          <button
            onClick={() => setStep(4)}
            className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 py-2.5 rounded-lg transition-all font-medium"
          >
            Finalize & Download <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={handleCreateWidget}
            className="w-full flex items-center justify-center gap-1.5 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 py-2 rounded-lg transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Add Chart
          </button>
          <button
            onClick={() => setShowSaveModal(true)}
            className="w-full flex items-center justify-center gap-2 bg-surface hover:bg-background border border-border py-2 rounded-lg transition-colors text-sm font-medium text-textMain"
          >
            <Save className="w-3.5 h-3.5 text-textMuted" /> Save Dashboard
          </button>
        </div>

        {/* Settings panel */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
          {widgets.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-16 px-4 text-textMuted">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                <MousePointer2 className="w-6 h-6 text-primary" />
              </div>
              <p className="font-semibold text-textMain mb-1">No Widgets Yet</p>
              <p className="text-sm">Add a chart to start building.</p>
            </div>
          ) : !selectedWidgetId ? (
            <div className="flex flex-col items-center justify-center text-center py-12 px-4 text-textMuted">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                <MousePointer2 className="w-6 h-6 text-primary" />
              </div>
              <p className="font-semibold text-textMain mb-1">Select a Widget to Edit</p>
              <p className="text-sm">Click any chart on the canvas to load its settings here.</p>
              {/* Mini widget list for two-way sync */}
              <div className="mt-6 w-full space-y-1 text-left">
                {widgets.map((w, i) => (
                  <button
                    key={w.id}
                    onClick={() => setSelectedWidgetId(w.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-background border border-transparent hover:border-border text-sm transition-colors"
                  >
                    <BarChart2 className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="truncate">{w.title || `Widget ${i + 1}`}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // Focused settings for selected widget
            (() => {
              const widget = widgets.find(w => w.id === selectedWidgetId);
              if (!widget) return null;
              const index = widgets.findIndex(w => w.id === selectedWidgetId);
              return (
                <div
                  ref={el => { settingsRefs.current[widget.id] = el; }}
                  className="space-y-4"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <Settings className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <span className="font-semibold text-sm">
                        {widget.title || `Widget ${index + 1}`}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemove(widget.id)}
                      className="p-1.5 rounded-lg text-textMuted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete widget"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Title */}
                  {widget.type !== 'header' && widget.type !== 'text' && (
                    <div>
                      <label className="text-xs text-textMuted uppercase tracking-wider block mb-1">Title</label>
                      <input
                        type="text"
                        value={widget.title || ''}
                        onChange={(e) => updateWidget(widget.id, { title: e.target.value })}
                        className="w-full bg-background border border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                      />
                    </div>
                  )}

                  {/* Type */}
                  <div>
                    <label className="text-xs text-textMuted uppercase tracking-wider block mb-2">Chart Type</label>
                    <div className="flex flex-wrap gap-1">
                      {['bar', 'line', 'pie', 'card', 'percent', 'header', 'text'].map(t => (
                        <button
                          key={t} title={t}
                          onClick={() => updateWidget(widget.id, { type: t })}
                          className={`flex-1 min-w-[20%] py-1.5 rounded text-xs flex items-center justify-center gap-1 border transition-colors
                            ${widget.type === t ? 'bg-primary border-primary text-white' : 'bg-surface border-border text-textMuted hover:border-primary/50'}`}
                        >
                          {t === 'bar' && <BarChart2 className="w-3 h-3" />}
                          {t === 'line' && <TrendingUp className="w-3 h-3" />}
                          {t === 'pie' && <PieIcon className="w-3 h-3" />}
                          {t === 'card' && <Hash className="w-3 h-3" />}
                          {t === 'percent' && <Percent className="w-3 h-3" />}
                          {t === 'header' && <Heading className="w-3 h-3" />}
                          {t === 'text' && <Type className="w-3 h-3" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* X-Axis */}
                  {widget.type !== 'card' && widget.type !== 'percent' && widget.type !== 'header' && widget.type !== 'text' && (
                    <div>
                      <label className="text-xs text-textMuted uppercase tracking-wider block mb-1">X-Axis (Category)</label>
                      <select
                        value={widget.xAxis}
                        onChange={(e) => updateWidget(widget.id, { xAxis: e.target.value })}
                        className="w-full bg-background border border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-primary"
                      >
                        <option value="">Select Field</option>
                        {schema?.map(col => <option key={col.name} value={col.name}>{col.name}</option>)}
                      </select>
                    </div>
                  )}

                  {/* Y-Axis */}
                  {widget.type !== 'pie' && widget.type !== 'header' && widget.type !== 'text' && (
                    <div>
                      <label className="text-xs text-textMuted uppercase tracking-wider block mb-1">
                        {widget.type === 'card' || widget.type === 'percent' ? 'Metric (Value)' : 'Y-Axis (Value)'}
                      </label>
                      <select
                        value={widget.yAxis}
                        onChange={(e) => updateWidget(widget.id, { yAxis: e.target.value })}
                        className="w-full bg-background border border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-primary"
                      >
                        <option value="">Count (Auto)</option>
                        {schema?.filter(col => col.type === 'number').map(col => (
                          <option key={col.name} value={col.name}>{col.name}</option>
                        ))}
                      </select>
                      {widget.yAxis && (
                        <div className="mt-2 flex gap-1">
                          <button onClick={() => updateWidget(widget.id, { aggType: 'sum' })} className={`flex-1 py-1.5 text-xs font-medium border rounded transition-colors ${widget.aggType !== 'avg' ? 'bg-primary text-white border-primary' : 'bg-surface text-textMuted border-border'}`}>Sum</button>
                          <button onClick={() => updateWidget(widget.id, { aggType: 'avg' })} className={`flex-1 py-1.5 text-xs font-medium border rounded transition-colors ${widget.aggType === 'avg' ? 'bg-primary text-white border-primary' : 'bg-surface text-textMuted border-border'}`}>Average</button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Filters */}
                  {widget.type !== 'header' && widget.type !== 'text' && (
                    <div className="pt-3 border-t border-border">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs text-textMuted uppercase tracking-wider flex items-center gap-1">
                          <Filter className="w-3 h-3" /> Filters
                        </label>
                        <button
                          onClick={() => updateWidget(widget.id, { filters: [...(widget.filters || []), { column: '', operator: 'equals', value: '' }] })}
                          className="text-xs text-primary flex items-center gap-1 font-medium bg-primary/10 px-2 py-0.5 rounded hover:bg-primary/20 transition-colors"
                        >
                          <Plus className="w-3 h-3" /> Add
                        </button>
                      </div>
                      {(widget.filters || []).map((f, fIdx) => (
                        <div key={fIdx} className="bg-background border border-border rounded p-2 mb-2 space-y-2 relative group">
                          <button
                            onClick={() => {
                              const nf = [...(widget.filters || [])];
                              nf.splice(fIdx, 1);
                              updateWidget(widget.id, { filters: nf });
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                          <select
                            value={f.column}
                            onChange={(e) => { const nf = [...(widget.filters || [])]; nf[fIdx].column = e.target.value; updateWidget(widget.id, { filters: nf }); }}
                            className="w-full bg-surface border border-border rounded text-xs px-2 py-1.5 focus:outline-none focus:border-primary"
                          >
                            <option value="">Select Column</option>
                            {schema?.map(col => <option key={col.name} value={col.name}>{col.name}</option>)}
                          </select>
                          <div className="flex gap-1">
                            <select
                              value={f.operator}
                              onChange={(e) => { const nf = [...(widget.filters || [])]; nf[fIdx].operator = e.target.value; updateWidget(widget.id, { filters: nf }); }}
                              className="w-5/12 bg-surface border border-border rounded text-xs px-2 py-1.5 focus:outline-none focus:border-primary"
                            >
                              <option value="equals">=</option>
                              <option value="not_equals">!=</option>
                              <option value="contains">Contains</option>
                            </select>
                            <input
                              type="text" placeholder="Value..."
                              value={f.value}
                              onChange={(e) => { const nf = [...(widget.filters || [])]; nf[fIdx].value = e.target.value; updateWidget(widget.id, { filters: nf }); }}
                              className="w-7/12 bg-surface border border-border rounded text-xs px-2 py-1.5 focus:outline-none focus:border-primary placeholder-textMuted"
                            />
                          </div>
                        </div>
                      ))}
                      {(!widget.filters || widget.filters.length === 0) && (
                        <p className="text-xs text-textMuted italic text-center py-2 bg-surface/50 rounded border border-dashed border-border">No filters applied</p>
                      )}
                    </div>
                  )}

                  {/* Other widgets shortcut */}
                  {widgets.length > 1 && (
                    <div className="pt-3 border-t border-border">
                      <p className="text-xs text-textMuted uppercase tracking-wider mb-2">Other Widgets</p>
                      {widgets.filter(w => w.id !== selectedWidgetId).map((w, i) => (
                        <button
                          key={w.id}
                          onClick={() => setSelectedWidgetId(w.id)}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-background border border-transparent hover:border-border text-sm transition-colors text-left"
                        >
                          <BarChart2 className="w-3.5 h-3.5 text-textMuted shrink-0" />
                          <span className="truncate text-textMuted">{w.title || `Widget ${widgets.indexOf(w) + 1}`}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()
          )}
        </div>
      </div>

      {/* ── Main Canvas ── */}
      <div
        ref={canvasRef}
        className="flex-1 bg-background overflow-y-auto p-6 relative dashboard-canvas-container"
      >
        {widgets.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-textMuted p-8 text-center max-w-sm mx-auto">
            <PieIcon className="w-16 h-16 text-border mb-4" />
            <h3 className="text-xl font-medium text-textMain mb-2">Blank Canvas</h3>
            <p>Use the sidebar to add charts and connect them to your data.</p>
          </div>
        ) : (
          <GridLayout
            className="layout"
            layout={layout}
            onLayoutChange={(newLayout) => setLayout(newLayout)}
            cols={12}
            rowHeight={80}
            width={1200}
            isDraggable
            isResizable
            resizeHandles={['s', 'w', 'e', 'n', 'sw', 'nw', 'se', 'ne']}
          >
            {widgets.map(widget => {
              const isSelected = selectedWidgetId === widget.id;
              return (
                // data-widget-id is the key — document click handler uses .closest() to find this
                <div
                  key={widget.id}
                  data-widget-id={widget.id}
                  className={`h-full rounded-xl transition-all duration-150 ${
                    isSelected
                      ? 'ring-2 ring-primary ring-offset-2 ring-offset-background shadow-xl shadow-primary/15 scale-[1.005]'
                      : 'hover:ring-1 hover:ring-primary/30 hover:ring-offset-1 hover:ring-offset-background'
                  }`}
                >
                  <Widget config={widget} dataset={dataset} onRemove={handleRemove} />
                </div>
              );
            })}
          </GridLayout>
        )}
      </div>

      <SaveDashboardModal isOpen={showSaveModal} onClose={() => setShowSaveModal(false)} />
    </div>
  );
}
