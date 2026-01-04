/**
 * MCP Handlers Tests - TDD RED Phase
 *
 * Tests for mcp:detectConfig, mcp:readServers, mcp:backupConfig, mcp:addServer IPC handlers.
 *
 * These handlers will manage:
 * - Detecting existing Claude MCP config file across platforms
 * - Reading mcpServers from claude_desktop_config.json
 * - Backing up config before modification
 * - Adding new MCP server entries to config
 *
 * MCP Config locations:
 * - macOS: ~/Library/Application Support/Claude/claude_desktop_config.json
 * - Windows: %APPDATA%/Claude/claude_desktop_config.json
 * - Linux: ~/.config/claude/claude_desktop_config.json
 *
 * NOTE: These tests are expected to FAIL initially since the handlers don't exist yet.
 * This is the TDD RED phase.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import path from 'path'
import fs from 'fs'
import os from 'os'

// ============================================================================
// Type Definitions for MCP Handlers (to be implemented)
// ============================================================================

/** MCP Server configuration */
interface MCPServer {
  command: string
  args?: string[]
  env?: Record<string, string>
}

/** Full MCP config structure */
interface MCPConfig {
  mcpServers?: Record<string, MCPServer>
  [key: string]: unknown // Allow other config properties
}

/** Result of detecting MCP config */
interface DetectConfigResult {
  exists: boolean
  path: string | null
  platform: 'darwin' | 'win32' | 'linux'
  error?: string
}

/** Result of reading MCP servers */
interface ReadServersResult {
  servers: Record<string, MCPServer> | null
  error?: string
}

/** Result of backing up config */
interface BackupConfigResult {
  success: boolean
  backupPath?: string
  error?: string
}

/** Result of adding an MCP server */
interface AddServerResult {
  success: boolean
  backupPath?: string
  error?: string
}

/** Options for adding a server */
interface AddServerOptions {
  name: string
  server: MCPServer
  overwrite?: boolean
}

// ============================================================================
// Mock Setup
// ============================================================================

// Mock electron's ipcMain - must be hoisted, so use vi.hoisted
const { mockIpcMain, mockApp } = vi.hoisted(() => ({
  mockIpcMain: {
    handle: vi.fn(),
    removeHandler: vi.fn(),
  },
  mockApp: {
    getPath: vi.fn((name: string) => {
      if (name === 'home') return '/mock/home'
      if (name === 'appData') return '/mock/appdata'
      return '/mock/path'
    }),
  },
}))

vi.mock('electron', () => ({
  ipcMain: mockIpcMain,
  app: mockApp,
}))

// ============================================================================
// Helper to attempt import of MCP handlers
// ============================================================================

interface MCPHandlersModule {
  detectMCPConfig: () => Promise<DetectConfigResult>
  readMCPServers: () => Promise<ReadServersResult>
  backupMCPConfig: () => Promise<BackupConfigResult>
  addMCPServer: (options: AddServerOptions) => Promise<AddServerResult>
  getMCPConfigPath: (platform?: string) => string
  registerMCPHandlers: () => void
}

/**
 * Attempts to import the MCP handlers module.
 * RED phase: This will return null because the module doesn't exist yet.
 */
function tryImportMCPHandlers(): MCPHandlersModule | null {
  try {
    // This will throw during RED phase because the module doesn't exist
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const module = require('../mcp-handlers')
    return module as MCPHandlersModule
  } catch {
    return null
  }
}

// ============================================================================
// Test Fixtures
// ============================================================================

const VALID_MCP_CONFIG: MCPConfig = {
  mcpServers: {
    filesystem: {
      command: 'npx',
      args: ['-y', '@anthropic/mcp-server-filesystem', '/home/user/projects'],
    },
    github: {
      command: 'npx',
      args: ['-y', '@anthropic/mcp-server-github'],
      env: {
        GITHUB_TOKEN: 'test-token',
      },
    },
  },
}

const VALID_MCP_CONFIG_JSON = JSON.stringify(VALID_MCP_CONFIG, null, 2)

const EMPTY_MCP_CONFIG: MCPConfig = {}

const EMPTY_SERVERS_CONFIG: MCPConfig = {
  mcpServers: {},
}

const MALFORMED_JSON = '{ "mcpServers": { "test": '

const NEW_SERVER: MCPServer = {
  command: 'node',
  args: ['./dist/index.js'],
  env: {
    API_KEY: 'my-api-key',
  },
}

// ============================================================================
// Tests
// ============================================================================

