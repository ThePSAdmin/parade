/**
 * MCP Recommendation Engine Tests - TDD RED Phase
 *
 * Tests for the MCP recommendation engine that maps project stacks to recommended
 * MCP (Model Context Protocol) servers.
 *
 * MCP Recommendation Matrix:
 * - Frontend (React/Next/Vue) -> filesystem MCP
 * - Database/Supabase -> supabase MCP
 * - Mobile/Swift -> filesystem MCP
 * - All projects -> github MCP (optional)
 *
 * NOTE: These tests are expected to FAIL because the engine does not exist yet.
 * This is the TDD RED phase.
 *
 * When the engine is implemented at src/main/services/mcpRecommendationEngine.ts,
 * these tests will guide the implementation to ensure:
 * 1. Module exports are correct
 * 2. Stack-to-MCP mapping works as specified
 * 3. Recommendations include rationale
 * 4. Multiple stack combinations are handled
 * 5. Default recommendations are provided
 * 6. Recommendation filtering is supported
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ============================================================================
// Type Definitions for MCP Recommendation Engine (to be implemented)
// ============================================================================

/** Stack type identifiers from project.yaml */
type StackType =
  | 'frontend'
  | 'backend'
  | 'database'
  | 'mobile'
  | 'api'
  | 'infrastructure'

/** Known framework identifiers */
type Framework =
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
type McpServer =
  | 'filesystem'
  | 'supabase'
  | 'github'
  | 'postgres'
  | 'sqlite'
  | 'memory'
  | 'brave-search'
  | 'puppeteer'

/** Priority level for recommendations */
type RecommendationPriority = 'required' | 'recommended' | 'optional'

/** A single MCP recommendation with rationale */
interface McpRecommendation {
  server: McpServer
  priority: RecommendationPriority
  rationale: string
  configExample?: Record<string, unknown>
}

/** Stack information from project config */
interface StackInfo {
  type: StackType
  framework?: string
  language?: string
  database?: string
}

/** Result of generating recommendations */
interface RecommendationResult {
  recommendations: McpRecommendation[]
  stacksAnalyzed: StackInfo[]
  warnings?: string[]
}

/** Filter options for recommendations */
interface RecommendationFilter {
  priority?: RecommendationPriority | RecommendationPriority[]
  servers?: McpServer[]
  excludeServers?: McpServer[]
}

/** Expected MCP recommendation engine interface */
interface IMcpRecommendationEngine {
  getRecommendationsForStacks(stacks: StackInfo[]): RecommendationResult
  getRecommendationsForFramework(framework: string): McpRecommendation[]
  getDefaultRecommendations(): McpRecommendation[]
  filterRecommendations(
    recommendations: McpRecommendation[],
    filter: RecommendationFilter
  ): McpRecommendation[]
  mapFrameworkToMcp(framework: string): McpServer | null
}

// ============================================================================
// Module Import
// ============================================================================

import {
  mcpRecommendationEngine as importedEngine,
  McpRecommendationEngine as ImportedClass,
  MCP_MAPPING as importedMapping,
} from '../mcpRecommendationEngine'

/**
 * Returns the module exports.
 */
function tryImportMcpRecommendationEngine(): {
  mcpRecommendationEngine: IMcpRecommendationEngine
  McpRecommendationEngine: new () => IMcpRecommendationEngine
  MCP_MAPPING: Record<string, McpServer[]>
} | null {
  return {
    mcpRecommendationEngine: importedEngine as IMcpRecommendationEngine,
    McpRecommendationEngine: ImportedClass as unknown as new () => IMcpRecommendationEngine,
    MCP_MAPPING: importedMapping,
  }
}

// ============================================================================
// Tests
// ============================================================================

