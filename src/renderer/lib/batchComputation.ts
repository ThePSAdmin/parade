// Batch computation utilities for TDD workflow visualization
// Computes execution batches from task dependencies

import type { Issue } from '../../shared/types/beads';

export type BatchPhase = 'RED' | 'GREEN' | 'MIXED';
export type BatchStatus = 'waiting' | 'active' | 'blocked' | 'complete';

export interface Batch {
  number: number;
  phase: BatchPhase;
  taskIds: string[];
  tasks: Issue[];
  status: BatchStatus;
  progress: {
    completed: number;
    total: number;
    percentage: number;
  };
}

export interface TaskWithDeps extends Issue {
  blockedBy?: string[];
  dependencies?: Issue[];
}

/**
 * Infer the TDD phase from task labels
 * - agent:test-writer -> RED (writing tests)
 * - agent:typescript, agent:swift, etc -> GREEN (implementation)
 * - Mixed or no labels -> MIXED
 */
export function inferPhase(tasks: Issue[]): BatchPhase {
  if (tasks.length === 0) return 'MIXED';

  let hasTestWriter = false;
  let hasImplementation = false;

  for (const task of tasks) {
    const labels = task.labels || [];
    for (const label of labels) {
      if (label === 'agent:test-writer') {
        hasTestWriter = true;
      } else if (label.startsWith('agent:')) {
        hasImplementation = true;
      }
    }
  }

  if (hasTestWriter && !hasImplementation) return 'RED';
  if (hasImplementation && !hasTestWriter) return 'GREEN';
  return 'MIXED';
}

/**
 * Compute batch status from task statuses
 */
export function computeBatchStatus(tasks: Issue[]): BatchStatus {
  if (tasks.length === 0) return 'waiting';

  const statuses = tasks.map((t) => t.status);

  // All closed = complete
  if (statuses.every((s) => s === 'closed')) return 'complete';

  // Any blocked = blocked
  if (statuses.some((s) => s === 'blocked')) return 'blocked';

  // Any in_progress = active
  if (statuses.some((s) => s === 'in_progress')) return 'active';

  // All open = waiting
  return 'waiting';
}

/**
 * Compute progress stats for a batch
 */
export function computeProgress(tasks: Issue[]): Batch['progress'] {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === 'closed').length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { completed, total, percentage };
}

/**
 * Build a dependency graph from tasks with dependency info
 * Returns a map of taskId -> array of taskIds that block it
 */
export function buildDependencyGraph(
  tasks: TaskWithDeps[]
): Map<string, string[]> {
  const graph = new Map<string, string[]>();

  for (const task of tasks) {
    // Initialize with empty array
    if (!graph.has(task.id)) {
      graph.set(task.id, []);
    }

    // Add blockedBy dependencies
    if (task.blockedBy && task.blockedBy.length > 0) {
      graph.set(task.id, [...(graph.get(task.id) || []), ...task.blockedBy]);
    }

    // Also check dependencies array if available
    if (task.dependencies && task.dependencies.length > 0) {
      const depIds = task.dependencies.map((d) => d.id);
      graph.set(task.id, [...(graph.get(task.id) || []), ...depIds]);
    }
  }

  return graph;
}

/**
 * Compute the "depth" of each task in the dependency graph
 * Depth 0 = no dependencies (can run first)
 * Depth N = depends on tasks at depth N-1
 */
export function computeDepths(
  taskIds: string[],
  dependencyGraph: Map<string, string[]>
): Map<string, number> {
  const depths = new Map<string, number>();
  const taskIdSet = new Set(taskIds);

  // Helper to compute depth recursively with memoization
  function getDepth(taskId: string, visited: Set<string>): number {
    // Already computed
    if (depths.has(taskId)) {
      return depths.get(taskId)!;
    }

    // Cycle detection
    if (visited.has(taskId)) {
      console.warn(`Cycle detected involving task ${taskId}`);
      return 0;
    }

    visited.add(taskId);

    const blockedBy = dependencyGraph.get(taskId) || [];
    // Only consider dependencies that are in our task set (same epic)
    const relevantDeps = blockedBy.filter((id) => taskIdSet.has(id));

    if (relevantDeps.length === 0) {
      depths.set(taskId, 0);
      return 0;
    }

    // Depth is 1 + max depth of dependencies
    const maxDepDepth = Math.max(
      ...relevantDeps.map((depId) => getDepth(depId, new Set(visited)))
    );
    const depth = maxDepDepth + 1;
    depths.set(taskId, depth);
    return depth;
  }

  // Compute depth for all tasks
  for (const taskId of taskIds) {
    getDepth(taskId, new Set());
  }

  return depths;
}

