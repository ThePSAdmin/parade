/**
 * MCPRecommendations Component
 *
 * Displays stack-specific MCP (Model Context Protocol) recommendations with install/copy buttons.
 * Each MCP shows name, description, rationale, and category badge.
 * Users can install MCPs automatically or copy manual instructions.
 */

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@renderer/components/ui/button'
import { Badge } from '@renderer/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@renderer/components/ui/card'

// ============================================================================
// Type Definitions
// ============================================================================

export interface MCPServer {
  id: string
  name: string
  description: string
  rationale: string
  installCommand: string
  manualInstructions: string
  category: 'database' | 'api' | 'filesystem' | 'cloud' | 'development' | 'other'
  requiredForStack?: string[]
}

export interface MCPRecommendationsProps {
  stack: {
    type: 'frontend' | 'backend' | 'fullstack' | 'database' | ''
    framework: string
    language: string
  }
  onInstall?: (mcpId: string) => Promise<void>
  onInstallComplete?: (mcpId: string, success: boolean) => void
  installedMCPs?: string[]
  className?: string
}

// ============================================================================
// MCP Data
// ============================================================================

const MCP_SERVERS: MCPServer[] = [
  {
    id: 'mcp-sqlite',
    name: 'SQLite MCP',
    description: 'Provides database query and management capabilities for SQLite databases.',
    rationale: 'Essential for projects using SQLite for local data storage.',
    installCommand: 'npx @anthropic/mcp-install sqlite',
    manualInstructions: `Add the following to your claude_desktop_config.json:
{
  "mcpServers": {
    "sqlite": {
      "command": "npx",
      "args": ["@anthropic/mcp-server-sqlite"]
    }
  }
}`,
    category: 'database',
    requiredForStack: ['database', 'backend', 'fullstack'],
  },
  {
    id: 'mcp-filesystem',
    name: 'Filesystem MCP',
    description: 'Enables file read/write operations with configurable permissions.',
    rationale: 'Useful for any project requiring file management capabilities.',
    installCommand: 'npx @anthropic/mcp-install filesystem',
    manualInstructions: `Add the following to your claude_desktop_config.json:
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["@anthropic/mcp-server-filesystem", "--root", "."]
    }
  }
}`,
    category: 'filesystem',
  },
  {
    id: 'mcp-github',
    name: 'GitHub MCP',
    description: 'Integrates with GitHub API for repository management.',
    rationale: 'Perfect for projects hosted on GitHub with CI/CD workflows.',
    installCommand: 'npx @anthropic/mcp-install github',
    manualInstructions: `Add the following to your claude_desktop_config.json:
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["@anthropic/mcp-server-github"],
      "env": {
        "GITHUB_TOKEN": "your-token-here"
      }
    }
  }
}`,
    category: 'development',
  },
  {
    id: 'mcp-postgres',
    name: 'PostgreSQL MCP',
    description: 'Direct PostgreSQL database operations for backend projects.',
    rationale: 'Essential for projects using PostgreSQL databases.',
    installCommand: 'npx @anthropic/mcp-install postgres',
    manualInstructions: `Add the following to your claude_desktop_config.json:
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": ["@anthropic/mcp-server-postgres"],
      "env": {
        "DATABASE_URL": "postgresql://user:pass@localhost:5432/db"
      }
    }
  }
}`,
    category: 'database',
    requiredForStack: ['database', 'backend'],
  },
]

// ============================================================================
// Helper Functions
// ============================================================================

function getRecommendedMCPs(stack: MCPRecommendationsProps['stack']): MCPServer[] {
  if (!stack.type) {
    return []
  }

  // Filter MCPs based on stack type
  const relevantMCPs = MCP_SERVERS.filter((mcp) => {
    // Database-related MCPs for database/backend/fullstack stacks
    if (mcp.category === 'database') {
      return ['database', 'backend', 'fullstack'].includes(stack.type)
    }
    // Filesystem is useful for all project types
    if (mcp.category === 'filesystem') {
      return true
    }
    // Development tools are useful for all
    if (mcp.category === 'development') {
      return true
    }
    return false
  })

  // Sort: required MCPs first, then by category
  return relevantMCPs.sort((a, b) => {
    const aRequired = a.requiredForStack?.includes(stack.type) ?? false
    const bRequired = b.requiredForStack?.includes(stack.type) ?? false
    if (aRequired && !bRequired) return -1
    if (!aRequired && bRequired) return 1
    return 0
  })
}

// ============================================================================
// Sub-Components
// ============================================================================

interface MCPItemProps {
  mcp: MCPServer
  isInstalled: boolean
  isInstalling: boolean
  installError: string | null
  onInstall: () => void
  onCopy: () => void
  isCopied: boolean
  copyError: string | null
  stackType: string
}

