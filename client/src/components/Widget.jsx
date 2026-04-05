import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, LabelList } from 'recharts';
import { Trash2 } from 'lucide-react';
import { useDashboardStore } from '../store/useDashboardStore';

const PALETTES = {
  default: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'],
  monochrome: ['#334155', '#475569', '#64748b', '#94a3b8', '#cbd5e1', '#e2e8f0', '#f1f5f9'],
  vibrant: ['#ff0a54', '#ff477e', '#ff7096', '#ff85a1', '#fbb1bd', '#f9bec7', '#ffe5ec'],
  pastel: ['#fec5bb', '#fcd5ce', '#fae1dd', '#f8edeb', '#e8e8e4', '#d8e2dc', '#ece4db']
};

export const aggregateData = (dataset, xKey, yKey, type, aggType, filters = []) => {
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

  if (type === 'card' || type === 'text' || type === 'header') {
    if (type === 'text' || type === 'header') return [];
    if (yKey) {
      let sum = 0;
      let count = 0;
      processedData.forEach(row => { if (typeof row[yKey] === 'number') { sum += row[yKey]; count++; } });
      if (aggType === 'avg') return count > 0 ? Number((sum / count).toFixed(2)) : 0;
      return sum;
    }
    return processedData.length;
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
        grouped[xVal].value += 1;
      }
      grouped[xVal].count += 1;
    });
    
    const result = Object.values(grouped).map(g => {
      if (yKey) {
        g.value = aggType === 'avg' ? Number((g.sum / g.count).toFixed(2)) : g.sum;
      }
      return g;
    });

    return result.sort((a,b) => b.value - a.value).slice(0, 15);
  }
  
  return processedData.slice(0, 100);
};

