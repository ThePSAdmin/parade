/**
 * Preload MCP Handlers Tests - TDD RED Phase
 *
 * Tests for missing IPC handlers in preload.ts:
 * - window.electron.project.writeConfig()
 * - window.electron.project.createScaffold()
 * - window.electron.mcp.detect()
 * - window.electron.mcp.install()
 * - window.electron.mcp.generateInstructions()
 *
 * NOTE: These tests are expected to FAIL initially since the preload handlers don't exist yet.
 * This is the TDD RED phase.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ============================================================================
// Type Definitions for Expected API
// ============================================================================

/** Project configuration structure */
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

/** Detected MCP server */
interface DetectedMCP {
  name: string
  type: 'stdio' | 'sse'
  command?: string
  args?: string[]
  url?: string
  env?: Record<string, string>
  detected_from: string
}

/** MCP detection result */
interface MCPDetectResult {
  servers: DetectedMCP[]
  suggested: DetectedMCP[]
  error?: string
}

/** MCP install options */
interface MCPInstallOptions {
  server: DetectedMCP
  target: 'claude_desktop' | 'cursor' | 'both'
  backup?: boolean
}

/** MCP install result */
interface MCPInstallResult {
  success: boolean
  installedTo: string[]
  backupPaths?: string[]
  error?: string
}

/** MCP instructions generation result */
interface MCPInstructionsResult {
  instructions: string
  serverCount: number
  error?: string
}

// ============================================================================
// Mock Setup - Hoisted mocks
// ============================================================================

const { mockIpcRenderer, mockContextBridge, capturedApi } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let captured: any = null
  return {
    mockIpcRenderer: {
      invoke: vi.fn(),
      on: vi.fn((_channel, _handler) => {}),
      removeListener: vi.fn(),
    },
    mockContextBridge: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      exposeInMainWorld: vi.fn((_name: string, api: any) => {
        captured = api
      }),
    },
    get capturedApi() {
      return captured
    },
  }
})

vi.mock('electron', () => ({
  ipcRenderer: mockIpcRenderer,
  contextBridge: mockContextBridge,
}))

// ============================================================================
// Test Fixtures
// ============================================================================

const VALID_PROJECT_CONFIG: ProjectConfig = {
  version: '1.0',
  project: {
    name: 'test-project',
    description: 'A test project for unit tests',
  },
  workflow: {
    tdd_enabled: true,
  },
}

const SAMPLE_SCAFFOLD_OPTIONS: ScaffoldOptions = {
  projectPath: '/test/project',
  projectName: 'test-project',
  createDesign: true,
}

const DETECTED_MCP_SERVER: DetectedMCP = {
  name: 'beads-cli',
  type: 'stdio',
  command: 'npx',
  args: ['bd', 'mcp'],
  detected_from: 'package.json',
}

// ============================================================================
// Tests
// ============================================================================

