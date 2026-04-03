import { create } from 'zustand';

export const useDashboardStore = create((set) => ({
  // Data State
  dataset: null, // The actual data array
  schema: null,  // Data columns and their inferred types
  dataFilename: null, // Filename returned from the backend upload
  
  // Dashboard State
  widgets: [], // Array of chart configs { id, type, title, xAxis, yAxis, aggregation }
  layout: [],  // React-grid-layout config
  
  // App State
  isUploading: false,
  uploadError: null,
  currentStep: 1, // 1: Upload, 2: Preview, 3: Build
  
  // Actions
  setDataset: (dataset, schema, dataFilename) => set({ dataset, schema, dataFilename, currentStep: 2, uploadError: null }),
  setUploading: (isUploading) => set({ isUploading }),
  setUploadError: (uploadError) => set({ uploadError, isUploading: false }),
  setStep: (step) => set({ currentStep: step }),
  
  addWidget: (widget) => set((state) => ({
    widgets: [...state.widgets, widget],
  })),
  removeWidget: (id) => set((state) => ({
    widgets: state.widgets.filter(w => w.id !== id)
  })),
  updateWidget: (id, updates) => set((state) => ({
    widgets: state.widgets.map(w => w.id === id ? { ...w, ...updates } : w)
  })),
  setLayout: (layout) => set({ layout })
}));