describe('McpRecommendationEngine', () => {
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
    it('should have MCP recommendation engine module at src/main/services/mcpRecommendationEngine.ts', () => {
      const module = tryImportMcpRecommendationEngine()

      // RED PHASE: This will fail because the module doesn't exist
      expect(module).not.toBeNull()
    })

    it('should export mcpRecommendationEngine singleton instance', () => {
      const module = tryImportMcpRecommendationEngine()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      expect(module.mcpRecommendationEngine).toBeDefined()
      expect(typeof module.mcpRecommendationEngine).toBe('object')
    })

    it('should export McpRecommendationEngine class', () => {
      const module = tryImportMcpRecommendationEngine()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      expect(module.McpRecommendationEngine).toBeDefined()
      expect(typeof module.McpRecommendationEngine).toBe('function')
    })

    it('should export MCP_MAPPING constant', () => {
      const module = tryImportMcpRecommendationEngine()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      expect(module.MCP_MAPPING).toBeDefined()
      expect(typeof module.MCP_MAPPING).toBe('object')
    })
  })

  // ==========================================================================
  // Stack-to-MCP Mapping Tests
  // ==========================================================================

  describe('Stack-to-MCP Mapping', () => {
    describe('Frontend frameworks', () => {
      it('should recommend filesystem MCP for React projects', () => {
        const module = tryImportMcpRecommendationEngine()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        const stacks: StackInfo[] = [
          { type: 'frontend', framework: 'react', language: 'typescript' },
        ]

        const result = module.mcpRecommendationEngine.getRecommendationsForStacks(stacks)

        expect(result.recommendations).toBeDefined()
        expect(result.recommendations.some((r) => r.server === 'filesystem')).toBe(true)
      })

      it('should recommend filesystem MCP for Next.js projects', () => {
        const module = tryImportMcpRecommendationEngine()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        const stacks: StackInfo[] = [
          { type: 'frontend', framework: 'next', language: 'typescript' },
        ]

        const result = module.mcpRecommendationEngine.getRecommendationsForStacks(stacks)

        expect(result.recommendations.some((r) => r.server === 'filesystem')).toBe(true)
      })

      it('should recommend filesystem MCP for Vue projects', () => {
        const module = tryImportMcpRecommendationEngine()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        const stacks: StackInfo[] = [
          { type: 'frontend', framework: 'vue', language: 'typescript' },
        ]

        const result = module.mcpRecommendationEngine.getRecommendationsForStacks(stacks)

        expect(result.recommendations.some((r) => r.server === 'filesystem')).toBe(true)
      })

      it('should recommend filesystem MCP for Electron projects', () => {
        const module = tryImportMcpRecommendationEngine()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        const stacks: StackInfo[] = [
          { type: 'frontend', framework: 'electron', language: 'typescript' },
        ]

        const result = module.mcpRecommendationEngine.getRecommendationsForStacks(stacks)

        expect(result.recommendations.some((r) => r.server === 'filesystem')).toBe(true)
      })
    })

    describe('Database frameworks', () => {
      it('should recommend supabase MCP for Supabase projects', () => {
        const module = tryImportMcpRecommendationEngine()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        const stacks: StackInfo[] = [
          { type: 'database', framework: 'supabase' },
        ]

        const result = module.mcpRecommendationEngine.getRecommendationsForStacks(stacks)

        expect(result.recommendations.some((r) => r.server === 'supabase')).toBe(true)
      })

      it('should recommend postgres MCP for PostgreSQL projects', () => {
        const module = tryImportMcpRecommendationEngine()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        const stacks: StackInfo[] = [
          { type: 'database', framework: 'postgres' },
        ]

        const result = module.mcpRecommendationEngine.getRecommendationsForStacks(stacks)

        expect(result.recommendations.some((r) => r.server === 'postgres')).toBe(true)
      })

      it('should recommend sqlite MCP for SQLite projects', () => {
        const module = tryImportMcpRecommendationEngine()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        const stacks: StackInfo[] = [
          { type: 'database', framework: 'sqlite' },
        ]

        const result = module.mcpRecommendationEngine.getRecommendationsForStacks(stacks)

        expect(result.recommendations.some((r) => r.server === 'sqlite')).toBe(true)
      })
    })

    describe('Mobile frameworks', () => {
      it('should recommend filesystem MCP for Swift projects', () => {
        const module = tryImportMcpRecommendationEngine()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        const stacks: StackInfo[] = [
          { type: 'mobile', framework: 'swift', language: 'swift' },
        ]

        const result = module.mcpRecommendationEngine.getRecommendationsForStacks(stacks)

        expect(result.recommendations.some((r) => r.server === 'filesystem')).toBe(true)
      })

      it('should recommend filesystem MCP for Flutter projects', () => {
        const module = tryImportMcpRecommendationEngine()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        const stacks: StackInfo[] = [
          { type: 'mobile', framework: 'flutter', language: 'dart' },
        ]

        const result = module.mcpRecommendationEngine.getRecommendationsForStacks(stacks)

        expect(result.recommendations.some((r) => r.server === 'filesystem')).toBe(true)
      })
    })

    describe('Direct framework mapping', () => {
      it('should map react framework to filesystem MCP', () => {
        const module = tryImportMcpRecommendationEngine()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        const result = module.mcpRecommendationEngine.mapFrameworkToMcp('react')

        expect(result).toBe('filesystem')
      })

      it('should map supabase framework to supabase MCP', () => {
        const module = tryImportMcpRecommendationEngine()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        const result = module.mcpRecommendationEngine.mapFrameworkToMcp('supabase')

        expect(result).toBe('supabase')
      })

      it('should return null for unknown frameworks', () => {
        const module = tryImportMcpRecommendationEngine()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        const result = module.mcpRecommendationEngine.mapFrameworkToMcp('unknown-framework')

        expect(result).toBeNull()
      })

      it('should handle case-insensitive framework names', () => {
        const module = tryImportMcpRecommendationEngine()

        if (!module) {
          expect(module).not.toBeNull()
          return
        }

        const result1 = module.mcpRecommendationEngine.mapFrameworkToMcp('React')
        const result2 = module.mcpRecommendationEngine.mapFrameworkToMcp('REACT')

        expect(result1).toBe('filesystem')
        expect(result2).toBe('filesystem')
      })
    })
  })

  // ==========================================================================
  // Recommendations Include Rationale Tests
  // ==========================================================================

  describe('Recommendations Include Rationale', () => {
    it('should include rationale for each recommendation', () => {
      const module = tryImportMcpRecommendationEngine()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      const stacks: StackInfo[] = [
        { type: 'frontend', framework: 'react', language: 'typescript' },
      ]

      const result = module.mcpRecommendationEngine.getRecommendationsForStacks(stacks)

      for (const recommendation of result.recommendations) {
        expect(recommendation.rationale).toBeDefined()
        expect(typeof recommendation.rationale).toBe('string')
        expect(recommendation.rationale.length).toBeGreaterThan(0)
      }
    })

    it('should include meaningful rationale explaining why MCP is recommended', () => {
      const module = tryImportMcpRecommendationEngine()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      const stacks: StackInfo[] = [
        { type: 'database', framework: 'supabase' },
      ]

      const result = module.mcpRecommendationEngine.getRecommendationsForStacks(stacks)

      const supabaseRec = result.recommendations.find((r) => r.server === 'supabase')

      expect(supabaseRec).toBeDefined()
      // Rationale should mention something about database or Supabase
      expect(
        supabaseRec!.rationale.toLowerCase().includes('database') ||
          supabaseRec!.rationale.toLowerCase().includes('supabase')
      ).toBe(true)
    })

    it('should include priority level for each recommendation', () => {
      const module = tryImportMcpRecommendationEngine()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      const stacks: StackInfo[] = [
        { type: 'frontend', framework: 'next', language: 'typescript' },
      ]

      const result = module.mcpRecommendationEngine.getRecommendationsForStacks(stacks)

      for (const recommendation of result.recommendations) {
        expect(recommendation.priority).toBeDefined()
        expect(['required', 'recommended', 'optional']).toContain(recommendation.priority)
      }
    })

    it('should optionally include config example for recommendations', () => {
      const module = tryImportMcpRecommendationEngine()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      const stacks: StackInfo[] = [
        { type: 'database', framework: 'supabase' },
      ]

      const result = module.mcpRecommendationEngine.getRecommendationsForStacks(stacks)

      const supabaseRec = result.recommendations.find((r) => r.server === 'supabase')

      // Config example is optional but if present should be an object
      if (supabaseRec?.configExample) {
        expect(typeof supabaseRec.configExample).toBe('object')
      }
    })
  })

  // ==========================================================================
  // Multiple Stack Combinations Tests
  // ==========================================================================

  describe('Multiple Stack Combinations', () => {
    it('should handle multiple stacks and combine recommendations', () => {
      const module = tryImportMcpRecommendationEngine()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      const stacks: StackInfo[] = [
        { type: 'frontend', framework: 'react', language: 'typescript' },
        { type: 'database', framework: 'supabase' },
      ]

      const result = module.mcpRecommendationEngine.getRecommendationsForStacks(stacks)

      // Should recommend both filesystem (for React) and supabase (for DB)
      expect(result.recommendations.some((r) => r.server === 'filesystem')).toBe(true)
      expect(result.recommendations.some((r) => r.server === 'supabase')).toBe(true)
    })

    it('should deduplicate recommendations from multiple stacks', () => {
      const module = tryImportMcpRecommendationEngine()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      const stacks: StackInfo[] = [
        { type: 'frontend', framework: 'react', language: 'typescript' },
        { type: 'frontend', framework: 'vue', language: 'typescript' },
      ]

      const result = module.mcpRecommendationEngine.getRecommendationsForStacks(stacks)

      // Both React and Vue recommend filesystem, but should only appear once
      const filesystemRecs = result.recommendations.filter((r) => r.server === 'filesystem')
      expect(filesystemRecs.length).toBe(1)
    })

    it('should track which stacks were analyzed in result', () => {
      const module = tryImportMcpRecommendationEngine()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      const stacks: StackInfo[] = [
        { type: 'frontend', framework: 'react', language: 'typescript' },
        { type: 'database', framework: 'postgres' },
      ]

      const result = module.mcpRecommendationEngine.getRecommendationsForStacks(stacks)

      expect(result.stacksAnalyzed).toBeDefined()
      expect(result.stacksAnalyzed.length).toBe(2)
      expect(result.stacksAnalyzed[0].framework).toBe('react')
      expect(result.stacksAnalyzed[1].framework).toBe('postgres')
    })

    it('should handle complex multi-stack projects', () => {
      const module = tryImportMcpRecommendationEngine()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      const stacks: StackInfo[] = [
        { type: 'frontend', framework: 'next', language: 'typescript' },
        { type: 'backend', framework: 'express', language: 'typescript' },
        { type: 'database', framework: 'supabase' },
        { type: 'mobile', framework: 'swift', language: 'swift' },
      ]

      const result = module.mcpRecommendationEngine.getRecommendationsForStacks(stacks)

      // Should have recommendations from multiple stack types
      expect(result.recommendations.length).toBeGreaterThanOrEqual(2)
      expect(result.stacksAnalyzed.length).toBe(4)
    })

    it('should include github MCP as optional for all multi-stack projects', () => {
      const module = tryImportMcpRecommendationEngine()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      const stacks: StackInfo[] = [
        { type: 'frontend', framework: 'react', language: 'typescript' },
        { type: 'database', framework: 'postgres' },
      ]

      const result = module.mcpRecommendationEngine.getRecommendationsForStacks(stacks)

      const githubRec = result.recommendations.find((r) => r.server === 'github')
      expect(githubRec).toBeDefined()
      expect(githubRec!.priority).toBe('optional')
    })
  })

  // ==========================================================================
  // Default Recommendations Tests
  // ==========================================================================

  describe('Default Recommendations', () => {
    it('should provide default recommendations', () => {
      const module = tryImportMcpRecommendationEngine()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      const defaults = module.mcpRecommendationEngine.getDefaultRecommendations()

      expect(defaults).toBeDefined()
      expect(Array.isArray(defaults)).toBe(true)
      expect(defaults.length).toBeGreaterThan(0)
    })

    it('should include github MCP in default recommendations', () => {
      const module = tryImportMcpRecommendationEngine()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      const defaults = module.mcpRecommendationEngine.getDefaultRecommendations()

      const githubRec = defaults.find((r) => r.server === 'github')
      expect(githubRec).toBeDefined()
    })

    it('should mark github MCP as optional in defaults', () => {
      const module = tryImportMcpRecommendationEngine()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      const defaults = module.mcpRecommendationEngine.getDefaultRecommendations()

      const githubRec = defaults.find((r) => r.server === 'github')
      expect(githubRec?.priority).toBe('optional')
    })

    it('should return defaults when no stacks are provided', () => {
      const module = tryImportMcpRecommendationEngine()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      const result = module.mcpRecommendationEngine.getRecommendationsForStacks([])

      expect(result.recommendations.length).toBeGreaterThan(0)
      // Should at least include github as default
      expect(result.recommendations.some((r) => r.server === 'github')).toBe(true)
    })

    it('should have rationale for all default recommendations', () => {
      const module = tryImportMcpRecommendationEngine()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      const defaults = module.mcpRecommendationEngine.getDefaultRecommendations()

      for (const rec of defaults) {
        expect(rec.rationale).toBeDefined()
        expect(rec.rationale.length).toBeGreaterThan(0)
      }
    })
  })

  // ==========================================================================
  // Recommendation Filtering Tests
  // ==========================================================================

  describe('Recommendation Filtering', () => {
    it('should filter by single priority level', () => {
      const module = tryImportMcpRecommendationEngine()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      const stacks: StackInfo[] = [
        { type: 'frontend', framework: 'react', language: 'typescript' },
        { type: 'database', framework: 'supabase' },
      ]

      const allRecs = module.mcpRecommendationEngine.getRecommendationsForStacks(stacks)
      const filtered = module.mcpRecommendationEngine.filterRecommendations(
        allRecs.recommendations,
        { priority: 'required' }
      )

      // All filtered recommendations should have required priority
      for (const rec of filtered) {
        expect(rec.priority).toBe('required')
      }
    })

    it('should filter by multiple priority levels', () => {
      const module = tryImportMcpRecommendationEngine()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      const stacks: StackInfo[] = [
        { type: 'frontend', framework: 'react', language: 'typescript' },
        { type: 'database', framework: 'supabase' },
      ]

      const allRecs = module.mcpRecommendationEngine.getRecommendationsForStacks(stacks)
      const filtered = module.mcpRecommendationEngine.filterRecommendations(
        allRecs.recommendations,
        { priority: ['required', 'recommended'] }
      )

      // All filtered should be either required or recommended
      for (const rec of filtered) {
        expect(['required', 'recommended']).toContain(rec.priority)
      }
    })

    it('should filter by specific servers', () => {
      const module = tryImportMcpRecommendationEngine()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      const stacks: StackInfo[] = [
        { type: 'frontend', framework: 'react', language: 'typescript' },
        { type: 'database', framework: 'supabase' },
      ]

      const allRecs = module.mcpRecommendationEngine.getRecommendationsForStacks(stacks)
      const filtered = module.mcpRecommendationEngine.filterRecommendations(
        allRecs.recommendations,
        { servers: ['filesystem'] }
      )

      // Should only include filesystem
      expect(filtered.every((r) => r.server === 'filesystem')).toBe(true)
    })

    it('should exclude specific servers', () => {
      const module = tryImportMcpRecommendationEngine()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      const stacks: StackInfo[] = [
        { type: 'frontend', framework: 'react', language: 'typescript' },
        { type: 'database', framework: 'supabase' },
      ]

      const allRecs = module.mcpRecommendationEngine.getRecommendationsForStacks(stacks)
      const filtered = module.mcpRecommendationEngine.filterRecommendations(
        allRecs.recommendations,
        { excludeServers: ['github'] }
      )

      // Should not include github
      expect(filtered.every((r) => r.server !== 'github')).toBe(true)
    })

    it('should combine multiple filter criteria', () => {
      const module = tryImportMcpRecommendationEngine()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      const stacks: StackInfo[] = [
        { type: 'frontend', framework: 'react', language: 'typescript' },
        { type: 'database', framework: 'supabase' },
      ]

      const allRecs = module.mcpRecommendationEngine.getRecommendationsForStacks(stacks)
      const filtered = module.mcpRecommendationEngine.filterRecommendations(
        allRecs.recommendations,
        {
          priority: ['required', 'recommended'],
          excludeServers: ['github'],
        }
      )

      for (const rec of filtered) {
        expect(['required', 'recommended']).toContain(rec.priority)
        expect(rec.server).not.toBe('github')
      }
    })

    it('should return empty array when no recommendations match filter', () => {
      const module = tryImportMcpRecommendationEngine()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      const stacks: StackInfo[] = [
        { type: 'frontend', framework: 'react', language: 'typescript' },
      ]

      const allRecs = module.mcpRecommendationEngine.getRecommendationsForStacks(stacks)
      const filtered = module.mcpRecommendationEngine.filterRecommendations(
        allRecs.recommendations,
        { servers: ['supabase'] } // React doesn't need supabase
      )

      expect(filtered.length).toBe(0)
    })

    it('should return all recommendations when filter is empty', () => {
      const module = tryImportMcpRecommendationEngine()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      const stacks: StackInfo[] = [
        { type: 'frontend', framework: 'react', language: 'typescript' },
      ]

      const allRecs = module.mcpRecommendationEngine.getRecommendationsForStacks(stacks)
      const filtered = module.mcpRecommendationEngine.filterRecommendations(
        allRecs.recommendations,
        {}
      )

      expect(filtered.length).toBe(allRecs.recommendations.length)
    })
  })

  // ==========================================================================
  // Edge Cases and Error Handling Tests
  // ==========================================================================

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty stacks array', () => {
      const module = tryImportMcpRecommendationEngine()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      const result = module.mcpRecommendationEngine.getRecommendationsForStacks([])

      expect(result.recommendations).toBeDefined()
      expect(result.stacksAnalyzed).toEqual([])
    })

    it('should handle stacks with missing framework', () => {
      const module = tryImportMcpRecommendationEngine()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      const stacks: StackInfo[] = [
        { type: 'frontend' }, // No framework specified
      ]

      const result = module.mcpRecommendationEngine.getRecommendationsForStacks(stacks)

      // Should still provide some recommendations based on type
      expect(result.recommendations).toBeDefined()
    })

    it('should include warnings for unrecognized frameworks', () => {
      const module = tryImportMcpRecommendationEngine()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      const stacks: StackInfo[] = [
        { type: 'frontend', framework: 'unknown-framework', language: 'typescript' },
      ]

      const result = module.mcpRecommendationEngine.getRecommendationsForStacks(stacks)

      expect(result.warnings).toBeDefined()
      expect(result.warnings!.length).toBeGreaterThan(0)
      expect(result.warnings!.some((w) => w.includes('unknown-framework'))).toBe(true)
    })

    it('should handle null or undefined framework gracefully', () => {
      const module = tryImportMcpRecommendationEngine()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      // Should not throw
      const result1 = module.mcpRecommendationEngine.mapFrameworkToMcp(null as unknown as string)
      const result2 = module.mcpRecommendationEngine.mapFrameworkToMcp(undefined as unknown as string)

      expect(result1).toBeNull()
      expect(result2).toBeNull()
    })

    it('should handle empty string framework', () => {
      const module = tryImportMcpRecommendationEngine()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      const result = module.mcpRecommendationEngine.mapFrameworkToMcp('')

      expect(result).toBeNull()
    })
  })

  // ==========================================================================
  // MCP_MAPPING Constant Tests
  // ==========================================================================

  describe('MCP_MAPPING Constant', () => {
    it('should contain mapping for frontend frameworks', () => {
      const module = tryImportMcpRecommendationEngine()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      expect(module.MCP_MAPPING).toHaveProperty('react')
      expect(module.MCP_MAPPING).toHaveProperty('next')
      expect(module.MCP_MAPPING).toHaveProperty('vue')
    })

    it('should contain mapping for database frameworks', () => {
      const module = tryImportMcpRecommendationEngine()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      expect(module.MCP_MAPPING).toHaveProperty('supabase')
      expect(module.MCP_MAPPING).toHaveProperty('postgres')
      expect(module.MCP_MAPPING).toHaveProperty('sqlite')
    })

    it('should contain mapping for mobile frameworks', () => {
      const module = tryImportMcpRecommendationEngine()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      expect(module.MCP_MAPPING).toHaveProperty('swift')
      expect(module.MCP_MAPPING).toHaveProperty('flutter')
    })

    it('should have arrays of MCP servers for each framework', () => {
      const module = tryImportMcpRecommendationEngine()

      if (!module) {
        expect(module).not.toBeNull()
        return
      }

      for (const [framework, servers] of Object.entries(module.MCP_MAPPING)) {
        expect(Array.isArray(servers)).toBe(true)
        expect(servers.length).toBeGreaterThan(0)
      }
    })
  })
})

