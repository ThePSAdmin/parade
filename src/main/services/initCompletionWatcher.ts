/**
 * InitCompletionWatcher Service
 *
 * Monitors /init-project completion by polling project.yaml and tracking terminal process.
 * Emits events for completion, timeout, progress updates, and terminal termination.
 *
 * Usage:
 *   const watcher = new InitCompletionWatcher({ projectPath: '/path/to/project' })
 *   watcher.on('complete', (config) => safeLog('Init completed:', config))
 *   watcher.on('timeout', () => safeLog('Init timed out'))
 *   watcher.on('progress', (status) => safeLog('Progress:', status))
 *   watcher.on('terminated', (code) => safeLog('Terminal exited:', code))
 *   watcher.start()
 */

import { EventEmitter } from 'events'
import { exec } from 'child_process'
import { readProjectConfig, ProjectConfig } from '../ipc/project-handlers'

// Safe console.log that won't throw EPIPE errors
function safeLog(...args: unknown[]): void {
  try {
    console.log(...args)
  } catch {
    // Ignore EPIPE and other write errors
  }
}

// ============================================================================
// Type Definitions
// ============================================================================

/** Options for configuring the watcher */
export interface WatcherOptions {
  /** Path to the project directory containing project.yaml */
  projectPath: string
  /** Optional PID of the terminal process to monitor */
  terminalPid?: number
  /** Timeout in milliseconds (default: 600000 - 10 minutes) */
  timeout?: number
  /** Poll interval in milliseconds (default: 2000) */
  pollInterval?: number
}

/** Progress status emitted during watching */
export interface ProgressStatus {
  /** Whether the config is currently valid */
  validated: boolean
  /** List of validated field names */
  fields: string[]
}

/** Event map for type-safe event handling */
export interface WatcherEvents {
  complete: (config: ProjectConfig) => void
  timeout: () => void
  progress: (status: ProgressStatus) => void
  terminated: (exitCode?: number) => void
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_TIMEOUT = 600000 // 10 minutes
const DEFAULT_POLL_INTERVAL = 2000 // 2 seconds
const PID_CHECK_INTERVAL = 1000 // 1 second

/** Required fields that must be populated for config to be considered complete */
const REQUIRED_FIELDS = ['version', 'project.name'] as const

// ============================================================================
// InitCompletionWatcher Class
// ============================================================================

/**
 * Watches for /init-project completion by monitoring project.yaml
 * and optionally tracking a terminal process.
 */
export class InitCompletionWatcher extends EventEmitter {
  private readonly projectPath: string
  private readonly terminalPid?: number
  private readonly timeout: number
  private readonly pollInterval: number

  private _isRunning = false
  private pollTimer: NodeJS.Timeout | null = null
  private pidCheckTimer: NodeJS.Timeout | null = null
  private timeoutTimer: NodeJS.Timeout | null = null

  constructor(options: WatcherOptions) {
    super()
    this.projectPath = options.projectPath
    this.terminalPid = options.terminalPid
    this.timeout = options.timeout ?? DEFAULT_TIMEOUT
    this.pollInterval = options.pollInterval ?? DEFAULT_POLL_INTERVAL
  }

  /**
   * Starts watching for init completion.
   * Will emit 'complete', 'timeout', or 'terminated' when finished.
   */
  start(): void {
    if (this._isRunning) {
      console.warn('InitCompletionWatcher is already running')
      return
    }

    this._isRunning = true

    // Set up timeout timer
    this.timeoutTimer = setTimeout(() => {
      this.handleTimeout()
    }, this.timeout)

    // Start polling for config changes
    this.pollTimer = setInterval(() => {
      this.checkConfig()
    }, this.pollInterval)

    // Start monitoring terminal PID if provided
    if (this.terminalPid !== undefined) {
      this.pidCheckTimer = setInterval(() => {
        this.checkPidStatus()
      }, PID_CHECK_INTERVAL)
    }

    // Do an initial check immediately
    this.checkConfig()

    safeLog(`InitCompletionWatcher started for ${this.projectPath}`)
    if (this.terminalPid !== undefined) {
      safeLog(`Monitoring terminal PID: ${this.terminalPid}`)
    }
  }

