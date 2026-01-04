/**
 * Config Detection Service
 *
 * Detects existing project configuration files (.claude/, .beads/, project.yaml)
 * and provides merge/replace options when configs exist.
 */

import fs from 'fs'
import path from 'path'

// ============================================================================
// Type Definitions
// ============================================================================

/** Detection result for a single config item */
export interface ConfigItemDetection {
  exists: boolean
  path: string
  type: 'directory' | 'file'
  /** For directories, lists immediate children */
  contents?: string[]
  /** Modification time if exists */
  modifiedAt?: string
}

/** Overall detection results */
export interface ConfigDetectionResult {
  /** Whether any config was detected */
  hasExistingConfig: boolean
  /** Detection result for .claude/ directory */
  claudeDir: ConfigItemDetection
  /** Detection result for .beads/ directory */
  beadsDir: ConfigItemDetection
  /** Detection result for project.yaml file */
  projectYaml: ConfigItemDetection
  /** Summary of what exists */
  summary: {
    existingCount: number
    items: string[]
  }
}

/** Options for merge operation */
export interface MergeOptions {
  /** Whether to preserve existing CLAUDE.md content */
  preserveClaudeMd?: boolean
  /** Whether to preserve existing beads issues */
  preserveBeads?: boolean
  /** Whether to merge project.yaml fields instead of replace */
  mergeProjectYaml?: boolean
  /** Specific fields to preserve from existing project.yaml */
  preserveFields?: string[]
}

/** Result of a merge operation */
export interface MergeResult {
  success: boolean
  /** Paths that were preserved */
  preservedPaths: string[]
  /** Paths that were updated/replaced */
  updatedPaths: string[]
  /** Paths that were newly created */
  createdPaths: string[]
  /** Any backup paths created */
  backupPaths: string[]
  error?: string
}

/** Result of a replace operation */
export interface ReplaceResult {
  success: boolean
  /** Paths that were backed up before replace */
  backedUpPaths: string[]
  /** New paths created after replace */
  createdPaths: string[]
  error?: string
}

/** Partial config - for merge testing */
export interface PartialConfigDetection {
  hasClaudeDir: boolean
  hasBeadsDir: boolean
  hasProjectYaml: boolean
  detectedItems: string[]
  missingItems: string[]
}

/** Backup result */
export interface BackupResult {
  success: boolean
  backupPath?: string
  error?: string
}

// ============================================================================
// Config Detection Service Interface
// ============================================================================

export interface IConfigDetectionService {
  /** Detect existing configuration in a project path */
  detectConfig(projectPath: string): Promise<ConfigDetectionResult>
  /** Check if any config exists */
  hasAnyConfig(projectPath: string): Promise<boolean>
  /** Get partial config details */
  getPartialConfig(projectPath: string): Promise<PartialConfigDetection>
  /** Merge new config with existing */
  mergeConfig(projectPath: string, options: MergeOptions): Promise<MergeResult>
  /** Replace existing config completely */
  replaceConfig(projectPath: string): Promise<ReplaceResult>
  /** Create backup of existing config */
  backupConfig(projectPath: string): Promise<BackupResult>
}

// ============================================================================
// Config Detection Service Implementation
// ============================================================================

export class ConfigDetectionService implements IConfigDetectionService {
  /**
   * Detect existing configuration in a project path.
   * Checks for .claude/, .beads/, and project.yaml.
   */
  async detectConfig(projectPath: string): Promise<ConfigDetectionResult> {
    const claudeDirPath = path.join(projectPath, '.claude')
    const beadsDirPath = path.join(projectPath, '.beads')
    const projectYamlPath = path.join(projectPath, 'project.yaml')

    const claudeDir = await this.detectItem(claudeDirPath, 'directory')
    const beadsDir = await this.detectItem(beadsDirPath, 'directory')
    const projectYaml = await this.detectItem(projectYamlPath, 'file')

    const existingItems: string[] = []
    if (claudeDir.exists) existingItems.push('.claude')
    if (beadsDir.exists) existingItems.push('.beads')
    if (projectYaml.exists) existingItems.push('project.yaml')

    return {
      hasExistingConfig: existingItems.length > 0,
      claudeDir,
      beadsDir,
      projectYaml,
      summary: {
        existingCount: existingItems.length,
        items: existingItems,
      },
    }
  }

  /**
   * Check if any config exists in the project path.
   */
  async hasAnyConfig(projectPath: string): Promise<boolean> {
    const claudeDirPath = path.join(projectPath, '.claude')
    const beadsDirPath = path.join(projectPath, '.beads')
    const projectYamlPath = path.join(projectPath, 'project.yaml')

    try {
      return (
        fs.existsSync(claudeDirPath) ||
        fs.existsSync(beadsDirPath) ||
        fs.existsSync(projectYamlPath)
      )
    } catch {
      return false
    }
  }

