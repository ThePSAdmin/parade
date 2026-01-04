/**
 * useNavigateToPipeline Hook - Navigation helper for Pipeline view
 *
 * This hook provides functions to navigate from Kanban view to Pipeline view,
 * pre-selecting the corresponding brief when navigating from an epic chip.
 */

import { useNavigate } from 'react-router-dom';
import { useDiscoveryStore } from '../store/discoveryStore';
import { findBriefByEpicId } from '../lib/briefResolver';

/**
 * Hook for navigating to Pipeline view with brief selection
 *
 * Provides two navigation methods:
 * - navigateToBrief: Direct navigation when brief ID is known
 * - navigateFromEpic: Resolves epic ID to brief ID first, then navigates
 */
export function useNavigateToPipeline() {
  const navigate = useNavigate();
  const selectBrief = useDiscoveryStore((state) => state.selectBrief);

  /**
   * Navigate to Pipeline view and select a specific brief
   *
   * @param briefId - The brief ID to select in the Pipeline view
   */
  const navigateToBrief = (briefId: string): void => {
    // Select the brief in the discovery store
    selectBrief(briefId);
    // Navigate to the pipeline view
    navigate('/pipeline');
  };

  /**
   * Navigate to Pipeline view from an epic ID
   *
   * Resolves the epic ID to a brief ID via exported_epic_id linkage,
   * then navigates and selects the brief.
   *
   * @param epicId - The epic's bead ID to resolve to a brief
   */
  const navigateFromEpic = async (epicId: string): Promise<void> => {
    try {
      // Resolve the epic ID to a brief ID
      const briefId = await findBriefByEpicId(epicId);

      if (briefId) {
        // Select the brief and navigate
        selectBrief(briefId);
      }
      // Navigate to pipeline even if brief wasn't found
      // (user can still see the pipeline view)
      navigate('/pipeline');
    } catch (error) {
      // Handle errors gracefully - still navigate even on error
      console.error('Failed to navigate from epic:', epicId, error);
      navigate('/pipeline');
    }
  };

  return {
    navigateToBrief,
    navigateFromEpic,
  };
}
