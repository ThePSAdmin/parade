import { Checkbox } from "@renderer/components/ui/checkbox"
import { Input } from "@renderer/components/ui/input"
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
  designSystemPath?: string
  authProvider?: string
}

export interface OptionalSectionsStepProps {
  data: ProjectFormData
  onChange: (data: ProjectFormData) => void
  errors: Record<string, string>
  className?: string
}

const OPTIONAL_SECTIONS = [
  {
    id: "enableDesignSystem",
    label: "Design System",
    description: "Include design tokens, style guidelines, and UI component standards.",
  },
  {
    id: "enableDataGovernance",
    label: "Data Governance",
    description: "Configure naming conventions, auth provider settings, and RLS policies.",
  },
  {
    id: "enableAgents",
    label: "Agents",
    description: "Define custom agents and sub-agents for automated workflows and agent definitions.",
  },
] as const

export function OptionalSectionsStep({
  data,
  onChange,
  errors,
  className,
}: OptionalSectionsStepProps) {
  const handleToggle = (field: keyof ProjectFormData, checked: boolean) => {
    onChange({
      ...data,
      [field]: checked,
    })
  }

  const handleInputChange = (field: keyof ProjectFormData, value: string) => {
    onChange({
      ...data,
      [field]: value,
    })
  }

  return (
    <div data-testid="optional-sections-step" className={cn("space-y-6", className)}>
      <div className="space-y-4">
        {OPTIONAL_SECTIONS.map((section) => (
          <div key={section.id} className="space-y-4">
            <div className="flex items-start space-x-3 rounded-lg border p-4">
              <Checkbox
                id={section.id}
                checked={(data[section.id as keyof ProjectFormData] as boolean) || false}
                onCheckedChange={(checked) =>
                  handleToggle(section.id as keyof ProjectFormData, checked === true)
                }
                aria-label={section.label}
              />
              <div className="flex-1 space-y-1">
                <Label
                  htmlFor={section.id}
                  className="cursor-pointer font-medium leading-none"
                >
                  {section.label}
                </Label>
                <p className="text-sm text-muted-foreground">{section.description}</p>
              </div>
            </div>

            {/* Conditional configuration for Design System */}
            {section.id === "enableDesignSystem" && data.enableDesignSystem && (
              <div className="ml-7 space-y-2">
                <Label htmlFor="design-system-path">Design System Directory</Label>
                <Input
                  id="design-system-path"
                  value={data.designSystemPath || ""}
                  onChange={(e) => handleInputChange("designSystemPath", e.target.value)}
                  placeholder=".design/"
                  aria-describedby="design-path-help"
                />
                <p id="design-path-help" className="text-sm text-muted-foreground">
                  Path where design system files will be stored.
                </p>
              </div>
            )}

            {/* Conditional configuration for Data Governance */}
            {section.id === "enableDataGovernance" && data.enableDataGovernance && (
              <div className="ml-7 space-y-2">
                <Label htmlFor="auth-provider">Auth Provider</Label>
                <Input
                  id="auth-provider"
                  value={data.authProvider || ""}
                  onChange={(e) => handleInputChange("authProvider", e.target.value)}
                  placeholder="supabase, auth0, clerk..."
                  aria-describedby="auth-provider-help"
                />
                <p id="auth-provider-help" className="text-sm text-muted-foreground">
                  Authentication provider for your project.
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {errors.optional && (
        <p role="alert" className="text-sm text-destructive">
          {errors.optional}
        </p>
      )}
    </div>
  )
}
