/**
 * ProjectWizard Integration Tests - TDD RED Phase
 *
 * These tests define the expected behavior for ProjectWizard integration with:
 * - Scaffolding orchestrator (triggered by "Create Project" button)
 * - ScaffoldingProgress component (shown during setup)
 * - MCPRecommendations component (shown on success)
 * - Error handling with retry option
 * - Folder selection for target directory
 *
 * All tests should FAIL initially since the integration doesn't exist yet.
 *
 * Expected components and integrations:
 * - ScaffoldingProgress component at src/renderer/components/scaffolding/ScaffoldingProgress.tsx
 * - MCPRecommendations component at src/renderer/components/scaffolding/MCPRecommendations.tsx
 * - Scaffolding orchestrator IPC channel: 'scaffolding:run'
 * - Folder selection integration in wizard
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

import { ProjectWizard, ProjectFormData } from '@renderer/components/wizard/ProjectWizard'

// =============================================================================
// Mock Setup
// =============================================================================

// Mock the electron API
const mockElectronAPI = {
  dialog: {
    selectFolder: vi.fn(),
  },
  scaffolding: {
    run: vi.fn(),
    getProgress: vi.fn(),
    cancel: vi.fn(),
  },
  project: {
    readConfig: vi.fn(),
    writeConfig: vi.fn(),
    createScaffold: vi.fn(),
  },
}

// Setup window.electron mock before each test
beforeEach(() => {
  vi.clearAllMocks()
  // @ts-expect-error - mocking window.electron
  window.electron = mockElectronAPI
})

afterEach(() => {
  vi.restoreAllMocks()
})

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Fills out the wizard with valid data and navigates to the final step
 */
async function navigateToFinalStep(user: ReturnType<typeof userEvent.setup>) {
  // Step 1: Basic Info
  await user.type(screen.getByLabelText(/project name/i), 'TestProject')
  await user.type(screen.getByLabelText(/description/i), 'Test description')
  await user.click(screen.getByRole('button', { name: /next/i }))

  // Step 2: Constitution
  await waitFor(() => {
    expect(screen.getByTestId('constitution-step')).toBeInTheDocument()
  })
  await user.click(screen.getByRole('button', { name: /next/i }))

  // Step 3: Stack Selection
  await waitFor(() => {
    expect(screen.getByTestId('stack-selection-step')).toBeInTheDocument()
  })
  await user.click(screen.getByRole('button', { name: /next/i }))

  // Step 4: Optional Sections
  await waitFor(() => {
    expect(screen.getByTestId('optional-sections-step')).toBeInTheDocument()
  })
}

// =============================================================================
// Scaffolding Integration Types (to be implemented)
// =============================================================================

interface ScaffoldingProgress {
  phase: 'idle' | 'preparing' | 'scaffolding' | 'installing' | 'configuring' | 'complete' | 'error'
  currentStep: string
  totalSteps: number
  completedSteps: number
  error?: string
}

interface MCPServer {
  name: string
  description: string
  installCommand: string
  recommended: boolean
  category: 'database' | 'api' | 'filesystem' | 'utility'
}

// =============================================================================
// Tests
// =============================================================================