  /**
   * Get partial config details - what exists and what's missing.
   */
  async getPartialConfig(projectPath: string): Promise<PartialConfigDetection> {
    const claudeDirPath = path.join(projectPath, '.claude')
    const beadsDirPath = path.join(projectPath, '.beads')
    const projectYamlPath = path.join(projectPath, 'project.yaml')

    const hasClaudeDir = fs.existsSync(claudeDirPath)
    const hasBeadsDir = fs.existsSync(beadsDirPath)
    const hasProjectYaml = fs.existsSync(projectYamlPath)

    const detectedItems: string[] = []
    const missingItems: string[] = []

    if (hasClaudeDir) {
      detectedItems.push('.claude')
    } else {
      missingItems.push('.claude')
    }

    if (hasBeadsDir) {
      detectedItems.push('.beads')
    } else {
      missingItems.push('.beads')
    }

    if (hasProjectYaml) {
      detectedItems.push('project.yaml')
    } else {
      missingItems.push('project.yaml')
    }

    return {
      hasClaudeDir,
      hasBeadsDir,
      hasProjectYaml,
      detectedItems,
      missingItems,
    }
  }

  /**
   * Merge new config with existing - preserves specified items.
   */
  async mergeConfig(projectPath: string, options: MergeOptions): Promise<MergeResult> {
    const result: MergeResult = {
      success: false,
      preservedPaths: [],
      updatedPaths: [],
      createdPaths: [],
      backupPaths: [],
    }

    // Validate project path exists
    if (!fs.existsSync(projectPath)) {
      result.error = `Project path does not exist: ${projectPath}`
      return result
    }

    try {
      const claudeDirPath = path.join(projectPath, '.claude')
      const beadsDirPath = path.join(projectPath, '.beads')
      const projectYamlPath = path.join(projectPath, 'project.yaml')
      const claudeMdPath = path.join(claudeDirPath, 'CLAUDE.md')

      // Handle .claude directory
      if (fs.existsSync(claudeDirPath)) {
        // Preserve existing CLAUDE.md if requested
        if (options.preserveClaudeMd && fs.existsSync(claudeMdPath)) {
          result.preservedPaths.push(claudeMdPath)
        }
      } else {
        // Create new .claude directory
        fs.mkdirSync(claudeDirPath, { recursive: true })
        result.createdPaths.push(claudeDirPath)
      }

      // Handle .beads directory
      if (fs.existsSync(beadsDirPath)) {
        // Preserve existing beads if requested
        if (options.preserveBeads) {
          const beadFiles = fs.readdirSync(beadsDirPath)
          for (const file of beadFiles) {
            result.preservedPaths.push(path.join(beadsDirPath, file))
          }
        }
      } else {
        // Create new .beads directory
        fs.mkdirSync(beadsDirPath, { recursive: true })
        result.createdPaths.push(beadsDirPath)
      }

      // Handle project.yaml
      if (fs.existsSync(projectYamlPath)) {
        if (options.mergeProjectYaml) {
          // Create backup before modifying
          const backupPath = `${projectYamlPath}.backup.${Date.now()}`
          fs.copyFileSync(projectYamlPath, backupPath)
          result.backupPaths.push(backupPath)

          // For now, preserve the file as-is when merge is requested
          // A full YAML merge would require a YAML parser
          result.preservedPaths.push(projectYamlPath)
        }
      } else {
        // Create new project.yaml
        const defaultContent = this.generateDefaultProjectYaml(path.basename(projectPath))
        fs.writeFileSync(projectYamlPath, defaultContent, 'utf-8')
        result.createdPaths.push(projectYamlPath)
      }

      result.success = true
    } catch (error) {
      result.error = error instanceof Error ? error.message : String(error)
    }

    return result
  }

