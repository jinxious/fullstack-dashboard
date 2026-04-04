import React, { useState } from 'react';
import { UploadSection } from './components/UploadSection';
import { DataPreview } from './components/DataPreview';
import { DashboardBuilder } from './components/DashboardBuilder';
import { useDashboardStore } from './store/useDashboardStore';
import { LayoutDashboard, Download, Share2, Sun, Moon } from 'lucide-react';
import axios from 'axios';

function App() {
  const { currentStep, dataFilename, schema, widgets, layout } = useDashboardStore();
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Theme state
  const [isDarkMode, setIsDarkMode] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') || window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true; // Default to dark mode logically since it was the original theme
  });

  React.useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const dashboardElement = document.querySelector('.dashboard-canvas-container');
      if (!dashboardElement) return alert('No dashboard found');
      
      const htmlContent = `
        <!DOCTYPE html><html><head>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          body { background: #0f172a; color: white; padding: 20px; font-family: sans-serif; }
          .bg-surface { background: #1e293b; border: 1px solid #334155; }
          .recharts-wrapper svg { background: transparent !important; }
        </style>
        </head><body>
        <h1 class="text-2xl font-bold mb-6">Exported Dashboard</h1>
        <div style="width: 1200px; height: 800px; position: relative;">
          ${dashboardElement.innerHTML}
        </div>
        </body></html>
      `;
      
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await axios.post(`${apiUrl}/api/export/pdf`, { htmlContent }, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'dashboard.pdf');
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      console.error(err);
      alert('Failed to generate PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await axios.post(`${apiUrl}/api/dashboards`, {
        title: 'My Custom Dashboard',
        dataFilename,
        schema,
        widgets,
        layout
      });
      alert(`Dashboard Saved! Share ID: ${response.data.id}`);
    } catch (err) {
      console.error(err);
      alert('Failed to save dashboard');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-textMain transition-colors duration-200">
      <header className="h-16 border-b border-border bg-surface/50 backdrop-blur shrink-0 px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <h1 className="font-bold text-xl tracking-tight">MetricsFlow</h1>
        </div>
        
        <div className="flex gap-3 items-center">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-surface border border-border text-textMuted hover:text-textMain transition-colors"
            title="Toggle theme"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        
        {currentStep === 3 && (
          <div className="flex gap-3">
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 bg-surface hover:bg-border text-textMain px-4 py-2 rounded-lg border border-border transition-colors text-sm font-medium disabled:opacity-50"
            >
              <Share2 className="w-4 h-4 text-textMuted" />
              {isSaving ? 'Saving...' : 'Save App'}
            </button>
            <button 
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-2 bg-primary hover:bg-primaryHover text-white px-4 py-2 rounded-lg shadow-lg shadow-primary/20 transition-all text-sm font-medium disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {isExporting ? 'Generating...' : 'Export PDF'}
            </button>
          </div>
        )}
        </div>
      </header>
      <main className="flex-1 flex flex-col">
        {currentStep === 1 && <UploadSection />}
        {currentStep === 2 && <DataPreview />}
        {currentStep === 3 && <DashboardBuilder />}
      </main>
    </div>
  );
}

export default App;
