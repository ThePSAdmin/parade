import * as React from "react"

import { WizardStepper, type Step } from "@renderer/components/wizard/WizardStepper"
import { WizardNavigation } from "@renderer/components/wizard/WizardNavigation"
import { BasicInfoStep } from "@renderer/components/wizard/steps/BasicInfoStep"
import { ConstitutionStep } from "@renderer/components/wizard/steps/ConstitutionStep"
import { StackSelectionStep } from "@renderer/components/wizard/steps/StackSelectionStep"
import { OptionalSectionsStep } from "@renderer/components/wizard/steps/OptionalSectionsStep"
import { ScaffoldingProgress, type ScaffoldingStep } from "@renderer/components/wizard/ScaffoldingProgress"
import { MCPRecommendations } from "@renderer/components/wizard/MCPRecommendations"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@renderer/components/ui/dialog"
import { Button } from "@renderer/components/ui/button"
import { Input } from "@renderer/components/ui/input"
import { Label } from "@renderer/components/ui/label"
import { cn } from "@/lib/utils"
import { FolderOpen, AlertCircle, CheckCircle2, Loader2 } from "lucide-react"

export interface ProjectFormData {
  name: string
  description: string
  repository: string
  visionPurpose: string
  targetUsers: string[]
  successMetrics: string[]
  stackType: "frontend" | "backend" | "fullstack" | "database" | ""
  framework: string
  language: string
  enableDesignSystem: boolean
  enableDataGovernance: boolean
  enableAgents: boolean
  designSystemPath?: string
  authProvider?: string
  targetPath?: string
}

/** Wizard view state */
type WizardView = 'form' | 'progress' | 'success' | 'error' | 'waiting'

/** Scaffolding result from orchestrator */
interface ScaffoldingResult {
  success: boolean
  createdPaths: string[]
  skippedPaths: string[]
  error?: string
}

const emptyFormData: ProjectFormData = {
  name: "",
  description: "",
  repository: "",
  visionPurpose: "",
  targetUsers: [],
  successMetrics: [],
  stackType: "",
  framework: "",
  language: "",
  enableDesignSystem: false,
  enableDataGovernance: false,
  enableAgents: false,
  targetPath: "",
}

/** Default scaffolding steps */
const DEFAULT_SCAFFOLDING_STEPS: ScaffoldingStep[] = [
  { id: 'create_claude_dir', label: 'Creating .claude directory', status: 'pending' },
  { id: 'create_beads_dir', label: 'Creating .beads directory', status: 'pending' },
  { id: 'create_design_dir', label: 'Creating .design directory', status: 'pending' },
  { id: 'write_project_yaml', label: 'Writing project.yaml', status: 'pending' },
  { id: 'write_claude_md', label: 'Writing CLAUDE.md', status: 'pending' },
]

const WIZARD_STEPS: Step[] = [
  { id: "basic-info", label: "Basic Info", description: "Project name and details" },
  { id: "constitution", label: "Constitution", description: "Vision and goals" },
  { id: "stack-selection", label: "Stack", description: "Technology choices" },
  { id: "optional-sections", label: "Optional", description: "Additional features" },
]

export interface ProjectWizardProps {
  initialData?: Partial<ProjectFormData>
  onSubmit?: (data: ProjectFormData) => void
  onComplete?: () => void
  onCancel?: () => void
  className?: string
}

