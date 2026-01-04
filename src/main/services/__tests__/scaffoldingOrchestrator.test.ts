/**
 * Scaffolding Orchestrator Service Tests - TDD RED Phase
 *
 * Tests for a scaffolding orchestrator that:
 * 1. Creates directories (.claude/, .beads/, .design/, docs/)
 * 2. Writes config files (project.yaml, CLAUDE.md)
 * 3. Runs bd init
 * 4. Emits progress events for each step
 *
 * NOTE: These tests are expected to FAIL because the service doesn't exist yet.
 * This is the TDD RED phase.
 *
 * When the scaffoldingOrchestrator service is implemented at:
 *   src/main/services/scaffoldingOrchestrator.ts
 *
 * These tests will guide the implementation to ensure:
 * 1. Module exports are correct
 * 2. Directory creation works as specified
 * 3. Config file generation is correct
 * 4. bd init execution is handled properly
 * 5. Progress events are emitted for each step
 * 6. Error handling and retry logic works
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import path from 'path'
import fs from 'fs'
import os from 'os'
import { EventEmitter } from 'events'

// ============================================================================
// Type Definitions for Scaffolding Orchestrator (to be implemented)
// ============================================================================

/** Progress event types */
export type ScaffoldingStep =
  | 'init'
  | 'create_claude_dir'
  | 'create_beads_dir'
  | 'create_design_dir'
  | 'create_docs_dir'
  | 'write_project_yaml'
  | 'write_claude_md'
  | 'run_bd_init'
  | 'complete'

/** Progress event payload */
export interface ProgressEvent {
  step: ScaffoldingStep
  status: 'started' | 'completed' | 'failed'
  message: string
  progress: number // 0-100
  error?: string
  details?: Record<string, unknown>
}

/** Scaffolding configuration */
export interface ScaffoldingConfig {
  projectPath: string
  projectName: string
  description?: string
  createDesign?: boolean
  createDocs?: boolean
  templateVars?: Record<string, string>
  skipBdInit?: boolean
  retryOnFailure?: boolean
  maxRetries?: number
}

/** Scaffolding result */
export interface ScaffoldingResult {
  success: boolean
  createdPaths: string[]
  skippedPaths: string[]
  failedPaths: string[]
  errors: string[]
  bdInitialized: boolean
}

/** Scaffolding orchestrator interface */
export interface IScaffoldingOrchestrator extends EventEmitter {
  run(config: ScaffoldingConfig): Promise<ScaffoldingResult>
  cancel(): void
  getProgress(): number
  isRunning(): boolean
}

// ============================================================================
// Mock Setup
// ============================================================================

// Mock child_process for bd init - using vi.hoisted for proper hoisting
const mockSpawn = vi.hoisted(() => vi.fn())

vi.mock('child_process', () => ({
  default: {
    spawn: mockSpawn,
  },
  spawn: mockSpawn,
}))

// Import the real scaffoldingOrchestrator module
// The module should be implemented at src/main/services/scaffoldingOrchestrator.ts
import * as scaffoldingOrchestratorModule from '../scaffoldingOrchestrator'

// Store reference to real module exports
const mockScaffoldingOrchestratorModule = {
  ScaffoldingOrchestrator: scaffoldingOrchestratorModule.ScaffoldingOrchestrator,
  scaffoldingOrchestrator: scaffoldingOrchestratorModule.scaffoldingOrchestrator,
  SCAFFOLDING_STEPS: scaffoldingOrchestratorModule.SCAFFOLDING_STEPS,
}

// ============================================================================
// Helper to check if module is properly implemented
// ============================================================================

interface ScaffoldingOrchestratorModule {
  ScaffoldingOrchestrator: new () => IScaffoldingOrchestrator
  scaffoldingOrchestrator: IScaffoldingOrchestrator
  SCAFFOLDING_STEPS: ScaffoldingStep[]
}

