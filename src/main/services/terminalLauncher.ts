/**
 * Terminal Launcher Service
 *
 * Cross-platform service for detecting and launching terminal applications.
 * Supports macOS (Terminal.app, iTerm2), Windows (Windows Terminal, cmd.exe),
 * and Linux (gnome-terminal, konsole, xterm).
 */

import { spawn, exec } from 'child_process'
import { existsSync } from 'fs'
import path from 'path'

// ============================================================================
// Type Definitions
// ============================================================================

/** Result of a terminal launch operation */
export interface TerminalLaunchResult {
  success: boolean
  terminalType: string
  pid?: number
  error?: string
}

/** Terminal launcher service interface */
export interface ITerminalLauncherService {
  detectTerminal(): Promise<string>
  launch(workingDir: string, command: string): Promise<TerminalLaunchResult>
}

/** Supported terminal types */
export type TerminalType =
  | 'terminal.app'
  | 'iterm2'
  | 'windows-terminal'
  | 'cmd'
  | 'gnome-terminal'
  | 'konsole'
  | 'xterm'
  | 'unknown'

// ============================================================================
// Constants
// ============================================================================

/** macOS iTerm2 application path */
const ITERM2_PATH = '/Applications/iTerm.app'

/** Linux terminal detection order */
const LINUX_TERMINALS = [
  { name: 'gnome-terminal' as TerminalType, command: 'gnome-terminal' },
  { name: 'konsole' as TerminalType, command: 'konsole' },
  { name: 'xterm' as TerminalType, command: 'xterm' },
]

// ============================================================================
// Security Helpers
// ============================================================================

/**
 * Escapes a path for safe shell usage.
 * Prevents command injection by properly quoting and escaping special characters.
 *
 * @param inputPath - The path to escape
 * @returns The escaped path safe for shell usage
 */
function escapeShellPath(inputPath: string): string {
  // Validate path doesn't contain dangerous patterns
  const dangerousPatterns = [
    /\$\(/,      // Command substitution $(...)
    /`/,         // Backtick command substitution
    /\|\|/,      // Logical OR
    /&&/,        // Logical AND
    /;/,         // Command separator
    /\|/,        // Pipe
    />/,         // Redirect output
    /</,         // Redirect input
    /\n/,        // Newline
    /\r/,        // Carriage return
  ]

  for (const pattern of dangerousPatterns) {
    if (pattern.test(inputPath)) {
      throw new Error(`Invalid path: contains potentially dangerous characters`)
    }
  }

  // For POSIX systems, escape single quotes and wrap in single quotes
  // Single quotes preserve literal value of all characters except single quote itself
  if (process.platform !== 'win32') {
    return `'${inputPath.replace(/'/g, "'\\''")}'`
  }

  // For Windows, escape double quotes and wrap in double quotes
  return `"${inputPath.replace(/"/g, '\\"')}"`
}

/**
 * Escapes a command for safe shell usage.
 * More permissive than path escaping but still prevents injection.
 *
 * @param command - The command to escape
 * @returns The escaped command safe for shell usage
 */
