// EpicOverviewPanel - Overview when no task is selected
// Shows: overall progress, phase breakdown, batch summary, current activity, blockers

import { Progress } from '@renderer/components/ui/progress';
import { Card } from '@renderer/components/ui/card';
import { Badge } from '@renderer/components/ui/badge';
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Layers,
  Activity,
} from 'lucide-react';
import type { Issue } from '../../../shared/types/beads';
import type { Batch } from '../../lib/batchComputation';
import { getBatchSummary } from '../../lib/batchComputation';

interface EpicOverviewPanelProps {
  epic: Issue;
  batches: Batch[];
  onBatchClick?: (batchNumber: number) => void;
}

export function EpicOverviewPanel({ epic, batches, onBatchClick }: EpicOverviewPanelProps) {
  const summary = getBatchSummary(batches);

  // Calculate overall progress
  const totalTasks = batches.reduce((sum, b) => sum + b.progress.total, 0);
  const completedTasks = batches.reduce((sum, b) => sum + b.progress.completed, 0);
  const overallPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Find active and blocked tasks
  const activeTasks = batches
    .flatMap((b) => b.tasks)
    .filter((t) => t.status === 'in_progress');
  const blockedTasks = batches
    .flatMap((b) => b.tasks)
    .filter((t) => t.status === 'blocked');

  return (
    <div className="p-4 space-y-5 overflow-y-auto h-full bg-slate-950">
      {/* Epic header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-slate-400 font-mono">{epic.id}</span>
          <Badge variant="secondary" className="text-xs bg-slate-800 text-slate-300">
            {epic.issue_type}
          </Badge>
        </div>
        <h2 className="text-xl font-semibold text-slate-100">{epic.title}</h2>
      </div>

      {/* Overall Progress */}
      <section>
        <h3 className="font-medium text-slate-200 mb-2 flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Overall Progress
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-300">{completedTasks} of {totalTasks} tasks completed</span>
            <span className="text-slate-400">{overallPercentage}%</span>
          </div>
          <Progress value={overallPercentage} className="bg-slate-800" />
        </div>
      </section>

      {/* Phase Breakdown */}
      <section>
        <h3 className="font-medium text-slate-200 mb-2">Phase Progress</h3>
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-3 bg-red-900/20 border-red-900/30">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-sm font-medium text-red-300">RED</span>
            </div>
            <div className="text-xs text-red-400">
              {summary.redProgress.completed}/{summary.redProgress.total} tasks
            </div>
          </Card>
          <Card className="p-3 bg-green-900/20 border-green-900/30">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm font-medium text-green-300">GREEN</span>
            </div>
            <div className="text-xs text-green-400">
              {summary.greenProgress.completed}/{summary.greenProgress.total} tasks
            </div>
          </Card>
        </div>
      </section>

      {/* Batch Summary */}
      <section>
        <h3 className="font-medium text-slate-200 mb-2 flex items-center gap-2">
          <Layers className="w-4 h-4" />
          Batches ({summary.completedBatches}/{summary.totalBatches})
        </h3>
        <div className="space-y-1.5">
          {batches.map((batch) => {
            const isActive = batch.status === 'active';
            const isComplete = batch.status === 'complete';
            const isBlocked = batch.status === 'blocked';

            return (
              <button
                key={batch.number}
                onClick={() => onBatchClick?.(batch.number)}
                className={`
                  w-full flex items-center gap-2 px-3 py-2 rounded-md text-left transition-colors
                  ${isActive ? 'bg-blue-900/30 text-blue-300' : ''}
                  ${isComplete ? 'bg-green-900/20 text-green-400' : ''}
                  ${isBlocked ? 'bg-red-900/20 text-red-400' : ''}
                  ${!isActive && !isComplete && !isBlocked ? 'bg-slate-800/50 text-slate-400 hover:bg-slate-800' : ''}
                `}
              >
                {isComplete && <CheckCircle2 className="w-4 h-4" />}
                {isActive && <Loader2 className="w-4 h-4 animate-spin" />}
                {isBlocked && <AlertCircle className="w-4 h-4" />}
                {!isActive && !isComplete && !isBlocked && <Clock className="w-4 h-4" />}

                <span className="text-sm font-medium">Batch {batch.number}</span>

                <Badge
                  variant="outline"
                  className={`text-xs ml-auto border-0 ${
                    batch.phase === 'RED'
                      ? 'bg-red-900/30 text-red-400'
                      : batch.phase === 'GREEN'
                        ? 'bg-green-900/30 text-green-400'
                        : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {batch.phase}
                </Badge>

                <span className="text-xs tabular-nums">
                  {batch.progress.completed}/{batch.progress.total}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Active Tasks */}
      {activeTasks.length > 0 && (
        <section>
          <h3 className="font-medium text-slate-200 mb-2 flex items-center gap-2">
            <Loader2 className="w-4 h-4 text-blue-400" />
            In Progress ({activeTasks.length})
          </h3>
          <div className="space-y-1">
            {activeTasks.map((task) => (
              <Card key={task.id} className="p-2 bg-blue-900/20 border-blue-900/30">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-blue-400 font-mono">{task.id}</span>
                  <span className="text-sm text-blue-200 truncate">{task.title}</span>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Blocked Tasks */}
      {blockedTasks.length > 0 && (
        <section>
          <h3 className="font-medium text-slate-200 mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            Blocked ({blockedTasks.length})
          </h3>
          <div className="space-y-1">
            {blockedTasks.map((task) => (
              <Card key={task.id} className="p-2 bg-red-900/20 border-red-900/30">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-400 font-mono">{task.id}</span>
                  <span className="text-sm text-red-200 truncate">{task.title}</span>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Description */}
      {epic.description && (
        <section className="pt-2 border-t border-slate-800">
          <h3 className="font-medium text-slate-200 mb-1">Description</h3>
          <p className="text-sm text-slate-400 whitespace-pre-wrap">{epic.description}</p>
        </section>
      )}
    </div>
  );
}

export default EpicOverviewPanel;
