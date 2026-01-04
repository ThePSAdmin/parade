/**
 * MCP Recommendation Engine
 *
 * Service that maps project stack selections to MCP (Model Context Protocol)
 * server recommendations with rationale.
 *
 * MCP Recommendation Matrix:
 * - Frontend (React/Next/Vue) -> filesystem MCP
 * - Database/Supabase -> supabase MCP
 * - Mobile/Swift -> filesystem MCP
 * - All projects -> github MCP (optional)
 */

// ============================================================================
// Type Definitions
// ============================================================================

/** Stack type identifiers from project.yaml */
export type StackType =
  | 'frontend'
  | 'backend'
  | 'database'
  | 'mobile'
  | 'api'
  | 'infrastructure'

/** Known framework identifiers */
export type Framework =
  | 'react'
  | 'next'
  | 'vue'
  | 'angular'
  | 'svelte'
  | 'electron'
  | 'swift'
  | 'kotlin'
  | 'flutter'
  | 'express'
  | 'fastify'
  | 'supabase'
  | 'postgres'
  | 'mysql'
  | 'sqlite'
  | 'mongodb'
  | 'prisma'

/** MCP server identifiers */
export type McpServer =
  | 'filesystem'
  | 'supabase'
  | 'github'
  | 'postgres'
  | 'sqlite'
  | 'memory'
  | 'brave-search'
  | 'puppeteer'

/** Priority level for recommendations */
export type RecommendationPriority = 'required' | 'recommended' | 'optional'

/** A single MCP recommendation with rationale */
export interface McpRecommendation {
  server: McpServer
  priority: RecommendationPriority
  rationale: string
  configExample?: Record<string, unknown>
}

/** Stack information from project config */
export interface StackInfo {
  type: StackType
  framework?: string
  language?: string
  database?: string
}

/** Result of generating recommendations */
export interface RecommendationResult {
  recommendations: McpRecommendation[]
  stacksAnalyzed: StackInfo[]
  warnings?: string[]
}

/** Filter options for recommendations */
export interface RecommendationFilter {
  priority?: RecommendationPriority | RecommendationPriority[]
  servers?: McpServer[]
  excludeServers?: McpServer[]
}

// ============================================================================
// MCP Mapping Configuration
// ============================================================================

/**
 * Mapping from framework names to recommended MCP servers.
 * Each framework can map to multiple MCP servers.
 */
export const MCP_MAPPING: Record<string, McpServer[]> = {
  // Frontend frameworks -> filesystem
  react: ['filesystem'],
  next: ['filesystem'],
  vue: ['filesystem'],
  angular: ['filesystem'],
  svelte: ['filesystem'],
  electron: ['filesystem'],

  // Database frameworks -> specific database MCPs
  supabase: ['supabase'],
  postgres: ['postgres'],
  postgresql: ['postgres'],
  mysql: ['postgres'], // Generic SQL handling
  sqlite: ['sqlite'],
  mongodb: ['memory'], // Memory for document-like operations
  prisma: ['postgres', 'sqlite'],

  // Mobile frameworks -> filesystem
  swift: ['filesystem'],
  kotlin: ['filesystem'],
  flutter: ['filesystem'],

  // Backend frameworks -> filesystem
  express: ['filesystem'],
  fastify: ['filesystem'],
  nestjs: ['filesystem'],
  koa: ['filesystem'],
}

/**
 * Rationale templates for each MCP server type.
 */
const RATIONALE_TEMPLATES: Record<McpServer, (framework?: string) => string> = {
  filesystem: (framework) =>
    framework
      ? `Enables file system operations for ${framework} development, allowing Claude to read, write, and manage project files.`
      : `Enables file system operations for project file management.`,
  supabase: () =>
    `Provides direct integration with Supabase database and auth services for seamless backend development.`,
  github: () =>
    `Allows Claude to interact with GitHub repositories, issues, and pull requests for enhanced project management.`,
  postgres: (framework) =>
    `Enables direct PostgreSQL database operations${framework ? ` for ${framework} projects` : ''}, allowing schema inspection and query execution.`,
  sqlite: () =>
    `Provides SQLite database access for local development and testing workflows.`,
  memory: () =>
    `Offers in-memory data storage for rapid prototyping and session state management.`,
  'brave-search': () =>
    `Enables web search capabilities for research and documentation lookup during development.`,
  puppeteer: () =>
    `Provides browser automation for testing, screenshots, and web scraping tasks.`,
}

