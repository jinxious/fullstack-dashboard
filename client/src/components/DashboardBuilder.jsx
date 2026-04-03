import React, { useMemo } from 'react';
import { useDashboardStore } from '../store/useDashboardStore';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts';
import { Settings, BarChart2, PieChart as PieIcon, TrendingUp, Plus, Trash2, Hash, Filter, Percent } from 'lucide-react';
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

const aggregateData = (dataset, xKey, yKey, type, aggType, filters = []) => {
  if (!dataset || dataset.length === 0) return [];

  let processedData = dataset;
  if (filters && filters.length > 0) {
    processedData = dataset.filter(row => {
      return filters.every(f => {
        if (!f.column || f.value === undefined || f.value === '') return true;
        const rowVal = String(row[f.column] || '').toLowerCase();
        const filterVal = String(f.value).toLowerCase();
        if (f.operator === 'equals') return rowVal === filterVal;
        if (f.operator === 'not_equals') return rowVal !== filterVal;
        if (f.operator === 'contains') return rowVal.includes(filterVal);
        return true;
      });
    });
  }

  if (type === 'card') {
    if (yKey) {
      let sum = 0;
      let count = 0;
      processedData.forEach(row => { if (typeof row[yKey] === 'number') { sum += row[yKey]; count++; } });
      if (aggType === 'avg') return count > 0 ? Number((sum / count).toFixed(2)) : 0;
      return sum;
    }
    return processedData.length; // default to count
  }

  if (type === 'percent') {
    if (dataset.length === 0) return '0%';
    if (yKey) {
      let filteredSum = 0;
      let totalSum = 0;
      let filteredCount = 0;
      let totalCount = 0;
      processedData.forEach(row => { if (typeof row[yKey] === 'number') { filteredSum += row[yKey]; filteredCount++; } });
      dataset.forEach(row => { if (typeof row[yKey] === 'number') { totalSum += row[yKey]; totalCount++; } });
      
      let finalFiltered = aggType === 'avg' ? (filteredCount > 0 ? filteredSum/filteredCount : 0) : filteredSum;
      let finalTotal = aggType === 'avg' ? (totalCount > 0 ? totalSum/totalCount : 0) : totalSum;
      
      return finalTotal === 0 ? '0%' : ((finalFiltered / finalTotal) * 100).toFixed(1) + '%';
    }
    return ((processedData.length / dataset.length) * 100).toFixed(1) + '%';
  }

  if (!xKey) return [];
  
  if (type === 'pie' || type === 'bar' || type === 'line') {
    const grouped = {};
    
    // Use the full dataset to guarantee all categories exist on the X-axis
    dataset.forEach(row => {
      const xVal = row[xKey] || 'Unknown';
      if (!grouped[xVal]) {
        grouped[xVal] = { name: xVal, value: 0, sum: 0, count: 0 };
      }
    });

    processedData.forEach(row => {
      const xVal = row[xKey] || 'Unknown';
      if (yKey && typeof row[yKey] === 'number') {
        grouped[xVal].sum += row[yKey];
      } else {
        grouped[xVal].value += 1; // count
      }
      grouped[xVal].count += 1;
    });
    
    // Convert to array and apply average if needed
    const result = Object.values(grouped).map(g => {
      if (yKey) {
        g.value = aggType === 'avg' ? Number((g.sum / g.count).toFixed(2)) : g.sum;
      }
      return g;
    });

    return result.sort((a,b) => b.value - a.value).slice(0, 15); // limit points
  }
  
  // For scatter/line without agg
  return processedData.slice(0, 100); // sample
};

