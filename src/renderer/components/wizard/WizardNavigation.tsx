import { Loader2 } from "lucide-react"

import { Button } from "@renderer/components/ui/button"
import { cn } from "@/lib/utils"

export interface WizardNavigationProps {
  currentStep: number
  totalSteps: number
  isFirstStep: boolean
  isLastStep: boolean
  isStepValid: boolean
  isSubmitting?: boolean
  onPrev: () => void
  onNext: () => void
  onSubmit: () => void
  onCancel: () => void
  className?: string
}

export function WizardNavigation({
  currentStep,
  totalSteps,
  isFirstStep,
  isLastStep,
  isStepValid,
  isSubmitting = false,
  onPrev,
  onNext,
  onSubmit,
  onCancel,
  className,
}: WizardNavigationProps) {
  return (
    <div
      data-testid="wizard-navigation"
      className={cn(
        "flex items-center justify-between border-t pt-4",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">
          Step {currentStep + 1} of {totalSteps}
        </span>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onPrev}
            disabled={isFirstStep || isSubmitting}
          >
            Previous
          </Button>

          {isLastStep ? (
            <Button
              type="button"
              onClick={onSubmit}
              disabled={!isStepValid || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2
                    data-testid="submit-loading"
                    className="mr-2 h-4 w-4 animate-spin"
                  />
                  Creating...
                </>
              ) : (
                "Create Project"
              )}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={onNext}
              disabled={!isStepValid || isSubmitting}
            >
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