/**
 * Checks if the scaffolding orchestrator module is properly implemented.
 * Returns null if the module doesn't exist or exports are not properly defined.
 */
function getScaffoldingOrchestratorModule(): ScaffoldingOrchestratorModule | null {
  // Check if the mock has been replaced with real implementation
  const mod = mockScaffoldingOrchestratorModule

  if (
    mod.ScaffoldingOrchestrator === null ||
    mod.scaffoldingOrchestrator === null ||
    mod.SCAFFOLDING_STEPS === null
  ) {
    return null
  }

  return {
    ScaffoldingOrchestrator: mod.ScaffoldingOrchestrator as new () => IScaffoldingOrchestrator,
    scaffoldingOrchestrator: mod.scaffoldingOrchestrator as IScaffoldingOrchestrator,
    SCAFFOLDING_STEPS: mod.SCAFFOLDING_STEPS as ScaffoldingStep[],
  }
}

// ============================================================================
// Tests
// ============================================================================

describe('ScaffoldingOrchestrator', () => {
  let tempDir: string

  beforeEach(() => {
    vi.clearAllMocks()
    // Create a temp directory for test files
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scaffolding-orchestrator-test-'))

    // Setup mock spawn for bd init
    mockSpawn.mockImplementation(() => {
      const mockProc = new EventEmitter() as EventEmitter & {
        stdout: EventEmitter
        stderr: EventEmitter
      }
      mockProc.stdout = new EventEmitter()
      mockProc.stderr = new EventEmitter()

      // Simulate successful completion
      setTimeout(() => {
        mockProc.stdout.emit('data', 'Initialized beads in .beads/')
        mockProc.emit('close', mockExecResult.code)
      }, 10)

      return mockProc
    })
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
    it('should have scaffolding orchestrator module at src/main/services/scaffoldingOrchestrator.ts', () => {
      const module = getScaffoldingOrchestratorModule()

      // RED PHASE: This will fail because the module doesn't exist
      expect(module).not.toBeNull()
    })

    it('should export ScaffoldingOrchestrator class', () => {
      const module = getScaffoldingOrchestratorModule()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      expect(module.ScaffoldingOrchestrator).toBeDefined()
      expect(typeof module.ScaffoldingOrchestrator).toBe('function')
    })

    it('should export scaffoldingOrchestrator singleton instance', () => {
      const module = getScaffoldingOrchestratorModule()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      expect(module.scaffoldingOrchestrator).toBeDefined()
      expect(typeof module.scaffoldingOrchestrator).toBe('object')
    })

    it('should export SCAFFOLDING_STEPS constant', () => {
      const module = getScaffoldingOrchestratorModule()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      expect(module.SCAFFOLDING_STEPS).toBeDefined()
      expect(Array.isArray(module.SCAFFOLDING_STEPS)).toBe(true)
    })

    it('should be an EventEmitter', () => {
      const module = getScaffoldingOrchestratorModule()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      const orchestrator = new module.ScaffoldingOrchestrator()
      expect(orchestrator).toBeInstanceOf(EventEmitter)
    })
  })

  // ==========================================================================
  // Directory Creation Tests
  // ==========================================================================

  describe('Directory Creation', () => {
    it('should create .claude/ directory', async () => {
      const module = getScaffoldingOrchestratorModule()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      const orchestrator = new module.ScaffoldingOrchestrator()
      const result = await orchestrator.run({
        projectPath: tempDir,
        projectName: 'test-project',
      })

      expect(result.success).toBe(true)
      expect(fs.existsSync(path.join(tempDir, '.claude'))).toBe(true)
      expect(result.createdPaths).toContain(path.join(tempDir, '.claude'))
    })

    it('should create .beads/ directory', async () => {
      const module = getScaffoldingOrchestratorModule()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      const orchestrator = new module.ScaffoldingOrchestrator()
      const result = await orchestrator.run({
        projectPath: tempDir,
        projectName: 'test-project',
      })

      expect(result.success).toBe(true)
      expect(fs.existsSync(path.join(tempDir, '.beads'))).toBe(true)
      expect(result.createdPaths).toContain(path.join(tempDir, '.beads'))
    })

    it('should create .design/ directory when enabled', async () => {
      const module = getScaffoldingOrchestratorModule()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      const orchestrator = new module.ScaffoldingOrchestrator()
      const result = await orchestrator.run({
        projectPath: tempDir,
        projectName: 'test-project',
        createDesign: true,
      })

      expect(result.success).toBe(true)
      expect(fs.existsSync(path.join(tempDir, '.design'))).toBe(true)
      expect(result.createdPaths).toContain(path.join(tempDir, '.design'))
    })

    it('should skip .design/ directory when disabled', async () => {
      const module = getScaffoldingOrchestratorModule()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      const orchestrator = new module.ScaffoldingOrchestrator()
      const result = await orchestrator.run({
        projectPath: tempDir,
        projectName: 'test-project',
        createDesign: false,
      })

      expect(result.success).toBe(true)
      expect(fs.existsSync(path.join(tempDir, '.design'))).toBe(false)
      expect(result.skippedPaths).toContain(path.join(tempDir, '.design'))
    })

    it('should create docs/ directory when enabled', async () => {
      const module = getScaffoldingOrchestratorModule()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      const orchestrator = new module.ScaffoldingOrchestrator()
      const result = await orchestrator.run({
        projectPath: tempDir,
        projectName: 'test-project',
        createDocs: true,
      })

      expect(result.success).toBe(true)
      expect(fs.existsSync(path.join(tempDir, 'docs'))).toBe(true)
      expect(result.createdPaths).toContain(path.join(tempDir, 'docs'))
    })

    it('should create nested .claude/agents/ and .claude/skills/ directories', async () => {
      const module = getScaffoldingOrchestratorModule()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      const orchestrator = new module.ScaffoldingOrchestrator()
      const result = await orchestrator.run({
        projectPath: tempDir,
        projectName: 'test-project',
      })

      expect(result.success).toBe(true)
      expect(fs.existsSync(path.join(tempDir, '.claude', 'agents'))).toBe(true)
      expect(fs.existsSync(path.join(tempDir, '.claude', 'skills'))).toBe(true)
    })

    it('should skip existing directories without modifying them', async () => {
      const module = getScaffoldingOrchestratorModule()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      // Pre-create .claude directory with content
      const existingClaudeDir = path.join(tempDir, '.claude')
      fs.mkdirSync(existingClaudeDir)
      fs.writeFileSync(path.join(existingClaudeDir, 'existing-file.txt'), 'do not delete')

      const orchestrator = new module.ScaffoldingOrchestrator()
      const result = await orchestrator.run({
        projectPath: tempDir,
        projectName: 'test-project',
      })

      expect(result.success).toBe(true)
      expect(result.skippedPaths).toContain(existingClaudeDir)
      // Verify existing content preserved
      expect(fs.existsSync(path.join(existingClaudeDir, 'existing-file.txt'))).toBe(true)
      const content = fs.readFileSync(path.join(existingClaudeDir, 'existing-file.txt'), 'utf-8')
      expect(content).toBe('do not delete')
    })
  })

  // ==========================================================================
  // Config File Generation Tests
  // ==========================================================================

  describe('Config File Generation', () => {
    it('should write project.yaml file', async () => {
      const module = getScaffoldingOrchestratorModule()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      const orchestrator = new module.ScaffoldingOrchestrator()
      const result = await orchestrator.run({
        projectPath: tempDir,
        projectName: 'test-project',
        description: 'A test project',
      })

      expect(result.success).toBe(true)
      const projectYamlPath = path.join(tempDir, 'project.yaml')
      expect(fs.existsSync(projectYamlPath)).toBe(true)

      const content = fs.readFileSync(projectYamlPath, 'utf-8')
      expect(content).toContain('test-project')
      expect(content).toContain('version')
    })

    it('should write project.yaml with correct project name', async () => {
      const module = getScaffoldingOrchestratorModule()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      const orchestrator = new module.ScaffoldingOrchestrator()
      await orchestrator.run({
        projectPath: tempDir,
        projectName: 'my-awesome-project',
        description: 'An awesome project',
      })

      const projectYamlPath = path.join(tempDir, 'project.yaml')
      const content = fs.readFileSync(projectYamlPath, 'utf-8')
      expect(content).toContain('my-awesome-project')
      expect(content).toContain('An awesome project')
    })

    it('should write CLAUDE.md file in .claude/ directory', async () => {
      const module = getScaffoldingOrchestratorModule()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      const orchestrator = new module.ScaffoldingOrchestrator()
      const result = await orchestrator.run({
        projectPath: tempDir,
        projectName: 'test-project',
      })

      expect(result.success).toBe(true)
      const claudeMdPath = path.join(tempDir, '.claude', 'CLAUDE.md')
      expect(fs.existsSync(claudeMdPath)).toBe(true)
    })

    it('should substitute template variables in CLAUDE.md', async () => {
      const module = getScaffoldingOrchestratorModule()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      const orchestrator = new module.ScaffoldingOrchestrator()
      await orchestrator.run({
        projectPath: tempDir,
        projectName: 'MyProject',
        templateVars: {
          PROJECT_NAME: 'MyProject',
          DESCRIPTION: 'Custom description',
        },
      })

      const claudeMdPath = path.join(tempDir, '.claude', 'CLAUDE.md')
      const content = fs.readFileSync(claudeMdPath, 'utf-8')
      expect(content).toContain('MyProject')
      expect(content).not.toContain('{{PROJECT_NAME}}')
    })

    it('should not overwrite existing project.yaml', async () => {
      const module = getScaffoldingOrchestratorModule()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      // Pre-create project.yaml
      const existingContent = 'version: "1.0"\nproject:\n  name: "existing-project"'
      fs.writeFileSync(path.join(tempDir, 'project.yaml'), existingContent)

      const orchestrator = new module.ScaffoldingOrchestrator()
      const result = await orchestrator.run({
        projectPath: tempDir,
        projectName: 'test-project',
      })

      expect(result.success).toBe(true)
      expect(result.skippedPaths).toContain(path.join(tempDir, 'project.yaml'))

      // Verify original content preserved
      const content = fs.readFileSync(path.join(tempDir, 'project.yaml'), 'utf-8')
      expect(content).toContain('existing-project')
    })
  })

  // ==========================================================================
  // bd init Execution Tests
  // ==========================================================================

  describe('bd init Execution', () => {
    it('should run bd init command', async () => {
      const module = getScaffoldingOrchestratorModule()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      const orchestrator = new module.ScaffoldingOrchestrator()
      const result = await orchestrator.run({
        projectPath: tempDir,
        projectName: 'test-project',
      })

      expect(result.success).toBe(true)
      expect(result.bdInitialized).toBe(true)
      expect(mockSpawn).toHaveBeenCalledWith(
        'bd',
        ['init'],
        expect.objectContaining({ cwd: tempDir })
      )
    })

    it('should skip bd init when skipBdInit is true', async () => {
      const module = getScaffoldingOrchestratorModule()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      const orchestrator = new module.ScaffoldingOrchestrator()
      const result = await orchestrator.run({
        projectPath: tempDir,
        projectName: 'test-project',
        skipBdInit: true,
      })

      expect(result.success).toBe(true)
      expect(result.bdInitialized).toBe(false)
      expect(mockSpawn).not.toHaveBeenCalled()
    })

    it('should skip bd init if .beads/ already exists', async () => {
      const module = getScaffoldingOrchestratorModule()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      // Pre-create .beads directory
      fs.mkdirSync(path.join(tempDir, '.beads'))

      const orchestrator = new module.ScaffoldingOrchestrator()
      const result = await orchestrator.run({
        projectPath: tempDir,
        projectName: 'test-project',
      })

      expect(result.success).toBe(true)
      expect(result.bdInitialized).toBe(false)
    })

    it('should handle bd init failure gracefully', async () => {
      const module = getScaffoldingOrchestratorModule()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      // Mock bd init failure
      mockSpawn.mockImplementationOnce(() => {
        const mockProc = new EventEmitter() as EventEmitter & {
          stdout: EventEmitter
          stderr: EventEmitter
        }
        mockProc.stdout = new EventEmitter()
        mockProc.stderr = new EventEmitter()

        setTimeout(() => {
          mockProc.stderr.emit('data', 'bd: command not found')
          mockProc.emit('close', 1)
        }, 10)

        return mockProc
      })

      const orchestrator = new module.ScaffoldingOrchestrator()
      const result = await orchestrator.run({
        projectPath: tempDir,
        projectName: 'test-project',
      })

      // Scaffolding should still succeed even if bd init fails
      expect(result.success).toBe(true)
      expect(result.bdInitialized).toBe(false)
      expect(result.errors).toContain(expect.stringContaining('bd'))
    })
  })

  // ==========================================================================
  // Progress Event Emission Tests
  // ==========================================================================

  describe('Progress Event Emission', () => {
    it('should emit "progress" events during execution', async () => {
      const module = getScaffoldingOrchestratorModule()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      const progressEvents: ProgressEvent[] = []
      const orchestrator = new module.ScaffoldingOrchestrator()

      orchestrator.on('progress', (event: ProgressEvent) => {
        progressEvents.push(event)
      })

      await orchestrator.run({
        projectPath: tempDir,
        projectName: 'test-project',
      })

      expect(progressEvents.length).toBeGreaterThan(0)
    })

    it('should emit "init" progress event at start', async () => {
      const module = getScaffoldingOrchestratorModule()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      const progressEvents: ProgressEvent[] = []
      const orchestrator = new module.ScaffoldingOrchestrator()

      orchestrator.on('progress', (event: ProgressEvent) => {
        progressEvents.push(event)
      })

      await orchestrator.run({
        projectPath: tempDir,
        projectName: 'test-project',
      })

      const initEvent = progressEvents.find((e) => e.step === 'init')
      expect(initEvent).toBeDefined()
      expect(initEvent?.status).toBe('started')
      expect(initEvent?.progress).toBe(0)
    })

    it('should emit "complete" progress event at end', async () => {
      const module = getScaffoldingOrchestratorModule()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      const progressEvents: ProgressEvent[] = []
      const orchestrator = new module.ScaffoldingOrchestrator()

      orchestrator.on('progress', (event: ProgressEvent) => {
        progressEvents.push(event)
      })

      await orchestrator.run({
        projectPath: tempDir,
        projectName: 'test-project',
      })

      const completeEvent = progressEvents.find((e) => e.step === 'complete')
      expect(completeEvent).toBeDefined()
      expect(completeEvent?.status).toBe('completed')
      expect(completeEvent?.progress).toBe(100)
    })

    it('should emit progress events for each directory creation step', async () => {
      const module = getScaffoldingOrchestratorModule()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      const progressEvents: ProgressEvent[] = []
      const orchestrator = new module.ScaffoldingOrchestrator()

      orchestrator.on('progress', (event: ProgressEvent) => {
        progressEvents.push(event)
      })

      await orchestrator.run({
        projectPath: tempDir,
        projectName: 'test-project',
        createDesign: true,
        createDocs: true,
      })

      const dirSteps: ScaffoldingStep[] = [
        'create_claude_dir',
        'create_beads_dir',
        'create_design_dir',
        'create_docs_dir',
      ]

      dirSteps.forEach((step) => {
        const stepEvents = progressEvents.filter((e) => e.step === step)
        expect(stepEvents.length).toBeGreaterThan(0)
        // Should have at least started and completed events
        expect(stepEvents.some((e) => e.status === 'started')).toBe(true)
        expect(stepEvents.some((e) => e.status === 'completed')).toBe(true)
      })
    })

    it('should emit progress events for config file writing', async () => {
      const module = getScaffoldingOrchestratorModule()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      const progressEvents: ProgressEvent[] = []
      const orchestrator = new module.ScaffoldingOrchestrator()

      orchestrator.on('progress', (event: ProgressEvent) => {
        progressEvents.push(event)
      })

      await orchestrator.run({
        projectPath: tempDir,
        projectName: 'test-project',
      })

      const configSteps: ScaffoldingStep[] = ['write_project_yaml', 'write_claude_md']

      configSteps.forEach((step) => {
        const stepEvents = progressEvents.filter((e) => e.step === step)
        expect(stepEvents.length).toBeGreaterThan(0)
      })
    })

    it('should emit progress event for bd init step', async () => {
      const module = getScaffoldingOrchestratorModule()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      const progressEvents: ProgressEvent[] = []
      const orchestrator = new module.ScaffoldingOrchestrator()

      orchestrator.on('progress', (event: ProgressEvent) => {
        progressEvents.push(event)
      })

      await orchestrator.run({
        projectPath: tempDir,
        projectName: 'test-project',
      })

      const bdInitEvents = progressEvents.filter((e) => e.step === 'run_bd_init')
      expect(bdInitEvents.length).toBeGreaterThan(0)
    })

    it('should emit "failed" status on step failure', async () => {
      const module = getScaffoldingOrchestratorModule()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      // Create read-only directory to cause failure
      const readOnlyDir = path.join(tempDir, 'readonly')
      fs.mkdirSync(readOnlyDir)
      fs.chmodSync(readOnlyDir, 0o444)

      const progressEvents: ProgressEvent[] = []
      const orchestrator = new module.ScaffoldingOrchestrator()

      orchestrator.on('progress', (event: ProgressEvent) => {
        progressEvents.push(event)
      })

      await orchestrator.run({
        projectPath: readOnlyDir,
        projectName: 'test-project',
      })

      const failedEvent = progressEvents.find((e) => e.status === 'failed')
      expect(failedEvent).toBeDefined()
      expect(failedEvent?.error).toBeDefined()

      // Cleanup
      fs.chmodSync(readOnlyDir, 0o755)
    })

    it('should have monotonically increasing progress values', async () => {
      const module = getScaffoldingOrchestratorModule()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      const progressEvents: ProgressEvent[] = []
      const orchestrator = new module.ScaffoldingOrchestrator()

      orchestrator.on('progress', (event: ProgressEvent) => {
        progressEvents.push(event)
      })

      await orchestrator.run({
        projectPath: tempDir,
        projectName: 'test-project',
      })

      // Progress should be monotonically increasing
      let lastProgress = -1
      for (const event of progressEvents) {
        expect(event.progress).toBeGreaterThanOrEqual(lastProgress)
        lastProgress = event.progress
      }
    })

    it('should include step details in progress events', async () => {
      const module = getScaffoldingOrchestratorModule()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      const progressEvents: ProgressEvent[] = []
      const orchestrator = new module.ScaffoldingOrchestrator()

      orchestrator.on('progress', (event: ProgressEvent) => {
        progressEvents.push(event)
      })

      await orchestrator.run({
        projectPath: tempDir,
        projectName: 'test-project',
      })

      // At least some events should have details
      const eventsWithDetails = progressEvents.filter((e) => e.details !== undefined)
      expect(eventsWithDetails.length).toBeGreaterThan(0)
    })
  })

  // ==========================================================================
  // Error Handling and Retry Logic Tests
  // ==========================================================================

  describe('Error Handling and Retry Logic', () => {
    it('should handle permission errors gracefully', async () => {
      const module = getScaffoldingOrchestratorModule()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      // Create read-only directory
      const readOnlyDir = path.join(tempDir, 'readonly')
      fs.mkdirSync(readOnlyDir)
      fs.chmodSync(readOnlyDir, 0o444)

      const orchestrator = new module.ScaffoldingOrchestrator()
      const result = await orchestrator.run({
        projectPath: readOnlyDir,
        projectName: 'test-project',
      })

      expect(result.success).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.failedPaths.length).toBeGreaterThan(0)

      // Cleanup
      fs.chmodSync(readOnlyDir, 0o755)
    })

    it('should handle non-existent project path', async () => {
      const module = getScaffoldingOrchestratorModule()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      const nonExistentPath = path.join(tempDir, 'does', 'not', 'exist')

      const orchestrator = new module.ScaffoldingOrchestrator()
      const result = await orchestrator.run({
        projectPath: nonExistentPath,
        projectName: 'test-project',
      })

      expect(result.success).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should retry on transient failures when enabled', async () => {
      const module = getScaffoldingOrchestratorModule()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      let callCount = 0

      // Mock a transient failure that succeeds on retry
      mockSpawn.mockImplementation(() => {
        callCount++
        const mockProc = new EventEmitter() as EventEmitter & {
          stdout: EventEmitter
          stderr: EventEmitter
        }
        mockProc.stdout = new EventEmitter()
        mockProc.stderr = new EventEmitter()

        setTimeout(() => {
          if (callCount < 2) {
            // Fail first time
            mockProc.stderr.emit('data', 'Transient error')
            mockProc.emit('close', 1)
          } else {
            // Succeed on retry
            mockProc.stdout.emit('data', 'Initialized beads')
            mockProc.emit('close', 0)
          }
        }, 10)

        return mockProc
      })

      const orchestrator = new module.ScaffoldingOrchestrator()
      const result = await orchestrator.run({
        projectPath: tempDir,
        projectName: 'test-project',
        retryOnFailure: true,
        maxRetries: 3,
      })

      expect(result.success).toBe(true)
      expect(result.bdInitialized).toBe(true)
      expect(callCount).toBe(2)
    })

    it('should respect maxRetries limit', async () => {
      const module = getScaffoldingOrchestratorModule()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      let callCount = 0

      // Mock persistent failure
      mockSpawn.mockImplementation(() => {
        callCount++
        const mockProc = new EventEmitter() as EventEmitter & {
          stdout: EventEmitter
          stderr: EventEmitter
        }
        mockProc.stdout = new EventEmitter()
        mockProc.stderr = new EventEmitter()

        setTimeout(() => {
          mockProc.stderr.emit('data', 'Persistent error')
          mockProc.emit('close', 1)
        }, 10)

        return mockProc
      })

      const orchestrator = new module.ScaffoldingOrchestrator()
      const result = await orchestrator.run({
        projectPath: tempDir,
        projectName: 'test-project',
        retryOnFailure: true,
        maxRetries: 2,
      })

      expect(result.bdInitialized).toBe(false)
      expect(callCount).toBe(2) // Initial + 1 retry = 2 calls max
    })

    it('should collect all errors during execution', async () => {
      const module = getScaffoldingOrchestratorModule()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      // Create a complex failure scenario
      const readOnlyDir = path.join(tempDir, 'readonly')
      fs.mkdirSync(readOnlyDir)
      fs.chmodSync(readOnlyDir, 0o444)

      const orchestrator = new module.ScaffoldingOrchestrator()
      const result = await orchestrator.run({
        projectPath: readOnlyDir,
        projectName: 'test-project',
        createDesign: true,
        createDocs: true,
      })

      expect(result.success).toBe(false)
      expect(Array.isArray(result.errors)).toBe(true)
      // Should have multiple errors for multiple failed operations
      expect(result.errors.length).toBeGreaterThan(0)

      // Cleanup
      fs.chmodSync(readOnlyDir, 0o755)
    })

    it('should not throw exceptions - always return result', async () => {
      const module = getScaffoldingOrchestratorModule()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      const orchestrator = new module.ScaffoldingOrchestrator()

      // Should not throw even with invalid input
      const promise = orchestrator.run({
        projectPath: '/invalid/path/that/does/not/exist',
        projectName: 'test',
      })

      await expect(promise).resolves.toBeDefined()
      const result = await promise
      expect(result.success).toBe(false)
    })
  })

  // ==========================================================================
  // Cancellation Tests
  // ==========================================================================

  describe('Cancellation', () => {
    it('should support cancellation via cancel() method', () => {
      const module = getScaffoldingOrchestratorModule()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      const orchestrator = new module.ScaffoldingOrchestrator()

      expect(typeof orchestrator.cancel).toBe('function')
    })

    it('should stop execution when cancel() is called', async () => {
      const module = getScaffoldingOrchestratorModule()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      const progressEvents: ProgressEvent[] = []
      const orchestrator = new module.ScaffoldingOrchestrator()

      orchestrator.on('progress', (event: ProgressEvent) => {
        progressEvents.push(event)
        // Cancel after first progress event
        if (progressEvents.length === 2) {
          orchestrator.cancel()
        }
      })

      const result = await orchestrator.run({
        projectPath: tempDir,
        projectName: 'test-project',
      })

      // Should not have reached completion
      expect(result.success).toBe(false)
      // Should have a cancellation error
      expect(result.errors.some((e) => e.toLowerCase().includes('cancel'))).toBe(true)
    })

    it('should report isRunning() status correctly', async () => {
      const module = getScaffoldingOrchestratorModule()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      const orchestrator = new module.ScaffoldingOrchestrator()

      expect(orchestrator.isRunning()).toBe(false)

      let wasRunning = false
      orchestrator.on('progress', () => {
        if (orchestrator.isRunning()) {
          wasRunning = true
        }
      })

      await orchestrator.run({
        projectPath: tempDir,
        projectName: 'test-project',
      })

      expect(wasRunning).toBe(true)
      expect(orchestrator.isRunning()).toBe(false)
    })
  })

  // ==========================================================================
  // Progress Tracking Tests
  // ==========================================================================

  describe('Progress Tracking', () => {
    it('should report progress via getProgress() method', async () => {
      const module = getScaffoldingOrchestratorModule()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      const orchestrator = new module.ScaffoldingOrchestrator()

      expect(typeof orchestrator.getProgress).toBe('function')
      expect(orchestrator.getProgress()).toBe(0)

      let maxProgress = 0
      orchestrator.on('progress', () => {
        const current = orchestrator.getProgress()
        if (current > maxProgress) {
          maxProgress = current
        }
      })

      await orchestrator.run({
        projectPath: tempDir,
        projectName: 'test-project',
      })

      expect(maxProgress).toBe(100)
      expect(orchestrator.getProgress()).toBe(100)
    })
  })

  // ==========================================================================
  // SCAFFOLDING_STEPS Constant Tests
  // ==========================================================================

  describe('SCAFFOLDING_STEPS Constant', () => {
    it('should include all expected steps', () => {
      const module = getScaffoldingOrchestratorModule()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      const expectedSteps: ScaffoldingStep[] = [
        'init',
        'create_claude_dir',
        'create_beads_dir',
        'create_design_dir',
        'create_docs_dir',
        'write_project_yaml',
        'write_claude_md',
        'run_bd_init',
        'complete',
      ]

      expectedSteps.forEach((step) => {
        expect(module.SCAFFOLDING_STEPS).toContain(step)
      })
    })

    it('should have steps in correct order', () => {
      const module = getScaffoldingOrchestratorModule()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      // First step should be init
      expect(module.SCAFFOLDING_STEPS[0]).toBe('init')
      // Last step should be complete
      expect(module.SCAFFOLDING_STEPS[module.SCAFFOLDING_STEPS.length - 1]).toBe('complete')
    })
  })
})
