/**
 * Tests for Kanban task-level display
 *
 * TDD RED Phase: These tests verify that the Kanban board displays TASKS
 * instead of EPICS. Currently the KanbanBoard filters for epics only,
 * so these tests should FAIL until the implementation is changed.
 *
 * Expected behavior after implementation:
 * - getColumnIssues returns only tasks (issue_type === 'task')
 * - Epics are NOT displayed on the Kanban board
 * - Tasks are displayed in columns matching their status
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Issue, IssueStatus } from '../shared/types/beads';

// Mock data factory
function createMockIssue(overrides: Partial<Issue> = {}): Issue {
  const id = overrides.id || `bd-${Math.random().toString(36).substr(2, 4)}`;
  return {
    id,
    title: `Test Issue ${id}`,
    issue_type: 'task',
    status: 'open',
    priority: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

// Create test data with mixed issue types
function createMixedIssueSet(): Issue[] {
  return [
    // Epics (should NOT be shown on kanban after implementation)
    createMockIssue({ id: 'bd-epic1', title: 'Epic 1', issue_type: 'epic', status: 'open' }),
    createMockIssue({ id: 'bd-epic2', title: 'Epic 2', issue_type: 'epic', status: 'in_progress' }),
    createMockIssue({ id: 'bd-epic3', title: 'Epic 3', issue_type: 'epic', status: 'blocked' }),
    createMockIssue({ id: 'bd-epic4', title: 'Epic 4', issue_type: 'epic', status: 'closed' }),

    // Tasks (SHOULD be shown on kanban after implementation)
    createMockIssue({ id: 'bd-task1', title: 'Task 1', issue_type: 'task', status: 'open', parent: 'bd-epic1' }),
    createMockIssue({ id: 'bd-task2', title: 'Task 2', issue_type: 'task', status: 'open', parent: 'bd-epic1' }),
    createMockIssue({ id: 'bd-task3', title: 'Task 3', issue_type: 'task', status: 'in_progress', parent: 'bd-epic1' }),
    createMockIssue({ id: 'bd-task4', title: 'Task 4', issue_type: 'task', status: 'blocked', parent: 'bd-epic2' }),
    createMockIssue({ id: 'bd-task5', title: 'Task 5', issue_type: 'task', status: 'closed', parent: 'bd-epic2' }),
    createMockIssue({ id: 'bd-task6', title: 'Task 6', issue_type: 'task', status: 'closed', parent: 'bd-epic3' }),

    // Other types (should NOT be shown)
    createMockIssue({ id: 'bd-bug1', title: 'Bug 1', issue_type: 'bug', status: 'open' }),
    createMockIssue({ id: 'bd-feat1', title: 'Feature 1', issue_type: 'feature', status: 'open' }),
    createMockIssue({ id: 'bd-chore1', title: 'Chore 1', issue_type: 'chore', status: 'open' }),
  ];
}

/**
 * Re-implementation of getColumnIssues to test against
 * This is the CURRENT behavior (shows epics only) for comparison
 */
function getColumnIssuesCurrentBehavior(
  issues: Issue[],
  status: IssueStatus,
  filters: { label?: string | null; search?: string } = {}
): Issue[] {
  return issues.filter((issue) => {
    // Current: Only show epics on the main board
    if (issue.issue_type !== 'epic') return false;
    if (issue.status !== status) return false;

    // Apply filters
    if (filters.label && !issue.labels?.includes(filters.label)) return false;
    if (
      filters.search &&
      !issue.title.toLowerCase().includes(filters.search.toLowerCase()) &&
      !issue.id.toLowerCase().includes(filters.search.toLowerCase())
    ) {
      return false;
    }

    return true;
  });
}

/**
 * Expected behavior after implementation change (shows tasks only)
 */
function getColumnIssuesExpectedBehavior(
  issues: Issue[],
  status: IssueStatus,
  filters: { label?: string | null; search?: string } = {}
): Issue[] {
  return issues.filter((issue) => {
    // Expected: Only show tasks on the main board
    if (issue.issue_type !== 'task') return false;
    if (issue.status !== status) return false;

    // Apply filters
    if (filters.label && !issue.labels?.includes(filters.label)) return false;
    if (
      filters.search &&
      !issue.title.toLowerCase().includes(filters.search.toLowerCase()) &&
      !issue.id.toLowerCase().includes(filters.search.toLowerCase())
    ) {
      return false;
    }

    return true;
  });
}

