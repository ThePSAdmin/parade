// DetailSidebar - Container that switches between TaskDetailPanel and EpicOverviewPanel

import { TaskDetailPanel } from './TaskDetailPanel';
import { EpicOverviewPanel } from './EpicOverviewPanel';
import { Card } from '@renderer/components/ui/card';
import { Badge } from '@renderer/components/ui/badge';
import { Layers, ChevronRight, CheckCircle2, Clock, AlertCircle, Circle } from 'lucide-react';
import type { Issue, IssueStatus } from '../../../shared/types/beads';
import type { Batch, TaskWithDeps } from '../../lib/batchComputation';

interface DetailSidebarProps {
  selectedTask: Issue | null;
  epic: Issue | null;
  batches: Batch[];
  issuesWithDeps: TaskWithDeps[];
  allEpics: Issue[];
  onClose: () => void;
  onBatchClick?: (batchNumber: number) => void;
  onEpicSelect?: (epicId: string) => void;
}

const STATUS_CONFIG: Record<IssueStatus, { icon: typeof CheckCircle2; color: string; label: string }> = {
  open: { icon: Circle, color: 'text-slate-400', label: 'Open' },
  in_progress: { icon: Clock, color: 'text-blue-400', label: 'In Progress' },
  blocked: { icon: AlertCircle, color: 'text-red-400', label: 'Blocked' },
  deferred: { icon: Clock, color: 'text-amber-400', label: 'Deferred' },
  closed: { icon: CheckCircle2, color: 'text-green-400', label: 'Closed' },
};

export function DetailSidebar({
  selectedTask,
  epic,
  batches,
  issuesWithDeps,
  allEpics,
  onClose,
  onBatchClick,
  onEpicSelect,
}: DetailSidebarProps) {
  // If a task is selected, show task details
  if (selectedTask) {
    // Find the batch this task belongs to
    const taskBatch = batches.find((b) => b.taskIds.includes(selectedTask.id));

    // Find dependencies for this task
    const taskWithDeps = issuesWithDeps.find((t) => t.id === selectedTask.id) as TaskWithDeps | undefined;
    const dependencyIds = taskWithDeps?.blockedBy || [];
    const dependencies = issuesWithDeps.filter((t) => dependencyIds.includes(t.id));

    return (
      <TaskDetailPanel
        task={selectedTask}
        batch={taskBatch}
        dependencies={dependencies}
        onClose={onClose}
      />
    );
  }

  // If an epic is selected but no task, show epic overview
  if (epic) {
    return (
      <EpicOverviewPanel
        epic={epic}
        batches={batches}
        onBatchClick={onBatchClick}
      />
    );
  }

  // Default: show list of open/in-progress epics
  const activeEpics = allEpics.filter(
    (e) => e.status === 'open' || e.status === 'in_progress' || e.status === 'blocked'
  );

  return (
    <div className="p-4 space-y-4 overflow-y-auto h-full bg-slate-950">
      <div>
        <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
          <Layers className="w-5 h-5" />
          Active Epics
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Select an epic to view batch swimlanes
        </p>
      </div>

      {activeEpics.length === 0 ? (
        <div className="text-center text-slate-500 py-8">
          <p>No active epics</p>
          <p className="text-xs mt-1">All epics are closed or deferred</p>
        </div>
      ) : (
        <div className="space-y-2">
          {activeEpics.map((epicItem) => {
            const statusConfig = STATUS_CONFIG[epicItem.status] || STATUS_CONFIG.open;
            const StatusIcon = statusConfig.icon;
            // Count tasks for this epic
            const taskCount = issuesWithDeps.filter(
              (t) => t.parent === epicItem.id && t.issue_type === 'task'
            ).length;

            return (
              <button
                key={epicItem.id}
                onClick={() => onEpicSelect?.(epicItem.id)}
                className="w-full text-left"
              >
                <Card className="p-3 bg-slate-900/50 border-slate-800 hover:bg-slate-800/70 hover:border-slate-700 transition-colors group">
                  <div className="flex items-start gap-3">
                    <StatusIcon className={`w-4 h-4 mt-0.5 ${statusConfig.color}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-slate-500 font-mono">{epicItem.id}</span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${statusConfig.color} border-slate-700`}
                        >
                          {statusConfig.label}
                        </Badge>
                      </div>
                      <h3 className="text-sm font-medium text-slate-200 line-clamp-2">
                        {epicItem.title}
                      </h3>
                      {taskCount > 0 && (
                        <p className="text-xs text-slate-500 mt-1">
                          {taskCount} task{taskCount !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                  </div>
                </Card>
              </button>
            );
          })}
        </div>
      )}

      {/* Show closed epics count */}
      {allEpics.length > activeEpics.length && (
        <p className="text-xs text-slate-600 text-center pt-2">
          + {allEpics.length - activeEpics.length} closed epic{allEpics.length - activeEpics.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}

export default DetailSidebar;
