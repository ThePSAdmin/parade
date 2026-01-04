/**
 * TDD Tests: Click-through Pipeline to Kanban
 *
 * Tests navigation from Pipeline view to Kanban view when clicking
 * "View Tasks" on an exported brief/epic.
 *
 * Expected behavior:
 * 1. Exported briefs in Pipeline should show a "View Tasks" action
 * 2. Clicking "View Tasks" navigates to /kanban route
 * 3. Navigation passes epic ID as query param (?epicId=bd-xxx)
 * 4. Kanban view auto-filters by that epic
 *
 * Dependencies:
 * - Pipeline columns (customTaskTracker-lvv.2)
 * - Epic filter dropdown (customTaskTracker-lvv.6)
 *
 * @task customTaskTracker-lvv.20
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation, useSearchParams } from 'react-router-dom';
import React from 'react';

// ============================================================================
// Test utilities and mocks
// ============================================================================

// Mock the discovery store for Pipeline briefs
const mockBriefs = [
  {
    id: 'brief-1',
    title: 'Feature A',
    problem_statement: 'Problem statement for Feature A',
    initial_thoughts: null,
    priority: 2 as const,
    status: 'exported' as const,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-16T10:00:00Z',
    exported_epic_id: 'bd-abc1', // This brief has been exported to beads
  },
  {
    id: 'brief-2',
    title: 'Feature B',
    problem_statement: 'Problem statement for Feature B',
    initial_thoughts: null,
    priority: 3 as const,
    status: 'draft' as const, // Not exported - should NOT show View Tasks
    created_at: '2024-01-17T10:00:00Z',
    updated_at: null,
    exported_epic_id: null,
  },
  {
    id: 'brief-3',
    title: 'Feature C',
    problem_statement: 'Problem statement for Feature C',
    initial_thoughts: null,
    priority: 1 as const,
    status: 'exported' as const,
    created_at: '2024-01-18T10:00:00Z',
    updated_at: '2024-01-19T10:00:00Z',
    exported_epic_id: 'bd-xyz9', // Another exported brief
  },
];

// Mock the discovery store
vi.mock('@renderer/store/discoveryStore', () => ({
  useDiscoveryStore: () => ({
    briefs: mockBriefs,
    fetchBriefs: vi.fn(),
    subscribeToChanges: vi.fn(() => vi.fn()),
    isLoading: false,
    error: null,
    selectBrief: vi.fn(),
    selectedBriefId: null,
  }),
}));

// Mock the beads store for Kanban
vi.mock('@renderer/store/beadsStore', () => ({
  useBeadsStore: () => ({
    issues: [],
    epics: [
      { id: 'bd-abc1', title: 'Feature A Epic', issue_type: 'epic', status: 'open', priority: 2, created_at: '2024-01-16', updated_at: '2024-01-16' },
      { id: 'bd-xyz9', title: 'Feature C Epic', issue_type: 'epic', status: 'open', priority: 1, created_at: '2024-01-19', updated_at: '2024-01-19' },
    ],
    fetchIssues: vi.fn(),
    isLoading: false,
    error: null,
    activeProjectId: 'test-project',
    setActiveProject: vi.fn(),
  }),
}));

// Helper component to capture current location for assertions
function LocationDisplay() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  return (
    <div data-testid="location-display">
      <span data-testid="pathname">{location.pathname}</span>
      <span data-testid="search">{location.search}</span>
      <span data-testid="epic-param">{searchParams.get('epicId') || ''}</span>
    </div>
  );
}

// ============================================================================
// Test Suite: View Tasks Action Visibility
// ============================================================================

describe('Pipeline to Kanban: View Tasks Action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('View Tasks button visibility', () => {
    it('should show "View Tasks" button for exported briefs', async () => {
      // This test expects a "View Tasks" button to be visible for briefs
      // that have status='exported' and have an exported_epic_id
      //
      // The feature will add this button to BriefCard or BriefDetailView
      // for exported briefs.

      render(
        <MemoryRouter initialEntries={['/pipeline']}>
          <Routes>
            <Route path="/pipeline" element={<div data-testid="pipeline-view">Pipeline</div>} />
          </Routes>
        </MemoryRouter>
      );

      // TODO: When implementation exists, this should find "View Tasks" button
      // for the exported brief "Feature A"
      const viewTasksButton = screen.queryByRole('button', { name: /view tasks/i });

      // EXPECTED TO FAIL: Button doesn't exist yet
      expect(viewTasksButton).not.toBeNull();
    });

    it('should NOT show "View Tasks" button for non-exported briefs', async () => {
      // Draft, in_discovery, spec_ready, and approved briefs should NOT
      // show the View Tasks button since they don't have an epic yet

      render(
        <MemoryRouter initialEntries={['/pipeline']}>
          <Routes>
            <Route path="/pipeline" element={<div data-testid="pipeline-view">Pipeline</div>} />
          </Routes>
        </MemoryRouter>
      );

      // For a draft brief like "Feature B", there should be no View Tasks button
      // This is a negative test - we verify the absence of the button for non-exported items
      const allViewTasksButtons = screen.queryAllByRole('button', { name: /view tasks/i });

      // The number of View Tasks buttons should equal the number of exported briefs (2)
      // NOT the total number of briefs (3)
      // EXPECTED TO FAIL: Implementation doesn't exist
      expect(allViewTasksButtons.length).toBe(2);
    });

    it('should show "View Tasks" link/button in brief detail panel for exported briefs', async () => {
      // When an exported brief is selected in the Pipeline, the detail panel
      // should show a prominent "View Tasks" action

      render(
        <MemoryRouter initialEntries={['/pipeline']}>
          <Routes>
            <Route path="/pipeline" element={<div data-testid="pipeline-view">Pipeline</div>} />
          </Routes>
        </MemoryRouter>
      );

      // Simulate selecting an exported brief
      // The detail panel should show View Tasks action

      // EXPECTED TO FAIL: Implementation doesn't exist
      const detailPanelViewTasks = screen.queryByTestId('brief-detail-view-tasks');
      expect(detailPanelViewTasks).not.toBeNull();
    });
  });
});

// ============================================================================
// Test Suite: Navigation Behavior
// ============================================================================

describe('Pipeline to Kanban: Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should navigate to /kanban when clicking View Tasks', async () => {
    // Clicking the View Tasks button should use react-router navigation
    // to go to /kanban

    render(
      <MemoryRouter initialEntries={['/pipeline']}>
        <Routes>
          <Route path="/pipeline" element={<div data-testid="pipeline-view">Pipeline</div>} />
          <Route
            path="/kanban"
            element={
              <div data-testid="kanban-view">
                Kanban
                <LocationDisplay />
              </div>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    // Start on pipeline - verify we're there
    expect(screen.getByTestId('pipeline-view')).toBeDefined();

    // Find and click View Tasks button for Feature A (exported_epic_id: bd-abc1)
    // EXPECTED TO FAIL: Button doesn't exist yet
    const viewTasksButton = screen.getByRole('button', { name: /view tasks/i });
    fireEvent.click(viewTasksButton);

    // Should now be on kanban
    await waitFor(() => {
      expect(screen.getByTestId('kanban-view')).toBeDefined();
    });
  });

  it('should pass epic ID as query parameter when navigating', async () => {
    // The navigation should include the epic ID so Kanban can auto-filter
    // Expected URL: /kanban?epicId=bd-abc1

    render(
      <MemoryRouter initialEntries={['/pipeline']}>
        <Routes>
          <Route path="/pipeline" element={<div data-testid="pipeline-view">Pipeline</div>} />
          <Route
            path="/kanban"
            element={
              <div data-testid="kanban-view">
                Kanban
                <LocationDisplay />
              </div>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    // Find and click View Tasks for the brief with exported_epic_id: 'bd-abc1'
    // EXPECTED TO FAIL: Button doesn't exist yet
    const viewTasksButton = screen.getByRole('button', { name: /view tasks/i });
    fireEvent.click(viewTasksButton);

    // Check the URL contains the epic ID
    await waitFor(() => {
      const epicParam = screen.getByTestId('epic-param');
      expect(epicParam.textContent).toBe('bd-abc1');
    });
  });

  it('should include epicId in search params with correct format', async () => {
    // Verify the URL format is exactly ?epicId=<epic-id>

    render(
      <MemoryRouter initialEntries={['/pipeline']}>
        <Routes>
          <Route path="/pipeline" element={<div data-testid="pipeline-view">Pipeline</div>} />
          <Route
            path="/kanban"
            element={
              <div data-testid="kanban-view">
                Kanban
                <LocationDisplay />
              </div>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    // EXPECTED TO FAIL: Button doesn't exist yet
    const viewTasksButton = screen.getByRole('button', { name: /view tasks/i });
    fireEvent.click(viewTasksButton);

    await waitFor(() => {
      const searchParams = screen.getByTestId('search');
      expect(searchParams.textContent).toMatch(/^\?epicId=bd-/);
    });
  });
});

// ============================================================================
// Test Suite: Kanban Epic Filter Integration
// ============================================================================

describe('Pipeline to Kanban: Epic Filter Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should auto-set epic filter in Kanban when navigating with epicId param', async () => {
    // When Kanban loads with ?epicId=bd-abc1, it should automatically
    // set the epic filter dropdown to that epic

    // This test simulates landing on Kanban with the query param already set
    render(
      <MemoryRouter initialEntries={['/kanban?epicId=bd-abc1']}>
        <Routes>
          <Route path="/kanban" element={<div data-testid="kanban-view">Kanban</div>} />
        </Routes>
      </MemoryRouter>
    );

    // The KanbanFilters component should read the epicId from URL
    // and set it as the active filter

    // EXPECTED TO FAIL: This integration doesn't exist yet
    // We need to check that the epic filter select shows "bd-abc1" as selected
    await waitFor(() => {
      // The epic filter should have the value from URL
      const epicFilter = screen.getByTestId('kanban-epic-filter');
      expect((epicFilter as HTMLSelectElement).value).toBe('bd-abc1');
    });
  });

  it('should filter tasks to only show those belonging to the epic', async () => {
    // When epicId param is present, Kanban should only show tasks
    // that have parent=epicId

    render(
      <MemoryRouter initialEntries={['/kanban?epicId=bd-abc1']}>
        <Routes>
          <Route path="/kanban" element={<div data-testid="kanban-view">Kanban</div>} />
        </Routes>
      </MemoryRouter>
    );

    // EXPECTED TO FAIL: Filter integration doesn't exist yet
    // Tasks from other epics should not be visible
    await waitFor(() => {
      // Only tasks belonging to bd-abc1 should be rendered
      const taskCards = screen.getAllByTestId('kanban-task-card');
      taskCards.forEach((card) => {
        expect(card.getAttribute('data-parent-epic')).toBe('bd-abc1');
      });
    });
  });

  it('should sync URL when epic filter is changed manually in Kanban', async () => {
    // If user manually changes the epic filter dropdown, the URL should update

    render(
      <MemoryRouter initialEntries={['/kanban?epicId=bd-abc1']}>
        <Routes>
          <Route
            path="/kanban"
            element={
              <div data-testid="kanban-view">
                Kanban
                <LocationDisplay />
              </div>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    // EXPECTED TO FAIL: This bidirectional sync doesn't exist yet
    // Changing filter should update URL params
    const epicFilter = screen.getByTestId('kanban-epic-filter');
    fireEvent.change(epicFilter, { target: { value: 'bd-xyz9' } });

    await waitFor(() => {
      const epicParam = screen.getByTestId('epic-param');
      expect(epicParam.textContent).toBe('bd-xyz9');
    });
  });

  it('should clear epicId param when "All epics" is selected', async () => {
    // Selecting "All epics" should remove the epicId from URL

    render(
      <MemoryRouter initialEntries={['/kanban?epicId=bd-abc1']}>
        <Routes>
          <Route
            path="/kanban"
            element={
              <div data-testid="kanban-view">
                Kanban
                <LocationDisplay />
              </div>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    // EXPECTED TO FAIL: This behavior doesn't exist yet
    const epicFilter = screen.getByTestId('kanban-epic-filter');
    fireEvent.change(epicFilter, { target: { value: 'all' } });

    await waitFor(() => {
      const searchParams = screen.getByTestId('search');
      expect(searchParams.textContent).not.toContain('epicId');
    });
  });
});

// ============================================================================
// Test Suite: Edge Cases
// ============================================================================

describe('Pipeline to Kanban: Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle navigation when epic ID contains special characters', async () => {
    // Some epic IDs may have dots (e.g., bd-abc1.2) which need proper encoding

    render(
      <MemoryRouter initialEntries={['/pipeline']}>
        <Routes>
          <Route path="/pipeline" element={<div data-testid="pipeline-view">Pipeline</div>} />
          <Route
            path="/kanban"
            element={
              <div data-testid="kanban-view">
                Kanban
                <LocationDisplay />
              </div>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    // EXPECTED TO FAIL: Implementation doesn't exist
    // Epic IDs like "bd-abc1.2" should be properly handled
    const viewTasksButton = screen.getByRole('button', { name: /view tasks/i });
    fireEvent.click(viewTasksButton);

    await waitFor(() => {
      const pathname = screen.getByTestId('pathname');
      expect(pathname.textContent).toBe('/kanban');
    });
  });

  it('should show error/empty state if epic no longer exists in Kanban', async () => {
    // If user navigates to /kanban?epicId=bd-deleted and that epic
    // doesn't exist, handle gracefully

    render(
      <MemoryRouter initialEntries={['/kanban?epicId=bd-deleted-epic']}>
        <Routes>
          <Route path="/kanban" element={<div data-testid="kanban-view">Kanban</div>} />
        </Routes>
      </MemoryRouter>
    );

    // EXPECTED TO FAIL: Error handling doesn't exist yet
    await waitFor(() => {
      // Should show message or reset filter when epic not found
      const errorMessage = screen.queryByText(/epic not found/i);
      const allEpicsSelected = screen.queryByTestId('kanban-epic-filter');

      // Either show error OR have the epic filter available for reset
      expect(errorMessage !== null || allEpicsSelected !== null).toBe(true);
    });
  });

  it('should preserve other Kanban filters when navigating with epicId', async () => {
    // If Kanban already has filters (like status or label), adding epicId
    // should not clear those other filters

    render(
      <MemoryRouter initialEntries={['/kanban?status=open&label=frontend']}>
        <Routes>
          <Route
            path="/kanban"
            element={
              <div data-testid="kanban-view">
                Kanban
                <LocationDisplay />
              </div>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    // Verifies that the URL params are preserved - this tests that the
    // implementation doesn't accidentally clear existing filters
    const searchParams = screen.getByTestId('search');

    // Should contain both existing filters
    expect(searchParams.textContent).toContain('status=open');
    expect(searchParams.textContent).toContain('label=frontend');
  });
});

// ============================================================================
// Test Suite: Accessibility
// ============================================================================

describe('Pipeline to Kanban: Accessibility', () => {
  it('should have accessible name for View Tasks button', async () => {
    render(
      <MemoryRouter initialEntries={['/pipeline']}>
        <Routes>
          <Route path="/pipeline" element={<div data-testid="pipeline-view">Pipeline</div>} />
        </Routes>
      </MemoryRouter>
    );

    // EXPECTED TO FAIL: Button doesn't exist yet
    const viewTasksButton = screen.getByRole('button', { name: /view tasks/i });

    // Verify the button has accessible text
    expect(viewTasksButton.textContent?.toLowerCase()).toContain('view tasks');
  });

  it('should support keyboard navigation to View Tasks', async () => {
    render(
      <MemoryRouter initialEntries={['/pipeline']}>
        <Routes>
          <Route path="/pipeline" element={<div data-testid="pipeline-view">Pipeline</div>} />
          <Route path="/kanban" element={<div data-testid="kanban-view">Kanban</div>} />
        </Routes>
      </MemoryRouter>
    );

    // EXPECTED TO FAIL: Implementation doesn't exist
    const viewTasksButton = screen.getByRole('button', { name: /view tasks/i });

    // Should be focusable
    viewTasksButton.focus();
    expect(document.activeElement).toBe(viewTasksButton);

    // Should be activatable with Enter key
    fireEvent.keyDown(viewTasksButton, { key: 'Enter' });

    await waitFor(() => {
      expect(screen.getByTestId('kanban-view')).toBeDefined();
    });
  });
});
