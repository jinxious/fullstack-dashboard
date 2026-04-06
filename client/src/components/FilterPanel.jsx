import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useFilterStore } from '../store/useFilterStore';
import { useDashboardStore } from '../store/useDashboardStore';
import { Search, X, RotateCcw, ChevronDown, ChevronUp, Calendar, Filter } from 'lucide-react';

// --- Multi-select Dropdown ---
function MultiSelectDropdown({ column, options, selectedValues, onToggle, onClear }) {
  const [open, setOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState('');
  const ref = useRef(null);
  
  const filtered = options.filter(o => o.toLowerCase().includes(localSearch.toLowerCase()));
  const count = selectedValues.length;
  
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm border transition-all
          ${count > 0 ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background text-textMain hover:border-primary/50'}`}
      >
        <span className="truncate font-medium">
          {count > 0 ? `${column} (${count})` : column}
        </span>
        {open ? <ChevronUp className="w-3.5 h-3.5 shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 shrink-0" />}
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
          {options.length > 6 && (
            <div className="p-2 border-b border-border">
              <input
                type="text"
                placeholder="Search options..."
                value={localSearch}
                onChange={e => setLocalSearch(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-primary"
              />
            </div>
          )}
          <div className="max-h-48 overflow-y-auto custom-scrollbar">
            {filtered.length === 0 ? (
              <p className="text-xs text-textMuted text-center py-3">No options found</p>
            ) : (
              filtered.map(opt => (
                <label
                  key={opt}
                  className="flex items-center gap-2.5 px-3 py-2 hover:bg-background cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedValues.includes(opt)}
                    onChange={() => onToggle(column, opt)}
                    className="accent-primary rounded"
                  />
                  <span className="text-sm truncate">{opt}</span>
                </label>
              ))
            )}
          </div>
          {count > 0 && (
            <div className="p-2 border-t border-border">
              <button onClick={() => { onClear(column); setOpen(false); }} className="w-full text-xs text-red-400 hover:text-red-500 font-medium py-1">
                Clear selection
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- Date Range Picker ---
function DateRangePicker({ column, range, onSet }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs text-textMuted uppercase tracking-wider flex items-center gap-1">
        <Calendar className="w-3 h-3" /> {column}
      </label>
      <div className="flex gap-2">
        <input
          type="date"
          value={range?.from || ''}
          onChange={e => onSet(column, e.target.value, range?.to || '')}
          className="flex-1 bg-background border border-border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-primary"
        />
        <span className="text-textMuted self-center text-xs">→</span>
        <input
          type="date"
          value={range?.to || ''}
          onChange={e => onSet(column, range?.from || '', e.target.value)}
          className="flex-1 bg-background border border-border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-primary"
        />
      </div>
    </div>
  );
}

// --- Active Filter Tag ---
function FilterTag({ tag, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/20 text-primary text-xs font-medium px-2.5 py-1 rounded-full max-w-[180px]">
      <span className="truncate">{tag.label}</span>
      <button onClick={() => onRemove(tag)} className="shrink-0 hover:text-red-400 transition-colors">
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

// --- Main FilterPanel ---
export function FilterPanel() {
  const { dataset } = useDashboardStore();
  const {
    filters, filterConfig, filteredDataset,
    setSearch, toggleColumnValue, setDateRange,
    clearColumnFilter, resetFilters, getActiveTags, initFilters
  } = useFilterStore();

  const [searchInput, setSearchInput] = useState('');
  const [expanded, setExpanded] = useState(true);
  const debounceRef = useRef(null);

  // Initialize filters when dataset changes
  useEffect(() => {
    if (dataset) {
      const schema = useDashboardStore.getState().schema;
      initFilters(schema, dataset);
    }
  }, [dataset, initFilters]);

  // Debounced search
  const handleSearchChange = useCallback((value) => {
    setSearchInput(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(value);
    }, 250);
  }, [setSearch]);

  const activeTags = getActiveTags();
  const hasActiveFilters = activeTags.length > 0;
  const resultCount = filteredDataset?.length ?? dataset?.length ?? 0;
  const totalCount = dataset?.length ?? 0;
  const isFiltered = hasActiveFilters;

  const handleRemoveTag = (tag) => {
    if (tag.type === 'search') { setSearchInput(''); setSearch(''); }
    else if (tag.type === 'column') toggleColumnValue(tag.column, tag.value);
    else if (tag.type === 'date') setDateRange(tag.column, '', '');
  };

  const categoricalFilters = filterConfig.filter(f => f.type === 'categorical');
  const dateFilters = filterConfig.filter(f => f.type === 'date');

  if (!dataset) return null;

  return (
    <div className="border-b border-border bg-surface/50">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5">
        <button
          onClick={() => setExpanded(e => !e)}
          className="flex items-center gap-2 text-sm font-semibold hover:text-primary transition-colors"
        >
          <Filter className="w-4 h-4 text-primary" />
          Filters
          {hasActiveFilters && (
            <span className="bg-primary text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
              {activeTags.length}
            </span>
          )}
          {expanded ? <ChevronUp className="w-3.5 h-3.5 text-textMuted" /> : <ChevronDown className="w-3.5 h-3.5 text-textMuted" />}
        </button>

        <div className="flex items-center gap-3">
          {isFiltered && (
            <span className="text-xs text-textMuted">
              <span className={`font-semibold ${resultCount === 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                {resultCount.toLocaleString()}
              </span> / {totalCount.toLocaleString()} rows
            </span>
          )}
          {hasActiveFilters && (
            <button
              onClick={() => { resetFilters(dataset); setSearchInput(''); }}
              className="flex items-center gap-1 text-xs text-red-400 hover:text-red-500 font-medium transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> Reset All
            </button>
          )}
        </div>
      </div>

      {/* Expanded filter controls */}
      {expanded && (
        <div className="px-4 pb-3 space-y-3 transition-all">
          {/* Global Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-textMuted pointer-events-none" />
            <input
              type="text"
              placeholder="Search across all columns..."
              value={searchInput}
              onChange={e => handleSearchChange(e.target.value)}
              className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
            />
            {searchInput && (
              <button onClick={() => handleSearchChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-textMuted hover:text-textMain">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Categorical Multi-select dropdowns */}
          {categoricalFilters.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {categoricalFilters.map(f => (
                <div key={f.column} className="min-w-[160px] flex-1">
                  <MultiSelectDropdown
                    column={f.column}
                    options={f.options}
                    selectedValues={filters.columns[f.column] || []}
                    onToggle={toggleColumnValue}
                    onClear={clearColumnFilter}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Date Range pickers */}
          {dateFilters.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {dateFilters.map(f => (
                <DateRangePicker
                  key={f.column}
                  column={f.column}
                  range={filters.dateRange[f.column]}
                  onSet={setDateRange}
                />
              ))}
            </div>
          )}

          {/* Active filter tags */}
          {activeTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {activeTags.map(tag => (
                <FilterTag key={tag.id} tag={tag} onRemove={handleRemoveTag} />
              ))}
            </div>
          )}

          {/* No results warning */}
          {isFiltered && resultCount === 0 && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              <span className="text-red-400 text-xs font-medium">⚠ No data matches the current filters. Try removing some.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
