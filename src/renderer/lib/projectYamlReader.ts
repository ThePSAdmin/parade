/**
 * projectYamlReader - Module for reading and validating project.yaml files
 *
 * Provides:
 * - Reading and parsing project.yaml from the renderer process (via IPC)
 * - Zod validation schemas for wizard form data
 * - Pre-fill logic for populating wizard state from existing config
 * - Transform functions between config and wizard data formats
 */

import { z } from 'zod'

// =============================================================================
// Type Definitions
// =============================================================================

/** Configuration structure as stored in project.yaml */
export interface ProjectYamlConfig {
  version: string
  project: {
    name: string
    description?: string
    repository?: string
  }
  vision?: {
    purpose?: string
    target_users?: string[]
    success_metrics?: string[]
  }
  stacks?: Record<string, unknown> | unknown[]
  design_system?: {
    enabled?: boolean
    path?: string
    docs?: string[]
  }
  data_governance?: {
    auth_provider?: string
    rls_patterns?: {
      description?: string
      examples?: string[]
    }
    naming_conventions?: {
      dates?: string
      enums?: string
      fields?: string
      files?: string
      directories?: string
    }
  }
  agents?: {
    custom?: Array<{
      name: string
      label: string
      prompt_file: string
    }>
  }
  workflow?: {
    tdd_enabled?: boolean
  }
}

/** Wizard form data structure (flattened for UI) */
export interface WizardFormData {
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
  designSystemPath?: string
  authProvider?: string
}

/** Result of reading project.yaml */
export interface ReadProjectYamlResult {
  config: ProjectYamlConfig | null
  error?: string
}

/** Validation result for a wizard step */
export interface ValidationResult {
  valid: boolean
  errors: Record<string, string>
}

// =============================================================================
// Zod Schemas
// =============================================================================

/**
 * BasicInfoSchema - Step 0: Project name, description, repository
 */
export const BasicInfoSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Project name is required' })
    .regex(/^[a-zA-Z]/, { message: 'Project name must start with a letter' }),
  description: z
    .string()
    .max(500, { message: 'Description must be 500 characters or less' }),
  repository: z
    .string()
    .refine(
      (val) => val === '' || /^https?:\/\/.+/.test(val),
      { message: 'Repository must be a valid URL starting with http:// or https://' }
    ),
})

/**
 * ConstitutionSchema - Step 1: Vision, target users, success metrics
 */
export const ConstitutionSchema = z.object({
  visionPurpose: z
    .string()
    .max(1000, { message: 'Vision purpose must be 1000 characters or less' }),
  targetUsers: z.array(z.string()),
  successMetrics: z.array(z.string()),
})

/**
 * StackSelectionSchema - Step 2: Stack type, framework, language
 */
export const StackSelectionSchema = z.object({
  stackType: z.enum(['frontend', 'backend', 'fullstack', 'database', ''], {
    errorMap: () => ({ message: 'Invalid stack type. Must be frontend, backend, fullstack, database, or empty' }),
  }),
  framework: z.string(),
  language: z.string(),
})

/**
 * OptionalSectionsSchema - Step 3: Design system, data governance, agents
 */
export const OptionalSectionsSchema = z.object({
  enableDesignSystem: z.boolean().default(false),
  enableDataGovernance: z.boolean().default(false),
  enableAgents: z.boolean().default(false),
  designSystemPath: z.string().optional(),
  authProvider: z.string().optional(),
})

/**
 * WizardFormSchema - Complete wizard form data
 */
export const WizardFormSchema = z.object({
  // Basic Info
  name: z
    .string()
    .min(1, { message: 'Project name is required' })
    .regex(/^[a-zA-Z]/, { message: 'Project name must start with a letter' }),
  description: z
    .string()
    .max(500, { message: 'Description must be 500 characters or less' }),
  repository: z
    .string()
    .refine(
      (val) => val === '' || /^https?:\/\/.+/.test(val),
      { message: 'Repository must be a valid URL starting with http:// or https://' }
    ),
  // Constitution
  visionPurpose: z
    .string()
    .max(1000, { message: 'Vision purpose must be 1000 characters or less' }),
  targetUsers: z.array(z.string()),
  successMetrics: z.array(z.string()),
  // Stack Selection
  stackType: z.enum(['frontend', 'backend', 'fullstack', 'database', ''], {
    errorMap: () => ({ message: 'Invalid stack type. Must be frontend, backend, fullstack, database, or empty' }),
  }),
  framework: z.string(),
  language: z.string(),
  // Optional Sections
  enableDesignSystem: z.boolean().default(false),
  enableDataGovernance: z.boolean().default(false),
  enableAgents: z.boolean().default(false),
  designSystemPath: z.string().optional(),
  authProvider: z.string().optional(),
})

/**
 * ProjectYamlSchema - Schema for project.yaml configuration file
 */
