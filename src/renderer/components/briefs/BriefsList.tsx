import { useEffect, useState } from 'react';
import { useDiscoveryStore } from '../../store/discoveryStore';
import type { Brief, BriefStatus } from '../../../shared/types/discovery';
import { ScrollArea } from '@renderer/components/ui/scroll-area';
import { Input } from '@renderer/components/ui/input';
import { Badge } from '@renderer/components/ui/badge';
import { Search } from 'lucide-react';

const STATUS_CONFIG: Record<BriefStatus, { label: string; color: string; bgColor: string }> = {
  draft: { label: 'Draft', color: 'text-slate-400', bgColor: 'bg-slate-800' },
  in_discovery: { label: 'In Discovery', color: 'text-sky-400', bgColor: 'bg-sky-950' },
  spec_ready: { label: 'Spec Ready', color: 'text-amber-400', bgColor: 'bg-amber-950' },
  approved: { label: 'Approved', color: 'text-emerald-400', bgColor: 'bg-emerald-950' },
  exported: { label: 'Active', color: 'text-purple-400', bgColor: 'bg-purple-950' },
  in_progress: { label: 'In Progress', color: 'text-blue-400', bgColor: 'bg-blue-950' },
  completed: { label: 'Completed', color: 'text-green-400', bgColor: 'bg-green-950' },
  canceled: { label: 'Canceled', color: 'text-red-400', bgColor: 'bg-red-950' },
};

const PRIORITY_CONFIG: Record<number, { label: string; color: string }> = {
  1: { label: 'Critical', color: 'text-red-400' },
  2: { label: 'High', color: 'text-orange-400' },
  3: { label: 'Medium', color: 'text-yellow-400' },
  4: { label: 'Low', color: 'text-slate-400' },
};

interface BriefsListProps {
  onSelectBrief: (briefId: string) => void;
  selectedBriefId: string | null;
}

export function BriefsList({ onSelectBrief, selectedBriefId }: BriefsListProps) {
  const { briefs, fetchBriefs, isLoading } = useDiscoveryStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<BriefStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'title'>('date');

  useEffect(() => {
    fetchBriefs();
  }, [fetchBriefs]);

  // Filter and sort briefs
  const filteredBriefs = briefs
    .filter((brief) => {
      if (statusFilter !== 'all' && brief.status !== statusFilter) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          brief.title.toLowerCase().includes(query) ||
          brief.problem_statement?.toLowerCase().includes(query) ||
          brief.id.toLowerCase().includes(query)
        );
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          return a.priority - b.priority;
        case 'title':
          return a.title.localeCompare(b.title);
        case 'date':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  return (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800">
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <h2 className="text-lg font-semibold text-slate-100 mb-3">Briefs</h2>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search briefs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500 focus-visible:ring-sky-500"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as BriefStatus | 'all')}
            className="flex-1 px-2 py-1.5 text-sm border border-slate-800 rounded-md bg-slate-950 text-slate-100"
          >
            <option value="all">All statuses</option>
            {Object.entries(STATUS_CONFIG).map(([status, config]) => (
              <option key={status} value={status}>{config.label}</option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'priority' | 'title')}
            className="px-2 py-1.5 text-sm border border-slate-800 rounded-md bg-slate-950 text-slate-100"
          >
            <option value="date">Newest</option>
            <option value="priority">Priority</option>
            <option value="title">Title</option>
          </select>
        </div>
      </div>

      {/* Brief list */}
      <ScrollArea className="flex-1">
        {isLoading && briefs.length === 0 ? (
          <div className="p-4 text-center text-slate-400">Loading briefs...</div>
        ) : filteredBriefs.length === 0 ? (
          <div className="p-4 text-center text-slate-400">
            {searchQuery || statusFilter !== 'all' ? 'No matching briefs' : 'No briefs yet'}
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {filteredBriefs.map((brief) => (
              <BriefListItem
                key={brief.id}
                brief={brief}
                isSelected={selectedBriefId === brief.id}
                onClick={() => onSelectBrief(brief.id)}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Footer with count */}
      <div className="p-3 border-t border-slate-800 text-xs text-slate-400">
        {filteredBriefs.length} of {briefs.length} briefs
      </div>
    </div>
  );
}

function BriefListItem({
  brief,
  isSelected,
  onClick,
}: {
  brief: Brief;
  isSelected: boolean;
  onClick: () => void;
}) {
  const statusConfig = STATUS_CONFIG[brief.status] || STATUS_CONFIG.draft;
  const priorityConfig = PRIORITY_CONFIG[brief.priority] || PRIORITY_CONFIG[4];

  return (
    <div
      onClick={onClick}
      className={`p-3 cursor-pointer hover:bg-slate-800 transition-colors ${
        isSelected ? 'bg-slate-800 border-l-2 border-sky-500' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <h3 className="font-medium text-sm text-slate-100 line-clamp-1">{brief.title}</h3>
        <span className={`text-xs ${priorityConfig.color} font-medium whitespace-nowrap`}>
          P{brief.priority}
        </span>
      </div>

      <p className="text-xs text-slate-400 line-clamp-2 mb-2">
        {brief.problem_statement || 'No description'}
      </p>

      <div className="flex items-center justify-between">
        <Badge className={`text-xs ${statusConfig.bgColor} ${statusConfig.color} border-0`}>
          {statusConfig.label}
        </Badge>
        <span className="text-xs text-slate-500">
          {formatRelativeDate(brief.created_at)}
        </span>
      </div>
    </div>
  );
}

function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString();
}

export default BriefsList;
