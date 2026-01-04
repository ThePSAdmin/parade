/**
 * Scaffolding Orchestrator Service
 *
 * Main process service that orchestrates the full project setup with progress events.
 * Creates directories, writes config files, runs bd init, and emits progress events.
 */

import { EventEmitter } from 'events'
import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'

// ============================================================================
// Type Definitions
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
// Constants
// ============================================================================

/** All scaffolding steps in order */
export const SCAFFOLDING_STEPS: ScaffoldingStep[] = [
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

// Step weights for progress calculation
const STEP_WEIGHTS: Record<ScaffoldingStep, number> = {
  init: 5,
  create_claude_dir: 10,
  create_beads_dir: 10,
  create_design_dir: 10,
  create_docs_dir: 10,
  write_project_yaml: 15,
  write_claude_md: 15,
  run_bd_init: 20,
  complete: 5,
}

// ============================================================================
// Templates
// ============================================================================

function generateProjectYaml(projectName: string, description?: string): string {
  return `# Project configuration
version: "1.0"

project:
  name: "${projectName}"
  description: "${description || `${projectName} project`}"

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

function generateClaudeMd(projectName: string, templateVars?: Record<string, string>): string {
  let content = `# ${projectName} - Claude Code Configuration

---

## Project Overview

This project uses Parade for workflow orchestration.

---

## Stack

- **Language**: TypeScript
- **Testing**: \`npm run test\`
- **Build**: \`npm run build\`

---

## Guidelines

1. Follow the established code patterns
2. Write tests for new functionality
3. Use meaningful commit messages

---

## File Structure

- \`.claude/\` - Claude configuration and agents
- \`.beads/\` - Task and issue management
- \`src/\` - Source code

---
`

  // Apply template variable substitutions
  if (templateVars) {
    for (const [key, value] of Object.entries(templateVars)) {
      content = content.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
    }
  }

  return content
}

// ============================================================================
// ScaffoldingOrchestrator Class
// ============================================================================

export class ScaffoldingOrchestrator extends EventEmitter implements IScaffoldingOrchestrator {
  private _isRunning = false
  private _isCancelled = false
  private _currentProgress = 0
  private _completedSteps: ScaffoldingStep[] = []

  constructor() {
    super()
  }

  /**
   * Runs the scaffolding process with the given configuration.
   */
  async run(config: ScaffoldingConfig): Promise<ScaffoldingResult> {
    // Reset state
    this._isRunning = true
    this._isCancelled = false
    this._currentProgress = 0
    this._completedSteps = []

    const result: ScaffoldingResult = {
      success: false,
      createdPaths: [],
      skippedPaths: [],
      failedPaths: [],
      errors: [],
      bdInitialized: false,
    }

    try {
      // Validate project path exists
      if (!fs.existsSync(config.projectPath)) {
        result.errors.push(`Project path does not exist: ${config.projectPath}`)
        this.emitProgress('init', 'failed', 'Project path does not exist', 0, result.errors[0])
        this._isRunning = false
        return result
      }

      // Emit init started
      this.emitProgress('init', 'started', 'Starting project scaffolding', 0)

      if (this._isCancelled) {
        return this.handleCancellation(result)
      }

      // Create .claude directory
      await this.createDirectory(
        config,
        result,
        '.claude',
        'create_claude_dir',
        true // Also create subdirectories
      )

      if (this._isCancelled) {
        return this.handleCancellation(result)
      }

      // Create .beads directory
      await this.createDirectory(config, result, '.beads', 'create_beads_dir')

      if (this._isCancelled) {
        return this.handleCancellation(result)
      }

      // Create .design directory (optional)
      if (config.createDesign !== false) {
        await this.createDirectory(config, result, '.design', 'create_design_dir')
      } else {
        const designPath = path.join(config.projectPath, '.design')
        result.skippedPaths.push(designPath)
        this.emitProgress(
          'create_design_dir',
          'completed',
          'Skipped .design directory (disabled)',
          this.calculateProgress('create_design_dir'),
          undefined,
          { skipped: true }
        )
      }

      if (this._isCancelled) {
        return this.handleCancellation(result)
      }

      // Create docs directory (optional)
      if (config.createDocs === true) {
        await this.createDirectory(config, result, 'docs', 'create_docs_dir')
      } else {
        const docsPath = path.join(config.projectPath, 'docs')
        result.skippedPaths.push(docsPath)
        this.emitProgress(
          'create_docs_dir',
          'completed',
          'Skipped docs directory (disabled)',
          this.calculateProgress('create_docs_dir'),
          undefined,
          { skipped: true }
        )
      }

      if (this._isCancelled) {
        return this.handleCancellation(result)
      }

      // Write project.yaml
      await this.writeProjectYaml(config, result)

      if (this._isCancelled) {
        return this.handleCancellation(result)
      }

      // Write CLAUDE.md
      await this.writeClaudeMd(config, result)

      if (this._isCancelled) {
        return this.handleCancellation(result)
      }

      // Run bd init
      await this.runBdInit(config, result)

      // Emit completion
      this._currentProgress = 100
      this.emitProgress('complete', 'completed', 'Project scaffolding complete', 100, undefined, {
        created: result.createdPaths.length,
        skipped: result.skippedPaths.length,
        failed: result.failedPaths.length,
      })

      // Determine overall success
      result.success = result.failedPaths.length === 0

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      result.errors.push(errorMessage)
      result.success = false
    } finally {
      this._isRunning = false
    }

    return result
  }

  /**
   * Cancels the current scaffolding operation.
   */
  cancel(): void {
    this._isCancelled = true
  }

  /**
   * Returns the current progress percentage.
   */
  getProgress(): number {
    return this._currentProgress
  }

  /**
   * Returns whether a scaffolding operation is currently running.
   */
  isRunning(): boolean {
    return this._isRunning
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  private emitProgress(
    step: ScaffoldingStep,
    status: 'started' | 'completed' | 'failed',
    message: string,
    progress: number,
    error?: string,
    details?: Record<string, unknown>
  ): void {
    this._currentProgress = progress

    const event: ProgressEvent = {
      step,
      status,
      message,
      progress,
      error,
      details,
    }

    this.emit('progress', event)
  }

  private calculateProgress(completedStep: ScaffoldingStep): number {
    let totalWeight = 0
    let completedWeight = 0

    for (const step of SCAFFOLDING_STEPS) {
      totalWeight += STEP_WEIGHTS[step]
      if (this._completedSteps.includes(step) || step === completedStep) {
        completedWeight += STEP_WEIGHTS[step]
      }
    }

    if (!this._completedSteps.includes(completedStep)) {
      this._completedSteps.push(completedStep)
    }

    return Math.round((completedWeight / totalWeight) * 100)
  }

  private async createDirectory(
    config: ScaffoldingConfig,
    result: ScaffoldingResult,
    dirName: string,
    step: ScaffoldingStep,
    createSubdirs = false
  ): Promise<void> {
    const dirPath = path.join(config.projectPath, dirName)

    this.emitProgress(step, 'started', `Creating ${dirName} directory`, this._currentProgress)

    try {
      // Check if directory already exists
      if (fs.existsSync(dirPath)) {
        result.skippedPaths.push(dirPath)
        this.emitProgress(
          step,
          'completed',
          `${dirName} directory already exists`,
          this.calculateProgress(step),
          undefined,
          { path: dirPath, existed: true }
        )
        return
      }

      // Create the directory
      fs.mkdirSync(dirPath, { recursive: true })
      result.createdPaths.push(dirPath)

      // Create subdirectories for .claude
      if (createSubdirs && dirName === '.claude') {
        const agentsPath = path.join(dirPath, 'agents')
        const skillsPath = path.join(dirPath, 'skills')

        if (!fs.existsSync(agentsPath)) {
          fs.mkdirSync(agentsPath, { recursive: true })
          result.createdPaths.push(agentsPath)
        }

        if (!fs.existsSync(skillsPath)) {
          fs.mkdirSync(skillsPath, { recursive: true })
          result.createdPaths.push(skillsPath)
        }
      }

      this.emitProgress(
        step,
        'completed',
        `Created ${dirName} directory`,
        this.calculateProgress(step),
        undefined,
        { path: dirPath }
      )
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      result.failedPaths.push(dirPath)
      result.errors.push(`Failed to create ${dirName}: ${errorMessage}`)
      this.emitProgress(step, 'failed', `Failed to create ${dirName}`, this._currentProgress, errorMessage)
    }
  }

  private async writeProjectYaml(config: ScaffoldingConfig, result: ScaffoldingResult): Promise<void> {
    const filePath = path.join(config.projectPath, 'project.yaml')

    this.emitProgress('write_project_yaml', 'started', 'Writing project.yaml', this._currentProgress)

    try {
      // Check if file already exists
      if (fs.existsSync(filePath)) {
        result.skippedPaths.push(filePath)
        this.emitProgress(
          'write_project_yaml',
          'completed',
          'project.yaml already exists',
          this.calculateProgress('write_project_yaml'),
          undefined,
          { path: filePath, existed: true }
        )
        return
      }

      // Generate and write the file
      const content = generateProjectYaml(config.projectName, config.description)
      fs.writeFileSync(filePath, content, 'utf-8')
      result.createdPaths.push(filePath)

      this.emitProgress(
        'write_project_yaml',
        'completed',
        'Created project.yaml',
        this.calculateProgress('write_project_yaml'),
        undefined,
        { path: filePath }
      )
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      result.failedPaths.push(filePath)
      result.errors.push(`Failed to write project.yaml: ${errorMessage}`)
      this.emitProgress(
        'write_project_yaml',
        'failed',
        'Failed to write project.yaml',
        this._currentProgress,
        errorMessage
      )
    }
  }

  private async writeClaudeMd(config: ScaffoldingConfig, result: ScaffoldingResult): Promise<void> {
    const filePath = path.join(config.projectPath, '.claude', 'CLAUDE.md')

    this.emitProgress('write_claude_md', 'started', 'Writing CLAUDE.md', this._currentProgress)

    try {
      // Ensure .claude directory exists
      const claudeDir = path.join(config.projectPath, '.claude')
      if (!fs.existsSync(claudeDir)) {
        fs.mkdirSync(claudeDir, { recursive: true })
      }

      // Check if file already exists
      if (fs.existsSync(filePath)) {
        result.skippedPaths.push(filePath)
        this.emitProgress(
          'write_claude_md',
          'completed',
          'CLAUDE.md already exists',
          this.calculateProgress('write_claude_md'),
          undefined,
          { path: filePath, existed: true }
        )
        return
      }

      // Generate and write the file
      const content = generateClaudeMd(config.projectName, config.templateVars)
      fs.writeFileSync(filePath, content, 'utf-8')
      result.createdPaths.push(filePath)

      this.emitProgress(
        'write_claude_md',
        'completed',
        'Created CLAUDE.md',
        this.calculateProgress('write_claude_md'),
        undefined,
        { path: filePath }
      )
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      result.failedPaths.push(filePath)
      result.errors.push(`Failed to write CLAUDE.md: ${errorMessage}`)
      this.emitProgress(
        'write_claude_md',
        'failed',
        'Failed to write CLAUDE.md',
        this._currentProgress,
        errorMessage
      )
    }
  }

  private async runBdInit(config: ScaffoldingConfig, result: ScaffoldingResult): Promise<void> {
    const beadsPath = path.join(config.projectPath, '.beads')

    // Skip if explicitly disabled
    if (config.skipBdInit) {
      this.emitProgress(
        'run_bd_init',
        'completed',
        'Skipped bd init (disabled)',
        this.calculateProgress('run_bd_init'),
        undefined,
        { skipped: true }
      )
      return
    }

    // Skip if .beads directory already exists (likely already initialized)
    if (fs.existsSync(beadsPath) && fs.readdirSync(beadsPath).length > 0) {
      result.bdInitialized = false
      this.emitProgress(
        'run_bd_init',
        'completed',
        'Skipped bd init (.beads already exists)',
        this.calculateProgress('run_bd_init'),
        undefined,
        { skipped: true, reason: 'already_exists' }
      )
      return
    }

    this.emitProgress('run_bd_init', 'started', 'Running bd init', this._currentProgress)

    const maxRetries = config.retryOnFailure ? (config.maxRetries || 1) : 1
    let lastError = ''

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const success = await this.executeBdInit(config.projectPath)

        if (success) {
          result.bdInitialized = true
          this.emitProgress(
            'run_bd_init',
            'completed',
            'bd init completed successfully',
            this.calculateProgress('run_bd_init'),
            undefined,
            { attempt: attempt + 1 }
          )
          return
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error)

        // If this is not the last attempt and retry is enabled, continue
        if (attempt < maxRetries - 1 && config.retryOnFailure) {
          continue
        }
      }
    }

    // bd init failed, but scaffolding can still succeed
    result.bdInitialized = false
    result.errors.push(`bd init failed: ${lastError}`)
    this.emitProgress(
      'run_bd_init',
      'completed',
      'bd init failed (non-critical)',
      this.calculateProgress('run_bd_init'),
      lastError,
      { failed: true }
    )
  }

  private executeBdInit(projectPath: string): Promise<boolean> {
    return new Promise((resolve) => {
      const proc = spawn('bd', ['init'], {
        cwd: projectPath,
        shell: true,
      })

      let stdout = ''
      let stderr = ''

      proc.stdout.on('data', (data) => {
        stdout += data.toString()
      })

      proc.stderr.on('data', (data) => {
        stderr += data.toString()
      })

      proc.on('close', (code) => {
        resolve(code === 0)
      })

      proc.on('error', () => {
        resolve(false)
      })
    })
  }

  private handleCancellation(result: ScaffoldingResult): ScaffoldingResult {
    result.success = false
    result.errors.push('Operation cancelled by user')
    this.emitProgress('complete', 'failed', 'Scaffolding cancelled', this._currentProgress, 'Operation cancelled')
    this._isRunning = false
    return result
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const scaffoldingOrchestrator = new ScaffoldingOrchestrator()
export default scaffoldingOrchestrator