export function ProjectWizard({
  initialData,
  onSubmit,
  onComplete,
  onCancel,
  className,
}: ProjectWizardProps) {
  const [currentStep, setCurrentStep] = React.useState(0)
  const [formData, setFormData] = React.useState<ProjectFormData>({
    ...emptyFormData,
    ...initialData,
  })
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [showCancelDialog, setShowCancelDialog] = React.useState(false)
  const [isDirty, setIsDirty] = React.useState(false)

  // Scaffolding state
  const [wizardView, setWizardView] = React.useState<WizardView>('form')
  const [scaffoldingSteps, setScaffoldingSteps] = React.useState<ScaffoldingStep[]>(DEFAULT_SCAFFOLDING_STEPS)
  const [scaffoldingResult, setScaffoldingResult] = React.useState<ScaffoldingResult | null>(null)
  const [scaffoldingError, setScaffoldingError] = React.useState<string | null>(null)
  const [terminalPid, setTerminalPid] = React.useState<number | null>(null)

  // Waiting view state
  const [waitingStatus, setWaitingStatus] = React.useState<'polling' | 'timeout' | 'terminated'>('polling')
  const [elapsedTime, setElapsedTime] = React.useState(0)

  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === WIZARD_STEPS.length - 1

  // Timer for elapsed time display when waiting
  React.useEffect(() => {
    if (wizardView !== 'waiting') return
    const interval = setInterval(() => {
      setElapsedTime(prev => {
        const newTime = prev + 1
        // After 10 minutes (600 seconds), show timeout
        if (newTime >= 600 && waitingStatus === 'polling') {
          setWaitingStatus('timeout')
        }
        return newTime
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [wizardView, waitingStatus])

  // Reset elapsed time when entering waiting view
  React.useEffect(() => {
    if (wizardView === 'waiting') {
      setElapsedTime(0)
      setWaitingStatus('polling')
    }
  }, [wizardView])

  /**
   * Format seconds into MM:SS display
   */
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}

    if (step === 0) {
      // Basic Info validation
      if (!formData.name.trim()) {
        newErrors.name = "Project name is required"
      } else if (!/^[a-zA-Z]/.test(formData.name)) {
        newErrors.name = "Project name must start with a letter"
      }

      if (formData.repository && !/^https?:\/\/.+/.test(formData.repository)) {
        newErrors.repository = "Invalid URL format"
      }

      if (!formData.targetPath?.trim()) {
        newErrors.targetPath = "Target directory is required"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Always enable the button - validation happens on click
  const isStepValid = true

  const handleDataChange = (newData: ProjectFormData) => {
    setFormData(newData)
    setIsDirty(true)
    // Clear errors when user makes changes
    if (Object.keys(errors).length > 0) {
      setErrors({})
    }
  }

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      return
    }
    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  /**
   * Helper to update a specific scaffolding step status
   */
  const updateStepStatus = (
    stepId: string,
    status: ScaffoldingStep['status'],
    errorMessage?: string
  ) => {
    setScaffoldingSteps((prev) =>
      prev.map((step) =>
        step.id === stepId
          ? { ...step, status, errorMessage }
          : step
      )
    )
  }

  /**
   * Run the scaffolding process
   */
  const runScaffolding = async () => {
    if (!formData.targetPath) {
      setScaffoldingError('Target directory is required')
      setWizardView('error')
      return
    }

    // Reset steps to pending
    setScaffoldingSteps(DEFAULT_SCAFFOLDING_STEPS.map(s => ({ ...s, status: 'pending' as const })))
    setScaffoldingError(null)
    setScaffoldingResult(null)
    setWizardView('progress')

    try {
      // Simulate step progress for each step
      const stepIds = ['create_claude_dir', 'create_beads_dir', 'create_design_dir', 'write_project_yaml', 'write_claude_md']

      for (const stepId of stepIds) {
        updateStepStatus(stepId, 'in_progress')
        // Small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 150))
      }

      // Call the actual scaffolding API
      const result = await window.electron.project.createScaffold({
        projectPath: formData.targetPath,
        projectName: formData.name,
        createDesign: formData.enableDesignSystem,
        templateVars: {
          PROJECT_NAME: formData.name,
          DESCRIPTION: formData.description,
        },
      })

      // Mark all steps as complete or update based on result
      if (result.success) {
        setScaffoldingSteps((prev) =>
          prev.map((step) => ({ ...step, status: 'complete' as const }))
        )
        setScaffoldingResult(result)

        // Write project.yaml with form data
        const projectConfig = {
          version: '1.0',
          project: {
            name: formData.name,
            description: formData.description || undefined,
            repository: formData.repository || undefined,
          },
          vision: formData.visionPurpose ? {
            purpose: formData.visionPurpose,
            target_users: formData.targetUsers.length > 0 ? formData.targetUsers : undefined,
            success_metrics: formData.successMetrics.length > 0 ? formData.successMetrics : undefined,
          } : undefined,
          stacks: formData.stackType ? {
            [formData.stackType]: {
              framework: formData.framework || undefined,
              language: formData.language || undefined,
            }
          } : undefined,
          design_system: formData.enableDesignSystem ? {
            enabled: true,
            path: formData.designSystemPath || undefined,
          } : undefined,
          data_governance: formData.enableDataGovernance ? {
            auth_provider: formData.authProvider || undefined,
          } : undefined,
          agents: formData.enableAgents ? {
            custom: [],
          } : undefined,
        }

        try {
          await window.electron.project.writeConfig(formData.targetPath, projectConfig)
        } catch (configError) {
          console.error('Failed to write project.yaml:', configError)
          // Continue anyway - scaffolding succeeded
        }

        // Launch terminal with claude command
        try {
          const terminalResult = await window.electron.terminal.launch({
            workingDir: formData.targetPath,
            command: 'claude',
          })
          if (terminalResult.success && terminalResult.pid) {
            setTerminalPid(terminalResult.pid)
          }
        } catch (terminalError) {
          console.error('Failed to launch terminal:', terminalError)
          // Continue anyway - scaffolding succeeded
        }

        // Transition to waiting state instead of success
        setWizardView('waiting')
        onSubmit?.(formData)
      } else {
        // Mark last step as error
        setScaffoldingSteps((prev) => {
          const lastInProgress = prev.findIndex(s => s.status === 'in_progress')
          return prev.map((step, i) =>
            i === lastInProgress || (lastInProgress === -1 && i === prev.length - 1)
              ? { ...step, status: 'error' as const, errorMessage: result.error }
              : step.status === 'in_progress'
                ? { ...step, status: 'complete' as const }
                : step
          )
        })
        setScaffoldingError(result.error || 'Failed to create project scaffold')
        setWizardView('error')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      setScaffoldingSteps((prev) =>
        prev.map((step) =>
          step.status === 'in_progress'
            ? { ...step, status: 'error' as const, errorMessage }
            : step
        )
      )
      setScaffoldingError(errorMessage)
      setWizardView('error')
    }
  }

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      return
    }

    setIsSubmitting(true)
    try {
      await runScaffolding()
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * Handle retry after error
   */
  const handleRetry = () => {
    setIsSubmitting(true)
    runScaffolding().finally(() => setIsSubmitting(false))
  }

  /**
   * Handle going back to edit form after error
   */
  const handleBackToEdit = () => {
    setWizardView('form')
    setScaffoldingError(null)
    // Reset steps
    setScaffoldingSteps(DEFAULT_SCAFFOLDING_STEPS.map(s => ({ ...s, status: 'pending' as const })))
  }

  /**
   * Handle completion (Done button)
   */
  const handleDone = () => {
    onComplete?.()
  }

  /**
   * Handle manual completion from waiting view
   */
  const handleDoneManually = () => {
    // Navigate to pipeline
    onComplete?.()
  }

  /**
   * Handle reopening terminal from waiting view
   */
  const handleReopenTerminal = async () => {
    if (formData.targetPath) {
      try {
        const terminalResult = await window.electron.terminal.launch({
          workingDir: formData.targetPath,
          command: 'claude'
        })
        if (terminalResult.success && terminalResult.pid) {
          setTerminalPid(terminalResult.pid)
        }
        setWaitingStatus('polling')
      } catch (error) {
        console.error('Failed to reopen terminal:', error)
      }
    }
  }

  /**
   * Handle folder selection
   */
  const handleSelectFolder = async () => {
    try {
      const result = await window.electron.dialog.selectFolder()
      if (result.paths && result.paths.length > 0) {
        setFormData((prev) => ({
          ...prev,
          targetPath: result.paths![0],
        }))
        setIsDirty(true)
        // Clear target path error if it exists
        if (errors.targetPath) {
          setErrors((prev) => {
            const { targetPath, ...rest } = prev
            return rest
          })
        }
      }
    } catch (error) {
      console.error('Error selecting folder:', error)
    }
  }

  const handleCancel = () => {
    if (isDirty) {
      setShowCancelDialog(true)
    } else {
      onCancel?.()
    }
  }

  const handleConfirmCancel = () => {
    setShowCancelDialog(false)
    onCancel?.()
  }

  /**
   * Render folder selection component
   */
  const renderFolderSelection = () => (
    <div className="space-y-2" data-testid="target-directory-selector">
      <Label htmlFor="target-path">
        Target Directory <span className="text-destructive">*</span>
      </Label>
      <div className="flex gap-2">
        <Input
          id="target-path"
          value={formData.targetPath || ""}
          onChange={(e) =>
            handleDataChange({ ...formData, targetPath: e.target.value })
          }
          placeholder="Select a folder..."
          readOnly
          aria-describedby="target-path-help target-path-error"
          className={cn(
            "flex-1",
            errors.targetPath && "border-destructive focus-visible:ring-destructive"
          )}
        />
        <Button
          type="button"
          variant="outline"
          onClick={handleSelectFolder}
          aria-label="Select folder"
        >
          <FolderOpen className="h-4 w-4 mr-2" />
          Browse
        </Button>
      </div>
      <p id="target-path-help" className="text-sm text-muted-foreground">
        Select the folder where your project files will be created.
      </p>
      {errors.targetPath && (
        <p id="target-path-error" role="alert" className="text-sm text-destructive">
          {errors.targetPath}
        </p>
      )}
    </div>
  )

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            {renderFolderSelection()}
            <BasicInfoStep
              data={formData}
              onChange={handleDataChange}
              errors={errors}
            />
          </div>
        )
      case 1:
        return (
          <ConstitutionStep
            data={formData}
            onChange={handleDataChange}
            errors={errors}
          />
        )
      case 2:
        return (
          <StackSelectionStep
            data={formData}
            onChange={handleDataChange}
            errors={errors}
          />
        )
      case 3:
        return (
          <OptionalSectionsStep
            data={formData}
            onChange={handleDataChange}
            errors={errors}
          />
        )
      default:
        return null
    }
  }

  /**
   * Render progress view during scaffolding
   */
  const renderProgressView = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Creating Project</h1>
        <p className="text-muted-foreground">
          Setting up your project structure...
        </p>
      </div>
      <ScaffoldingProgress
        steps={scaffoldingSteps}
        onRetry={() => {
          // Retry the entire scaffolding process
          handleRetry()
        }}
      />
      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={() => {
            setWizardView('form')
            setIsSubmitting(false)
          }}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </div>
  )

  /**
   * Render success view with MCP recommendations
   */
  const renderSuccessView = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-6 w-6 text-emerald-500" />
          <h1 className="text-2xl font-bold">Project Created Successfully</h1>
        </div>
        <p className="text-muted-foreground">
          Your project structure has been set up in{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-sm">
            {formData.targetPath}
          </code>
        </p>
      </div>

      {scaffoldingResult && (
        <div className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h3 className="font-medium text-sm">Created Files & Directories:</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              {scaffoldingResult.createdPaths.map((path) => (
                <li key={path} className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  {path}
                </li>
              ))}
            </ul>
            {scaffoldingResult.skippedPaths.length > 0 && (
              <>
                <h3 className="font-medium text-sm mt-4">Skipped (already exist):</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {scaffoldingResult.skippedPaths.map((path) => (
                    <li key={path}>{path}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      )}

      <MCPRecommendations
        stack={{
          type: formData.stackType || "",
          framework: formData.framework,
          language: formData.language,
        }}
      />

      <div className="flex justify-end">
        <Button onClick={handleDone}>
          Done
        </Button>
      </div>
    </div>
  )

  /**
   * Render error view with retry option
   */
  const renderErrorView = () => (
    <div className="space-y-6" data-testid="scaffolding-error">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-6 w-6 text-destructive" />
          <h1 className="text-2xl font-bold">Project Creation Failed</h1>
        </div>
        <p className="text-muted-foreground">
          An error occurred while setting up your project.
        </p>
      </div>

      <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
        <p className="text-sm text-destructive">
          {scaffoldingError || "An unexpected error occurred"}
        </p>
      </div>

      <ScaffoldingProgress
        steps={scaffoldingSteps}
        onRetry={handleRetry}
      />

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleBackToEdit}
        >
          Back to Edit
        </Button>
        <Button
          onClick={handleRetry}
          disabled={isSubmitting}
        >
          Try Again
        </Button>
      </div>
    </div>
  )

  /**
   * Render waiting view - loading screen while waiting for init completion
   */
  const renderWaitingView = () => (
    <div className="space-y-6" data-testid="waiting-view">
      <div className="flex items-center gap-2">
        {waitingStatus === 'polling' && (
          <Loader2 className="h-6 w-6 animate-spin text-sky-500" />
        )}
        {waitingStatus === 'timeout' && (
          <AlertCircle className="h-6 w-6 text-amber-500" />
        )}
        {waitingStatus === 'terminated' && (
          <AlertCircle className="h-6 w-6 text-amber-500" />
        )}
        <h1 className="text-2xl font-bold">
          {waitingStatus === 'timeout' ? 'Setup Timeout' : 'Completing Project Setup...'}
        </h1>
      </div>

      {waitingStatus === 'timeout' ? (
        <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4">
          <p className="text-amber-300">
            Setup is taking longer than expected. You can continue waiting, manually confirm completion, or reopen the terminal.
          </p>
        </div>
      ) : (
        <div className="bg-sky-900/20 border border-sky-500/30 rounded-lg p-4 space-y-3">
          <p className="text-sky-300 font-medium">
            Complete the setup in Claude Code:
          </p>
          <ol className="text-sm text-slate-300 space-y-2 list-decimal list-inside">
            <li>A terminal should have opened at your project directory</li>
            <li>If not, open a terminal and navigate to: <code className="bg-slate-800 px-2 py-0.5 rounded text-xs">{formData.targetPath}</code></li>
            <li>Run <code className="bg-slate-800 px-2 py-0.5 rounded">claude</code> to launch Claude Code</li>
            <li>Tell Claude to run <code className="bg-slate-800 px-2 py-0.5 rounded">/init-project</code></li>
          </ol>
          <p className="text-xs text-slate-500 mt-2">
            Your form data has been saved to project.yaml and will be used by Claude to configure agents and documentation.
          </p>
        </div>
      )}

      <div className="space-y-2">
        <div className="text-sm text-slate-400">
          Elapsed: {formatTime(elapsedTime)}
        </div>
        {terminalPid && waitingStatus === 'polling' && (
          <div className="text-sm text-slate-500">
            Watching for init completion...
          </div>
        )}
        {waitingStatus === 'terminated' && (
          <div className="text-sm text-amber-400">
            Terminal process has ended. Reopen to continue setup.
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button onClick={handleDoneManually}>
          I'm Done
        </Button>
        {waitingStatus === 'terminated' && (
          <Button variant="outline" onClick={handleReopenTerminal}>
            Reopen Terminal
          </Button>
        )}
        {waitingStatus === 'timeout' && (
          <Button variant="outline" onClick={handleReopenTerminal}>
            Reopen Terminal
          </Button>
        )}
      </div>
    </div>
  )

  // Render based on current view state
  if (wizardView === 'progress') {
    return (
      <div data-testid="project-wizard" className={cn("space-y-8", className)}>
        {renderProgressView()}
      </div>
    )
  }

  if (wizardView === 'success') {
    return (
      <div data-testid="project-wizard" className={cn("space-y-8", className)}>
        {renderSuccessView()}
      </div>
    )
  }

  if (wizardView === 'error') {
    return (
      <div data-testid="project-wizard" className={cn("space-y-8", className)}>
        {renderErrorView()}
      </div>
    )
  }

  if (wizardView === 'waiting') {
    return (
      <div data-testid="project-wizard" className={cn("space-y-8", className)}>
        {renderWaitingView()}
      </div>
    )
  }

  // Default: form view
  return (
    <div data-testid="project-wizard" className={cn("space-y-8", className)}>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Initialize New Project</h1>
        <p className="text-muted-foreground">
          Configure your project settings step by step.
        </p>
      </div>

      <WizardStepper
        steps={WIZARD_STEPS}
        currentStep={currentStep}
        showDescriptions
      />

      <div className="min-h-[300px]">{renderStep()}</div>

      <WizardNavigation
        currentStep={currentStep}
        totalSteps={WIZARD_STEPS.length}
        isFirstStep={isFirstStep}
        isLastStep={isLastStep}
        isStepValid={isStepValid}
        isSubmitting={isSubmitting}
        onPrev={handlePrev}
        onNext={handleNext}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />

      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Cancel</DialogTitle>
            <DialogDescription>
              You have unsaved changes. Are you sure you want to leave?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Keep Editing
            </Button>
            <Button variant="destructive" onClick={handleConfirmCancel}>
              Leave
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
