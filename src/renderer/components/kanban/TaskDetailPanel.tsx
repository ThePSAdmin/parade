// TaskDetailPanel - Enhanced detail view for a selected task
// Shows: ID, status, phase, agent, batch, dependencies, acceptance criteria, design notes

import { X, GitBranch, CheckCircle2, Circle, AlertCircle, Clock } from 'lucide-react';
import { Badge } from '@renderer/components/ui/badge';
import { Card } from '@renderer/components/ui/card';
import type { Issue, IssueStatus } from '../../../shared/types/beads';
import type { Batch } from '../../lib/batchComputation';
import { getAgentLabel } from '../../lib/batchComputation';

interface TaskDetailPanelProps {
  task: Issue;
  batch?: Batch;
  dependencies?: Issue[];
  onClose: () => void;
}

const STATUS_CONFIG: Record<IssueStatus, { icon: typeof CheckCircle2; color: string; label: string }> = {
  open: { icon: Circle, color: 'text-slate-400', label: 'Open' },
  in_progress: { icon: Clock, color: 'text-blue-400', label: 'In Progress' },
  blocked: { icon: AlertCircle, color: 'text-red-400', label: 'Blocked' },
  deferred: { icon: Clock, color: 'text-amber-400', label: 'Deferred' },
  closed: { icon: CheckCircle2, color: 'text-green-400', label: 'Closed' },
};

export function TaskDetailPanel({ task, batch, dependencies = [], onClose }: TaskDetailPanelProps) {
  const agentLabel = getAgentLabel(task);
  const statusConfig = STATUS_CONFIG[task.status] || STATUS_CONFIG.open;
  const StatusIcon = statusConfig.icon;

  // Parse acceptance criteria as checklist if it has markdown checkboxes
  const parseAcceptanceCriteria = (text?: string) => {
    if (!text) return null;
    const lines = text.split('\n');
    const hasCheckboxes = lines.some((l) => /^\s*[-*]\s*\[[ x]\]/i.test(l));

    if (!hasCheckboxes) return null;

    return lines
      .filter((l) => /^\s*[-*]\s*\[[ x]\]/i.test(l))
      .map((l) => {
        const isChecked = /^\s*[-*]\s*\[x\]/i.test(l);
        const text = l.replace(/^\s*[-*]\s*\[[ x]\]\s*/i, '');
        return { isChecked, text };
      });
  };

  const checklist = parseAcceptanceCriteria(task.acceptance_criteria || task.acceptance);

  return (
    <div className="h-full flex flex-col bg-slate-950">
      {/* Header - fixed height to match other panels */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-slate-800 flex-shrink-0">
        <h2 className="text-sm font-semibold text-slate-100">Task Details</h2>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-100 p-1 hover:bg-slate-800 rounded transition-colors"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Task info */}
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-xs text-slate-400 font-mono">{task.id}</span>
            <Badge
              variant="outline"
              className={`text-xs ${statusConfig.color} border-slate-700`}
            >
              <StatusIcon className="w-3 h-3 mr-1" />
              {statusConfig.label}
            </Badge>
            {batch && (
              <Badge variant="secondary" className="text-xs bg-slate-800 text-slate-300">
                Batch {batch.number}
              </Badge>
            )}
            {agentLabel && (
              <Badge variant="secondary" className="text-xs bg-sky-900/50 text-sky-300">
                {agentLabel}
              </Badge>
            )}
          </div>
          <h3 className="text-base font-semibold text-slate-100">{task.title}</h3>
        </div>

        {/* Dependencies section */}
      {dependencies.length > 0 && (
        <section>
          <h3 className="font-medium text-slate-200 mb-2 flex items-center gap-2">
            <GitBranch className="w-4 h-4" />
            Dependencies ({dependencies.length})
          </h3>
          <div className="space-y-1.5">
            {dependencies.map((dep) => {
              const depStatus = STATUS_CONFIG[dep.status] || STATUS_CONFIG.open;
              const DepIcon = depStatus.icon;
              return (
                <Card key={dep.id} className="p-2 bg-slate-900/50 border-slate-800">
                  <div className="flex items-center gap-2">
                    <DepIcon className={`w-4 h-4 ${depStatus.color}`} />
                    <span className="text-xs text-slate-400 font-mono">{dep.id}</span>
                    <span className="text-sm text-slate-300 truncate flex-1">{dep.title}</span>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* Description */}
      {task.description && (
        <section>
          <h3 className="font-medium text-slate-200 mb-1">Description</h3>
          <p className="text-sm text-slate-400 whitespace-pre-wrap">{task.description}</p>
        </section>
      )}

      {/* Acceptance Criteria */}
      {(task.acceptance_criteria || task.acceptance) && (
        <section>
          <h3 className="font-medium text-slate-200 mb-2">Acceptance Criteria</h3>
          {checklist ? (
            <div className="space-y-1">
              {checklist.map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  {item.isChecked ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                  )}
                  <span className={`text-sm ${item.isChecked ? 'text-slate-500 line-through' : 'text-slate-300'}`}>
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 whitespace-pre-wrap">
              {task.acceptance_criteria || task.acceptance}
            </p>
          )}
        </section>
      )}

      {/* Design Notes */}
      {task.design && (
        <section>
          <h3 className="font-medium text-slate-200 mb-1">Design Notes</h3>
          <p className="text-sm text-slate-400 whitespace-pre-wrap">{task.design}</p>
        </section>
      )}

      {/* Metadata */}
      <section className="pt-2 border-t border-slate-800">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-slate-500">Created:</span>{' '}
            <span className="text-slate-400">
              {new Date(task.created_at).toLocaleDateString()}
            </span>
          </div>
          <div>
            <span className="text-slate-500">Updated:</span>{' '}
            <span className="text-slate-400">
              {new Date(task.updated_at).toLocaleDateString()}
            </span>
          </div>
          {task.parent && (
            <div className="col-span-2">
              <span className="text-slate-500">Parent:</span>{' '}
              <span className="text-slate-400 font-mono">{task.parent}</span>
            </div>
          )}
        </div>
      </section>
      </div>
    </div>
  );
}

export default TaskDetailPanel;
