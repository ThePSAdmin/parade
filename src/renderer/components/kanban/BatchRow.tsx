// BatchRow - A swimlane row for one batch
// Contains BatchHeader + 4 StatusCells

import { BatchHeader } from './BatchHeader';
import { StatusCell } from './StatusCell';
import type { Batch } from '../../lib/batchComputation';
import type { Issue, IssueStatus } from '../../../shared/types/beads';

interface BatchRowProps {
  batch: Batch;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onCardClick: (task: Issue) => void;
  selectedTaskId?: string | null;
}

const STATUS_COLUMNS: IssueStatus[] = ['open', 'in_progress', 'blocked', 'closed'];

export function BatchRow({
  batch,
  isCollapsed,
  onToggleCollapse,
  onCardClick,
  selectedTaskId,
}: BatchRowProps) {
  // Group tasks by status
  const tasksByStatus = STATUS_COLUMNS.reduce(
    (acc, status) => {
      acc[status] = batch.tasks.filter((t) => t.status === status);
      return acc;
    },
    {} as Record<IssueStatus, Issue[]>
  );

  return (
    <div className="border-b border-slate-800 last:border-b-0">
      {/* Header */}
      <BatchHeader
        batch={batch}
        isCollapsed={isCollapsed}
        onToggle={onToggleCollapse}
      />

      {/* Status cells - hidden when collapsed */}
      {!isCollapsed && (
        <div className="grid grid-cols-4 gap-2 px-3 pb-3">
          {STATUS_COLUMNS.map((status) => (
            <StatusCell
              key={status}
              status={status}
              tasks={tasksByStatus[status]}
              onCardClick={onCardClick}
              selectedTaskId={selectedTaskId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default BatchRow;
