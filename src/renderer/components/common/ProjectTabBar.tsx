import { Settings } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { ScrollArea } from '../ui/scroll-area';
import { PROJECT_COLORS } from './ProjectChip';
import type { Project } from '../../../shared/types/settings';

interface ProjectTabBarProps {
  projects: Project[];
  activeProjectId: string | null;
  onProjectSelect: (projectId: string) => void;
}

/**
 * Vertical tab bar for switching between projects.
 * Displays in the sidebar below the logo/title.
 * Shows ScrollArea when more than 8 projects.
 */
export function ProjectTabBar({
  projects,
  activeProjectId,
  onProjectSelect,
}: ProjectTabBarProps) {
  // Empty state: show prompt to add projects
  if (projects.length === 0) {
    return (
      <div className="px-3 py-4">
        <p className="text-xs text-slate-500 mb-2">No projects</p>
        <NavLink
          to="/settings"
          className="flex items-center gap-2 text-xs text-sky-400 hover:text-sky-300 transition-colors"
        >
          <Settings className="w-3 h-3" />
          Add a project
        </NavLink>
      </div>
    );
  }

  const projectList = (
    <div className="flex flex-col gap-0.5">
      {projects.map((project, index) => {
        const isActive = project.id === activeProjectId;
        const color = PROJECT_COLORS[index % PROJECT_COLORS.length];

        return (
          <button
            key={project.id}
            onClick={() => onProjectSelect(project.id)}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
              transition-colors text-left w-full
              ${isActive
                ? 'bg-sky-900/30 text-sky-400'
                : 'text-slate-400 hover:bg-slate-900'
              }
            `}
            title={project.path}
          >
            {/* Color indicator dot */}
            <span
              className={`w-2 h-2 rounded-full flex-shrink-0 ${color.bg.replace('/20', '')}`}
            />
            {/* Project name with truncation */}
            <span className="truncate">
              {project.name}
            </span>
          </button>
        );
      })}
    </div>
  );

  // Use ScrollArea when more than 8 projects (approx 240px height)
  if (projects.length > 8) {
    return (
      <ScrollArea className="max-h-60">
        {projectList}
      </ScrollArea>
    );
  }

  return projectList;
}
