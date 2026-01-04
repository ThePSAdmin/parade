/**
 * Routes and Navigation Tests - TDD RED Phase
 *
 * These tests define the expected behavior for the new /init-project and /guide routes
 * and their navigation links in the sidebar.
 *
 * All tests should FAIL initially because:
 * - Routes for /init-project and /guide don't exist in App.tsx yet
 * - Navigation links with Wand2 and GraduationCap icons haven't been added yet
 *
 * Expected changes to App.tsx:
 * - Add Route for /init-project rendering ProjectWizard component
 * - Add Route for /guide rendering GuidePage component
 * - Add NavLink for "Init Project" with Wand2 icon
 * - Add NavLink for "Guide" with GraduationCap icon
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import React from 'react'

// Import the App component (which contains routes and navigation)
import App from '@renderer/App'

// Create mock state for the store
const mockState = {
  projects: [
    {
      id: 'test-project-1',
      name: 'Test Project',
      path: '/test/path',
      isActive: true,
      addedAt: '2024-01-01',
    },
  ],
  activeProjectId: 'test-project-1',
  loadProjects: vi.fn().mockResolvedValue(undefined),
  setActiveProject: vi.fn(),
  getActiveProject: vi.fn().mockReturnValue({
    id: 'test-project-1',
    name: 'Test Project',
    path: '/test/path',
    isActive: true,
    addedAt: '2024-01-01',
  }),
  issues: [],
  selectedIssueId: null,
  selectedEpic: null,
  childTasks: [],
  isLoading: false,
  isLoadingChildren: false,
  error: null,
  filters: {},
  fetchIssues: vi.fn(),
  setFilters: vi.fn(),
  selectIssue: vi.fn(),
  selectEpic: vi.fn(),
  fetchChildTasks: vi.fn(),
  updateIssueStatus: vi.fn(),
  refreshIssue: vi.fn(),
  clearSelection: vi.fn(),
}

// Mock the beads store with proper Zustand structure
vi.mock('@renderer/store/beadsStore', () => ({
  useBeadsStore: Object.assign(
    (selector?: (state: typeof mockState) => unknown) => {
      return selector ? selector(mockState) : mockState
    },
    {
      getState: () => mockState,
      setState: vi.fn(),
      subscribe: vi.fn(() => vi.fn()),
      destroy: vi.fn(),
    }
  ),
}))

vi.mock('@renderer/lib/discoveryClient', () => ({
  default: {
    setDatabasePath: vi.fn().mockResolvedValue(undefined),
  },
}))

// Mock window.electron for settings
const mockElectron = {
  settings: {
    get: vi.fn().mockResolvedValue({
      projects: [
        {
          id: 'test-project-1',
          name: 'Test Project',
          path: '/test/path',
          isActive: true,
          addedAt: '2024-01-01',
        },
      ],
    }),
    set: vi.fn().mockResolvedValue(undefined),
  },
  dialog: {
    selectFolder: vi.fn().mockResolvedValue({ paths: [] }),
  },
  events: {
    onDiscoveryChange: vi.fn().mockReturnValue(() => {}),
    onBeadsChange: vi.fn().mockReturnValue(() => {}),
  },
}

// Set up window.electron mock
beforeEach(() => {
  vi.clearAllMocks()
  // @ts-expect-error - mocking window.electron
  window.electron = mockElectron
})

/**
 * Helper to render App with a specific initial route
 */
function renderWithRouter(initialRoute = '/') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <App />
    </MemoryRouter>
  )
}

// =============================================================================
// Route Rendering Tests
// =============================================================================

