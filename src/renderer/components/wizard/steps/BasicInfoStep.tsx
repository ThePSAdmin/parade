import { Input } from "@renderer/components/ui/input"
import { Textarea } from "@renderer/components/ui/textarea"
import { Label } from "@renderer/components/ui/label"
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

export interface BasicInfoStepProps {
  data: ProjectFormData
  onChange: (data: ProjectFormData) => void
  errors: Record<string, string>
  className?: string
}

export function BasicInfoStep({
  data,
  onChange,
  errors,
  className,
}: BasicInfoStepProps) {
  const handleChange = (
    field: keyof ProjectFormData,
    value: string
  ) => {
    onChange({
      ...data,
      [field]: value,
    })
  }

  return (
    <div data-testid="basic-info-step" className={cn("space-y-6", className)}>
      <div className="space-y-2">
        <Label htmlFor="project-name">
          Project Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="project-name"
          value={data.name}
          onChange={(e) => handleChange("name", e.target.value)}
          placeholder="my-project"
          required
          aria-describedby="name-help name-error"
          className={cn(
            errors.name && "border-destructive focus-visible:ring-destructive"
          )}
        />
        <p id="name-help" className="text-sm text-muted-foreground">
          Must start with a letter and contain only letters, numbers, and hyphens.
        </p>
        {errors.name && (
          <p id="name-error" role="alert" className="text-sm text-destructive">
            {errors.name}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={data.description}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="A brief description of your project..."
          rows={3}
          aria-describedby="description-error"
          className={cn(
            errors.description && "border-destructive focus-visible:ring-destructive"
          )}
        />
        {errors.description && (
          <p id="description-error" role="alert" className="text-sm text-destructive">
            {errors.description}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="repository">Repository</Label>
        <Input
          id="repository"
          type="url"
          value={data.repository}
          onChange={(e) => handleChange("repository", e.target.value)}
          placeholder="https://github.com/username/repo"
          aria-describedby="repository-help repository-error"
          className={cn(
            errors.repository && "border-destructive focus-visible:ring-destructive"
          )}
        />
        <p id="repository-help" className="text-sm text-muted-foreground">
          Optional. Link to a Git repository (GitHub, GitLab, etc).
        </p>
        {errors.repository && (
          <p id="repository-error" role="alert" className="text-sm text-destructive">
            {errors.repository}
          </p>
        )}
      </div>
    </div>
  )
}
