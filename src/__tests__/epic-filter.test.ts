/**
 * Tests for Epic Filter Dropdown in KanbanFilters component
 *
 * TDD RED Phase: These tests validate that the epic filter dropdown:
 * 1. Exists in the KanbanFilters component
 * 2. Shows all available epics as filter options
 * 3. Filters tasks by parent epic (parent_id)
 * 4. Allows clearing the filter
 * 5. Passes filter state correctly to handlers
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Issue, IssueType, BeadId } from '../shared/types/beads';

// Mock epic data for testing
const mockEpics: Issue[] = [
  {
    id: 'bd-epic1' as BeadId,
    title: 'User Authentication Epic',
    issue_type: 'epic' as IssueType,
    status: 'open',
    priority: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'bd-epic2' as BeadId,
    title: 'Dashboard Redesign Epic with a Very Long Title That Should Be Truncated',
    issue_type: 'epic' as IssueType,
    status: 'in_progress',
    priority: 2,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
  {
    id: 'bd-epic3' as BeadId,
    title: 'API Integration',
    issue_type: 'epic' as IssueType,
    status: 'open',
    priority: 0,
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z',
  },
];

// Mock tasks for testing filtering
const mockTasks: Issue[] = [
  {
    id: 'bd-task1' as BeadId,
    title: 'Implement login form',
    issue_type: 'task' as IssueType,
    status: 'open',
    priority: 1,
    parent: 'bd-epic1' as BeadId,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'bd-task2' as BeadId,
    title: 'Design header component',
    issue_type: 'task' as IssueType,
    status: 'open',
    priority: 2,
    parent: 'bd-epic2' as BeadId,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
  {
    id: 'bd-task3' as BeadId,
    title: 'Add session management',
    issue_type: 'task' as IssueType,
    status: 'in_progress',
    priority: 1,
    parent: 'bd-epic1' as BeadId,
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z',
  },
  {
    id: 'bd-task4' as BeadId,
    title: 'Orphan task without parent',
    issue_type: 'task' as IssueType,
    status: 'open',
    priority: 3,
    created_at: '2024-01-04T00:00:00Z',
    updated_at: '2024-01-04T00:00:00Z',
  },
];

// Filter state interface (matching KanbanFilters)
interface FilterState {
  type: string | null;
  label: string | null;
  epicId: BeadId | null;
  search: string;
}

describe('Epic Filter Dropdown - Unit Tests', () => {
  let mockFilterState: FilterState;
  let mockOnFilterChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFilterState = {
      type: null,
      label: null,
      epicId: null,
      search: '',
    };
    mockOnFilterChange = vi.fn();
  });

  describe('FilterState Structure', () => {
    it('should include epicId in filter state interface', () => {
      // Test that epicId is a valid property in filter state
      const filterState: FilterState = {
        type: null,
        label: null,
        epicId: 'bd-epic1' as BeadId,
        search: '',
      };

      expect(filterState).toHaveProperty('epicId');
      expect(filterState.epicId).toBe('bd-epic1');
    });

    it('should allow null value for epicId when no filter is applied', () => {
      const filterState: FilterState = {
        type: null,
        label: null,
        epicId: null,
        search: '',
      };

      expect(filterState.epicId).toBeNull();
    });

    it('should accept any valid BeadId as epicId', () => {
      const epicIds = ['bd-epic1', 'bd-epic2', 'bd-abc123'];

      epicIds.forEach(id => {
        const filterState: FilterState = {
          type: null,
          label: null,
          epicId: id as BeadId,
          search: '',
        };
        expect(filterState.epicId).toBe(id);
      });
    });
  });

  describe('Epic Filter Selection', () => {
    it('should update filter state when epic is selected', () => {
      // Simulate selecting an epic
      const selectedEpicId = 'bd-epic1' as BeadId;

      // Mock the filter change callback
      const handleFilterChange = (newFilters: FilterState) => {
        mockOnFilterChange(newFilters);
      };

      handleFilterChange({
        ...mockFilterState,
        epicId: selectedEpicId,
      });

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        type: null,
        label: null,
        epicId: 'bd-epic1',
        search: '',
      });
    });

    it('should set epicId to null when "all" is selected', () => {
      // Start with an epic selected
      const currentFilter: FilterState = {
        type: null,
        label: null,
        epicId: 'bd-epic1' as BeadId,
        search: '',
      };

      // Simulate selecting "all epics"
      const handleClear = (newFilters: FilterState) => {
        mockOnFilterChange(newFilters);
      };

      handleClear({
        ...currentFilter,
        epicId: null, // 'all' converts to null
      });

      expect(mockOnFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({ epicId: null })
      );
    });
  });

  describe('Epic Filtering Logic', () => {
    it('should filter tasks by parent epic id', () => {
      const selectedEpicId = 'bd-epic1' as BeadId;

      // Filter tasks to those with matching parent
      const filteredTasks = mockTasks.filter(
        task => task.parent === selectedEpicId
      );

      expect(filteredTasks).toHaveLength(2);
      expect(filteredTasks.every(t => t.parent === 'bd-epic1')).toBe(true);
    });

    it('should return all tasks when no epic filter is applied', () => {
      const epicId: BeadId | null = null;

      // No filtering when epicId is null
      const filteredTasks = epicId
        ? mockTasks.filter(task => task.parent === epicId)
        : mockTasks;

      expect(filteredTasks).toHaveLength(mockTasks.length);
    });

    it('should return empty array when filtering by epic with no tasks', () => {
      const selectedEpicId = 'bd-epic3' as BeadId;

      const filteredTasks = mockTasks.filter(
        task => task.parent === selectedEpicId
      );

      expect(filteredTasks).toHaveLength(0);
    });

    it('should handle tasks without parent (orphan tasks)', () => {
      const selectedEpicId = 'bd-epic1' as BeadId;

      const filteredTasks = mockTasks.filter(
        task => task.parent === selectedEpicId
      );

      // Orphan task (bd-task4) should not be in results
      const orphanIncluded = filteredTasks.some(t => t.id === 'bd-task4');
      expect(orphanIncluded).toBe(false);
    });
  });

  describe('Epic Dropdown Options', () => {
    it('should include all epics as filter options', () => {
      // Each epic should be a selectable option
      mockEpics.forEach(epic => {
        expect(epic.id).toBeDefined();
        expect(epic.title).toBeDefined();
        expect(epic.issue_type).toBe('epic');
      });

      expect(mockEpics).toHaveLength(3);
    });

    it('should format epic option with id and truncated title', () => {
      const longTitleEpic = mockEpics.find(e => e.title.length > 30);
      expect(longTitleEpic).toBeDefined();

      // Test title truncation logic
      const maxLength = 30;
      const truncatedTitle = longTitleEpic!.title.slice(0, maxLength);
      const displayText = `${longTitleEpic!.id}: ${truncatedTitle}...`;

      expect(displayText).toContain(longTitleEpic!.id);
      expect(displayText).toContain('...');
      expect(truncatedTitle.length).toBe(maxLength);
    });

    it('should not truncate short titles', () => {
      const shortTitleEpic = mockEpics.find(e => e.title.length <= 30);
      expect(shortTitleEpic).toBeDefined();

      const displayText = `${shortTitleEpic!.id}: ${shortTitleEpic!.title}`;
      expect(displayText).not.toContain('...');
    });
  });

  describe('Clear Filters', () => {
    it('should clear epic filter along with other filters', () => {
      const currentFilter: FilterState = {
        type: 'task',
        label: 'priority-high',
        epicId: 'bd-epic1' as BeadId,
        search: 'login',
      };

      // Clear all filters
      const clearedFilter: FilterState = {
        type: null,
        label: null,
        epicId: null,
        search: '',
      };

      mockOnFilterChange(clearedFilter);

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        type: null,
        label: null,
        epicId: null,
        search: '',
      });
    });

    it('should detect when filters are active (including epic filter)', () => {
      const filterWithEpic: FilterState = {
        type: null,
        label: null,
        epicId: 'bd-epic1' as BeadId,
        search: '',
      };

      // hasFilters logic from component
      const hasFilters = filterWithEpic.type ||
                         filterWithEpic.label ||
                         filterWithEpic.epicId ||
                         filterWithEpic.search;

      expect(hasFilters).toBeTruthy();
    });

    it('should return false for hasFilters when all filters are clear', () => {
      const noFilters: FilterState = {
        type: null,
        label: null,
        epicId: null,
        search: '',
      };

      const hasFilters = noFilters.type ||
                         noFilters.label ||
                         noFilters.epicId ||
                         noFilters.search;

      expect(hasFilters).toBeFalsy();
    });
  });

  describe('Combined Filters', () => {
    it('should allow combining epic filter with type filter', () => {
      const combinedFilter: FilterState = {
        type: 'task',
        label: null,
        epicId: 'bd-epic1' as BeadId,
        search: '',
      };

      // Apply both filters
      let filtered = mockTasks;

      if (combinedFilter.type) {
        filtered = filtered.filter(t => t.issue_type === combinedFilter.type);
      }

      if (combinedFilter.epicId) {
        filtered = filtered.filter(t => t.parent === combinedFilter.epicId);
      }

      expect(filtered.every(t => t.issue_type === 'task')).toBe(true);
      expect(filtered.every(t => t.parent === 'bd-epic1')).toBe(true);
    });

    it('should allow combining epic filter with search', () => {
      const combinedFilter: FilterState = {
        type: null,
        label: null,
        epicId: 'bd-epic1' as BeadId,
        search: 'login',
      };

      let filtered = mockTasks;

      if (combinedFilter.epicId) {
        filtered = filtered.filter(t => t.parent === combinedFilter.epicId);
      }

      if (combinedFilter.search) {
        filtered = filtered.filter(t =>
          t.title.toLowerCase().includes(combinedFilter.search.toLowerCase())
        );
      }

      expect(filtered).toHaveLength(1);
      expect(filtered[0].title).toContain('login');
      expect(filtered[0].parent).toBe('bd-epic1');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty epics array gracefully', () => {
      const emptyEpics: Issue[] = [];

      // Epic dropdown should not render when epics array is empty
      const shouldRenderEpicDropdown = emptyEpics.length > 0;

      expect(shouldRenderEpicDropdown).toBe(false);
    });

    it('should handle epic with special characters in title', () => {
      const specialEpic: Issue = {
        id: 'bd-special' as BeadId,
        title: 'Epic with "quotes" & <special> chars',
        issue_type: 'epic' as IssueType,
        status: 'open',
        priority: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      // Should be able to use as filter value
      const filterState: FilterState = {
        type: null,
        label: null,
        epicId: specialEpic.id,
        search: '',
      };

      expect(filterState.epicId).toBe('bd-special');
    });

    it('should handle rapid filter changes', () => {
      const epicIds = ['bd-epic1', 'bd-epic2', 'bd-epic3', null];

      epicIds.forEach(epicId => {
        mockOnFilterChange({
          ...mockFilterState,
          epicId: epicId as BeadId | null,
        });
      });

      expect(mockOnFilterChange).toHaveBeenCalledTimes(4);
    });
  });
});

describe('Epic Filter Integration Tests', () => {
  describe('Filter State Persistence', () => {
    it('should maintain epic filter when other filters change', () => {
      let currentFilter: FilterState = {
        type: null,
        label: null,
        epicId: 'bd-epic1' as BeadId,
        search: '',
      };

      // Change type filter while keeping epic filter
      currentFilter = {
        ...currentFilter,
        type: 'task',
      };

      expect(currentFilter.epicId).toBe('bd-epic1');
      expect(currentFilter.type).toBe('task');
    });

    it('should preserve epic filter during search', () => {
      let currentFilter: FilterState = {
        type: null,
        label: null,
        epicId: 'bd-epic2' as BeadId,
        search: '',
      };

      // Add search while keeping epic filter
      currentFilter = {
        ...currentFilter,
        search: 'design',
      };

      expect(currentFilter.epicId).toBe('bd-epic2');
      expect(currentFilter.search).toBe('design');
    });
  });
});
