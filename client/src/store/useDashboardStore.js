import { create } from 'zustand';

export const useDashboardStore = create((set) => ({
  // Data State
  dataset: null,
  schema: null,
  dataFilename: null,

  // Dashboard State
  dashboardId: null,      // ID of loaded dashboard (null = new)
  dashboardTitle: 'Untitled Dashboard',
  
  // Customization State
  dashboardMetadata: {
    subtitle: '',
    author: '',
    date: new Date().toLocaleDateString()
  },
  dashboardTheme: {
    fontFamily: 'sans-serif',
    backgroundColor: 'var(--color-background)',
    chartPalette: 'default' // 'default', 'monochrome', 'vibrant', 'pastel'
  },
  
  widgets: [],
  layout: [],

  // App State
  isUploading: false,
  uploadError: null,
  currentStep: 1, // 1: Upload, 2: Preview, 3: Build, 4: Finalize
  isExporting: false,

  // Actions
  setDataset: (dataset, schema, dataFilename) => set({ dataset, schema, dataFilename, currentStep: 2, uploadError: null }),
  setUploading: (isUploading) => set({ isUploading }),
  setUploadError: (uploadError) => set({ uploadError, isUploading: false }),
  setStep: (step) => set({ currentStep: step }),
  setDashboardTitle: (dashboardTitle) => set({ dashboardTitle }),
  
  setMetadata: (updates) => set((state) => ({ dashboardMetadata: { ...state.dashboardMetadata, ...updates } })),
  setTheme: (updates) => set((state) => ({ dashboardTheme: { ...state.dashboardTheme, ...updates } })),
  setIsExporting: (isExporting) => set({ isExporting }),

  addWidget: (widget) => set((state) => ({
    widgets: [...state.widgets, widget],
  })),
  removeWidget: (id) => set((state) => ({
    widgets: state.widgets.filter(w => w.id !== id)
  })),
  updateWidget: (id, updates) => set((state) => ({
    widgets: state.widgets.map(w => w.id === id ? { ...w, ...updates } : w)
  })),
  setLayout: (layout) => set({ layout }),

  // Load a saved dashboard into the store
  loadDashboard: (config, data) => set({
    dashboardId: config.id || config._id || null,
    dashboardTitle: config.title || 'Untitled Dashboard',
    dashboardMetadata: config.metadata || { subtitle: '', author: '', date: new Date().toLocaleDateString() },
    dashboardTheme: config.theme || { fontFamily: 'sans-serif', backgroundColor: 'var(--color-background)', chartPalette: 'default' },
    schema: config.schema,
    widgets: config.widgets || [],
    layout: config.layout || [],
    dataset: data || null,
    dataFilename: config.dataFilename || null,
    currentStep: 3
  }),

  // Reset to fresh state
  resetDashboard: () => set({
    dataset: null,
    schema: null,
    dataFilename: null,
    dashboardId: null,
    dashboardTitle: 'Untitled Dashboard',
    dashboardMetadata: { subtitle: '', author: '', date: new Date().toLocaleDateString() },
    dashboardTheme: { fontFamily: 'sans-serif', backgroundColor: 'var(--color-background)', chartPalette: 'default' },
    widgets: [],
    layout: [],
    currentStep: 1,
    isUploading: false,
    uploadError: null,
    isExporting: false
  })
}));
