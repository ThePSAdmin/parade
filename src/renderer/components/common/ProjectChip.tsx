import { X } from 'lucide-react';

interface ProjectChipProps {
  project: string;
  index: number;
  onClick?: () => void;
  onRemove?: () => void;
}

interface ProjectBadgeProps {
  project: string;
  index: number;
}

/** Shared color palette for project badges and chips */
export const PROJECT_COLORS = [
  { bg: 'bg-sky-500/20', text: 'text-sky-400', border: 'border-sky-500/30', hover: 'hover:bg-sky-500/30' },
  { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30', hover: 'hover:bg-emerald-500/30' },
  { bg: 'bg-violet-500/20', text: 'text-violet-400', border: 'border-violet-500/30', hover: 'hover:bg-violet-500/30' },
  { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30', hover: 'hover:bg-amber-500/30' },
];

/**
 * Small project badge for use in cards (KanbanCard, BriefCard)
 * Uses smaller padding and font than ProjectChip
 */
export function ProjectBadge({ project, index }: ProjectBadgeProps) {
  const color = PROJECT_COLORS[index % PROJECT_COLORS.length];

  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${color.bg} ${color.text} ${color.border}`}
      title={project}
    >
      {project}
    </span>
  );
}

export function ProjectChip({ project, index, onClick, onRemove }: ProjectChipProps) {
  const color = PROJECT_COLORS[index % PROJECT_COLORS.length];

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-semibold transition-colors ${color.bg} ${color.text} ${color.border} ${onClick ? `cursor-pointer ${color.hover}` : ''}`}
      onClick={onClick}
    >
      <span>{project}</span>
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="hover:opacity-70 transition-opacity"
          aria-label={`Remove ${project}`}
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

interface ProjectChipListProps {
  projects: string[];
  maxVisible?: number;
  onProjectClick?: (project: string, index: number) => void;
  onProjectRemove?: (project: string, index: number) => void;
}

export function ProjectChipList({
  projects,
  maxVisible = 3,
  onProjectClick,
  onProjectRemove,
}: ProjectChipListProps) {
  const visibleProjects = projects.slice(0, maxVisible);
  const hiddenCount = projects.length - maxVisible;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {visibleProjects.map((project, index) => (
        <ProjectChip
          key={`${project}-${index}`}
          project={project}
          index={index}
          onClick={onProjectClick ? () => onProjectClick(project, index) : undefined}
          onRemove={onProjectRemove ? () => onProjectRemove(project, index) : undefined}
        />
      ))}
      {hiddenCount > 0 && (
        <span className="text-xs text-slate-400 px-2">
          +{hiddenCount} more
        </span>
      )}
    </div>
  );
}
