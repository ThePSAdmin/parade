// DocsService - File operations for documentation files
// Reads markdown files from docs/, .claude/, .design/ directories

import fs from 'fs';
import path from 'path';

/**
 * Represents a documentation file with metadata
 */
export interface DocFile {
  /** Relative path from project root */
  relativePath: string;
  /** Absolute path to the file */
  absolutePath: string;
  /** File name without path */
  name: string;
  /** Source directory (docs, .claude, or .design) */
  source: 'docs' | '.claude' | '.design';
  /** File size in bytes */
  size: number;
  /** Last modified timestamp (ISO string) */
  modifiedAt: string;
}

/**
 * Result from listing documentation files
 */
export interface DocsListResult {
  files: DocFile[];
  error?: string;
}

/**
 * Result from reading a documentation file
 */
export interface DocsReadResult {
  content: string | null;
  error?: string;
}

/**
 * Directories to scan for documentation files
 */
const DOC_DIRECTORIES = ['docs', '.claude', '.design'] as const;

/**
 * File extensions to include
 */
const MARKDOWN_EXTENSIONS = ['.md', '.markdown', '.mdx'];

/**
 * DocsService provides file operations for documentation files.
 * It scans configured directories for markdown files and provides
 * read access to their contents.
 */
class DocsService {
  private projectPath: string | null = null;

  /**
   * Set the project root path for file operations
   * @param projectPath - Absolute path to project root
   */
  setProjectPath(projectPath: string): void {
    this.projectPath = projectPath;
    console.log('DocsService project path set:', projectPath);
  }

  /**
   * Get the current project path
   */
  getProjectPath(): string | null {
    return this.projectPath;
  }

  /**
   * List all markdown files from configured directories
   * Scans docs/, .claude/, .design/ recursively for .md files
   */
  listFiles(): DocsListResult {
    if (!this.projectPath) {
      return { files: [], error: 'Project path not configured' };
    }

    const files: DocFile[] = [];

    for (const dir of DOC_DIRECTORIES) {
      const dirPath = path.join(this.projectPath, dir);

      // Skip if directory doesn't exist
      if (!fs.existsSync(dirPath)) {
        continue;
      }

      try {
        const dirFiles = this.scanDirectory(dirPath, dir as typeof DOC_DIRECTORIES[number]);
        files.push(...dirFiles);
      } catch (err) {
        console.error(`Error scanning directory ${dir}:`, err);
        // Continue with other directories even if one fails
      }
    }

    // Sort by source directory, then by relative path
    files.sort((a, b) => {
      if (a.source !== b.source) {
        return DOC_DIRECTORIES.indexOf(a.source) - DOC_DIRECTORIES.indexOf(b.source);
      }
      return a.relativePath.localeCompare(b.relativePath);
    });

    return { files };
  }

  /**
   * Read the contents of a documentation file
   * @param filePath - Relative path from project root or absolute path
   */
  readFile(filePath: string): DocsReadResult {
    if (!this.projectPath) {
      return { content: null, error: 'Project path not configured' };
    }

    // Resolve to absolute path if relative
    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : path.join(this.projectPath, filePath);

    // Security check: ensure file is within project directory
    const normalizedPath = path.normalize(absolutePath);
    const normalizedProject = path.normalize(this.projectPath);

    if (!normalizedPath.startsWith(normalizedProject)) {
      return { content: null, error: 'Access denied: file path outside project directory' };
    }

    // Check file exists
    if (!fs.existsSync(absolutePath)) {
      return { content: null, error: `File not found: ${filePath}` };
    }

    // Check it's a file, not a directory
    const stat = fs.statSync(absolutePath);
    if (!stat.isFile()) {
      return { content: null, error: `Not a file: ${filePath}` };
    }

    try {
      const content = fs.readFileSync(absolutePath, 'utf-8');
      return { content };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      return { content: null, error: `Failed to read file: ${errorMessage}` };
    }
  }

  /**
   * Recursively scan a directory for markdown files
   * @param dirPath - Absolute path to directory
   * @param source - Source directory identifier
   * @param basePath - Base path for calculating relative paths
   */
  private scanDirectory(
    dirPath: string,
    source: typeof DOC_DIRECTORIES[number],
    basePath?: string
  ): DocFile[] {
    const files: DocFile[] = [];
    const effectiveBasePath = basePath || dirPath;

    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dirPath, { withFileTypes: true });
    } catch (err) {
      console.error(`Error reading directory ${dirPath}:`, err);
      return files;
    }

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      // Skip hidden files and directories (except our target .claude, .design)
      if (entry.name.startsWith('.') && entry.name !== '.claude' && entry.name !== '.design') {
        continue;
      }

      if (entry.isDirectory()) {
        // Recursively scan subdirectories
        const subFiles = this.scanDirectory(fullPath, source, effectiveBasePath);
        files.push(...subFiles);
      } else if (entry.isFile()) {
        // Check if it's a markdown file
        const ext = path.extname(entry.name).toLowerCase();
        if (MARKDOWN_EXTENSIONS.includes(ext)) {
          try {
            const stat = fs.statSync(fullPath);
            const relativePath = path.join(
              source,
              path.relative(effectiveBasePath, fullPath)
            );

            files.push({
              relativePath,
              absolutePath: fullPath,
              name: entry.name,
              source,
              size: stat.size,
              modifiedAt: stat.mtime.toISOString(),
            });
          } catch (err) {
            console.error(`Error getting stats for ${fullPath}:`, err);
          }
        }
      }
    }

    return files;
  }
}

// Export singleton instance
export const docsService = new DocsService();
export default docsService;
