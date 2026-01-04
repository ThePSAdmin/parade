/**
 * BD CLI Availability Check Tests
 *
 * Tests for the bd CLI pre-flight check that verifies:
 * - bd command exists in PATH
 * - Returns version if available
 * - Returns helpful error message if not installed
 * - Suggests installation instructions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ============================================================================
// Mock Setup - using vi.hoisted for proper hoisting
// ============================================================================

const mockExec = vi.hoisted(() => vi.fn())

vi.mock('child_process', () => {
  const mock = {
    exec: mockExec,
    spawn: vi.fn(),
    execSync: vi.fn(),
    spawnSync: vi.fn(),
    fork: vi.fn(),
    execFile: vi.fn(),
    execFileSync: vi.fn(),
  }
  return {
    default: mock,
    ...mock,
  }
})

// ============================================================================
// Module under test
// ============================================================================

import {
  checkBdCliAvailability,
  getBdVersion,
  getInstallInstructions,
} from '../bdCliCheck'

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Helper to simulate exec callback behavior
 * Note: Node.js exec callback signature is (error, stdout, stderr)
 */
function simulateExecSuccess(stdout: string, stderr: string = '') {
  mockExec.mockImplementation(
    (
      _cmd: string,
      callback: (error: Error | null, stdout: string, stderr: string) => void
    ) => {
      callback(null, stdout, stderr)
    }
  )
}

function simulateExecError(errorMessage: string, code: number = 1) {
  mockExec.mockImplementation(
    (
      _cmd: string,
      callback: (error: Error | null, stdout: string, stderr: string) => void
    ) => {
      const error = new Error(errorMessage) as Error & { code: number }
      error.code = code
      callback(error, '', '')
    }
  )
}

function simulateExecNotFound() {
  mockExec.mockImplementation(
    (
      _cmd: string,
      callback: (error: Error | null, stdout: string, stderr: string) => void
    ) => {
      const error = new Error('Command not found: bd') as Error & { code: string }
      error.code = 'ENOENT'
      callback(error, '', '')
    }
  )
}

// ============================================================================
// Tests
// ============================================================================

