import { create } from 'zustand';

// Detect column type from values
const detectColumnType = (values) => {
  const nonNull = values.filter(v => v !== null && v !== undefined && v !== '');
  if (nonNull.length === 0) return 'string';
  
  // Date detection
  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}/, // ISO
    /^\d{2}[\/\-]\d{2}[\/\-]\d{4}/, // DD/MM/YYYY or DD-MM-YYYY
    /^[A-Za-z]{3,9}\s\d{1,2},?\s\d{4}/, // Month Day, Year
  ];
  if (datePatterns.some(p => p.test(String(nonNull[0])))) return 'date';
  
  // Number detection
  const numericCount = nonNull.filter(v => !isNaN(parseFloat(v)) && isFinite(v)).length;
  if (numericCount / nonNull.length > 0.9) return 'number';
  
  // Categorical: < 50 unique values
  const unique = new Set(nonNull.map(String)).size;
  if (unique <= 50) return 'categorical';
  
  return 'string';
};

// Build filter config from schema + dataset
export const buildFilterConfig = (schema, dataset) => {
  if (!schema || !dataset || dataset.length === 0) return [];
  
  return schema
    .map(col => {
      const values = dataset.map(row => row[col.name]).filter(v => v !== null && v !== undefined && v !== '');
      const detectedType = detectColumnType(values);
      
      if (detectedType === 'number') return null; // Skip pure numeric columns for filter UI
      
      const uniqueValues = [...new Set(values.map(String))].sort();
      
      return {
        column: col.name,
        type: detectedType, // 'categorical', 'date', 'string'
        options: detectedType === 'categorical' ? uniqueValues : [],
      };
    })
    .filter(Boolean);
};

export const useFilterStore = create((set, get) => ({
  // Active filters
  filters: {
    search: '',
    columns: {},
    dateRange: {},
  },
  
  filterConfig: [],
  filteredDataset: null,
  originalDataset: null, // keep a reference to the full dataset
  
  initFilters: (schema, dataset) => {
    const filterConfig = buildFilterConfig(schema, dataset);
    set({ filterConfig, filteredDataset: dataset, originalDataset: dataset, filters: { search: '', columns: {}, dateRange: {} } });
  },

  setSearch: (search) => {
    set(state => ({ filters: { ...state.filters, search } }));
    get()._applyFilters();
  },

  toggleColumnValue: (column, value) => {
    set(state => {
      const current = state.filters.columns[column] || [];
      const exists = current.includes(value);
      const updated = exists ? current.filter(v => v !== value) : [...current, value];
      return {
        filters: {
          ...state.filters,
          columns: { ...state.filters.columns, [column]: updated }
        }
      };
    });
    get()._applyFilters();
  },

  setDateRange: (column, from, to) => {
    set(state => ({
      filters: {
        ...state.filters,
        dateRange: { ...state.filters.dateRange, [column]: { from, to } }
      }
    }));
    get()._applyFilters();
  },

  clearColumnFilter: (column) => {
    set(state => {
      const columns = { ...state.filters.columns };
      delete columns[column];
      const dateRange = { ...state.filters.dateRange };
      delete dateRange[column];
      return { filters: { ...state.filters, columns, dateRange } };
    });
    get()._applyFilters();
  },

  resetFilters: (dataset) => {
    set({ filters: { search: '', columns: {}, dateRange: {} }, filteredDataset: dataset || get().originalDataset });
  },

  _applyFilters: () => {
    const { filters, originalDataset } = get();
    if (!originalDataset) return;

    let result = originalDataset;

    // 1. Global search
    if (filters.search && filters.search.trim()) {
      const term = filters.search.trim().toLowerCase();
      result = result.filter(row =>
        Object.values(row).some(v => String(v ?? '').toLowerCase().includes(term))
      );
    }

    // 2. Column multi-select filters (AND logic between columns, OR within a column)
    Object.entries(filters.columns).forEach(([col, vals]) => {
      if (vals && vals.length > 0) {
        result = result.filter(row => vals.includes(String(row[col] ?? '')));
      }
    });

    // 3. Date range filters
    Object.entries(filters.dateRange).forEach(([col, range]) => {
      if (range && (range.from || range.to)) {
        result = result.filter(row => {
          const cellDate = new Date(row[col]);
          if (isNaN(cellDate)) return true;
          if (range.from && new Date(range.from) > cellDate) return false;
          if (range.to && new Date(range.to) < cellDate) return false;
          return true;
        });
      }
    });

    set({ filteredDataset: result });
  },

  // Computed active filter tags for display
  getActiveTags: () => {
    const { filters } = get();
    const tags = [];

    if (filters.search) {
      tags.push({ id: 'search', label: `Search: "${filters.search}"`, type: 'search' });
    }

    Object.entries(filters.columns).forEach(([col, vals]) => {
      (vals || []).forEach(val => {
        tags.push({ id: `col:${col}:${val}`, label: `${col}: ${val}`, type: 'column', column: col, value: val });
      });
    });

    Object.entries(filters.dateRange).forEach(([col, range]) => {
      if (range.from || range.to) {
        const label = `${col}: ${range.from || '...'} → ${range.to || '...'}`;
        tags.push({ id: `date:${col}`, label, type: 'date', column: col });
      }
    });

    return tags;
  }
}));
