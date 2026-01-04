/**
 * Project Handlers Tests - TDD RED Phase
 *
 * Tests for project:readConfig, project:writeConfig, and project:createScaffold IPC handlers.
 *
 * These handlers will manage:
 * - Reading and parsing project.yaml configuration files
 * - Writing/updating project.yaml with validation
 * - Creating project scaffold directories (.claude/, .beads/, .design/)
 *
 * NOTE: These tests are expected to FAIL initially since the handlers don't exist yet.
 * This is the TDD RED phase.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import path from 'path'
import fs from 'fs'
import os from 'os'

// Import the actual module (GREEN phase - module now exists)
import * as projectHandlers from '../project-handlers'

// ============================================================================
// Type Definitions for Project Handlers (to be implemented)
// ============================================================================

/** Project configuration structure matching project.schema.json */
interface ProjectConfig {
  version: string
  project: {
    name: string
    description?: string
    repository?: string
  }
  vision?: {
    purpose?: string
    target_users?: string[]
    success_metrics?: string[]
  }
  stacks?: Record<string, unknown> | unknown[]
  design_system?: {
    enabled?: boolean
    path?: string
    docs?: string[]
  }
  data_governance?: {
    auth_provider?: string
    rls_patterns?: {
      description?: string
      examples?: string[]
    }
    naming_conventions?: {
      dates?: string
      enums?: string
      fields?: string
      files?: string
      directories?: string
    }
  }
  agents?: {
    custom?: Array<{
      name: string
      label: string
      prompt_file: string
    }>
  }
  workflow?: {
    tdd_enabled?: boolean
  }
}

/** Result of reading project config */
interface ReadConfigResult {
  config: ProjectConfig | null
  error?: string
}

/** Result of writing project config */
interface WriteConfigResult {
  success: boolean
  backupPath?: string
  error?: string
}

/** Result of creating scaffold */
interface CreateScaffoldResult {
  success: boolean
  createdPaths: string[]
  skippedPaths: string[]
  error?: string
}

/** Options for scaffold creation */
interface ScaffoldOptions {
  projectPath: string
  projectName?: string
  createDesign?: boolean
  templateVars?: Record<string, string>
}

// ============================================================================
// Mock Setup
// ============================================================================

// Mock electron's ipcMain - must be hoisted, so use vi.hoisted
const { mockIpcMain } = vi.hoisted(() => ({
  mockIpcMain: {
    handle: vi.fn(),
    removeHandler: vi.fn(),
  },
}))

vi.mock('electron', () => ({
  ipcMain: mockIpcMain,
  app: {
    getPath: vi.fn(() => '/mock/user/data'),
    getVersion: vi.fn(() => '1.0.0'),
  },
}))

// ============================================================================
// Helper to attempt import of project handlers
// ============================================================================

interface ProjectHandlersModule {
  readProjectConfig: (projectPath: string) => Promise<ReadConfigResult>
  writeProjectConfig: (projectPath: string, config: ProjectConfig) => Promise<WriteConfigResult>
  createProjectScaffold: (options: ScaffoldOptions) => Promise<CreateScaffoldResult>
  validateProjectConfig: (config: unknown) => { valid: boolean; errors: string[] }
  registerProjectHandlers: () => void
}

/**
 * Returns the project handlers module.
 * GREEN phase: Module now exists, so we return the imported module directly.
 */
function tryImportProjectHandlers(): ProjectHandlersModule | null {
  // GREEN phase - module exists and is imported at top of file
  return projectHandlers as ProjectHandlersModule
}

// ============================================================================
// Test Fixtures
// ============================================================================

const VALID_PROJECT_CONFIG: ProjectConfig = {
  version: '1.0',
  project: {
    name: 'test-project',
    description: 'A test project for unit tests',
  },
  vision: {
    purpose: 'Testing project handlers',
    target_users: ['Developers'],
    success_metrics: ['All tests pass'],
  },
  stacks: {
    frontend: {
      framework: 'React',
      language: 'TypeScript',
      testing: {
        unit: 'vitest',
        commands: {
          test: 'npm test',
          lint: 'npm run lint',
          build: 'npm run build',
        },
      },
    },
  },
  design_system: {
    enabled: true,
    path: '.design/',
    docs: ['.design/Colors.md'],
  },
  data_governance: {
    auth_provider: '',
    naming_conventions: {
      dates: 'created_at',
      enums: 'SCREAMING_SNAKE',
      fields: 'snake_case',
      files: 'kebab-case',
      directories: 'kebab-case',
    },
  },
  agents: {
    custom: [],
  },
  workflow: {
    tdd_enabled: true,
  },
}

