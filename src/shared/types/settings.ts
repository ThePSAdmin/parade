// Settings types - shared between main and renderer

/**
 * Project configuration for multi-project support
 */
export interface Project {
  /** Unique identifier for the project */
  id: string;
  /** Display name for the project */
  name: string;
  /** Filesystem path to the project root */
  path: string;
  /** ISO datetime when project was added */
  addedAt: string;
  /** Whether this project is currently active */
  isActive: boolean;
}

/**
 * Application settings structure
 */
export interface Settings {
  /** Legacy field - kept for backward compatibility */
  beadsProjectPath?: string;
  /** Claude API key for AI features */
  claudeApiKey?: string;
  /** List of configured projects */
  projects?: Project[];
}
