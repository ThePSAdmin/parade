/**
 * Progressive Disclosure Tests for BriefDetailView
 *
 * TDD RED Phase: These tests define the expected behavior for collapsible sections
 * in the Pipeline side panel. All tests should FAIL until the implementation is complete.
 *
 * Requirements:
 * 1. Add collapsible sections to BriefDetailView
 * 2. Sections: Basic Info, Interview Q&A, SME Reviews, Spec Details
 * 3. Default state: all collapsed
 * 4. Click header to expand/collapse
 * 5. Visual indicator for collapsed/expanded state
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BriefDetailView from '@renderer/components/pipeline/BriefDetailView'
import type { BriefWithRelations } from '@shared/types/discovery'

// Mock the discovery store
vi.mock('@renderer/store/discoveryStore', () => ({
  useDiscoveryStore: vi.fn(() => ({
    clearSelection: vi.fn(),
    isBriefLoading: false,
  })),
  useSelectedBrief: vi.fn(() => null),
}))

// Import the mocked module so we can manipulate it
import { useSelectedBrief, useDiscoveryStore } from '@renderer/store/discoveryStore'

// Helper to create mock brief data
function createMockBrief(overrides: Partial<BriefWithRelations> = {}): BriefWithRelations {
  return {
    brief: {
      id: 'brief-123',
      title: 'Test Feature Brief',
      problem_statement: 'Users cannot easily navigate the application',
      initial_thoughts: 'We should add a sidebar navigation',
      priority: 2,
      status: 'in_discovery',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-16T14:30:00Z',
      exported_epic_id: null,
    },
    questions: [
      {
        id: 'q1',
        brief_id: 'brief-123',
        question: 'What navigation patterns do users prefer?',
        category: 'ux',
        answer: 'Users prefer sidebar navigation with icons',
        answered_at: '2024-01-16T11:00:00Z',
        created_at: '2024-01-15T12:00:00Z',
      },
      {
        id: 'q2',
        brief_id: 'brief-123',
        question: 'What is the expected response time?',
        category: 'technical',
        answer: 'Under 100ms for navigation transitions',
        answered_at: '2024-01-16T11:30:00Z',
        created_at: '2024-01-15T12:00:00Z',
      },
    ],
    reviews: [
      {
        id: 'r1',
        brief_id: 'brief-123',
        agent_type: 'technical-sme',
        findings: {
          summary: 'Feasible with current architecture',
          strengths: ['Clean separation of concerns'],
          feasibility: 'high',
        },
        recommendations: 'Use React Router for navigation state',
        concerns: 'Performance impact on initial load',
        created_at: '2024-01-16T13:00:00Z',
      },
      {
        id: 'r2',
        brief_id: 'brief-123',
        agent_type: 'business-sme',
        findings: {
          summary: 'Aligns with business objectives',
          strengths: ['Improved user retention'],
          feasibility: 'high',
        },
        recommendations: 'Consider A/B testing different layouts',
        concerns: 'Training required for support team',
        created_at: '2024-01-16T13:30:00Z',
      },
    ],
    spec: {
      id: 'spec-456',
      brief_id: 'brief-123',
      title: 'Navigation Sidebar Implementation',
      description: 'Add collapsible sidebar navigation with icons',
      acceptance_criteria: [
        { id: 'ac1', description: 'Sidebar appears on all pages', completed: false },
        { id: 'ac2', description: 'Navigation items have icons', completed: false },
      ],
      design_notes: {
        approach: 'Component-based architecture',
        components: ['Sidebar', 'NavItem', 'NavGroup'],
      },
      task_breakdown: [
        { id: 't1', title: 'Create Sidebar component', complexity: 'medium' },
        { id: 't2', title: 'Add navigation state', complexity: 'low' },
      ],
      status: 'review',
      approved_at: null,
      exported_epic_id: null,
      created_at: '2024-01-16T14:00:00Z',
    },
    events: [],
    ...overrides,
  }
}

describe('Progressive Disclosure - BriefDetailView', () => {
  const mockClearSelection = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useDiscoveryStore).mockReturnValue({
      clearSelection: mockClearSelection,
      isBriefLoading: false,
    })
  })

  describe('Section Collapsed State by Default', () => {
    it('should render Basic Info section collapsed by default', () => {
      const mockBrief = createMockBrief()
      vi.mocked(useSelectedBrief).mockReturnValue(mockBrief)

      render(<BriefDetailView />)

      // The section header should be visible
      const basicInfoHeader = screen.getByRole('button', { name: /basic info/i })
      expect(basicInfoHeader).toBeInTheDocument()

      // The content should NOT be visible (collapsed)
      expect(screen.queryByText(mockBrief.brief.problem_statement!)).not.toBeInTheDocument()
    })

    it('should render Interview Q&A section collapsed by default', () => {
      const mockBrief = createMockBrief()
      vi.mocked(useSelectedBrief).mockReturnValue(mockBrief)

      render(<BriefDetailView />)

      // The section header should be visible
      const interviewHeader = screen.getByRole('button', { name: /interview q&a/i })
      expect(interviewHeader).toBeInTheDocument()

      // The questions should NOT be visible (collapsed)
      expect(screen.queryByText('What navigation patterns do users prefer?')).not.toBeInTheDocument()
    })

    it('should render SME Reviews section collapsed by default', () => {
      const mockBrief = createMockBrief()
      vi.mocked(useSelectedBrief).mockReturnValue(mockBrief)

      render(<BriefDetailView />)

      // The section header should be visible
      const reviewsHeader = screen.getByRole('button', { name: /sme reviews/i })
      expect(reviewsHeader).toBeInTheDocument()

      // The review content should NOT be visible (collapsed)
      expect(screen.queryByText('Feasible with current architecture')).not.toBeInTheDocument()
    })

    it('should render Spec Details section collapsed by default', () => {
      const mockBrief = createMockBrief()
      vi.mocked(useSelectedBrief).mockReturnValue(mockBrief)

      render(<BriefDetailView />)

      // The section header should be visible
      const specHeader = screen.getByRole('button', { name: /spec details/i })
      expect(specHeader).toBeInTheDocument()

      // The spec content should NOT be visible (collapsed)
      expect(screen.queryByText('Navigation Sidebar Implementation')).not.toBeInTheDocument()
    })

    it('should have all sections collapsed by default', () => {
      const mockBrief = createMockBrief()
      vi.mocked(useSelectedBrief).mockReturnValue(mockBrief)

      render(<BriefDetailView />)

      // All section headers should be visible
      expect(screen.getByRole('button', { name: /basic info/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /interview q&a/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sme reviews/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /spec details/i })).toBeInTheDocument()

      // None of the content should be visible
      expect(screen.queryByText(mockBrief.brief.problem_statement!)).not.toBeInTheDocument()
      expect(screen.queryByText('What navigation patterns do users prefer?')).not.toBeInTheDocument()
      expect(screen.queryByText('Feasible with current architecture')).not.toBeInTheDocument()
      expect(screen.queryByText('Navigation Sidebar Implementation')).not.toBeInTheDocument()
    })
  })

  describe('Expand Section on Click', () => {
    it('should expand Basic Info section when header is clicked', async () => {
      const user = userEvent.setup()
      const mockBrief = createMockBrief()
      vi.mocked(useSelectedBrief).mockReturnValue(mockBrief)

      render(<BriefDetailView />)

      const basicInfoHeader = screen.getByRole('button', { name: /basic info/i })
      await user.click(basicInfoHeader)

      // Content should now be visible
      expect(screen.getByText(mockBrief.brief.problem_statement!)).toBeInTheDocument()
    })

    it('should expand Interview Q&A section when header is clicked', async () => {
      const user = userEvent.setup()
      const mockBrief = createMockBrief()
      vi.mocked(useSelectedBrief).mockReturnValue(mockBrief)

      render(<BriefDetailView />)

      const interviewHeader = screen.getByRole('button', { name: /interview q&a/i })
      await user.click(interviewHeader)

      // Questions should now be visible
      expect(screen.getByText('What navigation patterns do users prefer?')).toBeInTheDocument()
      expect(screen.getByText('What is the expected response time?')).toBeInTheDocument()
    })

    it('should expand SME Reviews section when header is clicked', async () => {
      const user = userEvent.setup()
      const mockBrief = createMockBrief()
      vi.mocked(useSelectedBrief).mockReturnValue(mockBrief)

      render(<BriefDetailView />)

      const reviewsHeader = screen.getByRole('button', { name: /sme reviews/i })
      await user.click(reviewsHeader)

      // Review content should now be visible
      expect(screen.getByText('technical-sme')).toBeInTheDocument()
      expect(screen.getByText('business-sme')).toBeInTheDocument()
    })

    it('should expand Spec Details section when header is clicked', async () => {
      const user = userEvent.setup()
      const mockBrief = createMockBrief()
      vi.mocked(useSelectedBrief).mockReturnValue(mockBrief)

      render(<BriefDetailView />)

      const specHeader = screen.getByRole('button', { name: /spec details/i })
      await user.click(specHeader)

      // Spec content should now be visible
      expect(screen.getByText('Navigation Sidebar Implementation')).toBeInTheDocument()
    })
  })

  describe('Collapse Section on Second Click', () => {
    it('should collapse Basic Info section when clicked twice', async () => {
      const user = userEvent.setup()
      const mockBrief = createMockBrief()
      vi.mocked(useSelectedBrief).mockReturnValue(mockBrief)

      render(<BriefDetailView />)

      const basicInfoHeader = screen.getByRole('button', { name: /basic info/i })

      // First click - expand
      await user.click(basicInfoHeader)
      expect(screen.getByText(mockBrief.brief.problem_statement!)).toBeInTheDocument()

      // Second click - collapse
      await user.click(basicInfoHeader)
      expect(screen.queryByText(mockBrief.brief.problem_statement!)).not.toBeInTheDocument()
    })

    it('should collapse Interview Q&A section when clicked twice', async () => {
      const user = userEvent.setup()
      const mockBrief = createMockBrief()
      vi.mocked(useSelectedBrief).mockReturnValue(mockBrief)

      render(<BriefDetailView />)

      const interviewHeader = screen.getByRole('button', { name: /interview q&a/i })

      // First click - expand
      await user.click(interviewHeader)
      expect(screen.getByText('What navigation patterns do users prefer?')).toBeInTheDocument()

      // Second click - collapse
      await user.click(interviewHeader)
      expect(screen.queryByText('What navigation patterns do users prefer?')).not.toBeInTheDocument()
    })

    it('should collapse SME Reviews section when clicked twice', async () => {
      const user = userEvent.setup()
      const mockBrief = createMockBrief()
      vi.mocked(useSelectedBrief).mockReturnValue(mockBrief)

      render(<BriefDetailView />)

      const reviewsHeader = screen.getByRole('button', { name: /sme reviews/i })

      // First click - expand
      await user.click(reviewsHeader)
      expect(screen.getByText('technical-sme')).toBeInTheDocument()

      // Second click - collapse
      await user.click(reviewsHeader)
      expect(screen.queryByText('technical-sme')).not.toBeInTheDocument()
    })

    it('should collapse Spec Details section when clicked twice', async () => {
      const user = userEvent.setup()
      const mockBrief = createMockBrief()
      vi.mocked(useSelectedBrief).mockReturnValue(mockBrief)

      render(<BriefDetailView />)

      const specHeader = screen.getByRole('button', { name: /spec details/i })

      // First click - expand
      await user.click(specHeader)
      expect(screen.getByText('Navigation Sidebar Implementation')).toBeInTheDocument()

      // Second click - collapse
      await user.click(specHeader)
      expect(screen.queryByText('Navigation Sidebar Implementation')).not.toBeInTheDocument()
    })
  })

  describe('Visual Expand/Collapse Indicators', () => {
    it('should show collapsed indicator (chevron-right) for collapsed sections', () => {
      const mockBrief = createMockBrief()
      vi.mocked(useSelectedBrief).mockReturnValue(mockBrief)

      render(<BriefDetailView />)

      // All sections should show the collapsed indicator (e.g., ChevronRight icon)
      const collapsedIndicators = screen.getAllByTestId('collapse-indicator-collapsed')
      expect(collapsedIndicators.length).toBeGreaterThanOrEqual(4)
    })

    it('should show expanded indicator (chevron-down) when section is expanded', async () => {
      const user = userEvent.setup()
      const mockBrief = createMockBrief()
      vi.mocked(useSelectedBrief).mockReturnValue(mockBrief)

      render(<BriefDetailView />)

      const basicInfoHeader = screen.getByRole('button', { name: /basic info/i })
      await user.click(basicInfoHeader)

      // Should show expanded indicator for Basic Info
      const expandedIndicator = within(basicInfoHeader).getByTestId('collapse-indicator-expanded')
      expect(expandedIndicator).toBeInTheDocument()
    })

    it('should toggle indicator when section is expanded then collapsed', async () => {
      const user = userEvent.setup()
      const mockBrief = createMockBrief()
      vi.mocked(useSelectedBrief).mockReturnValue(mockBrief)

      render(<BriefDetailView />)

      const basicInfoHeader = screen.getByRole('button', { name: /basic info/i })

      // Initially collapsed
      expect(within(basicInfoHeader).getByTestId('collapse-indicator-collapsed')).toBeInTheDocument()

      // Click to expand
      await user.click(basicInfoHeader)
      expect(within(basicInfoHeader).getByTestId('collapse-indicator-expanded')).toBeInTheDocument()

      // Click to collapse
      await user.click(basicInfoHeader)
      expect(within(basicInfoHeader).getByTestId('collapse-indicator-collapsed')).toBeInTheDocument()
    })

    it('should have aria-expanded attribute for accessibility', async () => {
      const user = userEvent.setup()
      const mockBrief = createMockBrief()
      vi.mocked(useSelectedBrief).mockReturnValue(mockBrief)

      render(<BriefDetailView />)

      const basicInfoHeader = screen.getByRole('button', { name: /basic info/i })

      // Initially should have aria-expanded="false"
      expect(basicInfoHeader).toHaveAttribute('aria-expanded', 'false')

      // After click should have aria-expanded="true"
      await user.click(basicInfoHeader)
      expect(basicInfoHeader).toHaveAttribute('aria-expanded', 'true')

      // After second click should have aria-expanded="false"
      await user.click(basicInfoHeader)
      expect(basicInfoHeader).toHaveAttribute('aria-expanded', 'false')
    })
  })

  describe('Independent Section Expansion', () => {
    it('should allow multiple sections to be expanded simultaneously', async () => {
      const user = userEvent.setup()
      const mockBrief = createMockBrief()
      vi.mocked(useSelectedBrief).mockReturnValue(mockBrief)

      render(<BriefDetailView />)

      const basicInfoHeader = screen.getByRole('button', { name: /basic info/i })
      const interviewHeader = screen.getByRole('button', { name: /interview q&a/i })
      const reviewsHeader = screen.getByRole('button', { name: /sme reviews/i })

      // Expand all three sections
      await user.click(basicInfoHeader)
      await user.click(interviewHeader)
      await user.click(reviewsHeader)

      // All three should be expanded
      expect(screen.getByText(mockBrief.brief.problem_statement!)).toBeInTheDocument()
      expect(screen.getByText('What navigation patterns do users prefer?')).toBeInTheDocument()
      expect(screen.getByText('technical-sme')).toBeInTheDocument()
    })

    it('should allow collapsing one section while others remain expanded', async () => {
      const user = userEvent.setup()
      const mockBrief = createMockBrief()
      vi.mocked(useSelectedBrief).mockReturnValue(mockBrief)

      render(<BriefDetailView />)

      const basicInfoHeader = screen.getByRole('button', { name: /basic info/i })
      const interviewHeader = screen.getByRole('button', { name: /interview q&a/i })

      // Expand both sections
      await user.click(basicInfoHeader)
      await user.click(interviewHeader)

      // Both visible
      expect(screen.getByText(mockBrief.brief.problem_statement!)).toBeInTheDocument()
      expect(screen.getByText('What navigation patterns do users prefer?')).toBeInTheDocument()

      // Collapse only Basic Info
      await user.click(basicInfoHeader)

      // Basic Info should be hidden, Interview Q&A should still be visible
      expect(screen.queryByText(mockBrief.brief.problem_statement!)).not.toBeInTheDocument()
      expect(screen.getByText('What navigation patterns do users prefer?')).toBeInTheDocument()
    })

    it('should expand all sections when all are clicked', async () => {
      const user = userEvent.setup()
      const mockBrief = createMockBrief()
      vi.mocked(useSelectedBrief).mockReturnValue(mockBrief)

      render(<BriefDetailView />)

      const basicInfoHeader = screen.getByRole('button', { name: /basic info/i })
      const interviewHeader = screen.getByRole('button', { name: /interview q&a/i })
      const reviewsHeader = screen.getByRole('button', { name: /sme reviews/i })
      const specHeader = screen.getByRole('button', { name: /spec details/i })

      // Expand all sections
      await user.click(basicInfoHeader)
      await user.click(interviewHeader)
      await user.click(reviewsHeader)
      await user.click(specHeader)

      // All content should be visible
      expect(screen.getByText(mockBrief.brief.problem_statement!)).toBeInTheDocument()
      expect(screen.getByText('What navigation patterns do users prefer?')).toBeInTheDocument()
      expect(screen.getByText('technical-sme')).toBeInTheDocument()
      expect(screen.getByText('Navigation Sidebar Implementation')).toBeInTheDocument()

      // All headers should have aria-expanded="true"
      expect(basicInfoHeader).toHaveAttribute('aria-expanded', 'true')
      expect(interviewHeader).toHaveAttribute('aria-expanded', 'true')
      expect(reviewsHeader).toHaveAttribute('aria-expanded', 'true')
      expect(specHeader).toHaveAttribute('aria-expanded', 'true')
    })
  })

  describe('Section Count Badges', () => {
    it('should display question count in Interview Q&A header', () => {
      const mockBrief = createMockBrief()
      vi.mocked(useSelectedBrief).mockReturnValue(mockBrief)

      render(<BriefDetailView />)

      const interviewHeader = screen.getByRole('button', { name: /interview q&a/i })
      expect(within(interviewHeader).getByText('2')).toBeInTheDocument()
    })

    it('should display review count in SME Reviews header', () => {
      const mockBrief = createMockBrief()
      vi.mocked(useSelectedBrief).mockReturnValue(mockBrief)

      render(<BriefDetailView />)

      const reviewsHeader = screen.getByRole('button', { name: /sme reviews/i })
      expect(within(reviewsHeader).getByText('2')).toBeInTheDocument()
    })
  })

  describe('Empty State Handling', () => {
    it('should not show Interview Q&A section when no questions exist', () => {
      const mockBrief = createMockBrief({ questions: [] })
      vi.mocked(useSelectedBrief).mockReturnValue(mockBrief)

      render(<BriefDetailView />)

      expect(screen.queryByRole('button', { name: /interview q&a/i })).not.toBeInTheDocument()
    })

    it('should not show SME Reviews section when no reviews exist', () => {
      const mockBrief = createMockBrief({ reviews: [] })
      vi.mocked(useSelectedBrief).mockReturnValue(mockBrief)

      render(<BriefDetailView />)

      expect(screen.queryByRole('button', { name: /sme reviews/i })).not.toBeInTheDocument()
    })

    it('should not show Spec Details section when no spec exists', () => {
      const mockBrief = createMockBrief({ spec: null })
      vi.mocked(useSelectedBrief).mockReturnValue(mockBrief)

      render(<BriefDetailView />)

      expect(screen.queryByRole('button', { name: /spec details/i })).not.toBeInTheDocument()
    })
  })

  describe('Keyboard Accessibility', () => {
    it('should expand section on Enter key press', async () => {
      const user = userEvent.setup()
      const mockBrief = createMockBrief()
      vi.mocked(useSelectedBrief).mockReturnValue(mockBrief)

      render(<BriefDetailView />)

      const basicInfoHeader = screen.getByRole('button', { name: /basic info/i })
      basicInfoHeader.focus()

      await user.keyboard('{Enter}')

      expect(screen.getByText(mockBrief.brief.problem_statement!)).toBeInTheDocument()
    })

    it('should expand section on Space key press', async () => {
      const user = userEvent.setup()
      const mockBrief = createMockBrief()
      vi.mocked(useSelectedBrief).mockReturnValue(mockBrief)

      render(<BriefDetailView />)

      const basicInfoHeader = screen.getByRole('button', { name: /basic info/i })
      basicInfoHeader.focus()

      await user.keyboard(' ')

      expect(screen.getByText(mockBrief.brief.problem_statement!)).toBeInTheDocument()
    })
  })
})
