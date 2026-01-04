/**
 * WizardStepper Component Tests - TDD RED Phase
 *
 * These tests define the expected behavior for the WizardStepper component.
 * All tests should FAIL initially since the component doesn't exist yet.
 *
 * Expected component: src/renderer/components/wizard/WizardStepper.tsx
 *
 * The WizardStepper shows progress through a multi-step wizard,
 * displaying step numbers, labels, and completion status.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

// Import the component that doesn't exist yet - will cause import error until implemented
import { WizardStepper } from '@renderer/components/wizard/WizardStepper'

// Type definitions for the expected component API
interface Step {
  id: string
  label: string
  description?: string
}

const defaultSteps: Step[] = [
  { id: 'step-1', label: 'Basic Info', description: 'Enter basic information' },
  { id: 'step-2', label: 'Details', description: 'Provide details' },
  { id: 'step-3', label: 'Review', description: 'Review and confirm' },
  { id: 'step-4', label: 'Complete', description: 'Finalize wizard' },
]

describe('WizardStepper Component', () => {
  describe('Basic Rendering', () => {
    it('should render all steps', () => {
      render(<WizardStepper steps={defaultSteps} currentStep={0} />)

      expect(screen.getByText('Basic Info')).toBeInTheDocument()
      expect(screen.getByText('Details')).toBeInTheDocument()
      expect(screen.getByText('Review')).toBeInTheDocument()
      expect(screen.getByText('Complete')).toBeInTheDocument()
    })

    it('should render step labels', () => {
      render(<WizardStepper steps={defaultSteps} currentStep={0} />)

      defaultSteps.forEach((step) => {
        expect(screen.getByText(step.label)).toBeInTheDocument()
      })
    })

    it('should render step numbers', () => {
      render(<WizardStepper steps={defaultSteps} currentStep={0} />)

      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
      expect(screen.getByText('4')).toBeInTheDocument()
    })

    it('should render step descriptions when provided', () => {
      render(<WizardStepper steps={defaultSteps} currentStep={0} showDescriptions />)

      expect(screen.getByText('Enter basic information')).toBeInTheDocument()
      expect(screen.getByText('Provide details')).toBeInTheDocument()
      expect(screen.getByText('Review and confirm')).toBeInTheDocument()
      expect(screen.getByText('Finalize wizard')).toBeInTheDocument()
    })

    it('should render connecting lines between steps', () => {
      render(<WizardStepper steps={defaultSteps} currentStep={0} />)

      // Should have n-1 connectors for n steps
      const connectors = screen.getAllByTestId('step-connector')
      expect(connectors).toHaveLength(3)
    })
  })

  describe('Current Step Highlighting', () => {
    it('should highlight the current step', () => {
      render(<WizardStepper steps={defaultSteps} currentStep={1} />)

      const currentStepElement = screen.getByTestId('step-1')
      expect(currentStepElement).toHaveAttribute('data-state', 'current')
    })

    it('should apply special styling to current step', () => {
      render(<WizardStepper steps={defaultSteps} currentStep={1} />)

      const currentStepIndicator = screen.getByTestId('step-indicator-1')
      // Current step should have primary/highlighted styling
      expect(currentStepIndicator.className).toMatch(/bg-primary|ring|border-primary/)
    })

    it('should highlight step 0 when currentStep is 0', () => {
      render(<WizardStepper steps={defaultSteps} currentStep={0} />)

      const firstStep = screen.getByTestId('step-0')
      expect(firstStep).toHaveAttribute('data-state', 'current')
    })

    it('should highlight the last step when currentStep equals last index', () => {
      render(<WizardStepper steps={defaultSteps} currentStep={3} />)

      const lastStep = screen.getByTestId('step-3')
      expect(lastStep).toHaveAttribute('data-state', 'current')
    })

    it('should show current step label with emphasis', () => {
      render(<WizardStepper steps={defaultSteps} currentStep={1} />)

      const currentStepLabel = screen.getByTestId('step-label-1')
      expect(currentStepLabel.className).toMatch(/font-medium|font-semibold|text-primary/)
    })
  })

  describe('Completed Steps', () => {
    it('should show completed steps with checkmark', () => {
      render(<WizardStepper steps={defaultSteps} currentStep={2} />)

      // Steps 0 and 1 should be completed
      const step0Indicator = screen.getByTestId('step-indicator-0')
      const step1Indicator = screen.getByTestId('step-indicator-1')

      expect(step0Indicator.querySelector('svg')).toBeInTheDocument()
      expect(step1Indicator.querySelector('svg')).toBeInTheDocument()
    })

    it('should mark steps before current as completed', () => {
      render(<WizardStepper steps={defaultSteps} currentStep={2} />)

      expect(screen.getByTestId('step-0')).toHaveAttribute('data-state', 'completed')
      expect(screen.getByTestId('step-1')).toHaveAttribute('data-state', 'completed')
    })

    it('should not show checkmark for current step', () => {
      render(<WizardStepper steps={defaultSteps} currentStep={2} />)

      const currentStepIndicator = screen.getByTestId('step-indicator-2')
      // Current step should show number, not checkmark
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('should not show checkmark for future steps', () => {
      render(<WizardStepper steps={defaultSteps} currentStep={1} />)

      const futureStepIndicator = screen.getByTestId('step-indicator-3')
      // Future step should show number
      expect(futureStepIndicator.textContent).toContain('4')
    })

    it('should color completed step connectors', () => {
      render(<WizardStepper steps={defaultSteps} currentStep={2} />)

      const connectors = screen.getAllByTestId('step-connector')
      // First two connectors (between 0-1 and 1-2) should be colored
      expect(connectors[0].className).toMatch(/bg-primary/)
      expect(connectors[1].className).toMatch(/bg-primary/)
    })

    it('should not color incomplete step connectors', () => {
      render(<WizardStepper steps={defaultSteps} currentStep={1} />)

      const connectors = screen.getAllByTestId('step-connector')
      // Only first connector should be colored, rest should be muted
      expect(connectors[1].className).toMatch(/bg-muted|bg-gray/)
      expect(connectors[2].className).toMatch(/bg-muted|bg-gray/)
    })
  })

  describe('Upcoming Steps', () => {
    it('should mark steps after current as upcoming', () => {
      render(<WizardStepper steps={defaultSteps} currentStep={1} />)

      expect(screen.getByTestId('step-2')).toHaveAttribute('data-state', 'upcoming')
      expect(screen.getByTestId('step-3')).toHaveAttribute('data-state', 'upcoming')
    })

    it('should apply muted styling to upcoming steps', () => {
      render(<WizardStepper steps={defaultSteps} currentStep={0} />)

      const upcomingStepLabel = screen.getByTestId('step-label-2')
      expect(upcomingStepLabel.className).toMatch(/text-muted|opacity-/)
    })

    it('should show step numbers for upcoming steps', () => {
      render(<WizardStepper steps={defaultSteps} currentStep={0} />)

      const upcomingIndicator = screen.getByTestId('step-indicator-3')
      expect(upcomingIndicator.textContent).toContain('4')
    })
  })

  describe('Step Click Navigation', () => {
    it('should call onStepClick when step is clicked and clickable', async () => {
      const handleStepClick = vi.fn()
      const user = userEvent.setup()

      render(
        <WizardStepper
          steps={defaultSteps}
          currentStep={2}
          onStepClick={handleStepClick}
          clickableSteps
        />
      )

      const step1 = screen.getByTestId('step-1')
      await user.click(step1)

      expect(handleStepClick).toHaveBeenCalledWith(1)
    })

    it('should call onStepClick with step index', async () => {
      const handleStepClick = vi.fn()
      const user = userEvent.setup()

      render(
        <WizardStepper
          steps={defaultSteps}
          currentStep={3}
          onStepClick={handleStepClick}
          clickableSteps
        />
      )

      await user.click(screen.getByTestId('step-0'))
      expect(handleStepClick).toHaveBeenCalledWith(0)

      await user.click(screen.getByTestId('step-2'))
      expect(handleStepClick).toHaveBeenCalledWith(2)
    })

    it('should not call onStepClick when clickableSteps is false', async () => {
      const handleStepClick = vi.fn()
      const user = userEvent.setup()

      render(
        <WizardStepper
          steps={defaultSteps}
          currentStep={2}
          onStepClick={handleStepClick}
          clickableSteps={false}
        />
      )

      await user.click(screen.getByTestId('step-0'))

      expect(handleStepClick).not.toHaveBeenCalled()
    })

    it('should only allow clicking completed steps by default', async () => {
      const handleStepClick = vi.fn()
      const user = userEvent.setup()

      render(
        <WizardStepper
          steps={defaultSteps}
          currentStep={2}
          onStepClick={handleStepClick}
          clickableSteps
        />
      )

      // Clicking future step should not work
      await user.click(screen.getByTestId('step-3'))
      expect(handleStepClick).not.toHaveBeenCalled()

      // Clicking completed step should work
      await user.click(screen.getByTestId('step-0'))
      expect(handleStepClick).toHaveBeenCalledWith(0)
    })

    it('should allow clicking all steps when allowFutureSteps is true', async () => {
      const handleStepClick = vi.fn()
      const user = userEvent.setup()

      render(
        <WizardStepper
          steps={defaultSteps}
          currentStep={1}
          onStepClick={handleStepClick}
          clickableSteps
          allowFutureSteps
        />
      )

      await user.click(screen.getByTestId('step-3'))
      expect(handleStepClick).toHaveBeenCalledWith(3)
    })

    it('should have cursor-pointer on clickable steps', () => {
      render(
        <WizardStepper
          steps={defaultSteps}
          currentStep={2}
          onStepClick={() => {}}
          clickableSteps
        />
      )

      const completedStep = screen.getByTestId('step-0')
      expect(completedStep.className).toMatch(/cursor-pointer/)
    })

    it('should not have cursor-pointer on non-clickable steps', () => {
      render(
        <WizardStepper
          steps={defaultSteps}
          currentStep={0}
          clickableSteps={false}
        />
      )

      const step = screen.getByTestId('step-0')
      expect(step.className).not.toMatch(/cursor-pointer/)
    })
  })

  describe('Accessibility', () => {
    it('should have navigation role on container', () => {
      render(<WizardStepper steps={defaultSteps} currentStep={0} />)

      expect(screen.getByRole('navigation')).toBeInTheDocument()
    })

    it('should have aria-label on navigation', () => {
      render(<WizardStepper steps={defaultSteps} currentStep={0} />)

      const nav = screen.getByRole('navigation')
      expect(nav).toHaveAttribute('aria-label', 'Wizard progress')
    })

    it('should have list role for steps', () => {
      render(<WizardStepper steps={defaultSteps} currentStep={0} />)

      expect(screen.getByRole('list')).toBeInTheDocument()
    })

    it('should have listitem role for each step', () => {
      render(<WizardStepper steps={defaultSteps} currentStep={0} />)

      const listItems = screen.getAllByRole('listitem')
      expect(listItems).toHaveLength(4)
    })

    it('should indicate current step with aria-current', () => {
      render(<WizardStepper steps={defaultSteps} currentStep={2} />)

      const currentStep = screen.getByTestId('step-2')
      expect(currentStep).toHaveAttribute('aria-current', 'step')
    })

    it('should not have aria-current on non-current steps', () => {
      render(<WizardStepper steps={defaultSteps} currentStep={2} />)

      const otherStep = screen.getByTestId('step-0')
      expect(otherStep).not.toHaveAttribute('aria-current')
    })

    it('should be keyboard navigable when clickable', async () => {
      const handleStepClick = vi.fn()
      const user = userEvent.setup()

      render(
        <WizardStepper
          steps={defaultSteps}
          currentStep={2}
          onStepClick={handleStepClick}
          clickableSteps
        />
      )

      const step0 = screen.getByTestId('step-0')
      step0.focus()

      await user.keyboard('{Enter}')

      expect(handleStepClick).toHaveBeenCalledWith(0)
    })

    it('should have accessible step descriptions', () => {
      render(<WizardStepper steps={defaultSteps} currentStep={1} />)

      // Each step should have descriptive text for screen readers
      const step0 = screen.getByTestId('step-0')
      expect(step0.getAttribute('aria-label')).toMatch(/step 1.*Basic Info.*completed/i)

      const step1 = screen.getByTestId('step-1')
      expect(step1.getAttribute('aria-label')).toMatch(/step 2.*Details.*current/i)

      const step2 = screen.getByTestId('step-2')
      expect(step2.getAttribute('aria-label')).toMatch(/step 3.*Review.*upcoming/i)
    })
  })

  describe('Custom Styling', () => {
    it('should apply custom className to container', () => {
      render(
        <WizardStepper
          steps={defaultSteps}
          currentStep={0}
          className="custom-stepper"
        />
      )

      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('custom-stepper')
    })

    it('should support vertical orientation', () => {
      render(
        <WizardStepper
          steps={defaultSteps}
          currentStep={0}
          orientation="vertical"
        />
      )

      const stepList = screen.getByRole('list')
      expect(stepList.className).toMatch(/flex-col/)
    })

    it('should default to horizontal orientation', () => {
      render(<WizardStepper steps={defaultSteps} currentStep={0} />)

      const stepList = screen.getByRole('list')
      expect(stepList.className).toMatch(/flex-row|flex/)
      expect(stepList.className).not.toMatch(/flex-col/)
    })
  })

  describe('Edge Cases', () => {
    it('should handle single step', () => {
      const singleStep = [{ id: 'only', label: 'Only Step' }]
      render(<WizardStepper steps={singleStep} currentStep={0} />)

      expect(screen.getByText('Only Step')).toBeInTheDocument()
      // No connectors for single step
      expect(screen.queryByTestId('step-connector')).not.toBeInTheDocument()
    })

    it('should handle two steps', () => {
      const twoSteps = [
        { id: 'first', label: 'First' },
        { id: 'second', label: 'Second' },
      ]
      render(<WizardStepper steps={twoSteps} currentStep={0} />)

      expect(screen.getByText('First')).toBeInTheDocument()
      expect(screen.getByText('Second')).toBeInTheDocument()
      // One connector between two steps
      expect(screen.getAllByTestId('step-connector')).toHaveLength(1)
    })

    it('should handle empty steps array gracefully', () => {
      render(<WizardStepper steps={[]} currentStep={0} />)

      // Should render without crashing
      expect(screen.getByRole('navigation')).toBeInTheDocument()
    })

    it('should clamp currentStep to valid range', () => {
      // If currentStep is out of bounds, should handle gracefully
      render(<WizardStepper steps={defaultSteps} currentStep={10} />)

      // Should not crash and should handle gracefully
      // Implementation may vary - could clamp to last step or handle differently
      expect(screen.getByRole('navigation')).toBeInTheDocument()
    })

    it('should handle negative currentStep', () => {
      render(<WizardStepper steps={defaultSteps} currentStep={-1} />)

      // Should not crash
      expect(screen.getByRole('navigation')).toBeInTheDocument()
    })
  })

  describe('Custom Step Content', () => {
    it('should support custom step icons', () => {
      const stepsWithIcons: Step[] = [
        { id: 's1', label: 'Upload', description: 'Upload files' },
        { id: 's2', label: 'Process', description: 'Process data' },
        { id: 's3', label: 'Download', description: 'Download results' },
      ]

      render(
        <WizardStepper
          steps={stepsWithIcons}
          currentStep={1}
          renderIcon={(step, index, state) => (
            <span data-testid={`custom-icon-${index}`}>{state}</span>
          )}
        />
      )

      expect(screen.getByTestId('custom-icon-0')).toHaveTextContent('completed')
      expect(screen.getByTestId('custom-icon-1')).toHaveTextContent('current')
      expect(screen.getByTestId('custom-icon-2')).toHaveTextContent('upcoming')
    })
  })
})

describe('WizardStepper with completedSteps prop', () => {
  it('should allow manually specifying completed steps', () => {
    render(
      <WizardStepper
        steps={defaultSteps}
        currentStep={2}
        completedSteps={[0, 3]} // Only steps 0 and 3 are completed, not 1
      />
    )

    expect(screen.getByTestId('step-0')).toHaveAttribute('data-state', 'completed')
    expect(screen.getByTestId('step-1')).not.toHaveAttribute('data-state', 'completed')
    expect(screen.getByTestId('step-2')).toHaveAttribute('data-state', 'current')
    expect(screen.getByTestId('step-3')).toHaveAttribute('data-state', 'completed')
  })
})
