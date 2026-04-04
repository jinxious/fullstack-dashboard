import { create } from 'zustand';

export const useDashboardStore = create((set) => ({
  // Data State
  dataset: null,
  schema: null,
  dataFilename: null,

  // Dashboard State
  dashboardId: null,      // ID of loaded dashboard (null = new)
  dashboardTitle: 'Untitled Dashboard',
  widgets: [],
  layout: [],

  // App State
  isUploading: false,
  uploadError: null,
  currentStep: 1, // 1: Upload, 2: Preview, 3: Build

  // Actions
  setDataset: (dataset, schema, dataFilename) => set({ dataset, schema, dataFilename, currentStep: 2, uploadError: null }),
  setUploading: (isUploading) => set({ isUploading }),
  setUploadError: (uploadError) => set({ uploadError, isUploading: false }),
  setStep: (step) => set({ currentStep: step }),
  setDashboardTitle: (dashboardTitle) => set({ dashboardTitle }),

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
    widgets: [],
    layout: [],
    currentStep: 1,
    isUploading: false,
    uploadError: null
  })
}));
