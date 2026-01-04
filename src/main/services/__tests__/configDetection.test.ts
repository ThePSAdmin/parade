/**
 * Config Detection Tests - TDD RED Phase
 *
 * Tests for detecting existing project configuration files and directories.
 * This service should detect:
 * - .claude/ directory exists
 * - .beads/ directory exists
 * - project.yaml exists
 *
 * And provide merge/replace options when configs exist.
 *
 * NOTE: These tests are expected to FAIL because the detection service
 * doesn't exist yet. This is the TDD RED phase.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import path from 'path'
import fs from 'fs'
import os from 'os'

// ============================================================================
// Type Definitions for Config Detection (to be implemented)
// ============================================================================

/** Detection result for a single config item */
interface ConfigItemDetection {
  exists: boolean
  path: string
  type: 'directory' | 'file'
  /** For directories, lists immediate children */
  contents?: string[]
  /** Modification time if exists */
  modifiedAt?: string
}

/** Overall detection results */
interface ConfigDetectionResult {
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
interface MergeOptions {
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
interface MergeResult {
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
interface ReplaceResult {
  success: boolean
  /** Paths that were backed up before replace */
  backedUpPaths: string[]
  /** New paths created after replace */
  createdPaths: string[]
  error?: string
}

/** Partial config - for merge testing */
interface PartialConfigDetection {
  hasClaudeDir: boolean
  hasBeadsDir: boolean
  hasProjectYaml: boolean
  detectedItems: string[]
  missingItems: string[]
}

// ============================================================================
// Expected Module Interface
// ============================================================================

interface IConfigDetectionService {
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
  backupConfig(projectPath: string): Promise<{ success: boolean; backupPath?: string; error?: string }>
}

// ============================================================================
// Helper to attempt import of config detection service
// ============================================================================

// ============================================================================
// Mock filesystem for controlled testing
// ============================================================================

// We don't mock fs globally - tests use real temp directories for accuracy

// ============================================================================
// Stub implementation for RED phase
// ============================================================================

/**
 * Stub implementation that will be replaced when the real module is created.
 * This allows tests to run and FAIL properly in the RED phase.
 */
const stubConfigDetectionService: IConfigDetectionService = {
  async detectConfig(_projectPath: string): Promise<ConfigDetectionResult> {
    // RED PHASE: This stub will cause tests to fail with wrong values
    throw new Error('ConfigDetectionService not implemented - RED phase')
  },
  async hasAnyConfig(_projectPath: string): Promise<boolean> {
    throw new Error('ConfigDetectionService not implemented - RED phase')
  },
  async getPartialConfig(_projectPath: string): Promise<PartialConfigDetection> {
    throw new Error('ConfigDetectionService not implemented - RED phase')
  },
  async mergeConfig(_projectPath: string, _options: MergeOptions): Promise<MergeResult> {
    throw new Error('ConfigDetectionService not implemented - RED phase')
  },
  async replaceConfig(_projectPath: string): Promise<ReplaceResult> {
    throw new Error('ConfigDetectionService not implemented - RED phase')
  },
  async backupConfig(_projectPath: string): Promise<{ success: boolean; backupPath?: string; error?: string }> {
    throw new Error('ConfigDetectionService not implemented - RED phase')
  },
}

/**
 * Attempts to import the config detection service module.
 * Returns stub if the module doesn't exist (expected in RED phase).
 * The stub throws errors causing tests to fail as expected.
 */
function getConfigDetectionService(): {
  configDetectionService: IConfigDetectionService
  ConfigDetectionService: (new () => IConfigDetectionService) | null
  isStub: boolean
} {
  // Try to require the real module - this will be synchronous check
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const module = require('../configDetection')
    return {
      configDetectionService: module.configDetectionService as IConfigDetectionService,
      ConfigDetectionService: module.ConfigDetectionService as new () => IConfigDetectionService,
      isStub: false,
    }
  } catch {
    // Module doesn't exist yet - return stub for RED phase
    return {
      configDetectionService: stubConfigDetectionService,
      ConfigDetectionService: null,
      isStub: true,
    }
  }
}

/**
 * Async helper to import the config detection module.
 * Returns null if module doesn't exist (RED phase).
 */
async function tryImportConfigDetection(): Promise<{
  configDetectionService: IConfigDetectionService
  ConfigDetectionService: new () => IConfigDetectionService
} | null> {
  try {
    const module = await import('../configDetection')
    return {
      configDetectionService: module.configDetectionService,
      ConfigDetectionService: module.ConfigDetectionService,
    }
  } catch {
    return null
  }
}

// ============================================================================
// Tests
// ============================================================================

describe('ConfigDetectionService', () => {
  let tempDir: string

  beforeEach(() => {
    vi.clearAllMocks()
    // Create a temp directory for test files
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'config-detection-test-'))
  })

