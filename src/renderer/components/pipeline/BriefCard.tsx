import { useDiscoveryStore } from '../../store/discoveryStore';
import type { Brief, BriefPriority } from '../../../shared/types/discovery';
import { PRIORITY_LABELS } from '../../../shared/types/discovery';
import { Card, CardContent } from '@renderer/components/ui/card';
import { Badge } from '@renderer/components/ui/badge';
import { ProjectBadge } from '../common/ProjectChip';
import { useShowProjectBadge } from '../../hooks/useShowProjectBadge';

interface BriefCardProps {
  brief: Brief;
}

export default function BriefCard({ brief }: BriefCardProps) {
  const { selectBrief, selectedBriefId } = useDiscoveryStore();
  const { showBadge, projectName, projectIndex } = useShowProjectBadge();
  const isSelected = selectedBriefId === brief.id;

  return (
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
        <p className="text-xs text-slate-400 mt-1 line-clamp-2">
          {brief.problem_statement || 'No description'}
        </p>
        <div className="flex items-center justify-between gap-2 mt-2 text-xs text-slate-400">
          <span>{formatDate(brief.created_at)}</span>
          {/* Project badge - shown when multiple projects are loaded */}
          {showBadge && projectName && (
            <ProjectBadge project={projectName} index={projectIndex} />
          )}
        </div>
      </CardContent>
    </Card>
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