// ============================================================================
// Type Integration Tests
// ============================================================================

describe('MCP Recommendation Types', () => {
  it('should define McpRecommendation interface correctly', () => {
    const module = tryImportMcpRecommendationEngine()

    if (!module) {
      expect(module).not.toBeNull()
      return
    }

    // Validate the expected type structure compiles
    const recommendation: McpRecommendation = {
      server: 'filesystem',
      priority: 'recommended',
      rationale: 'Enables file system operations for React development',
    }

    expect(recommendation.server).toBe('filesystem')
    expect(recommendation.priority).toBe('recommended')
    expect(recommendation.rationale).toBeDefined()
  })

  it('should define RecommendationResult interface correctly', () => {
    const module = tryImportMcpRecommendationEngine()

    if (!module) {
      expect(module).not.toBeNull()
      return
    }

    const result: RecommendationResult = {
      recommendations: [
        {
          server: 'filesystem',
          priority: 'recommended',
          rationale: 'Test rationale',
        },
      ],
      stacksAnalyzed: [
        { type: 'frontend', framework: 'react', language: 'typescript' },
      ],
      warnings: [],
    }

    expect(result.recommendations).toBeDefined()
    expect(result.stacksAnalyzed).toBeDefined()
    expect(Array.isArray(result.warnings)).toBe(true)
  })

  it('should define RecommendationFilter interface correctly', () => {
    const module = tryImportMcpRecommendationEngine()

    if (!module) {
      expect(module).not.toBeNull()
      return
    }

    const filter: RecommendationFilter = {
      priority: ['required', 'recommended'],
      servers: ['filesystem', 'supabase'],
      excludeServers: ['github'],
    }

    expect(filter.priority).toContain('required')
    expect(filter.servers).toContain('filesystem')
    expect(filter.excludeServers).toContain('github')
  })
})
