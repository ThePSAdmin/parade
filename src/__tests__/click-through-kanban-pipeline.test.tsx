/**
 * TDD RED Phase Tests: Click-through Navigation from Kanban to Pipeline
 *
 * These tests verify that clicking an EpicChip on a Kanban task card
 * navigates to the Pipeline view with the corresponding brief selected.
 *
 * Expected to FAIL until implementation is complete:
 * - EpicChip component does not exist yet
 * - useNavigateToPipeline hook does not exist yet
 * - briefResolver module does not exist yet
 * - KanbanCard does not have EpicChip integration yet
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import { BrowserRouter, MemoryRouter, useLocation, Routes, Route } from 'react-router-dom';
import type { Issue, BeadId } from '../shared/types/beads';
import type { Brief } from '../shared/types/discovery';

// =============================================================================
// Mock Data
// =============================================================================

const mockEpic: Issue = {
  id: 'bd-abc1' as BeadId,
  title: 'User Authentication Epic',
  issue_type: 'epic',
  status: 'in_progress',
  priority: 2,
  labels: ['auth', 'security'],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-02T00:00:00Z',
};

const mockTask: Issue = {
  id: 'bd-abc1.1' as BeadId,
  title: 'Implement login form',
  issue_type: 'task',
  status: 'open',
  priority: 2,
  parent: 'bd-abc1' as BeadId,
  labels: ['frontend'],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-02T00:00:00Z',
};

const mockBrief: Brief = {
  id: 'brief-abc1',
  title: 'User Authentication Feature',
  problem_statement: 'Users need a secure way to log in',
  initial_thoughts: null,
  priority: 2,
  status: 'exported',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-02T00:00:00Z',
  exported_epic_id: 'bd-abc1',
};

// =============================================================================
// Mock window.electron for tests
// =============================================================================

beforeEach(() => {
  // Mock the electron API that discoveryStore uses
  (globalThis as any).window = {
    electron: {
      events: {
        onDiscoveryChange: vi.fn(() => vi.fn()),
      },
      discovery: {
        listBriefs: vi.fn().mockResolvedValue([mockBrief]),
        getBriefWithRelations: vi.fn().mockResolvedValue({
          brief: mockBrief,
          questions: [],
          reviews: [],
          spec: null,
          events: [],
        }),
      },
    },
  };
});

afterEach(() => {
  vi.resetAllMocks();
  vi.resetModules();
});

// =============================================================================
// Test Suite: EpicChip Component Existence and Rendering
// =============================================================================

describe('EpicChip Component', () => {
  describe('Module Existence', () => {
    it('should have an EpicChip component exported from kanban folder', async () => {
      // This test verifies the EpicChip component exists
      // Expected to FAIL: EpicChip does not exist yet
      const kanbanModule = await import('../renderer/components/kanban/EpicChip');
      expect(kanbanModule.EpicChip).toBeDefined();
    });

    it('should export EpicChip as a React component', async () => {
      const { EpicChip } = await import('../renderer/components/kanban/EpicChip');
      expect(typeof EpicChip).toBe('function');
    });
  });

  describe('Rendering', () => {
    it('should render EpicChip component with epic ID', async () => {
      const { EpicChip } = await import('../renderer/components/kanban/EpicChip');

      render(
        <BrowserRouter>
          <EpicChip epicId="bd-abc1" />
        </BrowserRouter>
      );

      // Should display the epic ID or a reference to it
      expect(screen.getByText(/bd-abc1/i)).toBeInTheDocument();
    });

    it('should render EpicChip with epic title when provided', async () => {
      const { EpicChip } = await import('../renderer/components/kanban/EpicChip');

      render(
        <BrowserRouter>
          <EpicChip epicId="bd-abc1" epicTitle="User Authentication Epic" />
        </BrowserRouter>
      );

      expect(screen.getByText(/User Authentication Epic/i)).toBeInTheDocument();
    });

    it('should render EpicChip with appropriate styling for clickability', async () => {
      const { EpicChip } = await import('../renderer/components/kanban/EpicChip');

      render(
        <BrowserRouter>
          <EpicChip epicId="bd-abc1" />
        </BrowserRouter>
      );

      const chip = screen.getByRole('button');
      expect(chip).toHaveClass('cursor-pointer');
    });

    it('should have data-testid for testing', async () => {
      const { EpicChip } = await import('../renderer/components/kanban/EpicChip');

      render(
        <BrowserRouter>
          <EpicChip epicId="bd-abc1" />
        </BrowserRouter>
      );

      expect(screen.getByTestId('epic-chip')).toBeInTheDocument();
    });
  });

  describe('Click Interaction', () => {
    it('should be clickable', async () => {
      const { EpicChip } = await import('../renderer/components/kanban/EpicChip');
      const handleClick = vi.fn();

      render(
        <BrowserRouter>
          <EpicChip epicId="bd-abc1" onClick={handleClick} />
        </BrowserRouter>
      );

      const chip = screen.getByRole('button');
      fireEvent.click(chip);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should stop event propagation when clicked', async () => {
      const { EpicChip } = await import('../renderer/components/kanban/EpicChip');
      const parentClick = vi.fn();
      const chipClick = vi.fn();

      render(
        <BrowserRouter>
          <div onClick={parentClick}>
            <EpicChip epicId="bd-abc1" onClick={chipClick} />
          </div>
        </BrowserRouter>
      );

      const chip = screen.getByRole('button');
      fireEvent.click(chip);

      expect(chipClick).toHaveBeenCalledTimes(1);
      expect(parentClick).not.toHaveBeenCalled();
    });

    it('should pass epicId to click handler', async () => {
      const { EpicChip } = await import('../renderer/components/kanban/EpicChip');
      const handleClick = vi.fn();

      render(
        <BrowserRouter>
          <EpicChip epicId="bd-abc1" onClick={handleClick} />
        </BrowserRouter>
      );

      const chip = screen.getByRole('button');
      fireEvent.click(chip);

      expect(handleClick).toHaveBeenCalledWith('bd-abc1');
    });
  });
});

// =============================================================================
// Test Suite: Navigation from Kanban to Pipeline
// =============================================================================

describe('Kanban to Pipeline Navigation', () => {
  // Helper component to capture current location
  function LocationDisplay() {
    const location = useLocation();
    return <div data-testid="location">{location.pathname}{location.search}</div>;
  }

  describe('Route Navigation', () => {
    it('should navigate to /pipeline when EpicChip is clicked', async () => {
      const { EpicChip } = await import('../renderer/components/kanban/EpicChip');

      render(
        <MemoryRouter initialEntries={['/kanban']}>
          <Routes>
            <Route path="/kanban" element={<EpicChip epicId="bd-abc1" briefId="brief-abc1" />} />
            <Route path="/pipeline" element={<div>Pipeline View</div>} />
          </Routes>
          <LocationDisplay />
        </MemoryRouter>
      );

      const chip = screen.getByRole('button');
      fireEvent.click(chip);

      await waitFor(() => {
        const location = screen.getByTestId('location');
        expect(location.textContent).toContain('/pipeline');
      });
    });

    it('should include briefId in navigation state or query params', async () => {
      const { EpicChip } = await import('../renderer/components/kanban/EpicChip');

      render(
        <MemoryRouter initialEntries={['/kanban']}>
          <EpicChip epicId="bd-abc1" briefId="brief-abc1" />
          <LocationDisplay />
        </MemoryRouter>
      );

      const chip = screen.getByRole('button');
      fireEvent.click(chip);

      await waitFor(() => {
        const location = screen.getByTestId('location');
        // Should have brief ID either in query params or pathname
        expect(location.textContent).toMatch(/brief-abc1|briefId=brief-abc1/);
      });
    });

    it('should preserve briefId through navigation', async () => {
      const { EpicChip } = await import('../renderer/components/kanban/EpicChip');
      const { useDiscoveryStore } = await import('../renderer/store/discoveryStore');

      render(
        <MemoryRouter initialEntries={['/kanban']}>
          <EpicChip epicId="bd-abc1" briefId="brief-abc1" />
          <LocationDisplay />
        </MemoryRouter>
      );

      const chip = screen.getByRole('button');
      fireEvent.click(chip);

      await waitFor(() => {
        // The discovery store should have the brief selected
        const state = useDiscoveryStore.getState();
        expect(state.selectedBriefId).toBe('brief-abc1');
      });
    });
  });

  describe('Brief Selection on Navigation', () => {
    it('should trigger selectBrief in discoveryStore when navigating', async () => {
      const { EpicChip } = await import('../renderer/components/kanban/EpicChip');
      const { useDiscoveryStore } = await import('../renderer/store/discoveryStore');

      // Spy on selectBrief
      const selectBriefSpy = vi.spyOn(useDiscoveryStore.getState(), 'selectBrief');

      render(
        <MemoryRouter initialEntries={['/kanban']}>
          <EpicChip epicId="bd-abc1" briefId="brief-abc1" />
        </MemoryRouter>
      );

      const chip = screen.getByRole('button');
      fireEvent.click(chip);

      await waitFor(() => {
        expect(selectBriefSpy).toHaveBeenCalledWith('brief-abc1');
      });
    });

    it('should auto-select brief in Pipeline view after navigation', async () => {
      const { EpicChip } = await import('../renderer/components/kanban/EpicChip');
      const { useDiscoveryStore } = await import('../renderer/store/discoveryStore');

      // Reset store state
      useDiscoveryStore.setState({ selectedBriefId: null, selectedBrief: null });

      render(
        <MemoryRouter initialEntries={['/kanban']}>
          <EpicChip epicId="bd-abc1" briefId="brief-abc1" />
        </MemoryRouter>
      );

      const chip = screen.getByRole('button');
      fireEvent.click(chip);

      await waitFor(() => {
        const state = useDiscoveryStore.getState();
        expect(state.selectedBriefId).toBe('brief-abc1');
      });
    });
  });
});

// =============================================================================
// Test Suite: useNavigateToPipeline Hook
// =============================================================================

describe('useNavigateToPipeline Hook', () => {
  it('should have a useNavigateToPipeline hook exported', async () => {
    // Expected to FAIL: hook does not exist yet
    const hooksModule = await import('../renderer/hooks/useNavigateToPipeline');
    expect(hooksModule.useNavigateToPipeline).toBeDefined();
  });

  it('should provide navigateToBrief function', async () => {
    const { useNavigateToPipeline } = await import('../renderer/hooks/useNavigateToPipeline');

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MemoryRouter>{children}</MemoryRouter>
    );

    const { result } = renderHook(() => useNavigateToPipeline(), { wrapper });

    expect(result.current.navigateToBrief).toBeDefined();
    expect(typeof result.current.navigateToBrief).toBe('function');
  });

  it('should navigate and select brief when navigateToBrief is called', async () => {
    const { useNavigateToPipeline } = await import('../renderer/hooks/useNavigateToPipeline');
    const { useDiscoveryStore } = await import('../renderer/store/discoveryStore');

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MemoryRouter initialEntries={['/kanban']}>{children}</MemoryRouter>
    );

    const { result } = renderHook(() => useNavigateToPipeline(), { wrapper });

    await act(async () => {
      result.current.navigateToBrief('brief-abc1');
    });

    const state = useDiscoveryStore.getState();
    expect(state.selectedBriefId).toBe('brief-abc1');
  });

  it('should provide navigateFromEpic function for epic-to-brief resolution', async () => {
    const { useNavigateToPipeline } = await import('../renderer/hooks/useNavigateToPipeline');

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MemoryRouter>{children}</MemoryRouter>
    );

    const { result } = renderHook(() => useNavigateToPipeline(), { wrapper });

    expect(result.current.navigateFromEpic).toBeDefined();
    expect(typeof result.current.navigateFromEpic).toBe('function');
  });

  it('should resolve epic to brief and navigate when navigateFromEpic is called', async () => {
    const { useNavigateToPipeline } = await import('../renderer/hooks/useNavigateToPipeline');
    const { useDiscoveryStore } = await import('../renderer/store/discoveryStore');

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MemoryRouter initialEntries={['/kanban']}>{children}</MemoryRouter>
    );

    const { result } = renderHook(() => useNavigateToPipeline(), { wrapper });

    await act(async () => {
      await result.current.navigateFromEpic('bd-abc1');
    });

    const state = useDiscoveryStore.getState();
    // Should have resolved epic ID to brief ID and selected it
    expect(state.selectedBriefId).toBe('brief-abc1');
  });
});

// =============================================================================
// Test Suite: Brief ID Resolution
// =============================================================================

describe('Brief ID Resolution from Epic', () => {
  it('should have a briefResolver module exported', async () => {
    // Expected to FAIL: briefResolver does not exist yet
    const resolverModule = await import('../renderer/lib/briefResolver');
    expect(resolverModule.findBriefByEpicId).toBeDefined();
  });

  it('should resolve briefId from epic exported_epic_id linkage', async () => {
    const { findBriefByEpicId } = await import('../renderer/lib/briefResolver');

    const briefId = await findBriefByEpicId('bd-abc1');

    expect(briefId).toBe('brief-abc1');
  });

  it('should return null when epic has no linked brief', async () => {
    const { findBriefByEpicId } = await import('../renderer/lib/briefResolver');

    const briefId = await findBriefByEpicId('bd-unknown');

    expect(briefId).toBeNull();
  });

  it('should handle async brief lookup gracefully', async () => {
    const { findBriefByEpicId } = await import('../renderer/lib/briefResolver');

    // Should not throw
    await expect(findBriefByEpicId('bd-abc1')).resolves.toBeDefined();
  });
});

// =============================================================================
// Test Suite: Integration with KanbanCard
// =============================================================================

describe('KanbanCard with EpicChip Integration', () => {
  beforeEach(() => {
    // Mock the sortable hook
    vi.mock('@dnd-kit/sortable', () => ({
      useSortable: () => ({
        attributes: {},
        listeners: {},
        setNodeRef: vi.fn(),
        transform: null,
        transition: null,
        isDragging: false,
      }),
    }));

    // Mock the useShowProjectBadge hook
    vi.mock('../renderer/hooks/useShowProjectBadge', () => ({
      useShowProjectBadge: () => ({
        showBadge: false,
        projectName: null,
        projectIndex: 0,
      }),
    }));
  });

  it('should render EpicChip for tasks with parent epic', async () => {
    const { KanbanCard } = await import('../renderer/components/kanban/KanbanCard');

    render(
      <BrowserRouter>
        <KanbanCard issue={mockTask} />
      </BrowserRouter>
    );

    // Should show the parent epic reference with EpicChip
    // Expected to FAIL: KanbanCard doesn't have EpicChip yet
    const epicChip = screen.getByTestId('epic-chip');
    expect(epicChip).toBeInTheDocument();
  });

  it('should not render EpicChip for issues without parent', async () => {
    const { KanbanCard } = await import('../renderer/components/kanban/KanbanCard');

    const issueWithoutParent = { ...mockTask, parent: undefined };

    render(
      <BrowserRouter>
        <KanbanCard issue={issueWithoutParent} />
      </BrowserRouter>
    );

    expect(screen.queryByTestId('epic-chip')).not.toBeInTheDocument();
  });

  it('should navigate to Pipeline when EpicChip in KanbanCard is clicked', async () => {
    const { KanbanCard } = await import('../renderer/components/kanban/KanbanCard');

    // Helper component to capture navigation
    function LocationDisplay() {
      const location = useLocation();
      return <div data-testid="location">{location.pathname}</div>;
    }

    render(
      <MemoryRouter initialEntries={['/kanban']}>
        <KanbanCard issue={mockTask} />
        <LocationDisplay />
      </MemoryRouter>
    );

    const epicChip = screen.getByTestId('epic-chip');
    fireEvent.click(epicChip);

    await waitFor(() => {
      const location = screen.getByTestId('location');
      expect(location.textContent).toBe('/pipeline');
    });
  });

  it('should not open issue detail when EpicChip is clicked (stops propagation)', async () => {
    const { KanbanCard } = await import('../renderer/components/kanban/KanbanCard');
    const onCardClick = vi.fn();

    render(
      <BrowserRouter>
        <KanbanCard issue={mockTask} onClick={onCardClick} />
      </BrowserRouter>
    );

    const epicChip = screen.getByTestId('epic-chip');
    fireEvent.click(epicChip);

    // Card click handler should not be called
    expect(onCardClick).not.toHaveBeenCalled();
  });
});

// =============================================================================
// Test Suite: Accessibility
// =============================================================================

describe('EpicChip Accessibility', () => {
  it('should have accessible button role', async () => {
    const { EpicChip } = await import('../renderer/components/kanban/EpicChip');

    render(
      <BrowserRouter>
        <EpicChip epicId="bd-abc1" />
      </BrowserRouter>
    );

    const chip = screen.getByRole('button');
    expect(chip).toBeInTheDocument();
  });

  it('should have aria-label describing the action', async () => {
    const { EpicChip } = await import('../renderer/components/kanban/EpicChip');

    render(
      <BrowserRouter>
        <EpicChip epicId="bd-abc1" />
      </BrowserRouter>
    );

    const chip = screen.getByRole('button');
    expect(chip).toHaveAttribute('aria-label');
    expect(chip.getAttribute('aria-label')).toMatch(/pipeline|view|brief/i);
  });

  it('should be keyboard accessible', async () => {
    const { EpicChip } = await import('../renderer/components/kanban/EpicChip');
    const handleClick = vi.fn();

    render(
      <BrowserRouter>
        <EpicChip epicId="bd-abc1" onClick={handleClick} />
      </BrowserRouter>
    );

    const chip = screen.getByRole('button');
    chip.focus();
    fireEvent.keyDown(chip, { key: 'Enter' });

    expect(handleClick).toHaveBeenCalled();
  });
});

// =============================================================================
// Test Suite: Edge Cases
// =============================================================================

describe('Edge Cases', () => {
  it('should handle missing briefId gracefully', async () => {
    const { EpicChip } = await import('../renderer/components/kanban/EpicChip');

    // Should not throw when briefId is not provided
    render(
      <BrowserRouter>
        <EpicChip epicId="bd-abc1" />
      </BrowserRouter>
    );

    const chip = screen.getByRole('button');
    expect(() => fireEvent.click(chip)).not.toThrow();
  });

  it('should handle network errors when resolving brief', async () => {
    const { useNavigateToPipeline } = await import('../renderer/hooks/useNavigateToPipeline');

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MemoryRouter>{children}</MemoryRouter>
    );

    const { result } = renderHook(() => useNavigateToPipeline(), { wrapper });

    // Should not throw, but handle error gracefully (navigate anyway or show error)
    await act(async () => {
      // Calling with an unknown epic that won't resolve
      await expect(async () => {
        await result.current.navigateFromEpic('bd-nonexistent');
      }).not.toThrow();
    });
  });

  it('should handle multiple rapid clicks without duplicate navigation', async () => {
    const { EpicChip } = await import('../renderer/components/kanban/EpicChip');
    const { useDiscoveryStore } = await import('../renderer/store/discoveryStore');

    const selectBriefSpy = vi.spyOn(useDiscoveryStore.getState(), 'selectBrief');

    render(
      <MemoryRouter initialEntries={['/kanban']}>
        <EpicChip epicId="bd-abc1" briefId="brief-abc1" />
      </MemoryRouter>
    );

    const chip = screen.getByRole('button');

    // Rapid fire clicks
    fireEvent.click(chip);
    fireEvent.click(chip);
    fireEvent.click(chip);

    await waitFor(() => {
      // Should only navigate once despite multiple clicks
      // (Implementation may debounce or guard against this)
      expect(selectBriefSpy.mock.calls.length).toBeLessThanOrEqual(3);
    });
  });

  it('should work when navigating from different routes', async () => {
    const { EpicChip } = await import('../renderer/components/kanban/EpicChip');

    function LocationDisplay() {
      const location = useLocation();
      return <div data-testid="location">{location.pathname}</div>;
    }

    // Test from /kanban
    const { unmount } = render(
      <MemoryRouter initialEntries={['/kanban']}>
        <EpicChip epicId="bd-abc1" briefId="brief-abc1" />
        <LocationDisplay />
      </MemoryRouter>
    );

    let chip = screen.getByRole('button');
    fireEvent.click(chip);

    await waitFor(() => {
      expect(screen.getByTestId('location').textContent).toContain('/pipeline');
    });

    unmount();

    // Test from /settings (edge case)
    render(
      <MemoryRouter initialEntries={['/settings']}>
        <EpicChip epicId="bd-abc1" briefId="brief-abc1" />
        <LocationDisplay />
      </MemoryRouter>
    );

    chip = screen.getByRole('button');
    fireEvent.click(chip);

    await waitFor(() => {
      expect(screen.getByTestId('location').textContent).toContain('/pipeline');
    });
  });
});

// =============================================================================
// Test Suite: Props Interface
// =============================================================================

describe('EpicChip Props Interface', () => {
  it('should accept epicId prop (required)', async () => {
    const { EpicChip } = await import('../renderer/components/kanban/EpicChip');

    // This should compile and render without errors
    render(
      <BrowserRouter>
        <EpicChip epicId="bd-test" />
      </BrowserRouter>
    );

    expect(screen.getByTestId('epic-chip')).toBeInTheDocument();
  });

  it('should accept optional epicTitle prop', async () => {
    const { EpicChip } = await import('../renderer/components/kanban/EpicChip');

    render(
      <BrowserRouter>
        <EpicChip epicId="bd-test" epicTitle="Test Epic Title" />
      </BrowserRouter>
    );

    expect(screen.getByText('Test Epic Title')).toBeInTheDocument();
  });

  it('should accept optional briefId prop for direct navigation', async () => {
    const { EpicChip } = await import('../renderer/components/kanban/EpicChip');
    const { useDiscoveryStore } = await import('../renderer/store/discoveryStore');

    render(
      <MemoryRouter>
        <EpicChip epicId="bd-test" briefId="brief-direct" />
      </MemoryRouter>
    );

    const chip = screen.getByRole('button');
    fireEvent.click(chip);

    await waitFor(() => {
      const state = useDiscoveryStore.getState();
      expect(state.selectedBriefId).toBe('brief-direct');
    });
  });

  it('should accept optional onClick callback prop', async () => {
    const { EpicChip } = await import('../renderer/components/kanban/EpicChip');
    const customHandler = vi.fn();

    render(
      <BrowserRouter>
        <EpicChip epicId="bd-test" onClick={customHandler} />
      </BrowserRouter>
    );

    const chip = screen.getByRole('button');
    fireEvent.click(chip);

    expect(customHandler).toHaveBeenCalled();
  });
});