describe('ProjectWizard Scaffolding Integration', () => {
  describe('Folder Selection Integration', () => {
    it('should render folder selection input in wizard', () => {
      render(<ProjectWizard />)

      // Should have a target directory input/button
      const folderSelector = screen.getByTestId('target-directory-selector')
      expect(folderSelector).toBeInTheDocument()
    })

    it('should open folder selection dialog when browse button clicked', async () => {
      const user = userEvent.setup()
      mockElectronAPI.dialog.selectFolder.mockResolvedValue({
        paths: ['/Users/test/projects'],
        error: undefined,
      })

      render(<ProjectWizard />)

      const browseButton = screen.getByRole('button', { name: /browse|select folder/i })
      await user.click(browseButton)

      expect(mockElectronAPI.dialog.selectFolder).toHaveBeenCalled()
    })

    it('should display selected folder path after selection', async () => {
      const user = userEvent.setup()
      const selectedPath = '/Users/test/my-project'
      mockElectronAPI.dialog.selectFolder.mockResolvedValue({
        paths: [selectedPath],
        error: undefined,
      })

      render(<ProjectWizard />)

      const browseButton = screen.getByRole('button', { name: /browse|select folder/i })
      await user.click(browseButton)

      await waitFor(() => {
        expect(screen.getByDisplayValue(selectedPath)).toBeInTheDocument()
      })
    })

    it('should handle folder selection cancellation', async () => {
      const user = userEvent.setup()
      mockElectronAPI.dialog.selectFolder.mockResolvedValue({
        paths: null,
        error: undefined,
      })

      render(<ProjectWizard />)

      const browseButton = screen.getByRole('button', { name: /browse|select folder/i })
      await user.click(browseButton)

      // Should not show any path since user cancelled
      expect(screen.queryByDisplayValue(/users/i)).not.toBeInTheDocument()
    })

    it('should validate target directory is selected before allowing project creation', async () => {
      const user = userEvent.setup()
      render(<ProjectWizard />)

      await navigateToFinalStep(user)

      // Try to create project without selecting folder
      const createButton = screen.getByRole('button', { name: /create project/i })
      await user.click(createButton)

      await waitFor(() => {
        expect(screen.getByText(/target directory.*required|select.*folder/i)).toBeInTheDocument()
      })
    })
  })

  describe('Create Project Button Triggers Scaffolding', () => {
    it('should call scaffolding orchestrator when Create Project is clicked', async () => {
      const user = userEvent.setup()
      mockElectronAPI.dialog.selectFolder.mockResolvedValue({
        paths: ['/Users/test/project'],
        error: undefined,
      })
      mockElectronAPI.scaffolding.run.mockResolvedValue({ success: true })

      render(<ProjectWizard />)

      // Select target directory
      const browseButton = screen.getByRole('button', { name: /browse|select folder/i })
      await user.click(browseButton)

      await navigateToFinalStep(user)

      // Click Create Project
      const createButton = screen.getByRole('button', { name: /create project/i })
      await user.click(createButton)

      await waitFor(() => {
        expect(mockElectronAPI.scaffolding.run).toHaveBeenCalled()
      })
    })

    it('should pass form data to scaffolding orchestrator', async () => {
      const user = userEvent.setup()
      const targetPath = '/Users/test/my-awesome-project'
      mockElectronAPI.dialog.selectFolder.mockResolvedValue({
        paths: [targetPath],
        error: undefined,
      })
      mockElectronAPI.scaffolding.run.mockResolvedValue({ success: true })

      render(<ProjectWizard />)

      // Select target directory
      await user.click(screen.getByRole('button', { name: /browse|select folder/i }))

      // Fill form with specific data
      await user.type(screen.getByLabelText(/project name/i), 'AwesomeProject')
      await user.type(screen.getByLabelText(/description/i), 'An awesome project')
      await user.click(screen.getByRole('button', { name: /next/i }))

      // Navigate to final step
      await waitFor(() => screen.getByTestId('constitution-step'))
      await user.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => screen.getByTestId('stack-selection-step'))
      await user.click(screen.getByRole('radio', { name: /fullstack/i }))
      await user.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => screen.getByTestId('optional-sections-step'))
      await user.click(screen.getByRole('checkbox', { name: /agents/i }))

      // Create project
      await user.click(screen.getByRole('button', { name: /create project/i }))

      await waitFor(() => {
        expect(mockElectronAPI.scaffolding.run).toHaveBeenCalledWith(
          expect.objectContaining({
            targetPath,
            projectName: 'AwesomeProject',
            description: 'An awesome project',
            stackType: 'fullstack',
            enableAgents: true,
          })
        )
      })
    })

    it('should disable Create Project button while scaffolding is in progress', async () => {
      const user = userEvent.setup()
      mockElectronAPI.dialog.selectFolder.mockResolvedValue({
        paths: ['/Users/test/project'],
        error: undefined,
      })
      // Make scaffolding take some time
      mockElectronAPI.scaffolding.run.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 1000))
      )

      render(<ProjectWizard />)

      await user.click(screen.getByRole('button', { name: /browse|select folder/i }))
      await navigateToFinalStep(user)

      const createButton = screen.getByRole('button', { name: /create project/i })
      await user.click(createButton)

      // Button should be disabled immediately after click
      expect(createButton).toBeDisabled()
    })
  })

  describe('ScaffoldingProgress Component Display', () => {
    it('should show ScaffoldingProgress component when scaffolding starts', async () => {
      const user = userEvent.setup()
      mockElectronAPI.dialog.selectFolder.mockResolvedValue({
        paths: ['/Users/test/project'],
        error: undefined,
      })
      mockElectronAPI.scaffolding.run.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 1000))
      )

      render(<ProjectWizard />)

      await user.click(screen.getByRole('button', { name: /browse|select folder/i }))
      await navigateToFinalStep(user)

      await user.click(screen.getByRole('button', { name: /create project/i }))

      await waitFor(() => {
        expect(screen.getByTestId('scaffolding-progress')).toBeInTheDocument()
      })
    })

    it('should hide wizard form when ScaffoldingProgress is shown', async () => {
      const user = userEvent.setup()
      mockElectronAPI.dialog.selectFolder.mockResolvedValue({
        paths: ['/Users/test/project'],
        error: undefined,
      })
      mockElectronAPI.scaffolding.run.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 1000))
      )

      render(<ProjectWizard />)

      await user.click(screen.getByRole('button', { name: /browse|select folder/i }))
      await navigateToFinalStep(user)

      await user.click(screen.getByRole('button', { name: /create project/i }))

      await waitFor(() => {
        expect(screen.getByTestId('scaffolding-progress')).toBeInTheDocument()
      })

      // Wizard stepper should be hidden or replaced
      expect(screen.queryByRole('navigation', { name: /wizard progress/i })).not.toBeInTheDocument()
    })

    it('should display current scaffolding phase', async () => {
      const user = userEvent.setup()
      mockElectronAPI.dialog.selectFolder.mockResolvedValue({
        paths: ['/Users/test/project'],
        error: undefined,
      })

      let progressCallback: ((progress: ScaffoldingProgress) => void) | null = null
      mockElectronAPI.scaffolding.run.mockImplementation(() => {
        return new Promise((resolve) => {
          // Simulate progress updates
          setTimeout(() => {
            progressCallback?.({
              phase: 'scaffolding',
              currentStep: 'Creating directory structure',
              totalSteps: 5,
              completedSteps: 2,
            })
          }, 100)
          setTimeout(() => resolve({ success: true }), 500)
        })
      })
      mockElectronAPI.scaffolding.getProgress.mockImplementation((callback) => {
        progressCallback = callback
        return () => { progressCallback = null }
      })

      render(<ProjectWizard />)

      await user.click(screen.getByRole('button', { name: /browse|select folder/i }))
      await navigateToFinalStep(user)

      await user.click(screen.getByRole('button', { name: /create project/i }))

      await waitFor(() => {
        expect(screen.getByText(/creating directory structure/i)).toBeInTheDocument()
      })
    })

    it('should show progress bar with completed steps', async () => {
      const user = userEvent.setup()
      mockElectronAPI.dialog.selectFolder.mockResolvedValue({
        paths: ['/Users/test/project'],
        error: undefined,
      })
      mockElectronAPI.scaffolding.run.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 500))
      )

      render(<ProjectWizard />)

      await user.click(screen.getByRole('button', { name: /browse|select folder/i }))
      await navigateToFinalStep(user)

      await user.click(screen.getByRole('button', { name: /create project/i }))

      await waitFor(() => {
        const progressBar = screen.getByRole('progressbar')
        expect(progressBar).toBeInTheDocument()
      })
    })

    it('should allow cancelling scaffolding process', async () => {
      const user = userEvent.setup()
      mockElectronAPI.dialog.selectFolder.mockResolvedValue({
        paths: ['/Users/test/project'],
        error: undefined,
      })
      mockElectronAPI.scaffolding.run.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 5000))
      )
      mockElectronAPI.scaffolding.cancel.mockResolvedValue({ success: true })

      render(<ProjectWizard />)

      await user.click(screen.getByRole('button', { name: /browse|select folder/i }))
      await navigateToFinalStep(user)

      await user.click(screen.getByRole('button', { name: /create project/i }))

      await waitFor(() => {
        expect(screen.getByTestId('scaffolding-progress')).toBeInTheDocument()
      })

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      expect(mockElectronAPI.scaffolding.cancel).toHaveBeenCalled()
    })
  })

  describe('Success State - MCPRecommendations', () => {
    it('should show MCPRecommendations component on successful scaffolding', async () => {
      const user = userEvent.setup()
      mockElectronAPI.dialog.selectFolder.mockResolvedValue({
        paths: ['/Users/test/project'],
        error: undefined,
      })
      mockElectronAPI.scaffolding.run.mockResolvedValue({
        success: true,
        createdPaths: ['.claude/', '.beads/', '.design/'],
        mcpRecommendations: [
          { name: 'sqlite', description: 'SQLite database', recommended: true, category: 'database' },
        ],
      })

      render(<ProjectWizard />)

      await user.click(screen.getByRole('button', { name: /browse|select folder/i }))
      await navigateToFinalStep(user)

      await user.click(screen.getByRole('button', { name: /create project/i }))

      await waitFor(() => {
        expect(screen.getByTestId('mcp-recommendations')).toBeInTheDocument()
      })
    })

    it('should hide ScaffoldingProgress when MCPRecommendations is shown', async () => {
      const user = userEvent.setup()
      mockElectronAPI.dialog.selectFolder.mockResolvedValue({
        paths: ['/Users/test/project'],
        error: undefined,
      })
      mockElectronAPI.scaffolding.run.mockResolvedValue({
        success: true,
        createdPaths: ['.claude/', '.beads/'],
        mcpRecommendations: [],
      })

      render(<ProjectWizard />)

      await user.click(screen.getByRole('button', { name: /browse|select folder/i }))
      await navigateToFinalStep(user)

      await user.click(screen.getByRole('button', { name: /create project/i }))

      await waitFor(() => {
        expect(screen.getByTestId('mcp-recommendations')).toBeInTheDocument()
      })

      expect(screen.queryByTestId('scaffolding-progress')).not.toBeInTheDocument()
    })

    it('should display list of recommended MCP servers', async () => {
      const user = userEvent.setup()
      mockElectronAPI.dialog.selectFolder.mockResolvedValue({
        paths: ['/Users/test/project'],
        error: undefined,
      })
      mockElectronAPI.scaffolding.run.mockResolvedValue({
        success: true,
        createdPaths: ['.claude/'],
        mcpRecommendations: [
          { name: 'sqlite', description: 'SQLite database access', recommended: true, category: 'database' },
          { name: 'filesystem', description: 'File system operations', recommended: true, category: 'filesystem' },
          { name: 'github', description: 'GitHub API integration', recommended: false, category: 'api' },
        ],
      })

      render(<ProjectWizard />)

      await user.click(screen.getByRole('button', { name: /browse|select folder/i }))
      await navigateToFinalStep(user)

      await user.click(screen.getByRole('button', { name: /create project/i }))

      await waitFor(() => {
        expect(screen.getByText('sqlite')).toBeInTheDocument()
        expect(screen.getByText('filesystem')).toBeInTheDocument()
        expect(screen.getByText('github')).toBeInTheDocument()
      })
    })

    it('should show success message with created paths', async () => {
      const user = userEvent.setup()
      mockElectronAPI.dialog.selectFolder.mockResolvedValue({
        paths: ['/Users/test/project'],
        error: undefined,
      })
      mockElectronAPI.scaffolding.run.mockResolvedValue({
        success: true,
        createdPaths: ['.claude/', '.beads/', '.design/', 'project.yaml'],
        mcpRecommendations: [],
      })

      render(<ProjectWizard />)

      await user.click(screen.getByRole('button', { name: /browse|select folder/i }))
      await navigateToFinalStep(user)

      await user.click(screen.getByRole('button', { name: /create project/i }))

      await waitFor(() => {
        expect(screen.getByText(/project.*created.*successfully/i)).toBeInTheDocument()
        expect(screen.getByText(/\.claude/)).toBeInTheDocument()
        expect(screen.getByText(/project\.yaml/)).toBeInTheDocument()
      })
    })

    it('should have a "Done" or "Close" button to dismiss success state', async () => {
      const user = userEvent.setup()
      const onComplete = vi.fn()
      mockElectronAPI.dialog.selectFolder.mockResolvedValue({
        paths: ['/Users/test/project'],
        error: undefined,
      })
      mockElectronAPI.scaffolding.run.mockResolvedValue({
        success: true,
        createdPaths: ['.claude/'],
        mcpRecommendations: [],
      })

      render(<ProjectWizard onComplete={onComplete} />)

      await user.click(screen.getByRole('button', { name: /browse|select folder/i }))
      await navigateToFinalStep(user)

      await user.click(screen.getByRole('button', { name: /create project/i }))

      await waitFor(() => {
        expect(screen.getByTestId('mcp-recommendations')).toBeInTheDocument()
      })

      const doneButton = screen.getByRole('button', { name: /done|close|finish/i })
      await user.click(doneButton)

      expect(onComplete).toHaveBeenCalled()
    })

    it('should call onSubmit with complete form data on success', async () => {
      const user = userEvent.setup()
      const onSubmit = vi.fn()
      mockElectronAPI.dialog.selectFolder.mockResolvedValue({
        paths: ['/Users/test/project'],
        error: undefined,
      })
      mockElectronAPI.scaffolding.run.mockResolvedValue({
        success: true,
        createdPaths: ['.claude/'],
        mcpRecommendations: [],
      })

      render(<ProjectWizard onSubmit={onSubmit} />)

      await user.click(screen.getByRole('button', { name: /browse|select folder/i }))
      await user.type(screen.getByLabelText(/project name/i), 'FinalProject')
      await navigateToFinalStep(user)

      await user.click(screen.getByRole('button', { name: /create project/i }))

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'FinalProject',
            targetPath: '/Users/test/project',
          })
        )
      })
    })
  })

  describe('Error Handling and Retry', () => {
    it('should display error message when scaffolding fails', async () => {
      const user = userEvent.setup()
      mockElectronAPI.dialog.selectFolder.mockResolvedValue({
        paths: ['/Users/test/project'],
        error: undefined,
      })
      mockElectronAPI.scaffolding.run.mockResolvedValue({
        success: false,
        error: 'Permission denied: cannot create directory',
      })

      render(<ProjectWizard />)

      await user.click(screen.getByRole('button', { name: /browse|select folder/i }))
      await navigateToFinalStep(user)

      await user.click(screen.getByRole('button', { name: /create project/i }))

      await waitFor(() => {
        expect(screen.getByText(/permission denied/i)).toBeInTheDocument()
      })
    })

    it('should show error state in ScaffoldingProgress component', async () => {
      const user = userEvent.setup()
      mockElectronAPI.dialog.selectFolder.mockResolvedValue({
        paths: ['/Users/test/project'],
        error: undefined,
      })
      mockElectronAPI.scaffolding.run.mockResolvedValue({
        success: false,
        error: 'Failed to create scaffold',
      })

      render(<ProjectWizard />)

      await user.click(screen.getByRole('button', { name: /browse|select folder/i }))
      await navigateToFinalStep(user)

      await user.click(screen.getByRole('button', { name: /create project/i }))

      await waitFor(() => {
        expect(screen.getByTestId('scaffolding-error')).toBeInTheDocument()
      })
    })

    it('should provide retry button on error', async () => {
      const user = userEvent.setup()
      mockElectronAPI.dialog.selectFolder.mockResolvedValue({
        paths: ['/Users/test/project'],
        error: undefined,
      })
      mockElectronAPI.scaffolding.run.mockResolvedValue({
        success: false,
        error: 'Network timeout',
      })

      render(<ProjectWizard />)

      await user.click(screen.getByRole('button', { name: /browse|select folder/i }))
      await navigateToFinalStep(user)

      await user.click(screen.getByRole('button', { name: /create project/i }))

      await waitFor(() => {
        const retryButton = screen.getByRole('button', { name: /retry|try again/i })
        expect(retryButton).toBeInTheDocument()
      })
    })

    it('should retry scaffolding when retry button is clicked', async () => {
      const user = userEvent.setup()
      mockElectronAPI.dialog.selectFolder.mockResolvedValue({
        paths: ['/Users/test/project'],
        error: undefined,
      })

      // First call fails, second succeeds
      mockElectronAPI.scaffolding.run
        .mockResolvedValueOnce({
          success: false,
          error: 'Temporary error',
        })
        .mockResolvedValueOnce({
          success: true,
          createdPaths: ['.claude/'],
          mcpRecommendations: [],
        })

      render(<ProjectWizard />)

      await user.click(screen.getByRole('button', { name: /browse|select folder/i }))
      await navigateToFinalStep(user)

      await user.click(screen.getByRole('button', { name: /create project/i }))

      // Wait for error state
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry|try again/i })).toBeInTheDocument()
      })

      // Click retry
      await user.click(screen.getByRole('button', { name: /retry|try again/i }))

      // Should call scaffolding again
      expect(mockElectronAPI.scaffolding.run).toHaveBeenCalledTimes(2)

      // Should eventually show success
      await waitFor(() => {
        expect(screen.getByTestId('mcp-recommendations')).toBeInTheDocument()
      })
    })

    it('should provide option to go back and edit form on error', async () => {
      const user = userEvent.setup()
      mockElectronAPI.dialog.selectFolder.mockResolvedValue({
        paths: ['/Users/test/project'],
        error: undefined,
      })
      mockElectronAPI.scaffolding.run.mockResolvedValue({
        success: false,
        error: 'Invalid project name',
      })

      render(<ProjectWizard />)

      await user.click(screen.getByRole('button', { name: /browse|select folder/i }))
      await navigateToFinalStep(user)

      await user.click(screen.getByRole('button', { name: /create project/i }))

      await waitFor(() => {
        expect(screen.getByTestId('scaffolding-error')).toBeInTheDocument()
      })

      const backButton = screen.getByRole('button', { name: /back|edit|modify/i })
      await user.click(backButton)

      // Should return to wizard form
      await waitFor(() => {
        expect(screen.getByTestId('project-wizard')).toBeInTheDocument()
        expect(screen.queryByTestId('scaffolding-error')).not.toBeInTheDocument()
      })
    })

    it('should preserve form data when going back after error', async () => {
      const user = userEvent.setup()
      mockElectronAPI.dialog.selectFolder.mockResolvedValue({
        paths: ['/Users/test/project'],
        error: undefined,
      })
      mockElectronAPI.scaffolding.run.mockResolvedValue({
        success: false,
        error: 'Error occurred',
      })

      render(<ProjectWizard />)

      await user.click(screen.getByRole('button', { name: /browse|select folder/i }))

      // Fill in project name
      const projectNameInput = screen.getByLabelText(/project name/i)
      await user.type(projectNameInput, 'MyPreservedProject')

      await navigateToFinalStep(user)
      await user.click(screen.getByRole('button', { name: /create project/i }))

      await waitFor(() => {
        expect(screen.getByTestId('scaffolding-error')).toBeInTheDocument()
      })

      // Go back
      await user.click(screen.getByRole('button', { name: /back|edit|modify/i }))

      // Navigate back to first step if needed
      while (screen.queryByTestId('basic-info-step') === null) {
        const prevButton = screen.queryByRole('button', { name: /previous|back/i })
        if (prevButton) {
          await user.click(prevButton)
        }
        await waitFor(() => {})
      }

      // Check that project name is preserved
      await waitFor(() => {
        expect(screen.getByLabelText(/project name/i)).toHaveValue('MyPreservedProject')
      })
    })

    it('should handle exception thrown by scaffolding run', async () => {
      const user = userEvent.setup()
      mockElectronAPI.dialog.selectFolder.mockResolvedValue({
        paths: ['/Users/test/project'],
        error: undefined,
      })
      mockElectronAPI.scaffolding.run.mockRejectedValue(new Error('Unexpected error'))

      render(<ProjectWizard />)

      await user.click(screen.getByRole('button', { name: /browse|select folder/i }))
      await navigateToFinalStep(user)

      await user.click(screen.getByRole('button', { name: /create project/i }))

      await waitFor(() => {
        expect(screen.getByText(/unexpected error|something went wrong/i)).toBeInTheDocument()
      })
    })

    it('should show specific error messages for common failure scenarios', async () => {
      const user = userEvent.setup()
      mockElectronAPI.dialog.selectFolder.mockResolvedValue({
        paths: ['/Users/test/project'],
        error: undefined,
      })
      mockElectronAPI.scaffolding.run.mockResolvedValue({
        success: false,
        error: 'EEXIST: directory already exists',
        errorCode: 'DIRECTORY_EXISTS',
      })

      render(<ProjectWizard />)

      await user.click(screen.getByRole('button', { name: /browse|select folder/i }))
      await navigateToFinalStep(user)

      await user.click(screen.getByRole('button', { name: /create project/i }))

      await waitFor(() => {
        // Should show a user-friendly message
        expect(screen.getByText(/directory already exists|folder already exists/i)).toBeInTheDocument()
      })
    })
  })

  describe('Integration State Transitions', () => {
    it('should transition from wizard -> progress -> success correctly', async () => {
      const user = userEvent.setup()
      mockElectronAPI.dialog.selectFolder.mockResolvedValue({
        paths: ['/Users/test/project'],
        error: undefined,
      })

      let resolveScaffolding: ((value: unknown) => void) | null = null
      mockElectronAPI.scaffolding.run.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveScaffolding = resolve
          })
      )

      render(<ProjectWizard />)

      // Initial state: wizard
      expect(screen.getByTestId('project-wizard')).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: /browse|select folder/i }))
      await navigateToFinalStep(user)

      await user.click(screen.getByRole('button', { name: /create project/i }))

      // Progress state
      await waitFor(() => {
        expect(screen.getByTestId('scaffolding-progress')).toBeInTheDocument()
      })

      // Complete the scaffolding
      resolveScaffolding?.({
        success: true,
        createdPaths: ['.claude/'],
        mcpRecommendations: [],
      })

      // Success state
      await waitFor(() => {
        expect(screen.getByTestId('mcp-recommendations')).toBeInTheDocument()
      })
    })

    it('should transition from wizard -> progress -> error correctly', async () => {
      const user = userEvent.setup()
      mockElectronAPI.dialog.selectFolder.mockResolvedValue({
        paths: ['/Users/test/project'],
        error: undefined,
      })

      let rejectScaffolding: ((reason: unknown) => void) | null = null
      mockElectronAPI.scaffolding.run.mockImplementation(
        () =>
          new Promise((_, reject) => {
            rejectScaffolding = reject
          })
      )

      render(<ProjectWizard />)

      await user.click(screen.getByRole('button', { name: /browse|select folder/i }))
      await navigateToFinalStep(user)

      await user.click(screen.getByRole('button', { name: /create project/i }))

      // Progress state
      await waitFor(() => {
        expect(screen.getByTestId('scaffolding-progress')).toBeInTheDocument()
      })

      // Fail the scaffolding
      rejectScaffolding?.(new Error('Scaffolding failed'))

      // Error state
      await waitFor(() => {
        expect(screen.getByTestId('scaffolding-error')).toBeInTheDocument()
      })
    })
  })
})
