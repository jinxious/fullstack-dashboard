import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation, Link } from 'react-router-dom';
import { UploadSection } from './components/UploadSection';
import { DataPreview } from './components/DataPreview';
import { DashboardBuilder } from './components/DashboardBuilder';
import { FinalizeDashboard } from './components/FinalizeDashboard';
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
      {currentStep === 4 && <FinalizeDashboard />}
    </>
  );
}

// Main layout with navigation
function AppLayout({ children }) {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { currentStep, resetDashboard } = useDashboardStore();
  const navigate = useNavigate();
  const location = useLocation();

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