  afterEach(() => {
    vi.restoreAllMocks()
    // Clean up temp directory
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
  })

  // ==========================================================================
  // Module Existence Tests
  // ==========================================================================

  describe('Module Existence', () => {
    it('should have config detection module at src/main/services/configDetection.ts', async () => {
      const module = await tryImportConfigDetection()

      // Module should exist and be importable
      expect(module).not.toBeNull()
    })

    it('should export configDetectionService singleton instance', async () => {
      const module = await tryImportConfigDetection()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      expect(module.configDetectionService).toBeDefined()
      expect(typeof module.configDetectionService).toBe('object')
    })

    it('should export ConfigDetectionService class', async () => {
      const module = await tryImportConfigDetection()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      expect(module.ConfigDetectionService).toBeDefined()
      expect(typeof module.ConfigDetectionService).toBe('function')
    })
  })

  // ==========================================================================
  // .claude/ Directory Detection Tests
  // ==========================================================================

  describe('detectConfig - .claude/ directory', () => {
    it('should detect existing .claude/ directory', async () => {
      const module = await tryImportConfigDetection()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      // Setup: Create .claude directory
      const claudeDir = path.join(tempDir, '.claude')
      fs.mkdirSync(claudeDir)

      const result = await module.configDetectionService.detectConfig(tempDir)

      expect(result.claudeDir.exists).toBe(true)
      expect(result.claudeDir.path).toBe(claudeDir)
      expect(result.claudeDir.type).toBe('directory')
    })

    it('should report .claude/ as not existing when absent', async () => {
      const module = await tryImportConfigDetection()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      // No .claude directory created
      const result = await module.configDetectionService.detectConfig(tempDir)

      expect(result.claudeDir.exists).toBe(false)
      expect(result.claudeDir.path).toBe(path.join(tempDir, '.claude'))
    })

    it('should list contents of existing .claude/ directory', async () => {
      const module = await tryImportConfigDetection()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      // Setup: Create .claude directory with files
      const claudeDir = path.join(tempDir, '.claude')
      fs.mkdirSync(claudeDir)
      fs.writeFileSync(path.join(claudeDir, 'CLAUDE.md'), '# Claude Config')
      fs.mkdirSync(path.join(claudeDir, 'agents'))
      fs.mkdirSync(path.join(claudeDir, 'skills'))

      const result = await module.configDetectionService.detectConfig(tempDir)

      expect(result.claudeDir.exists).toBe(true)
      expect(result.claudeDir.contents).toBeDefined()
      expect(result.claudeDir.contents).toContain('CLAUDE.md')
      expect(result.claudeDir.contents).toContain('agents')
      expect(result.claudeDir.contents).toContain('skills')
    })

    it('should include modification time for .claude/ directory', async () => {
      const module = await tryImportConfigDetection()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      // Setup: Create .claude directory
      const claudeDir = path.join(tempDir, '.claude')
      fs.mkdirSync(claudeDir)

      const result = await module.configDetectionService.detectConfig(tempDir)

      expect(result.claudeDir.modifiedAt).toBeDefined()
      // Should be a valid ISO date string
      expect(new Date(result.claudeDir.modifiedAt!).toISOString()).toBe(result.claudeDir.modifiedAt)
    })
  })