function MCPItem({
  mcp,
  isInstalled,
  isInstalling,
  installError,
  onInstall,
  onCopy,
  isCopied,
  copyError,
  stackType,
}: MCPItemProps) {
  const [isExpanded, setIsExpanded] = React.useState(false)
  const isRequired = mcp.requiredForStack?.includes(stackType) ?? false

  return (
    <li data-testid={`mcp-item-${mcp.id}`} className="list-none">
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-base">{mcp.name}</CardTitle>
                <Badge variant="secondary" className="capitalize">
                  {mcp.category}
                </Badge>
                {isRequired && (
                  <Badge variant="default" className="bg-amber-500 hover:bg-amber-500">
                    Required
                  </Badge>
                )}
              </div>
              <CardDescription>{mcp.description}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {isInstalled ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckIcon data-testid="check-icon" />
                  <span className="text-sm font-medium">Installed</span>
                </div>
              ) : installError ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-destructive">Error: Failed to install</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onInstall}
                    aria-label="Try again"
                  >
                    Retry
                  </Button>
                </div>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={onInstall}
                  disabled={isInstalling}
                  aria-label="Install"
                >
                  {isInstalling ? (
                    <>
                      <span data-testid="install-loading" className="mr-1">
                        <LoadingSpinner />
                      </span>
                      Installing...
                    </>
                  ) : (
                    'Install'
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground mb-3">
            <span className="font-medium">Why: </span>
            {mcp.rationale}
          </p>

          <div className="flex items-center gap-2 mb-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              aria-expanded={isExpanded}
              aria-label={isExpanded ? 'Hide details' : 'Show details'}
            >
              {isExpanded ? 'Hide Details' : 'Show Details'}
              <ChevronIcon expanded={isExpanded} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCopy}
              aria-label="Copy instructions"
            >
              {copyError ? (
                'Clipboard not available - manual copy required'
              ) : isCopied ? (
                <>
                  <CheckIcon />
                  Copied!
                </>
              ) : (
                <>
                  <CopyIcon />
                  Copy
                </>
              )}
            </Button>
          </div>

          {isExpanded && (
            <div className="mt-3 space-y-3 rounded-md bg-muted/50 p-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Install Command:</p>
                <code className="block text-xs bg-background p-2 rounded border">
                  {mcp.installCommand}
                </code>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Manual Configuration:</p>
                <pre className="text-xs bg-background p-2 rounded border overflow-x-auto whitespace-pre-wrap">
                  {mcp.manualInstructions}
                </pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </li>
  )
}

// ============================================================================
// Icons
// ============================================================================

function CheckIcon({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('inline-block', className)}
      {...props}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('inline-block mr-1', className)}
    >
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  )
}

function ChevronIcon({ expanded, className }: { expanded: boolean; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('inline-block ml-1 transition-transform', expanded && 'rotate-180', className)}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('inline-block animate-spin', className)}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function MCPRecommendations({
  stack,
  onInstall,
  onInstallComplete,
  installedMCPs = [],
  className,
}: MCPRecommendationsProps) {
  const [installingIds, setInstallingIds] = React.useState<Set<string>>(new Set())
  const [installedIds, setInstalledIds] = React.useState<Set<string>>(new Set(installedMCPs))
  const [errorIds, setErrorIds] = React.useState<Map<string, string>>(new Map())
  const [copiedId, setCopiedId] = React.useState<string | null>(null)
  const [copyErrorId, setCopyErrorId] = React.useState<string | null>(null)
  const [statusMessage, setStatusMessage] = React.useState<string>('')

  // Sync installedMCPs prop with internal state
  React.useEffect(() => {
    setInstalledIds(new Set(installedMCPs))
  }, [installedMCPs])

  const recommendations = getRecommendedMCPs(stack)

  const handleInstall = async (mcpId: string) => {
    // Prevent duplicate installs
    if (installingIds.has(mcpId) || installedIds.has(mcpId)) {
      return
    }

    setInstallingIds((prev) => new Set(prev).add(mcpId))
    setErrorIds((prev) => {
      const next = new Map(prev)
      next.delete(mcpId)
      return next
    })

    try {
      if (onInstall) {
        await onInstall(mcpId)
      }
      setInstalledIds((prev) => new Set(prev).add(mcpId))
      setStatusMessage(`Successfully installed ${mcpId}`)
      onInstallComplete?.(mcpId, true)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Installation failed'
      setErrorIds((prev) => new Map(prev).set(mcpId, errorMessage))
      setStatusMessage(`Failed to install ${mcpId}: ${errorMessage}`)
      onInstallComplete?.(mcpId, false)
    } finally {
      setInstallingIds((prev) => {
        const next = new Set(prev)
        next.delete(mcpId)
        return next
      })
    }
  }

  const handleCopy = async (mcp: MCPServer) => {
    // Reset copy error state
    setCopyErrorId(null)

    if (!navigator.clipboard) {
      setCopyErrorId(mcp.id)
      return
    }

    try {
      await navigator.clipboard.writeText(mcp.manualInstructions)
      setCopiedId(mcp.id)
      setStatusMessage(`Copied ${mcp.name} instructions to clipboard`)

      // Reset after timeout
      setTimeout(() => {
        setCopiedId((prev) => (prev === mcp.id ? null : prev))
      }, 2000)
    } catch {
      setCopyErrorId(mcp.id)
    }
  }

  const hasNoRecommendations = recommendations.length === 0

  return (
    <div
      data-testid="mcp-recommendations"
      className={cn('space-y-4', className)}
    >
      <div>
        <h3 className="text-lg font-semibold mb-1">Recommended MCP Servers</h3>
        <p className="text-sm text-muted-foreground">
          Model Context Protocol servers extend Claude's capabilities for your project stack.
        </p>
      </div>

      {/* Screen reader announcements */}
      <div role="status" className="sr-only" aria-live="polite">
        {statusMessage}
      </div>

      {hasNoRecommendations ? (
        <Card>
          <CardContent className="py-6 text-center">
            <p className="text-muted-foreground">
              No recommendations available. Please select a stack type to see MCP recommendations.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ul data-testid="mcp-list" className="space-y-3" role="list">
          {recommendations.map((mcp) => (
            <MCPItem
              key={mcp.id}
              mcp={mcp}
              isInstalled={installedIds.has(mcp.id)}
              isInstalling={installingIds.has(mcp.id)}
              installError={errorIds.get(mcp.id) ?? null}
              onInstall={() => handleInstall(mcp.id)}
              onCopy={() => handleCopy(mcp)}
              isCopied={copiedId === mcp.id}
              copyError={copyErrorId === mcp.id ? 'Clipboard not available' : null}
              stackType={stack.type}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

export default MCPRecommendations
