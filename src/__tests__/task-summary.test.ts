/**
 * Task Summary Section Tests (TDD RED Phase)
 *
 * Tests for the TaskSummary section in BriefDetailView that displays:
 * 1. Task count for the epic (from beads)
 * 2. Completion percentage
 * 3. Count of blocked tasks
 * 4. Time in current stage
 *
 * These tests are written BEFORE implementation - they should FAIL.
 *
 * Dependencies:
 * - Sync service (customTaskTracker-lvv.3)
 * - Progressive disclosure (customTaskTracker-lvv.8)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { createElement } from 'react'

// Mock the stores before importing the component
vi.mock('../renderer/store/discoveryStore', () => ({
  useDiscoveryStore: vi.fn(),
  useSelectedBrief: vi.fn(),
}))

vi.mock('../renderer/store/beadsStore', () => ({
  useBeadsStore: vi.fn(),
}))

// Import after mocks are set up
import BriefDetailView from '../renderer/components/pipeline/BriefDetailView'
import { useDiscoveryStore, useSelectedBrief } from '../renderer/store/discoveryStore'
import { useBeadsStore } from '../renderer/store/beadsStore'
import type { BriefWithRelations } from '../shared/types/discovery'
import type { Issue } from '../shared/types/beads'

// Helper to create mock brief with relations
function createMockBriefWithRelations(overrides?: Partial<BriefWithRelations>): BriefWithRelations {
  return {
    brief: {
      id: 'brief-123',
      title: 'Test Brief',
      problem_statement: 'Test problem',
      initial_thoughts: 'Initial thoughts',
      priority: 2,
      status: 'approved',
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-02T10:00:00Z',
      exported_epic_id: 'bd-epic-1',
    },
    questions: [],
    reviews: [],
    spec: null,
    events: [],
    ...overrides,
  }
}

// Helper to create mock tasks
function createMockTasks(count: number, options?: {
  completedCount?: number,
  blockedCount?: number,
}): Issue[] {
  const tasks: Issue[] = []
  const completedCount = options?.completedCount ?? 0
  const blockedCount = options?.blockedCount ?? 0

  for (let i = 0; i < count; i++) {
    let status: Issue['status'] = 'open'
    if (i < completedCount) {
      status = 'closed'
    } else if (i < completedCount + blockedCount) {
      status = 'blocked'
    }

    tasks.push({
      id: `bd-task-${i}`,
      title: `Task ${i + 1}`,
      issue_type: 'task',
      status,
      priority: 2,
      parent: 'bd-epic-1',
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-02T10:00:00Z',
    })
  }

  return tasks
}

// Setup default mocks
function setupMocks(options?: {
  selectedBrief?: BriefWithRelations | null,
  childTasks?: Issue[],
  isLoadingChildren?: boolean,
  isBriefLoading?: boolean,
}) {
  const mockSelectedBrief = options?.selectedBrief ?? createMockBriefWithRelations()
  const mockChildTasks = options?.childTasks ?? []
  const isLoadingChildren = options?.isLoadingChildren ?? false
  const isBriefLoading = options?.isBriefLoading ?? false

  vi.mocked(useSelectedBrief).mockReturnValue(mockSelectedBrief)

  vi.mocked(useDiscoveryStore).mockReturnValue({
    clearSelection: vi.fn(),
    isBriefLoading,
  } as any)

  vi.mocked(useBeadsStore).mockReturnValue({
    childTasks: mockChildTasks,
    isLoadingChildren,
    fetchChildTasks: vi.fn(),
  } as any)
}

describe('TaskSummary Section in BriefDetailView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Section Visibility', () => {
    it('should render TaskSummary section when brief has an exported epic', () => {
      setupMocks({
        selectedBrief: createMockBriefWithRelations({
          brief: {
            id: 'brief-123',
            title: 'Test Brief',
            problem_statement: null,
            initial_thoughts: null,
            priority: 2,
            status: 'exported',
            created_at: '2024-01-01T10:00:00Z',
            updated_at: null,
            exported_epic_id: 'bd-epic-1',
          },
        }),
        childTasks: createMockTasks(5, { completedCount: 2 }),
      })

      render(createElement(BriefDetailView))

      // TaskSummary section should exist with test ID or role
      const section = screen.queryByTestId('task-summary-section')
      expect(section).not.toBeNull()
    })

    it('should NOT render TaskSummary section when brief has no exported epic', () => {
      setupMocks({
        selectedBrief: createMockBriefWithRelations({
          brief: {
            id: 'brief-123',
            title: 'Test Brief',
            problem_statement: null,
            initial_thoughts: null,
            priority: 2,
            status: 'draft',
            created_at: '2024-01-01T10:00:00Z',
            updated_at: null,
            exported_epic_id: null,
          },
        }),
      })

      render(createElement(BriefDetailView))

      expect(screen.queryByTestId('task-summary-section')).toBeNull()
    })

    it('should NOT render TaskSummary section when no brief is selected', () => {
      setupMocks({ selectedBrief: null })

      render(createElement(BriefDetailView))

      expect(screen.queryByTestId('task-summary-section')).toBeNull()
    })
  })

  describe('Task Count Display', () => {
    it('should display total task count', () => {
      setupMocks({
        selectedBrief: createMockBriefWithRelations(),
        childTasks: createMockTasks(8),
      })

      render(createElement(BriefDetailView))

      // Should show "8 tasks" or similar
      const taskCountText = screen.queryByText(/8\s*tasks?/i)
      expect(taskCountText).not.toBeNull()
    })

    it('should display "0 tasks" when no tasks exist', () => {
      setupMocks({
        selectedBrief: createMockBriefWithRelations(),
        childTasks: [],
      })

      render(createElement(BriefDetailView))

      const taskCountText = screen.queryByText(/0\s*tasks?/i)
      expect(taskCountText).not.toBeNull()
    })

    it('should display "1 task" (singular) when only one task exists', () => {
      setupMocks({
        selectedBrief: createMockBriefWithRelations(),
        childTasks: createMockTasks(1),
      })

      render(createElement(BriefDetailView))

      const taskCountText = screen.queryByText(/1\s*task\b/i)
      expect(taskCountText).not.toBeNull()
    })
  })

  describe('Completion Percentage Display', () => {
    it('should display completion percentage based on closed tasks', () => {
      // 3 out of 10 tasks completed = 30%
      setupMocks({
        selectedBrief: createMockBriefWithRelations(),
        childTasks: createMockTasks(10, { completedCount: 3 }),
      })

      render(createElement(BriefDetailView))

      const percentageText = screen.queryByText(/30%/)
      expect(percentageText).not.toBeNull()
    })

    it('should display 0% when no tasks are completed', () => {
      setupMocks({
        selectedBrief: createMockBriefWithRelations(),
        childTasks: createMockTasks(5, { completedCount: 0 }),
      })

      render(createElement(BriefDetailView))

      const percentageText = screen.queryByText(/0%/)
      expect(percentageText).not.toBeNull()
    })

    it('should display 100% when all tasks are completed', () => {
      setupMocks({
        selectedBrief: createMockBriefWithRelations(),
        childTasks: createMockTasks(5, { completedCount: 5 }),
      })

      render(createElement(BriefDetailView))

      const percentageText = screen.queryByText(/100%/)
      expect(percentageText).not.toBeNull()
    })

    it('should round percentage to nearest integer', () => {
      // 1 out of 3 = 33.33...% -> should show 33%
      setupMocks({
        selectedBrief: createMockBriefWithRelations(),
        childTasks: createMockTasks(3, { completedCount: 1 }),
      })

      render(createElement(BriefDetailView))

      const percentageText = screen.queryByText(/33%/)
      expect(percentageText).not.toBeNull()
    })

    it('should handle edge case of 0 tasks (show N/A or 0%)', () => {
      setupMocks({
        selectedBrief: createMockBriefWithRelations(),
        childTasks: [],
      })

      render(createElement(BriefDetailView))

      // Either 0% or N/A is acceptable
      const percentageOrNA = screen.queryByText(/0%/) || screen.queryByText(/N\/A/i)
      expect(percentageOrNA).not.toBeNull()
    })
  })

  describe('Blocked Tasks Count Display', () => {
    it('should display count of blocked tasks', () => {
      setupMocks({
        selectedBrief: createMockBriefWithRelations(),
        childTasks: createMockTasks(10, { completedCount: 3, blockedCount: 2 }),
      })

      render(createElement(BriefDetailView))

      // Should show "2 blocked" or similar
      const blockedText = screen.queryByText(/2\s*blocked/i)
      expect(blockedText).not.toBeNull()
    })

    it('should display "0 blocked" when no tasks are blocked', () => {
      setupMocks({
        selectedBrief: createMockBriefWithRelations(),
        childTasks: createMockTasks(5, { completedCount: 2, blockedCount: 0 }),
      })

      render(createElement(BriefDetailView))

      const blockedText = screen.queryByText(/0\s*blocked/i)
      expect(blockedText).not.toBeNull()
    })

    it('should highlight blocked tasks visually (warning style)', () => {
      setupMocks({
        selectedBrief: createMockBriefWithRelations(),
        childTasks: createMockTasks(5, { blockedCount: 3 }),
      })

      render(createElement(BriefDetailView))

      // Should have a warning indicator when blocked tasks exist
      const blockedElement = screen.queryByTestId('blocked-tasks-indicator')
      expect(blockedElement).not.toBeNull()
      // Should have warning/alert styling (amber/yellow/red)
      expect(blockedElement?.className).toMatch(/warning|amber|yellow|red|alert/i)
    })
  })

  describe('Time in Stage Display', () => {
    it('should display time in current stage', () => {
      // Brief updated 2 days ago
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()

      setupMocks({
        selectedBrief: createMockBriefWithRelations({
          brief: {
            id: 'brief-123',
            title: 'Test Brief',
            problem_statement: null,
            initial_thoughts: null,
            priority: 2,
            status: 'approved',
            created_at: '2024-01-01T10:00:00Z',
            updated_at: twoDaysAgo,
            exported_epic_id: 'bd-epic-1',
          },
        }),
        childTasks: createMockTasks(5),
      })

      render(createElement(BriefDetailView))

      // Should show "2 days" or "2d" or similar
      const timeText = screen.queryByText(/2\s*(days?|d\b)/i)
      expect(timeText).not.toBeNull()
    })

    it('should display hours when less than 1 day', () => {
      // Brief updated 5 hours ago
      const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()

      setupMocks({
        selectedBrief: createMockBriefWithRelations({
          brief: {
            id: 'brief-123',
            title: 'Test Brief',
            problem_statement: null,
            initial_thoughts: null,
            priority: 2,
            status: 'approved',
            created_at: '2024-01-01T10:00:00Z',
            updated_at: fiveHoursAgo,
            exported_epic_id: 'bd-epic-1',
          },
        }),
        childTasks: createMockTasks(5),
      })

      render(createElement(BriefDetailView))

      // Should show "5 hours" or "5h" or similar
      const timeText = screen.queryByText(/5\s*(hours?|h\b)/i)
      expect(timeText).not.toBeNull()
    })

    it('should display "just now" or minutes for very recent updates', () => {
      // Brief updated 30 minutes ago
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()

      setupMocks({
        selectedBrief: createMockBriefWithRelations({
          brief: {
            id: 'brief-123',
            title: 'Test Brief',
            problem_statement: null,
            initial_thoughts: null,
            priority: 2,
            status: 'approved',
            created_at: '2024-01-01T10:00:00Z',
            updated_at: thirtyMinutesAgo,
            exported_epic_id: 'bd-epic-1',
          },
        }),
        childTasks: createMockTasks(5),
      })

      render(createElement(BriefDetailView))

      // Should show "30 minutes", "30m", "30 min" or "just now"
      const timeText = screen.queryByText(/30\s*(minutes?|min|m\b)/i) ||
                       screen.queryByText(/just\s*now/i) ||
                       screen.queryByText(/<\s*1\s*(hour|h\b)/i)
      expect(timeText).not.toBeNull()
    })

    it('should use created_at when updated_at is null', () => {
      // Brief created 3 days ago, never updated
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()

      setupMocks({
        selectedBrief: createMockBriefWithRelations({
          brief: {
            id: 'brief-123',
            title: 'Test Brief',
            problem_statement: null,
            initial_thoughts: null,
            priority: 2,
            status: 'approved',
            created_at: threeDaysAgo,
            updated_at: null,
            exported_epic_id: 'bd-epic-1',
          },
        }),
        childTasks: createMockTasks(5),
      })

      render(createElement(BriefDetailView))

      // Should show "3 days" or similar
      const timeText = screen.queryByText(/3\s*(days?|d\b)/i)
      expect(timeText).not.toBeNull()
    })
  })

  describe('No Tasks State (Graceful Handling)', () => {
    it('should display empty state message when epic has no tasks', () => {
      setupMocks({
        selectedBrief: createMockBriefWithRelations(),
        childTasks: [],
      })

      render(createElement(BriefDetailView))

      // Should show some indication that there are no tasks
      const noTasksMessage = screen.queryByText(/no\s*tasks/i) ||
                              screen.queryByText(/0\s*tasks?/i) ||
                              screen.queryByText(/not\s*started/i)
      expect(noTasksMessage).not.toBeNull()
    })

    it('should still show the section card when no tasks exist', () => {
      setupMocks({
        selectedBrief: createMockBriefWithRelations(),
        childTasks: [],
      })

      render(createElement(BriefDetailView))

      // The section should still be visible even with no tasks
      const section = screen.queryByTestId('task-summary-section')
      expect(section).not.toBeNull()
    })

    it('should show 0% completion and 0 blocked for empty task list', () => {
      setupMocks({
        selectedBrief: createMockBriefWithRelations(),
        childTasks: [],
      })

      render(createElement(BriefDetailView))

      // Either show 0% or N/A for completion
      const completionText = screen.queryByText(/0%/) || screen.queryByText(/N\/A/i)
      expect(completionText).not.toBeNull()

      // Should show 0 blocked
      const blockedText = screen.queryByText(/0\s*blocked/i)
      expect(blockedText).not.toBeNull()
    })
  })

  describe('Loading State', () => {
    it('should show loading indicator while fetching child tasks', () => {
      setupMocks({
        selectedBrief: createMockBriefWithRelations(),
        childTasks: [],
        isLoadingChildren: true,
      })

      render(createElement(BriefDetailView))

      // Should show loading state in task summary
      const loadingIndicator = screen.queryByTestId('task-summary-loading') ||
                                screen.queryByText(/loading/i) ||
                                screen.queryByRole('progressbar')
      expect(loadingIndicator).not.toBeNull()
    })
  })

  describe('Section Title and Structure', () => {
    it('should have a "Task Progress" or similar section title', () => {
      setupMocks({
        selectedBrief: createMockBriefWithRelations(),
        childTasks: createMockTasks(5, { completedCount: 2 }),
      })

      render(createElement(BriefDetailView))

      // Should have a recognizable title
      const sectionTitle = screen.queryByText(/task\s*(progress|summary|status)/i) ||
                            screen.queryByText(/epic\s*(progress|status)/i) ||
                            screen.queryByText(/implementation\s*(progress|status)/i)
      expect(sectionTitle).not.toBeNull()
    })

    it('should be wrapped in a Card component like other sections', () => {
      setupMocks({
        selectedBrief: createMockBriefWithRelations(),
        childTasks: createMockTasks(5),
      })

      render(createElement(BriefDetailView))

      const section = screen.queryByTestId('task-summary-section')
      expect(section).not.toBeNull()
      // Should have card styling (checking for common card class patterns)
      expect(section?.className).toMatch(/card|bg-slate-900|border/i)
    })
  })

  describe('Integration with beadsStore', () => {
    it('should call fetchChildTasks when brief with exported_epic_id is selected', async () => {
      const mockFetchChildTasks = vi.fn()

      vi.mocked(useSelectedBrief).mockReturnValue(createMockBriefWithRelations())
      vi.mocked(useDiscoveryStore).mockReturnValue({
        clearSelection: vi.fn(),
        isBriefLoading: false,
      } as any)
      vi.mocked(useBeadsStore).mockReturnValue({
        childTasks: [],
        isLoadingChildren: false,
        fetchChildTasks: mockFetchChildTasks,
      } as any)

      render(createElement(BriefDetailView))

      // The component should trigger fetching child tasks for the epic
      await waitFor(() => {
        expect(mockFetchChildTasks).toHaveBeenCalledWith('bd-epic-1')
      })
    })
  })

  describe('Progress Bar (Visual)', () => {
    it('should render a progress bar showing completion', () => {
      setupMocks({
        selectedBrief: createMockBriefWithRelations(),
        childTasks: createMockTasks(10, { completedCount: 4 }),
      })

      render(createElement(BriefDetailView))

      // Should have a progress bar element
      const progressBar = screen.queryByRole('progressbar') ||
                          screen.queryByTestId('task-progress-bar')
      expect(progressBar).not.toBeNull()
    })

    it('should set progress bar value correctly', () => {
      // 4 out of 10 = 40%
      setupMocks({
        selectedBrief: createMockBriefWithRelations(),
        childTasks: createMockTasks(10, { completedCount: 4 }),
      })

      render(createElement(BriefDetailView))

      const progressBar = screen.queryByRole('progressbar')
      expect(progressBar).not.toBeNull()
      // Progress bar should have aria-valuenow or data attribute showing 40
      expect(progressBar?.getAttribute('aria-valuenow')).toBe('40')
    })
  })
})