  // ==========================================================================
  // .beads/ Directory Detection Tests
  // ==========================================================================

  describe('detectConfig - .beads/ directory', () => {
    it('should detect existing .beads/ directory', async () => {
      const module = await tryImportConfigDetection()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      // Setup: Create .beads directory
      const beadsDir = path.join(tempDir, '.beads')
      fs.mkdirSync(beadsDir)

      const result = await module.configDetectionService.detectConfig(tempDir)

      expect(result.beadsDir.exists).toBe(true)
      expect(result.beadsDir.path).toBe(beadsDir)
      expect(result.beadsDir.type).toBe('directory')
    })

    it('should report .beads/ as not existing when absent', async () => {
      const module = await tryImportConfigDetection()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      // No .beads directory created
      const result = await module.configDetectionService.detectConfig(tempDir)

      expect(result.beadsDir.exists).toBe(false)
      expect(result.beadsDir.path).toBe(path.join(tempDir, '.beads'))
    })

    it('should list contents of existing .beads/ directory', async () => {
      const module = await tryImportConfigDetection()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      // Setup: Create .beads directory with bead files
      const beadsDir = path.join(tempDir, '.beads')
      fs.mkdirSync(beadsDir)
      fs.writeFileSync(path.join(beadsDir, 'bd-abc123.yaml'), 'id: bd-abc123')
      fs.writeFileSync(path.join(beadsDir, 'bd-def456.yaml'), 'id: bd-def456')

      const result = await module.configDetectionService.detectConfig(tempDir)

      expect(result.beadsDir.exists).toBe(true)
      expect(result.beadsDir.contents).toBeDefined()
      expect(result.beadsDir.contents).toContain('bd-abc123.yaml')
      expect(result.beadsDir.contents).toContain('bd-def456.yaml')
    })

    it('should include modification time for .beads/ directory', async () => {
      const module = await tryImportConfigDetection()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      // Setup: Create .beads directory
      const beadsDir = path.join(tempDir, '.beads')
      fs.mkdirSync(beadsDir)

      const result = await module.configDetectionService.detectConfig(tempDir)

      expect(result.beadsDir.modifiedAt).toBeDefined()
      expect(new Date(result.beadsDir.modifiedAt!).toISOString()).toBe(result.beadsDir.modifiedAt)
    })
  })

  // ==========================================================================
  // project.yaml File Detection Tests
  // ==========================================================================

  describe('detectConfig - project.yaml file', () => {
    it('should detect existing project.yaml file', async () => {
      const module = await tryImportConfigDetection()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      // Setup: Create project.yaml file
      const projectYamlPath = path.join(tempDir, 'project.yaml')
      fs.writeFileSync(projectYamlPath, 'version: "1.0"\nproject:\n  name: "test"')

      const result = await module.configDetectionService.detectConfig(tempDir)

      expect(result.projectYaml.exists).toBe(true)
      expect(result.projectYaml.path).toBe(projectYamlPath)
      expect(result.projectYaml.type).toBe('file')
    })

    it('should report project.yaml as not existing when absent', async () => {
      const module = await tryImportConfigDetection()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      // No project.yaml created
      const result = await module.configDetectionService.detectConfig(tempDir)

      expect(result.projectYaml.exists).toBe(false)
      expect(result.projectYaml.path).toBe(path.join(tempDir, 'project.yaml'))
    })

    it('should include modification time for project.yaml file', async () => {
      const module = await tryImportConfigDetection()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      // Setup: Create project.yaml file
      const projectYamlPath = path.join(tempDir, 'project.yaml')
      fs.writeFileSync(projectYamlPath, 'version: "1.0"\nproject:\n  name: "test"')

      const result = await module.configDetectionService.detectConfig(tempDir)

      expect(result.projectYaml.modifiedAt).toBeDefined()
      expect(new Date(result.projectYaml.modifiedAt!).toISOString()).toBe(result.projectYaml.modifiedAt)
    })
  })