describe('Kanban Task-Level Display', () => {
  let testIssues: Issue[];

  beforeEach(() => {
    testIssues = createMixedIssueSet();
  });

  describe('getColumnIssues filtering', () => {
    it('should return only tasks, not epics', () => {
      // Get all issues across all columns using current behavior
      const statuses: IssueStatus[] = ['open', 'in_progress', 'blocked', 'closed'];
      const allColumnIssues = statuses.flatMap(status =>
        getColumnIssuesCurrentBehavior(testIssues, status)
      );

      // Current behavior returns epics - this test should FAIL
      // After implementation, this should return tasks only
      const taskCount = allColumnIssues.filter(i => i.issue_type === 'task').length;
      const epicCount = allColumnIssues.filter(i => i.issue_type === 'epic').length;

      // EXPECT: All returned issues should be tasks (0 epics)
      expect(epicCount).toBe(0);
      expect(taskCount).toBeGreaterThan(0);
    });

    it('should not include any epics in the kanban board', () => {
      const statuses: IssueStatus[] = ['open', 'in_progress', 'blocked', 'closed'];

      for (const status of statuses) {
        const columnIssues = getColumnIssuesCurrentBehavior(testIssues, status);

        // Check that no epics are returned
        const hasEpics = columnIssues.some(i => i.issue_type === 'epic');

        // This should FAIL with current implementation
        expect(hasEpics).toBe(false);
      }
    });

    it('should return tasks filtered by status', () => {
      // Test open column - should have tasks only
      const openIssues = getColumnIssuesCurrentBehavior(testIssues, 'open');

      // Current behavior returns epics with open status
      // Expected: Tasks 1 and 2 (both open tasks)
      const openTaskIds = openIssues
        .filter(i => i.issue_type === 'task')
        .map(i => i.id)
        .sort();

      // Should have 2 open tasks: bd-task1 and bd-task2
      expect(openTaskIds).toEqual(['bd-task1', 'bd-task2'].sort());
    });

    it('should correctly populate in_progress column with tasks', () => {
      const inProgressIssues = getColumnIssuesCurrentBehavior(testIssues, 'in_progress');

      // Current: Returns epic2 (in_progress epic)
      // Expected: Returns task3 (in_progress task)

      const taskIds = inProgressIssues
        .filter(i => i.issue_type === 'task')
        .map(i => i.id);

      expect(taskIds).toContain('bd-task3');
      expect(taskIds).toHaveLength(1);
    });

    it('should correctly populate blocked column with tasks', () => {
      const blockedIssues = getColumnIssuesCurrentBehavior(testIssues, 'blocked');

      // Current: Returns epic3 (blocked epic)
      // Expected: Returns task4 (blocked task)

      const taskIds = blockedIssues
        .filter(i => i.issue_type === 'task')
        .map(i => i.id);

      expect(taskIds).toContain('bd-task4');
      expect(taskIds).toHaveLength(1);
    });

    it('should correctly populate closed column with tasks', () => {
      const closedIssues = getColumnIssuesCurrentBehavior(testIssues, 'closed');

      // Current: Returns epic4 (closed epic)
      // Expected: Returns task5 and task6 (closed tasks)

      const taskIds = closedIssues
        .filter(i => i.issue_type === 'task')
        .map(i => i.id)
        .sort();

      expect(taskIds).toEqual(['bd-task5', 'bd-task6'].sort());
    });
  });

  describe('Column counts', () => {
    it('should have correct total task count across all columns', () => {
      const statuses: IssueStatus[] = ['open', 'in_progress', 'blocked', 'closed'];
      const totalIssues = statuses.flatMap(status =>
        getColumnIssuesCurrentBehavior(testIssues, status)
      );

      // Test data has 6 tasks total
      // Current behavior returns 4 epics instead
      expect(totalIssues).toHaveLength(6);
    });

    it('should have correct count in open column (2 tasks)', () => {
      const openIssues = getColumnIssuesCurrentBehavior(testIssues, 'open');

      // Current: 1 epic (bd-epic1)
      // Expected: 2 tasks (bd-task1, bd-task2)
      expect(openIssues).toHaveLength(2);
    });

    it('should have correct count in in_progress column (1 task)', () => {
      const inProgressIssues = getColumnIssuesCurrentBehavior(testIssues, 'in_progress');

      // Current: 1 epic (bd-epic2)
      // Expected: 1 task (bd-task3)
      expect(inProgressIssues).toHaveLength(1);
    });

    it('should have correct count in blocked column (1 task)', () => {
      const blockedIssues = getColumnIssuesCurrentBehavior(testIssues, 'blocked');

      // Current: 1 epic (bd-epic3)
      // Expected: 1 task (bd-task4)
      expect(blockedIssues).toHaveLength(1);
    });

    it('should have correct count in closed column (2 tasks)', () => {
      const closedIssues = getColumnIssuesCurrentBehavior(testIssues, 'closed');

      // Current: 1 epic (bd-epic4)
      // Expected: 2 tasks (bd-task5, bd-task6)
      expect(closedIssues).toHaveLength(2);
    });
  });

  describe('Filter behavior with tasks', () => {
    it('should filter tasks by label', () => {
      // Add labels to some tasks
      const issuesWithLabels = testIssues.map(issue => {
        if (issue.id === 'bd-task1') {
          return { ...issue, labels: ['frontend'] };
        }
        if (issue.id === 'bd-task2') {
          return { ...issue, labels: ['backend'] };
        }
        return issue;
      });

      const filteredIssues = getColumnIssuesCurrentBehavior(
        issuesWithLabels,
        'open',
        { label: 'frontend' }
      );

      // Should return only task1 (the one with 'frontend' label)
      // Current behavior would try to filter epics by label
      const taskIds = filteredIssues
        .filter(i => i.issue_type === 'task')
        .map(i => i.id);

      expect(taskIds).toEqual(['bd-task1']);
    });

    it('should filter tasks by search term', () => {
      const filteredIssues = getColumnIssuesCurrentBehavior(
        testIssues,
        'open',
        { search: 'Task 1' }
      );

      // Should return task1 matching search
      const taskIds = filteredIssues
        .filter(i => i.issue_type === 'task')
        .map(i => i.id);

      expect(taskIds).toEqual(['bd-task1']);
    });

    it('should filter tasks by id search', () => {
      const filteredIssues = getColumnIssuesCurrentBehavior(
        testIssues,
        'open',
        { search: 'bd-task2' }
      );

      // Should return task2 matching id search
      const taskIds = filteredIssues
        .filter(i => i.issue_type === 'task')
        .map(i => i.id);

      expect(taskIds).toEqual(['bd-task2']);
    });
  });

  describe('Epic exclusion', () => {
    it('should exclude epics from all columns', () => {
      const statuses: IssueStatus[] = ['open', 'in_progress', 'blocked', 'closed'];

      for (const status of statuses) {
        const columnIssues = getColumnIssuesCurrentBehavior(testIssues, status);

        // Check each issue in the column
        for (const issue of columnIssues) {
          // This assertion should FAIL for current implementation
          expect(issue.issue_type).not.toBe('epic');
        }
      }
    });

    it('should not display epic bd-epic1 on the board', () => {
      const statuses: IssueStatus[] = ['open', 'in_progress', 'blocked', 'closed'];
      const allIds = statuses.flatMap(status =>
        getColumnIssuesCurrentBehavior(testIssues, status).map(i => i.id)
      );

      // Epic bd-epic1 should not appear in any column
      // Current behavior: bd-epic1 IS in the open column
      expect(allIds).not.toContain('bd-epic1');
    });

    it('should only show issue_type task on the kanban board', () => {
      const statuses: IssueStatus[] = ['open', 'in_progress', 'blocked', 'closed'];
      const allIssueTypes = statuses.flatMap(status =>
        getColumnIssuesCurrentBehavior(testIssues, status).map(i => i.issue_type)
      );

      // All returned issues should be tasks
      const uniqueTypes = [...new Set(allIssueTypes)];
      expect(uniqueTypes).toEqual(['task']);
    });
  });

  describe('Other issue types exclusion', () => {
    it('should not show bugs on the kanban board', () => {
      const statuses: IssueStatus[] = ['open', 'in_progress', 'blocked', 'closed'];
      const allIssues = statuses.flatMap(status =>
        getColumnIssuesCurrentBehavior(testIssues, status)
      );

      const hasBugs = allIssues.some(i => i.issue_type === 'bug');
      expect(hasBugs).toBe(false);
    });

    it('should not show features on the kanban board', () => {
      const statuses: IssueStatus[] = ['open', 'in_progress', 'blocked', 'closed'];
      const allIssues = statuses.flatMap(status =>
        getColumnIssuesCurrentBehavior(testIssues, status)
      );

      const hasFeatures = allIssues.some(i => i.issue_type === 'feature');
      expect(hasFeatures).toBe(false);
    });

    it('should not show chores on the kanban board', () => {
      const statuses: IssueStatus[] = ['open', 'in_progress', 'blocked', 'closed'];
      const allIssues = statuses.flatMap(status =>
        getColumnIssuesCurrentBehavior(testIssues, status)
      );

      const hasChores = allIssues.some(i => i.issue_type === 'chore');
      expect(hasChores).toBe(false);
    });
  });
});

describe('Expected vs Current Behavior Comparison', () => {
  const testIssues = createMixedIssueSet();

  it('demonstrates the difference between current (epic) and expected (task) behavior', () => {
    const currentOpenIssues = getColumnIssuesCurrentBehavior(testIssues, 'open');
    const expectedOpenIssues = getColumnIssuesExpectedBehavior(testIssues, 'open');

    // Current returns epics
    expect(currentOpenIssues.map(i => i.issue_type)).toContain('epic');

    // Expected returns tasks
    expect(expectedOpenIssues.every(i => i.issue_type === 'task')).toBe(true);

    // This test documents the difference but doesn't assert on what SHOULD happen
    // The other tests assert on what SHOULD happen (and fail with current impl)
  });
});
