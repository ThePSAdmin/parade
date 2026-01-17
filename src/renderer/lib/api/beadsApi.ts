// Beads REST API client (web mode)

import { api } from './httpClient';
import type {
  BeadId,
  Issue,
  CreateIssueParams,
  UpdateIssueParams,
  ListFilters,
  Dependency,
  Worktree,
} from '../../../shared/types/beads';

interface BeadsListResponse {
  issues: Issue[];
  error?: string;
}

interface BeadsGetResponse {
  issue: Issue | null;
  error?: string;
}

interface BeadsCreateResponse {
  id?: BeadId;
  error?: string;
}

interface BeadsActionResponse {
  success?: boolean;
  error?: string;
}

interface BeadsDepTreeResponse {
  tree: unknown;
  error?: string;
}

interface WorktreeListResponse {
  worktrees: Worktree[];
  error?: string;
}

export const beadsApi = {
  async list(filters?: ListFilters): Promise<Issue[]> {
    // Convert array filters to comma-separated strings
    const statusStr = Array.isArray(filters?.status) ? filters.status.join(',') : filters?.status;
    const typeStr = Array.isArray(filters?.type) ? filters.type.join(',') : filters?.type;

    const result = await api.get<BeadsListResponse>('/api/beads', {
      status: statusStr,
      type: typeStr,
      parent: filters?.parent,
      assignee: filters?.assignee,
      label: filters?.label,
    });
    if (result.error) {
      throw new Error(result.error);
    }
    return result.issues;
  },

  async get(id: BeadId): Promise<Issue | null> {
    const result = await api.get<BeadsGetResponse>(`/api/beads/${id}`);
    if (result.error) {
      throw new Error(result.error);
    }
    return result.issue;
  },

  async create(params: CreateIssueParams): Promise<BeadId> {
    const result = await api.post<BeadsCreateResponse>('/api/beads', params);
    if (result.error || !result.id) {
      throw new Error(result.error || 'Failed to create issue');
    }
    return result.id;
  },

  async update(id: BeadId, params: UpdateIssueParams): Promise<void> {
    const result = await api.patch<BeadsActionResponse>(`/api/beads/${id}`, params);
    if (result.error) {
      throw new Error(result.error);
    }
  },

  async close(id: BeadId, reason?: string): Promise<void> {
    const result = await api.post<BeadsActionResponse>(`/api/beads/${id}/close`, { reason });
    if (result.error) {
      throw new Error(result.error);
    }
  },

  async reopen(id: BeadId): Promise<void> {
    const result = await api.post<BeadsActionResponse>(`/api/beads/${id}/reopen`);
    if (result.error) {
      throw new Error(result.error);
    }
  },

  async ready(): Promise<Issue[]> {
    const result = await api.get<BeadsListResponse>('/api/beads/ready');
    if (result.error) {
      throw new Error(result.error);
    }
    return result.issues;
  },

  async depAdd(from: BeadId, to: BeadId, type?: Dependency['type']): Promise<void> {
    const result = await api.post<BeadsActionResponse>(`/api/beads/${from}/deps`, { to, type });
    if (result.error) {
      throw new Error(result.error);
    }
  },

  async depRemove(from: BeadId, to: BeadId): Promise<void> {
    const result = await api.delete<BeadsActionResponse>(`/api/beads/${from}/deps/${to}`);
    if (result.error) {
      throw new Error(result.error);
    }
  },

  async depTree(id: BeadId, direction?: 'up' | 'down' | 'both'): Promise<unknown> {
    const result = await api.get<BeadsDepTreeResponse>(`/api/beads/${id}/deps/tree`, { direction });
    if (result.error) {
      throw new Error(result.error);
    }
    return result.tree;
  },

  async getAllWithDependencies(): Promise<
    (Issue & { dependencies?: unknown[]; blockedBy?: string[]; parent?: string })[]
  > {
    interface IssueWithDeps extends Issue {
      dependencies?: Array<{ type?: string; depends_on_id?: string; id?: string }>;
    }
    const result = await api.get<{ issues: IssueWithDeps[]; error?: string }>(
      '/api/beads/export/all'
    );
    if (result.error) {
      throw new Error(result.error);
    }
    // Process the result to extract blockedBy IDs and parent from dependencies
    return result.issues.map((issue) => {
      const deps = issue.dependencies || [];
      // Find parent from parent-child dependency
      const parentDep = deps.find((d) => d.type === 'parent-child');
      const parent = parentDep?.depends_on_id;
      // Get blockedBy from non-parent-child deps
      const blockedBy = deps
        .filter((d) => d.type !== 'parent-child')
        .map((d) => d.depends_on_id || d.id)
        .filter((id): id is string => Boolean(id));

      return {
        ...issue,
        parent,
        blockedBy,
      };
    });
  },

  async worktreeList(): Promise<Worktree[]> {
    const result = await api.get<WorktreeListResponse>('/api/beads/worktrees/list');
    if (result.error) {
      throw new Error(result.error);
    }
    return result.worktrees;
  },
};

export default beadsApi;
