import type { IssueType, BeadId } from '../../../shared/types/beads';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select';
import { Search, RefreshCw, X } from 'lucide-react';
import { Input } from '@renderer/components/ui/input';

interface FilterState {
  type: string | null;
  label: string | null;
  epicId: BeadId | null;
  search: string;
}

interface KanbanFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  types: IssueType[];
  labels: string[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function KanbanFilters({
  filters,
  onFilterChange,
  types,
  labels,
  isLoading,
  onRefresh,
}: KanbanFiltersProps) {
  // Check if we have non-epic filters active
  const hasNonEpicFilters = filters.type || filters.label || filters.search;

  return (
    <div className="h-14 flex items-center border-b border-slate-800 bg-slate-950 px-4 gap-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          type="text"
          placeholder="Search issues..."
          value={filters.search}
          onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
          className="pl-8 pr-3 py-1.5 w-40 text-sm bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-500 focus-visible:ring-sky-500"
        />
      </div>

      {/* Type filter */}
      <Select
        value={filters.type || 'all'}
        onValueChange={(value) => onFilterChange({ ...filters, type: value === 'all' ? null : value })}
      >
        <SelectTrigger className="w-[120px] bg-slate-900 border-slate-800 text-slate-100 focus:ring-sky-500">
          <SelectValue placeholder="All types" />
        </SelectTrigger>
        <SelectContent className="bg-slate-900 border-slate-800">
          <SelectItem value="all" className="text-slate-100">All types</SelectItem>
          {types.map((type) => (
            <SelectItem key={type} value={type} className="text-slate-100">
              {type}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Label filter */}
      {labels.length > 0 && (
        <Select
          value={filters.label || 'all'}
          onValueChange={(value) => onFilterChange({ ...filters, label: value === 'all' ? null : value })}
        >
          <SelectTrigger className="w-[120px] bg-slate-900 border-slate-800 text-slate-100 focus:ring-sky-500">
            <SelectValue placeholder="All labels" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800">
            <SelectItem value="all" className="text-slate-100">All labels</SelectItem>
            {labels.map((label) => (
              <SelectItem key={label} value={label} className="text-slate-100">
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Clear filters */}
      {hasNonEpicFilters && (
        <button
          onClick={() => onFilterChange({ ...filters, type: null, label: null, search: '' })}
          className="px-2 py-1 text-xs text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors flex items-center gap-1"
        >
          <X className="w-3 h-3" />
          Clear
        </button>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Refresh button */}
      <button
        onClick={onRefresh}
        disabled={isLoading}
        className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-md transition-colors disabled:opacity-50"
        title="Refresh"
      >
        <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );
}
