/**
 * CSS Variables Test - TDD RED Phase
 *
 * Tests for light mode CSS variables validation in globals.css
 *
 * Test Requirements:
 * - :root selector has all required color variables
 * - Light theme colors are visually distinct from dark theme
 * - CSS builds without errors
 *
 * NOTE: These tests are expected to FAIL because the CSS variables
 * may not be complete or properly configured. This is the TDD RED phase.
 *
 * When the CSS is properly configured, these tests will guide validation to ensure:
 * 1. All required CSS custom properties exist
 * 2. Light mode has appropriate color values
 * 3. Light and dark themes are visually distinct
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// ============================================================================
// CSS Parser Helper
// ============================================================================

/**
 * Parses CSS content and extracts CSS custom properties from a selector
 */
interface CSSVariable {
  name: string
  value: string
}

interface CSSBlock {
  selector: string
  variables: CSSVariable[]
}

function parseCSSVariables(cssContent: string): CSSBlock[] {
  const blocks: CSSBlock[] = []

  // First, remove @layer wrappers to simplify parsing
  // @layer base { ... } -> just get the inner content
  let processedContent = cssContent.replace(/@layer\s+[\w-]+\s*\{/g, '')

  // Match CSS blocks with selectors and their contents
  // This regex handles both :root and .dark selectors
  // We need to handle nested braces properly
  const lines = processedContent.split('\n')
  let currentSelector = ''
  let currentContent = ''
  let braceDepth = 0
  let inBlock = false

  for (const line of lines) {
    const trimmed = line.trim()

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*')) {
      continue
    }

    // Check if this line starts a new selector
    if (trimmed.match(/^([.:#\w\s-]+)\s*\{/) && braceDepth === 0) {
      const match = trimmed.match(/^([.:#\w\s-]+)\s*\{/)
      if (match) {
        currentSelector = match[1].trim()
        currentContent = ''
        braceDepth = 1
        inBlock = true

        // Check if there's content on the same line
        const afterBrace = trimmed.substring(match[0].length)
        if (afterBrace) {
          currentContent += afterBrace + '\n'
        }
        continue
      }
    }

    if (inBlock) {
      // Count braces in this line
      const openBraces = (line.match(/{/g) || []).length
      const closeBraces = (line.match(/}/g) || []).length

      braceDepth += openBraces - closeBraces

      if (braceDepth > 0) {
        currentContent += line + '\n'
      } else {
        // Block ended
        // Extract CSS custom properties from currentContent
        const variables: CSSVariable[] = []
        const varRegex = /--([\w-]+):\s*([^;]+);/g
        let varMatch

        while ((varMatch = varRegex.exec(currentContent)) !== null) {
          variables.push({
            name: `--${varMatch[1]}`,
            value: varMatch[2].trim(),
          })
        }

        if (variables.length > 0) {
          blocks.push({ selector: currentSelector, variables })
        }

        currentSelector = ''
        currentContent = ''
        inBlock = false
      }
    }
  }

  return blocks
}

function getCSSBlock(blocks: CSSBlock[], selector: string): CSSBlock | undefined {
  return blocks.find((block) => block.selector === selector)
}

function getVariable(block: CSSBlock | undefined, name: string): string | undefined {
  if (!block) return undefined
  const variable = block.variables.find((v) => v.name === name)
  return variable?.value
}

// ============================================================================
// Test Setup
// ============================================================================

let cssContent: string
let cssBlocks: CSSBlock[]

beforeAll(() => {
  // Read the globals.css file
  const cssPath = resolve(__dirname, '../globals.css')

  try {
    cssContent = readFileSync(cssPath, 'utf-8')
    cssBlocks = parseCSSVariables(cssContent)
  } catch (error) {
    throw new Error(`Failed to read CSS file at ${cssPath}: ${error}`)
  }
})

// ============================================================================
// Required CSS Variables
// ============================================================================

const REQUIRED_COLOR_VARIABLES = [
  '--background',
  '--foreground',
  '--card',
  '--card-foreground',
  '--popover',
  '--popover-foreground',
  '--primary',
  '--primary-foreground',
  '--secondary',
  '--secondary-foreground',
  '--muted',
  '--muted-foreground',
  '--accent',
  '--accent-foreground',
  '--destructive',
  '--destructive-foreground',
  '--border',
  '--input',
  '--ring',
] as const

const REQUIRED_CHART_VARIABLES = [
  '--chart-1',
  '--chart-2',
  '--chart-3',
  '--chart-4',
  '--chart-5',
] as const

const REQUIRED_LAYOUT_VARIABLES = [
  '--radius',
] as const

// ============================================================================
// Tests
// ============================================================================

describe('CSS Variables - Light Mode', () => {
  describe('CSS File Structure', () => {
    it('should successfully read and parse globals.css', () => {
      expect(cssContent).toBeDefined()
      expect(cssContent.length).toBeGreaterThan(0)
    })

    it('should parse CSS blocks from file', () => {
      expect(cssBlocks).toBeDefined()
      expect(cssBlocks.length).toBeGreaterThan(0)
    })

    it('should have :root selector with CSS variables', () => {
      const rootBlock = getCSSBlock(cssBlocks, ':root')

      // RED PHASE: This will fail if :root is not found or has no variables
      expect(rootBlock).toBeDefined()
      expect(rootBlock?.variables.length).toBeGreaterThan(0)
    })

    it('should have .dark selector with CSS variables', () => {
      const darkBlock = getCSSBlock(cssBlocks, '.dark')

      expect(darkBlock).toBeDefined()
      expect(darkBlock?.variables.length).toBeGreaterThan(0)
    })
  })

  describe(':root Color Variables (Light Mode)', () => {
    it('should have all required color variables defined in :root', () => {
      const rootBlock = getCSSBlock(cssBlocks, ':root')
      expect(rootBlock).toBeDefined()

      const missingVariables: string[] = []

      for (const varName of REQUIRED_COLOR_VARIABLES) {
        const value = getVariable(rootBlock, varName)
        if (value === undefined) {
          missingVariables.push(varName)
        }
      }

      // RED PHASE: This will fail if any required variables are missing
      expect(missingVariables).toEqual([])
    })

    it('should have all required chart variables defined in :root', () => {
      const rootBlock = getCSSBlock(cssBlocks, ':root')
      expect(rootBlock).toBeDefined()

      const missingVariables: string[] = []

      for (const varName of REQUIRED_CHART_VARIABLES) {
        const value = getVariable(rootBlock, varName)
        if (value === undefined) {
          missingVariables.push(varName)
        }
      }

      expect(missingVariables).toEqual([])
    })

    it('should have all required layout variables defined in :root', () => {
      const rootBlock = getCSSBlock(cssBlocks, ':root')
      expect(rootBlock).toBeDefined()

      const missingVariables: string[] = []

      for (const varName of REQUIRED_LAYOUT_VARIABLES) {
        const value = getVariable(rootBlock, varName)
        if (value === undefined) {
          missingVariables.push(varName)
        }
      }

      expect(missingVariables).toEqual([])
    })
  })

  describe('Light Mode Color Value Validation', () => {
    it('should have valid HSL color format for background', () => {
      const rootBlock = getCSSBlock(cssBlocks, ':root')
      const background = getVariable(rootBlock, '--background')

      expect(background).toBeDefined()
      // HSL format: "h s% l%" or "h s l" (without %)
      // Example: "0 0% 100%" or "222.2 84% 4.9%"
      expect(background).toMatch(/^\d+(\.\d+)?\s+\d+(\.\d+)?%?\s+\d+(\.\d+)?%?$/)
    })

    it('should have valid HSL color format for foreground', () => {
      const rootBlock = getCSSBlock(cssBlocks, ':root')
      const foreground = getVariable(rootBlock, '--foreground')

      expect(foreground).toBeDefined()
      expect(foreground).toMatch(/^\d+(\.\d+)?\s+\d+(\.\d+)?%?\s+\d+(\.\d+)?%?$/)
    })

    it('should have valid HSL color format for primary', () => {
      const rootBlock = getCSSBlock(cssBlocks, ':root')
      const primary = getVariable(rootBlock, '--primary')

      expect(primary).toBeDefined()
      expect(primary).toMatch(/^\d+(\.\d+)?\s+\d+(\.\d+)?%?\s+\d+(\.\d+)?%?$/)
    })

    it('should have light background color (high lightness value)', () => {
      const rootBlock = getCSSBlock(cssBlocks, ':root')
      const background = getVariable(rootBlock, '--background')

      expect(background).toBeDefined()

      // Extract lightness value (third number in HSL)
      const match = background?.match(/^\d+(\.\d+)?\s+\d+(\.\d+)?%?\s+(\d+(\.\d+)?)%?$/)
      const lightness = match ? parseFloat(match[3]) : 0

      // Light mode background should have lightness >= 90%
      // RED PHASE: This may fail if background is not light enough
      expect(lightness).toBeGreaterThanOrEqual(90)
    })

    it('should have dark foreground color (low lightness value)', () => {
      const rootBlock = getCSSBlock(cssBlocks, ':root')
      const foreground = getVariable(rootBlock, '--foreground')

      expect(foreground).toBeDefined()

      // Extract lightness value
      const match = foreground?.match(/^\d+(\.\d+)?\s+\d+(\.\d+)?%?\s+(\d+(\.\d+)?)%?$/)
      const lightness = match ? parseFloat(match[3]) : 0

      // Light mode foreground should have lightness <= 20% for good contrast
      // RED PHASE: This may fail if foreground is not dark enough
      expect(lightness).toBeLessThanOrEqual(20)
    })
  })

  describe('Light vs Dark Theme Distinction', () => {
    it('should have different background values between :root and .dark', () => {
      const rootBlock = getCSSBlock(cssBlocks, ':root')
      const darkBlock = getCSSBlock(cssBlocks, '.dark')

      const lightBackground = getVariable(rootBlock, '--background')
      const darkBackground = getVariable(darkBlock, '--background')

      expect(lightBackground).toBeDefined()
      expect(darkBackground).toBeDefined()

      // RED PHASE: This will fail if light and dark backgrounds are the same
      expect(lightBackground).not.toEqual(darkBackground)
    })

    it('should have different foreground values between :root and .dark', () => {
      const rootBlock = getCSSBlock(cssBlocks, ':root')
      const darkBlock = getCSSBlock(cssBlocks, '.dark')

      const lightForeground = getVariable(rootBlock, '--foreground')
      const darkForeground = getVariable(darkBlock, '--foreground')

      expect(lightForeground).toBeDefined()
      expect(darkForeground).toBeDefined()

      expect(lightForeground).not.toEqual(darkForeground)
    })

    it('should have different primary values between :root and .dark', () => {
      const rootBlock = getCSSBlock(cssBlocks, ':root')
      const darkBlock = getCSSBlock(cssBlocks, '.dark')

      const lightPrimary = getVariable(rootBlock, '--primary')
      const darkPrimary = getVariable(darkBlock, '--primary')

      expect(lightPrimary).toBeDefined()
      expect(darkPrimary).toBeDefined()

      expect(lightPrimary).not.toEqual(darkPrimary)
    })

    it('should have inverted lightness between light and dark background', () => {
      const rootBlock = getCSSBlock(cssBlocks, ':root')
      const darkBlock = getCSSBlock(cssBlocks, '.dark')

      const lightBackground = getVariable(rootBlock, '--background')
      const darkBackground = getVariable(darkBlock, '--background')

      expect(lightBackground).toBeDefined()
      expect(darkBackground).toBeDefined()

      // Extract lightness values
      const lightMatch = lightBackground?.match(/^\d+(\.\d+)?\s+\d+(\.\d+)?%?\s+(\d+(\.\d+)?)%?$/)
      const darkMatch = darkBackground?.match(/^\d+(\.\d+)?\s+\d+(\.\d+)?%?\s+(\d+(\.\d+)?)%?$/)

      const lightLightness = lightMatch ? parseFloat(lightMatch[3]) : 0
      const darkLightness = darkMatch ? parseFloat(darkMatch[3]) : 0

      // Light mode background should be lighter than dark mode background
      // RED PHASE: This will fail if lightness values are not properly inverted
      expect(lightLightness).toBeGreaterThan(darkLightness)

      // Expect significant difference (at least 50% difference in lightness)
      expect(lightLightness - darkLightness).toBeGreaterThanOrEqual(50)
    })

    it('should have inverted lightness between light and dark foreground', () => {
      const rootBlock = getCSSBlock(cssBlocks, ':root')
      const darkBlock = getCSSBlock(cssBlocks, '.dark')

      const lightForeground = getVariable(rootBlock, '--foreground')
      const darkForeground = getVariable(darkBlock, '--foreground')

      expect(lightForeground).toBeDefined()
      expect(darkForeground).toBeDefined()

      // Extract lightness values
      const lightMatch = lightForeground?.match(/^\d+(\.\d+)?\s+\d+(\.\d+)?%?\s+(\d+(\.\d+)?)%?$/)
      const darkMatch = darkForeground?.match(/^\d+(\.\d+)?\s+\d+(\.\d+)?%?\s+(\d+(\.\d+)?)%?$/)

      const lightLightness = lightMatch ? parseFloat(lightMatch[3]) : 0
      const darkLightness = darkMatch ? parseFloat(darkMatch[3]) : 0

      // Light mode foreground should be darker than dark mode foreground
      expect(lightLightness).toBeLessThan(darkLightness)

      // Expect significant difference
      expect(darkLightness - lightLightness).toBeGreaterThanOrEqual(50)
    })
  })

  describe('Accessibility - Contrast Requirements', () => {
    it('should have sufficient contrast between background and foreground in light mode', () => {
      const rootBlock = getCSSBlock(cssBlocks, ':root')

      const lightBackground = getVariable(rootBlock, '--background')
      const lightForeground = getVariable(rootBlock, '--foreground')

      expect(lightBackground).toBeDefined()
      expect(lightForeground).toBeDefined()

      // Extract lightness values
      const bgMatch = lightBackground?.match(/^\d+(\.\d+)?\s+\d+(\.\d+)?%?\s+(\d+(\.\d+)?)%?$/)
      const fgMatch = lightForeground?.match(/^\d+(\.\d+)?\s+\d+(\.\d+)?%?\s+(\d+(\.\d+)?)%?$/)

      const bgLightness = bgMatch ? parseFloat(bgMatch[3]) : 0
      const fgLightness = fgMatch ? parseFloat(fgMatch[3]) : 0

      // Contrast difference should be at least 70% for good readability
      // RED PHASE: This may fail if colors don't have enough contrast
      const contrastDifference = Math.abs(bgLightness - fgLightness)
      expect(contrastDifference).toBeGreaterThanOrEqual(70)
    })

    it('should have sufficient contrast for primary against its foreground', () => {
      const rootBlock = getCSSBlock(cssBlocks, ':root')

      const primary = getVariable(rootBlock, '--primary')
      const primaryForeground = getVariable(rootBlock, '--primary-foreground')

      expect(primary).toBeDefined()
      expect(primaryForeground).toBeDefined()

      // Extract lightness values
      const primaryMatch = primary?.match(/^\d+(\.\d+)?\s+\d+(\.\d+)?%?\s+(\d+(\.\d+)?)%?$/)
      const fgMatch = primaryForeground?.match(/^\d+(\.\d+)?\s+\d+(\.\d+)?%?\s+(\d+(\.\d+)?)%?$/)

      const primaryLightness = primaryMatch ? parseFloat(primaryMatch[3]) : 0
      const fgLightness = fgMatch ? parseFloat(fgMatch[3]) : 0

      // Contrast difference should be at least 50% for interactive elements
      const contrastDifference = Math.abs(primaryLightness - fgLightness)
      expect(contrastDifference).toBeGreaterThanOrEqual(50)
    })
  })

  describe('CSS Build Validation', () => {
    it('should not have syntax errors in CSS file', () => {
      // Check for basic CSS syntax issues
      expect(cssContent).toBeDefined()

      // Count opening and closing braces - should match
      const openBraces = (cssContent.match(/{/g) || []).length
      const closeBraces = (cssContent.match(/}/g) || []).length

      // RED PHASE: This will fail if CSS has unmatched braces
      expect(openBraces).toBe(closeBraces)
    })

    it('should have properly formatted CSS custom properties', () => {
      const rootBlock = getCSSBlock(cssBlocks, ':root')
      expect(rootBlock).toBeDefined()

      // Each variable should have a value
      const invalidVariables: string[] = []

      for (const variable of rootBlock?.variables || []) {
        if (!variable.value || variable.value.trim().length === 0) {
          invalidVariables.push(variable.name)
        }
      }

      expect(invalidVariables).toEqual([])
    })

    it('should use consistent HSL color format across all color variables', () => {
      const rootBlock = getCSSBlock(cssBlocks, ':root')
      expect(rootBlock).toBeDefined()

      const colorVars = REQUIRED_COLOR_VARIABLES
      const inconsistentFormats: string[] = []

      for (const varName of colorVars) {
        const value = getVariable(rootBlock, varName)
        if (value && !value.match(/^\d+(\.\d+)?\s+\d+(\.\d+)?%?\s+\d+(\.\d+)?%?$/)) {
          inconsistentFormats.push(`${varName}: ${value}`)
        }
      }

      expect(inconsistentFormats).toEqual([])
    })
  })
})