export const ProjectYamlSchema = z.object({
  version: z.string(),
  project: z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    repository: z.string().optional(),
  }),
  vision: z
    .object({
      purpose: z.string().optional(),
      target_users: z.array(z.string()).optional(),
      success_metrics: z.array(z.string()).optional(),
    })
    .optional(),
  stacks: z.union([z.record(z.unknown()), z.array(z.unknown())]).optional(),
  design_system: z
    .object({
      enabled: z.boolean().optional(),
      path: z.string().optional(),
      docs: z.array(z.string()).optional(),
    })
    .optional(),
  data_governance: z
    .object({
      auth_provider: z.string().optional(),
      rls_patterns: z
        .object({
          description: z.string().optional(),
          examples: z.array(z.string()).optional(),
        })
        .optional(),
      naming_conventions: z
        .object({
          dates: z.string().optional(),
          enums: z.string().optional(),
          fields: z.string().optional(),
          files: z.string().optional(),
          directories: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
  agents: z
    .object({
      custom: z
        .array(
          z.object({
            name: z.string(),
            label: z.string(),
            prompt_file: z.string(),
          })
        )
        .optional(),
    })
    .optional(),
  workflow: z
    .object({
      tdd_enabled: z.boolean().optional(),
    })
    .optional(),
})

// =============================================================================
// API Functions
// =============================================================================

/**
 * Read and parse project.yaml from the renderer process via IPC
 */
export async function readProjectYaml(projectPath: string): Promise<ReadProjectYamlResult> {
  try {
    const result = await window.electron.project.readConfig(projectPath)
    return {
      config: result.config ?? null,
      error: result.error,
    }
  } catch (error) {
    return {
      config: null,
      error: `IPC connection failed: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

/**
 * Transform project.yaml config to wizard form data format
 */
export function transformConfigToWizardData(config: ProjectYamlConfig | null): WizardFormData {
  if (!config) {
    return {
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
  }

  // Extract stack information
  let stackType: WizardFormData['stackType'] = ''
  let framework = ''
  let language = ''

  if (config.stacks && typeof config.stacks === 'object' && !Array.isArray(config.stacks)) {
    const stackKeys = Object.keys(config.stacks)
    if (stackKeys.length > 0) {
      const firstKey = stackKeys[0]
      if (['frontend', 'backend', 'fullstack', 'database'].includes(firstKey)) {
        stackType = firstKey as WizardFormData['stackType']
        const stackConfig = (config.stacks as Record<string, Record<string, unknown>>)[firstKey]
        if (stackConfig && typeof stackConfig === 'object') {
          framework = (stackConfig.framework as string) ?? ''
          language = (stackConfig.language as string) ?? ''
        }
      }
    }
  }

  // Check for enabled features
  const enableDesignSystem = config.design_system?.enabled === true
  const enableDataGovernance = !!config.data_governance?.auth_provider
  const enableAgents = !!(config.agents?.custom && config.agents.custom.length > 0)

  return {
    name: config.project?.name ?? '',
    description: config.project?.description ?? '',
    repository: config.project?.repository ?? '',
    visionPurpose: config.vision?.purpose ?? '',
    targetUsers: config.vision?.target_users ?? [],
    successMetrics: config.vision?.success_metrics ?? [],
    stackType,
    framework,
    language,
    enableDesignSystem,
    enableDataGovernance,
    enableAgents,
    designSystemPath: config.design_system?.path,
    authProvider: config.data_governance?.auth_provider,
  }
}

/**
 * Transform wizard form data to project.yaml config format
 */
export function transformWizardDataToConfig(data: WizardFormData): ProjectYamlConfig {
  const config: ProjectYamlConfig = {
    version: '1.0',
    project: {
      name: data.name,
      description: data.description || undefined,
      repository: data.repository || undefined,
    },
  }

  // Add vision section if any fields are filled
  if (data.visionPurpose || data.targetUsers.length > 0 || data.successMetrics.length > 0) {
    config.vision = {
      purpose: data.visionPurpose || undefined,
      target_users: data.targetUsers.length > 0 ? data.targetUsers : undefined,
      success_metrics: data.successMetrics.length > 0 ? data.successMetrics : undefined,
    }
  }

  // Add stacks section if stack type is selected
  if (data.stackType) {
    const stackConfig: Record<string, unknown> = {}
    if (data.framework) stackConfig.framework = data.framework
    if (data.language) stackConfig.language = data.language
    config.stacks = {
      [data.stackType]: stackConfig,
    }
  }

  // Add design_system section if enabled
  if (data.enableDesignSystem) {
    config.design_system = {
      enabled: true,
      path: data.designSystemPath || '.design/',
    }
  }

  // Add data_governance section if enabled
  if (data.enableDataGovernance) {
    config.data_governance = {
      auth_provider: data.authProvider,
    }
  }

  return config
}

/**
 * Get validation errors from a Zod error object
 */
export function getValidationErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {}

  for (const issue of error.issues) {
    const path = issue.path.join('.')
    if (path && !errors[path]) {
      errors[path] = issue.message
    }
  }

  return errors
}

/**
 * Validate a specific wizard step
 */
export function validateWizardStep(step: number, data: unknown): ValidationResult {
  let schema: z.ZodSchema

  switch (step) {
    case 0:
      schema = BasicInfoSchema
      break
    case 1:
      schema = ConstitutionSchema
      break
    case 2:
      schema = StackSelectionSchema
      break
    case 3:
      schema = OptionalSectionsSchema
      break
    default:
      throw new Error(`Invalid step number: ${step}`)
  }

  const result = schema.safeParse(data)

  if (result.success) {
    return { valid: true, errors: {} }
  }

  return {
    valid: false,
    errors: getValidationErrors(result.error),
  }
}
