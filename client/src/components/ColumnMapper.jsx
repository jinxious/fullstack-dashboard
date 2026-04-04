import React, { useState } from 'react';
import { ArrowRight, Check, AlertTriangle, X, ChevronDown } from 'lucide-react';

export function ColumnMapper({ mappings, uploadedSchema, onComplete, onCancel }) {
  const [editedMappings, setEditedMappings] = useState(
    mappings.map(m => ({ ...m }))
  );

  const updateMapping = (index, uploadedCol) => {
    setEditedMappings(prev => {
      const updated = [...prev];
      const colInfo = uploadedSchema.find(c => c.name === uploadedCol);
      updated[index] = {
        ...updated[index],
        uploadedCol: uploadedCol || null,
        uploadedType: colInfo?.type || null,
        confidence: uploadedCol ? 80 : 0,
        autoMatched: false
      };
      return updated;
    });
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (confidence >= 50) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
    return 'text-red-400 bg-red-500/10 border-red-500/20';
  };

  const getConfidenceIcon = (confidence) => {
    if (confidence >= 80) return <Check className="w-3.5 h-3.5" />;
    if (confidence >= 50) return <AlertTriangle className="w-3.5 h-3.5" />;
    return <X className="w-3.5 h-3.5" />;
  };

  const allMapped = editedMappings.every(m => m.uploadedCol);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-border rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-bold mb-1">Column Mapping</h3>
          <p className="text-sm text-textMuted">
            Map your uploaded file's columns to the template's expected columns. Auto-suggestions are shown.
          </p>
        </div>

        {/* Mappings */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {editedMappings.map((mapping, index) => (
            <div key={mapping.templateCol} className="flex items-center gap-3 p-3 bg-background rounded-lg border border-border">
              {/* Template column (left) */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{mapping.templateCol}</p>
                <p className="text-xs text-textMuted">{mapping.templateType}</p>
              </div>

              <ArrowRight className="w-4 h-4 text-textMuted shrink-0" />

              {/* Uploaded column (right - dropdown) */}
              <div className="flex-1 min-w-0">
                <select
                  value={mapping.uploadedCol || ''}
                  onChange={(e) => updateMapping(index, e.target.value)}
                  className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                >
                  <option value="">-- Select Column --</option>
                  {uploadedSchema.map(col => (
                    <option key={col.name} value={col.name}>
                      {col.name} ({col.type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Confidence badge */}
              <div className={`shrink-0 flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${getConfidenceColor(mapping.confidence)}`}>
                {getConfidenceIcon(mapping.confidence)}
                {mapping.confidence}%
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border flex items-center justify-between">
          <button
            onClick={onCancel}
            className="text-sm text-textMuted hover:text-textMain px-4 py-2 rounded-lg border border-border hover:bg-background transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onComplete(editedMappings)}
            disabled={!allMapped}
            className="flex items-center gap-2 bg-primary hover:bg-primaryHover text-white px-5 py-2.5 rounded-lg font-medium shadow-lg shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Apply Mappings
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