/**
 * Default priority for each MCP server type.
 */
const DEFAULT_PRIORITIES: Record<McpServer, RecommendationPriority> = {
  filesystem: 'recommended',
  supabase: 'recommended',
  github: 'optional',
  postgres: 'recommended',
  sqlite: 'recommended',
  memory: 'optional',
  'brave-search': 'optional',
  puppeteer: 'optional',
}

/**
 * Configuration examples for each MCP server type.
 */
const CONFIG_EXAMPLES: Record<McpServer, Record<string, unknown> | undefined> = {
  filesystem: {
    command: 'npx',
    args: ['-y', '@anthropic/mcp-server-filesystem'],
    env: {
      ALLOWED_PATHS: '/path/to/project',
    },
  },
  supabase: {
    command: 'npx',
    args: ['-y', '@supabase/mcp-server-supabase'],
    env: {
      SUPABASE_URL: 'your-project-url',
      SUPABASE_KEY: 'your-anon-key',
    },
  },
  github: {
    command: 'npx',
    args: ['-y', '@anthropic/mcp-server-github'],
    env: {
      GITHUB_TOKEN: 'your-github-token',
    },
  },
  postgres: {
    command: 'npx',
    args: ['-y', '@anthropic/mcp-server-postgres'],
    env: {
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
    },
  },
  sqlite: {
    command: 'npx',
    args: ['-y', '@anthropic/mcp-server-sqlite'],
    env: {
      DATABASE_PATH: './database.sqlite',
    },
  },
  memory: {
    command: 'npx',
    args: ['-y', '@anthropic/mcp-server-memory'],
  },
  'brave-search': {
    command: 'npx',
    args: ['-y', '@anthropic/mcp-server-brave-search'],
    env: {
      BRAVE_API_KEY: 'your-brave-api-key',
    },
  },
  puppeteer: {
    command: 'npx',
    args: ['-y', '@anthropic/mcp-server-puppeteer'],
  },
}

/**
 * Stack type to default MCP server mappings (when no framework is specified).
 */
const STACK_TYPE_DEFAULTS: Record<StackType, McpServer[]> = {
  frontend: ['filesystem'],
  backend: ['filesystem'],
  database: ['postgres'],
  mobile: ['filesystem'],
  api: ['filesystem'],
  infrastructure: ['filesystem'],
}

// ============================================================================
// MCP Recommendation Engine Class
// ============================================================================

/**
 * Engine for generating MCP server recommendations based on project stack.
 */
export class McpRecommendationEngine {
  /**
   * Generate recommendations for a list of stacks.
   */
  getRecommendationsForStacks(stacks: StackInfo[]): RecommendationResult {
    const recommendations = new Map<McpServer, McpRecommendation>()
    const warnings: string[] = []
    const stacksAnalyzed = [...stacks]

    // Process each stack
    for (const stack of stacks) {
      const frameworkRecs = this.getRecommendationsForStack(stack, warnings)
      for (const rec of frameworkRecs) {
        // Deduplicate: keep recommendation with higher priority
        const existing = recommendations.get(rec.server)
        if (!existing || this.comparePriority(rec.priority, existing.priority) > 0) {
          recommendations.set(rec.server, rec)
        }
      }
    }

    // Always add default recommendations
    const defaults = this.getDefaultRecommendations()
    for (const def of defaults) {
      if (!recommendations.has(def.server)) {
        recommendations.set(def.server, def)
      }
    }

    return {
      recommendations: Array.from(recommendations.values()),
      stacksAnalyzed,
      warnings: warnings.length > 0 ? warnings : undefined,
    }
  }