  // ==========================================================================
  // Detection Results Object Tests
  // ==========================================================================

  describe('detectConfig - returns detection results object', () => {
    it('should return hasExistingConfig as true when any config exists', async () => {
      const module = await tryImportConfigDetection()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      // Setup: Create only .claude directory
      fs.mkdirSync(path.join(tempDir, '.claude'))

      const result = await module.configDetectionService.detectConfig(tempDir)

      expect(result.hasExistingConfig).toBe(true)
    })

    it('should return hasExistingConfig as false when no config exists', async () => {
      const module = await tryImportConfigDetection()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      // Empty directory
      const result = await module.configDetectionService.detectConfig(tempDir)

      expect(result.hasExistingConfig).toBe(false)
    })

    it('should include summary with count of existing items', async () => {
      const module = await tryImportConfigDetection()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      // Setup: Create all three config items
      fs.mkdirSync(path.join(tempDir, '.claude'))
      fs.mkdirSync(path.join(tempDir, '.beads'))
      fs.writeFileSync(path.join(tempDir, 'project.yaml'), 'version: "1.0"\nproject:\n  name: "test"')

      const result = await module.configDetectionService.detectConfig(tempDir)

      expect(result.summary.existingCount).toBe(3)
      expect(result.summary.items).toContain('.claude')
      expect(result.summary.items).toContain('.beads')
      expect(result.summary.items).toContain('project.yaml')
    })

    it('should return correct summary when only some items exist', async () => {
      const module = await tryImportConfigDetection()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      // Setup: Create only .beads and project.yaml
      fs.mkdirSync(path.join(tempDir, '.beads'))
      fs.writeFileSync(path.join(tempDir, 'project.yaml'), 'version: "1.0"\nproject:\n  name: "test"')

      const result = await module.configDetectionService.detectConfig(tempDir)

      expect(result.summary.existingCount).toBe(2)
      expect(result.summary.items).not.toContain('.claude')
      expect(result.summary.items).toContain('.beads')
      expect(result.summary.items).toContain('project.yaml')
    })

    it('should return complete result structure even for empty directory', async () => {
      const module = await tryImportConfigDetection()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      const result = await module.configDetectionService.detectConfig(tempDir)

      // Verify complete structure
      expect(result).toHaveProperty('hasExistingConfig')
      expect(result).toHaveProperty('claudeDir')
      expect(result).toHaveProperty('beadsDir')
      expect(result).toHaveProperty('projectYaml')
      expect(result).toHaveProperty('summary')
      expect(result.summary).toHaveProperty('existingCount')
      expect(result.summary).toHaveProperty('items')
    })
  })

  // ==========================================================================
  // Merge Option Tests
  // ==========================================================================

