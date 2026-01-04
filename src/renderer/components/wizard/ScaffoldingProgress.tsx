/**
 * ScaffoldingProgress Component
 *
 * Displays step-by-step scaffolding progress during project initialization.
 * Shows visual indicators for each step's status: pending, in_progress, complete, or error.
 */

import * as React from "react"
import { Check, Loader2, XCircle, Circle, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "../ui/button"

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

export function ScaffoldingProgress({
  steps,
  onRetry,
  onComplete,
  className,
}: ScaffoldingProgressProps) {
  // Track if onComplete has already been called
  const hasCompletedRef = React.useRef(false)

  // Check if all steps are complete and call onComplete
  React.useEffect(() => {
    const allComplete = steps.length > 0 && steps.every(step => step.status === 'complete')

    if (allComplete && onComplete && !hasCompletedRef.current) {
      hasCompletedRef.current = true
      onComplete()
    }

    // Reset the ref if not all steps are complete (for re-runs)
    if (!allComplete) {
      hasCompletedRef.current = false
    }
  }, [steps, onComplete])

  // Calculate completed count
  const completedCount = steps.filter(step => step.status === 'complete').length
  const totalCount = steps.length

  const renderStepIndicator = (step: ScaffoldingStep) => {
    const baseClasses = "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all"

    switch (step.status) {
      case 'complete':
        return (
          <div
            data-testid={`step-indicator-${step.id}`}
            className={cn(baseClasses, "border-emerald-500 bg-emerald-500 text-white")}
          >
            <Check className="h-4 w-4" data-testid="check-icon" />
          </div>
        )
      case 'in_progress':
        return (
          <div
            data-testid={`step-indicator-${step.id}`}
            className={cn(baseClasses, "border-primary bg-primary/10 text-primary animate-pulse")}
          >
            <Loader2 className="h-4 w-4 animate-spin" data-testid="loading-spinner" />
          </div>
        )
      case 'error':
        return (
          <div
            data-testid={`step-indicator-${step.id}`}
            className={cn(baseClasses, "border-red-500 bg-red-500/10 text-red-500")}
          >
            <XCircle className="h-4 w-4" data-testid="error-icon" />
          </div>
        )
      case 'pending':
      default:
        return (
          <div
            data-testid={`step-indicator-${step.id}`}
            className={cn(baseClasses, "border-muted bg-muted text-muted-foreground opacity-50")}
          >
            <Circle className="h-4 w-4" />
          </div>
        )
    }
  }

  return (
    <div
      data-testid="scaffolding-progress"
      className={cn("w-full", className)}
      aria-live="polite"
    >
      {/* Progress Summary */}
      {totalCount > 0 && (
        <div className="mb-4 text-sm text-muted-foreground">
          {completedCount} of {totalCount} complete
        </div>
      )}

      {/* Steps List */}
      <ul role="list" className="flex flex-col space-y-3">
        {steps.map((step) => (
          <li
            key={step.id}
            data-testid={`step-${step.id}`}
            data-status={step.status}
            role="listitem"
            aria-label={`${step.label} - ${step.status}`}
            aria-busy={step.status === 'in_progress'}
            className={cn(
              "flex flex-col",
              step.status === 'pending' && "opacity-60"
            )}
          >
            <div className="flex items-center gap-3">
              {renderStepIndicator(step)}

              <div className="flex-1">
                <span
                  data-testid={`step-label-${step.id}`}
                  className={cn(
                    "text-sm font-medium",
                    step.status === 'complete' && "text-foreground",
                    step.status === 'in_progress' && "text-primary",
                    step.status === 'error' && "text-red-500",
                    step.status === 'pending' && "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>

                {step.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {step.description}
                  </p>
                )}
              </div>

              {/* Retry Button for Error State */}
              {step.status === 'error' && onRetry && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRetry(step.id)}
                  aria-label={`Retry ${step.label}`}
                  className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Retry
                </Button>
              )}
            </div>

            {/* Error Message */}
            {step.status === 'error' && step.errorMessage && (
              <div
                role="alert"
                className="ml-11 mt-1 text-xs text-red-500"
              >
                {step.errorMessage}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
