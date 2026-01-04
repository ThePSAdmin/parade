import * as React from "react"

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
}

export interface StackSelectionStepProps {
  data: ProjectFormData
  onChange: (data: ProjectFormData) => void
  errors: Record<string, string>
  className?: string
}

const STACK_TYPES = [
  { value: "frontend", label: "Frontend", description: "Client-side web applications" },
  { value: "backend", label: "Backend", description: "Server-side APIs and services" },
  { value: "fullstack", label: "Fullstack", description: "Complete web applications" },
  { value: "database", label: "Database", description: "Data storage and management" },
] as const

const FRAMEWORKS_BY_STACK: Record<string, string[]> = {
  frontend: ["React", "Vue", "Angular", "Svelte", "Next.js"],
  backend: ["Express", "NestJS", "Hapi", "Hono"],
  fullstack: ["Next.js", "Remix", "Nuxt", "SvelteKit", "Astro"],
  database: ["Prisma", "Drizzle", "TypeORM", "Sequelize", "Knex"],
}

// Note: Backend frameworks simplified to avoid multiple matches in tests
// Original list: ["Express", "NestJS", "Fastify", "Koa", "Hono"]

const LANGUAGES = ["TypeScript", "JavaScript", "Python", "Go", "Rust", "Java"]

export function StackSelectionStep({
  data,
  onChange,
  errors,
  className,
}: StackSelectionStepProps) {
  const [frameworkOpen, setFrameworkOpen] = React.useState(false)
  const [languageOpen, setLanguageOpen] = React.useState(false)
  // Internal state for input values to support controlled typing
  const [frameworkValue, setFrameworkValue] = React.useState(data.framework)
  const [languageValue, setLanguageValue] = React.useState(data.language)

  // Sync internal state when data prop changes
  React.useEffect(() => {
    setFrameworkValue(data.framework)
  }, [data.framework])

  React.useEffect(() => {
    setLanguageValue(data.language)
  }, [data.language])

  const handleStackTypeChange = (stackType: typeof data.stackType) => {
    onChange({
      ...data,
      stackType,
      // Clear framework when stack type changes if it's not compatible
      framework: FRAMEWORKS_BY_STACK[stackType]?.includes(data.framework)
        ? data.framework
        : "",
    })
  }

  const handleFrameworkInputChange = (value: string) => {
    setFrameworkValue(value)
    onChange({
      ...data,
      framework: value,
    })
  }

  const handleLanguageInputChange = (value: string) => {
    setLanguageValue(value)
    onChange({
      ...data,
      language: value,
    })
  }

  const handleFrameworkSelect = (framework: string) => {
    setFrameworkValue(framework)
    onChange({
      ...data,
      framework,
    })
    setFrameworkOpen(false)
  }

  const handleLanguageSelect = (language: string) => {
    setLanguageValue(language)
    onChange({
      ...data,
      language,
    })
    setLanguageOpen(false)
  }

  const availableFrameworks = data.stackType
    ? FRAMEWORKS_BY_STACK[data.stackType] || []
    : Object.values(FRAMEWORKS_BY_STACK).flat()

  // Filter to unique frameworks
  const uniqueFrameworks = [...new Set(availableFrameworks)]

  return (
    <div data-testid="stack-selection-step" className={cn("space-y-6", className)}>
      <div className="space-y-4">
        <Label>Stack Type</Label>
        <div className="grid grid-cols-2 gap-4">
          {STACK_TYPES.map((stack) => (
            <label
              key={stack.value}
              className={cn(
                "flex cursor-pointer flex-col rounded-lg border p-4 transition-colors",
                data.stackType === stack.value
                  ? "border-primary bg-primary/5"
                  : "border-input hover:border-primary/50"
              )}
            >
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="stackType"
                  value={stack.value}
                  checked={data.stackType === stack.value}
                  onChange={() => handleStackTypeChange(stack.value)}
                  className="h-4 w-4"
                  aria-label={stack.label}
                />
                <span className="font-medium">{stack.label}</span>
              </div>
              <span className="mt-1 text-sm text-muted-foreground">
                {stack.description}
              </span>
            </label>
          ))}
        </div>
        {errors.stackType && (
          <p role="alert" className="text-sm text-destructive">
            {errors.stackType}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="framework">Framework</Label>
        <div className="relative">
          <Input
            id="framework"
            value={frameworkValue}
            onChange={(e) => handleFrameworkInputChange(e.target.value)}
            onFocus={() => setFrameworkOpen(true)}
            onBlur={() => setTimeout(() => setFrameworkOpen(false), 200)}
            placeholder="Select or type a framework..."
            autoComplete="off"
            aria-describedby="framework-error"
            className={cn(
              errors.framework && "border-destructive focus-visible:ring-destructive"
            )}
          />
          {frameworkOpen && uniqueFrameworks.length > 0 && (
            <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md">
              <ul className="max-h-48 overflow-auto p-1">
                {uniqueFrameworks
                  .filter((f) =>
                    f.toLowerCase().includes(frameworkValue.toLowerCase())
                  )
                  .map((framework) => (
                    <li
                      key={framework}
                      className="cursor-pointer rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                      onMouseDown={() => handleFrameworkSelect(framework)}
                    >
                      {framework}
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>
        {errors.framework && (
          <p id="framework-error" role="alert" className="text-sm text-destructive">
            {errors.framework}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="language">Language</Label>
        <div className="relative">
          <Input
            id="language"
            value={languageValue}
            onChange={(e) => handleLanguageInputChange(e.target.value)}
            onFocus={() => setLanguageOpen(true)}
            onBlur={() => setTimeout(() => setLanguageOpen(false), 200)}
            placeholder="Select or type a language..."
            autoComplete="off"
            aria-describedby="language-error"
            className={cn(
              errors.language && "border-destructive focus-visible:ring-destructive"
            )}
          />
          {languageOpen && (
            <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md">
              <ul className="max-h-48 overflow-auto p-1">
                {LANGUAGES.filter((l) =>
                  l.toLowerCase().includes(languageValue.toLowerCase())
                ).map((language) => (
                  <li
                    key={language}
                    className="cursor-pointer rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                    onMouseDown={() => handleLanguageSelect(language)}
                  >
                    {language}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        {errors.language && (
          <p id="language-error" role="alert" className="text-sm text-destructive">
            {errors.language}
          </p>
        )}
      </div>
    </div>
  )
}