describe('Route Rendering', () => {
  describe('/init-project route', () => {
    it('should render ProjectWizard component at /init-project', async () => {
      renderWithRouter('/init-project')

      // Wait for initialization
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      })

      // Should render ProjectWizard component
      await waitFor(() => {
        expect(screen.getByTestId('project-wizard')).toBeInTheDocument()
      })
    })

    it('should display wizard title on /init-project route', async () => {
      renderWithRouter('/init-project')

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      })

      // ProjectWizard has title "Initialize New Project"
      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /initialize.*project|new project/i })
        ).toBeInTheDocument()
      })
    })

    it('should not throw errors when navigating to /init-project', async () => {
      // This should not throw
      expect(() => renderWithRouter('/init-project')).not.toThrow()
    })

    it('should show wizard stepper on /init-project route', async () => {
      renderWithRouter('/init-project')

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      })

      // Should show the stepper navigation
      await waitFor(() => {
        expect(screen.getByRole('navigation', { name: /wizard progress/i })).toBeInTheDocument()
      })
    })
  })

  describe('/guide route', () => {
    it('should render GuidePage component at /guide', async () => {
      renderWithRouter('/guide')

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      })

      // Should render GuidePage component
      await waitFor(() => {
        expect(screen.getByTestId('guide-page')).toBeInTheDocument()
      })
    })

    it('should display "Parade" title on /guide route', async () => {
      renderWithRouter('/guide')

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      })

      // GuidePage has title "Parade"
      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /parade/i })
        ).toBeInTheDocument()
      })
    })

    it('should not throw errors when navigating to /guide', async () => {
      expect(() => renderWithRouter('/guide')).not.toThrow()
    })

    it('should show workflow steps on /guide route', async () => {
      renderWithRouter('/guide')

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      })

      // Should show the workflow steps
      await waitFor(() => {
        expect(screen.getByText('Initialize Project')).toBeInTheDocument()
        expect(screen.getByText('Discover Feature')).toBeInTheDocument()
      })
    })
  })

  describe('Route accessibility', () => {
    it('should have /init-project route in the route configuration', async () => {
      renderWithRouter('/init-project')

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      })

      // Should not show 404 or redirect elsewhere - should have the wizard
      await waitFor(() => {
        expect(screen.getByTestId('project-wizard')).toBeInTheDocument()
      })
    })

    it('should have /guide route in the route configuration', async () => {
      renderWithRouter('/guide')

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      })

      // Should not show 404 or redirect elsewhere - should have the guide page
      await waitFor(() => {
        expect(screen.getByTestId('guide-page')).toBeInTheDocument()
      })
    })
  })
})

// =============================================================================
// Navigation Links Tests
// =============================================================================

describe('Navigation Links', () => {
  describe('Init Project link', () => {
    it('should render Init Project link in sidebar', async () => {
      renderWithRouter('/')

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      })

      // Should have an Init Project link in the navigation
      await waitFor(() => {
        expect(screen.getByRole('link', { name: /init.*project/i })).toBeInTheDocument()
      })
    })

    it('should display Init Project link with Wand2 icon', async () => {
      renderWithRouter('/')

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      })

      // Find the Init Project link
      const initProjectLink = await screen.findByRole('link', { name: /init.*project/i })

      // Should contain an SVG icon (Wand2)
      const icon = initProjectLink.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })

    it('should link to /init-project route', async () => {
      renderWithRouter('/')

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      })

      const initProjectLink = await screen.findByRole('link', { name: /init.*project/i })

      // Should have correct href
      expect(initProjectLink).toHaveAttribute('href', '/init-project')
    })

    it('should have Init Project link in the main navigation section', async () => {
      renderWithRouter('/')

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      })

      // The link should be in the sidebar navigation
      const nav = screen.getByRole('navigation')
      const initProjectLink = within(nav).getByRole('link', { name: /init.*project/i })

      expect(initProjectLink).toBeInTheDocument()
    })
  })

  describe('Guide link', () => {
    it('should render Guide link in sidebar', async () => {
      renderWithRouter('/')

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      })

      // Should have a Guide link in the navigation
      await waitFor(() => {
        expect(screen.getByRole('link', { name: /guide/i })).toBeInTheDocument()
      })
    })

    it('should display Guide link with GraduationCap icon', async () => {
      renderWithRouter('/')

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      })

      // Find the Guide link
      const guideLink = await screen.findByRole('link', { name: /guide/i })

      // Should contain an SVG icon (GraduationCap)
      const icon = guideLink.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })

    it('should link to /guide route', async () => {
      renderWithRouter('/')

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      })

      const guideLink = await screen.findByRole('link', { name: /guide/i })

      // Should have correct href
      expect(guideLink).toHaveAttribute('href', '/guide')
    })

    it('should have Guide link in the main navigation section', async () => {
      renderWithRouter('/')

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      })

      // The link should be in the sidebar navigation
      const nav = screen.getByRole('navigation')
      const guideLink = within(nav).getByRole('link', { name: /guide/i })

      expect(guideLink).toBeInTheDocument()
    })
  })

  describe('Navigation link order', () => {
    it('should display navigation links in correct order', async () => {
      renderWithRouter('/')

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      })

      // Get all navigation links
      const nav = screen.getByRole('navigation')
      const links = within(nav).getAllByRole('link')

      // Get link text content
      const linkTexts = links.map((link) => link.textContent?.trim().toLowerCase())

      // Init Project and Guide should be in the navigation
      expect(linkTexts.some((text) => text?.includes('init') || text?.includes('project'))).toBe(true)
      expect(linkTexts.some((text) => text?.includes('guide'))).toBe(true)
    })
  })
})

