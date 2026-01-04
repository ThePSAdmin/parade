// BatchGrid - Main swimlane container
// Renders header row with status labels + BatchRow components

import { BatchRow } from './BatchRow';
import type { Batch } from '../../lib/batchComputation';
import type { Issue, IssueStatus } from '../../../shared/types/beads';

interface BatchGridProps {
  batches: Batch[];
  collapsedBatches: Set<number>;
  onToggleBatch: (batchNumber: number) => void;
  onCardClick: (task: Issue) => void;
  selectedTaskId?: string | null;
  isLoading?: boolean;
}

const STATUS_COLUMNS: { status: IssueStatus; label: string }[] = [
  { status: 'open', label: 'Open' },
  { status: 'in_progress', label: 'In Progress' },
  { status: 'blocked', label: 'Blocked' },
  { status: 'closed', label: 'Closed' },
];

export function BatchGrid({
  batches,
  collapsedBatches,
  onToggleBatch,
  onCardClick,
  selectedTaskId,
  isLoading,
}: BatchGridProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex items-center gap-3 text-slate-400">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Loading batches...
        </div>
      </div>
    );
  }

  if (batches.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        <div className="text-center">
          <p>No batches found</p>
          <p className="text-xs mt-1">Select an epic to view its task batches</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Status column headers */}
      <div className="flex-shrink-0 border-b border-slate-800">
        <div className="grid grid-cols-4 gap-2 px-3 py-2 ml-[100px]">
          {STATUS_COLUMNS.map(({ status, label }) => (
            <div
              key={status}
              className="text-xs font-medium text-slate-400 uppercase tracking-wide text-center"
            >
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Batch rows */}
      <div className="flex-1 overflow-y-auto">
        {batches.map((batch) => (
          <BatchRow
            key={batch.number}
            batch={batch}
            isCollapsed={collapsedBatches.has(batch.number)}
            onToggleCollapse={() => onToggleBatch(batch.number)}
            onCardClick={onCardClick}
            selectedTaskId={selectedTaskId}
          />
        ))}
      </div>
    </div>
  );
}

export default BatchGrid;