const VALID_YAML_CONTENT = `# project.yaml - Generated by /init-project
version: "1.0"

project:
  name: "test-project"
  description: "A test project for unit tests"

vision:
  purpose: "Testing project handlers"
  target_users:
    - "Developers"
  success_metrics:
    - "All tests pass"

stacks:
  frontend:
    framework: "React"
    language: "TypeScript"
    testing:
      unit: "vitest"
      commands:
        test: "npm test"
        lint: "npm run lint"
        build: "npm run build"

design_system:
  enabled: true
  path: ".design/"
  docs:
    - ".design/Colors.md"

data_governance:
  auth_provider: ""
  naming_conventions:
    dates: "created_at"
    enums: "SCREAMING_SNAKE"
    fields: "snake_case"
    files: "kebab-case"
    directories: "kebab-case"

agents:
  custom: []

workflow:
  tdd_enabled: true
`

const MALFORMED_YAML_CONTENT = `
version: "1.0"
project:
  name: "test
  unclosed: [bracket
  bad: indentation
`

const MINIMAL_CONFIG: ProjectConfig = {
  version: '1.0',
  project: {
    name: 'minimal-project',
  },
}

// ============================================================================
// Tests
// ============================================================================

describe('Project Handlers', () => {
  let tempDir: string

  beforeEach(() => {
    vi.clearAllMocks()
    // Create a temp directory for test files
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'project-handlers-test-'))
  })

  afterEach(() => {
    vi.restoreAllMocks()
    // Clean up temp directory
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
  })

  describe('Module Existence', () => {
    it('should have project handlers module at src/main/ipc/project-handlers.ts', () => {
      const module = tryImportProjectHandlers()

      // RED PHASE: This will fail because the module doesn't exist
      expect(module).not.toBeNull()
    })

    it('should export readProjectConfig function', () => {
      const module = tryImportProjectHandlers()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      expect(module.readProjectConfig).toBeDefined()
      expect(typeof module.readProjectConfig).toBe('function')
    })

    it('should export writeProjectConfig function', () => {
      const module = tryImportProjectHandlers()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      expect(module.writeProjectConfig).toBeDefined()
      expect(typeof module.writeProjectConfig).toBe('function')
    })

    it('should export createProjectScaffold function', () => {
      const module = tryImportProjectHandlers()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      expect(module.createProjectScaffold).toBeDefined()
      expect(typeof module.createProjectScaffold).toBe('function')
    })

    it('should export validateProjectConfig function', () => {
      const module = tryImportProjectHandlers()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      expect(module.validateProjectConfig).toBeDefined()
      expect(typeof module.validateProjectConfig).toBe('function')
    })

    it('should export registerProjectHandlers function', () => {
      const module = tryImportProjectHandlers()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      expect(module.registerProjectHandlers).toBeDefined()
      expect(typeof module.registerProjectHandlers).toBe('function')
    })
  })

  // ==========================================================================
  // project:readConfig Tests
  // ==========================================================================

  describe('project:readConfig', () => {
    describe('when project.yaml exists', () => {
      it('should return parsed YAML config when file exists', async () => {
        const module = tryImportProjectHandlers()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        // Setup: Create a valid project.yaml in temp directory
        const projectYamlPath = path.join(tempDir, 'project.yaml')
        fs.writeFileSync(projectYamlPath, VALID_YAML_CONTENT)

        const result = await module.readProjectConfig(tempDir)

        expect(result.config).not.toBeNull()
        expect(result.config?.version).toBe('1.0')
        expect(result.config?.project.name).toBe('test-project')
        expect(result.config?.project.description).toBe('A test project for unit tests')
        expect(result.error).toBeUndefined()
      })

      it('should parse all config sections correctly', async () => {
        const module = tryImportProjectHandlers()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        const projectYamlPath = path.join(tempDir, 'project.yaml')
        fs.writeFileSync(projectYamlPath, VALID_YAML_CONTENT)

        const result = await module.readProjectConfig(tempDir)

        expect(result.config?.vision?.purpose).toBe('Testing project handlers')
        expect(result.config?.vision?.target_users).toContain('Developers')
        expect(result.config?.stacks).toBeDefined()
        expect(result.config?.design_system?.enabled).toBe(true)
        expect(result.config?.workflow?.tdd_enabled).toBe(true)
      })

      it('should handle minimal valid config', async () => {
        const module = tryImportProjectHandlers()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        const minimalYaml = `version: "1.0"\nproject:\n  name: "minimal-project"`
        const projectYamlPath = path.join(tempDir, 'project.yaml')
        fs.writeFileSync(projectYamlPath, minimalYaml)

        const result = await module.readProjectConfig(tempDir)

        expect(result.config).not.toBeNull()
        expect(result.config?.version).toBe('1.0')
        expect(result.config?.project.name).toBe('minimal-project')
      })
    })

    describe('when project.yaml does not exist', () => {
      it('should return null config when file does not exist', async () => {
        const module = tryImportProjectHandlers()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        // tempDir exists but has no project.yaml
        const result = await module.readProjectConfig(tempDir)

        expect(result.config).toBeNull()
        expect(result.error).toBeUndefined() // Not an error, just no config
      })

      it('should return null config for non-existent directory', async () => {
        const module = tryImportProjectHandlers()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        const nonExistentPath = path.join(tempDir, 'non-existent-dir')
        const result = await module.readProjectConfig(nonExistentPath)

        expect(result.config).toBeNull()
      })
    })

    describe('error handling for malformed YAML', () => {
      it('should handle malformed YAML gracefully', async () => {
        const module = tryImportProjectHandlers()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        const projectYamlPath = path.join(tempDir, 'project.yaml')
        fs.writeFileSync(projectYamlPath, MALFORMED_YAML_CONTENT)

        const result = await module.readProjectConfig(tempDir)

        expect(result.config).toBeNull()
        expect(result.error).toBeDefined()
        expect(result.error).toContain('YAML') // Should mention YAML parsing error
      })

      it('should handle empty YAML file', async () => {
        const module = tryImportProjectHandlers()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        const projectYamlPath = path.join(tempDir, 'project.yaml')
        fs.writeFileSync(projectYamlPath, '')

        const result = await module.readProjectConfig(tempDir)

        expect(result.config).toBeNull()
        expect(result.error).toBeDefined()
      })

      it('should handle YAML with only comments', async () => {
        const module = tryImportProjectHandlers()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        const projectYamlPath = path.join(tempDir, 'project.yaml')
        fs.writeFileSync(projectYamlPath, '# Just a comment\n# Another comment')

        const result = await module.readProjectConfig(tempDir)

        expect(result.config).toBeNull()
        expect(result.error).toBeDefined()
      })

      it('should handle YAML missing required fields', async () => {
        const module = tryImportProjectHandlers()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        // Missing project.name which is required
        const invalidYaml = `version: "1.0"\nproject:\n  description: "No name field"`
        const projectYamlPath = path.join(tempDir, 'project.yaml')
        fs.writeFileSync(projectYamlPath, invalidYaml)

        const result = await module.readProjectConfig(tempDir)

        expect(result.config).toBeNull()
        expect(result.error).toBeDefined()
        expect(result.error).toContain('name') // Should mention missing name
      })
    })
  })

  // ==========================================================================
  // project:writeConfig Tests
  // ==========================================================================

  describe('project:writeConfig', () => {
    describe('writing valid YAML', () => {
      it('should write valid YAML to project.yaml', async () => {
        const module = tryImportProjectHandlers()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        const result = await module.writeProjectConfig(tempDir, VALID_PROJECT_CONFIG)

        expect(result.success).toBe(true)
        expect(result.error).toBeUndefined()

        // Verify file was written
        const projectYamlPath = path.join(tempDir, 'project.yaml')
        expect(fs.existsSync(projectYamlPath)).toBe(true)

        // Verify content can be read back
        const content = fs.readFileSync(projectYamlPath, 'utf-8')
        expect(content).toContain('test-project')
        expect(content).toContain('version')
      })

      it('should write properly formatted YAML', async () => {
        const module = tryImportProjectHandlers()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        await module.writeProjectConfig(tempDir, VALID_PROJECT_CONFIG)

        const projectYamlPath = path.join(tempDir, 'project.yaml')
        const content = fs.readFileSync(projectYamlPath, 'utf-8')

        // Should have proper YAML formatting
        expect(content).toContain('project:')
        expect(content).toContain('  name:')
        expect(content).toMatch(/version:\s*["']?1\.0["']?/)
      })

      it('should write minimal config', async () => {
        const module = tryImportProjectHandlers()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        const result = await module.writeProjectConfig(tempDir, MINIMAL_CONFIG)

        expect(result.success).toBe(true)

        const projectYamlPath = path.join(tempDir, 'project.yaml')
        const content = fs.readFileSync(projectYamlPath, 'utf-8')
        expect(content).toContain('minimal-project')
      })
    })

    describe('backup creation', () => {
      it('should create backup of existing file before overwrite', async () => {
        const module = tryImportProjectHandlers()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        // Setup: Create existing project.yaml
        const projectYamlPath = path.join(tempDir, 'project.yaml')
        const originalContent = 'version: "1.0"\nproject:\n  name: "original-project"'
        fs.writeFileSync(projectYamlPath, originalContent)

        // Write new config (should create backup)
        const result = await module.writeProjectConfig(tempDir, VALID_PROJECT_CONFIG)

        expect(result.success).toBe(true)
        expect(result.backupPath).toBeDefined()

        // Verify backup exists
        expect(fs.existsSync(result.backupPath!)).toBe(true)

        // Verify backup contains original content
        const backupContent = fs.readFileSync(result.backupPath!, 'utf-8')
        expect(backupContent).toContain('original-project')
      })

      it('should not create backup when no existing file', async () => {
        const module = tryImportProjectHandlers()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        const result = await module.writeProjectConfig(tempDir, VALID_PROJECT_CONFIG)

        expect(result.success).toBe(true)
        expect(result.backupPath).toBeUndefined()
      })
    })

    describe('config validation before write', () => {
      it('should validate config structure before writing', async () => {
        const module = tryImportProjectHandlers()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        // Invalid config: missing required project.name
        const invalidConfig = {
          version: '1.0',
          project: {
            description: 'Missing name field',
          },
        } as unknown as ProjectConfig

        const result = await module.writeProjectConfig(tempDir, invalidConfig)

        expect(result.success).toBe(false)
        expect(result.error).toBeDefined()
        expect(result.error).toContain('name')
      })

      it('should reject invalid version', async () => {
        const module = tryImportProjectHandlers()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        const invalidConfig: ProjectConfig = {
          version: '2.0', // Only 1.0 is valid
          project: {
            name: 'test-project',
          },
        }

        const result = await module.writeProjectConfig(tempDir, invalidConfig)

        expect(result.success).toBe(false)
        expect(result.error).toBeDefined()
        expect(result.error).toContain('version')
      })

      it('should reject invalid project name pattern', async () => {
        const module = tryImportProjectHandlers()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        const invalidConfig: ProjectConfig = {
          version: '1.0',
          project: {
            name: '123-invalid-start', // Must start with letter
          },
        }

        const result = await module.writeProjectConfig(tempDir, invalidConfig)

        expect(result.success).toBe(false)
        expect(result.error).toBeDefined()
        expect(result.error).toContain('name')
      })

      it('should reject project name exceeding max length', async () => {
        const module = tryImportProjectHandlers()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        const invalidConfig: ProjectConfig = {
          version: '1.0',
          project: {
            name: 'a'.repeat(101), // Max is 100 characters
          },
        }

        const result = await module.writeProjectConfig(tempDir, invalidConfig)

        expect(result.success).toBe(false)
        expect(result.error).toBeDefined()
      })
    })

    describe('error handling', () => {
      it('should handle write permission errors gracefully', async () => {
        const module = tryImportProjectHandlers()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        // Create read-only directory
        const readOnlyDir = path.join(tempDir, 'readonly')
        fs.mkdirSync(readOnlyDir)
        fs.chmodSync(readOnlyDir, 0o444)

        const result = await module.writeProjectConfig(readOnlyDir, VALID_PROJECT_CONFIG)

        expect(result.success).toBe(false)
        expect(result.error).toBeDefined()

        // Cleanup: restore permissions so temp cleanup works
        fs.chmodSync(readOnlyDir, 0o755)
      })

      it('should handle non-existent parent directory', async () => {
        const module = tryImportProjectHandlers()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        const nonExistentPath = path.join(tempDir, 'non', 'existent', 'path')
        const result = await module.writeProjectConfig(nonExistentPath, VALID_PROJECT_CONFIG)

        expect(result.success).toBe(false)
        expect(result.error).toBeDefined()
      })
    })
  })

  // ==========================================================================
  // project:createScaffold Tests
  // ==========================================================================

  describe('project:createScaffold', () => {
    describe('directory creation', () => {
      it('should create .claude/, .beads/, .design/ directories', async () => {
        const module = tryImportProjectHandlers()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        const result = await module.createProjectScaffold({
          projectPath: tempDir,
          projectName: 'test-project',
          createDesign: true,
        })

        expect(result.success).toBe(true)
        expect(result.createdPaths).toContain(path.join(tempDir, '.claude'))
        expect(result.createdPaths).toContain(path.join(tempDir, '.beads'))
        expect(result.createdPaths).toContain(path.join(tempDir, '.design'))

        // Verify directories exist
        expect(fs.existsSync(path.join(tempDir, '.claude'))).toBe(true)
        expect(fs.existsSync(path.join(tempDir, '.beads'))).toBe(true)
        expect(fs.existsSync(path.join(tempDir, '.design'))).toBe(true)
      })

      it('should create nested directories under .claude/', async () => {
        const module = tryImportProjectHandlers()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        const result = await module.createProjectScaffold({
          projectPath: tempDir,
          projectName: 'test-project',
        })

        expect(result.success).toBe(true)

        // Should create subdirectories
        expect(fs.existsSync(path.join(tempDir, '.claude', 'agents'))).toBe(true)
        expect(fs.existsSync(path.join(tempDir, '.claude', 'skills'))).toBe(true)
      })

      it('should skip .design/ when createDesign is false', async () => {
        const module = tryImportProjectHandlers()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        const result = await module.createProjectScaffold({
          projectPath: tempDir,
          projectName: 'test-project',
          createDesign: false,
        })

        expect(result.success).toBe(true)
        expect(fs.existsSync(path.join(tempDir, '.claude'))).toBe(true)
        expect(fs.existsSync(path.join(tempDir, '.beads'))).toBe(true)
        expect(fs.existsSync(path.join(tempDir, '.design'))).toBe(false)
      })
    })

    describe('skipping existing directories', () => {
      it('should skip existing directories', async () => {
        const module = tryImportProjectHandlers()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        // Pre-create .claude directory
        const existingClaudeDir = path.join(tempDir, '.claude')
        fs.mkdirSync(existingClaudeDir)
        fs.writeFileSync(path.join(existingClaudeDir, 'existing-file.txt'), 'do not delete')

        const result = await module.createProjectScaffold({
          projectPath: tempDir,
          projectName: 'test-project',
        })

        expect(result.success).toBe(true)
        expect(result.skippedPaths).toContain(existingClaudeDir)

        // Verify existing content preserved
        expect(fs.existsSync(path.join(existingClaudeDir, 'existing-file.txt'))).toBe(true)
      })

      it('should report which directories were skipped', async () => {
        const module = tryImportProjectHandlers()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        // Pre-create all directories
        fs.mkdirSync(path.join(tempDir, '.claude'))
        fs.mkdirSync(path.join(tempDir, '.beads'))
        fs.mkdirSync(path.join(tempDir, '.design'))

        const result = await module.createProjectScaffold({
          projectPath: tempDir,
          projectName: 'test-project',
          createDesign: true,
        })

        expect(result.success).toBe(true)
        expect(result.skippedPaths.length).toBe(3)
        expect(result.createdPaths.length).toBe(0)
      })
    })

    describe('template file copying with placeholder substitution', () => {
      it('should copy template files with placeholder substitution', async () => {
        const module = tryImportProjectHandlers()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        const result = await module.createProjectScaffold({
          projectPath: tempDir,
          projectName: 'MyTestProject',
          templateVars: {
            PROJECT_NAME: 'MyTestProject',
            DESCRIPTION: 'A test project',
          },
        })

        expect(result.success).toBe(true)

        // Check if CLAUDE.md or similar template file was created
        const claudeMdPath = path.join(tempDir, '.claude', 'CLAUDE.md')
        if (fs.existsSync(claudeMdPath)) {
          const content = fs.readFileSync(claudeMdPath, 'utf-8')
          // Should have substituted placeholder with actual project name
          expect(content).not.toContain('{{PROJECT_NAME}}')
          expect(content).toContain('MyTestProject')
        }
      })

      it('should handle missing template vars gracefully', async () => {
        const module = tryImportProjectHandlers()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        // Should not throw when templateVars is not provided
        const result = await module.createProjectScaffold({
          projectPath: tempDir,
          projectName: 'test-project',
        })

        expect(result.success).toBe(true)
      })
    })

    describe('return value - created paths list', () => {
      it('should return list of created paths', async () => {
        const module = tryImportProjectHandlers()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        const result = await module.createProjectScaffold({
          projectPath: tempDir,
          projectName: 'test-project',
          createDesign: true,
        })

        expect(result.success).toBe(true)
        expect(Array.isArray(result.createdPaths)).toBe(true)
        expect(result.createdPaths.length).toBeGreaterThan(0)

        // All paths should be absolute
        for (const createdPath of result.createdPaths) {
          expect(path.isAbsolute(createdPath)).toBe(true)
        }
      })

      it('should include all created directories and files in return', async () => {
        const module = tryImportProjectHandlers()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        const result = await module.createProjectScaffold({
          projectPath: tempDir,
          projectName: 'test-project',
        })

        expect(result.success).toBe(true)

        // Verify returned paths match actual created paths
        for (const createdPath of result.createdPaths) {
          expect(fs.existsSync(createdPath)).toBe(true)
        }
      })
    })

    describe('error handling', () => {
      it('should handle permission errors gracefully', async () => {
        const module = tryImportProjectHandlers()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        // Create read-only directory
        const readOnlyDir = path.join(tempDir, 'readonly')
        fs.mkdirSync(readOnlyDir)
        fs.chmodSync(readOnlyDir, 0o444)

        const result = await module.createProjectScaffold({
          projectPath: readOnlyDir,
          projectName: 'test-project',
        })

        expect(result.success).toBe(false)
        expect(result.error).toBeDefined()

        // Cleanup
        fs.chmodSync(readOnlyDir, 0o755)
      })

      it('should handle non-existent project path', async () => {
        const module = tryImportProjectHandlers()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        const nonExistentPath = path.join(tempDir, 'does', 'not', 'exist')
        const result = await module.createProjectScaffold({
          projectPath: nonExistentPath,
          projectName: 'test-project',
        })

        expect(result.success).toBe(false)
        expect(result.error).toBeDefined()
      })
    })
  })

  // ==========================================================================
  // validateProjectConfig Tests
  // ==========================================================================

  describe('validateProjectConfig', () => {
    it('should validate a correct config as valid', async () => {
      const module = tryImportProjectHandlers()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      const result = module.validateProjectConfig(VALID_PROJECT_CONFIG)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should return errors for missing version', async () => {
      const module = tryImportProjectHandlers()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      const invalidConfig = {
        project: { name: 'test' },
      }

      const result = module.validateProjectConfig(invalidConfig)

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors.some((e) => e.toLowerCase().includes('version'))).toBe(true)
    })

    it('should return errors for missing project', async () => {
      const module = tryImportProjectHandlers()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      const invalidConfig = {
        version: '1.0',
      }

      const result = module.validateProjectConfig(invalidConfig)

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors.some((e) => e.toLowerCase().includes('project'))).toBe(true)
    })

    it('should return errors for missing project.name', async () => {
      const module = tryImportProjectHandlers()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      const invalidConfig = {
        version: '1.0',
        project: {},
      }

      const result = module.validateProjectConfig(invalidConfig)

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors.some((e) => e.toLowerCase().includes('name'))).toBe(true)
    })

    it('should validate naming conventions enum values', async () => {
      const module = tryImportProjectHandlers()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      const invalidConfig = {
        version: '1.0',
        project: { name: 'test' },
        data_governance: {
          naming_conventions: {
            enums: 'INVALID_VALUE', // Not in allowed enum
          },
        },
      }

      const result = module.validateProjectConfig(invalidConfig)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.toLowerCase().includes('enum'))).toBe(true)
    })

    it('should validate custom agent structure', async () => {
      const module = tryImportProjectHandlers()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      const invalidConfig = {
        version: '1.0',
        project: { name: 'test' },
        agents: {
          custom: [
            {
              name: 'Agent Name',
              // Missing required label and prompt_file
            },
          ],
        },
      }

      const result = module.validateProjectConfig(invalidConfig)

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  // ==========================================================================
  // IPC Handler Registration Tests
  // ==========================================================================

  describe('registerProjectHandlers', () => {
    it('should register project:readConfig handler', async () => {
      const module = tryImportProjectHandlers()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      module.registerProjectHandlers()

      expect(mockIpcMain.handle).toHaveBeenCalledWith(
        'project:readConfig',
        expect.any(Function)
      )
    })

    it('should register project:writeConfig handler', async () => {
      const module = tryImportProjectHandlers()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      module.registerProjectHandlers()

      expect(mockIpcMain.handle).toHaveBeenCalledWith(
        'project:writeConfig',
        expect.any(Function)
      )
    })

    it('should register project:createScaffold handler', async () => {
      const module = tryImportProjectHandlers()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      module.registerProjectHandlers()

      expect(mockIpcMain.handle).toHaveBeenCalledWith(
        'project:createScaffold',
        expect.any(Function)
      )
    })
  })
})
