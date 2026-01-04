/**
 * Sync Service - Syncs beads epic status to brief status in discovery.db
 *
 * Status Mapping:
 * - epic 'in_progress' -> brief 'in_progress'
 * - epic 'closed' -> brief 'completed'
 * - epic 'open', 'blocked', 'deferred' -> null (no change)
 */

import type { IssueStatus } from '../../shared/types/beads'
import type { Brief, BriefStatus } from '../../shared/types/discovery'
import { discoveryService } from './discovery'
import { beadsService } from './beads'

// ============================================================================
// Type Definitions
// ============================================================================

/** Result of a sync operation */
export interface SyncResult {
  success: boolean
  briefId?: string
  newBriefStatus?: string
  skipped?: boolean
  reason?: string
  error?: string
}

/** Event payload for epic status changes */
export interface EpicStatusChangeEvent {
  epicId: string
  previousStatus: IssueStatus
  newStatus: IssueStatus
  timestamp: string
}

/** Event handler result */
export interface EventHandlerResult {
  processed: boolean
  briefId?: string
  error?: string
}

// ============================================================================
// Status Mapping Function
// ============================================================================

/**
 * Maps beads epic status to brief status.
 *
 * Mappings:
 * - 'in_progress' -> 'in_progress'
 * - 'closed' -> 'completed'
 * - 'open', 'blocked', 'deferred' -> null (no change)
 *
 * @param epicStatus - The beads epic status
 * @returns The corresponding brief status, or null if no mapping
 */
export function mapEpicStatusToBriefStatus(epicStatus: IssueStatus): BriefStatus | null {
  switch (epicStatus) {
    case 'in_progress':
      return 'in_progress'
    case 'closed':
      return 'completed'
    case 'open':
    case 'blocked':
    case 'deferred':
    default:
      return null
  }
}

// ============================================================================
// SyncService Class
// ============================================================================

/**
 * Service for syncing beads epic status changes to brief status in discovery.db.
 *
 * Features:
 * 1. Watch for beads epic status changes
 * 2. Map epic statuses to brief statuses
 * 3. Update discovery.db when epic status changes
 * 4. Event-driven architecture
 */
export class SyncService {
  /**
   * Syncs a beads epic status change to the corresponding brief.
   *
   * @param epicId - The beads epic ID (e.g., 'bd-abc123')
   * @param newStatus - The new epic status
   * @returns Result of the sync operation
   */
  async syncEpicStatusToBrief(epicId: string, newStatus: IssueStatus): Promise<SyncResult> {
    try {
      // Check if there's a mapping for this status
      const briefStatus = mapEpicStatusToBriefStatus(newStatus)
      if (briefStatus === null) {
        return {
          success: true,
          skipped: true,
          reason: 'no_mapping',
        }
      }

      // Find the brief associated with this epic
      const brief = await this.findBriefByEpicId(epicId)
      if (!brief) {
        return {
          success: false,
          error: `No brief found for epic ${epicId}`,
        }
      }

      // Update the brief status
      await discoveryService.updateBriefStatus(brief.id, briefStatus)

      return {
        success: true,
        briefId: brief.id,
        newBriefStatus: briefStatus,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return {
        success: false,
        error: errorMessage,
      }
    }
  }

  /**
   * Finds a brief by its exported epic ID.
   *
   * @param epicId - The beads epic ID to search for
   * @returns The brief if found, null otherwise
   * @throws Error if database access fails
   */
  async findBriefByEpicId(epicId: string): Promise<Brief | null> {
    // Let database errors propagate so they can be handled by callers
    const briefs = discoveryService.listBriefs()
    const matchingBrief = briefs.find((brief) => brief.exported_epic_id === epicId)
    return matchingBrief || null
  }

  /**
   * Event handler for epic status changes.
   * Can be subscribed to beads status change events.
   *
   * @param event - The status change event
   * @returns Result of processing the event
   */
  async onEpicStatusChange(event: EpicStatusChangeEvent): Promise<EventHandlerResult> {
    try {
      // Check if there's a mapping for this status
      const briefStatus = mapEpicStatusToBriefStatus(event.newStatus)
      if (briefStatus === null) {
        // No mapping, but event was processed successfully
        return {
          processed: true,
        }
      }

      // Find and update the brief
      const brief = await this.findBriefByEpicId(event.epicId)
      if (!brief) {
        return {
          processed: true,
          // No brief found, but that's not an error - the epic may not be linked to a brief
        }
      }

      // Update the brief status
      await discoveryService.updateBriefStatus(brief.id, briefStatus)

      return {
        processed: true,
        briefId: brief.id,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return {
        processed: false,
        error: errorMessage,
      }
    }
  }

  /**
   * Syncs all exported briefs with their current epic statuses.
   * Useful for initial sync or recovery.
   *
   * @returns Array of sync results for each brief
   */
  async syncAllExportedBriefs(): Promise<SyncResult[]> {
    const results: SyncResult[] = []

    try {
      // Get all briefs
      const briefs = discoveryService.listBriefs()

      // Filter to only exported briefs (those with an epic ID)
      const exportedBriefs = briefs.filter((brief) => brief.exported_epic_id)

      // Sync each exported brief
      for (const brief of exportedBriefs) {
        try {
          // Get the epic status from beads
          const { issue: epic } = await beadsService.get(brief.exported_epic_id!)

          if (!epic) {
            results.push({
              success: false,
              briefId: brief.id,
              error: `Epic ${brief.exported_epic_id} not found in beads`,
            })
            continue
          }

          // Map and update the brief status
          const briefStatus = mapEpicStatusToBriefStatus(epic.status)
          if (briefStatus === null) {
            results.push({
              success: true,
              briefId: brief.id,
              skipped: true,
              reason: 'no_mapping',
            })
            continue
          }

          // Update the brief status
          await discoveryService.updateBriefStatus(brief.id, briefStatus)

          results.push({
            success: true,
            briefId: brief.id,
            newBriefStatus: briefStatus,
          })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error)
          results.push({
            success: false,
            briefId: brief.id,
            error: errorMessage,
          })
        }
      }

      return results
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return [{
        success: false,
        error: errorMessage,
      }]
    }
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const syncService = new SyncService()
export default syncService