const Widget = ({ config, dataset, onRemove }) => {
  const data = useMemo(() => aggregateData(dataset, config.xAxis, config.yAxis, config.type, config.aggType, config.filters), [dataset, config]);

  const renderChart = () => {
    switch (config.type) {
      case 'card':
        return (
          <div className="flex flex-col items-center justify-center h-full w-full p-4 text-center">
            <p className="text-textMuted text-sm font-semibold uppercase tracking-widest mb-3">
              {config.yAxis ? `${config.aggType === 'avg' ? 'Avg' : 'Total'} ${config.yAxis}` : `Total Rows`}
            </p>
            <p className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500 truncate max-w-full">
              {typeof data === 'number' ? data.toLocaleString() : data}
            </p>
          </div>
        );
      case 'percent':
        return (
          <div className="flex flex-col items-center justify-center h-full w-full p-4 text-center">
            <p className="text-textMuted text-sm font-semibold uppercase tracking-widest mb-3">
              {config.yAxis ? `% of Total ${config.yAxis}` : `% of Total Rows`}
            </p>
            <p className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-green-500 truncate max-w-full">
              {data}
            </p>
          </div>
        );
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" tick={{fill: '#94a3b8'}} angle={-45} textAnchor="end" height={60} />
              <YAxis stroke="#94a3b8" tick={{fill: '#94a3b8'}} />
              <Tooltip contentStyle={{backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px'}} />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip contentStyle={{backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px'}} />
              <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{color: '#94a3b8'}}/>
            </PieChart>
          </ResponsiveContainer>
        );
      case 'line':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey={config.xAxis} stroke="#94a3b8" tick={{fill: '#94a3b8'}} />
              <YAxis stroke="#94a3b8" tick={{fill: '#94a3b8'}} />
              <Tooltip contentStyle={{backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px'}} />
              <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} dot={{r: 4}} activeDot={{r: 8}} />
            </LineChart>
          </ResponsiveContainer>
        );
      default:
        return <div className="flex items-center justify-center h-full text-textMuted">Select chart type</div>;
    }
  };

  return (
    <div className="bg-surface border border-border flex flex-col h-full rounded-xl overflow-hidden shadow-sm group">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface/80">
        <h3 className="font-medium text-sm truncate pr-2">{config.title || 'Untitled Chart'}</h3>
        <button onMouseDown={(e) => { e.stopPropagation(); onRemove(config.id); }} className="text-textMuted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity relative z-50 pointer-events-auto">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 p-4 min-h-[200px]">
        {renderChart()}
      </div>
    </div>
  );
};

export function DashboardBuilder() {
  const { dataset, schema, widgets, addWidget, removeWidget, updateWidget, layout: storeLayout, setLayout } = useDashboardStore();

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
    const existing = storeLayout?.find(l => l.i === w.id);
    if (existing) return existing;
    return { i: w.id, x: (i * 6) % 12, y: Infinity, w: 6, h: 4, minW: 3, minH: 3 };
  });

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Sidebar Controls */}
      <div className="w-80 bg-surface border-r border-border flex flex-col items-stretch overflow-y-auto custom-scrollbar">
        <div className="p-5 border-b border-border sticky top-0 bg-surface z-10">
          <button 
            onClick={handleCreateWidget}
            className="w-full flex items-center justify-center gap-2 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 py-2.5 rounded-lg transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Widget
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
                <div>
                  <label className="text-xs text-textMuted uppercase tracking-wider block mb-1">Title</label>
                  <input 
                    type="text" 
                    value={widget.title}
                    onChange={(e) => updateWidget(widget.id, { title: e.target.value })}
                    className="w-full bg-surface border border-border rounded items-center px-3 py-1.5 text-sm focus:outline-none focus:border-primary"
                  />
                </div>
                
                <div>
                  <label className="text-xs text-textMuted uppercase tracking-wider block mb-1">Type</label>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {['bar', 'line', 'pie', 'card', 'percent'].map(t => (
                      <button 
                        key={t}
                        onClick={() => updateWidget(widget.id, { type: t })}
                        className={`flex-1 min-w-[30%] py-1.5 rounded text-xs flex items-center justify-center gap-1 border
                          ${widget.type === t ? 'bg-primary border-primary text-white' : 'bg-surface border-border text-textMuted hover:border-textMuted'}`}
                      >
                        {t === 'bar' && <BarChart2 className="w-3 h-3" />}
                        {t === 'line' && <TrendingUp className="w-3 h-3" />}
                        {t === 'pie' && <PieIcon className="w-3 h-3" />}
                        {t === 'card' && <Hash className="w-3 h-3" />}
                        {t === 'percent' && <Percent className="w-3 h-3" />}
                        <span className="capitalize">{t}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {widget.type !== 'card' && widget.type !== 'percent' && (
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

                {widget.type !== 'pie' && (
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
                
                {/* Filters Section */}
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
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 bg-background overflow-y-auto p-6 relative dashboard-canvas-container">
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
          >
            {widgets.map(widget => (
              <div key={widget.id}>
                <Widget config={widget} dataset={dataset} onRemove={removeWidget} />
              </div>
            ))}
          </GridLayout>
        )}
      </div>
    </div>
  );
}