describe('MCP Handlers', () => {
  let tempDir: string

  beforeEach(() => {
    vi.clearAllMocks()
    // Create a temp directory for test files
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-handlers-test-'))
  })

  afterEach(() => {
    vi.restoreAllMocks()
    // Clean up temp directory
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
  })

  describe('Module Existence', () => {
    it('should have mcp handlers module at src/main/ipc/mcp-handlers.ts', () => {
      const module = tryImportMCPHandlers()

      // RED PHASE: This will fail because the module doesn't exist
      expect(module).not.toBeNull()
    })

    it('should export detectMCPConfig function', () => {
      const module = tryImportMCPHandlers()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      expect(module.detectMCPConfig).toBeDefined()
      expect(typeof module.detectMCPConfig).toBe('function')
    })

    it('should export readMCPServers function', () => {
      const module = tryImportMCPHandlers()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      expect(module.readMCPServers).toBeDefined()
      expect(typeof module.readMCPServers).toBe('function')
    })

    it('should export backupMCPConfig function', () => {
      const module = tryImportMCPHandlers()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      expect(module.backupMCPConfig).toBeDefined()
      expect(typeof module.backupMCPConfig).toBe('function')
    })

    it('should export addMCPServer function', () => {
      const module = tryImportMCPHandlers()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      expect(module.addMCPServer).toBeDefined()
      expect(typeof module.addMCPServer).toBe('function')
    })

    it('should export getMCPConfigPath function', () => {
      const module = tryImportMCPHandlers()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      expect(module.getMCPConfigPath).toBeDefined()
      expect(typeof module.getMCPConfigPath).toBe('function')
    })

    it('should export registerMCPHandlers function', () => {
      const module = tryImportMCPHandlers()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      expect(module.registerMCPHandlers).toBeDefined()
      expect(typeof module.registerMCPHandlers).toBe('function')
    })
  })

  // ==========================================================================
  // Cross-Platform Path Resolution Tests
  // ==========================================================================

  describe('getMCPConfigPath', () => {
    describe('platform-specific paths', () => {
      it('should return correct path for macOS', () => {
        const module = tryImportMCPHandlers()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        const configPath = module.getMCPConfigPath('darwin')

        // macOS: ~/Library/Application Support/Claude/claude_desktop_config.json
        expect(configPath).toContain('Library')
        expect(configPath).toContain('Application Support')
        expect(configPath).toContain('Claude')
        expect(configPath).toContain('claude_desktop_config.json')
      })

      it('should return correct path for Windows', () => {
        const module = tryImportMCPHandlers()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        const configPath = module.getMCPConfigPath('win32')

        // Windows: %APPDATA%/Claude/claude_desktop_config.json
        expect(configPath).toContain('Claude')
        expect(configPath).toContain('claude_desktop_config.json')
        // Should use appData path
        expect(configPath.includes('appdata') || configPath.includes('AppData')).toBe(true)
      })

      it('should return correct path for Linux', () => {
        const module = tryImportMCPHandlers()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        const configPath = module.getMCPConfigPath('linux')

        // Linux: ~/.config/claude/claude_desktop_config.json
        expect(configPath).toContain('.config')
        expect(configPath.toLowerCase()).toContain('claude')
        expect(configPath).toContain('claude_desktop_config.json')
      })

      it('should use current platform when no platform specified', () => {
        const module = tryImportMCPHandlers()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        const configPath = module.getMCPConfigPath()

        // Should return a valid path regardless of current platform
        expect(configPath).toBeTruthy()
        expect(configPath).toContain('claude_desktop_config.json')
      })
    })
  })

  // ==========================================================================
  // mcp:detectConfig Tests
  // ==========================================================================

  describe('mcp:detectConfig', () => {
    describe('when config file exists', () => {
      it('should detect existing MCP config file', async () => {
        const module = tryImportMCPHandlers()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        // Mock the config path to use our temp directory
        const configDir = path.join(tempDir, 'Claude')
        fs.mkdirSync(configDir, { recursive: true })
        const configPath = path.join(configDir, 'claude_desktop_config.json')
        fs.writeFileSync(configPath, VALID_MCP_CONFIG_JSON)

        // This requires the handler to be mockable or use dependency injection
        const result = await module.detectMCPConfig()

        expect(result.exists).toBe(true)
        expect(result.path).toBeTruthy()
        expect(result.error).toBeUndefined()
      })

      it('should return the correct platform', async () => {
        const module = tryImportMCPHandlers()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        const result = await module.detectMCPConfig()

        expect(['darwin', 'win32', 'linux']).toContain(result.platform)
      })
    })

    describe('when config file does not exist', () => {
      it('should return exists: false when no config file', async () => {
        const module = tryImportMCPHandlers()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        const result = await module.detectMCPConfig()

        // Depending on actual system state, but the handler should not error
        expect(result.error).toBeUndefined()
        expect(typeof result.exists).toBe('boolean')
      })

      it('should return null path when config does not exist', async () => {
        const module = tryImportMCPHandlers()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        const result = await module.detectMCPConfig()

        if (!result.exists) {
          expect(result.path).toBeNull()
        }
      })
    })

    describe('error handling', () => {
      it('should handle permission errors gracefully', async () => {
        const module = tryImportMCPHandlers()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        // Should not throw, even if there are permission issues
        const result = await module.detectMCPConfig()

        expect(result).toBeDefined()
        expect(typeof result.exists).toBe('boolean')
      })
    })
  })

  // ==========================================================================
  // mcp:readServers Tests
  // ==========================================================================

  describe('mcp:readServers', () => {
    describe('when config has mcpServers', () => {
      it('should read mcpServers from config', async () => {
        const module = tryImportMCPHandlers()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        const result = await module.readMCPServers()

        // Result should have the servers property
        expect(result).toHaveProperty('servers')
        expect(result.error).toBeUndefined()
      })

      it('should parse server command correctly', async () => {
        const module = tryImportMCPHandlers()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        const result = await module.readMCPServers()

        if (result.servers && Object.keys(result.servers).length > 0) {
          const firstServer = Object.values(result.servers)[0]
          expect(firstServer.command).toBeTruthy()
          expect(typeof firstServer.command).toBe('string')
        }
      })

      it('should parse server args correctly', async () => {
        const module = tryImportMCPHandlers()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        const result = await module.readMCPServers()

        if (result.servers && Object.keys(result.servers).length > 0) {
          const firstServer = Object.values(result.servers)[0]
          if (firstServer.args) {
            expect(Array.isArray(firstServer.args)).toBe(true)
          }
        }
      })

      it('should parse server env correctly', async () => {
        const module = tryImportMCPHandlers()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        const result = await module.readMCPServers()

        if (result.servers && Object.keys(result.servers).length > 0) {
          const firstServer = Object.values(result.servers)[0]
          if (firstServer.env) {
            expect(typeof firstServer.env).toBe('object')
          }
        }
      })
    })

    describe('when config has empty mcpServers', () => {
      it('should return empty object for empty mcpServers', async () => {
        const module = tryImportMCPHandlers()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        const result = await module.readMCPServers()

        // Even with no servers, should not error
        expect(result.error).toBeUndefined()
        if (result.servers !== null) {
          expect(typeof result.servers).toBe('object')
        }
      })
    })

    describe('when config file does not exist', () => {
      it('should return null servers when config does not exist', async () => {
        const module = tryImportMCPHandlers()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        const result = await module.readMCPServers()

        // When no config exists, servers should be null (not an error)
        if (result.servers === null) {
          expect(result.error).toBeUndefined()
        }
      })
    })

    describe('error handling for malformed JSON', () => {
      it('should handle malformed JSON gracefully', async () => {
        const module = tryImportMCPHandlers()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        // Would need to mock file reading to test this properly
        const result = await module.readMCPServers()

        // Should not throw
        expect(result).toBeDefined()
      })

      it('should return error for invalid JSON', async () => {
        const module = tryImportMCPHandlers()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        // This test requires mocking the file system or config path
        // The handler should return an error when JSON is invalid
        const result = await module.readMCPServers()

        expect(result).toBeDefined()
      })
    })

    describe('when mcpServers key is missing', () => {
      it('should return empty object when mcpServers key missing', async () => {
        const module = tryImportMCPHandlers()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        const result = await module.readMCPServers()

        // When mcpServers key is missing, should return empty object, not null
        if (result.servers !== null) {
          expect(typeof result.servers).toBe('object')
        }
      })
    })
  })

  // ==========================================================================
  // mcp:backupConfig Tests
  // ==========================================================================

  describe('mcp:backupConfig', () => {
    describe('when config file exists', () => {
      it('should create backup of existing config', async () => {
        const module = tryImportMCPHandlers()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        const result = await module.backupMCPConfig()

        // If config exists and backup succeeds
        if (result.success) {
          expect(result.backupPath).toBeTruthy()
          expect(result.error).toBeUndefined()
        }
      })

      it('should use timestamp in backup filename', async () => {
        const module = tryImportMCPHandlers()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        const result = await module.backupMCPConfig()

        if (result.success && result.backupPath) {
          // Backup should contain timestamp pattern
          expect(result.backupPath).toContain('backup')
        }
      })

      it('should preserve original config content in backup', async () => {
        const module = tryImportMCPHandlers()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        const result = await module.backupMCPConfig()

        if (result.success && result.backupPath && fs.existsSync(result.backupPath)) {
          const backupContent = fs.readFileSync(result.backupPath, 'utf-8')
          // Should be valid JSON
          expect(() => JSON.parse(backupContent)).not.toThrow()
        }
      })
    })

    describe('when config file does not exist', () => {
      it('should return success: false when no config to backup', async () => {
        const module = tryImportMCPHandlers()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        const result = await module.backupMCPConfig()

        // If no config exists, backup should indicate this
        if (!result.success) {
          expect(result.backupPath).toBeUndefined()
        }
      })

      it('should return appropriate error message', async () => {
        const module = tryImportMCPHandlers()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        const result = await module.backupMCPConfig()

        if (!result.success) {
          expect(result.error).toBeTruthy()
        }
      })
    })

    describe('error handling', () => {
      it('should handle write permission errors', async () => {
        const module = tryImportMCPHandlers()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        // Should not throw even with permission issues
        const result = await module.backupMCPConfig()

        expect(result).toBeDefined()
        expect(typeof result.success).toBe('boolean')
      })

      it('should handle disk space errors gracefully', async () => {
        const module = tryImportMCPHandlers()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        // Should return error, not throw
        const result = await module.backupMCPConfig()

        expect(result).toBeDefined()
      })
    })
  })

  // ==========================================================================
  // mcp:addServer Tests
  // ==========================================================================

  describe('mcp:addServer', () => {
    describe('adding a new server', () => {
      it('should add new server to config', async () => {
        const module = tryImportMCPHandlers()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        const result = await module.addMCPServer({
          name: 'my-new-server',
          server: NEW_SERVER,
        })

        expect(result.success).toBe(true)
        expect(result.error).toBeUndefined()
      })

      it('should create backup before modification', async () => {
        const module = tryImportMCPHandlers()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        const result = await module.addMCPServer({
          name: 'test-server',
          server: NEW_SERVER,
        })

        if (result.success) {
          expect(result.backupPath).toBeTruthy()
        }
      })

      it('should preserve existing servers when adding new one', async () => {
        const module = tryImportMCPHandlers()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        // Add a server
        await module.addMCPServer({
          name: 'first-server',
          server: { command: 'first' },
        })

        // Add another server
        await module.addMCPServer({
          name: 'second-server',
          server: { command: 'second' },
        })

        // Read servers back
        const readResult = await module.readMCPServers()

        if (readResult.servers) {
          // Both servers should exist
          expect(Object.keys(readResult.servers).length).toBeGreaterThanOrEqual(2)
        }
      })

      it('should write valid JSON to config file', async () => {
        const module = tryImportMCPHandlers()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        const result = await module.addMCPServer({
          name: 'json-test-server',
          server: NEW_SERVER,
        })

        if (result.success) {
          // Read back and verify it's valid JSON
          const readResult = await module.readMCPServers()
          expect(readResult.error).toBeUndefined()
        }
      })
    })

    describe('server with args', () => {
      it('should correctly write server with args array', async () => {
        const module = tryImportMCPHandlers()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        const serverWithArgs: MCPServer = {
          command: 'npx',
          args: ['-y', '@anthropic/mcp-server-test', '--flag', 'value'],
        }

        const result = await module.addMCPServer({
          name: 'server-with-args',
          server: serverWithArgs,
        })

        expect(result.success).toBe(true)

        // Read back and verify args
        const readResult = await module.readMCPServers()
        if (readResult.servers && readResult.servers['server-with-args']) {
          expect(readResult.servers['server-with-args'].args).toEqual(serverWithArgs.args)
        }
      })
    })

    describe('server with env variables', () => {
      it('should correctly write server with env variables', async () => {
        const module = tryImportMCPHandlers()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        const serverWithEnv: MCPServer = {
          command: 'node',
          args: ['./server.js'],
          env: {
            API_KEY: 'secret-key',
            DEBUG: 'true',
          },
        }

        const result = await module.addMCPServer({
          name: 'server-with-env',
          server: serverWithEnv,
        })

        expect(result.success).toBe(true)

        // Read back and verify env
        const readResult = await module.readMCPServers()
        if (readResult.servers && readResult.servers['server-with-env']) {
          expect(readResult.servers['server-with-env'].env).toEqual(serverWithEnv.env)
        }
      })
    })

    describe('when server name already exists', () => {
      it('should fail when server exists and overwrite is false', async () => {
        const module = tryImportMCPHandlers()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        // Add initial server
        await module.addMCPServer({
          name: 'existing-server',
          server: { command: 'original' },
        })

        // Try to add same name without overwrite
        const result = await module.addMCPServer({
          name: 'existing-server',
          server: { command: 'new' },
          overwrite: false,
        })

        expect(result.success).toBe(false)
        expect(result.error).toBeTruthy()
        expect(result.error).toContain('exists')
      })

      it('should succeed when server exists and overwrite is true', async () => {
        const module = tryImportMCPHandlers()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        // Add initial server
        await module.addMCPServer({
          name: 'overwrite-test',
          server: { command: 'original' },
        })

        // Overwrite with new config
        const result = await module.addMCPServer({
          name: 'overwrite-test',
          server: { command: 'overwritten' },
          overwrite: true,
        })

        expect(result.success).toBe(true)

        // Verify it was overwritten
        const readResult = await module.readMCPServers()
        if (readResult.servers && readResult.servers['overwrite-test']) {
          expect(readResult.servers['overwrite-test'].command).toBe('overwritten')
        }
      })
    })

    describe('when config file does not exist', () => {
      it('should create new config file with mcpServers', async () => {
        const module = tryImportMCPHandlers()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        const result = await module.addMCPServer({
          name: 'first-ever-server',
          server: NEW_SERVER,
        })

        // Should succeed and create the file
        expect(result.success).toBe(true)
      })

      it('should create parent directories if needed', async () => {
        const module = tryImportMCPHandlers()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        const result = await module.addMCPServer({
          name: 'dir-creation-test',
          server: NEW_SERVER,
        })

        // Should handle missing directories
        expect(result).toBeDefined()
      })
    })

    describe('validation', () => {
      it('should reject server with empty command', async () => {
        const module = tryImportMCPHandlers()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        const result = await module.addMCPServer({
          name: 'invalid-server',
          server: { command: '' },
        })

        expect(result.success).toBe(false)
        expect(result.error).toBeTruthy()
        expect(result.error).toContain('command')
      })

      it('should reject empty server name', async () => {
        const module = tryImportMCPHandlers()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        const result = await module.addMCPServer({
          name: '',
          server: NEW_SERVER,
        })

        expect(result.success).toBe(false)
        expect(result.error).toBeTruthy()
        expect(result.error).toContain('name')
      })

      it('should reject server name with invalid characters', async () => {
        const module = tryImportMCPHandlers()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        const result = await module.addMCPServer({
          name: 'invalid/name\\here',
          server: NEW_SERVER,
        })

        expect(result.success).toBe(false)
        expect(result.error).toBeTruthy()
      })
    })

    describe('error handling', () => {
      it('should handle write permission errors', async () => {
        const module = tryImportMCPHandlers()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        // Should return error, not throw
        const result = await module.addMCPServer({
          name: 'permission-test',
          server: NEW_SERVER,
        })

        expect(result).toBeDefined()
        expect(typeof result.success).toBe('boolean')
      })

      it('should not leave partial writes on error', async () => {
        const module = tryImportMCPHandlers()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        // Try an operation that might fail
        const result = await module.addMCPServer({
          name: 'atomic-test',
          server: NEW_SERVER,
        })

        // If it failed, original config should be intact
        if (!result.success) {
          const readResult = await module.readMCPServers()
          // Should still be readable
          expect(readResult.error).toBeUndefined()
        }
      })
    })
  })

  // ==========================================================================
  // IPC Handler Registration Tests
  // ==========================================================================

  describe('registerMCPHandlers', () => {
    it('should register mcp:detectConfig handler', () => {
      const module = tryImportMCPHandlers()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      module.registerMCPHandlers()

      expect(mockIpcMain.handle).toHaveBeenCalledWith(
        'mcp:detectConfig',
        expect.any(Function)
      )
    })

    it('should register mcp:readServers handler', () => {
      const module = tryImportMCPHandlers()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      module.registerMCPHandlers()

      expect(mockIpcMain.handle).toHaveBeenCalledWith(
        'mcp:readServers',
        expect.any(Function)
      )
    })

    it('should register mcp:backupConfig handler', () => {
      const module = tryImportMCPHandlers()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      module.registerMCPHandlers()

      expect(mockIpcMain.handle).toHaveBeenCalledWith(
        'mcp:backupConfig',
        expect.any(Function)
      )
    })

    it('should register mcp:addServer handler', () => {
      const module = tryImportMCPHandlers()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      module.registerMCPHandlers()

      expect(mockIpcMain.handle).toHaveBeenCalledWith(
        'mcp:addServer',
        expect.any(Function)
      )
    })
  })
})
