// Unified client for Electron APIs
// Conditionally uses Electron IPC or HTTP API based on environment

import { api } from './api/httpClient';
import type { ProjectConfig, SetupStatusResult, DocsListResult, DocsReadResult } from '../../shared/types/ipc';

// Detect if running in Electron or web browser
const isElectron = typeof window !== 'undefined' && 'electron' in window;

// ============================================================================
// Settings Client
// ============================================================================

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

// ============================================================================
// Dialog Client
// ============================================================================

interface FolderSelectResult {
  paths: string[] | null;
  error?: string;
}

interface DirectoryBrowserResult {
  current: string;
  parent: string;
  isRoot: boolean;
  directories: Array<{ name: string; path: string; hidden: boolean }>;
}

const electronDialog = {
  async selectFolder(options?: { multiSelections?: boolean }): Promise<FolderSelectResult> {
    return window.electron.dialog.selectFolder(options);
  },
};

// For web mode, we'll use a different approach - return null to signal
// that the UI should show a path input or directory browser instead
const httpDialog = {
  async selectFolder(_options?: { multiSelections?: boolean }): Promise<FolderSelectResult> {
    // In web mode, we can't use native dialogs
    // Return a special result that tells the UI to use an alternative
    return { paths: null, error: 'Native dialog not available in web mode. Please enter the path manually.' };
  },

  // Additional method for web-based directory browsing
  async browseDirectory(path?: string): Promise<DirectoryBrowserResult> {
    const params = path ? `?path=${encodeURIComponent(path)}` : '';
    return api.get<DirectoryBrowserResult>(`/api/filesystem/browse${params}`);
  },

  async getShortcuts(): Promise<{ shortcuts: Array<{ name: string; path: string }> }> {
    return api.get('/api/filesystem/shortcuts');
  },
};

export const dialog = isElectron ? electronDialog : httpDialog;

// ============================================================================
// Project Client
// ============================================================================

interface ProjectConfigResult {
  config: ProjectConfig | null;
  error?: string;
}

const electronProject = {
  async readConfig(projectPath: string): Promise<ProjectConfigResult> {
    return window.electron.project.readConfig(projectPath);
  },

  async writeConfig(projectPath: string, config: ProjectConfig): Promise<{ success: boolean; error?: string }> {
    return window.electron.project.writeConfig(projectPath, config);
  },

  async checkSetupStatus(projectPath: string): Promise<SetupStatusResult> {
    return window.electron.project.checkSetupStatus(projectPath);
  },
};

const httpProject = {
  async readConfig(projectPath: string): Promise<ProjectConfigResult> {
    return api.get<ProjectConfigResult>(`/api/project/config?path=${encodeURIComponent(projectPath)}`);
  },

  async writeConfig(projectPath: string, config: ProjectConfig): Promise<{ success: boolean; error?: string }> {
    return api.put('/api/project/config', { path: projectPath, config });
  },

  async checkSetupStatus(projectPath: string): Promise<SetupStatusResult> {
    return api.get<SetupStatusResult>(`/api/project/setup-status?path=${encodeURIComponent(projectPath)}`);
  },
};

export const project = isElectron ? electronProject : httpProject;

// ============================================================================
// App Info Client
// ============================================================================

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

// ============================================================================
// Docs Client
// ============================================================================

const electronDocs = {
  async listFiles(): Promise<DocsListResult> {
    return window.electron.docs.listFiles();
  },

  async readFile(filePath: string): Promise<DocsReadResult> {
    return window.electron.docs.readFile(filePath);
  },
};

const httpDocs = {
  async listFiles(): Promise<DocsListResult> {
    return api.get<DocsListResult>('/api/docs');
  },

  async readFile(filePath: string): Promise<DocsReadResult> {
    return api.get<DocsReadResult>(`/api/docs/file?path=${encodeURIComponent(filePath)}`);
  },
};

export const docs = isElectron ? electronDocs : httpDocs;
