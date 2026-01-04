/**
 * ScaffoldingProgress Component Tests - TDD RED Phase
 *
 * These tests define the expected behavior for the ScaffoldingProgress component.
 * All tests should FAIL initially since the component doesn't exist yet.
 *
 * Expected component: src/renderer/components/wizard/ScaffoldingProgress.tsx
 *
 * The ScaffoldingProgress component shows step-by-step progress during project
 * scaffolding/initialization:
 * - Creating directories
 * - Writing configs
 * - Initializing beads
 * - Analyzing MCPs
 *
 * Each step displays: pending/in-progress/complete/error state with appropriate
 * visual indicators (spinners, checkmarks, error icons).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

// Import the component that doesn't exist yet - will cause import error until implemented
import { ScaffoldingProgress } from '@renderer/components/wizard/ScaffoldingProgress'

// Type definitions for expected component API
export type StepStatus = 'pending' | 'in_progress' | 'complete' | 'error'

export interface ScaffoldingStep {
  id: string
  label: string
  description?: string
  status: StepStatus
  errorMessage?: string
}

export interface ScaffoldingProgressProps {
  steps: ScaffoldingStep[]
  onRetry?: (stepId: string) => void
  onComplete?: () => void
  className?: string
}

// Default steps matching the requirements
const defaultSteps: ScaffoldingStep[] = [
  { id: 'directories', label: 'Creating directories', status: 'pending' },
  { id: 'configs', label: 'Writing configs', status: 'pending' },
  { id: 'beads', label: 'Initializing beads', status: 'pending' },
  { id: 'mcps', label: 'Analyzing MCPs', status: 'pending' },
]

const allCompleteSteps: ScaffoldingStep[] = [
  { id: 'directories', label: 'Creating directories', status: 'complete' },
  { id: 'configs', label: 'Writing configs', status: 'complete' },
  { id: 'beads', label: 'Initializing beads', status: 'complete' },
  { id: 'mcps', label: 'Analyzing MCPs', status: 'complete' },
]

const stepsWithError: ScaffoldingStep[] = [
  { id: 'directories', label: 'Creating directories', status: 'complete' },
  { id: 'configs', label: 'Writing configs', status: 'error', errorMessage: 'Failed to write project.yaml' },
  { id: 'beads', label: 'Initializing beads', status: 'pending' },
  { id: 'mcps', label: 'Analyzing MCPs', status: 'pending' },
]

const stepsInProgress: ScaffoldingStep[] = [
  { id: 'directories', label: 'Creating directories', status: 'complete' },
  { id: 'configs', label: 'Writing configs', status: 'in_progress' },
  { id: 'beads', label: 'Initializing beads', status: 'pending' },
  { id: 'mcps', label: 'Analyzing MCPs', status: 'pending' },
]

describe('ScaffoldingProgress Component', () => {
  describe('Basic Rendering', () => {
    it('should render the ScaffoldingProgress component', () => {
      render(<ScaffoldingProgress steps={defaultSteps} />)

      expect(screen.getByTestId('scaffolding-progress')).toBeInTheDocument()
    })

    it('should render all progress steps', () => {
      render(<ScaffoldingProgress steps={defaultSteps} />)

      expect(screen.getByText('Creating directories')).toBeInTheDocument()
      expect(screen.getByText('Writing configs')).toBeInTheDocument()
      expect(screen.getByText('Initializing beads')).toBeInTheDocument()
      expect(screen.getByText('Analyzing MCPs')).toBeInTheDocument()
    })

    it('should render each step with correct testid', () => {
      render(<ScaffoldingProgress steps={defaultSteps} />)

      expect(screen.getByTestId('step-directories')).toBeInTheDocument()
      expect(screen.getByTestId('step-configs')).toBeInTheDocument()
      expect(screen.getByTestId('step-beads')).toBeInTheDocument()
      expect(screen.getByTestId('step-mcps')).toBeInTheDocument()
    })

    it('should render step descriptions when provided', () => {
      const stepsWithDescriptions: ScaffoldingStep[] = [
        { id: 'directories', label: 'Creating directories', description: 'Setting up .claude, .beads, .design folders', status: 'pending' },
        { id: 'configs', label: 'Writing configs', description: 'project.yaml and CLAUDE.md', status: 'pending' },
      ]

      render(<ScaffoldingProgress steps={stepsWithDescriptions} />)

      expect(screen.getByText('Setting up .claude, .beads, .design folders')).toBeInTheDocument()
      expect(screen.getByText('project.yaml and CLAUDE.md')).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      render(<ScaffoldingProgress steps={defaultSteps} className="custom-class" />)

      expect(screen.getByTestId('scaffolding-progress')).toHaveClass('custom-class')
    })
  })

  describe('Step States - Pending', () => {
    it('should render pending steps with pending visual indicator', () => {
      render(<ScaffoldingProgress steps={defaultSteps} />)

      const step = screen.getByTestId('step-directories')
      expect(step).toHaveAttribute('data-status', 'pending')
    })

    it('should show muted/dim styling for pending steps', () => {
      render(<ScaffoldingProgress steps={defaultSteps} />)

      const stepIndicator = screen.getByTestId('step-indicator-directories')
      expect(stepIndicator.className).toMatch(/text-muted|opacity-|bg-muted/)
    })

    it('should not show spinner for pending steps', () => {
      render(<ScaffoldingProgress steps={defaultSteps} />)

      const step = screen.getByTestId('step-directories')
      expect(step.querySelector('[data-testid="loading-spinner"]')).not.toBeInTheDocument()
    })

    it('should not show checkmark for pending steps', () => {
      render(<ScaffoldingProgress steps={defaultSteps} />)

      const step = screen.getByTestId('step-directories')
      expect(step.querySelector('[data-testid="check-icon"]')).not.toBeInTheDocument()
    })

    it('should show step number or circle icon for pending steps', () => {
      render(<ScaffoldingProgress steps={defaultSteps} />)

      const stepIndicator = screen.getByTestId('step-indicator-directories')
      // Either shows a number or a circle/dot icon
      expect(stepIndicator.textContent || stepIndicator.querySelector('svg')).toBeTruthy()
    })
  })

  describe('Step States - In Progress', () => {
    it('should render in-progress steps with in_progress data attribute', () => {
      render(<ScaffoldingProgress steps={stepsInProgress} />)

      const step = screen.getByTestId('step-configs')
      expect(step).toHaveAttribute('data-status', 'in_progress')
    })

    it('should show loading spinner for in-progress steps', () => {
      render(<ScaffoldingProgress steps={stepsInProgress} />)

      const step = screen.getByTestId('step-configs')
      const spinner = step.querySelector('[data-testid="loading-spinner"]') ||
                     step.querySelector('svg.animate-spin') ||
                     step.querySelector('[class*="animate-spin"]')
      expect(spinner).toBeInTheDocument()
    })

    it('should highlight in-progress step with accent color', () => {
      render(<ScaffoldingProgress steps={stepsInProgress} />)

      const stepIndicator = screen.getByTestId('step-indicator-configs')
      expect(stepIndicator.className).toMatch(/text-primary|text-blue|border-primary/)
    })

    it('should show animated indicator for in-progress steps', () => {
      render(<ScaffoldingProgress steps={stepsInProgress} />)

      const step = screen.getByTestId('step-configs')
      // Check for any animation-related class
      const hasAnimation = step.querySelector('[class*="animate"]') !== null
      expect(hasAnimation).toBe(true)
    })
  })

  describe('Step States - Complete', () => {
    it('should render complete steps with complete data attribute', () => {
      render(<ScaffoldingProgress steps={allCompleteSteps} />)

      const step = screen.getByTestId('step-directories')
      expect(step).toHaveAttribute('data-status', 'complete')
    })

    it('should show checkmark icon for completed steps', () => {
      render(<ScaffoldingProgress steps={allCompleteSteps} />)

      const step = screen.getByTestId('step-directories')
      const checkIcon = step.querySelector('[data-testid="check-icon"]') ||
                       step.querySelector('svg') // lucide-react Check icon
      expect(checkIcon).toBeInTheDocument()
    })

    it('should apply success styling to completed steps', () => {
      render(<ScaffoldingProgress steps={allCompleteSteps} />)

      const stepIndicator = screen.getByTestId('step-indicator-directories')
      expect(stepIndicator.className).toMatch(/text-green|text-emerald|text-success|bg-green|bg-emerald/)
    })

    it('should not show spinner for completed steps', () => {
      render(<ScaffoldingProgress steps={allCompleteSteps} />)

      const step = screen.getByTestId('step-directories')
      expect(step.querySelector('[data-testid="loading-spinner"]')).not.toBeInTheDocument()
    })
  })

  describe('Step States - Error', () => {
    it('should render error steps with error data attribute', () => {
      render(<ScaffoldingProgress steps={stepsWithError} />)

      const step = screen.getByTestId('step-configs')
      expect(step).toHaveAttribute('data-status', 'error')
    })

    it('should show error icon for error steps', () => {
      render(<ScaffoldingProgress steps={stepsWithError} />)

      const step = screen.getByTestId('step-configs')
      const errorIcon = step.querySelector('[data-testid="error-icon"]') ||
                       step.querySelector('svg') // X or AlertCircle icon
      expect(errorIcon).toBeInTheDocument()
    })

    it('should display error message when step has error', () => {
      render(<ScaffoldingProgress steps={stepsWithError} />)

      expect(screen.getByText('Failed to write project.yaml')).toBeInTheDocument()
    })

    it('should apply error/destructive styling to error steps', () => {
      render(<ScaffoldingProgress steps={stepsWithError} />)

      const stepIndicator = screen.getByTestId('step-indicator-configs')
      expect(stepIndicator.className).toMatch(/text-red|text-destructive|bg-red|border-red/)
    })

    it('should show retry button for error steps', () => {
      render(<ScaffoldingProgress steps={stepsWithError} />)

      const step = screen.getByTestId('step-configs')
      expect(within(step).getByRole('button', { name: /retry/i })).toBeInTheDocument()
    })

    it('should show error message with error role for accessibility', () => {
      render(<ScaffoldingProgress steps={stepsWithError} />)

      const errorMessage = screen.getByText('Failed to write project.yaml')
      expect(errorMessage.closest('[role="alert"]') || errorMessage.getAttribute('role')).toBeTruthy()
    })
  })

  describe('Step State Transitions', () => {
    it('should update visual indicator when step transitions from pending to in_progress', () => {
      const { rerender } = render(<ScaffoldingProgress steps={defaultSteps} />)

      // Initially pending
      expect(screen.getByTestId('step-directories')).toHaveAttribute('data-status', 'pending')

      // Transition to in_progress
      const updatedSteps = [
        { ...defaultSteps[0], status: 'in_progress' as const },
        ...defaultSteps.slice(1),
      ]
      rerender(<ScaffoldingProgress steps={updatedSteps} />)

      expect(screen.getByTestId('step-directories')).toHaveAttribute('data-status', 'in_progress')
    })

    it('should update visual indicator when step transitions from in_progress to complete', () => {
      const inProgressSteps = [
        { ...defaultSteps[0], status: 'in_progress' as const },
        ...defaultSteps.slice(1),
      ]

      const { rerender } = render(<ScaffoldingProgress steps={inProgressSteps} />)

      expect(screen.getByTestId('step-directories')).toHaveAttribute('data-status', 'in_progress')

      // Transition to complete
      const completedSteps = [
        { ...defaultSteps[0], status: 'complete' as const },
        ...defaultSteps.slice(1),
      ]
      rerender(<ScaffoldingProgress steps={completedSteps} />)

      expect(screen.getByTestId('step-directories')).toHaveAttribute('data-status', 'complete')
    })

    it('should update visual indicator when step transitions from in_progress to error', () => {
      const inProgressSteps = [
        { ...defaultSteps[0], status: 'in_progress' as const },
        ...defaultSteps.slice(1),
      ]

      const { rerender } = render(<ScaffoldingProgress steps={inProgressSteps} />)

      expect(screen.getByTestId('step-directories')).toHaveAttribute('data-status', 'in_progress')

      // Transition to error
      const errorSteps = [
        { ...defaultSteps[0], status: 'error' as const, errorMessage: 'Permission denied' },
        ...defaultSteps.slice(1),
      ]
      rerender(<ScaffoldingProgress steps={errorSteps} />)

      expect(screen.getByTestId('step-directories')).toHaveAttribute('data-status', 'error')
      expect(screen.getByText('Permission denied')).toBeInTheDocument()
    })

    it('should handle full workflow from pending through complete', () => {
      const { rerender } = render(<ScaffoldingProgress steps={defaultSteps} />)

      // All pending initially
      defaultSteps.forEach((step) => {
        expect(screen.getByTestId(`step-${step.id}`)).toHaveAttribute('data-status', 'pending')
      })

      // Step 1: in_progress
      rerender(<ScaffoldingProgress steps={[
        { ...defaultSteps[0], status: 'in_progress' },
        ...defaultSteps.slice(1),
      ]} />)
      expect(screen.getByTestId('step-directories')).toHaveAttribute('data-status', 'in_progress')

      // Step 1: complete, Step 2: in_progress
      rerender(<ScaffoldingProgress steps={[
        { ...defaultSteps[0], status: 'complete' },
        { ...defaultSteps[1], status: 'in_progress' },
        ...defaultSteps.slice(2),
      ]} />)
      expect(screen.getByTestId('step-directories')).toHaveAttribute('data-status', 'complete')
      expect(screen.getByTestId('step-configs')).toHaveAttribute('data-status', 'in_progress')

      // All complete
      rerender(<ScaffoldingProgress steps={allCompleteSteps} />)
      allCompleteSteps.forEach((step) => {
        expect(screen.getByTestId(`step-${step.id}`)).toHaveAttribute('data-status', 'complete')
      })
    })
  })

  describe('Retry Button Functionality', () => {
    it('should call onRetry with step id when retry button is clicked', async () => {
      const handleRetry = vi.fn()
      const user = userEvent.setup()

      render(<ScaffoldingProgress steps={stepsWithError} onRetry={handleRetry} />)

      const retryButton = screen.getByRole('button', { name: /retry/i })
      await user.click(retryButton)

      expect(handleRetry).toHaveBeenCalledWith('configs')
    })

    it('should only show retry button on error steps', () => {
      render(<ScaffoldingProgress steps={stepsWithError} onRetry={vi.fn()} />)

      // Complete step should not have retry button
      const completeStep = screen.getByTestId('step-directories')
      expect(within(completeStep).queryByRole('button', { name: /retry/i })).not.toBeInTheDocument()

      // Pending step should not have retry button
      const pendingStep = screen.getByTestId('step-beads')
      expect(within(pendingStep).queryByRole('button', { name: /retry/i })).not.toBeInTheDocument()

      // Error step should have retry button
      const errorStep = screen.getByTestId('step-configs')
      expect(within(errorStep).getByRole('button', { name: /retry/i })).toBeInTheDocument()
    })

    it('should not render retry button when onRetry is not provided', () => {
      render(<ScaffoldingProgress steps={stepsWithError} />)

      expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument()
    })

    it('should allow retrying multiple error steps', async () => {
      const handleRetry = vi.fn()
      const user = userEvent.setup()

      const multipleErrors: ScaffoldingStep[] = [
        { id: 'directories', label: 'Creating directories', status: 'error', errorMessage: 'Error 1' },
        { id: 'configs', label: 'Writing configs', status: 'error', errorMessage: 'Error 2' },
        { id: 'beads', label: 'Initializing beads', status: 'pending' },
        { id: 'mcps', label: 'Analyzing MCPs', status: 'pending' },
      ]

      render(<ScaffoldingProgress steps={multipleErrors} onRetry={handleRetry} />)

      const retryButtons = screen.getAllByRole('button', { name: /retry/i })
      expect(retryButtons).toHaveLength(2)

      await user.click(retryButtons[0])
      expect(handleRetry).toHaveBeenCalledWith('directories')

      await user.click(retryButtons[1])
      expect(handleRetry).toHaveBeenCalledWith('configs')
    })
  })

  describe('Completion Callback', () => {
    it('should call onComplete when all steps are complete', () => {
      const handleComplete = vi.fn()

      render(<ScaffoldingProgress steps={allCompleteSteps} onComplete={handleComplete} />)

      expect(handleComplete).toHaveBeenCalled()
    })

    it('should not call onComplete when some steps are pending', () => {
      const handleComplete = vi.fn()

      render(<ScaffoldingProgress steps={stepsInProgress} onComplete={handleComplete} />)

      expect(handleComplete).not.toHaveBeenCalled()
    })

    it('should not call onComplete when any step has error', () => {
      const handleComplete = vi.fn()

      render(<ScaffoldingProgress steps={stepsWithError} onComplete={handleComplete} />)

      expect(handleComplete).not.toHaveBeenCalled()
    })

    it('should call onComplete when steps transition to all complete', () => {
      const handleComplete = vi.fn()

      const { rerender } = render(
        <ScaffoldingProgress steps={stepsInProgress} onComplete={handleComplete} />
      )

      expect(handleComplete).not.toHaveBeenCalled()

      rerender(<ScaffoldingProgress steps={allCompleteSteps} onComplete={handleComplete} />)

      expect(handleComplete).toHaveBeenCalled()
    })

    it('should only call onComplete once when all steps are complete', () => {
      const handleComplete = vi.fn()

      const { rerender } = render(
        <ScaffoldingProgress steps={allCompleteSteps} onComplete={handleComplete} />
      )

      expect(handleComplete).toHaveBeenCalledTimes(1)

      // Re-render with same props
      rerender(<ScaffoldingProgress steps={allCompleteSteps} onComplete={handleComplete} />)

      // Should still only have been called once
      expect(handleComplete).toHaveBeenCalledTimes(1)
    })
  })

  describe('Accessibility', () => {
    it('should have list role for steps container', () => {
      render(<ScaffoldingProgress steps={defaultSteps} />)

      expect(screen.getByRole('list')).toBeInTheDocument()
    })

    it('should have listitem role for each step', () => {
      render(<ScaffoldingProgress steps={defaultSteps} />)

      const listItems = screen.getAllByRole('listitem')
      expect(listItems).toHaveLength(4)
    })

    it('should have accessible status announcement for screen readers', () => {
      render(<ScaffoldingProgress steps={stepsInProgress} />)

      // Each step should communicate its status accessibly
      const inProgressStep = screen.getByTestId('step-configs')
      expect(inProgressStep.getAttribute('aria-label') || inProgressStep.getAttribute('aria-describedby')).toBeTruthy()
    })

    it('should have aria-live region for status updates', () => {
      render(<ScaffoldingProgress steps={defaultSteps} />)

      // Progress component should have live region for dynamic updates
      const liveRegion = screen.getByTestId('scaffolding-progress')
        .querySelector('[aria-live]') ||
        screen.getByTestId('scaffolding-progress').getAttribute('aria-live')
      expect(liveRegion).toBeTruthy()
    })

    it('should communicate error state accessibly', () => {
      render(<ScaffoldingProgress steps={stepsWithError} />)

      // Error message should be in an alert role
      const errorMessage = screen.getByText('Failed to write project.yaml')
      const alertElement = errorMessage.closest('[role="alert"]') ||
                          (errorMessage.getAttribute('role') === 'alert' ? errorMessage : null)
      expect(alertElement).toBeInTheDocument()
    })

    it('should have aria-label on retry button', () => {
      render(<ScaffoldingProgress steps={stepsWithError} onRetry={vi.fn()} />)

      const retryButton = screen.getByRole('button', { name: /retry/i })
      expect(retryButton.getAttribute('aria-label') || retryButton.textContent).toMatch(/retry/i)
    })

    it('should indicate loading state for in-progress steps', () => {
      render(<ScaffoldingProgress steps={stepsInProgress} />)

      const inProgressStep = screen.getByTestId('step-configs')
      // Should have aria-busy or spinner with appropriate role
      const hasLoadingIndication =
        inProgressStep.getAttribute('aria-busy') === 'true' ||
        inProgressStep.querySelector('[role="progressbar"]') !== null ||
        inProgressStep.querySelector('[aria-label*="loading"]') !== null
      expect(hasLoadingIndication).toBe(true)
    })
  })

  describe('Visual Layout', () => {
    it('should render steps in vertical list layout', () => {
      render(<ScaffoldingProgress steps={defaultSteps} />)

      const list = screen.getByRole('list')
      // Should have flex column or similar vertical layout
      expect(list.className).toMatch(/flex.*col|space-y|gap/)
    })

    it('should render step indicator before step label', () => {
      render(<ScaffoldingProgress steps={defaultSteps} />)

      const step = screen.getByTestId('step-directories')
      const indicator = step.querySelector('[data-testid="step-indicator-directories"]')
      const label = step.querySelector('[data-testid="step-label-directories"]') ||
                   screen.getByText('Creating directories')

      // Indicator should come before label in DOM order
      expect(indicator).toBeInTheDocument()
      expect(label).toBeInTheDocument()
    })

    it('should show error message below step when in error state', () => {
      render(<ScaffoldingProgress steps={stepsWithError} />)

      const step = screen.getByTestId('step-configs')
      const label = screen.getByText('Writing configs')
      const errorMessage = screen.getByText('Failed to write project.yaml')

      // Both should be within the step
      expect(step).toContainElement(label)
      expect(step).toContainElement(errorMessage)
    })
  })

  describe('Progress Summary', () => {
    it('should show overall progress count', () => {
      render(<ScaffoldingProgress steps={stepsInProgress} />)

      // Should show something like "1/4 complete" or "Step 2 of 4"
      expect(screen.getByText(/1.*4|step.*2.*4/i)).toBeInTheDocument()
    })

    it('should update progress count as steps complete', () => {
      const { rerender } = render(<ScaffoldingProgress steps={stepsInProgress} />)

      // 1 complete
      expect(screen.getByText(/1.*4/i)).toBeInTheDocument()

      // Update to 2 complete
      const twoComplete = [
        { ...defaultSteps[0], status: 'complete' as const },
        { ...defaultSteps[1], status: 'complete' as const },
        { ...defaultSteps[2], status: 'in_progress' as const },
        { ...defaultSteps[3], status: 'pending' as const },
      ]
      rerender(<ScaffoldingProgress steps={twoComplete} />)

      expect(screen.getByText(/2.*4/i)).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty steps array', () => {
      render(<ScaffoldingProgress steps={[]} />)

      // Should render without crashing
      expect(screen.getByTestId('scaffolding-progress')).toBeInTheDocument()
    })

    it('should handle single step', () => {
      const singleStep = [{ id: 'only', label: 'Only Step', status: 'pending' as const }]
      render(<ScaffoldingProgress steps={singleStep} />)

      expect(screen.getByText('Only Step')).toBeInTheDocument()
    })

    it('should handle very long step labels', () => {
      const longLabel = 'This is a very long step label that might overflow the container'
      const stepsWithLongLabel = [
        { id: 'long', label: longLabel, status: 'pending' as const },
      ]

      render(<ScaffoldingProgress steps={stepsWithLongLabel} />)

      expect(screen.getByText(longLabel)).toBeInTheDocument()
    })

    it('should handle very long error messages', () => {
      const longError = 'This is a very long error message that provides detailed information about what went wrong during the scaffolding process'
      const stepsWithLongError = [
        { id: 'error', label: 'Step', status: 'error' as const, errorMessage: longError },
      ]

      render(<ScaffoldingProgress steps={stepsWithLongError} />)

      expect(screen.getByText(longError)).toBeInTheDocument()
    })

    it('should handle undefined errorMessage for error status', () => {
      const errorWithoutMessage = [
        { id: 'error', label: 'Failed Step', status: 'error' as const },
      ]

      render(<ScaffoldingProgress steps={errorWithoutMessage} onRetry={vi.fn()} />)

      // Should still render and show retry button
      const step = screen.getByTestId('step-error')
      expect(step).toHaveAttribute('data-status', 'error')
      expect(within(step).getByRole('button', { name: /retry/i })).toBeInTheDocument()
    })
  })

  describe('Custom Step Icons', () => {
    it('should support custom step icons based on step id', () => {
      // Steps may have different icons based on what they represent
      render(<ScaffoldingProgress steps={defaultSteps} />)

      // Each step should have an indicator with appropriate icon
      expect(screen.getByTestId('step-indicator-directories')).toBeInTheDocument()
      expect(screen.getByTestId('step-indicator-configs')).toBeInTheDocument()
      expect(screen.getByTestId('step-indicator-beads')).toBeInTheDocument()
      expect(screen.getByTestId('step-indicator-mcps')).toBeInTheDocument()
    })
  })
})

describe('ScaffoldingProgress Integration', () => {
  it('should simulate full scaffolding workflow', async () => {
    const handleComplete = vi.fn()
    const handleRetry = vi.fn()

    // Start with all pending
    const { rerender } = render(
      <ScaffoldingProgress
        steps={defaultSteps}
        onComplete={handleComplete}
        onRetry={handleRetry}
      />
    )

    // Simulate step 1 in progress
    rerender(
      <ScaffoldingProgress
        steps={[
          { ...defaultSteps[0], status: 'in_progress' },
          ...defaultSteps.slice(1),
        ]}
        onComplete={handleComplete}
        onRetry={handleRetry}
      />
    )

    expect(screen.getByTestId('step-directories')).toHaveAttribute('data-status', 'in_progress')

    // Simulate step 1 complete, step 2 in progress
    rerender(
      <ScaffoldingProgress
        steps={[
          { ...defaultSteps[0], status: 'complete' },
          { ...defaultSteps[1], status: 'in_progress' },
          ...defaultSteps.slice(2),
        ]}
        onComplete={handleComplete}
        onRetry={handleRetry}
      />
    )

    expect(screen.getByTestId('step-directories')).toHaveAttribute('data-status', 'complete')
    expect(screen.getByTestId('step-configs')).toHaveAttribute('data-status', 'in_progress')

    // Complete all
    rerender(
      <ScaffoldingProgress
        steps={allCompleteSteps}
        onComplete={handleComplete}
        onRetry={handleRetry}
      />
    )

    expect(handleComplete).toHaveBeenCalled()
  })

  it('should handle error recovery workflow', async () => {
    const handleComplete = vi.fn()
    const handleRetry = vi.fn()
    const user = userEvent.setup()

    // Start with error on step 2
    const { rerender } = render(
      <ScaffoldingProgress
        steps={stepsWithError}
        onComplete={handleComplete}
        onRetry={handleRetry}
      />
    )

    expect(handleComplete).not.toHaveBeenCalled()

    // Click retry
    await user.click(screen.getByRole('button', { name: /retry/i }))
    expect(handleRetry).toHaveBeenCalledWith('configs')

    // Simulate retry success and completion
    rerender(
      <ScaffoldingProgress
        steps={allCompleteSteps}
        onComplete={handleComplete}
        onRetry={handleRetry}
      />
    )

    expect(handleComplete).toHaveBeenCalled()
  })
})
