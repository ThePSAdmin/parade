import { useMemo } from 'react';
import { useDiscoveryStore } from '../../store/discoveryStore';
import { useBeadsStore } from '../../store/beadsStore';
import type { Brief, BriefPriority } from '../../../shared/types/discovery';
import { PRIORITY_LABELS } from '../../../shared/types/discovery';
import { Card, CardContent } from '@renderer/components/ui/card';
import { Badge } from '@renderer/components/ui/badge';
import { ProjectBadge } from '../common/ProjectChip';
import { useShowProjectBadge } from '../../hooks/useShowProjectBadge';
import { PulsingCard } from './PulsingCard';
import { AgentActivityBadge } from './AgentActivityBadge';
import { AlertTriangle } from 'lucide-react';

interface BriefCardProps {
  brief: Brief;
}

export default function BriefCard({ brief }: BriefCardProps) {
  const { selectBrief, selectedBriefId } = useDiscoveryStore();
  const { showBadge, projectName, projectIndex } = useShowProjectBadge();
  const beadsIssues = useBeadsStore((state) => state.issues);
  const isSelected = selectedBriefId === brief.id;
  const isPulsing = brief.status === 'in_progress';

  // Get epic progress if exported
  const epicProgress = useMemo(() => {
    if (!brief.exported_epic_id) return null;
    const children = beadsIssues.filter(i => i.parent === brief.exported_epic_id);
    if (children.length === 0) return null;
    const closed = children.filter(i => i.status === 'closed').length;
    return { closed, total: children.length };
  }, [brief.exported_epic_id, beadsIssues]);

  // Get failed (blocked) tasks for this epic
  const failedTasks = useMemo(() => {
    if (!brief.exported_epic_id) return [];
    return beadsIssues.filter(
      (i) => i.parent === brief.exported_epic_id && i.status === 'blocked'
    );
  }, [brief.exported_epic_id, beadsIssues]);

  const hasFailures = failedTasks.length > 0;

  return (
    <PulsingCard isPulsing={isPulsing}>
      <Card
        onClick={() => selectBrief(brief.id)}
        className={`bg-slate-900 border-slate-800 cursor-pointer hover:bg-slate-800 transition-all
          ${isSelected ? 'ring-2 ring-sky-500 border-sky-500' : ''}`}
      >
        <CardContent className="p-3">
          <div className="flex items-start justify-between">
            <h4 className="font-medium text-sm text-slate-100 line-clamp-2">
              {brief.title}
            </h4>
            <PriorityBadge priority={brief.priority} />
          </div>
          {brief.exported_epic_id && (
            <div className="mt-1">
              <AgentActivityBadge epicId={brief.exported_epic_id} />
            </div>
          )}
          <p className="text-xs text-slate-400 mt-1 line-clamp-2">
            {brief.problem_statement || 'No description'}
          </p>
          {epicProgress && (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Progress</span>
                <span>{epicProgress.closed}/{epicProgress.total}</span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-500 transition-all"
                  style={{ width: `${(epicProgress.closed / epicProgress.total) * 100}%` }}
                />
              </div>
            </div>
          )}
          {hasFailures && (
            <div
              className="mt-2 flex items-center gap-1.5 text-amber-400 cursor-help"
              title={failedTasks.map((t) => t.title).join('\n')}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span className="text-xs">
                {failedTasks.length} {failedTasks.length === 1 ? 'task' : 'tasks'} blocked
              </span>
            </div>
          )}
          <div className="flex items-center justify-between gap-2 mt-2 text-xs text-slate-400">
            <span>{formatDate(brief.created_at)}</span>
            {/* Project badge - shown when multiple projects are loaded */}
            {showBadge && projectName && (
              <ProjectBadge project={projectName} index={projectIndex} />
            )}
          </div>
        </CardContent>
      </Card>
    </PulsingCard>
  );
}

function PriorityBadge({ priority }: { priority: BriefPriority }) {
  const colors: Record<BriefPriority, string> = {
    1: 'bg-red-500/20 text-red-400 border-red-500/30',
    2: 'bg-amber-400/20 text-amber-400 border-amber-400/30',
    3: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    4: 'bg-slate-700 text-slate-400 border-slate-600',
  };
  return (
    <Badge variant="outline" className={`${colors[priority] || colors[4]}`}>
      {PRIORITY_LABELS[priority] || 'P4'}
    </Badge>
  );
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString();
}
