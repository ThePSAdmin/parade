/**
 * GuidePage Component Tests
 *
 * These tests define the expected behavior for the GuidePage and GuideStepCard components.
 *
 * Expected components:
 * - src/renderer/components/guide/GuidePage.tsx
 * - src/renderer/components/guide/GuideStepCard.tsx
 *
 * The GuidePage displays the Parade workflow steps (4 stages):
 * 1. /init-project - Initialize Project
 * 2. /discover - Discover Feature (combined brief + discovery)
 * 3. /approve-spec - Approve Specification
 * 4. /run-tasks - Run Tasks
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

// Import the components that don't exist yet - will cause import error until implemented
import { GuidePage } from '@renderer/components/guide/GuidePage'
import { GuideStepCard } from '@renderer/components/guide/GuideStepCard'

// Workflow steps - 4 stages after merging create-brief + start-discovery into /discover
const workflowSteps = [
  {
    id: 'init-project',
    command: '/init-project',
    title: 'Initialize Project',
    description: 'Set up project configuration and directory scaffold. Creates project.yaml, .claude/, .beads/, and agent definitions.',
    whenToUse: 'Starting a new project or adding configuration to an existing codebase',
  },
  {
    id: 'discover',
    command: '/discover',
    title: 'Discover Feature',
    description: 'Combines brief creation and discovery into a single streamlined flow. Captures your feature idea, assesses complexity, asks targeted questions, and spawns SME agents.',
    whenToUse: 'You have a new feature idea to develop',
  },
  {
    id: 'approve-spec',
    command: '/approve-spec',
    title: 'Approve Specification',
    description: 'Convert an approved specification into actionable beads tasks. Creates epic, child tasks, dependencies, and agent labels.',
    whenToUse: 'After reviewing the spec from /discover',
  },
  {
    id: 'run-tasks',
    command: '/run-tasks',
    title: 'Run Tasks',
    description: 'Orchestrate task execution through coordinated sub-agents. Manages parallel execution, TDD support, and status updates.',
    whenToUse: 'After /approve-spec has created tasks',
  },
]

describe('GuidePage Component', () => {
  describe('Basic Rendering', () => {
    it('should render the GuidePage component', () => {
      render(<GuidePage />)

      expect(screen.getByTestId('guide-page')).toBeInTheDocument()
    })

    it('should render the page title', () => {
      render(<GuidePage />)

      expect(screen.getByRole('heading', { name: /parade/i })).toBeInTheDocument()
    })

    it('should render a subtitle or description', () => {
      render(<GuidePage />)

      expect(screen.getByText(/workflow/i)).toBeInTheDocument()
    })

    it('should render all 4 workflow steps', () => {
      render(<GuidePage />)

      workflowSteps.forEach((step) => {
        expect(screen.getByText(step.title)).toBeInTheDocument()
      })
    })

    it('should display workflow steps in correct order', () => {
      render(<GuidePage />)

      const stepTitles = screen.getAllByTestId(/guide-step-card/)
      expect(stepTitles).toHaveLength(4)

      // Verify order matches workflow
      expect(within(stepTitles[0]).getByText('Initialize Project')).toBeInTheDocument()
      expect(within(stepTitles[1]).getByText('Discover Feature')).toBeInTheDocument()
      expect(within(stepTitles[2]).getByText('Approve Specification')).toBeInTheDocument()
      expect(within(stepTitles[3]).getByText('Run Tasks')).toBeInTheDocument()
    })

    it('should render the workflow diagram', () => {
      render(<GuidePage />)

      // Should show the workflow flow visualization
      expect(screen.getByTestId('workflow-diagram')).toBeInTheDocument()
    })
  })

  describe('Step Navigation', () => {
    it('should have first step selected by default', () => {
      render(<GuidePage />)

      const firstStep = screen.getByTestId('guide-step-card-init-project')
      expect(firstStep).toHaveAttribute('data-selected', 'true')
    })

    it('should update selected step when clicking on a step card', async () => {
      const user = userEvent.setup()
      render(<GuidePage />)

      const secondStep = screen.getByTestId('guide-step-card-discover')
      await user.click(secondStep)

      expect(secondStep).toHaveAttribute('data-selected', 'true')
      expect(screen.getByTestId('guide-step-card-init-project')).toHaveAttribute('data-selected', 'false')
    })

    it('should show step details when step is selected', async () => {
      const user = userEvent.setup()
      render(<GuidePage />)

      // Select the discover step
      const discoverStep = screen.getByTestId('guide-step-card-discover')
      await user.click(discoverStep)

      // Should show detailed content for the selected step
      expect(screen.getByTestId('step-detail-panel')).toBeInTheDocument()
      expect(screen.getByText(/combines brief creation and discovery/i)).toBeInTheDocument()
    })

    it('should navigate to next step with next button', async () => {
      const user = userEvent.setup()
      render(<GuidePage />)

      const nextButton = screen.getByRole('button', { name: /next/i })
      await user.click(nextButton)

      expect(screen.getByTestId('guide-step-card-discover')).toHaveAttribute('data-selected', 'true')
    })

    it('should navigate to previous step with previous button', async () => {
      const user = userEvent.setup()
      render(<GuidePage />)

      // First go to step 2
      const nextButton = screen.getByRole('button', { name: /next/i })
      await user.click(nextButton)

      // Then go back
      const prevButton = screen.getByRole('button', { name: /previous|back/i })
      await user.click(prevButton)

      expect(screen.getByTestId('guide-step-card-init-project')).toHaveAttribute('data-selected', 'true')
    })

    it('should disable previous button on first step', () => {
      render(<GuidePage />)

      const prevButton = screen.getByRole('button', { name: /previous|back/i })
      expect(prevButton).toBeDisabled()
    })

    it('should disable next button on last step', async () => {
      const user = userEvent.setup()
      render(<GuidePage />)

      // Navigate to last step
      const lastStep = screen.getByTestId('guide-step-card-run-tasks')
      await user.click(lastStep)

      const nextButton = screen.getByRole('button', { name: /next/i })
      expect(nextButton).toBeDisabled()
    })
  })

  describe('Step Progress Indicator', () => {
    it('should show step numbers', () => {
      render(<GuidePage />)

      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
      expect(screen.getByText('4')).toBeInTheDocument()
    })

    it('should show progress indicator for current step', () => {
      render(<GuidePage />)

      const progressIndicator = screen.getByTestId('step-progress')
      expect(progressIndicator).toHaveTextContent(/step 1 of 4/i)
    })

    it('should update progress indicator when navigating', async () => {
      const user = userEvent.setup()
      render(<GuidePage />)

      await user.click(screen.getByTestId('guide-step-card-approve-spec'))

      const progressIndicator = screen.getByTestId('step-progress')
      expect(progressIndicator).toHaveTextContent(/step 3 of 4/i)
    })
  })

  describe('Command Display', () => {
    it('should display command for each step', () => {
      render(<GuidePage />)

      workflowSteps.forEach((step) => {
        expect(screen.getByText(step.command)).toBeInTheDocument()
      })
    })

    it('should style commands as code', () => {
      render(<GuidePage />)

      const commandElement = screen.getByText('/init-project')
      expect(commandElement.tagName.toLowerCase()).toBe('code')
    })

    it('should have copy button for commands', async () => {
      const user = userEvent.setup()
      render(<GuidePage />)

      // Select a step to see its details
      await user.click(screen.getByTestId('guide-step-card-init-project'))

      const copyButton = screen.getByRole('button', { name: /copy.*command/i })
      expect(copyButton).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have main landmark for the page', () => {
      render(<GuidePage />)

      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should have navigation role for step list', () => {
      render(<GuidePage />)

      expect(screen.getByRole('navigation', { name: /workflow steps/i })).toBeInTheDocument()
    })

    it('should have heading hierarchy', () => {
      render(<GuidePage />)

      const h1 = screen.getByRole('heading', { level: 1 })
      expect(h1).toBeInTheDocument()

      const h2s = screen.getAllByRole('heading', { level: 2 })
      expect(h2s.length).toBeGreaterThan(0)
    })

    it('should support keyboard navigation between steps', async () => {
      const user = userEvent.setup()
      render(<GuidePage />)

      const firstStep = screen.getByTestId('guide-step-card-init-project')
      firstStep.focus()

      // Arrow down should move to next step
      await user.keyboard('{ArrowDown}')
      expect(screen.getByTestId('guide-step-card-discover')).toHaveFocus()

      // Arrow up should move back
      await user.keyboard('{ArrowUp}')
      expect(screen.getByTestId('guide-step-card-init-project')).toHaveFocus()
    })

    it('should have aria-current on selected step', async () => {
      const user = userEvent.setup()
      render(<GuidePage />)

      const firstStep = screen.getByTestId('guide-step-card-init-project')
      expect(firstStep).toHaveAttribute('aria-current', 'step')

      await user.click(screen.getByTestId('guide-step-card-discover'))

      expect(firstStep).not.toHaveAttribute('aria-current', 'step')
      expect(screen.getByTestId('guide-step-card-discover')).toHaveAttribute('aria-current', 'step')
    })

    it('should have descriptive aria-labels on step cards', () => {
      render(<GuidePage />)

      const firstStep = screen.getByTestId('guide-step-card-init-project')
      expect(firstStep.getAttribute('aria-label')).toMatch(/step 1.*initialize project/i)
    })
  })
})

describe('GuideStepCard Component', () => {
  const defaultProps = {
    stepNumber: 1,
    id: 'init-project',
    command: '/init-project',
    title: 'Initialize Project',
    description: 'Set up project configuration.',
    isSelected: false,
    onClick: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('should render the step card', () => {
      render(<GuideStepCard {...defaultProps} />)

      expect(screen.getByTestId('guide-step-card-init-project')).toBeInTheDocument()
    })

    it('should render step number', () => {
      render(<GuideStepCard {...defaultProps} />)

      expect(screen.getByTestId('step-number')).toHaveTextContent('1')
    })

    it('should render step title', () => {
      render(<GuideStepCard {...defaultProps} />)

      expect(screen.getByText('Initialize Project')).toBeInTheDocument()
    })

    it('should render step description', () => {
      render(<GuideStepCard {...defaultProps} />)

      expect(screen.getByText('Set up project configuration.')).toBeInTheDocument()
    })

    it('should render command', () => {
      render(<GuideStepCard {...defaultProps} />)

      expect(screen.getByText('/init-project')).toBeInTheDocument()
    })

    it('should render an icon for the step', () => {
      render(<GuideStepCard {...defaultProps} />)

      expect(screen.getByTestId('step-icon')).toBeInTheDocument()
    })
  })

  describe('Icon Display', () => {
    it('should show folder icon for init-project step', () => {
      render(<GuideStepCard {...defaultProps} id="init-project" />)

      const icon = screen.getByTestId('step-icon')
      // Should have folder-related icon
      expect(icon.querySelector('svg')).toBeInTheDocument()
    })

    it('should show search/discovery icon for discover step', () => {
      render(<GuideStepCard {...defaultProps} id="discover" title="Discover Feature" command="/discover" />)

      const icon = screen.getByTestId('step-icon')
      expect(icon.querySelector('svg')).toBeInTheDocument()
    })

    it('should show checkmark icon for approve-spec step', () => {
      render(<GuideStepCard {...defaultProps} id="approve-spec" title="Approve Specification" command="/approve-spec" />)

      const icon = screen.getByTestId('step-icon')
      expect(icon.querySelector('svg')).toBeInTheDocument()
    })

    it('should show play/execute icon for run-tasks step', () => {
      render(<GuideStepCard {...defaultProps} id="run-tasks" title="Run Tasks" command="/run-tasks" />)

      const icon = screen.getByTestId('step-icon')
      expect(icon.querySelector('svg')).toBeInTheDocument()
    })
  })

  describe('Selection State', () => {
    it('should apply selected styling when isSelected is true', () => {
      render(<GuideStepCard {...defaultProps} isSelected={true} />)

      const card = screen.getByTestId('guide-step-card-init-project')
      expect(card).toHaveAttribute('data-selected', 'true')
      expect(card.className).toMatch(/ring|border-primary|bg-primary/)
    })

    it('should not apply selected styling when isSelected is false', () => {
      render(<GuideStepCard {...defaultProps} isSelected={false} />)

      const card = screen.getByTestId('guide-step-card-init-project')
      expect(card).toHaveAttribute('data-selected', 'false')
    })

    it('should have different opacity for selected vs unselected', () => {
      const { rerender } = render(<GuideStepCard {...defaultProps} isSelected={false} />)

      const cardUnselected = screen.getByTestId('guide-step-card-init-project')
      const unselectedClasses = cardUnselected.className

      rerender(<GuideStepCard {...defaultProps} isSelected={true} />)

      const cardSelected = screen.getByTestId('guide-step-card-init-project')
      const selectedClasses = cardSelected.className

      expect(selectedClasses).not.toEqual(unselectedClasses)
    })
  })

  describe('Click Behavior', () => {
    it('should call onClick when clicked', async () => {
      const handleClick = vi.fn()
      const user = userEvent.setup()

      render(<GuideStepCard {...defaultProps} onClick={handleClick} />)

      await user.click(screen.getByTestId('guide-step-card-init-project'))

      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('should pass step id to onClick handler', async () => {
      const handleClick = vi.fn()
      const user = userEvent.setup()

      render(<GuideStepCard {...defaultProps} id="discover" onClick={handleClick} />)

      await user.click(screen.getByTestId('guide-step-card-discover'))

      expect(handleClick).toHaveBeenCalledWith('discover')
    })

    it('should have cursor-pointer styling', () => {
      render(<GuideStepCard {...defaultProps} />)

      const card = screen.getByTestId('guide-step-card-init-project')
      expect(card.className).toMatch(/cursor-pointer/)
    })

    it('should have hover styles', () => {
      render(<GuideStepCard {...defaultProps} />)

      const card = screen.getByTestId('guide-step-card-init-project')
      expect(card.className).toMatch(/hover:/)
    })
  })

  describe('Accessibility', () => {
    it('should have role of button or link', () => {
      render(<GuideStepCard {...defaultProps} />)

      const card = screen.getByTestId('guide-step-card-init-project')
      expect(card.getAttribute('role')).toMatch(/button|listitem/)
    })

    it('should be focusable', () => {
      render(<GuideStepCard {...defaultProps} />)

      const card = screen.getByTestId('guide-step-card-init-project')
      card.focus()

      expect(document.activeElement).toBe(card)
    })

    it('should have tabindex for keyboard navigation', () => {
      render(<GuideStepCard {...defaultProps} />)

      const card = screen.getByTestId('guide-step-card-init-project')
      expect(card).toHaveAttribute('tabindex', '0')
    })

    it('should respond to Enter key', async () => {
      const handleClick = vi.fn()
      const user = userEvent.setup()

      render(<GuideStepCard {...defaultProps} onClick={handleClick} />)

      const card = screen.getByTestId('guide-step-card-init-project')
      card.focus()

      await user.keyboard('{Enter}')

      expect(handleClick).toHaveBeenCalled()
    })

    it('should respond to Space key', async () => {
      const handleClick = vi.fn()
      const user = userEvent.setup()

      render(<GuideStepCard {...defaultProps} onClick={handleClick} />)

      const card = screen.getByTestId('guide-step-card-init-project')
      card.focus()

      await user.keyboard(' ')

      expect(handleClick).toHaveBeenCalled()
    })

    it('should have aria-label describing the step', () => {
      render(<GuideStepCard {...defaultProps} />)

      const card = screen.getByTestId('guide-step-card-init-project')
      expect(card.getAttribute('aria-label')).toMatch(/step 1.*initialize project/i)
    })

    it('should have aria-current when selected', () => {
      render(<GuideStepCard {...defaultProps} isSelected={true} />)

      const card = screen.getByTestId('guide-step-card-init-project')
      expect(card).toHaveAttribute('aria-current', 'step')
    })

    it('should not have aria-current when not selected', () => {
      render(<GuideStepCard {...defaultProps} isSelected={false} />)

      const card = screen.getByTestId('guide-step-card-init-project')
      expect(card).not.toHaveAttribute('aria-current')
    })
  })

  describe('Custom Styling', () => {
    it('should accept custom className prop', () => {
      render(<GuideStepCard {...defaultProps} className="custom-step-class" />)

      const card = screen.getByTestId('guide-step-card-init-project')
      expect(card).toHaveClass('custom-step-class')
    })
  })
})

describe('GuidePage Step Detail Panel', () => {
  it('should show "When to Use" section for selected step', async () => {
    const user = userEvent.setup()
    render(<GuidePage />)

    await user.click(screen.getByTestId('guide-step-card-discover'))

    expect(screen.getByText(/when to use/i)).toBeInTheDocument()
    expect(screen.getByText(/you have a new feature idea/i)).toBeInTheDocument()
  })

  it('should show example interaction for selected step', async () => {
    const user = userEvent.setup()
    render(<GuidePage />)

    await user.click(screen.getByTestId('guide-step-card-init-project'))

    expect(screen.getByText(/example/i)).toBeInTheDocument()
  })

  it('should show outputs section for selected step', async () => {
    const user = userEvent.setup()
    render(<GuidePage />)

    await user.click(screen.getByTestId('guide-step-card-init-project'))

    expect(screen.getByText(/outputs/i)).toBeInTheDocument()
  })

  it('should show related files/directories for init-project step', async () => {
    const user = userEvent.setup()
    render(<GuidePage />)

    await user.click(screen.getByTestId('guide-step-card-init-project'))

    expect(screen.getByText(/project\.yaml/i)).toBeInTheDocument()
    expect(screen.getByText(/\.claude\//i)).toBeInTheDocument()
    expect(screen.getByText(/\.beads\//i)).toBeInTheDocument()
  })

  it('should show database reference for discover step', async () => {
    const user = userEvent.setup()
    render(<GuidePage />)

    await user.click(screen.getByTestId('guide-step-card-discover'))

    expect(screen.getByText(/discovery\.db/i)).toBeInTheDocument()
  })
})

describe('GuidePage Responsive Layout', () => {
  it('should render step cards', () => {
    render(<GuidePage />)

    const stepCards = screen.getAllByTestId(/guide-step-card/)
    expect(stepCards).toHaveLength(4)
  })

  it('should have proper spacing between elements', () => {
    render(<GuidePage />)

    const container = screen.getByTestId('guide-page')
    expect(container.className).toMatch(/gap-|space-/)
  })
})

describe('GuidePage with onStepComplete callback', () => {
  it('should call onStepComplete when user marks step as done', async () => {
    const handleComplete = vi.fn()
    const user = userEvent.setup()

    render(<GuidePage onStepComplete={handleComplete} />)

    // Select a step
    await user.click(screen.getByTestId('guide-step-card-init-project'))

    // Click the "Mark as Done" button if available
    const doneButton = screen.queryByRole('button', { name: /mark.*done|complete/i })
    if (doneButton) {
      await user.click(doneButton)
      expect(handleComplete).toHaveBeenCalledWith('init-project')
    }
  })
})

describe('GuidePage Initial Step Prop', () => {
  it('should accept initialStep prop to start at specific step', () => {
    render(<GuidePage initialStep="approve-spec" />)

    expect(screen.getByTestId('guide-step-card-approve-spec')).toHaveAttribute('data-selected', 'true')
  })

  it('should default to first step when no initialStep provided', () => {
    render(<GuidePage />)

    expect(screen.getByTestId('guide-step-card-init-project')).toHaveAttribute('data-selected', 'true')
  })
})
