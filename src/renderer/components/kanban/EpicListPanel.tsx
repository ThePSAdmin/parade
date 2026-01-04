// EpicListPanel - Left sidebar showing list of epics to select from

import { Layers, CheckCircle2, Clock, AlertCircle, Circle, ChevronRight } from 'lucide-react';
import type { Issue, IssueStatus } from '../../../shared/types/beads';

interface EpicListPanelProps {
  epics: Issue[];
  selectedEpicId: string | null;
  onEpicSelect: (epicId: string | null) => void;
  taskCounts: Record<string, number>;
}

const STATUS_CONFIG: Record<IssueStatus, { icon: typeof CheckCircle2; color: string; bgColor: string; label: string }> = {
  open: { icon: Circle, color: 'text-slate-400', bgColor: 'bg-slate-800/50', label: 'Open' },
  in_progress: { icon: Clock, color: 'text-blue-400', bgColor: 'bg-blue-900/30', label: 'In Progress' },
  blocked: { icon: AlertCircle, color: 'text-red-400', bgColor: 'bg-red-900/30', label: 'Blocked' },
  deferred: { icon: Clock, color: 'text-amber-400', bgColor: 'bg-amber-900/30', label: 'Deferred' },
  closed: { icon: CheckCircle2, color: 'text-green-400', bgColor: 'bg-green-900/30', label: 'Closed' },
};

export function EpicListPanel({ epics, selectedEpicId, onEpicSelect, taskCounts }: EpicListPanelProps) {
  // Split epics into active and closed
  const activeEpics = epics.filter(
    (e) => e.status === 'open' || e.status === 'in_progress' || e.status === 'blocked'
  );
  const closedEpics = epics.filter((e) => e.status === 'closed');

  return (
    <div className="h-full flex flex-col bg-slate-950">
      {/* Header - matches KanbanFilters height */}
      <div className="h-14 flex items-center px-4 border-b border-slate-800">
        <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          <Layers className="w-4 h-4" />
          Epics
        </h2>
      </div>

      {/* Epic list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {/* Active epics section */}
        {activeEpics.length > 0 && (
          <>
            <div className="px-3 pt-3 pb-1">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
                Active ({activeEpics.length})
              </span>
            </div>
            {activeEpics.map((epic) => (
              <EpicItem
                key={epic.id}
                epic={epic}
                isSelected={selectedEpicId === epic.id}
                taskCount={taskCounts[epic.id] || 0}
                onSelect={() => onEpicSelect(epic.id)}
              />
            ))}
          </>
        )}

        {/* Closed epics section */}
        {closedEpics.length > 0 && (
          <>
            <div className="px-3 pt-4 pb-1">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
                Closed ({closedEpics.length})
              </span>
            </div>
            {closedEpics.map((epic) => (
              <EpicItem
                key={epic.id}
                epic={epic}
                isSelected={selectedEpicId === epic.id}
                taskCount={taskCounts[epic.id] || 0}
                onSelect={() => onEpicSelect(epic.id)}
              />
            ))}
          </>
        )}

        {epics.length === 0 && (
          <div className="text-center text-slate-500 py-8 text-sm">
            No epics found
          </div>
        )}
      </div>
    </div>
  );
}

function EpicItem({
  epic,
  isSelected,
  taskCount,
  onSelect,
}: {
  epic: Issue;
  isSelected: boolean;
  taskCount: number;
  onSelect: () => void;
}) {
  const statusConfig = STATUS_CONFIG[epic.status] || STATUS_CONFIG.open;
  const StatusIcon = statusConfig.icon;

  return (
    <button
      onClick={onSelect}
      className={`
        w-full text-left px-2 py-2 rounded-md transition-colors group
        ${isSelected
          ? 'bg-sky-900/40 ring-1 ring-sky-500/50'
          : 'hover:bg-slate-800/70'
        }
      `}
    >
      <div className="flex items-start gap-2">
        <StatusIcon className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${statusConfig.color}`} />
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-medium line-clamp-2 ${isSelected ? 'text-sky-200' : 'text-slate-300'}`}>
            {epic.title}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-slate-500 font-mono">{epic.id.replace('customTaskTracker-', '')}</span>
            {taskCount > 0 && (
              <span className="text-[10px] text-slate-500">
                {taskCount} task{taskCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
        <ChevronRight className={`w-3 h-3 flex-shrink-0 transition-colors ${isSelected ? 'text-sky-400' : 'text-slate-600 group-hover:text-slate-400'}`} />
      </div>
    </button>
  );
}

export default EpicListPanel;