function escapeShellCommand(command: string): string {
  // For commands, we need to be more permissive but still safe
  // Block the most dangerous patterns
  const dangerousPatterns = [
    /`/,         // Backtick command substitution
    /\$\(/,      // Command substitution $(...)
  ]

  for (const pattern of dangerousPatterns) {
    if (pattern.test(command)) {
      throw new Error(`Invalid command: contains potentially dangerous characters`)
    }
  }

  return command
}

/**
 * Validates that a path is an existing directory.
 *
 * @param dirPath - The directory path to validate
 * @returns True if valid, throws otherwise
 */
function validateDirectory(dirPath: string): boolean {
  const normalizedPath = path.normalize(dirPath)

  if (!existsSync(normalizedPath)) {
    throw new Error(`Directory does not exist: ${dirPath}`)
  }

  return true
}

// ============================================================================
// Detection Helpers
// ============================================================================

/**
 * Checks if a command exists in PATH (Linux/macOS).
 *
 * @param command - The command to check
 * @returns Promise resolving to true if command exists
 */
function commandExists(command: string): Promise<boolean> {
  return new Promise((resolve) => {
    const checkCommand = process.platform === 'win32' ? `where ${command}` : `which ${command}`

    exec(checkCommand, (error) => {
      resolve(!error)
    })
  })
}

/**
 * Checks if Windows Terminal is installed.
 *
 * @returns Promise resolving to true if Windows Terminal is available
 */
function hasWindowsTerminal(): Promise<boolean> {
  return new Promise((resolve) => {
    exec('where wt', (error) => {
      resolve(!error)
    })
  })
}

// ============================================================================
// Platform-Specific Launch Functions
// ============================================================================

/**
 * Launches macOS Terminal.app at the specified directory with a command.
 */
function launchMacOSTerminal(workingDir: string, command: string): Promise<TerminalLaunchResult> {
  return new Promise((resolve) => {
    const escapedDir = escapeShellPath(workingDir)
    const escapedCommand = escapeShellCommand(command)

    // Use osascript to open Terminal and run command
    const script = `
      tell application "Terminal"
        activate
        do script "cd ${escapedDir.replace(/'/g, "'\\''")} && ${escapedCommand.replace(/"/g, '\\"')}"
      end tell
    `

    const proc = spawn('osascript', ['-e', script], { detached: true })

    proc.on('error', (err) => {
      resolve({
        success: false,
        terminalType: 'terminal.app',
        error: err.message,
      })
    })

    proc.on('close', (code) => {
      if (code === 0) {
        resolve({
          success: true,
          terminalType: 'terminal.app',
          pid: proc.pid,
        })
      } else {
        resolve({
          success: false,
          terminalType: 'terminal.app',
          error: `osascript exited with code ${code}`,
        })
      }
    })

    // Unref to allow parent to exit independently
    proc.unref()
  })
}

/**
 * Launches macOS iTerm2 at the specified directory with a command.
 */
function launchITerm2(workingDir: string, command: string): Promise<TerminalLaunchResult> {
  return new Promise((resolve) => {
    const escapedDir = escapeShellPath(workingDir)
    const escapedCommand = escapeShellCommand(command)

    // Use osascript to open iTerm2 and run command
    const script = `
      tell application "iTerm"
        activate
        tell current window
          create tab with default profile
          tell current session
            write text "cd ${escapedDir.replace(/'/g, "'\\''")} && ${escapedCommand.replace(/"/g, '\\"')}"
          end tell
        end tell
      end tell
    `

    const proc = spawn('osascript', ['-e', script], { detached: true })

    proc.on('error', (err) => {
      resolve({
        success: false,
        terminalType: 'iterm2',
        error: err.message,
      })
    })

    proc.on('close', (code) => {
      if (code === 0) {
        resolve({
          success: true,
          terminalType: 'iterm2',
          pid: proc.pid,
        })
      } else {
        resolve({
          success: false,
          terminalType: 'iterm2',
          error: `osascript exited with code ${code}`,
        })
      }
    })

    proc.unref()
  })
}

/**
 * Launches Windows Terminal at the specified directory with a command.
 */
function launchWindowsTerminal(workingDir: string, command: string): Promise<TerminalLaunchResult> {
  return new Promise((resolve) => {
    // Validate inputs (escapeShellCommand throws on dangerous patterns)
    escapeShellCommand(command)

    // wt -d <path> cmd /k <command>
    // Note: When using spawn with args array, no shell escaping needed
    const proc = spawn('wt', ['-d', workingDir, 'cmd', '/k', command], {
      detached: true,
      shell: true,
    })

    proc.on('error', (err) => {
      resolve({
        success: false,
        terminalType: 'windows-terminal',
        error: err.message,
      })
    })

    proc.on('spawn', () => {
      resolve({
        success: true,
        terminalType: 'windows-terminal',
        pid: proc.pid,
      })
    })

    proc.unref()
  })
}

/**
 * Launches Windows cmd.exe at the specified directory with a command.
 */
function launchCmd(workingDir: string, command: string): Promise<TerminalLaunchResult> {
  return new Promise((resolve) => {
    const escapedDir = escapeShellPath(workingDir)
    const escapedCommand = escapeShellCommand(command)

    // start cmd /k "cd /d <path> && <command>"
    const fullCommand = `cd /d ${escapedDir} && ${escapedCommand}`

    const proc = spawn('cmd', ['/c', 'start', 'cmd', '/k', fullCommand], {
      detached: true,
      shell: true,
    })

    proc.on('error', (err) => {
      resolve({
        success: false,
        terminalType: 'cmd',
        error: err.message,
      })
    })

    proc.on('spawn', () => {
      resolve({
        success: true,
        terminalType: 'cmd',
        pid: proc.pid,
      })
    })

    proc.unref()
  })
}

/**
 * Launches gnome-terminal at the specified directory with a command.
 */
function launchGnomeTerminal(workingDir: string, command: string): Promise<TerminalLaunchResult> {
  return new Promise((resolve) => {
    const escapedCommand = escapeShellCommand(command)

    const proc = spawn('gnome-terminal', ['--working-directory=' + workingDir, '--', 'bash', '-c', `${escapedCommand}; exec bash`], {
      detached: true,
    })

    proc.on('error', (err) => {
      resolve({
        success: false,
        terminalType: 'gnome-terminal',
        error: err.message,
      })
    })

    proc.on('spawn', () => {
      resolve({
        success: true,
        terminalType: 'gnome-terminal',
        pid: proc.pid,
      })
    })

    proc.unref()
  })
}

/**
 * Launches konsole at the specified directory with a command.
 */
function launchKonsole(workingDir: string, command: string): Promise<TerminalLaunchResult> {
  return new Promise((resolve) => {
    const escapedCommand = escapeShellCommand(command)

    const proc = spawn('konsole', ['--workdir', workingDir, '-e', 'bash', '-c', `${escapedCommand}; exec bash`], {
      detached: true,
    })

    proc.on('error', (err) => {
      resolve({
        success: false,
        terminalType: 'konsole',
        error: err.message,
      })
    })

    proc.on('spawn', () => {
      resolve({
        success: true,
        terminalType: 'konsole',
        pid: proc.pid,
      })
    })

    proc.unref()
  })
}

/**
 * Launches xterm at the specified directory with a command.
 */
function launchXterm(workingDir: string, command: string): Promise<TerminalLaunchResult> {
  return new Promise((resolve) => {
    const escapedDir = escapeShellPath(workingDir)
    const escapedCommand = escapeShellCommand(command)

    // xterm doesn't have a working directory flag, so we cd first
    const fullCommand = `cd ${escapedDir} && ${escapedCommand}; exec bash`

    const proc = spawn('xterm', ['-e', 'bash', '-c', fullCommand], {
      detached: true,
    })

    proc.on('error', (err) => {
      resolve({
        success: false,
        terminalType: 'xterm',
        error: err.message,
      })
    })

    proc.on('spawn', () => {
      resolve({
        success: true,
        terminalType: 'xterm',
        pid: proc.pid,
      })
    })

    proc.unref()
  })
}

// ============================================================================
// Terminal Launcher Service Class
// ============================================================================

class TerminalLauncherService implements ITerminalLauncherService {
  private cachedTerminal: TerminalType | null = null

  /**
   * Detects the user's preferred/available terminal application.
   *
   * Detection order:
   * - macOS: iTerm2 (if installed), Terminal.app (default)
   * - Windows: Windows Terminal (if installed), cmd.exe (fallback)
   * - Linux: gnome-terminal, konsole, xterm (in order)
   *
   * @returns Promise resolving to the terminal type string
   */
  async detectTerminal(): Promise<string> {
    // Return cached result if available
    if (this.cachedTerminal) {
      return this.cachedTerminal
    }

    const platform = process.platform
    let detected: TerminalType = 'unknown'

    if (platform === 'darwin') {
      // macOS: Check for iTerm2 first, fallback to Terminal.app
      if (existsSync(ITERM2_PATH)) {
        detected = 'iterm2'
      } else {
        detected = 'terminal.app'
      }
    } else if (platform === 'win32') {
      // Windows: Check for Windows Terminal first, fallback to cmd
      if (await hasWindowsTerminal()) {
        detected = 'windows-terminal'
      } else {
        detected = 'cmd'
      }
    } else if (platform === 'linux') {
      // Linux: Try terminals in order of preference
      for (const terminal of LINUX_TERMINALS) {
        if (await commandExists(terminal.command)) {
          detected = terminal.name
          break
        }
      }

      // If no terminal found, default to xterm (most commonly available)
      if (detected === 'unknown') {
        detected = 'xterm'
      }
    }

    this.cachedTerminal = detected
    return detected
  }

  /**
   * Launches a terminal at the specified directory with a command.
   *
   * @param workingDir - The directory to open the terminal in
   * @param command - The command to execute in the terminal
   * @returns Promise resolving to TerminalLaunchResult
   */
  async launch(workingDir: string, command: string): Promise<TerminalLaunchResult> {
    // Validate inputs
    try {
      validateDirectory(workingDir)
    } catch (err) {
      return {
        success: false,
        terminalType: 'unknown',
        error: err instanceof Error ? err.message : String(err),
      }
    }

    // Detect terminal if not already cached
    const terminalType = await this.detectTerminal()

    // Launch appropriate terminal
    switch (terminalType) {
      case 'terminal.app':
        return launchMacOSTerminal(workingDir, command)

      case 'iterm2':
        return launchITerm2(workingDir, command)

      case 'windows-terminal':
        return launchWindowsTerminal(workingDir, command)

      case 'cmd':
        return launchCmd(workingDir, command)

      case 'gnome-terminal':
        return launchGnomeTerminal(workingDir, command)

      case 'konsole':
        return launchKonsole(workingDir, command)

      case 'xterm':
        return launchXterm(workingDir, command)

      default:
        return {
          success: false,
          terminalType: 'unknown',
          error: `No supported terminal found for platform: ${process.platform}`,
        }
    }
  }

  /**
   * Clears the cached terminal detection result.
   * Useful if the user installs a new terminal application.
   */
  clearCache(): void {
    this.cachedTerminal = null
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const terminalLauncherService = new TerminalLauncherService()
export default terminalLauncherService