describe('bdCliCheck', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ==========================================================================
  // Module Existence Tests
  // ==========================================================================

  describe('Module Existence', () => {
    it('should have bdCliCheck module at src/main/services/bdCliCheck.ts', () => {
      // Module imported successfully, test passes
      expect(checkBdCliAvailability).toBeDefined()
    })

    it('should export checkBdCliAvailability function', () => {
      expect(checkBdCliAvailability).toBeDefined()
      expect(typeof checkBdCliAvailability).toBe('function')
    })

    it('should export getBdVersion function', () => {
      expect(getBdVersion).toBeDefined()
      expect(typeof getBdVersion).toBe('function')
    })

    it('should export getInstallInstructions function', () => {
      expect(getInstallInstructions).toBeDefined()
      expect(typeof getInstallInstructions).toBe('function')
    })
  })

  // ==========================================================================
  // checkBdCliAvailability Tests
  // ==========================================================================

  describe('checkBdCliAvailability', () => {
    describe('when bd is installed', () => {
      it('should return available: true when bd command exists', async () => {
        // Simulate successful bd --version execution
        simulateExecSuccess('bd version 0.1.0\n')

        const result = await checkBdCliAvailability()

        expect(result.available).toBe(true)
        expect(result.error).toBeUndefined()
      })

      it('should include version string in result when bd is available', async () => {
        simulateExecSuccess('bd version 1.2.3\n')

        const result = await checkBdCliAvailability()

        expect(result.available).toBe(true)
        expect(result.version).toBe('1.2.3')
      })

      it('should parse version from various output formats', async () => {
        // Test with "bd v0.5.0" format
        simulateExecSuccess('bd v0.5.0\n')

        const result = await checkBdCliAvailability()

        expect(result.available).toBe(true)
        expect(result.version).toBe('0.5.0')
      })

      it('should handle version output with additional info', async () => {
        // Test with additional build info
        simulateExecSuccess('bd version 2.0.1 (build abc123)\n')

        const result = await checkBdCliAvailability()

        expect(result.available).toBe(true)
        expect(result.version).toBe('2.0.1')
      })
    })

    describe('when bd is not installed', () => {
      it('should return available: false when bd command not found', async () => {
        simulateExecNotFound()

        const result = await checkBdCliAvailability()

        expect(result.available).toBe(false)
      })

      it('should include error message when bd is not installed', async () => {
        simulateExecNotFound()

        const result = await checkBdCliAvailability()

        expect(result.available).toBe(false)
        expect(result.error).toBeDefined()
        expect(result.error).toContain('not found')
      })

      it('should provide installation instructions when bd is not installed', async () => {
        simulateExecNotFound()

        const result = await checkBdCliAvailability()

        expect(result.available).toBe(false)
        expect(result.installInstructions).toBeDefined()
        expect(result.installInstructions!.length).toBeGreaterThan(0)
      })

      it('should suggest brew install for macOS users in instructions', async () => {
        simulateExecNotFound()

        const result = await checkBdCliAvailability()

        expect(result.installInstructions).toBeDefined()
        // Should mention installation method (brew, npm, cargo, or download URL)
        expect(
          result.installInstructions!.toLowerCase().includes('install') ||
            result.installInstructions!.toLowerCase().includes('brew') ||
            result.installInstructions!.toLowerCase().includes('npm') ||
            result.installInstructions!.toLowerCase().includes('cargo') ||
            result.installInstructions!.toLowerCase().includes('http')
        ).toBe(true)
      })
    })

    describe('error handling', () => {
      it('should handle execution errors gracefully', async () => {
        simulateExecError('Permission denied', 126)

        const result = await checkBdCliAvailability()

        expect(result.available).toBe(false)
        expect(result.error).toBeDefined()
      })

      it('should not throw when exec fails - returns error result instead', async () => {
        simulateExecError('Unexpected error')

        // Should not throw
        const promise = checkBdCliAvailability()
        await expect(promise).resolves.toBeDefined()

        const result = await checkBdCliAvailability()
        expect(result.available).toBe(false)
      })

      it('should include error message in result when execution fails', async () => {
        simulateExecError('Some execution error')

        const result = await checkBdCliAvailability()

        expect(result.error).toBeDefined()
        expect(result.error).toContain('execution error')
      })

      it('should handle timeout errors', async () => {
        mockExec.mockImplementation(
          (
            _cmd: string,
            callback: (error: Error | null, stdout: string, stderr: string) => void
          ) => {
            const error = new Error('Command timed out') as Error & { killed: boolean }
            error.killed = true
            callback(error, '', '')
          }
        )

        const result = await checkBdCliAvailability()

        expect(result.available).toBe(false)
        expect(result.error).toBeDefined()
      })

      it('should handle empty stdout gracefully', async () => {
        simulateExecSuccess('')

        const result = await checkBdCliAvailability()

        // Even with empty output, if command succeeded, bd is available
        // but version might be undefined
        expect(result.available).toBe(true)
        expect(result.version).toBeUndefined()
      })
    })
  })

  // ==========================================================================
  // getBdVersion Tests
  // ==========================================================================

  describe('getBdVersion', () => {
    it('should return version string when bd is installed', async () => {
      simulateExecSuccess('bd version 1.0.0\n')

      const version = await getBdVersion()

      expect(version).toBe('1.0.0')
    })

    it('should return null when bd is not installed', async () => {
      simulateExecNotFound()

      const version = await getBdVersion()

      expect(version).toBeNull()
    })

    it('should return null when version cannot be parsed', async () => {
      simulateExecSuccess('Unknown output format')

      const version = await getBdVersion()

      expect(version).toBeNull()
    })

    it('should parse semver versions correctly', async () => {
      simulateExecSuccess('bd version 2.1.3-beta.1\n')

      const version = await getBdVersion()

      // Should at least capture the major.minor.patch
      expect(version).toBeDefined()
      expect(version?.startsWith('2.1.3')).toBe(true)
    })
  })

  // ==========================================================================
  // getInstallInstructions Tests
  // ==========================================================================

  describe('getInstallInstructions', () => {
    it('should return non-empty installation instructions', () => {
      const instructions = getInstallInstructions()

      expect(instructions).toBeDefined()
      expect(instructions.length).toBeGreaterThan(0)
    })

    it('should include at least one installation method', () => {
      const instructions = getInstallInstructions()
      const lowerInstructions = instructions.toLowerCase()

      // Should mention at least one of these installation methods
      const hasInstallMethod =
        lowerInstructions.includes('brew') ||
        lowerInstructions.includes('npm') ||
        lowerInstructions.includes('cargo') ||
        lowerInstructions.includes('pip') ||
        lowerInstructions.includes('http') ||
        lowerInstructions.includes('github') ||
        lowerInstructions.includes('download')

      expect(hasInstallMethod).toBe(true)
    })

    it('should include documentation or help link', () => {
      const instructions = getInstallInstructions()
      const lowerInstructions = instructions.toLowerCase()

      // Should mention documentation, help, or provide a URL
      const hasHelpInfo =
        lowerInstructions.includes('http') ||
        lowerInstructions.includes('github') ||
        lowerInstructions.includes('documentation') ||
        lowerInstructions.includes('docs') ||
        lowerInstructions.includes('readme') ||
        lowerInstructions.includes('help')

      expect(hasHelpInfo).toBe(true)
    })
  })

  // ==========================================================================
  // BdCliCheckResult Type Tests
  // ==========================================================================

  describe('BdCliCheckResult types', () => {
    it('should define result interface with available property', async () => {
      simulateExecSuccess('bd version 1.0.0\n')

      const result = await checkBdCliAvailability()

      // Validate result structure
      expect(typeof result.available).toBe('boolean')
    })

    it('should have optional version property in success case', async () => {
      simulateExecSuccess('bd version 1.0.0\n')

      const result = await checkBdCliAvailability()

      expect(result.available).toBe(true)
      // version should be a string when available
      if (result.version !== undefined) {
        expect(typeof result.version).toBe('string')
      }
    })

    it('should have optional error property in failure case', async () => {
      simulateExecNotFound()

      const result = await checkBdCliAvailability()

      expect(result.available).toBe(false)
      // error should be a string when not available
      if (result.error !== undefined) {
        expect(typeof result.error).toBe('string')
      }
    })

    it('should have optional installInstructions property in failure case', async () => {
      simulateExecNotFound()

      const result = await checkBdCliAvailability()

      expect(result.available).toBe(false)
      // installInstructions should be a string when not available
      if (result.installInstructions !== undefined) {
        expect(typeof result.installInstructions).toBe('string')
      }
    })
  })

  // ==========================================================================
  // Integration-style Tests
  // ==========================================================================

  describe('Integration scenarios', () => {
    it('should work for typical first-time user flow (bd not installed)', async () => {
      simulateExecNotFound()

      const result = await checkBdCliAvailability()

      // First-time user should see:
      // 1. Clear indication that bd is not available
      expect(result.available).toBe(false)
      // 2. Helpful error message
      expect(result.error).toBeDefined()
      // 3. Instructions on how to install
      expect(result.installInstructions).toBeDefined()
    })

    it('should work for returning user flow (bd installed)', async () => {
      simulateExecSuccess('bd version 1.5.0\n')

      const result = await checkBdCliAvailability()

      // Returning user should see:
      // 1. bd is available
      expect(result.available).toBe(true)
      // 2. Version info for display
      expect(result.version).toBeDefined()
      // 3. No error message
      expect(result.error).toBeUndefined()
      // 4. No install instructions needed
      expect(result.installInstructions).toBeUndefined()
    })

    it('should handle bd in unusual PATH location', async () => {
      // bd might be installed via different methods resulting in different output formats
      simulateExecSuccess('beads-cli 0.9.0 (Rust edition)\n')

      const result = await checkBdCliAvailability()

      // Should still recognize as available even with different output format
      expect(result.available).toBe(true)
    })
  })
})