  describe('mergeConfig - preserves existing + adds new', () => {
    it('should preserve existing CLAUDE.md when merging', async () => {
      const module = await tryImportConfigDetection()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      // Setup: Create existing .claude/CLAUDE.md
      const claudeDir = path.join(tempDir, '.claude')
      fs.mkdirSync(claudeDir)
      const claudeMdPath = path.join(claudeDir, 'CLAUDE.md')
      const originalContent = '# My Custom Claude Config\n\nCustom instructions here.'
      fs.writeFileSync(claudeMdPath, originalContent)

      const result = await module.configDetectionService.mergeConfig(tempDir, {
        preserveClaudeMd: true,
      })

      expect(result.success).toBe(true)
      expect(result.preservedPaths).toContain(claudeMdPath)

      // Verify content is preserved
      const content = fs.readFileSync(claudeMdPath, 'utf-8')
      expect(content).toContain('My Custom Claude Config')
    })

    it('should preserve existing beads issues when merging', async () => {
      const module = await tryImportConfigDetection()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      // Setup: Create existing .beads with issues
      const beadsDir = path.join(tempDir, '.beads')
      fs.mkdirSync(beadsDir)
      const beadFile = path.join(beadsDir, 'bd-existing.yaml')
      fs.writeFileSync(beadFile, 'id: bd-existing\ntitle: Existing Issue')

      const result = await module.configDetectionService.mergeConfig(tempDir, {
        preserveBeads: true,
      })

      expect(result.success).toBe(true)
      expect(result.preservedPaths).toContain(beadFile)

      // Verify bead is preserved
      expect(fs.existsSync(beadFile)).toBe(true)
      const content = fs.readFileSync(beadFile, 'utf-8')
      expect(content).toContain('Existing Issue')
    })

    it('should merge project.yaml fields instead of replace', async () => {
      const module = await tryImportConfigDetection()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      // Setup: Create existing project.yaml with custom fields
      const projectYamlPath = path.join(tempDir, 'project.yaml')
      const existingYaml = `version: "1.0"
project:
  name: "original-project"
  description: "Original description"
custom_field: "should be preserved"
`
      fs.writeFileSync(projectYamlPath, existingYaml)

      const result = await module.configDetectionService.mergeConfig(tempDir, {
        mergeProjectYaml: true,
        preserveFields: ['custom_field', 'project.description'],
      })

      expect(result.success).toBe(true)

      // Verify custom field is preserved
      const content = fs.readFileSync(projectYamlPath, 'utf-8')
      expect(content).toContain('custom_field')
      expect(content).toContain('should be preserved')
    })

    it('should add new directories while preserving existing ones', async () => {
      const module = await tryImportConfigDetection()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      // Setup: Create only .claude directory
      const claudeDir = path.join(tempDir, '.claude')
      fs.mkdirSync(claudeDir)
      fs.writeFileSync(path.join(claudeDir, 'existing.txt'), 'existing')

      const result = await module.configDetectionService.mergeConfig(tempDir, {
        preserveClaudeMd: true,
      })

      expect(result.success).toBe(true)

      // Verify new directories were created
      expect(result.createdPaths.some((p) => p.includes('.beads'))).toBe(true)

      // Verify existing content preserved
      expect(fs.existsSync(path.join(claudeDir, 'existing.txt'))).toBe(true)
    })

    it('should return list of preserved, updated, and created paths', async () => {
      const module = await tryImportConfigDetection()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      // Setup: Create partial config
      fs.mkdirSync(path.join(tempDir, '.claude'))

      const result = await module.configDetectionService.mergeConfig(tempDir, {})

      expect(Array.isArray(result.preservedPaths)).toBe(true)
      expect(Array.isArray(result.updatedPaths)).toBe(true)
      expect(Array.isArray(result.createdPaths)).toBe(true)
    })

    it('should create backup of modified files during merge', async () => {
      const module = await tryImportConfigDetection()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      // Setup: Create existing project.yaml
      const projectYamlPath = path.join(tempDir, 'project.yaml')
      fs.writeFileSync(projectYamlPath, 'version: "1.0"\nproject:\n  name: "original"')

      const result = await module.configDetectionService.mergeConfig(tempDir, {
        mergeProjectYaml: true,
      })

      expect(result.success).toBe(true)
      expect(result.backupPaths.length).toBeGreaterThan(0)

      // Verify backup exists
      for (const backupPath of result.backupPaths) {
        expect(fs.existsSync(backupPath)).toBe(true)
      }
    })
  })

  // ==========================================================================
  // Replace Option Tests
  // ==========================================================================

