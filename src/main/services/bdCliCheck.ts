/**
 * BD CLI Availability Check
 *
 * Pre-flight check for bd command with helpful error if missing.
 * Verifies that the bd CLI is available in PATH and returns version info
 * or helpful installation instructions.
 */

import { exec } from 'child_process'

// ============================================================================
// Type Definitions
// ============================================================================

/** Result of checking bd CLI availability */
export interface BdCliCheckResult {
  available: boolean
  version?: string
  error?: string
  installInstructions?: string
}

// ============================================================================
// Constants
// ============================================================================

/** Installation instructions for the bd CLI */
const INSTALL_INSTRUCTIONS = `The bd (Beads) CLI is required for task management.

To install:
  brew install beads-cli          # macOS with Homebrew
  cargo install beads-cli         # Using Rust/Cargo
  npm install -g @beads/cli       # Using npm

For more information, visit:
  https://github.com/beads-cli/beads - Documentation and help`

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Parses version string from bd command output.
 * Handles various output formats:
 * - "bd version 1.0.0"
 * - "bd v1.0.0"
 * - "beads-cli 0.9.0 (Rust edition)"
 * - "bd version 2.0.1 (build abc123)"
 * - "bd version 2.1.3-beta.1"
 *
 * @param output - The stdout from bd --version command
 * @returns The parsed version string or undefined if not found
 */
function parseVersion(output: string): string | undefined {
  if (!output || output.trim() === '') {
    return undefined
  }

  // Try to match various version patterns
  // Pattern 1: "version X.Y.Z" or "v X.Y.Z" or just "X.Y.Z"
  const patterns = [
    /(?:version\s+|v)(\d+\.\d+\.\d+(?:-[\w.]+)?)/i, // "version 1.0.0" or "v1.0.0"
    /(\d+\.\d+\.\d+(?:-[\w.]+)?)/,                   // Just "1.0.0"
  ]

  for (const pattern of patterns) {
    const match = output.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  return undefined
}

// ============================================================================
// Main Functions
// ============================================================================

/**
 * Checks if the bd CLI is available in PATH.
 *
 * @returns Promise resolving to BdCliCheckResult with availability status,
 *          version info if available, or error and install instructions if not
 */
export function checkBdCliAvailability(): Promise<BdCliCheckResult> {
  return new Promise((resolve) => {
    exec('bd --version', (error, stdout, _stderr) => {
      if (error) {
        // Check if it's a "command not found" error
        const errorMessage = error.message || ''
        const errorCode = (error as Error & { code?: string | number }).code

        const isNotFound =
          errorCode === 'ENOENT' ||
          errorMessage.toLowerCase().includes('not found') ||
          errorMessage.toLowerCase().includes('command not found')

        if (isNotFound) {
          resolve({
            available: false,
            error: 'bd CLI not found in PATH',
            installInstructions: INSTALL_INSTRUCTIONS,
          })
        } else {
          // Some other execution error
          resolve({
            available: false,
            error: `bd CLI execution error: ${errorMessage}`,
            installInstructions: INSTALL_INSTRUCTIONS,
          })
        }
        return
      }

      // Command succeeded - bd is available
      const version = parseVersion(stdout || '')

      resolve({
        available: true,
        version,
      })
    })
  })
}

/**
 * Gets the version of the installed bd CLI.
 *
 * @returns Promise resolving to version string if bd is installed,
 *          or null if not installed or version cannot be parsed
 */
export async function getBdVersion(): Promise<string | null> {
  const result = await checkBdCliAvailability()

  if (!result.available) {
    return null
  }

  return result.version ?? null
}

/**
 * Returns installation instructions for the bd CLI.
 *
 * @returns String containing installation instructions
 */
export function getInstallInstructions(): string {
  return INSTALL_INSTRUCTIONS
}
