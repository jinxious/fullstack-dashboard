import React, { useState } from 'react';
import { useDashboardStore } from '../store/useDashboardStore';
import { useFilterStore } from '../store/useFilterStore';
import { SaveDashboardModal } from './SaveDashboardModal';
import { FilterPanel } from './FilterPanel';
import { Settings, BarChart2, PieChart as PieIcon, TrendingUp, Plus, Trash2, Hash, Filter, Percent, Save, ArrowRight, Type, Heading } from 'lucide-react';
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { Widget } from './Widget';

export function DashboardBuilder() {
  const { dataset, schema, widgets, addWidget, removeWidget, updateWidget, layout: storeLayout, setLayout, setStep } = useDashboardStore();
  const { filteredDataset } = useFilterStore();
  const activeDataset = filteredDataset ?? dataset;
  const [showSaveModal, setShowSaveModal] = useState(false);

  const handleCreateWidget = () => {
    addWidget({
      id: Date.now().toString(),
      type: 'bar',
      title: 'New Chart',
      xAxis: schema?.[0]?.name || '',
      yAxis: schema?.find(c => c.type === 'number')?.name || '',
      aggType: 'sum',
      filters: []
    });
  };

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

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Sidebar Controls */}
      <div className="w-80 bg-surface border-r border-border flex flex-col items-stretch overflow-y-auto custom-scrollbar">
        <div className="p-5 border-b border-border sticky top-0 bg-surface z-10 space-y-3">
          <button 
            onClick={() => setStep(4)}
            className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 py-2.5 rounded-lg transition-all font-medium"
          >
            Finalize & Download
            <ArrowRight className="w-4 h-4" />
          </button>
          <button 
            onClick={handleCreateWidget}
            className="w-full flex items-center justify-center gap-1.5 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 py-2 rounded-lg transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Chart
          </button>
          <button
            onClick={() => setShowSaveModal(true)}
            className="w-full flex items-center justify-center gap-2 bg-surface hover:bg-background border border-border py-2 rounded-lg transition-colors text-sm font-medium text-textMain"
          >
            <Save className="w-3.5 h-3.5 text-textMuted" />
            Save Dashboard
          </button>
        </div>

        <div className="p-4 space-y-6">
          {widgets.length === 0 && (
            <div className="text-center p-6 border border-dashed border-border rounded-lg text-textMuted">
              Add a widget to start building your dashboard.
            </div>
          )}
          {widgets.map((widget, index) => (
            <div key={widget.id} className="bg-background rounded-lg border border-border p-4">
              <div className="mb-3 flex items-center gap-2">
                <Settings className="w-4 h-4 text-primary" />
                <span className="font-semibold text-sm">Widget {index + 1}</span>
              </div>
              
              <div className="space-y-3">
                {widget.type !== 'header' && widget.type !== 'text' && (
                  <div>
                    <label className="text-xs text-textMuted uppercase tracking-wider block mb-1">Title</label>
                    <input 
                      type="text" 
                      value={widget.title || ''}
                      onChange={(e) => updateWidget(widget.id, { title: e.target.value })}
                      className="w-full bg-surface border border-border rounded items-center px-3 py-1.5 text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                )}
                
                <div>
                  <label className="text-xs text-textMuted uppercase tracking-wider block mb-1">Type</label>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {['bar', 'line', 'pie', 'card', 'percent', 'header', 'text'].map(t => (
                      <button 
                        key={t}
                        onClick={() => updateWidget(widget.id, { type: t })}
                        className={`flex-1 min-w-[20%] py-1.5 rounded text-xs flex items-center justify-center gap-1 border
                          ${widget.type === t ? 'bg-primary border-primary text-white' : 'bg-surface border-border text-textMuted hover:border-textMuted'}`}
                        title={t}
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

                {widget.type !== 'card' && widget.type !== 'percent' && widget.type !== 'header' && widget.type !== 'text' && (
                  <div>
                    <label className="text-xs text-textMuted uppercase tracking-wider block mb-1">X-Axis (Category/Label)</label>
                    <select 
                      value={widget.xAxis}
                      onChange={(e) => updateWidget(widget.id, { xAxis: e.target.value })}
                      className="w-full bg-surface border border-border rounded items-center px-3 py-1.5 text-sm focus:outline-none focus:border-primary"
                    >
                      <option value="">Select Field</option>
                      {schema?.map(col => (
                        <option key={col.name} value={col.name}>{col.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {widget.type !== 'pie' && widget.type !== 'header' && widget.type !== 'text' && (
                  <div>
                    <label className="text-xs text-textMuted uppercase tracking-wider block mb-1">
                      {widget.type === 'card' || widget.type === 'percent' ? 'Metric (Value)' : 'Y-Axis (Value)'}
                    </label>
                    <select 
                      value={widget.yAxis}
                      onChange={(e) => updateWidget(widget.id, { yAxis: e.target.value })}
                      className="w-full bg-surface border border-border rounded items-center px-3 py-1.5 text-sm focus:outline-none focus:border-primary"
                    >
                      <option value="">Count (Auto)</option>
                      {schema?.filter(col => col.type === 'number').map(col => (
                        <option key={col.name} value={col.name}>{col.name}</option>
                      ))}
                    </select>
                    {widget.yAxis && (
                      <div className="mt-2 flex gap-1">
                        <button onClick={() => updateWidget(widget.id, { aggType: 'sum' })} className={`flex-1 py-1.5 text-xs font-medium border rounded transition-colors ${widget.aggType !== 'avg' ? 'bg-primary text-white border-primary shadow' : 'bg-surface text-textMuted border-border hover:bg-surface/80'}`}>Sum</button>
                        <button onClick={() => updateWidget(widget.id, { aggType: 'avg' })} className={`flex-1 py-1.5 text-xs font-medium border rounded transition-colors ${widget.aggType === 'avg' ? 'bg-primary text-white border-primary shadow' : 'bg-surface text-textMuted border-border hover:bg-surface/80'}`}>Average</button>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Filters Section (Charts only) */}
                {widget.type !== 'header' && widget.type !== 'text' && (
                  <div className="pt-2 border-t border-border mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs text-textMuted uppercase tracking-wider flex items-center gap-1">
                        <Filter className="w-3 h-3" /> Filters
                      </label>
                      <button 
                        onClick={() => updateWidget(widget.id, { filters: [...(widget.filters || []), { column: '', operator: 'equals', value: '' }] })}
                        className="text-xs text-primary hover:underline flex items-center gap-1 font-medium bg-primary/10 px-2 py-0.5 rounded"
                      >
                        <Plus className="w-3 h-3" /> Add
                      </button>
                    </div>
                    
                    {(widget.filters || []).map((f, fIdx) => (
                      <div key={fIdx} className="bg-background border border-border rounded p-2 mb-2 space-y-2 relative group mt-2">
                        <button 
                          onClick={() => {
                            const newFilters = [...(widget.filters || [])];
                            newFilters.splice(fIdx, 1);
                            updateWidget(widget.id, { filters: newFilters });
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                        <select 
                          value={f.column}
                          onChange={(e) => {
                            const newFilters = [...(widget.filters || [])];
                            newFilters[fIdx].column = e.target.value;
                            updateWidget(widget.id, { filters: newFilters });
                          }}
                          className="w-full bg-surface border border-border rounded text-xs px-2 py-1.5 focus:outline-none focus:border-primary"
                        >
                          <option value="">Select Column</option>
                          {schema?.map(col => <option key={col.name} value={col.name}>{col.name}</option>)}
                        </select>
                        
                        <div className="flex gap-1">
                          <select 
                            value={f.operator}
                            onChange={(e) => {
                              const newFilters = [...(widget.filters || [])];
                              newFilters[fIdx].operator = e.target.value;
                              updateWidget(widget.id, { filters: newFilters });
                            }}
                            className="w-5/12 bg-surface border border-border rounded text-xs px-2 py-1.5 focus:outline-none focus:border-primary"
                          >
                            <option value="equals">=</option>
                            <option value="not_equals">!=</option>
                            <option value="contains">Contains</option>
                          </select>
                          <input 
                            type="text" 
                            placeholder="Value..."
                            value={f.value}
                            onChange={(e) => {
                              const newFilters = [...(widget.filters || [])];
                              newFilters[fIdx].value = e.target.value;
                              updateWidget(widget.id, { filters: newFilters });
                            }}
                            className="w-7/12 bg-surface border border-border rounded text-xs px-2 py-1.5 focus:outline-none focus:border-primary placeholder-textMuted"
                          />
                        </div>
                      </div>
                    ))}
                    {(!widget.filters || widget.filters.length === 0) && (
                      <p className="text-xs text-textMuted italic text-center py-2 bg-surface/50 rounded border border-dashed border-border mt-2">
                        No filters applied
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 flex flex-col bg-background overflow-hidden dashboard-canvas-container">
        <FilterPanel />
        <div className="flex-1 overflow-y-auto p-6 relative">
        {widgets.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-textMuted p-8 text-center max-w-sm mx-auto">
            <PieIcon className="w-16 h-16 text-border mb-4" />
            <h3 className="text-xl font-medium text-textMain mb-2">Blank Canvas</h3>
            <p>Your dashboard is empty. Use the sidebar to add charts and connect them to your data.</p>
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
            {widgets.map(widget => (
              <div key={widget.id}>
                <Widget config={widget} dataset={activeDataset} onRemove={removeWidget} />
              </div>
            ))}
          </GridLayout>
        )}
        </div>
      </div>

      <SaveDashboardModal isOpen={showSaveModal} onClose={() => setShowSaveModal(false)} />
    </div>
  );
}
