import type { Issue } from '../../../shared/types/beads';
import { Card } from '@renderer/components/ui/card';
import { Badge } from '@renderer/components/ui/badge';
import { User } from 'lucide-react';
import { ProjectBadge } from '../common/ProjectChip';
import { useShowProjectBadge } from '../../hooks/useShowProjectBadge';
import { EpicChip } from './EpicChip';
import { useNavigateToPipeline } from '../../hooks/useNavigateToPipeline';

interface KanbanCardProps {
  issue: Issue;
  onClick?: () => void;
}

const typeColors: Record<string, { bg: string; text: string; border: string }> = {
  epic: { bg: 'bg-purple-900/30', text: 'text-purple-300', border: 'border-purple-800' },
  feature: { bg: 'bg-blue-900/30', text: 'text-blue-300', border: 'border-blue-800' },
  task: { bg: 'bg-slate-800/50', text: 'text-slate-300', border: 'border-slate-700' },
  bug: { bg: 'bg-red-900/30', text: 'text-red-300', border: 'border-red-800' },
  chore: { bg: 'bg-yellow-900/30', text: 'text-yellow-300', border: 'border-yellow-800' },
  'merge-request': { bg: 'bg-green-900/30', text: 'text-green-300', border: 'border-green-800' },
};

const priorityIndicators: Record<number, { color: string; label: string }> = {
  0: { color: 'bg-red-500', label: 'Critical' },
  1: { color: 'bg-orange-500', label: 'High' },
  2: { color: 'bg-yellow-500', label: 'Medium' },
  3: { color: 'bg-blue-500', label: 'Low' },
  4: { color: 'bg-slate-500', label: 'Lowest' },
};

export function KanbanCard({ issue, onClick }: KanbanCardProps) {
  const { showBadge, projectName, projectIndex } = useShowProjectBadge();
  const { navigateFromEpic } = useNavigateToPipeline();

  const priority = priorityIndicators[issue.priority] || priorityIndicators[2];
  const typeColor = typeColors[issue.issue_type] || typeColors.task;

  /**
   * Handle click on the EpicChip to navigate to Pipeline view
   * The parentId is the epic's bead ID which we resolve to a brief
   */
  const handleEpicChipClick = (parentId: string): void => {
    navigateFromEpic(parentId);
  };

  return (
    <Card
      onClick={onClick}
      data-testid="kanban-card"
      className="bg-slate-900 border-slate-800 p-3 shadow-sm hover:shadow-md hover:bg-slate-800/80 transition-all cursor-pointer"
    >
      {/* Header: ID + Type badge */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          {/* Priority indicator */}
          <span
            className={`w-2 h-2 rounded-full ${priority.color}`}
            title={priority.label}
          />
          <span className="text-xs text-slate-400 font-mono">{issue.id}</span>
        </div>
        <Badge
          variant="outline"
          className={`text-xs ${typeColor.bg} ${typeColor.text} ${typeColor.border}`}
        >
          {issue.issue_type}
        </Badge>
      </div>

      {/* Title */}
      <h3 className="text-sm font-medium text-slate-100 line-clamp-2 mb-2">
        {issue.title}
      </h3>

      {/* Parent epic chip */}
      {issue.parent && (
        <div className="mb-2">
          <EpicChip parentId={issue.parent} onClick={handleEpicChipClick} />
        </div>
      )}

      {/* Labels */}
      {issue.labels && issue.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {issue.labels.slice(0, 3).map((label) => (
            <Badge
              key={label}
              variant="secondary"
              className="text-xs bg-slate-800 text-slate-300 hover:bg-slate-700"
            >
              {label}
            </Badge>
          ))}
          {issue.labels.length > 3 && (
            <span className="text-xs text-slate-500">+{issue.labels.length - 3}</span>
          )}
        </div>
      )}

      {/* Assignee */}
      {issue.assignee && (
        <div className="mt-2 text-xs text-slate-400 flex items-center gap-1">
          <User className="w-3 h-3" />
          {issue.assignee}
        </div>
      )}

      {/* Project badge - shown when multiple projects are loaded */}
      {showBadge && projectName && (
        <div className="mt-2 pt-2 border-t border-slate-800">
          <ProjectBadge project={projectName} index={projectIndex} />
        </div>
      )}
    </Card>
  );
}
