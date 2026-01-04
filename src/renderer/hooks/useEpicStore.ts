/**
 * Hook to look up epic information by ID.
 * Uses the beadsStore to find epics from the loaded issues.
 */

import { useBeadsStore } from '../store/beadsStore';
import type { Issue } from '../../shared/types/beads';

interface EpicInfo {
  id: string;
  title: string;
}

interface UseEpicStoreResult {
  /** Get epic info by ID - returns null if not found */
  getEpicById: (id: string) => EpicInfo | null;
  /** All loaded epics */
  epics: EpicInfo[];
}

/**
 * Hook to access epic information from the beads store.
 * Filters issues to only include epics and provides lookup by ID.
 */
export function useEpicStore(): UseEpicStoreResult {
  const issues = useBeadsStore((state) => state.issues);

  // Filter to only epics and transform to EpicInfo
  const epics: EpicInfo[] = issues
    .filter((issue: Issue) => issue.issue_type === 'epic')
    .map((issue: Issue) => ({
      id: issue.id,
      title: issue.title,
    }));

  // Create a lookup function
  const getEpicById = (id: string): EpicInfo | null => {
    // First check in epics (issue_type === 'epic')
    const epic = epics.find((e) => e.id === id);
    if (epic) return epic;

    // Fallback: check all issues in case parent is not typed as epic
    const issue = issues.find((i: Issue) => i.id === id);
    if (issue) {
      return { id: issue.id, title: issue.title };
    }

    return null;
  };

  return {
    getEpicById,
    epics,
  };
}