describe('Preload API - Missing MCP Handlers', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let api: any

  beforeEach(async () => {
    vi.clearAllMocks()
    // Reset modules to ensure fresh import
    vi.resetModules()
    // Import preload to trigger exposeInMainWorld
    await import('../preload')
    // Get the captured API from the mock
    api = capturedApi
  })

  // ==========================================================================
  // window.electron.project.writeConfig Tests
  // ==========================================================================

  describe('window.electron.project.writeConfig', () => {
    it('should expose writeConfig method in preload API', () => {
      // RED PHASE: This should fail because writeConfig is not exposed in preload.ts
      expect(api).toBeDefined()
      expect(api.project).toBeDefined()
      expect(api.project.writeConfig).toBeDefined()
      expect(typeof api.project.writeConfig).toBe('function')
    })

    it('should invoke project:writeConfig IPC channel with correct parameters', async () => {
      // RED PHASE: This should fail because writeConfig doesn't exist
      if (!api?.project?.writeConfig) {
        expect(api?.project?.writeConfig).toBeDefined()
        return
      }

      const projectPath = '/test/project'
      mockIpcRenderer.invoke.mockResolvedValue({ success: true })

      await api.project.writeConfig(projectPath, VALID_PROJECT_CONFIG)

      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
        'project:writeConfig',
        projectPath,
        VALID_PROJECT_CONFIG
      )
    })

    it('should return WriteConfigResult from writeConfig', async () => {
      if (!api?.project?.writeConfig) {
        expect(api?.project?.writeConfig).toBeDefined()
        return
      }

      const expectedResult: WriteConfigResult = {
        success: true,
        backupPath: '/test/project/project.yaml.backup-2024-01-01',
      }
      mockIpcRenderer.invoke.mockResolvedValue(expectedResult)

      const result = await api.project.writeConfig('/test/project', VALID_PROJECT_CONFIG)

      expect(result).toEqual(expectedResult)
    })
  })

  // ==========================================================================
  // window.electron.project.createScaffold Tests
  // ==========================================================================

  describe('window.electron.project.createScaffold', () => {
    it('should expose createScaffold method in preload API', () => {
      // RED PHASE: This should fail because createScaffold is not exposed
      expect(api).toBeDefined()
      expect(api.project).toBeDefined()
      expect(api.project.createScaffold).toBeDefined()
      expect(typeof api.project.createScaffold).toBe('function')
    })

    it('should invoke project:createScaffold IPC channel with ScaffoldOptions', async () => {
      if (!api?.project?.createScaffold) {
        expect(api?.project?.createScaffold).toBeDefined()
        return
      }

      mockIpcRenderer.invoke.mockResolvedValue({
        success: true,
        createdPaths: [],
        skippedPaths: [],
      })

      await api.project.createScaffold(SAMPLE_SCAFFOLD_OPTIONS)

      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
        'project:createScaffold',
        SAMPLE_SCAFFOLD_OPTIONS
      )
    })

    it('should return CreateScaffoldResult from createScaffold', async () => {
      if (!api?.project?.createScaffold) {
        expect(api?.project?.createScaffold).toBeDefined()
        return
      }

      const expectedResult: CreateScaffoldResult = {
        success: true,
        createdPaths: ['/test/.claude', '/test/.beads', '/test/.design'],
        skippedPaths: [],
      }
      mockIpcRenderer.invoke.mockResolvedValue(expectedResult)

      const result = await api.project.createScaffold(SAMPLE_SCAFFOLD_OPTIONS)

      expect(result).toEqual(expectedResult)
    })
  })

  // ==========================================================================
  // window.electron.mcp.detect Tests
  // ==========================================================================

  describe('window.electron.mcp.detect', () => {
    it('should expose mcp namespace in preload API', () => {
      // RED PHASE: This should fail because mcp namespace doesn't exist
      expect(api).toBeDefined()
      expect(api.mcp).toBeDefined()
    })

    it('should expose detect method in mcp namespace', () => {
      // RED PHASE: This should fail because mcp.detect is not exposed
      expect(api).toBeDefined()
      expect(api.mcp).toBeDefined()
      expect(api.mcp?.detect).toBeDefined()
      expect(typeof api.mcp?.detect).toBe('function')
    })

    it('should invoke mcp:detect IPC channel with project path', async () => {
      if (!api?.mcp?.detect) {
        expect(api?.mcp?.detect).toBeDefined()
        return
      }

      const projectPath = '/test/project'
      mockIpcRenderer.invoke.mockResolvedValue({ servers: [], suggested: [] })

      await api.mcp.detect(projectPath)

      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('mcp:detect', projectPath)
    })

    it('should return MCPDetectResult from detect', async () => {
      if (!api?.mcp?.detect) {
        expect(api?.mcp?.detect).toBeDefined()
        return
      }

      const expectedResult: MCPDetectResult = {
        servers: [DETECTED_MCP_SERVER],
        suggested: [],
      }
      mockIpcRenderer.invoke.mockResolvedValue(expectedResult)

      const result = await api.mcp.detect('/test/project')

      expect(result).toEqual(expectedResult)
      expect(result.servers).toHaveLength(1)
      expect(result.servers[0].name).toBe('beads-cli')
    })
  })

  // ==========================================================================
  // window.electron.mcp.install Tests
  // ==========================================================================

  describe('window.electron.mcp.install', () => {
    it('should expose install method in mcp namespace', () => {
      // RED PHASE: This should fail because mcp.install is not exposed
      expect(api).toBeDefined()
      expect(api.mcp).toBeDefined()
      expect(api.mcp?.install).toBeDefined()
      expect(typeof api.mcp?.install).toBe('function')
    })

    it('should invoke mcp:install IPC channel with MCPInstallOptions', async () => {
      if (!api?.mcp?.install) {
        expect(api?.mcp?.install).toBeDefined()
        return
      }

      const installOptions: MCPInstallOptions = {
        server: DETECTED_MCP_SERVER,
        target: 'claude_desktop',
        backup: true,
      }
      mockIpcRenderer.invoke.mockResolvedValue({
        success: true,
        installedTo: ['claude_desktop'],
      })

      await api.mcp.install(installOptions)

      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('mcp:install', installOptions)
    })

    it('should return MCPInstallResult from install', async () => {
      if (!api?.mcp?.install) {
        expect(api?.mcp?.install).toBeDefined()
        return
      }

      const installOptions: MCPInstallOptions = {
        server: DETECTED_MCP_SERVER,
        target: 'both',
        backup: true,
      }
      const expectedResult: MCPInstallResult = {
        success: true,
        installedTo: ['claude_desktop', 'cursor'],
        backupPaths: [
          '/Users/test/.config/claude_desktop/claude_desktop_config.json.backup',
          '/Users/test/.cursor/mcp.json.backup',
        ],
      }
      mockIpcRenderer.invoke.mockResolvedValue(expectedResult)

      const result = await api.mcp.install(installOptions)

      expect(result).toEqual(expectedResult)
      expect(result.success).toBe(true)
      expect(result.installedTo).toContain('claude_desktop')
      expect(result.installedTo).toContain('cursor')
    })

    it('should handle installation errors gracefully', async () => {
      if (!api?.mcp?.install) {
        expect(api?.mcp?.install).toBeDefined()
        return
      }

      const installOptions: MCPInstallOptions = {
        server: DETECTED_MCP_SERVER,
        target: 'claude_desktop',
      }
      const expectedResult: MCPInstallResult = {
        success: false,
        installedTo: [],
        error: 'Claude Desktop config file not found',
      }
      mockIpcRenderer.invoke.mockResolvedValue(expectedResult)

      const result = await api.mcp.install(installOptions)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  // ==========================================================================
  // window.electron.mcp.generateInstructions Tests
  // ==========================================================================

  describe('window.electron.mcp.generateInstructions', () => {
    it('should expose generateInstructions method in mcp namespace', () => {
      // RED PHASE: This should fail because mcp.generateInstructions is not exposed
      expect(api).toBeDefined()
      expect(api.mcp).toBeDefined()
      expect(api.mcp?.generateInstructions).toBeDefined()
      expect(typeof api.mcp?.generateInstructions).toBe('function')
    })

    it('should invoke mcp:generateInstructions IPC channel with servers array', async () => {
      if (!api?.mcp?.generateInstructions) {
        expect(api?.mcp?.generateInstructions).toBeDefined()
        return
      }

      const servers = [DETECTED_MCP_SERVER]
      mockIpcRenderer.invoke.mockResolvedValue({
        instructions: '# MCP Setup Instructions',
        serverCount: 1,
      })

      await api.mcp.generateInstructions(servers)

      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('mcp:generateInstructions', servers)
    })

    it('should return MCPInstructionsResult from generateInstructions', async () => {
      if (!api?.mcp?.generateInstructions) {
        expect(api?.mcp?.generateInstructions).toBeDefined()
        return
      }

      const servers = [DETECTED_MCP_SERVER]
      const expectedResult: MCPInstructionsResult = {
        instructions: `# MCP Server Setup Instructions

## beads-cli (stdio)

Add the following to your Claude Desktop config:

\`\`\`json
{
  "mcpServers": {
    "beads-cli": {
      "command": "npx",
      "args": ["bd", "mcp"]
    }
  }
}
\`\`\`
`,
        serverCount: 1,
      }
      mockIpcRenderer.invoke.mockResolvedValue(expectedResult)

      const result = await api.mcp.generateInstructions(servers)

      expect(result).toEqual(expectedResult)
      expect(result.serverCount).toBe(1)
      expect(result.instructions).toContain('beads-cli')
    })

    it('should handle multiple servers in instructions', async () => {
      if (!api?.mcp?.generateInstructions) {
        expect(api?.mcp?.generateInstructions).toBeDefined()
        return
      }

      const servers: DetectedMCP[] = [
        DETECTED_MCP_SERVER,
        {
          name: 'database-mcp',
          type: 'sse',
          url: 'http://localhost:3001/sse',
          detected_from: 'mcp.json',
        },
      ]
      const expectedResult: MCPInstructionsResult = {
        instructions: '# MCP Setup Instructions\n...',
        serverCount: 2,
      }
      mockIpcRenderer.invoke.mockResolvedValue(expectedResult)

      const result = await api.mcp.generateInstructions(servers)

      expect(result.serverCount).toBe(2)
    })

    it('should handle empty servers array', async () => {
      if (!api?.mcp?.generateInstructions) {
        expect(api?.mcp?.generateInstructions).toBeDefined()
        return
      }

      mockIpcRenderer.invoke.mockResolvedValue({
        instructions: 'No MCP servers detected.',
        serverCount: 0,
      })

      const result = await api.mcp.generateInstructions([])

      expect(result.serverCount).toBe(0)
    })
  })

  // ==========================================================================
  // IPC Channel Constants Tests
  // ==========================================================================

  describe('IPC Channel Constants', () => {
    it('should have PROJECT_WRITE_CONFIG channel defined', async () => {
      const { IPC_CHANNELS } = await import('../../shared/types/ipc')

      // RED PHASE: This should fail because PROJECT_WRITE_CONFIG is not defined
      // Cast to access dynamic property
      const channels = IPC_CHANNELS as Record<string, unknown>
      expect(channels.PROJECT_WRITE_CONFIG).toBeDefined()
      expect(channels.PROJECT_WRITE_CONFIG).toBe('project:writeConfig')
    })

    it('should have PROJECT_CREATE_SCAFFOLD channel defined', async () => {
      const { IPC_CHANNELS } = await import('../../shared/types/ipc')

      // RED PHASE: This should fail because PROJECT_CREATE_SCAFFOLD is not defined
      const channels = IPC_CHANNELS as Record<string, unknown>
      expect(channels.PROJECT_CREATE_SCAFFOLD).toBeDefined()
      expect(channels.PROJECT_CREATE_SCAFFOLD).toBe('project:createScaffold')
    })

    it('should have MCP namespace in IPC_CHANNELS', async () => {
      const { IPC_CHANNELS } = await import('../../shared/types/ipc')

      // RED PHASE: This should fail because MCP namespace is not defined
      const channels = IPC_CHANNELS as Record<string, unknown>
      expect(channels.MCP).toBeDefined()
    })

    it('should have MCP.DETECT channel defined', async () => {
      const { IPC_CHANNELS } = await import('../../shared/types/ipc')

      // RED PHASE: This should fail because MCP.DETECT is not defined
      const channels = IPC_CHANNELS as Record<string, unknown>
      const mcp = channels.MCP as Record<string, unknown> | undefined
      expect(mcp?.DETECT).toBeDefined()
      expect(mcp?.DETECT).toBe('mcp:detect')
    })

    it('should have MCP.INSTALL channel defined', async () => {
      const { IPC_CHANNELS } = await import('../../shared/types/ipc')

      // RED PHASE: This should fail because MCP.INSTALL is not defined
      const channels = IPC_CHANNELS as Record<string, unknown>
      const mcp = channels.MCP as Record<string, unknown> | undefined
      expect(mcp?.INSTALL).toBeDefined()
      expect(mcp?.INSTALL).toBe('mcp:install')
    })

    it('should have MCP.GENERATE_INSTRUCTIONS channel defined', async () => {
      const { IPC_CHANNELS } = await import('../../shared/types/ipc')

      // RED PHASE: This should fail because MCP.GENERATE_INSTRUCTIONS is not defined
      const channels = IPC_CHANNELS as Record<string, unknown>
      const mcp = channels.MCP as Record<string, unknown> | undefined
      expect(mcp?.GENERATE_INSTRUCTIONS).toBeDefined()
      expect(mcp?.GENERATE_INSTRUCTIONS).toBe('mcp:generateInstructions')
    })
  })

  // ==========================================================================
  // ElectronAPI Type Tests
  // ==========================================================================

  describe('ElectronAPI Type Definitions', () => {
    it('should have project.writeConfig in ElectronAPI', () => {
      // RED PHASE: These should fail because the methods are missing
      expect(api).toBeDefined()
      expect(api.project).toBeDefined()
      expect(api.project).toHaveProperty('readConfig') // existing
      expect(api.project).toHaveProperty('writeConfig') // missing
      expect(api.project).toHaveProperty('createScaffold') // missing
    })

    it('should have mcp namespace in ElectronAPI', () => {
      // RED PHASE: This should fail because mcp namespace is missing
      expect(api).toBeDefined()
      expect(api).toHaveProperty('mcp')
      expect(api.mcp).toHaveProperty('detect')
      expect(api.mcp).toHaveProperty('install')
      expect(api.mcp).toHaveProperty('generateInstructions')
    })
  })
})
