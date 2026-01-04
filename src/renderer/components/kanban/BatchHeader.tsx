// BatchHeader - Shows batch number, phase, progress, and status
// Click to toggle collapse

import { ChevronDown, ChevronRight, CheckCircle2, Loader2, AlertCircle, Clock } from 'lucide-react';
import { Badge } from '@renderer/components/ui/badge';
import type { Batch, BatchPhase, BatchStatus } from '../../lib/batchComputation';

interface BatchHeaderProps {
  batch: Batch;
  isCollapsed: boolean;
  onToggle: () => void;
}

const PHASE_CONFIG: Record<BatchPhase, { label: string; color: string; bgColor: string }> = {
  RED: { label: 'RED', color: 'text-red-400', bgColor: 'bg-red-900/30' },
  GREEN: { label: 'GREEN', color: 'text-green-400', bgColor: 'bg-green-900/30' },
  MIXED: { label: 'MIXED', color: 'text-slate-400', bgColor: 'bg-slate-800' },
};

const STATUS_CONFIG: Record<BatchStatus, { icon: typeof CheckCircle2; color: string }> = {
  complete: { icon: CheckCircle2, color: 'text-green-400' },
  active: { icon: Loader2, color: 'text-blue-400' },
  blocked: { icon: AlertCircle, color: 'text-red-400' },
  waiting: { icon: Clock, color: 'text-slate-500' },
};

export function BatchHeader({ batch, isCollapsed, onToggle }: BatchHeaderProps) {
  const phaseConfig = PHASE_CONFIG[batch.phase];
  const statusConfig = STATUS_CONFIG[batch.status];
  const StatusIcon = statusConfig.icon;

  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-800/50 transition-colors rounded-lg group"
    >
      {/* Collapse indicator */}
      <div className="text-slate-400 group-hover:text-slate-300">
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </div>

      {/* Batch number */}
      <span className="text-sm font-semibold text-slate-200 min-w-[70px]">
        Batch {batch.number}
      </span>

      {/* Phase badge */}
      <Badge
        variant="outline"
        className={`text-xs ${phaseConfig.bgColor} ${phaseConfig.color} border-0`}
      >
        {phaseConfig.label}
      </Badge>

      {/* Progress */}
      <div className="flex items-center gap-2 flex-1">
        <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-sky-500 transition-all duration-300"
            style={{ width: `${batch.progress.percentage}%` }}
          />
        </div>
        <span className="text-xs text-slate-400 tabular-nums">
          {batch.progress.completed}/{batch.progress.total}
        </span>
      </div>

      {/* Status icon */}
      <StatusIcon
        className={`w-4 h-4 ${statusConfig.color} ${batch.status === 'active' ? 'animate-spin' : ''}`}
      />
    </button>
  );
}

export default BatchHeader;