  describe('replaceConfig - overwrites existing', () => {
    it('should backup existing config before replacing', async () => {
      const module = await tryImportConfigDetection()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      // Setup: Create existing config
      fs.mkdirSync(path.join(tempDir, '.claude'))
      fs.mkdirSync(path.join(tempDir, '.beads'))
      fs.writeFileSync(path.join(tempDir, 'project.yaml'), 'version: "1.0"\nproject:\n  name: "old"')

      const result = await module.configDetectionService.replaceConfig(tempDir)

      expect(result.success).toBe(true)
      expect(result.backedUpPaths.length).toBeGreaterThan(0)
    })

    it('should remove existing .claude/ directory before creating new', async () => {
      const module = await tryImportConfigDetection()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      // Setup: Create existing .claude with custom content
      const claudeDir = path.join(tempDir, '.claude')
      fs.mkdirSync(claudeDir)
      const customFilePath = path.join(claudeDir, 'custom-file.txt')
      fs.writeFileSync(customFilePath, 'custom content')

      const result = await module.configDetectionService.replaceConfig(tempDir)

      expect(result.success).toBe(true)

      // Custom file should be gone (was backed up and removed)
      expect(fs.existsSync(customFilePath)).toBe(false)
    })

    it('should remove existing .beads/ directory before creating new', async () => {
      const module = await tryImportConfigDetection()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      // Setup: Create existing .beads with issues
      const beadsDir = path.join(tempDir, '.beads')
      fs.mkdirSync(beadsDir)
      fs.writeFileSync(path.join(beadsDir, 'bd-old.yaml'), 'id: bd-old')

      const result = await module.configDetectionService.replaceConfig(tempDir)

      expect(result.success).toBe(true)

      // Old bead should be gone
      expect(fs.existsSync(path.join(beadsDir, 'bd-old.yaml'))).toBe(false)
    })

    it('should remove existing project.yaml before creating new', async () => {
      const module = await tryImportConfigDetection()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      // Setup: Create existing project.yaml
      const projectYamlPath = path.join(tempDir, 'project.yaml')
      fs.writeFileSync(projectYamlPath, 'version: "1.0"\nproject:\n  name: "old-name"')

      const result = await module.configDetectionService.replaceConfig(tempDir)

      expect(result.success).toBe(true)

      // Verify project.yaml was replaced (should not contain old name)
      // Note: The new content would be from scaffold
      const content = fs.readFileSync(projectYamlPath, 'utf-8')
      expect(content).not.toContain('old-name')
    })

    it('should create fresh config structure after replace', async () => {
      const module = await tryImportConfigDetection()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      // Setup: Create existing config
      fs.mkdirSync(path.join(tempDir, '.claude'))

      const result = await module.configDetectionService.replaceConfig(tempDir)

      expect(result.success).toBe(true)
      expect(result.createdPaths.length).toBeGreaterThan(0)

      // Verify new structure exists
      expect(fs.existsSync(path.join(tempDir, '.claude'))).toBe(true)
      expect(fs.existsSync(path.join(tempDir, '.beads'))).toBe(true)
    })

    it('should return list of backed up and created paths', async () => {
      const module = await tryImportConfigDetection()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      // Setup: Create existing config
      fs.mkdirSync(path.join(tempDir, '.claude'))
      fs.writeFileSync(path.join(tempDir, 'project.yaml'), 'version: "1.0"\nproject:\n  name: "test"')

      const result = await module.configDetectionService.replaceConfig(tempDir)

      expect(result.success).toBe(true)
      expect(Array.isArray(result.backedUpPaths)).toBe(true)
      expect(Array.isArray(result.createdPaths)).toBe(true)
    })
  })

  // ==========================================================================
  // Partial Configuration Tests
  // ==========================================================================