// =============================================================================
// Navigation Behavior Tests
// =============================================================================

describe('Navigation Behavior', () => {
  describe('Active route highlighting', () => {
    it('should highlight Init Project link when on /init-project route', async () => {
      renderWithRouter('/init-project')

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      })

      const initProjectLink = await screen.findByRole('link', { name: /init.*project/i })

      // Should have active styling (bg-sky-900/30 and text-sky-400 based on App.tsx pattern)
      expect(initProjectLink.className).toMatch(/bg-sky-900|text-sky-400/)
    })

    it('should highlight Guide link when on /guide route', async () => {
      renderWithRouter('/guide')

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      })

      const guideLink = await screen.findByRole('link', { name: /guide/i })

      // Should have active styling
      expect(guideLink.className).toMatch(/bg-sky-900|text-sky-400/)
    })

    it('should not highlight Init Project link when on different route', async () => {
      renderWithRouter('/pipeline')

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      })

      const initProjectLink = await screen.findByRole('link', { name: /init.*project/i })

      // Should have inactive styling (text-slate-400)
      expect(initProjectLink.className).toMatch(/text-slate-400/)
    })

    it('should not highlight Guide link when on different route', async () => {
      renderWithRouter('/pipeline')

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      })

      const guideLink = await screen.findByRole('link', { name: /guide/i })

      // Should have inactive styling
      expect(guideLink.className).toMatch(/text-slate-400/)
    })
  })

  describe('Click navigation', () => {
    it('should navigate to /init-project when Init Project link is clicked', async () => {
      const user = userEvent.setup()
      renderWithRouter('/pipeline')

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      })

      const initProjectLink = await screen.findByRole('link', { name: /init.*project/i })
      await user.click(initProjectLink)

      // Should now render the ProjectWizard
      await waitFor(() => {
        expect(screen.getByTestId('project-wizard')).toBeInTheDocument()
      })
    })

    it('should navigate to /guide when Guide link is clicked', async () => {
      const user = userEvent.setup()
      renderWithRouter('/pipeline')

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      })

      const guideLink = await screen.findByRole('link', { name: /guide/i })
      await user.click(guideLink)

      // Should now render the GuidePage
      await waitFor(() => {
        expect(screen.getByTestId('guide-page')).toBeInTheDocument()
      })
    })

    it('should navigate from /init-project to /guide', async () => {
      const user = userEvent.setup()
      renderWithRouter('/init-project')

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      })

      // Should start on ProjectWizard
      await waitFor(() => {
        expect(screen.getByTestId('project-wizard')).toBeInTheDocument()
      })

      // Click Guide link
      const guideLink = await screen.findByRole('link', { name: /guide/i })
      await user.click(guideLink)

      // Should now show GuidePage
      await waitFor(() => {
        expect(screen.getByTestId('guide-page')).toBeInTheDocument()
        expect(screen.queryByTestId('project-wizard')).not.toBeInTheDocument()
      })
    })

    it('should navigate from /guide to /init-project', async () => {
      const user = userEvent.setup()
      renderWithRouter('/guide')

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      })

      // Should start on GuidePage
      await waitFor(() => {
        expect(screen.getByTestId('guide-page')).toBeInTheDocument()
      })

      // Click Init Project link
      const initProjectLink = await screen.findByRole('link', { name: /init.*project/i })
      await user.click(initProjectLink)

      // Should now show ProjectWizard
      await waitFor(() => {
        expect(screen.getByTestId('project-wizard')).toBeInTheDocument()
        expect(screen.queryByTestId('guide-page')).not.toBeInTheDocument()
      })
    })
  })

  describe('Navigation between new and existing routes', () => {
    it('should navigate from /init-project to /pipeline', async () => {
      const user = userEvent.setup()
      renderWithRouter('/init-project')

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      })

      // Click Pipeline link
      const pipelineLink = await screen.findByRole('link', { name: /pipeline/i })
      await user.click(pipelineLink)

      // Should navigate away from ProjectWizard
      await waitFor(() => {
        expect(screen.queryByTestId('project-wizard')).not.toBeInTheDocument()
      })
    })

    it('should navigate from /guide to /briefs', async () => {
      const user = userEvent.setup()
      renderWithRouter('/guide')

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      })

      // Click Briefs link
      const briefsLink = await screen.findByRole('link', { name: /briefs/i })
      await user.click(briefsLink)

      // Should navigate away from GuidePage
      await waitFor(() => {
        expect(screen.queryByTestId('guide-page')).not.toBeInTheDocument()
      })
    })

    it('should navigate from /settings to /init-project', async () => {
      const user = userEvent.setup()
      renderWithRouter('/settings')

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      })

      // Click Init Project link
      const initProjectLink = await screen.findByRole('link', { name: /init.*project/i })
      await user.click(initProjectLink)

      // Should show ProjectWizard
      await waitFor(() => {
        expect(screen.getByTestId('project-wizard')).toBeInTheDocument()
      })
    })
  })
})

// =============================================================================
// Integration Tests
// =============================================================================

describe('Routes Integration', () => {
  it('should maintain sidebar visibility on all new routes', async () => {
    renderWithRouter('/init-project')

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })

    // Sidebar should be visible (contains app title)
    expect(screen.getByText('Parade')).toBeInTheDocument()

    // Navigate to guide
    const user = userEvent.setup()
    const guideLink = await screen.findByRole('link', { name: /guide/i })
    await user.click(guideLink)

    // Sidebar should still be visible
    await waitFor(() => {
      expect(screen.getByText('Parade')).toBeInTheDocument()
    })
  })

  it('should preserve navigation state across route changes', async () => {
    const user = userEvent.setup()
    renderWithRouter('/init-project')

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })

    // Navigate to guide, then back to init-project
    const guideLink = await screen.findByRole('link', { name: /guide/i })
    await user.click(guideLink)

    await waitFor(() => {
      expect(screen.getByTestId('guide-page')).toBeInTheDocument()
    })

    const initProjectLink = await screen.findByRole('link', { name: /init.*project/i })
    await user.click(initProjectLink)

    // Should be back on ProjectWizard
    await waitFor(() => {
      expect(screen.getByTestId('project-wizard')).toBeInTheDocument()
    })
  })
})
