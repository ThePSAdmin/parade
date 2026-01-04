import * as React from "react"
import { X } from "lucide-react"

import { Textarea } from "@renderer/components/ui/textarea"
import { Input } from "@renderer/components/ui/input"
import { Label } from "@renderer/components/ui/label"
import { Button } from "@renderer/components/ui/button"
import { cn } from "@/lib/utils"

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
}

export interface ConstitutionStepProps {
  data: ProjectFormData
  onChange: (data: ProjectFormData) => void
  errors: Record<string, string>
  className?: string
}

export function ConstitutionStep({
  data,
  onChange,
  errors,
  className,
}: ConstitutionStepProps) {
  const [targetUserInput, setTargetUserInput] = React.useState("")
  const [successMetricInput, setSuccessMetricInput] = React.useState("")

  const handleVisionChange = (value: string) => {
    onChange({
      ...data,
      visionPurpose: value,
    })
  }

  const handleAddTargetUser = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && targetUserInput.trim()) {
      e.preventDefault()
      onChange({
        ...data,
        targetUsers: [...data.targetUsers, targetUserInput.trim()],
      })
      setTargetUserInput("")
    }
  }

  const handleRemoveTargetUser = (index: number) => {
    onChange({
      ...data,
      targetUsers: data.targetUsers.filter((_, i) => i !== index),
    })
  }

  const handleAddSuccessMetric = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && successMetricInput.trim()) {
      e.preventDefault()
      onChange({
        ...data,
        successMetrics: [...data.successMetrics, successMetricInput.trim()],
      })
      setSuccessMetricInput("")
    }
  }

  const handleRemoveSuccessMetric = (index: number) => {
    onChange({
      ...data,
      successMetrics: data.successMetrics.filter((_, i) => i !== index),
    })
  }

  return (
    <div data-testid="constitution-step" className={cn("space-y-6", className)}>
      <div className="space-y-2">
        <Label htmlFor="vision-purpose">Vision / Purpose</Label>
        <Textarea
          id="vision-purpose"
          value={data.visionPurpose}
          onChange={(e) => handleVisionChange(e.target.value)}
          placeholder="What is the purpose of this project? What problem does it solve?"
          rows={4}
          aria-describedby="vision-count vision-error"
          className={cn(
            errors.visionPurpose && "border-destructive focus-visible:ring-destructive"
          )}
        />
        <p id="vision-count" className="text-sm text-muted-foreground">
          {data.visionPurpose.length} characters
        </p>
        {errors.visionPurpose && (
          <p id="vision-error" role="alert" className="text-sm text-destructive">
            {errors.visionPurpose}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="target-users">Target Users</Label>
        <Input
          id="target-users"
          value={targetUserInput}
          onChange={(e) => setTargetUserInput(e.target.value)}
          onKeyDown={handleAddTargetUser}
          placeholder="Type and press Enter to add..."
          aria-describedby="target-users-help target-users-error"
          className={cn(
            errors.targetUsers && "border-destructive focus-visible:ring-destructive"
          )}
        />
        <p id="target-users-help" className="text-sm text-muted-foreground">
          Press Enter to add each target user.
        </p>
        {errors.targetUsers && (
          <p id="target-users-error" role="alert" className="text-sm text-destructive">
            {errors.targetUsers}
          </p>
        )}
        {data.targetUsers.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {data.targetUsers.map((user, index) => (
              <div
                key={index}
                data-testid="tag"
                className="flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-sm"
              >
                <span>{user}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => handleRemoveTargetUser(index)}
                  aria-label={`Remove ${user}`}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="success-metrics">Success Metrics</Label>
        <Input
          id="success-metrics"
          value={successMetricInput}
          onChange={(e) => setSuccessMetricInput(e.target.value)}
          onKeyDown={handleAddSuccessMetric}
          placeholder="Type and press Enter to add..."
          aria-describedby="metrics-help metrics-error"
          className={cn(
            errors.successMetrics && "border-destructive focus-visible:ring-destructive"
          )}
        />
        <p id="metrics-help" className="text-sm text-muted-foreground">
          Press Enter to add each success metric.
        </p>
        {errors.successMetrics && (
          <p id="metrics-error" role="alert" className="text-sm text-destructive">
            {errors.successMetrics}
          </p>
        )}
        {data.successMetrics.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {data.successMetrics.map((metric, index) => (
              <div
                key={index}
                data-testid="tag"
                className="flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-sm"
              >
                <span>{metric}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => handleRemoveSuccessMetric(index)}
                  aria-label={`Remove ${metric}`}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
