/**
 * MCP Handlers - IPC handlers for MCP config detection and installation
 *
 * Provides handlers for:
 * - mcp:detectConfig - Detect existing Claude MCP config file
 * - mcp:readServers - Read mcpServers from config
 * - mcp:backupConfig - Backup config before modification
 * - mcp:addServer - Add new MCP server entry to config
 *
 * MCP Config locations:
 * - macOS: ~/Library/Application Support/Claude/claude_desktop_config.json
 * - Windows: %APPDATA%/Claude/claude_desktop_config.json
 * - Linux: ~/.config/claude/claude_desktop_config.json
 */

import { ipcMain, app } from 'electron'
import path from 'path'
import fs from 'fs'
import os from 'os'

// ============================================================================
// Type Definitions
// ============================================================================

/** MCP Server configuration */
export interface MCPServer {
  command: string
  args?: string[]
  env?: Record<string, string>
}

/** Full MCP config structure */
export interface MCPConfig {
  mcpServers?: Record<string, MCPServer>
  [key: string]: unknown // Allow other config properties
}

/** Result of detecting MCP config */
export interface DetectConfigResult {
  exists: boolean
  path: string | null
  platform: 'darwin' | 'win32' | 'linux'
  error?: string
}

/** Result of reading MCP servers */
export interface ReadServersResult {
  servers: Record<string, MCPServer> | null
  error?: string
}

/** Result of backing up config */
export interface BackupConfigResult {
  success: boolean
  backupPath?: string
  error?: string
}

/** Result of adding an MCP server */
export interface AddServerResult {
  success: boolean
  backupPath?: string
  error?: string
}

/** Options for adding a server */
export interface AddServerOptions {
  name: string
  server: MCPServer
  overwrite?: boolean
}

// ============================================================================
// Validation
// ============================================================================

/** Valid characters for server name (alphanumeric, dash, underscore) */
const SERVER_NAME_PATTERN = /^[a-zA-Z][a-zA-Z0-9_-]*$/

/**
 * Validates server name
 */
function validateServerName(name: string): { valid: boolean; error?: string } {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Server name is required' }
  }

  if (name.trim() === '') {
    return { valid: false, error: 'Server name cannot be empty' }
  }

  if (!SERVER_NAME_PATTERN.test(name)) {
    return {
      valid: false,
      error: 'Server name must start with a letter and contain only letters, numbers, dashes, and underscores',
    }
  }

  return { valid: true }
}

/**
 * Validates MCP server configuration
 */
function validateServer(server: MCPServer): { valid: boolean; error?: string } {
  if (!server || typeof server !== 'object') {
    return { valid: false, error: 'Server configuration is required' }
  }

  if (!server.command || typeof server.command !== 'string' || server.command.trim() === '') {
    return { valid: false, error: 'Server command is required and cannot be empty' }
  }

  if (server.args !== undefined && !Array.isArray(server.args)) {
    return { valid: false, error: 'Server args must be an array' }
  }

  if (server.env !== undefined && (typeof server.env !== 'object' || server.env === null)) {
    return { valid: false, error: 'Server env must be an object' }
  }

  return { valid: true }
}

// ============================================================================
// Path Resolution
// ============================================================================

/**
 * Gets the MCP config file path for the given platform.
 *
 * @param platform - 'darwin' | 'win32' | 'linux'. Defaults to current platform.
 * @returns The absolute path to claude_desktop_config.json
 */