  describe('getPartialConfig - handles partial configurations', () => {
    it('should detect when only .claude/ exists', async () => {
      const module = await tryImportConfigDetection()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      // Setup: Create only .claude
      fs.mkdirSync(path.join(tempDir, '.claude'))

      const result = await module.configDetectionService.getPartialConfig(tempDir)

      expect(result.hasClaudeDir).toBe(true)
      expect(result.hasBeadsDir).toBe(false)
      expect(result.hasProjectYaml).toBe(false)
      expect(result.detectedItems).toContain('.claude')
      expect(result.missingItems).toContain('.beads')
      expect(result.missingItems).toContain('project.yaml')
    })

    it('should detect when only .beads/ exists', async () => {
      const module = await tryImportConfigDetection()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      // Setup: Create only .beads
      fs.mkdirSync(path.join(tempDir, '.beads'))

      const result = await module.configDetectionService.getPartialConfig(tempDir)

      expect(result.hasClaudeDir).toBe(false)
      expect(result.hasBeadsDir).toBe(true)
      expect(result.hasProjectYaml).toBe(false)
      expect(result.detectedItems).toContain('.beads')
      expect(result.missingItems).toContain('.claude')
      expect(result.missingItems).toContain('project.yaml')
    })

    it('should detect when only project.yaml exists', async () => {
      const module = await tryImportConfigDetection()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      // Setup: Create only project.yaml
      fs.writeFileSync(path.join(tempDir, 'project.yaml'), 'version: "1.0"\nproject:\n  name: "test"')

      const result = await module.configDetectionService.getPartialConfig(tempDir)

      expect(result.hasClaudeDir).toBe(false)
      expect(result.hasBeadsDir).toBe(false)
      expect(result.hasProjectYaml).toBe(true)
      expect(result.detectedItems).toContain('project.yaml')
      expect(result.missingItems).toContain('.claude')
      expect(result.missingItems).toContain('.beads')
    })

    it('should detect when .claude/ and .beads/ exist but not project.yaml', async () => {
      const module = await tryImportConfigDetection()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      // Setup: Create .claude and .beads
      fs.mkdirSync(path.join(tempDir, '.claude'))
      fs.mkdirSync(path.join(tempDir, '.beads'))

      const result = await module.configDetectionService.getPartialConfig(tempDir)

      expect(result.hasClaudeDir).toBe(true)
      expect(result.hasBeadsDir).toBe(true)
      expect(result.hasProjectYaml).toBe(false)
      expect(result.detectedItems).toHaveLength(2)
      expect(result.missingItems).toContain('project.yaml')
    })

    it('should return all items as missing for empty directory', async () => {
      const module = await tryImportConfigDetection()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      const result = await module.configDetectionService.getPartialConfig(tempDir)

      expect(result.hasClaudeDir).toBe(false)
      expect(result.hasBeadsDir).toBe(false)
      expect(result.hasProjectYaml).toBe(false)
      expect(result.detectedItems).toHaveLength(0)
      expect(result.missingItems).toHaveLength(3)
    })

    it('should return all items as detected for complete config', async () => {
      const module = await tryImportConfigDetection()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      // Setup: Create complete config
      fs.mkdirSync(path.join(tempDir, '.claude'))
      fs.mkdirSync(path.join(tempDir, '.beads'))
      fs.writeFileSync(path.join(tempDir, 'project.yaml'), 'version: "1.0"\nproject:\n  name: "test"')

      const result = await module.configDetectionService.getPartialConfig(tempDir)

      expect(result.hasClaudeDir).toBe(true)
      expect(result.hasBeadsDir).toBe(true)
      expect(result.hasProjectYaml).toBe(true)
      expect(result.detectedItems).toHaveLength(3)
      expect(result.missingItems).toHaveLength(0)
    })
  })

  // ==========================================================================
  // Backup Tests
  // ==========================================================================

  describe('backupConfig', () => {
    it('should create backup of existing config in timestamped directory', async () => {
      const module = await tryImportConfigDetection()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      // Setup: Create existing config
      fs.mkdirSync(path.join(tempDir, '.claude'))
      fs.writeFileSync(path.join(tempDir, '.claude', 'CLAUDE.md'), '# Test')
      fs.mkdirSync(path.join(tempDir, '.beads'))
      fs.writeFileSync(path.join(tempDir, 'project.yaml'), 'version: "1.0"\nproject:\n  name: "test"')

      const result = await module.configDetectionService.backupConfig(tempDir)

      expect(result.success).toBe(true)
      expect(result.backupPath).toBeDefined()
      expect(fs.existsSync(result.backupPath!)).toBe(true)

      // Backup should contain the config
      expect(fs.existsSync(path.join(result.backupPath!, '.claude'))).toBe(true)
      expect(fs.existsSync(path.join(result.backupPath!, '.beads'))).toBe(true)
      expect(fs.existsSync(path.join(result.backupPath!, 'project.yaml'))).toBe(true)
    })

    it('should return error when no config to backup', async () => {
      const module = await tryImportConfigDetection()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      // Empty directory - nothing to backup
      const result = await module.configDetectionService.backupConfig(tempDir)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should preserve backup even after original is modified', async () => {
      const module = await tryImportConfigDetection()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      // Setup: Create existing config
      const claudeMdPath = path.join(tempDir, '.claude', 'CLAUDE.md')
      fs.mkdirSync(path.join(tempDir, '.claude'))
      fs.writeFileSync(claudeMdPath, '# Original Content')

      const result = await module.configDetectionService.backupConfig(tempDir)

      expect(result.success).toBe(true)

      // Modify original
      fs.writeFileSync(claudeMdPath, '# Modified Content')

      // Backup should still have original
      const backupContent = fs.readFileSync(path.join(result.backupPath!, '.claude', 'CLAUDE.md'), 'utf-8')
      expect(backupContent).toContain('Original Content')
    })
  })