  /**
   * Stops watching and cleans up all timers.
   */
  stop(): void {
    if (!this._isRunning) {
      return
    }

    this.cleanup()
    safeLog('InitCompletionWatcher stopped')
  }

  /**
   * Returns whether the watcher is currently running.
   */
  isRunning(): boolean {
    return this._isRunning
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  /**
   * Cleans up all timers and resets state.
   */
  private cleanup(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer)
      this.pollTimer = null
    }

    if (this.pidCheckTimer) {
      clearInterval(this.pidCheckTimer)
      this.pidCheckTimer = null
    }

    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer)
      this.timeoutTimer = null
    }

    this._isRunning = false
  }

  /**
   * Checks the project.yaml configuration and emits appropriate events.
   */
  private async checkConfig(): Promise<void> {
    if (!this._isRunning) {
      return
    }

    try {
      const result = await readProjectConfig(this.projectPath)
      const validatedFields: string[] = []

      if (result.config) {
        // Check which required fields are populated
        for (const field of REQUIRED_FIELDS) {
          if (this.isFieldPopulated(result.config, field)) {
            validatedFields.push(field)
          }
        }

        const allFieldsValid = validatedFields.length === REQUIRED_FIELDS.length

        // Emit progress event
        const status: ProgressStatus = {
          validated: allFieldsValid,
          fields: validatedFields,
        }
        this.emit('progress', status)

        // If all required fields are present and valid, emit complete
        if (allFieldsValid) {
          this.cleanup()
          this.emit('complete', result.config)
          safeLog('InitCompletionWatcher: Config validation complete')
        }
      } else {
        // Config not yet valid/present, emit progress with empty fields
        const status: ProgressStatus = {
          validated: false,
          fields: validatedFields,
        }
        this.emit('progress', status)
      }
    } catch (error) {
      // Log but don't stop watching - the file might not exist yet
      console.debug('InitCompletionWatcher: Error reading config:', error)
    }
  }

  /**
   * Checks if a nested field path is populated in the config.
   */
  private isFieldPopulated(config: ProjectConfig, fieldPath: string): boolean {
    const parts = fieldPath.split('.')
    let current: unknown = config

    for (const part of parts) {
      if (current === null || current === undefined || typeof current !== 'object') {
        return false
      }
      current = (current as Record<string, unknown>)[part]
    }

    // Check if the final value is populated (not null, undefined, or empty string)
    return current !== null && current !== undefined && current !== ''
  }

  /**
   * Checks if the monitored terminal PID is still running.
   */
  private checkPidStatus(): void {
    if (!this._isRunning || this.terminalPid === undefined) {
      return
    }

    this.isPidRunning(this.terminalPid, (running, exitCode) => {
      if (!running && this._isRunning) {
        this.cleanup()
        this.emit('terminated', exitCode)
        safeLog(`InitCompletionWatcher: Terminal process ${this.terminalPid} terminated`)
      }
    })
  }

  /**
   * Platform-specific check if a PID is running.
   */
  private isPidRunning(
    pid: number,
    callback: (running: boolean, exitCode?: number) => void
  ): void {
    const platform = process.platform

    if (platform === 'win32') {
      // Windows: use tasklist to check if process exists
      exec(`tasklist /FI "PID eq ${pid}" /NH`, (error, stdout) => {
        if (error) {
          callback(false, undefined)
          return
        }
        // If process exists, stdout will contain the PID
        const running = stdout.toLowerCase().includes(pid.toString())
        callback(running, running ? undefined : 0)
      })
    } else {
      // Unix-like (macOS, Linux): use kill -0 to check if process exists
      // kill -0 doesn't actually send a signal, just checks if we can
      exec(`kill -0 ${pid} 2>/dev/null`, (error) => {
        if (error) {
          // Process doesn't exist or we can't signal it
          callback(false, undefined)
        } else {
          callback(true, undefined)
        }
      })
    }
  }

  /**
   * Handles timeout by stopping the watcher and emitting timeout event.
   */
  private handleTimeout(): void {
    if (!this._isRunning) {
      return
    }

    this.cleanup()
    this.emit('timeout')
    safeLog(`InitCompletionWatcher: Timed out after ${this.timeout}ms`)
  }
}

// Export only the class - create instances per watch session
export default InitCompletionWatcher