export function getMCPConfigPath(platform?: string): string {
  const currentPlatform = platform || process.platform

  const homePath = os.homedir()

  switch (currentPlatform) {
    case 'darwin':
      // macOS: ~/Library/Application Support/Claude/claude_desktop_config.json
      return path.join(homePath, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json')

    case 'win32':
      // Windows: %APPDATA%/Claude/claude_desktop_config.json
      // Use app.getPath('appData') if available, otherwise fall back to APPDATA env
      try {
        const appDataPath = app.getPath('appData')
        return path.join(appDataPath, 'Claude', 'claude_desktop_config.json')
      } catch {
        // app not ready, use env
        const appData = process.env.APPDATA || path.join(homePath, 'AppData', 'Roaming')
        return path.join(appData, 'Claude', 'claude_desktop_config.json')
      }

    case 'linux':
      // Linux: ~/.config/claude/claude_desktop_config.json
      return path.join(homePath, '.config', 'claude', 'claude_desktop_config.json')

    default:
      // Default to Linux-style path
      return path.join(homePath, '.config', 'claude', 'claude_desktop_config.json')
  }
}

// ============================================================================
// Handler Implementations
// ============================================================================

/**
 * Detects if the MCP config file exists and returns its path
 */
export async function detectMCPConfig(): Promise<DetectConfigResult> {
  const platform = process.platform as 'darwin' | 'win32' | 'linux'
  const configPath = getMCPConfigPath()

  try {
    if (fs.existsSync(configPath)) {
      return {
        exists: true,
        path: configPath,
        platform,
      }
    }

    return {
      exists: false,
      path: null,
      platform,
    }
  } catch (error) {
    return {
      exists: false,
      path: null,
      platform,
      error: error instanceof Error ? error.message : 'Unknown error detecting config',
    }
  }
}

/**
 * Reads the mcpServers from the MCP config file
 */
export async function readMCPServers(): Promise<ReadServersResult> {
  const configPath = getMCPConfigPath()

  try {
    // Check if config exists
    if (!fs.existsSync(configPath)) {
      return { servers: null }
    }

    // Read and parse config
    const content = fs.readFileSync(configPath, 'utf-8')

    if (!content.trim()) {
      return { servers: {} }
    }

    const config = JSON.parse(content) as MCPConfig

    // Return mcpServers or empty object if not present
    return {
      servers: config.mcpServers || {},
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      return {
        servers: null,
        error: `Invalid JSON: ${error.message}`,
      }
    }

    return {
      servers: null,
      error: error instanceof Error ? error.message : 'Unknown error reading servers',
    }
  }
}

/**
 * Creates a backup of the MCP config file
 */
export async function backupMCPConfig(): Promise<BackupConfigResult> {
  const configPath = getMCPConfigPath()

  try {
    // Check if config exists
    if (!fs.existsSync(configPath)) {
      return {
        success: false,
        error: 'No config file exists to backup',
      }
    }

    // Create backup path with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const configDir = path.dirname(configPath)
    const backupPath = path.join(configDir, `claude_desktop_config.backup-${timestamp}.json`)

    // Copy file to backup
    fs.copyFileSync(configPath, backupPath)

    return {
      success: true,
      backupPath,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error creating backup',
    }
  }
}

/**
 * Adds a new MCP server to the config file
 */
export async function addMCPServer(options: AddServerOptions): Promise<AddServerResult> {
  const { name, server, overwrite = false } = options

  // Validate server name
  const nameValidation = validateServerName(name)
  if (!nameValidation.valid) {
    return {
      success: false,
      error: nameValidation.error,
    }
  }

  // Validate server configuration
  const serverValidation = validateServer(server)
  if (!serverValidation.valid) {
    return {
      success: false,
      error: serverValidation.error,
    }
  }

  const configPath = getMCPConfigPath()
  let backupPath: string | undefined
  let existingConfig: MCPConfig = {}

  try {
    // Ensure parent directory exists
    const configDir = path.dirname(configPath)
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true })
    }

    // Read existing config if it exists
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf-8')

      if (content.trim()) {
        try {
          existingConfig = JSON.parse(content) as MCPConfig
        } catch (parseError) {
          return {
            success: false,
            error: `Cannot parse existing config: ${parseError instanceof Error ? parseError.message : 'Invalid JSON'}`,
          }
        }
      }

      // Check if server already exists
      if (existingConfig.mcpServers && name in existingConfig.mcpServers) {
        if (!overwrite) {
          return {
            success: false,
            error: `Server "${name}" already exists. Use overwrite: true to replace.`,
          }
        }
      }

      // Create backup before modification
      const backupResult = await backupMCPConfig()
      if (backupResult.success) {
        backupPath = backupResult.backupPath
      }
    }

    // Initialize mcpServers if not present
    if (!existingConfig.mcpServers) {
      existingConfig.mcpServers = {}
    }

    // Add/update the server
    existingConfig.mcpServers[name] = server

    // Write updated config atomically (write to temp, then rename)
    const tempPath = configPath + '.tmp'
    fs.writeFileSync(tempPath, JSON.stringify(existingConfig, null, 2), 'utf-8')
    fs.renameSync(tempPath, configPath)

    return {
      success: true,
      backupPath,
    }
  } catch (error) {
    // Clean up temp file if it exists
    const tempPath = configPath + '.tmp'
    if (fs.existsSync(tempPath)) {
      try {
        fs.unlinkSync(tempPath)
      } catch {
        // Ignore cleanup errors
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error adding server',
    }
  }
}

// ============================================================================
// IPC Handler Registration
// ============================================================================

/**
 * Registers all MCP-related IPC handlers
 */
export function registerMCPHandlers(): void {
  ipcMain.handle('mcp:detectConfig', async () => {
    return detectMCPConfig()
  })

  ipcMain.handle('mcp:readServers', async () => {
    return readMCPServers()
  })

  ipcMain.handle('mcp:backupConfig', async () => {
    return backupMCPConfig()
  })

  ipcMain.handle('mcp:addServer', async (_event, options: AddServerOptions) => {
    return addMCPServer(options)
  })
}
