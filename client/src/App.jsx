import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation, Link } from 'react-router-dom';
import { UploadSection } from './components/UploadSection';
import { DataPreview } from './components/DataPreview';
import { DashboardBuilder } from './components/DashboardBuilder';
import { AuthPage } from './components/AuthPage';
import { MyDashboards } from './components/MyDashboards';
import { TemplateLibrary } from './components/TemplateLibrary';
import { useDashboardStore } from './store/useDashboardStore';
import { useAuthStore } from './store/useAuthStore';
import { Toaster } from 'react-hot-toast';
import {
  LayoutDashboard, Download, Sun, Moon, LogOut,
  FolderOpen, Layers, Plus, User
} from 'lucide-react';
import api from './lib/api';

// Auth guard wrapper
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

// Dashboard flow (upload → preview → build)
function DashboardFlow() {
  const { currentStep } = useDashboardStore();
  return (
    <>
      {currentStep === 1 && <UploadSection />}
      {currentStep === 2 && <DataPreview />}
      {currentStep === 3 && <DashboardBuilder />}
    </>
  );
}

// Main layout with navigation
function AppLayout({ children }) {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { currentStep, resetDashboard } = useDashboardStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isExporting, setIsExporting] = useState(false);

  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mf_theme');
      if (saved) return saved === 'dark';
      return document.documentElement.classList.contains('dark') || window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('mf_theme', isDarkMode ? 'dark' : 'light');
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

      const response = await api.post('/api/export/pdf', { htmlContent }, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'dashboard.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
      alert('Failed to generate PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handleLogout = () => {
    logout();
    resetDashboard();
    navigate('/login');
  };

  const handleNewDashboard = () => {
    resetDashboard();
    navigate('/dashboard');
  };

  const isOnDashboard = location.pathname === '/dashboard';
  const showExport = isOnDashboard && currentStep === 3;

  return (
    <div className="min-h-screen flex flex-col bg-background text-textMain transition-colors duration-200">
      <header className="h-16 border-b border-border bg-surface/50 backdrop-blur shrink-0 px-6 flex items-center justify-between sticky top-0 z-50">
        {/* Left: Logo + Nav */}
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <h1 className="font-bold text-xl tracking-tight">MetricsFlow</h1>
          </Link>

          {isAuthenticated && (
            <nav className="hidden md:flex items-center gap-1 ml-4">
              <Link
                to="/dashboard"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                  ${location.pathname === '/dashboard' ? 'bg-primary/10 text-primary' : 'text-textMuted hover:text-textMain hover:bg-surface'}`}
              >
                <Plus className="w-3.5 h-3.5" />
                New
              </Link>
              <Link
                to="/my-dashboards"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                  ${location.pathname === '/my-dashboards' ? 'bg-primary/10 text-primary' : 'text-textMuted hover:text-textMain hover:bg-surface'}`}
              >
                <FolderOpen className="w-3.5 h-3.5" />
                Dashboards
              </Link>
              <Link
                to="/templates"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                  ${location.pathname === '/templates' ? 'bg-primary/10 text-primary' : 'text-textMuted hover:text-textMain hover:bg-surface'}`}
              >
                <Layers className="w-3.5 h-3.5" />
                Templates
              </Link>
            </nav>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex gap-2 items-center">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-surface border border-border text-textMuted hover:text-textMain transition-colors"
            title="Toggle theme"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {showExport && (
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-2 bg-primary hover:bg-primaryHover text-white px-4 py-2 rounded-lg shadow-lg shadow-primary/20 transition-all text-sm font-medium disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {isExporting ? 'Generating...' : 'Export PDF'}
            </button>
          )}

          {isAuthenticated && (
            <div className="flex items-center gap-2 ml-2 pl-2 border-l border-border">
              <div className="hidden sm:flex items-center gap-2 text-sm text-textMuted">
                <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="max-w-[100px] truncate">{user?.name || 'User'}</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg text-textMuted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  );
}

function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--color-surface)',
            color: 'var(--color-textMain)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            fontSize: '14px'
          }
        }}
      />
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AppLayout>
                <DashboardFlow />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-dashboards"
          element={
            <ProtectedRoute>
              <AppLayout>
                <MyDashboards />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/templates"
          element={
            <ProtectedRoute>
              <AppLayout>
                <TemplateLibrary />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}

export default App;
