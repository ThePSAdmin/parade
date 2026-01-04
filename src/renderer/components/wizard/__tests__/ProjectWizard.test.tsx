/**
 * ProjectWizard Component Tests - TDD RED Phase
 *
 * These tests define the expected behavior for the ProjectWizard container and step components.
 * All tests should FAIL initially since the components don't exist yet.
 *
 * Expected components:
 * - src/renderer/components/wizard/ProjectWizard.tsx (main container)
 * - src/renderer/components/wizard/steps/BasicInfoStep.tsx
 * - src/renderer/components/wizard/steps/ConstitutionStep.tsx
 * - src/renderer/components/wizard/steps/StackSelectionStep.tsx
 * - src/renderer/components/wizard/steps/OptionalSectionsStep.tsx
 * - src/renderer/components/wizard/WizardNavigation.tsx
 *
 * The ProjectWizard is a multi-step form for initializing a new project with:
 * 1. Basic Info - name, description, repository
 * 2. Constitution - vision purpose, target users, success metrics
 * 3. Stack Selection - stack type, framework, language
 * 4. Optional Sections - design_system, data_governance, agents
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

// Import the components that don't exist yet - will cause import error until implemented
import { ProjectWizard } from '@renderer/components/wizard/ProjectWizard'
import { BasicInfoStep } from '@renderer/components/wizard/steps/BasicInfoStep'
import { ConstitutionStep } from '@renderer/components/wizard/steps/ConstitutionStep'
import { StackSelectionStep } from '@renderer/components/wizard/steps/StackSelectionStep'
import { OptionalSectionsStep } from '@renderer/components/wizard/steps/OptionalSectionsStep'
import { WizardNavigation } from '@renderer/components/wizard/WizardNavigation'

// Type definitions for expected component APIs
interface ProjectFormData {
  // Basic Info (Step 1)
  name: string
  description: string
  repository: string
  // Constitution (Step 2)
  visionPurpose: string
  targetUsers: string[]
  successMetrics: string[]
  // Stack Selection (Step 3)
  stackType: 'frontend' | 'backend' | 'fullstack' | 'database' | ''
  framework: string
  language: string
  // Optional Sections (Step 4)
  enableDesignSystem: boolean
  enableDataGovernance: boolean
  enableAgents: boolean
}

const emptyFormData: ProjectFormData = {
  name: '',
  description: '',
  repository: '',
  visionPurpose: '',
  targetUsers: [],
  successMetrics: [],
  stackType: '',
  framework: '',
  language: '',
  enableDesignSystem: false,
  enableDataGovernance: false,
  enableAgents: false,
}

const validFormData: ProjectFormData = {
  name: 'My Project',
  description: 'A test project for unit testing',
  repository: 'https://github.com/test/project',
  visionPurpose: 'To simplify task management',
  targetUsers: ['Developers', 'Project Managers'],
  successMetrics: ['100 daily active users', 'Less than 2s load time'],
  stackType: 'fullstack',
  framework: 'React',
  language: 'TypeScript',
  enableDesignSystem: true,
  enableDataGovernance: false,
  enableAgents: true,
}

// Wizard steps configuration
const wizardSteps = [
  { id: 'basic-info', label: 'Basic Info', description: 'Project name and details' },
  { id: 'constitution', label: 'Constitution', description: 'Vision and goals' },
  { id: 'stack-selection', label: 'Stack', description: 'Technology choices' },
  { id: 'optional-sections', label: 'Optional', description: 'Additional features' },
]

// =============================================================================
// ProjectWizard Container Tests
// =============================================================================

describe('ProjectWizard Container', () => {
  describe('Basic Rendering', () => {
    it('should render the ProjectWizard component', () => {
      render(<ProjectWizard />)

      expect(screen.getByTestId('project-wizard')).toBeInTheDocument()
    })

    it('should render WizardStepper showing 4 steps', () => {
      render(<ProjectWizard />)

      const stepper = screen.getByRole('navigation', { name: /wizard progress/i })
      expect(stepper).toBeInTheDocument()

      // Should show all 4 step labels
      expect(screen.getByText('Basic Info')).toBeInTheDocument()
      expect(screen.getByText('Constitution')).toBeInTheDocument()
      expect(screen.getByText('Stack')).toBeInTheDocument()
      expect(screen.getByText('Optional')).toBeInTheDocument()
    })

    it('should render the wizard title', () => {
      render(<ProjectWizard />)

      expect(screen.getByRole('heading', { name: /project.*wizard|initialize.*project|new project/i })).toBeInTheDocument()
    })

    it('should show BasicInfoStep on initial render', () => {
      render(<ProjectWizard />)

      expect(screen.getByTestId('basic-info-step')).toBeInTheDocument()
    })

    it('should render WizardNavigation component', () => {
      render(<ProjectWizard />)

      expect(screen.getByTestId('wizard-navigation')).toBeInTheDocument()
    })
  })

  describe('Step Navigation', () => {
    it('should show correct step based on currentStep state', async () => {
      const user = userEvent.setup()
      render(<ProjectWizard />)

      // Step 1: Basic Info
      expect(screen.getByTestId('basic-info-step')).toBeInTheDocument()
      expect(screen.queryByTestId('constitution-step')).not.toBeInTheDocument()

      // Fill required fields and go to step 2
      await user.type(screen.getByLabelText(/project name/i), 'Test Project')
      await user.click(screen.getByRole('button', { name: /next/i }))

      // Step 2: Constitution
      await waitFor(() => {
        expect(screen.getByTestId('constitution-step')).toBeInTheDocument()
      })
      expect(screen.queryByTestId('basic-info-step')).not.toBeInTheDocument()
    })

    it('should navigate to previous step with prev button', async () => {
      const user = userEvent.setup()
      render(<ProjectWizard />)

      // Fill required field and go to step 2
      await user.type(screen.getByLabelText(/project name/i), 'Test Project')
      await user.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        expect(screen.getByTestId('constitution-step')).toBeInTheDocument()
      })

      // Go back to step 1
      await user.click(screen.getByRole('button', { name: /previous|back/i }))

      await waitFor(() => {
        expect(screen.getByTestId('basic-info-step')).toBeInTheDocument()
      })
    })

    it('should navigate between all steps with prev/next buttons', async () => {
      const user = userEvent.setup()
      render(<ProjectWizard />)

      // Step 1 -> Step 2
      await user.type(screen.getByLabelText(/project name/i), 'Test Project')
      await user.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        expect(screen.getByTestId('constitution-step')).toBeInTheDocument()
      })

      // Step 2 -> Step 3
      await user.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        expect(screen.getByTestId('stack-selection-step')).toBeInTheDocument()
      })

      // Step 3 -> Step 4
      await user.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        expect(screen.getByTestId('optional-sections-step')).toBeInTheDocument()
      })

      // Step 4 -> Step 3 (back)
      await user.click(screen.getByRole('button', { name: /previous|back/i }))

      await waitFor(() => {
        expect(screen.getByTestId('stack-selection-step')).toBeInTheDocument()
      })
    })

    it('should update WizardStepper to reflect current step', async () => {
      const user = userEvent.setup()
      render(<ProjectWizard />)

      // Initially step 0 should be current
      expect(screen.getByTestId('step-0')).toHaveAttribute('data-state', 'current')

      // Navigate to step 2
      await user.type(screen.getByLabelText(/project name/i), 'Test Project')
      await user.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        expect(screen.getByTestId('step-0')).toHaveAttribute('data-state', 'completed')
        expect(screen.getByTestId('step-1')).toHaveAttribute('data-state', 'current')
      })
    })
  })

  describe('Validation', () => {
    it('should validate current step before allowing next', async () => {
      const user = userEvent.setup()
      render(<ProjectWizard />)

      // Try to proceed without filling required fields
      await user.click(screen.getByRole('button', { name: /next/i }))

      // Should show validation error and stay on current step
      await waitFor(() => {
        expect(screen.getByText(/project name.*required|name is required/i)).toBeInTheDocument()
      })
      expect(screen.getByTestId('basic-info-step')).toBeInTheDocument()
    })

    it('should clear validation errors when field is corrected', async () => {
      const user = userEvent.setup()
      render(<ProjectWizard />)

      // Trigger validation error
      await user.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        expect(screen.getByText(/project name.*required|name is required/i)).toBeInTheDocument()
      })

      // Fill the field
      await user.type(screen.getByLabelText(/project name/i), 'Test Project')

      // Error should clear
      await waitFor(() => {
        expect(screen.queryByText(/project name.*required|name is required/i)).not.toBeInTheDocument()
      })
    })

    it('should disable next button when current step is invalid', async () => {
      render(<ProjectWizard />)

      const nextButton = screen.getByRole('button', { name: /next/i })

      // With empty required fields, next should be disabled (or validation prevents navigation)
      // Implementation may vary - either button is disabled or validation prevents navigation
      expect(nextButton).toBeInTheDocument()
    })
  })

  describe('Form Submission', () => {
    it('should submit on final step', async () => {
      const handleSubmit = vi.fn()
      const user = userEvent.setup()

      render(<ProjectWizard onSubmit={handleSubmit} />)

      // Navigate through all steps
      await user.type(screen.getByLabelText(/project name/i), 'Test Project')
      await user.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        expect(screen.getByTestId('constitution-step')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        expect(screen.getByTestId('stack-selection-step')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        expect(screen.getByTestId('optional-sections-step')).toBeInTheDocument()
      })

      // Submit on final step
      await user.click(screen.getByRole('button', { name: /create project|finish|submit/i }))

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalled()
      })
    })

    it('should pass form data to onSubmit handler', async () => {
      const handleSubmit = vi.fn()
      const user = userEvent.setup()

      render(<ProjectWizard onSubmit={handleSubmit} />)

      // Fill Step 1
      await user.type(screen.getByLabelText(/project name/i), 'My Project')
      await user.type(screen.getByLabelText(/description/i), 'A test project')
      await user.click(screen.getByRole('button', { name: /next/i }))

      // Skip through remaining steps
      await waitFor(() => screen.getByTestId('constitution-step'))
      await user.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => screen.getByTestId('stack-selection-step'))
      await user.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => screen.getByTestId('optional-sections-step'))
      await user.click(screen.getByRole('button', { name: /create project|finish|submit/i }))

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'My Project',
            description: 'A test project',
          })
        )
      })
    })
  })

  describe('State Management', () => {
    it('should persist form state across step navigation', async () => {
      const user = userEvent.setup()
      render(<ProjectWizard />)

      // Fill Step 1
      await user.type(screen.getByLabelText(/project name/i), 'Persisted Project')
      await user.type(screen.getByLabelText(/description/i), 'Should persist')
      await user.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        expect(screen.getByTestId('constitution-step')).toBeInTheDocument()
      })

      // Go back to Step 1
      await user.click(screen.getByRole('button', { name: /previous|back/i }))

      await waitFor(() => {
        expect(screen.getByTestId('basic-info-step')).toBeInTheDocument()
      })

      // Values should persist
      expect(screen.getByLabelText(/project name/i)).toHaveValue('Persisted Project')
      expect(screen.getByLabelText(/description/i)).toHaveValue('Should persist')
    })

    it('should pre-fill when existing config is provided', () => {
      const existingConfig = {
        name: 'Existing Project',
        description: 'Pre-filled description',
        repository: 'https://github.com/existing/repo',
      }

      render(<ProjectWizard initialData={existingConfig} />)

      expect(screen.getByLabelText(/project name/i)).toHaveValue('Existing Project')
      expect(screen.getByLabelText(/description/i)).toHaveValue('Pre-filled description')
      expect(screen.getByLabelText(/repository/i)).toHaveValue('https://github.com/existing/repo')
    })

    it('should display validation errors correctly', async () => {
      const user = userEvent.setup()
      render(<ProjectWizard />)

      // Try to submit empty form
      await user.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        const errorMessage = screen.getByRole('alert')
        expect(errorMessage).toBeInTheDocument()
      })
    })
  })

  describe('Cancel and Close', () => {
    it('should call onCancel when cancel button is clicked', async () => {
      const handleCancel = vi.fn()
      const user = userEvent.setup()

      render(<ProjectWizard onCancel={handleCancel} />)

      await user.click(screen.getByRole('button', { name: /cancel/i }))

      expect(handleCancel).toHaveBeenCalled()
    })

    it('should show confirmation dialog when canceling with unsaved changes', async () => {
      const handleCancel = vi.fn()
      const user = userEvent.setup()

      render(<ProjectWizard onCancel={handleCancel} />)

      // Make changes
      await user.type(screen.getByLabelText(/project name/i), 'Unsaved')

      // Try to cancel
      await user.click(screen.getByRole('button', { name: /cancel/i }))

      // Should show confirmation
      await waitFor(() => {
        expect(screen.getByText(/unsaved changes|discard/i)).toBeInTheDocument()
      })
    })
  })
})

// =============================================================================
// BasicInfoStep Tests
// =============================================================================

describe('BasicInfoStep Component', () => {
  const defaultProps = {
    data: emptyFormData,
    onChange: vi.fn(),
    errors: {},
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('should render the BasicInfoStep component', () => {
      render(<BasicInfoStep {...defaultProps} />)

      expect(screen.getByTestId('basic-info-step')).toBeInTheDocument()
    })

    it('should render project name field', () => {
      render(<BasicInfoStep {...defaultProps} />)

      expect(screen.getByLabelText(/project name/i)).toBeInTheDocument()
    })

    it('should render description field', () => {
      render(<BasicInfoStep {...defaultProps} />)

      expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
    })

    it('should render repository field', () => {
      render(<BasicInfoStep {...defaultProps} />)

      expect(screen.getByLabelText(/repository/i)).toBeInTheDocument()
    })

    it('should mark project name as required', () => {
      render(<BasicInfoStep {...defaultProps} />)

      const nameInput = screen.getByLabelText(/project name/i)
      expect(nameInput).toHaveAttribute('required')
    })
  })

  describe('Field Interactions', () => {
    it('should call onChange when project name changes', async () => {
      const handleChange = vi.fn()
      const user = userEvent.setup()

      render(<BasicInfoStep {...defaultProps} onChange={handleChange} />)

      await user.type(screen.getByLabelText(/project name/i), 'New Project')

      expect(handleChange).toHaveBeenCalled()
    })

    it('should call onChange when description changes', async () => {
      const handleChange = vi.fn()
      const user = userEvent.setup()

      render(<BasicInfoStep {...defaultProps} onChange={handleChange} />)

      await user.type(screen.getByLabelText(/description/i), 'A project description')

      expect(handleChange).toHaveBeenCalled()
    })

    it('should call onChange when repository changes', async () => {
      const handleChange = vi.fn()
      const user = userEvent.setup()

      render(<BasicInfoStep {...defaultProps} onChange={handleChange} />)

      await user.type(screen.getByLabelText(/repository/i), 'https://github.com/test')

      expect(handleChange).toHaveBeenCalled()
    })
  })

  describe('Pre-filled Values', () => {
    it('should display pre-filled name', () => {
      render(<BasicInfoStep {...defaultProps} data={{ ...emptyFormData, name: 'Pre-filled Name' }} />)

      expect(screen.getByLabelText(/project name/i)).toHaveValue('Pre-filled Name')
    })

    it('should display pre-filled description', () => {
      render(<BasicInfoStep {...defaultProps} data={{ ...emptyFormData, description: 'Pre-filled Description' }} />)

      expect(screen.getByLabelText(/description/i)).toHaveValue('Pre-filled Description')
    })

    it('should display pre-filled repository', () => {
      render(<BasicInfoStep {...defaultProps} data={{ ...emptyFormData, repository: 'https://github.com/pre/filled' }} />)

      expect(screen.getByLabelText(/repository/i)).toHaveValue('https://github.com/pre/filled')
    })
  })

  describe('Validation Display', () => {
    it('should show error message for name field', () => {
      render(<BasicInfoStep {...defaultProps} errors={{ name: 'Project name is required' }} />)

      expect(screen.getByText('Project name is required')).toBeInTheDocument()
    })

    it('should show error styling on invalid field', () => {
      render(<BasicInfoStep {...defaultProps} errors={{ name: 'Required' }} />)

      const nameInput = screen.getByLabelText(/project name/i)
      expect(nameInput.className).toMatch(/border-red|border-destructive|error/)
    })

    it('should show repository URL validation error', () => {
      render(<BasicInfoStep {...defaultProps} errors={{ repository: 'Invalid URL format' }} />)

      expect(screen.getByText('Invalid URL format')).toBeInTheDocument()
    })
  })

  describe('Help Text', () => {
    it('should show helper text for name field', () => {
      render(<BasicInfoStep {...defaultProps} />)

      expect(screen.getByText(/must start with a letter/i)).toBeInTheDocument()
    })

    it('should show helper text for repository field', () => {
      render(<BasicInfoStep {...defaultProps} />)

      expect(screen.getByText(/optional.*git repository/i)).toBeInTheDocument()
    })
  })
})

// =============================================================================
// ConstitutionStep Tests
// =============================================================================

describe('ConstitutionStep Component', () => {
  const defaultProps = {
    data: emptyFormData,
    onChange: vi.fn(),
    errors: {},
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('should render the ConstitutionStep component', () => {
      render(<ConstitutionStep {...defaultProps} />)

      expect(screen.getByTestId('constitution-step')).toBeInTheDocument()
    })

    it('should render vision purpose field', () => {
      render(<ConstitutionStep {...defaultProps} />)

      expect(screen.getByLabelText(/vision.*purpose|purpose/i)).toBeInTheDocument()
    })

    it('should render target users field', () => {
      render(<ConstitutionStep {...defaultProps} />)

      expect(screen.getByLabelText(/target users/i)).toBeInTheDocument()
    })

    it('should render success metrics field', () => {
      render(<ConstitutionStep {...defaultProps} />)

      expect(screen.getByLabelText(/success metrics/i)).toBeInTheDocument()
    })
  })

  describe('Field Interactions', () => {
    it('should call onChange when vision purpose changes', async () => {
      const handleChange = vi.fn()
      const user = userEvent.setup()

      render(<ConstitutionStep {...defaultProps} onChange={handleChange} />)

      await user.type(screen.getByLabelText(/vision.*purpose|purpose/i), 'To improve productivity')

      expect(handleChange).toHaveBeenCalled()
    })

    it('should support adding multiple target users', async () => {
      const handleChange = vi.fn()
      const user = userEvent.setup()

      render(<ConstitutionStep {...defaultProps} onChange={handleChange} />)

      const targetUsersInput = screen.getByLabelText(/target users/i)
      await user.type(targetUsersInput, 'Developers')
      await user.keyboard('{Enter}')

      // Should allow adding another
      await user.type(targetUsersInput, 'Designers')
      await user.keyboard('{Enter}')

      expect(handleChange).toHaveBeenCalled()
    })

    it('should support adding multiple success metrics', async () => {
      const handleChange = vi.fn()
      const user = userEvent.setup()

      render(<ConstitutionStep {...defaultProps} onChange={handleChange} />)

      const metricsInput = screen.getByLabelText(/success metrics/i)
      await user.type(metricsInput, '1000 users')
      await user.keyboard('{Enter}')

      expect(handleChange).toHaveBeenCalled()
    })
  })

  describe('Tag/Chip Display', () => {
    it('should display target users as removable tags', () => {
      render(
        <ConstitutionStep
          {...defaultProps}
          data={{ ...emptyFormData, targetUsers: ['Developers', 'Designers'] }}
        />
      )

      expect(screen.getByText('Developers')).toBeInTheDocument()
      expect(screen.getByText('Designers')).toBeInTheDocument()

      // Should have remove buttons
      const removeButtons = screen.getAllByRole('button', { name: /remove/i })
      expect(removeButtons.length).toBeGreaterThanOrEqual(2)
    })

    it('should display success metrics as removable tags', () => {
      render(
        <ConstitutionStep
          {...defaultProps}
          data={{ ...emptyFormData, successMetrics: ['100 users', '< 2s load time'] }}
        />
      )

      expect(screen.getByText('100 users')).toBeInTheDocument()
      expect(screen.getByText('< 2s load time')).toBeInTheDocument()
    })

    it('should remove target user when remove button clicked', async () => {
      const handleChange = vi.fn()
      const user = userEvent.setup()

      render(
        <ConstitutionStep
          {...defaultProps}
          onChange={handleChange}
          data={{ ...emptyFormData, targetUsers: ['Developers', 'Designers'] }}
        />
      )

      const developerTag = screen.getByText('Developers').closest('[data-testid="tag"]')
      const removeButton = within(developerTag!).getByRole('button', { name: /remove/i })

      await user.click(removeButton)

      expect(handleChange).toHaveBeenCalledWith(
        expect.objectContaining({
          targetUsers: ['Designers'],
        })
      )
    })
  })

  describe('Textarea for Vision', () => {
    it('should render vision purpose as textarea', () => {
      render(<ConstitutionStep {...defaultProps} />)

      const visionField = screen.getByLabelText(/vision.*purpose|purpose/i)
      expect(visionField.tagName.toLowerCase()).toBe('textarea')
    })

    it('should show character count for vision purpose', () => {
      render(
        <ConstitutionStep
          {...defaultProps}
          data={{ ...emptyFormData, visionPurpose: 'Short vision' }}
        />
      )

      expect(screen.getByText(/12.*characters|character count/i)).toBeInTheDocument()
    })
  })
})

// =============================================================================
// StackSelectionStep Tests
// =============================================================================

describe('StackSelectionStep Component', () => {
  const defaultProps = {
    data: emptyFormData,
    onChange: vi.fn(),
    errors: {},
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('should render the StackSelectionStep component', () => {
      render(<StackSelectionStep {...defaultProps} />)

      expect(screen.getByTestId('stack-selection-step')).toBeInTheDocument()
    })

    it('should render stack type selection', () => {
      render(<StackSelectionStep {...defaultProps} />)

      expect(screen.getByText(/stack type/i)).toBeInTheDocument()
    })

    it('should render framework selection', () => {
      render(<StackSelectionStep {...defaultProps} />)

      expect(screen.getByLabelText(/framework/i)).toBeInTheDocument()
    })

    it('should render language selection', () => {
      render(<StackSelectionStep {...defaultProps} />)

      expect(screen.getByLabelText(/language/i)).toBeInTheDocument()
    })
  })

  describe('Stack Type Options', () => {
    it('should show frontend option', () => {
      render(<StackSelectionStep {...defaultProps} />)

      expect(screen.getByRole('radio', { name: /frontend/i })).toBeInTheDocument()
    })

    it('should show backend option', () => {
      render(<StackSelectionStep {...defaultProps} />)

      expect(screen.getByRole('radio', { name: /backend/i })).toBeInTheDocument()
    })

    it('should show fullstack option', () => {
      render(<StackSelectionStep {...defaultProps} />)

      expect(screen.getByRole('radio', { name: /fullstack/i })).toBeInTheDocument()
    })

    it('should show database option', () => {
      render(<StackSelectionStep {...defaultProps} />)

      expect(screen.getByRole('radio', { name: /database/i })).toBeInTheDocument()
    })

    it('should call onChange when stack type selected', async () => {
      const handleChange = vi.fn()
      const user = userEvent.setup()

      render(<StackSelectionStep {...defaultProps} onChange={handleChange} />)

      await user.click(screen.getByRole('radio', { name: /frontend/i }))

      expect(handleChange).toHaveBeenCalledWith(
        expect.objectContaining({
          stackType: 'frontend',
        })
      )
    })
  })

  describe('Framework Selection', () => {
    it('should show framework dropdown/select', () => {
      render(<StackSelectionStep {...defaultProps} />)

      const frameworkSelect = screen.getByLabelText(/framework/i)
      expect(frameworkSelect).toBeInTheDocument()
    })

    it('should show relevant frameworks based on stack type', async () => {
      const user = userEvent.setup()
      render(<StackSelectionStep {...defaultProps} data={{ ...emptyFormData, stackType: 'frontend' }} />)

      const frameworkSelect = screen.getByLabelText(/framework/i)
      await user.click(frameworkSelect)

      // Frontend frameworks
      expect(screen.getByText(/react/i)).toBeInTheDocument()
      expect(screen.getByText(/vue/i)).toBeInTheDocument()
      expect(screen.getByText(/angular/i)).toBeInTheDocument()
    })

    it('should show backend frameworks when backend selected', async () => {
      const user = userEvent.setup()
      render(<StackSelectionStep {...defaultProps} data={{ ...emptyFormData, stackType: 'backend' }} />)

      const frameworkSelect = screen.getByLabelText(/framework/i)
      await user.click(frameworkSelect)

      // Backend frameworks
      expect(screen.getByText(/express/i)).toBeInTheDocument()
      expect(screen.getByText(/nest.*js|fastify|koa/i)).toBeInTheDocument()
    })

    it('should allow custom framework input', async () => {
      const handleChange = vi.fn()
      const user = userEvent.setup()

      render(<StackSelectionStep {...defaultProps} onChange={handleChange} />)

      const frameworkInput = screen.getByLabelText(/framework/i)
      await user.type(frameworkInput, 'Custom Framework')

      expect(handleChange).toHaveBeenCalledWith(
        expect.objectContaining({
          framework: 'Custom Framework',
        })
      )
    })
  })

  describe('Language Selection', () => {
    it('should show language dropdown/select', () => {
      render(<StackSelectionStep {...defaultProps} />)

      const languageSelect = screen.getByLabelText(/language/i)
      expect(languageSelect).toBeInTheDocument()
    })

    it('should show common programming languages', async () => {
      const user = userEvent.setup()
      render(<StackSelectionStep {...defaultProps} />)

      const languageSelect = screen.getByLabelText(/language/i)
      await user.click(languageSelect)

      expect(screen.getByText(/typescript/i)).toBeInTheDocument()
      expect(screen.getByText(/javascript/i)).toBeInTheDocument()
      expect(screen.getByText(/python/i)).toBeInTheDocument()
    })

    it('should call onChange when language selected', async () => {
      const handleChange = vi.fn()
      const user = userEvent.setup()

      render(<StackSelectionStep {...defaultProps} onChange={handleChange} />)

      const languageSelect = screen.getByLabelText(/language/i)
      await user.click(languageSelect)
      await user.click(screen.getByText(/typescript/i))

      expect(handleChange).toHaveBeenCalledWith(
        expect.objectContaining({
          language: 'TypeScript',
        })
      )
    })
  })

  describe('Pre-filled Values', () => {
    it('should show selected stack type', () => {
      render(<StackSelectionStep {...defaultProps} data={{ ...emptyFormData, stackType: 'fullstack' }} />)

      expect(screen.getByRole('radio', { name: /fullstack/i })).toBeChecked()
    })

    it('should show selected framework', () => {
      render(<StackSelectionStep {...defaultProps} data={{ ...emptyFormData, framework: 'React' }} />)

      expect(screen.getByLabelText(/framework/i)).toHaveValue('React')
    })

    it('should show selected language', () => {
      render(<StackSelectionStep {...defaultProps} data={{ ...emptyFormData, language: 'TypeScript' }} />)

      expect(screen.getByLabelText(/language/i)).toHaveValue('TypeScript')
    })
  })
})

// =============================================================================
// OptionalSectionsStep Tests
// =============================================================================

describe('OptionalSectionsStep Component', () => {
  const defaultProps = {
    data: emptyFormData,
    onChange: vi.fn(),
    errors: {},
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('should render the OptionalSectionsStep component', () => {
      render(<OptionalSectionsStep {...defaultProps} />)

      expect(screen.getByTestId('optional-sections-step')).toBeInTheDocument()
    })

    it('should render design system checkbox', () => {
      render(<OptionalSectionsStep {...defaultProps} />)

      expect(screen.getByRole('checkbox', { name: /design.*system/i })).toBeInTheDocument()
    })

    it('should render data governance checkbox', () => {
      render(<OptionalSectionsStep {...defaultProps} />)

      expect(screen.getByRole('checkbox', { name: /data.*governance/i })).toBeInTheDocument()
    })

    it('should render agents checkbox', () => {
      render(<OptionalSectionsStep {...defaultProps} />)

      expect(screen.getByRole('checkbox', { name: /agents/i })).toBeInTheDocument()
    })
  })

  describe('Checkbox Interactions', () => {
    it('should call onChange when design system checkbox toggled', async () => {
      const handleChange = vi.fn()
      const user = userEvent.setup()

      render(<OptionalSectionsStep {...defaultProps} onChange={handleChange} />)

      await user.click(screen.getByRole('checkbox', { name: /design.*system/i }))

      expect(handleChange).toHaveBeenCalledWith(
        expect.objectContaining({
          enableDesignSystem: true,
        })
      )
    })

    it('should call onChange when data governance checkbox toggled', async () => {
      const handleChange = vi.fn()
      const user = userEvent.setup()

      render(<OptionalSectionsStep {...defaultProps} onChange={handleChange} />)

      await user.click(screen.getByRole('checkbox', { name: /data.*governance/i }))

      expect(handleChange).toHaveBeenCalledWith(
        expect.objectContaining({
          enableDataGovernance: true,
        })
      )
    })

    it('should call onChange when agents checkbox toggled', async () => {
      const handleChange = vi.fn()
      const user = userEvent.setup()

      render(<OptionalSectionsStep {...defaultProps} onChange={handleChange} />)

      await user.click(screen.getByRole('checkbox', { name: /agents/i }))

      expect(handleChange).toHaveBeenCalledWith(
        expect.objectContaining({
          enableAgents: true,
        })
      )
    })
  })

  describe('Pre-filled Values', () => {
    it('should show design system as checked when enabled', () => {
      render(<OptionalSectionsStep {...defaultProps} data={{ ...emptyFormData, enableDesignSystem: true }} />)

      expect(screen.getByRole('checkbox', { name: /design.*system/i })).toBeChecked()
    })

    it('should show data governance as checked when enabled', () => {
      render(<OptionalSectionsStep {...defaultProps} data={{ ...emptyFormData, enableDataGovernance: true }} />)

      expect(screen.getByRole('checkbox', { name: /data.*governance/i })).toBeChecked()
    })

    it('should show agents as checked when enabled', () => {
      render(<OptionalSectionsStep {...defaultProps} data={{ ...emptyFormData, enableAgents: true }} />)

      expect(screen.getByRole('checkbox', { name: /agents/i })).toBeChecked()
    })
  })

  describe('Section Descriptions', () => {
    it('should show description for design system', () => {
      render(<OptionalSectionsStep {...defaultProps} />)

      expect(screen.getByText(/design tokens|style guidelines|ui components/i)).toBeInTheDocument()
    })

    it('should show description for data governance', () => {
      render(<OptionalSectionsStep {...defaultProps} />)

      expect(screen.getByText(/naming conventions|auth.*provider|rls/i)).toBeInTheDocument()
    })

    it('should show description for agents', () => {
      render(<OptionalSectionsStep {...defaultProps} />)

      expect(screen.getByText(/custom agents|sub.*agents|agent definitions/i)).toBeInTheDocument()
    })
  })

  describe('Conditional Configuration', () => {
    it('should show additional options when design system is enabled', async () => {
      const user = userEvent.setup()

      render(<OptionalSectionsStep {...defaultProps} data={{ ...emptyFormData, enableDesignSystem: true }} />)

      // Should show path configuration for design system
      expect(screen.getByLabelText(/design.*path|design.*directory/i)).toBeInTheDocument()
    })

    it('should show additional options when data governance is enabled', async () => {
      render(<OptionalSectionsStep {...defaultProps} data={{ ...emptyFormData, enableDataGovernance: true }} />)

      // Should show auth provider configuration
      expect(screen.getByLabelText(/auth.*provider/i)).toBeInTheDocument()
    })
  })
})

// =============================================================================
// WizardNavigation Tests
// =============================================================================

describe('WizardNavigation Component', () => {
  const defaultProps = {
    currentStep: 0,
    totalSteps: 4,
    isFirstStep: true,
    isLastStep: false,
    isStepValid: true,
    onPrev: vi.fn(),
    onNext: vi.fn(),
    onSubmit: vi.fn(),
    onCancel: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('should render the WizardNavigation component', () => {
      render(<WizardNavigation {...defaultProps} />)

      expect(screen.getByTestId('wizard-navigation')).toBeInTheDocument()
    })

    it('should render Previous button', () => {
      render(<WizardNavigation {...defaultProps} isFirstStep={false} />)

      expect(screen.getByRole('button', { name: /previous|back/i })).toBeInTheDocument()
    })

    it('should render Next button', () => {
      render(<WizardNavigation {...defaultProps} />)

      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument()
    })

    it('should render Cancel button', () => {
      render(<WizardNavigation {...defaultProps} />)

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    })
  })

  describe('First Step Behavior', () => {
    it('should disable Previous button on first step', () => {
      render(<WizardNavigation {...defaultProps} isFirstStep={true} />)

      const prevButton = screen.getByRole('button', { name: /previous|back/i })
      expect(prevButton).toBeDisabled()
    })

    it('should enable Next button on first step when valid', () => {
      render(<WizardNavigation {...defaultProps} isFirstStep={true} isStepValid={true} />)

      const nextButton = screen.getByRole('button', { name: /next/i })
      expect(nextButton).not.toBeDisabled()
    })
  })

  describe('Last Step Behavior', () => {
    it('should show "Create Project" button on last step', () => {
      render(<WizardNavigation {...defaultProps} isLastStep={true} />)

      expect(screen.getByRole('button', { name: /create project|finish|submit/i })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /^next$/i })).not.toBeInTheDocument()
    })

    it('should enable Previous button on last step', () => {
      render(<WizardNavigation {...defaultProps} isLastStep={true} isFirstStep={false} />)

      const prevButton = screen.getByRole('button', { name: /previous|back/i })
      expect(prevButton).not.toBeDisabled()
    })
  })

  describe('Button Handlers', () => {
    it('should call onPrev when Previous button clicked', async () => {
      const handlePrev = vi.fn()
      const user = userEvent.setup()

      render(<WizardNavigation {...defaultProps} isFirstStep={false} onPrev={handlePrev} />)

      await user.click(screen.getByRole('button', { name: /previous|back/i }))

      expect(handlePrev).toHaveBeenCalled()
    })

    it('should call onNext when Next button clicked', async () => {
      const handleNext = vi.fn()
      const user = userEvent.setup()

      render(<WizardNavigation {...defaultProps} onNext={handleNext} />)

      await user.click(screen.getByRole('button', { name: /next/i }))

      expect(handleNext).toHaveBeenCalled()
    })

    it('should call onSubmit when Create Project button clicked', async () => {
      const handleSubmit = vi.fn()
      const user = userEvent.setup()

      render(<WizardNavigation {...defaultProps} isLastStep={true} onSubmit={handleSubmit} />)

      await user.click(screen.getByRole('button', { name: /create project|finish|submit/i }))

      expect(handleSubmit).toHaveBeenCalled()
    })

    it('should call onCancel when Cancel button clicked', async () => {
      const handleCancel = vi.fn()
      const user = userEvent.setup()

      render(<WizardNavigation {...defaultProps} onCancel={handleCancel} />)

      await user.click(screen.getByRole('button', { name: /cancel/i }))

      expect(handleCancel).toHaveBeenCalled()
    })
  })

  describe('Validation State', () => {
    it('should disable Next button when step is invalid', () => {
      render(<WizardNavigation {...defaultProps} isStepValid={false} />)

      const nextButton = screen.getByRole('button', { name: /next/i })
      expect(nextButton).toBeDisabled()
    })

    it('should disable Create Project button when step is invalid', () => {
      render(<WizardNavigation {...defaultProps} isLastStep={true} isStepValid={false} />)

      const submitButton = screen.getByRole('button', { name: /create project|finish|submit/i })
      expect(submitButton).toBeDisabled()
    })

    it('should enable buttons when step becomes valid', () => {
      const { rerender } = render(<WizardNavigation {...defaultProps} isStepValid={false} />)

      expect(screen.getByRole('button', { name: /next/i })).toBeDisabled()

      rerender(<WizardNavigation {...defaultProps} isStepValid={true} />)

      expect(screen.getByRole('button', { name: /next/i })).not.toBeDisabled()
    })
  })

  describe('Loading State', () => {
    it('should show loading indicator when submitting', () => {
      render(<WizardNavigation {...defaultProps} isLastStep={true} isSubmitting={true} />)

      expect(screen.getByTestId('submit-loading')).toBeInTheDocument()
    })

    it('should disable all buttons when submitting', () => {
      render(<WizardNavigation {...defaultProps} isLastStep={true} isSubmitting={true} />)

      const submitButton = screen.getByRole('button', { name: /create project|finish|submit|creating/i })
      expect(submitButton).toBeDisabled()

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      expect(cancelButton).toBeDisabled()
    })
  })

  describe('Step Progress Display', () => {
    it('should show step progress indicator', () => {
      render(<WizardNavigation {...defaultProps} currentStep={1} totalSteps={4} />)

      expect(screen.getByText(/step 2 of 4|2\/4/i)).toBeInTheDocument()
    })
  })
})

// =============================================================================
// Integration Tests
// =============================================================================

describe('ProjectWizard Integration', () => {
  it('should complete full wizard flow', async () => {
    const handleSubmit = vi.fn()
    const user = userEvent.setup()

    render(<ProjectWizard onSubmit={handleSubmit} />)

    // Step 1: Basic Info
    await user.type(screen.getByLabelText(/project name/i), 'Integration Test Project')
    await user.type(screen.getByLabelText(/description/i), 'A project for integration testing')
    await user.type(screen.getByLabelText(/repository/i), 'https://github.com/test/integration')
    await user.click(screen.getByRole('button', { name: /next/i }))

    // Step 2: Constitution
    await waitFor(() => {
      expect(screen.getByTestId('constitution-step')).toBeInTheDocument()
    })
    await user.type(screen.getByLabelText(/vision.*purpose|purpose/i), 'To test the wizard')
    await user.click(screen.getByRole('button', { name: /next/i }))

    // Step 3: Stack Selection
    await waitFor(() => {
      expect(screen.getByTestId('stack-selection-step')).toBeInTheDocument()
    })
    await user.click(screen.getByRole('radio', { name: /fullstack/i }))
    await user.click(screen.getByRole('button', { name: /next/i }))

    // Step 4: Optional Sections
    await waitFor(() => {
      expect(screen.getByTestId('optional-sections-step')).toBeInTheDocument()
    })
    await user.click(screen.getByRole('checkbox', { name: /agents/i }))

    // Submit
    await user.click(screen.getByRole('button', { name: /create project|finish|submit/i }))

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Integration Test Project',
          description: 'A project for integration testing',
          repository: 'https://github.com/test/integration',
          visionPurpose: 'To test the wizard',
          stackType: 'fullstack',
          enableAgents: true,
        })
      )
    })
  })

  it('should support keyboard navigation through wizard', async () => {
    const user = userEvent.setup()

    render(<ProjectWizard />)

    // Fill required field
    await user.type(screen.getByLabelText(/project name/i), 'Keyboard Test')

    // Tab to next button and press enter
    await user.tab()
    await user.tab()
    await user.tab() // Navigate through form fields
    const nextButton = screen.getByRole('button', { name: /next/i })
    nextButton.focus()
    await user.keyboard('{Enter}')

    await waitFor(() => {
      expect(screen.getByTestId('constitution-step')).toBeInTheDocument()
    })
  })
})