export const Widget = ({ config, dataset, onRemove, inFinalizeMode = false }) => {
  const { dashboardTheme, isExporting, updateWidget } = useDashboardStore();
  const data = useMemo(() => aggregateData(dataset, config.xAxis, config.yAxis, config.type, config.aggType, config.filters), [dataset, config]);
  
  const colors = PALETTES[dashboardTheme.chartPalette] || PALETTES.default;
  const primaryColor = colors[0];

  const handleTitleChange = (e) => {
    updateWidget(config.id, { title: e.target.value });
  };

  const renderChart = () => {
    switch (config.type) {
      case 'header':
        return (
          <div className="flex items-center w-full h-full p-4 border-b-2 border-primary/20">
            {inFinalizeMode && !isExporting ? (
              <input
                type="text"
                value={config.content || 'Section Header'}
                onChange={(e) => updateWidget(config.id, { content: e.target.value })}
                className="w-full text-2xl font-bold bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary/20 p-2 rounded"
              />
            ) : (
              <h2 className="text-2xl font-bold">{config.content || 'Section Header'}</h2>
            )}
          </div>
        );
      case 'text':
        return (
          <div className="w-full h-full p-4 overflow-y-auto">
            {inFinalizeMode && !isExporting ? (
              <textarea
                value={config.content || ''}
                onChange={(e) => updateWidget(config.id, { content: e.target.value })}
                placeholder="Type your notes or insights here..."
                className="w-full h-full resize-none bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary/20 p-2 rounded text-textMain"
              />
            ) : (
              <div className="whitespace-pre-wrap text-textMain">{config.content || 'No notes provided.'}</div>
            )}
          </div>
        );
      case 'card':
        return (
          <div className="flex flex-col items-center justify-center h-full w-full p-4 text-center">
            <p className="text-textMuted text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: primaryColor }}>
              {config.yAxisLabel || config.yAxis ? `${config.aggType === 'avg' ? 'Avg' : 'Total'} ${config.yAxisLabel || config.yAxis}` : `Total Rows`}
            </p>
            <p className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r truncate max-w-full" style={{ backgroundImage: `linear-gradient(to right, ${colors[0]}, ${colors[1] || colors[0]})` }}>
              {typeof data === 'number' ? data.toLocaleString() : data}
            </p>
          </div>
        );
      case 'percent':
        return (
          <div className="flex flex-col items-center justify-center h-full w-full p-4 text-center">
            <p className="text-textMuted text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: primaryColor }}>
              {config.yAxisLabel || config.yAxis ? `% of Total ${config.yAxisLabel || config.yAxis}` : `% of Total Rows`}
            </p>
            <p className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r truncate max-w-full" style={{ backgroundImage: `linear-gradient(to right, ${colors[1] || colors[0]}, ${colors[2] || colors[0]})` }}>
              {data}
            </p>
          </div>
        );
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: isExporting ? 35 : 20, right: isExporting ? 35 : 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="name" stroke="var(--color-textMuted)" tick={{fill: 'var(--color-textMuted)'}} angle={-45} textAnchor="end" height={60} />
              <YAxis stroke="var(--color-textMuted)" tick={{fill: 'var(--color-textMuted)'}} />
              {!isExporting && <Tooltip contentStyle={{backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', color: 'var(--color-textMain)'}} />}
              <Bar dataKey="value" fill={primaryColor} radius={[4, 4, 0, 0]}>
                {isExporting && <LabelList dataKey="value" position="top" fill="var(--color-textMain)" fontSize={12} offset={10} />}
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: isExporting ? 30 : 0, right: isExporting ? 30 : 0, left: isExporting ? 30 : 0, bottom: isExporting ? 30 : 20 }}>
              {!isExporting && <Tooltip contentStyle={{backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', color: 'var(--color-textMain)'}} />}
              <Pie 
                data={data} 
                dataKey="value" 
                nameKey="name" 
                cx="50%" 
                cy="50%" 
                innerRadius={isExporting ? "30%" : "50%"} 
                outerRadius={isExporting ? "60%" : "80%"} 
                paddingAngle={5} 
                label={isExporting ? { fill: 'var(--color-textMain)', fontSize: 12 } : false}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{color: 'var(--color-textMuted)'}}/>
            </PieChart>
          </ResponsiveContainer>
        );
      case 'line':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: isExporting ? 35 : 20, right: isExporting ? 35 : 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey={config.xAxis} stroke="var(--color-textMuted)" tick={{fill: 'var(--color-textMuted)'}} />
              <YAxis stroke="var(--color-textMuted)" tick={{fill: 'var(--color-textMuted)'}} />
              {!isExporting && <Tooltip contentStyle={{backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', color: 'var(--color-textMain)'}} />}
              <Line type="monotone" dataKey="value" stroke={primaryColor} strokeWidth={3} dot={{r: 4, fill: primaryColor}} activeDot={{r: 8}}>
                {isExporting && <LabelList dataKey="value" position="top" fill="var(--color-textMain)" fontSize={12} offset={10} />}
              </Line>
            </LineChart>
          </ResponsiveContainer>
        );
      default:
        return <div className="flex items-center justify-center h-full text-textMuted">Select chart type</div>;
    }
  };

  const isTextType = config.type === 'header' || config.type === 'text';

  return (
    <div className={`bg-surface border border-border flex flex-col h-full rounded-xl shadow-sm group ${isExporting ? 'border-none shadow-none !bg-transparent !overflow-visible' : 'overflow-hidden'}`}>
      {/* Header bar only shows if not exporting, or if it's not a text widget */}
      {(!isExporting || (!isTextType && config.title)) && !isTextType && (
        <div className={`flex items-center justify-between px-4 py-3 border-b border-border bg-surface/80 ${isExporting ? '!bg-transparent !border-transparent' : ''}`}>
          {inFinalizeMode && !isExporting ? (
            <input 
              type="text" 
              value={config.title || ''} 
              onChange={handleTitleChange}
              placeholder="Chart Title"
              className="font-medium text-sm w-full bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary/20 rounded px-1"
            />
          ) : (
            <h3 className="font-bold text-sm truncate pr-2">{config.title || 'Untitled Chart'}</h3>
          )}
          {!isExporting && onRemove && (
            <button onMouseDown={(e) => { e.stopPropagation(); onRemove(config.id); }} className="text-textMuted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity relative z-50 pointer-events-auto">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
      <div className={`flex-1 p-4 ${isTextType ? 'p-0' : 'min-h-[200px]'}`}>
        {renderChart()}
      </div>
    </div>
  );
};
