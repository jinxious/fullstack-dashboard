import React from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { useDashboardStore } from '../store/useDashboardStore';
import axios from 'axios';

export function UploadSection() {
  const { setDataset, setUploading, setUploadError, isUploading, uploadError, setStep } = useDashboardStore();

  const onDrop = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await axios.post(`${apiUrl}/api/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setDataset(response.data.data, response.data.schema, response.data.filename);
    } catch (err) {
      setUploadError(err.response?.data?.message || 'Error parsing file. Ensure it is a valid CSV or Excel.');
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1
  });

  return (
    <div className="flex flex-col items-center justify-center p-8 w-full max-w-2xl mx-auto mt-20">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
          Intelligent Data Dashboard
        </h2>
        <p className="text-textMuted text-lg">
          Upload your CSV or Excel file to instantly build powerful, interactive dashboards.
        </p>
      </div>

      <div
        {...getRootProps()}
        className={`w-full border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200
          ${isDragActive ? 'border-primary bg-primary/10' : 'border-border bg-surface hover:border-primary/50'}`}
      >
        <input {...getInputProps()} />
        
        {isUploading ? (
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-lg font-medium text-textMain">Analyzing your data...</p>
            <p className="text-sm text-textMuted mt-2">Extracting structure, types, and stats.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <UploadCloud className={`w-16 h-16 mb-4 ${isDragActive ? 'text-primary' : 'text-textMuted'}`} />
            <p className="text-xl font-medium mb-2">
              {isDragActive ? "Drop the file here" : "Drag & drop your file here"}
            </p>
            <p className="text-textMuted mb-6">or click to browse from your computer</p>
            <div className="flex items-center gap-2 text-sm text-textMuted bg-background py-2 px-4 rounded-full border border-border">
              <FileSpreadsheet className="w-4 h-4" />
              <span>Supports .CSV, .XLSX, .XLS</span>
            </div>
          </div>
        )}
      </div>

      {uploadError && (
        <div className="mt-6 flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 w-full">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p>{uploadError}</p>
        </div>
      )}
      
      {/* Dev bypass */}
      <div className="mt-8 text-center text-sm text-textMuted">
        Want to try without uploading? <button onClick={() => setStep(3)} className="text-primary hover:underline">Go straight to builder</button>
      </div>
    </div>
  );
}
