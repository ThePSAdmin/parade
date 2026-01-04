import { KanbanCard } from './KanbanCard';
import type { Issue, IssueStatus } from '../../../shared/types/beads';
import { Circle, PlayCircle, Ban, Pause, CheckCircle2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface KanbanColumnProps {
  status: IssueStatus;
  issues: Issue[];
  onCardClick?: (issue: Issue) => void;
}

const statusConfig: Record<IssueStatus, { label: string; color: string; bgColor: string; icon: LucideIcon }> = {
  open: {
    label: 'Open',
    color: 'text-green-500',
    bgColor: 'bg-slate-900/50',
    icon: Circle,
  },
  in_progress: {
    label: 'In Progress',
    color: 'text-amber-500',
    bgColor: 'bg-slate-900/50',
    icon: PlayCircle,
  },
  blocked: {
    label: 'Blocked',
    color: 'text-red-500',
    bgColor: 'bg-slate-900/50',
    icon: Ban,
  },
  deferred: {
    label: 'Deferred',
    color: 'text-slate-400',
    bgColor: 'bg-slate-900/50',
    icon: Pause,
  },
  closed: {
    label: 'Done',
    color: 'text-slate-500',
    bgColor: 'bg-slate-900/50',
    icon: CheckCircle2,
  },
};

export function KanbanColumn({ status, issues, onCardClick }: KanbanColumnProps) {
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <div
      className={`
        flex-shrink-0 w-80 rounded-lg flex flex-col max-h-full
        ${config.bgColor}
      `}
    >
      {/* Column header */}
      <div className="p-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <StatusIcon className={`w-4 h-4 ${config.color}`} />
          <h2 className="font-semibold text-slate-100">{config.label}</h2>
          <span className="text-sm text-slate-400 ml-auto">
            {issues.length}
          </span>
        </div>
      </div>

      {/* Cards container */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {issues.map((issue) => (
          <KanbanCard
            key={issue.id}
            issue={issue}
            onClick={() => onCardClick?.(issue)}
          />
        ))}

        {issues.length === 0 && (
          <div className="text-center py-8 text-slate-500 text-sm">
            No issues
          </div>
        )}
      </div>
    </div>
  );
}
