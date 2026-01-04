/**
 * Brief Resolver - Resolves epic IDs to brief IDs
 *
 * This module provides functions to look up briefs by their exported epic ID.
 * Used for Kanban to Pipeline navigation when clicking on an EpicChip.
 */

import discoveryClient from './discoveryClient';

/**
 * Find the brief ID associated with an epic
 *
 * Searches through all briefs to find one whose exported_epic_id matches
 * the given epicId.
 *
 * @param epicId - The epic's bead ID (e.g., "bd-abc1")
 * @returns The brief ID if found, null otherwise
 */
export async function findBriefByEpicId(epicId: string): Promise<string | null> {
  try {
    // Fetch all briefs from discovery database
    const briefs = await discoveryClient.listBriefs();

    // Find the brief whose exported_epic_id matches the given epicId
    const matchingBrief = briefs.find((brief) => brief.exported_epic_id === epicId);

    return matchingBrief?.id ?? null;
  } catch (error) {
    // Handle errors gracefully - return null if lookup fails
    console.error('Failed to resolve brief for epic:', epicId, error);
    return null;
  }
}
