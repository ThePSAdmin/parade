// Hook to determine if project badges should be shown on cards
// Shows badge when multiple projects are configured AND not filtered to single project

import { useBeadsStore } from '../store/beadsStore';

interface UseShowProjectBadgeResult {
  /** Whether to show project badge on cards */
  showBadge: boolean;
  /** Current active project info (for badge content) */
  projectName: string | null;
  /** Index for color selection */
  projectIndex: number;
}

/**
 * Determines whether to display project badges on task/brief cards.
 *
 * Badge logic:
 * - Show when multiple projects are configured (projects.length > 1)
 * - Hide when only one project exists
 * - Show active project name for context when user has multiple projects
 *
 * @returns Object with showBadge boolean and project info for display
 */
export function useShowProjectBadge(): UseShowProjectBadgeResult {
  const projects = useBeadsStore((state) => state.projects);
  const activeProjectId = useBeadsStore((state) => state.activeProjectId);

  // Find active project
  const activeProject = activeProjectId
    ? projects.find((p) => p.id === activeProjectId)
    : null;

  // Find index for consistent color
  const projectIndex = activeProject
    ? projects.findIndex((p) => p.id === activeProject.id)
    : 0;

  // Show badge when:
  // 1. Multiple projects exist (so user knows which context they're in)
  // 2. A project is actively selected (we have project info to show)
  const showBadge = projects.length > 1 && activeProject !== null;

  return {
    showBadge,
    projectName: activeProject?.name ?? null,
    projectIndex: projectIndex >= 0 ? projectIndex : 0,
  };
}