/**
 * Group tasks into batches by their depth in the dependency graph
 * Tasks at the same depth can be executed in parallel
 */
export function groupIntoBatches(
  tasks: TaskWithDeps[],
  depths: Map<string, number>
): Batch[] {
  // Group tasks by depth
  const tasksByDepth = new Map<number, TaskWithDeps[]>();

  for (const task of tasks) {
    const depth = depths.get(task.id) ?? 0;
    if (!tasksByDepth.has(depth)) {
      tasksByDepth.set(depth, []);
    }
    tasksByDepth.get(depth)!.push(task);
  }

  // Convert to sorted array of batches
  const sortedDepths = Array.from(tasksByDepth.keys()).sort((a, b) => a - b);

  return sortedDepths.map((depth, index) => {
    const batchTasks = tasksByDepth.get(depth)!;
    return {
      number: index + 1, // 1-indexed batch numbers
      phase: inferPhase(batchTasks),
      taskIds: batchTasks.map((t) => t.id),
      tasks: batchTasks,
      status: computeBatchStatus(batchTasks),
      progress: computeProgress(batchTasks),
    };
  });
}

/**
 * Check if a task belongs to an epic
 * Uses multiple strategies to handle partial loads where parent field may be undefined:
 * 1. Direct parent field match
 * 2. Task ID pattern match (e.g., "epicId.1" belongs to "epicId")
 */
function taskBelongsToEpic(task: TaskWithDeps, epicId: string): boolean {
  // Strategy 1: Direct parent field match
  if (task.parent === epicId) {
    return true;
  }

  // Strategy 2: Task ID pattern match (epicId.N format)
  // e.g., "customTaskTracker-n24.1" belongs to "customTaskTracker-n24"
  if (task.id.startsWith(epicId + '.')) {
    return true;
  }

  return false;
}

/**
 * Main function: Compute batches for an epic's tasks
 *
 * @param allTasks - All tasks with dependency information
 * @param epicId - The epic to compute batches for
 * @returns Array of batches in execution order
 */
export function computeBatches(
  allTasks: TaskWithDeps[],
  epicId: string
): Batch[] {
  // Filter to tasks belonging to this epic
  // Uses multiple strategies to handle partial loads where parent field may be undefined
  const epicTasks = allTasks.filter(
    (task) => taskBelongsToEpic(task, epicId) && task.issue_type === 'task'
  );

  if (epicTasks.length === 0) {
    return [];
  }

  // Build dependency graph
  const dependencyGraph = buildDependencyGraph(epicTasks);

  // Compute depths
  const taskIds = epicTasks.map((t) => t.id);
  const depths = computeDepths(taskIds, dependencyGraph);

  // Group into batches
  return groupIntoBatches(epicTasks, depths);
}

/**
 * Get a summary of batch progress for an epic
 */
export function getBatchSummary(batches: Batch[]): {
  totalBatches: number;
  completedBatches: number;
  activeBatch: number | null;
  redProgress: { completed: number; total: number };
  greenProgress: { completed: number; total: number };
} {
  const totalBatches = batches.length;
  const completedBatches = batches.filter((b) => b.status === 'complete').length;

  // Find first non-complete batch
  const activeBatchObj = batches.find((b) => b.status !== 'complete');
  const activeBatch = activeBatchObj?.number ?? null;

  // Compute phase progress
  const redBatches = batches.filter((b) => b.phase === 'RED');
  const greenBatches = batches.filter((b) => b.phase === 'GREEN');

  const redProgress = {
    completed: redBatches.reduce((sum, b) => sum + b.progress.completed, 0),
    total: redBatches.reduce((sum, b) => sum + b.progress.total, 0),
  };

  const greenProgress = {
    completed: greenBatches.reduce((sum, b) => sum + b.progress.completed, 0),
    total: greenBatches.reduce((sum, b) => sum + b.progress.total, 0),
  };

  return {
    totalBatches,
    completedBatches,
    activeBatch,
    redProgress,
    greenProgress,
  };
}

/**
 * Get the agent type from a task's labels
 */
export function getAgentLabel(task: Issue): string | null {
  const labels = task.labels || [];
  const agentLabel = labels.find((l) => l.startsWith('agent:'));
  return agentLabel ? agentLabel.replace('agent:', '') : null;
}

/**
 * Count dependencies for display on cards
 */
export function countDependencies(task: TaskWithDeps): number {
  const blockedBy = task.blockedBy?.length ?? 0;
  const deps = task.dependencies?.length ?? 0;
  return Math.max(blockedBy, deps);
}