  // ==========================================================================
  // Helper Function Tests
  // ==========================================================================

  describe('hasAnyConfig', () => {
    it('should return true when .claude/ exists', async () => {
      const module = await tryImportConfigDetection()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      fs.mkdirSync(path.join(tempDir, '.claude'))

      const result = await module.configDetectionService.hasAnyConfig(tempDir)

      expect(result).toBe(true)
    })

    it('should return true when .beads/ exists', async () => {
      const module = await tryImportConfigDetection()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      fs.mkdirSync(path.join(tempDir, '.beads'))

      const result = await module.configDetectionService.hasAnyConfig(tempDir)

      expect(result).toBe(true)
    })

    it('should return true when project.yaml exists', async () => {
      const module = await tryImportConfigDetection()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      fs.writeFileSync(path.join(tempDir, 'project.yaml'), 'version: "1.0"\nproject:\n  name: "test"')

      const result = await module.configDetectionService.hasAnyConfig(tempDir)

      expect(result).toBe(true)
    })

    it('should return false when nothing exists', async () => {
      const module = await tryImportConfigDetection()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      const result = await module.configDetectionService.hasAnyConfig(tempDir)

      expect(result).toBe(false)
    })
  })

  // ==========================================================================
  // Error Handling Tests
  // ==========================================================================

  describe('Error Handling', () => {
    it('should handle non-existent project path gracefully', async () => {
      const module = await tryImportConfigDetection()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      const nonExistentPath = path.join(tempDir, 'does-not-exist')
      const result = await module.configDetectionService.detectConfig(nonExistentPath)

      expect(result.hasExistingConfig).toBe(false)
      expect(result.claudeDir.exists).toBe(false)
      expect(result.beadsDir.exists).toBe(false)
      expect(result.projectYaml.exists).toBe(false)
    })

    it('should handle permission errors gracefully during detection', async () => {
      const module = await tryImportConfigDetection()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      // Create directory with restrictive permissions
      const restrictedDir = path.join(tempDir, 'restricted')
      fs.mkdirSync(restrictedDir)
      fs.mkdirSync(path.join(restrictedDir, '.claude'))
      fs.chmodSync(restrictedDir, 0o000)

      try {
        // Should not throw
        const result = await module.configDetectionService.detectConfig(restrictedDir)
        // Result depends on implementation - may show as not existing or throw
        expect(result).toBeDefined()
      } finally {
        // Restore permissions for cleanup
        fs.chmodSync(restrictedDir, 0o755)
      }
    })

    it('should handle merge errors gracefully', async () => {
      const module = await tryImportConfigDetection()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      const nonExistentPath = path.join(tempDir, 'does-not-exist')
      const result = await module.configDetectionService.mergeConfig(nonExistentPath, {})

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should handle replace errors gracefully', async () => {
      const module = await tryImportConfigDetection()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      const nonExistentPath = path.join(tempDir, 'does-not-exist')
      const result = await module.configDetectionService.replaceConfig(nonExistentPath)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })
})