  /**
   * Get recommendations for a single stack.
   */
  private getRecommendationsForStack(stack: StackInfo, warnings: string[]): McpRecommendation[] {
    const recommendations: McpRecommendation[] = []

    if (stack.framework) {
      const normalizedFramework = stack.framework.toLowerCase()
      const mcpServers = MCP_MAPPING[normalizedFramework]

      if (mcpServers) {
        for (const server of mcpServers) {
          recommendations.push(this.createRecommendation(server, normalizedFramework))
        }
      } else {
        warnings.push(`Unrecognized framework: ${stack.framework}. Using defaults for ${stack.type} stack type.`)
        // Fall back to stack type defaults
        const defaultServers = STACK_TYPE_DEFAULTS[stack.type] || []
        for (const server of defaultServers) {
          recommendations.push(this.createRecommendation(server))
        }
      }
    } else {
      // No framework specified, use stack type defaults
      const defaultServers = STACK_TYPE_DEFAULTS[stack.type] || []
      for (const server of defaultServers) {
        recommendations.push(this.createRecommendation(server))
      }
    }

    return recommendations
  }

  /**
   * Get recommendations for a specific framework.
   */
  getRecommendationsForFramework(framework: string): McpRecommendation[] {
    if (!framework) {
      return []
    }

    const normalizedFramework = framework.toLowerCase()
    const mcpServers = MCP_MAPPING[normalizedFramework]

    if (!mcpServers) {
      return []
    }

    return mcpServers.map((server) => this.createRecommendation(server, normalizedFramework))
  }

  /**
   * Get default recommendations that apply to all projects.
   */
  getDefaultRecommendations(): McpRecommendation[] {
    return [
      {
        server: 'github',
        priority: 'optional',
        rationale: RATIONALE_TEMPLATES.github(),
        configExample: CONFIG_EXAMPLES.github,
      },
    ]
  }

  /**
   * Filter recommendations based on criteria.
   */
  filterRecommendations(
    recommendations: McpRecommendation[],
    filter: RecommendationFilter
  ): McpRecommendation[] {
    let filtered = [...recommendations]

    // Filter by priority
    if (filter.priority) {
      const priorities = Array.isArray(filter.priority) ? filter.priority : [filter.priority]
      filtered = filtered.filter((rec) => priorities.includes(rec.priority))
    }

    // Filter by specific servers (include list)
    if (filter.servers && filter.servers.length > 0) {
      filtered = filtered.filter((rec) => filter.servers!.includes(rec.server))
    }

    // Filter by excluded servers
    if (filter.excludeServers && filter.excludeServers.length > 0) {
      filtered = filtered.filter((rec) => !filter.excludeServers!.includes(rec.server))
    }

    return filtered
  }

  /**
   * Map a framework name to its primary MCP server.
   */
  mapFrameworkToMcp(framework: string): McpServer | null {
    if (!framework || typeof framework !== 'string') {
      return null
    }

    const normalizedFramework = framework.toLowerCase().trim()
    if (!normalizedFramework) {
      return null
    }

    const mcpServers = MCP_MAPPING[normalizedFramework]
    return mcpServers && mcpServers.length > 0 ? mcpServers[0] : null
  }

  /**
   * Create a recommendation object for an MCP server.
   */
  private createRecommendation(server: McpServer, framework?: string): McpRecommendation {
    return {
      server,
      priority: DEFAULT_PRIORITIES[server] || 'optional',
      rationale: RATIONALE_TEMPLATES[server](framework),
      configExample: CONFIG_EXAMPLES[server],
    }
  }

  /**
   * Compare two priority levels. Returns positive if a > b, negative if a < b, 0 if equal.
   */
  private comparePriority(a: RecommendationPriority, b: RecommendationPriority): number {
    const priorityOrder: Record<RecommendationPriority, number> = {
      required: 3,
      recommended: 2,
      optional: 1,
    }
    return priorityOrder[a] - priorityOrder[b]
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

/**
 * Singleton instance of the MCP recommendation engine.
 */
export const mcpRecommendationEngine = new McpRecommendationEngine()

export default mcpRecommendationEngine
