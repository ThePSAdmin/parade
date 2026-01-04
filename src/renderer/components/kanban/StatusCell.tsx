// StatusCell - A grid cell for one status within a batch
// Contains compact TaskCard components

import { TaskCard } from './TaskCard';
import type { Issue, IssueStatus } from '../../../shared/types/beads';

interface StatusCellProps {
  status: IssueStatus;
  tasks: Issue[];
  onCardClick: (task: Issue) => void;
  selectedTaskId?: string | null;
}

export function StatusCell({ tasks, onCardClick, selectedTaskId }: StatusCellProps) {
  return (
    <div className="min-h-[60px] bg-slate-900/30 rounded-lg p-2 space-y-1.5">
      {tasks.length === 0 ? (
        <div className="h-full flex items-center justify-center text-xs text-slate-600">
          {/* Empty state - just show nothing or a subtle indicator */}
        </div>
      ) : (
        tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            isSelected={task.id === selectedTaskId}
            onClick={() => onCardClick(task)}
          />
        ))
      )}
    </div>
  );
}

export default StatusCell;
