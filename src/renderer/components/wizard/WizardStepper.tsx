import * as React from "react"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

export interface Step {
  id: string
  label: string
  description?: string
}

export type StepState = "completed" | "current" | "upcoming"

export interface WizardStepperProps {
  steps: Step[]
  currentStep: number
  completedSteps?: number[]
  showDescriptions?: boolean
  clickableSteps?: boolean
  allowFutureSteps?: boolean
  orientation?: "horizontal" | "vertical"
  className?: string
  onStepClick?: (stepIndex: number) => void
  renderIcon?: (step: Step, index: number, state: StepState) => React.ReactNode
}

export function WizardStepper({
  steps,
  currentStep,
  completedSteps,
  showDescriptions = false,
  clickableSteps = false,
  allowFutureSteps = false,
  orientation = "horizontal",
  className,
  onStepClick,
  renderIcon,
}: WizardStepperProps) {
  // Clamp currentStep to valid range
  const clampedCurrentStep = Math.max(0, Math.min(currentStep, steps.length - 1))

  const getStepState = (index: number): StepState => {
    if (completedSteps) {
      if (index === clampedCurrentStep) return "current"
      if (completedSteps.includes(index)) return "completed"
      return "upcoming"
    }

    if (index < clampedCurrentStep) return "completed"
    if (index === clampedCurrentStep) return "current"
    return "upcoming"
  }

  const isClickable = (index: number): boolean => {
    if (!clickableSteps) return false
    if (allowFutureSteps) return true
    const state = getStepState(index)
    return state === "completed"
  }

  const handleStepClick = (index: number) => {
    if (isClickable(index) && onStepClick) {
      onStepClick(index)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent, index: number) => {
    if ((event.key === "Enter" || event.key === " ") && isClickable(index)) {
      event.preventDefault()
      handleStepClick(index)
    }
  }

  const renderStepIcon = (step: Step, index: number, state: StepState) => {
    if (renderIcon) {
      return renderIcon(step, index, state)
    }

    if (state === "completed") {
      return <Check className="h-4 w-4" />
    }

    return <span>{index + 1}</span>
  }

  const getAriaLabel = (step: Step, index: number, state: StepState): string => {
    return `Step ${index + 1}: ${step.label} - ${state}`
  }

  return (
    <nav
      aria-label="Wizard progress"
      className={cn("w-full", className)}
    >
      <ol
        role="list"
        className={cn(
          "flex",
          orientation === "vertical" ? "flex-col space-y-4" : "flex-row items-center"
        )}
      >
        {steps.map((step, index) => {
          const state = getStepState(index)
          const clickable = isClickable(index)
          const isLast = index === steps.length - 1

          return (
            <li
              key={step.id}
              data-testid={`step-${index}`}
              data-state={state}
              aria-label={getAriaLabel(step, index, state)}
              aria-current={state === "current" ? "step" : undefined}
              tabIndex={clickable ? 0 : undefined}
              onClick={() => handleStepClick(index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={cn(
                "flex items-center",
                orientation === "horizontal" && !isLast && "flex-1",
                clickable && "cursor-pointer"
              )}
            >
              <div
                className="flex flex-col items-center"
              >
                <div
                  data-testid={`step-indicator-${index}`}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium",
                    state === "completed" && "border-primary bg-primary text-primary-foreground",
                    state === "current" && "border-primary bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2",
                    state === "upcoming" && "border-muted bg-muted text-muted-foreground"
                  )}
                >
                  {renderStepIcon(step, index, state)}
                </div>
                <span
                  data-testid={`step-label-${index}`}
                  className={cn(
                    "mt-2 text-sm",
                    state === "current" && "font-medium text-primary",
                    state === "completed" && "text-foreground",
                    state === "upcoming" && "text-muted-foreground opacity-70"
                  )}
                >
                  {step.label}
                </span>
                {showDescriptions && step.description && (
                  <span className="mt-1 text-xs text-muted-foreground">
                    {step.description}
                  </span>
                )}
              </div>

              {!isLast && (
                <div
                  data-testid="step-connector"
                  className={cn(
                    "h-0.5 flex-1",
                    orientation === "horizontal" ? "mx-4 min-w-[2rem]" : "ml-4 h-8 w-0.5",
                    (state === "completed" || (completedSteps && completedSteps.includes(index)))
                      ? "bg-primary"
                      : "bg-muted"
                  )}
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
