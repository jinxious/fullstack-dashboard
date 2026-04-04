import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardStore } from '../store/useDashboardStore';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { ColumnMapper } from './ColumnMapper';
import {
  FileStack, Trash2, Plus, Loader2, Upload, Layers,
  ArrowRight, Clock
} from 'lucide-react';

export function TemplateLibrary() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [applyingFile, setApplyingFile] = useState(null);
  const [mappingData, setMappingData] = useState(null);
  const navigate = useNavigate();
  const { loadDashboard } = useDashboardStore();

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/templates');
      setTemplates(res.data.templates || []);
    } catch (err) {
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this template?')) return;
    try {
      await api.delete(`/api/templates/${id}`);
      setTemplates(prev => prev.filter(t => (t._id || t.id) !== id));
      toast.success('Template deleted');
    } catch (err) {
      toast.error('Failed to delete template');
    }
  };

  const handleApplyClick = (template) => {
    setSelectedTemplate(template);
    setShowUploadModal(true);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setApplyingFile(file);

    const formData = new FormData();
    formData.append('file', file);

    try {
      // First, upload the file to get schema
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const uploadRes = await api.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const uploadedSchema = uploadRes.data.schema;
      const uploadedData = uploadRes.data.data;
      const uploadedFilename = uploadRes.data.filename;

      // Then apply template to get column mappings
      const templateId = selectedTemplate._id || selectedTemplate.id;
      const applyRes = await api.post(`/api/templates/${templateId}/apply`, {
        uploadedSchema
      });

      if (applyRes.data.matchStatus === 'full') {
        // All columns auto-matched — go straight to dashboard
        const remappedWidgets = remapWidgets(
          applyRes.data.template.widgets,
          applyRes.data.columnMappings
        );
        loadDashboard({
          title: `${applyRes.data.template.name} — Applied`,
          schema: uploadedSchema,
          widgets: remappedWidgets,
          layout: applyRes.data.template.layout,
          dataFilename: uploadedFilename
        }, uploadedData);

        toast.success('Template applied successfully!');
        setShowUploadModal(false);
        navigate('/dashboard');
      } else {
        // Partial or no match — show column mapper
        setMappingData({
          template: applyRes.data.template,
          columnMappings: applyRes.data.columnMappings,
          uploadedSchema,
          uploadedData,
          uploadedFilename
        });
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to process file');
    } finally {
      setApplyingFile(null);
    }
  };

  const remapWidgets = (widgets, mappings) => {
    return widgets.map(w => {
      const newWidget = { ...w };
      // Remap xAxis
      const xMap = mappings.find(m => m.templateCol === w.xAxis);
      if (xMap && xMap.uploadedCol) newWidget.xAxis = xMap.uploadedCol;
      // Remap yAxis
      const yMap = mappings.find(m => m.templateCol === w.yAxis);
      if (yMap && yMap.uploadedCol) newWidget.yAxis = yMap.uploadedCol;
      // Remap filters
      if (w.filters) {
        newWidget.filters = w.filters.map(f => {
          const fMap = mappings.find(m => m.templateCol === f.column);
          return { ...f, column: fMap?.uploadedCol || f.column };
        });
      }
      return newWidget;
    });
  };

  const handleMappingComplete = (finalMappings) => {
    if (!mappingData) return;

    const remappedWidgets = remapWidgets(mappingData.template.widgets, finalMappings);
    loadDashboard({
      title: `${mappingData.template.name} — Applied`,
      schema: mappingData.uploadedSchema,
      widgets: remappedWidgets,
      layout: mappingData.template.layout,
      dataFilename: mappingData.uploadedFilename
    }, mappingData.uploadedData);

    toast.success('Template applied with your mappings!');
    setMappingData(null);
    setShowUploadModal(false);
    navigate('/dashboard');
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Layers className="w-6 h-6 text-primary" />
            Templates
          </h2>
          <p className="text-textMuted mt-1">Reusable dashboard templates for quick setup</p>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      )}

      {/* Empty State */}
      {!loading && templates.length === 0 && (
        <div className="text-center py-20 border border-dashed border-border rounded-2xl bg-surface/50">
          <FileStack className="w-16 h-16 text-border mx-auto mb-4" />
          <h3 className="text-xl font-medium mb-2">No templates yet</h3>
          <p className="text-textMuted mb-6 max-w-sm mx-auto">
            Build a dashboard and save it as a template to reuse with new data files.
          </p>
        </div>
      )}

      {/* Templates Grid */}
      {!loading && templates.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {templates.map((tmpl) => {
            const id = tmpl._id || tmpl.id;
            return (
              <div
                key={id}
                className="bg-surface border border-border rounded-xl overflow-hidden hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-500" />
                <div className="p-5">
                  <h3 className="font-semibold text-lg truncate mb-1">{tmpl.name}</h3>
                  {tmpl.description && (
                    <p className="text-sm text-textMuted mb-3 line-clamp-2">{tmpl.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-textMuted mb-4">
                    <span className="flex items-center gap-1">
                      <FileStack className="w-3 h-3" />
                      {tmpl.expectedColumns?.length || 0} columns
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(tmpl.createdAt)}
                    </span>
                  </div>

                  {/* Expected columns */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {(tmpl.expectedColumns || []).slice(0, 4).map((col) => (
                      <span key={col.name} className="text-[10px] px-2 py-0.5 bg-background border border-border rounded-full text-textMuted">
                        {col.name}
                      </span>
                    ))}
                    {(tmpl.expectedColumns || []).length > 4 && (
                      <span className="text-[10px] px-2 py-0.5 bg-background border border-border rounded-full text-textMuted">
                        +{tmpl.expectedColumns.length - 4} more
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApplyClick(tmpl)}
                      className="flex-1 flex items-center justify-center gap-1 text-sm font-medium bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 py-2 rounded-lg transition-colors border border-emerald-500/20"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Apply to File
                    </button>
                    <button
                      onClick={() => handleDelete(id)}
                      className="p-2 text-textMuted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-border"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal for Apply */}
      {showUploadModal && !mappingData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-border rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold mb-2">Apply Template: {selectedTemplate?.name}</h3>
            <p className="text-textMuted text-sm mb-6">
              Upload an Excel or CSV file. We'll match columns automatically.
            </p>

            <label className="block border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors">
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
              />
              {applyingFile ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
                  <p className="text-sm text-textMuted">Analyzing {applyingFile.name}...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <Upload className="w-8 h-8 text-textMuted mb-2" />
                  <p className="text-sm font-medium">Drag & drop or click to upload</p>
                  <p className="text-xs text-textMuted mt-1">CSV, XLSX, XLS</p>
                </div>
              )}
            </label>

            <button
              onClick={() => { setShowUploadModal(false); setSelectedTemplate(null); }}
              className="mt-4 w-full text-sm text-textMuted hover:text-textMain py-2 rounded-lg border border-border hover:bg-background transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Column Mapper Modal */}
      {mappingData && (
        <ColumnMapper
          mappings={mappingData.columnMappings}
          uploadedSchema={mappingData.uploadedSchema}
          onComplete={handleMappingComplete}
          onCancel={() => { setMappingData(null); setShowUploadModal(false); }}
        />
      )}
    </div>
  );
}
