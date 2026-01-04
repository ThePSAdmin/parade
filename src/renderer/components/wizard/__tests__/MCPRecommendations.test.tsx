/**
 * MCPRecommendations Component Tests - TDD RED Phase
 *
 * These tests define the expected behavior for the MCPRecommendations component.
 * All tests should FAIL initially since the component doesn't exist yet.
 *
 * Expected component: src/renderer/components/wizard/MCPRecommendations.tsx
 *
 * The MCPRecommendations component displays a list of recommended MCP (Model Context Protocol)
 * servers based on the user's selected stack. Each MCP shows name, description, and rationale.
 * Users can install MCPs automatically or copy manual instructions.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

// Import the component that doesn't exist yet - will cause import error until implemented
import { MCPRecommendations } from '@renderer/components/wizard/MCPRecommendations'

// Type definitions for the expected component API
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

// Mock MCP data for testing
const mockMCPs: MCPServer[] = [
  {
    id: 'mcp-sqlite',
    name: 'SQLite MCP',
    description: 'Provides database query and management capabilities for SQLite databases.',
    rationale: 'Essential for projects using SQLite for local data storage.',
    installCommand: 'npx @anthropic/mcp-install sqlite',
    manualInstructions: 'Add the following to your claude_desktop_config.json:\n{\n  "mcpServers": {\n    "sqlite": {\n      "command": "npx",\n      "args": ["@anthropic/mcp-server-sqlite"]\n    }\n  }\n}',
    category: 'database',
    requiredForStack: ['database', 'backend', 'fullstack'],
  },
  {
    id: 'mcp-filesystem',
    name: 'Filesystem MCP',
    description: 'Enables file read/write operations with configurable permissions.',
    rationale: 'Useful for any project requiring file management capabilities.',
    installCommand: 'npx @anthropic/mcp-install filesystem',
    manualInstructions: 'Add the following to your claude_desktop_config.json:\n{\n  "mcpServers": {\n    "filesystem": {\n      "command": "npx",\n      "args": ["@anthropic/mcp-server-filesystem", "--root", "."]\n    }\n  }\n}',
    category: 'filesystem',
  },
  {
    id: 'mcp-github',
    name: 'GitHub MCP',
    description: 'Integrates with GitHub API for repository management.',
    rationale: 'Perfect for projects hosted on GitHub with CI/CD workflows.',
    installCommand: 'npx @anthropic/mcp-install github',
    manualInstructions: 'Add the following to your claude_desktop_config.json:\n{\n  "mcpServers": {\n    "github": {\n      "command": "npx",\n      "args": ["@anthropic/mcp-server-github"],\n      "env": {\n        "GITHUB_TOKEN": "your-token-here"\n      }\n    }\n  }\n}',
    category: 'development',
  },
]

const defaultStack = {
  type: 'fullstack' as const,
  framework: 'React',
  language: 'TypeScript',
}

const emptyStack = {
  type: '' as const,
  framework: '',
  language: '',
}

// =============================================================================
// Basic Rendering Tests
// =============================================================================

describe('MCPRecommendations Component', () => {
  describe('Basic Rendering', () => {
    it('should render the MCPRecommendations component', () => {
      render(<MCPRecommendations stack={defaultStack} />)

      expect(screen.getByTestId('mcp-recommendations')).toBeInTheDocument()
    })

    it('should render a title for the recommendations section', () => {
      render(<MCPRecommendations stack={defaultStack} />)

      expect(screen.getByRole('heading', { name: /recommended.*mcp|mcp.*recommendations/i })).toBeInTheDocument()
    })

    it('should render a description explaining MCPs', () => {
      render(<MCPRecommendations stack={defaultStack} />)

      expect(screen.getByText(/model context protocol|enhance.*capabilities|extend.*functionality/i)).toBeInTheDocument()
    })

    it('should render a list of recommended MCPs', () => {
      render(<MCPRecommendations stack={defaultStack} />)

      const mcpList = screen.getByTestId('mcp-list')
      expect(mcpList).toBeInTheDocument()
    })

    it('should render at least one MCP recommendation for a valid stack', () => {
      render(<MCPRecommendations stack={defaultStack} />)

      const mcpItems = screen.getAllByTestId(/^mcp-item-/)
      expect(mcpItems.length).toBeGreaterThan(0)
    })

    it('should apply custom className when provided', () => {
      render(<MCPRecommendations stack={defaultStack} className="custom-class" />)

      const container = screen.getByTestId('mcp-recommendations')
      expect(container).toHaveClass('custom-class')
    })
  })

  // =============================================================================
  // MCP Item Display Tests
  // =============================================================================

  describe('MCP Item Display', () => {
    it('should display MCP name for each recommendation', () => {
      render(<MCPRecommendations stack={defaultStack} />)

      // Should show at least one MCP name
      expect(screen.getByText(/sqlite.*mcp|filesystem.*mcp|github.*mcp/i)).toBeInTheDocument()
    })

    it('should display MCP description for each recommendation', () => {
      render(<MCPRecommendations stack={defaultStack} />)

      // Should show description text
      expect(screen.getByText(/database.*query|file.*read.*write|repository.*management/i)).toBeInTheDocument()
    })

    it('should display rationale explaining why MCP is recommended', () => {
      render(<MCPRecommendations stack={defaultStack} />)

      // Should show rationale text
      expect(screen.getByText(/essential.*for|useful.*for|perfect.*for/i)).toBeInTheDocument()
    })

    it('should display category badge for each MCP', () => {
      render(<MCPRecommendations stack={defaultStack} />)

      // Should show category labels
      expect(screen.getByText(/database|filesystem|development|api|cloud/i)).toBeInTheDocument()
    })

    it('should render MCP items with unique test IDs', () => {
      render(<MCPRecommendations stack={defaultStack} />)

      const mcpItems = screen.getAllByTestId(/^mcp-item-/)
      const testIds = mcpItems.map((item) => item.getAttribute('data-testid'))
      const uniqueTestIds = new Set(testIds)
      expect(uniqueTestIds.size).toBe(testIds.length)
    })
  })

  // =============================================================================
  // Install Button Tests
  // =============================================================================

  describe('Install Button', () => {
    it('should render an install button for each MCP', () => {
      render(<MCPRecommendations stack={defaultStack} />)

      const installButtons = screen.getAllByRole('button', { name: /install/i })
      expect(installButtons.length).toBeGreaterThan(0)
    })

    it('should call onInstall when install button is clicked', async () => {
      const handleInstall = vi.fn().mockResolvedValue(undefined)
      const user = userEvent.setup()

      render(<MCPRecommendations stack={defaultStack} onInstall={handleInstall} />)

      const installButtons = screen.getAllByRole('button', { name: /^install$/i })
      await user.click(installButtons[0])

      expect(handleInstall).toHaveBeenCalled()
    })

    it('should pass MCP ID to onInstall handler', async () => {
      const handleInstall = vi.fn().mockResolvedValue(undefined)
      const user = userEvent.setup()

      render(<MCPRecommendations stack={defaultStack} onInstall={handleInstall} />)

      // Click first install button
      const installButtons = screen.getAllByRole('button', { name: /^install$/i })
      await user.click(installButtons[0])

      // Should be called with an MCP ID string
      expect(handleInstall).toHaveBeenCalledWith(expect.any(String))
    })

    it('should show loading state while installing', async () => {
      const handleInstall = vi.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      )
      const user = userEvent.setup()

      render(<MCPRecommendations stack={defaultStack} onInstall={handleInstall} />)

      const installButtons = screen.getAllByRole('button', { name: /^install$/i })
      await user.click(installButtons[0])

      // Should show loading indicator
      expect(screen.getByTestId(/install-loading|installing/i)).toBeInTheDocument()
    })

    it('should disable install button while installing', async () => {
      const handleInstall = vi.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      )
      const user = userEvent.setup()

      render(<MCPRecommendations stack={defaultStack} onInstall={handleInstall} />)

      const installButtons = screen.getAllByRole('button', { name: /^install$/i })
      await user.click(installButtons[0])

      // Button should be disabled during installation
      expect(installButtons[0]).toBeDisabled()
    })

    it('should disable install button for already installed MCPs', () => {
      render(
        <MCPRecommendations
          stack={defaultStack}
          installedMCPs={['mcp-sqlite']}
        />
      )

      // Find the SQLite MCP item and check its install button
      const sqliteItem = screen.getByTestId('mcp-item-mcp-sqlite')
      const installButton = within(sqliteItem).queryByRole('button', { name: /^install$/i })

      // Either button doesn't exist or is disabled
      if (installButton) {
        expect(installButton).toBeDisabled()
      } else {
        // Or shows "Installed" text instead
        expect(within(sqliteItem).getByText(/installed/i)).toBeInTheDocument()
      }
    })

    it('should show "Installed" indicator for already installed MCPs', () => {
      render(
        <MCPRecommendations
          stack={defaultStack}
          installedMCPs={['mcp-sqlite']}
        />
      )

      const sqliteItem = screen.getByTestId('mcp-item-mcp-sqlite')
      expect(within(sqliteItem).getByText(/installed/i)).toBeInTheDocument()
    })
  })

  // =============================================================================
  // Copy Button Tests
  // =============================================================================

  describe('Copy Button', () => {
    beforeEach(() => {
      // Mock clipboard API
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn().mockResolvedValue(undefined),
        },
      })
    })

    it('should render a copy button for each MCP', () => {
      render(<MCPRecommendations stack={defaultStack} />)

      const copyButtons = screen.getAllByRole('button', { name: /copy/i })
      expect(copyButtons.length).toBeGreaterThan(0)
    })

    it('should copy manual instructions when copy button is clicked', async () => {
      const user = userEvent.setup()

      render(<MCPRecommendations stack={defaultStack} />)

      const copyButtons = screen.getAllByRole('button', { name: /copy/i })
      await user.click(copyButtons[0])

      expect(navigator.clipboard.writeText).toHaveBeenCalled()
    })

    it('should show "Copied!" feedback after copying', async () => {
      const user = userEvent.setup()

      render(<MCPRecommendations stack={defaultStack} />)

      const copyButtons = screen.getAllByRole('button', { name: /copy/i })
      await user.click(copyButtons[0])

      await waitFor(() => {
        expect(screen.getByText(/copied/i)).toBeInTheDocument()
      })
    })

    it('should reset copy button state after timeout', async () => {
      vi.useFakeTimers()
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

      render(<MCPRecommendations stack={defaultStack} />)

      const copyButtons = screen.getAllByRole('button', { name: /copy/i })
      await user.click(copyButtons[0])

      // Should show copied state
      expect(screen.getByText(/copied/i)).toBeInTheDocument()

      // Advance timers past the reset timeout (typically 2-3 seconds)
      vi.advanceTimersByTime(3000)

      // Should no longer show copied state
      await waitFor(() => {
        expect(screen.queryByText(/^copied!?$/i)).not.toBeInTheDocument()
      })

      vi.useRealTimers()
    })
  })

  // =============================================================================
  // Success/Error States Tests
  // =============================================================================

  describe('Success/Error States', () => {
    it('should show success state after successful installation', async () => {
      const handleInstall = vi.fn().mockResolvedValue(undefined)
      const handleInstallComplete = vi.fn()
      const user = userEvent.setup()

      render(
        <MCPRecommendations
          stack={defaultStack}
          onInstall={handleInstall}
          onInstallComplete={handleInstallComplete}
        />
      )

      const installButtons = screen.getAllByRole('button', { name: /^install$/i })
      await user.click(installButtons[0])

      await waitFor(() => {
        expect(handleInstallComplete).toHaveBeenCalledWith(expect.any(String), true)
      })
    })

    it('should show success indicator after installation completes', async () => {
      const handleInstall = vi.fn().mockResolvedValue(undefined)
      const user = userEvent.setup()

      render(<MCPRecommendations stack={defaultStack} onInstall={handleInstall} />)

      const installButtons = screen.getAllByRole('button', { name: /^install$/i })
      const firstMcpItem = installButtons[0].closest('[data-testid^="mcp-item-"]')
      await user.click(installButtons[0])

      await waitFor(() => {
        expect(within(firstMcpItem as HTMLElement).getByText(/installed|success/i)).toBeInTheDocument()
      })
    })

    it('should show error state after failed installation', async () => {
      const handleInstall = vi.fn().mockRejectedValue(new Error('Installation failed'))
      const handleInstallComplete = vi.fn()
      const user = userEvent.setup()

      render(
        <MCPRecommendations
          stack={defaultStack}
          onInstall={handleInstall}
          onInstallComplete={handleInstallComplete}
        />
      )

      const installButtons = screen.getAllByRole('button', { name: /^install$/i })
      await user.click(installButtons[0])

      await waitFor(() => {
        expect(handleInstallComplete).toHaveBeenCalledWith(expect.any(String), false)
      })
    })

    it('should display error message when installation fails', async () => {
      const handleInstall = vi.fn().mockRejectedValue(new Error('Network error'))
      const user = userEvent.setup()

      render(<MCPRecommendations stack={defaultStack} onInstall={handleInstall} />)

      const installButtons = screen.getAllByRole('button', { name: /^install$/i })
      await user.click(installButtons[0])

      await waitFor(() => {
        expect(screen.getByText(/error|failed|could not install/i)).toBeInTheDocument()
      })
    })

    it('should allow retry after installation failure', async () => {
      const handleInstall = vi.fn()
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockResolvedValueOnce(undefined)
      const user = userEvent.setup()

      render(<MCPRecommendations stack={defaultStack} onInstall={handleInstall} />)

      const installButtons = screen.getAllByRole('button', { name: /^install$/i })

      // First attempt fails
      await user.click(installButtons[0])
      await waitFor(() => {
        expect(screen.getByText(/error|failed/i)).toBeInTheDocument()
      })

      // Retry button should be available
      const retryButton = screen.getByRole('button', { name: /retry|try again/i })
      await user.click(retryButton)

      expect(handleInstall).toHaveBeenCalledTimes(2)
    })

    it('should show checkmark icon for installed MCPs', () => {
      render(
        <MCPRecommendations
          stack={defaultStack}
          installedMCPs={['mcp-sqlite']}
        />
      )

      const sqliteItem = screen.getByTestId('mcp-item-mcp-sqlite')
      const checkIcon = within(sqliteItem).getByTestId('check-icon')
      expect(checkIcon).toBeInTheDocument()
    })
  })

  // =============================================================================
  // Collapsible Sections Tests
  // =============================================================================

  describe('Collapsible Sections', () => {
    it('should render collapsible section for detailed instructions', () => {
      render(<MCPRecommendations stack={defaultStack} />)

      const expandButtons = screen.getAllByRole('button', { name: /details|instructions|show more|expand/i })
      expect(expandButtons.length).toBeGreaterThan(0)
    })

    it('should hide detailed instructions by default', () => {
      render(<MCPRecommendations stack={defaultStack} />)

      // Manual instructions should not be visible initially
      expect(screen.queryByText(/claude_desktop_config\.json/i)).not.toBeInTheDocument()
    })

    it('should show detailed instructions when expanded', async () => {
      const user = userEvent.setup()

      render(<MCPRecommendations stack={defaultStack} />)

      const expandButtons = screen.getAllByRole('button', { name: /details|instructions|show more|expand/i })
      await user.click(expandButtons[0])

      await waitFor(() => {
        expect(screen.getByText(/claude_desktop_config\.json|mcpServers/i)).toBeInTheDocument()
      })
    })

    it('should toggle detailed instructions on click', async () => {
      const user = userEvent.setup()

      render(<MCPRecommendations stack={defaultStack} />)

      const expandButtons = screen.getAllByRole('button', { name: /details|instructions|show more|expand/i })

      // Expand
      await user.click(expandButtons[0])
      await waitFor(() => {
        expect(screen.getByText(/claude_desktop_config\.json|mcpServers/i)).toBeInTheDocument()
      })

      // Collapse
      await user.click(expandButtons[0])
      await waitFor(() => {
        expect(screen.queryByText(/claude_desktop_config\.json/i)).not.toBeInTheDocument()
      })
    })

    it('should show install command in expanded section', async () => {
      const user = userEvent.setup()

      render(<MCPRecommendations stack={defaultStack} />)

      const expandButtons = screen.getAllByRole('button', { name: /details|instructions|show more|expand/i })
      await user.click(expandButtons[0])

      await waitFor(() => {
        expect(screen.getByText(/npx.*@anthropic|npm.*install/i)).toBeInTheDocument()
      })
    })

    it('should have aria-expanded attribute on toggle button', () => {
      render(<MCPRecommendations stack={defaultStack} />)

      const expandButtons = screen.getAllByRole('button', { name: /details|instructions|show more|expand/i })
      expect(expandButtons[0]).toHaveAttribute('aria-expanded', 'false')
    })

    it('should update aria-expanded when toggled', async () => {
      const user = userEvent.setup()

      render(<MCPRecommendations stack={defaultStack} />)

      const expandButtons = screen.getAllByRole('button', { name: /details|instructions|show more|expand/i })

      await user.click(expandButtons[0])

      expect(expandButtons[0]).toHaveAttribute('aria-expanded', 'true')
    })

    it('should support keyboard navigation for expanding sections', async () => {
      const user = userEvent.setup()

      render(<MCPRecommendations stack={defaultStack} />)

      const expandButtons = screen.getAllByRole('button', { name: /details|instructions|show more|expand/i })
      expandButtons[0].focus()

      await user.keyboard('{Enter}')

      await waitFor(() => {
        expect(screen.getByText(/claude_desktop_config\.json|mcpServers/i)).toBeInTheDocument()
      })
    })
  })

  // =============================================================================
  // Accessibility Tests
  // =============================================================================

  describe('Accessibility', () => {
    it('should have accessible heading structure', () => {
      render(<MCPRecommendations stack={defaultStack} />)

      const heading = screen.getByRole('heading')
      expect(heading).toBeInTheDocument()
      expect(heading.tagName).toMatch(/H[1-6]/)
    })

    it('should have accessible list for MCP items', () => {
      render(<MCPRecommendations stack={defaultStack} />)

      const list = screen.getByRole('list')
      expect(list).toBeInTheDocument()
    })

    it('should have list items for each MCP', () => {
      render(<MCPRecommendations stack={defaultStack} />)

      const listItems = screen.getAllByRole('listitem')
      expect(listItems.length).toBeGreaterThan(0)
    })

    it('should have accessible labels for install buttons', () => {
      render(<MCPRecommendations stack={defaultStack} />)

      const installButtons = screen.getAllByRole('button', { name: /install/i })
      installButtons.forEach((button) => {
        expect(button).toHaveAccessibleName()
      })
    })

    it('should have accessible labels for copy buttons', () => {
      render(<MCPRecommendations stack={defaultStack} />)

      const copyButtons = screen.getAllByRole('button', { name: /copy/i })
      copyButtons.forEach((button) => {
        expect(button).toHaveAccessibleName()
      })
    })

    it('should announce installation status to screen readers', async () => {
      const handleInstall = vi.fn().mockResolvedValue(undefined)
      const user = userEvent.setup()

      render(<MCPRecommendations stack={defaultStack} onInstall={handleInstall} />)

      const installButtons = screen.getAllByRole('button', { name: /^install$/i })
      await user.click(installButtons[0])

      await waitFor(() => {
        // Should have an aria-live region or status role for announcements
        const statusRegion = screen.getByRole('status')
        expect(statusRegion).toBeInTheDocument()
      })
    })

    it('should be navigable via keyboard', async () => {
      const user = userEvent.setup()

      render(<MCPRecommendations stack={defaultStack} />)

      // Tab through interactive elements
      await user.tab()

      // First focusable element should be focused
      expect(document.activeElement).not.toBe(document.body)
    })

    it('should have proper focus management after install', async () => {
      const handleInstall = vi.fn().mockResolvedValue(undefined)
      const user = userEvent.setup()

      render(<MCPRecommendations stack={defaultStack} onInstall={handleInstall} />)

      const installButtons = screen.getAllByRole('button', { name: /^install$/i })
      await user.click(installButtons[0])

      await waitFor(() => {
        // Focus should remain on or near the action area
        expect(document.activeElement).not.toBe(document.body)
      })
    })
  })

  // =============================================================================
  // Stack-Based Filtering Tests
  // =============================================================================

  describe('Stack-Based Filtering', () => {
    it('should show database-related MCPs for database stack', () => {
      render(
        <MCPRecommendations
          stack={{ type: 'database', framework: 'Prisma', language: 'TypeScript' }}
        />
      )

      // Should show SQLite or other database MCPs
      expect(screen.getByText(/sqlite|database|postgres|mysql/i)).toBeInTheDocument()
    })

    it('should show relevant MCPs based on framework', () => {
      render(
        <MCPRecommendations
          stack={{ type: 'fullstack', framework: 'Next.js', language: 'TypeScript' }}
        />
      )

      // Should show MCPs relevant to Next.js/React development
      const mcpItems = screen.getAllByTestId(/^mcp-item-/)
      expect(mcpItems.length).toBeGreaterThan(0)
    })

    it('should show message when no MCPs match the stack', () => {
      render(<MCPRecommendations stack={emptyStack} />)

      // Should show empty state message
      expect(screen.getByText(/no.*recommendations|select.*stack|configure.*stack/i)).toBeInTheDocument()
    })

    it('should update recommendations when stack changes', () => {
      const { rerender } = render(
        <MCPRecommendations
          stack={{ type: 'frontend', framework: 'React', language: 'TypeScript' }}
        />
      )

      const initialItems = screen.getAllByTestId(/^mcp-item-/)
      const initialCount = initialItems.length

      rerender(
        <MCPRecommendations
          stack={{ type: 'database', framework: 'Prisma', language: 'TypeScript' }}
        />
      )

      // MCPs should be different (or same count but different items)
      const newItems = screen.getAllByTestId(/^mcp-item-/)
      expect(newItems.length).toBeGreaterThanOrEqual(1)
    })

    it('should prioritize required MCPs for the selected stack', () => {
      render(
        <MCPRecommendations
          stack={{ type: 'database', framework: 'Prisma', language: 'TypeScript' }}
        />
      )

      const mcpItems = screen.getAllByTestId(/^mcp-item-/)

      // First item should be a required/essential MCP for database
      const firstItem = mcpItems[0]
      expect(within(firstItem).getByText(/required|essential|recommended/i)).toBeInTheDocument()
    })
  })

  // =============================================================================
  // Multiple Selection Tests
  // =============================================================================

  describe('Multiple Selection', () => {
    it('should allow installing multiple MCPs', async () => {
      const handleInstall = vi.fn().mockResolvedValue(undefined)
      const user = userEvent.setup()

      render(<MCPRecommendations stack={defaultStack} onInstall={handleInstall} />)

      const installButtons = screen.getAllByRole('button', { name: /^install$/i })

      if (installButtons.length >= 2) {
        await user.click(installButtons[0])
        await waitFor(() => {
          expect(handleInstall).toHaveBeenCalledTimes(1)
        })

        await user.click(installButtons[1])
        await waitFor(() => {
          expect(handleInstall).toHaveBeenCalledTimes(2)
        })
      }
    })

    it('should track individual installation states', async () => {
      const handleInstall = vi.fn()
        .mockResolvedValueOnce(undefined)
        .mockImplementationOnce(() => new Promise((resolve) => setTimeout(resolve, 100)))

      const user = userEvent.setup()

      render(<MCPRecommendations stack={defaultStack} onInstall={handleInstall} />)

      const installButtons = screen.getAllByRole('button', { name: /^install$/i })

      if (installButtons.length >= 2) {
        // Install first (completes immediately)
        await user.click(installButtons[0])

        // Install second (takes time)
        await user.click(installButtons[1])

        // First should be complete, second should be loading
        const mcpItems = screen.getAllByTestId(/^mcp-item-/)
        expect(within(mcpItems[0]).getByText(/installed|success/i)).toBeInTheDocument()
        expect(within(mcpItems[1]).getByTestId(/install-loading|installing/i)).toBeInTheDocument()
      }
    })
  })

  // =============================================================================
  // Edge Cases
  // =============================================================================

  describe('Edge Cases', () => {
    it('should handle clipboard API not available', async () => {
      // Remove clipboard API
      const originalClipboard = navigator.clipboard
      Object.defineProperty(navigator, 'clipboard', {
        value: undefined,
        writable: true,
      })

      const user = userEvent.setup()

      render(<MCPRecommendations stack={defaultStack} />)

      const copyButtons = screen.getAllByRole('button', { name: /copy/i })

      // Should not throw
      await user.click(copyButtons[0])

      // Should show fallback message or error
      expect(screen.getByText(/clipboard.*not available|copy.*failed|manual.*copy/i)).toBeInTheDocument()

      // Restore clipboard
      Object.defineProperty(navigator, 'clipboard', {
        value: originalClipboard,
        writable: true,
      })
    })

    it('should handle empty installedMCPs array', () => {
      render(<MCPRecommendations stack={defaultStack} installedMCPs={[]} />)

      // All install buttons should be enabled
      const installButtons = screen.getAllByRole('button', { name: /^install$/i })
      installButtons.forEach((button) => {
        expect(button).not.toBeDisabled()
      })
    })

    it('should handle onInstall being undefined', async () => {
      const user = userEvent.setup()

      render(<MCPRecommendations stack={defaultStack} />)

      const installButtons = screen.getAllByRole('button', { name: /^install$/i })

      // Should not throw when clicking without handler
      await expect(user.click(installButtons[0])).resolves.not.toThrow()
    })

    it('should handle rapid clicking of install button', async () => {
      const handleInstall = vi.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      )
      const user = userEvent.setup()

      render(<MCPRecommendations stack={defaultStack} onInstall={handleInstall} />)

      const installButtons = screen.getAllByRole('button', { name: /^install$/i })

      // Rapid clicks
      await user.click(installButtons[0])
      await user.click(installButtons[0])
      await user.click(installButtons[0])

      // Should only call handler once (debounced or disabled during install)
      expect(handleInstall).toHaveBeenCalledTimes(1)
    })
  })
})

// =============================================================================
// Snapshot Tests (optional, for visual regression)
// =============================================================================

describe('MCPRecommendations Snapshots', () => {
  it('should match snapshot with default props', () => {
    const { container } = render(<MCPRecommendations stack={defaultStack} />)

    expect(container).toMatchSnapshot()
  })

  it('should match snapshot with installed MCPs', () => {
    const { container } = render(
      <MCPRecommendations
        stack={defaultStack}
        installedMCPs={['mcp-sqlite', 'mcp-filesystem']}
      />
    )

    expect(container).toMatchSnapshot()
  })
})
