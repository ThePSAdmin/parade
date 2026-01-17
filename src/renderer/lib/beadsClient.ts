// Client wrapper for beads IPC calls
// Conditionally uses Electron IPC or HTTP API based on environment

import type {
  BeadId,
  Issue,
  CreateIssueParams,
  UpdateIssueParams,
  ListFilters,
  Dependency,
  Worktree,
} from '../../shared/types/beads';
import { beadsApi } from './api/beadsApi';
import { api } from './api/httpClient';

// Detect if running in Electron or web browser
const isElectron = typeof window !== 'undefined' && 'electron' in window;

// Electron IPC implementation
const electronBeads = {
  async list(filters?: ListFilters): Promise<Issue[]> {
    const result = await window.electron.beads.list(filters);
    if (result.error) {
      throw new Error(result.error);
    }
    return result.issues;
  },

  async get(id: BeadId): Promise<Issue | null> {
    const result = await window.electron.beads.get(id);
    if (result.error) {
      throw new Error(result.error);
    }
    return result.issue;
  },

  async create(params: CreateIssueParams): Promise<BeadId> {
    const result = await window.electron.beads.create(params);
    if (result.error || !result.id) {
      throw new Error(result.error || 'Failed to create issue');
    }
    return result.id;
  },

  async update(id: BeadId, params: UpdateIssueParams): Promise<void> {
    const result = await window.electron.beads.update(id, params);
    if (result.error) {
      throw new Error(result.error);
    }
  },

  async close(id: BeadId, reason?: string): Promise<void> {
    const result = await window.electron.beads.close(id, reason);
    if (result.error) {
      throw new Error(result.error);
    }
  },

  async reopen(id: BeadId): Promise<void> {
    const result = await window.electron.beads.reopen(id);
    if (result.error) {
      throw new Error(result.error);
    }
  },

  async ready(): Promise<Issue[]> {
    const result = await window.electron.beads.ready();
    if (result.error) {
      throw new Error(result.error);
    }
    return result.issues;
  },

  async depAdd(from: BeadId, to: BeadId, type?: Dependency['type']): Promise<void> {
    const result = await window.electron.beads.depAdd(from, to, type);
    if (result.error) {
      throw new Error(result.error);
    }
  },

  async depRemove(from: BeadId, to: BeadId): Promise<void> {
    const result = await window.electron.beads.depRemove(from, to);
    if (result.error) {
      throw new Error(result.error);
    }
  },

  async depTree(id: BeadId, direction?: 'up' | 'down' | 'both'): Promise<unknown> {
    const result = await window.electron.beads.depTree(id, direction);
    if (result.error) {
      throw new Error(result.error);
    }
    return result.tree;
  },

  async getAllWithDependencies(): Promise<(Issue & { dependencies?: unknown[]; blockedBy?: string[]; parent?: string })[]> {
    const result = await window.electron.beads.getAllWithDependencies();
    if (result.error) {
      throw new Error(result.error);
    }
    // Process the result to extract blockedBy IDs and parent from dependencies
    return result.issues.map((issue) => {
      const deps = (issue.dependencies || []) as Array<{ type?: string; depends_on_id?: string; id?: string }>;
      const parentDep = deps.find((d) => d.type === 'parent-child');
      const parent = parentDep?.depends_on_id;
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
    const result = await window.electron.beads.worktreeList();
    if (result.error) {
      throw new Error(result.error);
    }
    return result.worktrees;
  },
};

// Export beads client - uses Electron IPC or HTTP API based on environment
export const beads = isElectron ? electronBeads : beadsApi;

// Settings client
const electronSettings = {
  async get<T>(key: string): Promise<T | null> {
    return window.electron.settings.get(key);
  },

  async set(key: string, value: unknown): Promise<void> {
    return window.electron.settings.set(key, value);
  },
};

const httpSettings = {
  async get<T>(key: string): Promise<T | null> {
    if (key === 'all') {
      return api.get<T>('/api/settings');
    }
    return api.get<T>(`/api/settings/${key}`);
  },

  async set(key: string, value: unknown): Promise<void> {
    await api.put(`/api/settings/${key}`, { value });
  },
};

export const settings = isElectron ? electronSettings : httpSettings;

// App info client
const electronAppInfo = {
  async getVersion(): Promise<string> {
    return window.electron.app.getVersion();
  },
};

const httpAppInfo = {
  async getVersion(): Promise<string> {
    return api.get<string>('/api/app/version');
  },
};

export const appInfo = isElectron ? electronAppInfo : httpAppInfo;
