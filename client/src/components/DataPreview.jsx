import React from 'react';
import { useDashboardStore } from '../store/useDashboardStore';
import { ArrowRight, Table as TableIcon, Hash, Type, Calendar } from 'lucide-react';

export function DataPreview() {
  const { dataset, schema, setStep } = useDashboardStore();

  if (!dataset || !schema) return null;

  const getIconForType = (type) => {
    switch (type) {
      case 'number': return <Hash className="w-4 h-4 text-blue-400" />;
      case 'date': return <Calendar className="w-4 h-4 text-green-400" />;
      default: return <Type className="w-4 h-4 text-yellow-400" />;
    }
  };

  const previewData = dataset.slice(0, 10); // Show first 10 rows

  return (
    <div className="p-8 max-w-7xl mx-auto h-[calc(100vh-64px)] flex flex-col">
      <div className="flex items-center justify-between mb-8 shrink-0">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <TableIcon className="w-6 h-6 text-primary" />
            Data Profile
          </h2>
          <p className="text-textMuted mt-1">We've analyzed your data structure. Check if it looks correct.</p>
        </div>
        <button
          onClick={() => setStep(3)}
          className="flex items-center gap-2 bg-primary hover:bg-primaryHover text-white px-6 py-2.5 rounded-lg active:scale-95 transition-all font-medium shadow-lg shadow-primary/20"
        >
          Continue to Builder
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 shrink-0">
        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-textMuted text-sm font-medium mb-1">Total Rows</p>
          <p className="text-3xl font-bold">{dataset.length.toLocaleString()}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-textMuted text-sm font-medium mb-1">Total Columns</p>
          <p className="text-3xl font-bold">{schema.length}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-textMuted text-sm font-medium mb-1">Numeric Columns</p>
          <p className="text-3xl font-bold">{schema.filter(c => c.type === 'number').length}</p>
        </div>
      </div>

      {/* Table Preview */}
      <div className="bg-surface border border-border rounded-xl flex-1 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border bg-surface/50">
          <h3 className="font-semibold">Data Preview (First 10 rows)</h3>
        </div>
        <div className="overflow-auto flex-1 p-0 custom-scrollbar">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-textMuted uppercase bg-surface sticky top-0 border-b border-border z-10">
              <tr>
                {schema.map((col, i) => (
                  <th key={col.name} className="px-6 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getIconForType(col.type)}
                      {col.name}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewData.map((row, i) => (
                <tr key={i} className="border-b border-border/50 hover:bg-white/5 transition-colors">
                  {schema.map((col) => (
                    <td key={col.name} className="px-6 py-4 truncate max-w-[200px]" title={row[col.name]}>
                      {row[col.name]?.toString() || '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
