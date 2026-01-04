/**
 * projectYamlReader Tests - TDD RED Phase
 *
 * Tests for the projectYamlReader module which provides:
 * - Reading and parsing project.yaml from the renderer process (via IPC)
 * - Zod validation schemas for wizard form data
 * - Pre-fill logic for populating wizard state from existing config
 *
 * NOTE: These tests are expected to FAIL initially since the module doesn't exist yet.
 * This is the TDD RED phase.
 *
 * Expected file: src/renderer/lib/projectYamlReader.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { z } from 'zod'

// =============================================================================
// Import the module that doesn't exist yet - will cause import error until implemented
// =============================================================================

import {
  readProjectYaml,
  ProjectYamlSchema,
  WizardFormSchema,
  BasicInfoSchema,
  ConstitutionSchema,
  StackSelectionSchema,
  OptionalSectionsSchema,
  transformConfigToWizardData,
  transformWizardDataToConfig,
  validateWizardStep,
  getValidationErrors,
} from '@renderer/lib/projectYamlReader'

// =============================================================================
// Type Definitions for Expected API
// =============================================================================

/** Configuration structure as stored in project.yaml */
interface ProjectYamlConfig {
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
interface WizardFormData {
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
interface ReadProjectYamlResult {
  config: ProjectYamlConfig | null
  error?: string
}

// =============================================================================
// Mock Setup for window.electron IPC calls
// =============================================================================

const mockReadConfig = vi.fn()

vi.stubGlobal('window', {
  electron: {
    project: {
      readConfig: mockReadConfig,
    },
  },
})

// =============================================================================
// Test Fixtures
// =============================================================================

const VALID_PROJECT_CONFIG: ProjectYamlConfig = {
  version: '1.0',
  project: {
    name: 'test-project',
    description: 'A test project for unit tests',
    repository: 'https://github.com/test/project',
  },
  vision: {
    purpose: 'Testing project yaml reader',
    target_users: ['Developers', 'QA Engineers'],
    success_metrics: ['All tests pass', '100% coverage'],
  },
  stacks: {
    frontend: {
      framework: 'React',
      language: 'TypeScript',
    },
  },
  design_system: {
    enabled: true,
    path: '.design/',
    docs: ['.design/Colors.md'],
  },
  data_governance: {
    auth_provider: 'supabase',
    naming_conventions: {
      dates: 'created_at',
      enums: 'SCREAMING_SNAKE',
      fields: 'snake_case',
      files: 'kebab-case',
      directories: 'kebab-case',
    },
  },
  agents: {
    custom: [
      {
        name: 'test-agent',
        label: 'agent:test',
        prompt_file: '.claude/agents/test-agent.md',
      },
    ],
  },
  workflow: {
    tdd_enabled: true,
  },
}

const MINIMAL_CONFIG: ProjectYamlConfig = {
  version: '1.0',
  project: {
    name: 'minimal-project',
  },
}

const EXPECTED_WIZARD_DATA: WizardFormData = {
  name: 'test-project',
  description: 'A test project for unit tests',
  repository: 'https://github.com/test/project',
  visionPurpose: 'Testing project yaml reader',
  targetUsers: ['Developers', 'QA Engineers'],
  successMetrics: ['All tests pass', '100% coverage'],
  stackType: 'frontend',
  framework: 'React',
  language: 'TypeScript',
  enableDesignSystem: true,
  enableDataGovernance: true,
  enableAgents: true,
  designSystemPath: '.design/',
  authProvider: 'supabase',
}

const EMPTY_WIZARD_DATA: WizardFormData = {
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

// =============================================================================
// Tests
// =============================================================================

describe('projectYamlReader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ===========================================================================
  // Module Existence Tests
  // ===========================================================================

  describe('Module Existence', () => {
    it('should have projectYamlReader module at src/renderer/lib/projectYamlReader.ts', () => {
      // RED PHASE: This will fail because the module doesn't exist
      expect(readProjectYaml).toBeDefined()
      expect(typeof readProjectYaml).toBe('function')
    })

    it('should export ProjectYamlSchema', () => {
      expect(ProjectYamlSchema).toBeDefined()
      expect(ProjectYamlSchema instanceof z.ZodSchema).toBe(true)
    })

    it('should export WizardFormSchema', () => {
      expect(WizardFormSchema).toBeDefined()
      expect(WizardFormSchema instanceof z.ZodSchema).toBe(true)
    })

    it('should export BasicInfoSchema', () => {
      expect(BasicInfoSchema).toBeDefined()
      expect(BasicInfoSchema instanceof z.ZodSchema).toBe(true)
    })

    it('should export ConstitutionSchema', () => {
      expect(ConstitutionSchema).toBeDefined()
      expect(ConstitutionSchema instanceof z.ZodSchema).toBe(true)
    })

    it('should export StackSelectionSchema', () => {
      expect(StackSelectionSchema).toBeDefined()
      expect(StackSelectionSchema instanceof z.ZodSchema).toBe(true)
    })

    it('should export OptionalSectionsSchema', () => {
      expect(OptionalSectionsSchema).toBeDefined()
      expect(OptionalSectionsSchema instanceof z.ZodSchema).toBe(true)
    })

    it('should export transformConfigToWizardData function', () => {
      expect(transformConfigToWizardData).toBeDefined()
      expect(typeof transformConfigToWizardData).toBe('function')
    })

    it('should export transformWizardDataToConfig function', () => {
      expect(transformWizardDataToConfig).toBeDefined()
      expect(typeof transformWizardDataToConfig).toBe('function')
    })

    it('should export validateWizardStep function', () => {
      expect(validateWizardStep).toBeDefined()
      expect(typeof validateWizardStep).toBe('function')
    })

    it('should export getValidationErrors function', () => {
      expect(getValidationErrors).toBeDefined()
      expect(typeof getValidationErrors).toBe('function')
    })
  })

  // ===========================================================================
  // readProjectYaml Tests
  // ===========================================================================

  describe('readProjectYaml', () => {
    describe('when project.yaml exists', () => {
      it('should load existing project.yaml and parse fields', async () => {
        mockReadConfig.mockResolvedValue({ config: VALID_PROJECT_CONFIG })

        const result = await readProjectYaml('/test/path')

        expect(result.config).not.toBeNull()
        expect(result.config?.project.name).toBe('test-project')
        expect(result.config?.project.description).toBe('A test project for unit tests')
        expect(result.error).toBeUndefined()
      })

      it('should parse vision section correctly', async () => {
        mockReadConfig.mockResolvedValue({ config: VALID_PROJECT_CONFIG })

        const result = await readProjectYaml('/test/path')

        expect(result.config?.vision?.purpose).toBe('Testing project yaml reader')
        expect(result.config?.vision?.target_users).toContain('Developers')
        expect(result.config?.vision?.success_metrics).toContain('All tests pass')
      })

      it('should parse stacks section correctly', async () => {
        mockReadConfig.mockResolvedValue({ config: VALID_PROJECT_CONFIG })

        const result = await readProjectYaml('/test/path')

        expect(result.config?.stacks).toBeDefined()
      })

      it('should parse design_system section correctly', async () => {
        mockReadConfig.mockResolvedValue({ config: VALID_PROJECT_CONFIG })

        const result = await readProjectYaml('/test/path')

        expect(result.config?.design_system?.enabled).toBe(true)
        expect(result.config?.design_system?.path).toBe('.design/')
      })

      it('should parse data_governance section correctly', async () => {
        mockReadConfig.mockResolvedValue({ config: VALID_PROJECT_CONFIG })

        const result = await readProjectYaml('/test/path')

        expect(result.config?.data_governance?.auth_provider).toBe('supabase')
        expect(result.config?.data_governance?.naming_conventions?.enums).toBe('SCREAMING_SNAKE')
      })

      it('should pass projectPath to IPC call', async () => {
        mockReadConfig.mockResolvedValue({ config: VALID_PROJECT_CONFIG })

        await readProjectYaml('/my/project/path')

        expect(mockReadConfig).toHaveBeenCalledWith('/my/project/path')
      })
    })

    describe('when project.yaml does not exist', () => {
      it('should return null config when file does not exist', async () => {
        mockReadConfig.mockResolvedValue({ config: null })

        const result = await readProjectYaml('/nonexistent/path')

        expect(result.config).toBeNull()
        expect(result.error).toBeUndefined()
      })
    })

    describe('error handling', () => {
      it('should handle malformed project.yaml gracefully', async () => {
        mockReadConfig.mockResolvedValue({
          config: null,
          error: 'YAML parse error: invalid syntax',
        })

        const result = await readProjectYaml('/test/path')

        expect(result.config).toBeNull()
        expect(result.error).toBeDefined()
        expect(result.error).toContain('YAML')
      })

      it('should handle IPC errors gracefully', async () => {
        mockReadConfig.mockRejectedValue(new Error('IPC connection failed'))

        const result = await readProjectYaml('/test/path')

        expect(result.config).toBeNull()
        expect(result.error).toBeDefined()
        expect(result.error).toContain('IPC')
      })

      it('should handle missing version field', async () => {
        mockReadConfig.mockResolvedValue({
          config: null,
          error: 'Missing or invalid version field',
        })

        const result = await readProjectYaml('/test/path')

        expect(result.config).toBeNull()
        expect(result.error).toContain('version')
      })
    })
  })

  // ===========================================================================
  // Zod Validation Schema Tests
  // ===========================================================================

  describe('Zod Validation Schemas', () => {
    describe('BasicInfoSchema', () => {
      it('should validate project name (required)', () => {
        const validData = { name: 'my-project', description: '', repository: '' }
        const result = BasicInfoSchema.safeParse(validData)

        expect(result.success).toBe(true)
      })

      it('should reject empty project name', () => {
        const invalidData = { name: '', description: '', repository: '' }
        const result = BasicInfoSchema.safeParse(invalidData)

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues.some((i) => i.path.includes('name'))).toBe(true)
        }
      })

      it('should validate minimum name length (at least 1 character)', () => {
        const validData = { name: 'a', description: '', repository: '' }
        const result = BasicInfoSchema.safeParse(validData)

        expect(result.success).toBe(true)
      })

      it('should reject name that does not start with a letter', () => {
        const invalidData = { name: '123-project', description: '', repository: '' }
        const result = BasicInfoSchema.safeParse(invalidData)

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues.some((i) => i.path.includes('name'))).toBe(true)
        }
      })

      it('should validate description (optional)', () => {
        const validData = { name: 'project', description: '', repository: '' }
        const result = BasicInfoSchema.safeParse(validData)

        expect(result.success).toBe(true)
      })

      it('should validate description max length (500 characters)', () => {
        const invalidData = { name: 'project', description: 'a'.repeat(501), repository: '' }
        const result = BasicInfoSchema.safeParse(invalidData)

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues.some((i) => i.path.includes('description'))).toBe(true)
        }
      })