  /**
   * Replace existing config completely - backs up first, then removes and recreates.
   */
  async replaceConfig(projectPath: string): Promise<ReplaceResult> {
    const result: ReplaceResult = {
      success: false,
      backedUpPaths: [],
      createdPaths: [],
    }

    // Validate project path exists
    if (!fs.existsSync(projectPath)) {
      result.error = `Project path does not exist: ${projectPath}`
      return result
    }

    try {
      const claudeDirPath = path.join(projectPath, '.claude')
      const beadsDirPath = path.join(projectPath, '.beads')
      const projectYamlPath = path.join(projectPath, 'project.yaml')

      // Create backup of existing config
      const backupResult = await this.backupConfig(projectPath)
      if (backupResult.success && backupResult.backupPath) {
        // Track backed up paths
        if (fs.existsSync(claudeDirPath)) {
          result.backedUpPaths.push(claudeDirPath)
        }
        if (fs.existsSync(beadsDirPath)) {
          result.backedUpPaths.push(beadsDirPath)
        }
        if (fs.existsSync(projectYamlPath)) {
          result.backedUpPaths.push(projectYamlPath)
        }
      }

      // Remove existing directories and files
      if (fs.existsSync(claudeDirPath)) {
        fs.rmSync(claudeDirPath, { recursive: true, force: true })
      }
      if (fs.existsSync(beadsDirPath)) {
        fs.rmSync(beadsDirPath, { recursive: true, force: true })
      }
      if (fs.existsSync(projectYamlPath)) {
        fs.unlinkSync(projectYamlPath)
      }

      // Create fresh config
      fs.mkdirSync(claudeDirPath, { recursive: true })
      result.createdPaths.push(claudeDirPath)

      fs.mkdirSync(beadsDirPath, { recursive: true })
      result.createdPaths.push(beadsDirPath)

      const defaultContent = this.generateDefaultProjectYaml(path.basename(projectPath))
      fs.writeFileSync(projectYamlPath, defaultContent, 'utf-8')
      result.createdPaths.push(projectYamlPath)

      result.success = true
    } catch (error) {
      result.error = error instanceof Error ? error.message : String(error)
    }

    return result
  }

  /**
   * Create backup of existing config in a timestamped directory.
   */
  async backupConfig(projectPath: string): Promise<BackupResult> {
    // Check if there's anything to backup
    const hasConfig = await this.hasAnyConfig(projectPath)
    if (!hasConfig) {
      return {
        success: false,
        error: 'No configuration to backup',
      }
    }

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const backupDir = path.join(projectPath, `.config-backup-${timestamp}`)

      fs.mkdirSync(backupDir, { recursive: true })

      const claudeDirPath = path.join(projectPath, '.claude')
      const beadsDirPath = path.join(projectPath, '.beads')
      const projectYamlPath = path.join(projectPath, 'project.yaml')

      // Copy .claude directory
      if (fs.existsSync(claudeDirPath)) {
        this.copyDirRecursive(claudeDirPath, path.join(backupDir, '.claude'))
      }

      // Copy .beads directory
      if (fs.existsSync(beadsDirPath)) {
        this.copyDirRecursive(beadsDirPath, path.join(backupDir, '.beads'))
      }

      // Copy project.yaml
      if (fs.existsSync(projectYamlPath)) {
        fs.copyFileSync(projectYamlPath, path.join(backupDir, 'project.yaml'))
      }

      return {
        success: true,
        backupPath: backupDir,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  // ==========================================================================
  // Private Helper Methods
  // ==========================================================================

  /**
   * Detect a single config item (file or directory).
   */
  private async detectItem(
    itemPath: string,
    expectedType: 'directory' | 'file'
  ): Promise<ConfigItemDetection> {
    const result: ConfigItemDetection = {
      exists: false,
      path: itemPath,
      type: expectedType,
    }

    try {
      if (!fs.existsSync(itemPath)) {
        return result
      }

      const stats = fs.statSync(itemPath)
      result.exists = true
      result.modifiedAt = stats.mtime.toISOString()

      // For directories, list contents
      if (expectedType === 'directory' && stats.isDirectory()) {
        result.contents = fs.readdirSync(itemPath)
      }
    } catch {
      // If we can't access the path, treat as not existing
      result.exists = false
    }

    return result
  }

  /**
   * Recursively copy a directory.
   */
  private copyDirRecursive(src: string, dest: string): void {
    fs.mkdirSync(dest, { recursive: true })

    const entries = fs.readdirSync(src, { withFileTypes: true })

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name)
      const destPath = path.join(dest, entry.name)

      if (entry.isDirectory()) {
        this.copyDirRecursive(srcPath, destPath)
      } else {
        fs.copyFileSync(srcPath, destPath)
      }
    }
  }

  /**
   * Generate default project.yaml content.
   */
  private generateDefaultProjectYaml(projectName: string): string {
    return `# Project configuration
version: "1.0"

project:
  name: "${projectName}"
  description: "${projectName} project"

# Stack configuration (customize as needed)
stack:
  language: "typescript"
  framework: ""
  testing: "npm run test"
  build: "npm run build"

# Workflow settings
workflow:
  discovery_enabled: true
  auto_sync: true
`
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const configDetectionService = new ConfigDetectionService()
export default configDetectionService