      it('should accept valid repository URL', () => {
        const validData = {
          name: 'project',
          description: '',
          repository: 'https://github.com/user/repo',
        }
        const result = BasicInfoSchema.safeParse(validData)

        expect(result.success).toBe(true)
      })

      it('should accept empty repository (optional)', () => {
        const validData = { name: 'project', description: '', repository: '' }
        const result = BasicInfoSchema.safeParse(validData)

        expect(result.success).toBe(true)
      })

      it('should reject invalid repository URL format', () => {
        const invalidData = { name: 'project', description: '', repository: 'not-a-url' }
        const result = BasicInfoSchema.safeParse(invalidData)

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues.some((i) => i.path.includes('repository'))).toBe(true)
        }
      })

      it('should provide custom error message for name', () => {
        const invalidData = { name: '', description: '', repository: '' }
        const result = BasicInfoSchema.safeParse(invalidData)

        expect(result.success).toBe(false)
        if (!result.success) {
          const nameError = result.error.issues.find((i) => i.path.includes('name'))
          expect(nameError?.message).toMatch(/project name|required|name is required/i)
        }
      })
    })

    describe('ConstitutionSchema', () => {
      it('should validate vision purpose (optional)', () => {
        const validData = { visionPurpose: '', targetUsers: [], successMetrics: [] }
        const result = ConstitutionSchema.safeParse(validData)

        expect(result.success).toBe(true)
      })

      it('should validate targetUsers as array of strings', () => {
        const validData = {
          visionPurpose: '',
          targetUsers: ['Developers', 'Product Managers'],
          successMetrics: [],
        }
        const result = ConstitutionSchema.safeParse(validData)

        expect(result.success).toBe(true)
      })

      it('should validate successMetrics as array of strings', () => {
        const validData = {
          visionPurpose: '',
          targetUsers: [],
          successMetrics: ['100 users', '< 2s load time'],
        }
        const result = ConstitutionSchema.safeParse(validData)

        expect(result.success).toBe(true)
      })

      it('should accept empty arrays for targetUsers and successMetrics', () => {
        const validData = { visionPurpose: '', targetUsers: [], successMetrics: [] }
        const result = ConstitutionSchema.safeParse(validData)

        expect(result.success).toBe(true)
      })

      it('should validate vision purpose max length', () => {
        const invalidData = {
          visionPurpose: 'a'.repeat(1001), // Assuming max 1000 chars
          targetUsers: [],
          successMetrics: [],
        }
        const result = ConstitutionSchema.safeParse(invalidData)

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues.some((i) => i.path.includes('visionPurpose'))).toBe(true)
        }
      })
    })

    describe('StackSelectionSchema', () => {
      it('should validate stackType enum values', () => {
        const validTypes = ['frontend', 'backend', 'fullstack', 'database', '']

        for (const stackType of validTypes) {
          const validData = { stackType, framework: '', language: '' }
          const result = StackSelectionSchema.safeParse(validData)
          expect(result.success).toBe(true)
        }
      })

      it('should reject invalid stackType values', () => {
        const invalidData = { stackType: 'invalid-type', framework: '', language: '' }
        const result = StackSelectionSchema.safeParse(invalidData)

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues.some((i) => i.path.includes('stackType'))).toBe(true)
        }
      })

      it('should validate framework (optional string)', () => {
        const validData = { stackType: 'frontend', framework: 'React', language: '' }
        const result = StackSelectionSchema.safeParse(validData)

        expect(result.success).toBe(true)
      })

      it('should validate language (optional string)', () => {
        const validData = { stackType: 'frontend', framework: '', language: 'TypeScript' }
        const result = StackSelectionSchema.safeParse(validData)

        expect(result.success).toBe(true)
      })

      it('should provide custom error message for invalid stackType', () => {
        const invalidData = { stackType: 'mobile', framework: '', language: '' }
        const result = StackSelectionSchema.safeParse(invalidData)

        expect(result.success).toBe(false)
        if (!result.success) {
          const stackError = result.error.issues.find((i) => i.path.includes('stackType'))
          expect(stackError?.message).toMatch(
            /invalid|valid|frontend|backend|fullstack|database/i
          )
        }
      }
      )
    })

    describe('OptionalSectionsSchema', () => {
      it('should validate boolean checkboxes', () => {
        const validData = {
          enableDesignSystem: true,
          enableDataGovernance: false,
          enableAgents: true,
        }
        const result = OptionalSectionsSchema.safeParse(validData)

        expect(result.success).toBe(true)
      })

      it('should default booleans to false when not provided', () => {
        const validData = {}
        const result = OptionalSectionsSchema.safeParse(validData)

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.enableDesignSystem).toBe(false)
          expect(result.data.enableDataGovernance).toBe(false)
          expect(result.data.enableAgents).toBe(false)
        }
      })

      it('should validate designSystemPath (optional string)', () => {
        const validData = {
          enableDesignSystem: true,
          enableDataGovernance: false,
          enableAgents: false,
          designSystemPath: '.design/',
        }
        const result = OptionalSectionsSchema.safeParse(validData)

        expect(result.success).toBe(true)
      })

      it('should validate authProvider (optional string)', () => {
        const validData = {
          enableDesignSystem: false,
          enableDataGovernance: true,
          enableAgents: false,
          authProvider: 'supabase',
        }
        const result = OptionalSectionsSchema.safeParse(validData)

        expect(result.success).toBe(true)
      })
    })

    describe('WizardFormSchema (complete)', () => {
      it('should validate complete valid wizard data', () => {
        const result = WizardFormSchema.safeParse(EXPECTED_WIZARD_DATA)

        expect(result.success).toBe(true)
      })

      it('should reject invalid wizard data with multiple errors', () => {
        const invalidData = {
          name: '', // Invalid: empty
          description: 'a'.repeat(501), // Invalid: too long
          repository: 'not-a-url', // Invalid: bad format
          visionPurpose: '',
          targetUsers: [],
          successMetrics: [],
          stackType: 'invalid', // Invalid: not in enum
          framework: '',
          language: '',
          enableDesignSystem: false,
          enableDataGovernance: false,
          enableAgents: false,
        }

        const result = WizardFormSchema.safeParse(invalidData)

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues.length).toBeGreaterThanOrEqual(3)
        }
      })
    })

    describe('ProjectYamlSchema', () => {
      it('should validate complete project.yaml structure', () => {
        const result = ProjectYamlSchema.safeParse(VALID_PROJECT_CONFIG)

        expect(result.success).toBe(true)
      })

      it('should validate minimal project.yaml', () => {
        const result = ProjectYamlSchema.safeParse(MINIMAL_CONFIG)

        expect(result.success).toBe(true)
      })

      it('should require version field', () => {
        const invalidConfig = { project: { name: 'test' } }
        const result = ProjectYamlSchema.safeParse(invalidConfig)

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues.some((i) => i.path.includes('version'))).toBe(true)
        }
      })

      it('should require project.name field', () => {
        const invalidConfig = { version: '1.0', project: {} }
        const result = ProjectYamlSchema.safeParse(invalidConfig)

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues.some((i) => i.path.join('.').includes('name'))).toBe(true)
        }
      })
    })
  })

  // ===========================================================================
  // Transform Functions Tests
  // ===========================================================================

  describe('transformConfigToWizardData', () => {
    it('should transform full config to wizard form data', () => {
      const result = transformConfigToWizardData(VALID_PROJECT_CONFIG)

      expect(result.name).toBe('test-project')
      expect(result.description).toBe('A test project for unit tests')
      expect(result.repository).toBe('https://github.com/test/project')
      expect(result.visionPurpose).toBe('Testing project yaml reader')
      expect(result.targetUsers).toEqual(['Developers', 'QA Engineers'])
      expect(result.successMetrics).toEqual(['All tests pass', '100% coverage'])
    })

    it('should extract stack type from stacks config', () => {
      const result = transformConfigToWizardData(VALID_PROJECT_CONFIG)

      expect(result.stackType).toBe('frontend')
      expect(result.framework).toBe('React')
      expect(result.language).toBe('TypeScript')
    })

    it('should set enableDesignSystem based on config', () => {
      const result = transformConfigToWizardData(VALID_PROJECT_CONFIG)

      expect(result.enableDesignSystem).toBe(true)
      expect(result.designSystemPath).toBe('.design/')
    })

    it('should set enableDataGovernance based on config', () => {
      const result = transformConfigToWizardData(VALID_PROJECT_CONFIG)

      expect(result.enableDataGovernance).toBe(true)
      expect(result.authProvider).toBe('supabase')
    })

    it('should set enableAgents based on custom agents presence', () => {
      const result = transformConfigToWizardData(VALID_PROJECT_CONFIG)

      expect(result.enableAgents).toBe(true)
    })

    it('should handle minimal config with defaults', () => {
      const result = transformConfigToWizardData(MINIMAL_CONFIG)

      expect(result.name).toBe('minimal-project')
      expect(result.description).toBe('')
      expect(result.repository).toBe('')
      expect(result.visionPurpose).toBe('')
      expect(result.targetUsers).toEqual([])
      expect(result.successMetrics).toEqual([])
      expect(result.stackType).toBe('')
      expect(result.framework).toBe('')
      expect(result.language).toBe('')
      expect(result.enableDesignSystem).toBe(false)
      expect(result.enableDataGovernance).toBe(false)
      expect(result.enableAgents).toBe(false)
    })

    it('should handle null config by returning empty wizard data', () => {
      const result = transformConfigToWizardData(null as unknown as ProjectYamlConfig)

      expect(result.name).toBe('')
      expect(result.description).toBe('')
    })

    it('should handle partial vision section', () => {
      const partialConfig: ProjectYamlConfig = {
        version: '1.0',
        project: { name: 'test' },
        vision: { purpose: 'Only purpose' },
      }

      const result = transformConfigToWizardData(partialConfig)

      expect(result.visionPurpose).toBe('Only purpose')
      expect(result.targetUsers).toEqual([])
      expect(result.successMetrics).toEqual([])
    })
  })

  describe('transformWizardDataToConfig', () => {
    it('should transform wizard data back to config format', () => {
      const result = transformWizardDataToConfig(EXPECTED_WIZARD_DATA)

      expect(result.version).toBe('1.0')
      expect(result.project.name).toBe('test-project')
      expect(result.project.description).toBe('A test project for unit tests')
      expect(result.project.repository).toBe('https://github.com/test/project')
    })

    it('should create vision section from wizard data', () => {
      const result = transformWizardDataToConfig(EXPECTED_WIZARD_DATA)

      expect(result.vision?.purpose).toBe('Testing project yaml reader')
      expect(result.vision?.target_users).toEqual(['Developers', 'QA Engineers'])
      expect(result.vision?.success_metrics).toEqual(['All tests pass', '100% coverage'])
    })

    it('should create stacks section from wizard data', () => {
      const result = transformWizardDataToConfig(EXPECTED_WIZARD_DATA)

      expect(result.stacks).toBeDefined()
      // Should have frontend key with framework and language
      expect((result.stacks as Record<string, unknown>).frontend).toBeDefined()
    })

    it('should create design_system section when enabled', () => {
      const result = transformWizardDataToConfig(EXPECTED_WIZARD_DATA)

      expect(result.design_system?.enabled).toBe(true)
      expect(result.design_system?.path).toBe('.design/')
    })

    it('should not include design_system when disabled', () => {
      const dataWithoutDesign = { ...EXPECTED_WIZARD_DATA, enableDesignSystem: false }
      const result = transformWizardDataToConfig(dataWithoutDesign)

      expect(result.design_system?.enabled).toBeFalsy()
    })

    it('should create data_governance section when enabled', () => {
      const result = transformWizardDataToConfig(EXPECTED_WIZARD_DATA)

      expect(result.data_governance?.auth_provider).toBe('supabase')
    })

    it('should not include data_governance when disabled', () => {
      const dataWithoutGov = { ...EXPECTED_WIZARD_DATA, enableDataGovernance: false }
      const result = transformWizardDataToConfig(dataWithoutGov)

      expect(result.data_governance?.auth_provider).toBeFalsy()
    })

    it('should handle minimal wizard data', () => {
      const minimalData: WizardFormData = {
        name: 'minimal',
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

      const result = transformWizardDataToConfig(minimalData)

      expect(result.version).toBe('1.0')
      expect(result.project.name).toBe('minimal')
    })
  })

  // ===========================================================================
  // Validation Helper Functions Tests
  // ===========================================================================

  describe('validateWizardStep', () => {
    it('should validate step 0 (Basic Info) correctly', () => {
      const validData = { name: 'project', description: '', repository: '' }
      const result = validateWizardStep(0, validData)

      expect(result.valid).toBe(true)
      expect(result.errors).toEqual({})
    })

    it('should return errors for invalid step 0', () => {
      const invalidData = { name: '', description: '', repository: 'bad-url' }
      const result = validateWizardStep(0, invalidData)

      expect(result.valid).toBe(false)
      expect(result.errors.name).toBeDefined()
      expect(result.errors.repository).toBeDefined()
    })

    it('should validate step 1 (Constitution) correctly', () => {
      const validData = { visionPurpose: '', targetUsers: [], successMetrics: [] }
      const result = validateWizardStep(1, validData)

      expect(result.valid).toBe(true)
      expect(result.errors).toEqual({})
    })

    it('should validate step 2 (Stack Selection) correctly', () => {
      const validData = { stackType: 'frontend', framework: 'React', language: 'TypeScript' }
      const result = validateWizardStep(2, validData)

      expect(result.valid).toBe(true)
      expect(result.errors).toEqual({})
    })

    it('should return errors for invalid step 2', () => {
      const invalidData = { stackType: 'invalid', framework: '', language: '' }
      const result = validateWizardStep(2, invalidData)

      expect(result.valid).toBe(false)
      expect(result.errors.stackType).toBeDefined()
    })

    it('should validate step 3 (Optional Sections) correctly', () => {
      const validData = {
        enableDesignSystem: true,
        enableDataGovernance: false,
        enableAgents: false,
      }
      const result = validateWizardStep(3, validData)

      expect(result.valid).toBe(true)
      expect(result.errors).toEqual({})
    })

    it('should throw error for invalid step number', () => {
      expect(() => validateWizardStep(99, {})).toThrow()
    })
  })

  describe('getValidationErrors', () => {
    it('should extract field errors from Zod error', () => {
      const result = BasicInfoSchema.safeParse({
        name: '',
        description: 'a'.repeat(501),
        repository: 'bad',
      })

      if (!result.success) {
        const errors = getValidationErrors(result.error)

        expect(errors.name).toBeDefined()
        expect(errors.description).toBeDefined()
        expect(errors.repository).toBeDefined()
      }
    })

    it('should return empty object for valid data', () => {
      const result = BasicInfoSchema.safeParse({
        name: 'valid',
        description: '',
        repository: '',
      })

      if (result.success) {
        // No error to process
        expect(true).toBe(true)
      } else {
        const errors = getValidationErrors(result.error)
        expect(Object.keys(errors).length).toBe(0)
      }
    })

    it('should handle nested field paths', () => {
      // Test with a schema that has nested fields
      const result = WizardFormSchema.safeParse({
        name: '',
        description: '',
        repository: '',
        visionPurpose: '',
        targetUsers: [],
        successMetrics: [],
        stackType: 'invalid',
        framework: '',
        language: '',
        enableDesignSystem: false,
        enableDataGovernance: false,
        enableAgents: false,
      })

      if (!result.success) {
        const errors = getValidationErrors(result.error)

        expect(typeof errors).toBe('object')
        // Should have at least name and stackType errors
        expect(Object.keys(errors).length).toBeGreaterThan(0)
      }
    })

    it('should provide user-friendly error messages', () => {
      const result = BasicInfoSchema.safeParse({
        name: '123-invalid',
        description: '',
        repository: '',
      })

      if (!result.success) {
        const errors = getValidationErrors(result.error)

        // Error message should be readable, not technical jargon
        expect(errors.name).toMatch(/[A-Z]/) // Should be a sentence, starting with capital
        expect(errors.name.length).toBeGreaterThan(5) // Should be descriptive
      }
    }
    )
  })

  // ===========================================================================
  // Pre-fill Logic Tests
  // ===========================================================================

  describe('Pre-fill Logic', () => {
    it('should populate wizard state from existing config', async () => {
      mockReadConfig.mockResolvedValue({ config: VALID_PROJECT_CONFIG })

      const readResult = await readProjectYaml('/test/path')
      const wizardData = transformConfigToWizardData(readResult.config!)

      expect(wizardData.name).toBe('test-project')
      expect(wizardData.visionPurpose).toBe('Testing project yaml reader')
      expect(wizardData.enableDesignSystem).toBe(true)
    })

    it('should handle partial configs (missing optional fields)', async () => {
      const partialConfig: ProjectYamlConfig = {
        version: '1.0',
        project: {
          name: 'partial-project',
          description: 'Only basic fields',
        },
        // No vision, stacks, design_system, etc.
      }

      mockReadConfig.mockResolvedValue({ config: partialConfig })

      const readResult = await readProjectYaml('/test/path')
      const wizardData = transformConfigToWizardData(readResult.config!)

      expect(wizardData.name).toBe('partial-project')
      expect(wizardData.description).toBe('Only basic fields')
      expect(wizardData.visionPurpose).toBe('')
      expect(wizardData.targetUsers).toEqual([])
      expect(wizardData.stackType).toBe('')
      expect(wizardData.enableDesignSystem).toBe(false)
    })

    it('should show validation errors for invalid pre-filled config', async () => {
      // Config with invalid data that would fail wizard validation
      const invalidConfig: ProjectYamlConfig = {
        version: '1.0',
        project: {
          name: '123-invalid-name', // Invalid: starts with number
          description: 'a'.repeat(501), // Too long
        },
      }

      mockReadConfig.mockResolvedValue({ config: invalidConfig })

      const readResult = await readProjectYaml('/test/path')
      const wizardData = transformConfigToWizardData(readResult.config!)
      const validation = validateWizardStep(0, wizardData)

      expect(validation.valid).toBe(false)
      expect(validation.errors.name).toBeDefined()
      expect(validation.errors.description).toBeDefined()
    })

    it('should preserve empty arrays instead of undefined', async () => {
      const configWithEmptyArrays: ProjectYamlConfig = {
        version: '1.0',
        project: { name: 'test' },
        vision: {
          purpose: 'test',
          target_users: [],
          success_metrics: [],
        },
      }

      mockReadConfig.mockResolvedValue({ config: configWithEmptyArrays })

      const readResult = await readProjectYaml('/test/path')
      const wizardData = transformConfigToWizardData(readResult.config!)

      expect(Array.isArray(wizardData.targetUsers)).toBe(true)
      expect(Array.isArray(wizardData.successMetrics)).toBe(true)
      expect(wizardData.targetUsers.length).toBe(0)
      expect(wizardData.successMetrics.length).toBe(0)
    })
  })
})
