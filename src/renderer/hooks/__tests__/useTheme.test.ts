/**
 * useTheme Hook Tests - TDD RED Phase
 *
 * These tests define the expected behavior for the useTheme hook.
 * All tests should FAIL initially since the hook doesn't exist yet.
 *
 * Expected hook: src/renderer/hooks/useTheme.ts
 *
 * Requirements:
 * - Hook returns current theme state
 * - Hook updates settings on theme change
 * - Hook detects system preference changes via matchMedia
 * - Hook persists theme to settings.json
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

// Import the hook that doesn't exist yet - will cause import error until implemented
import { useTheme } from '@renderer/hooks/useTheme'
import { settings } from '@renderer/lib/electronClient'

// Mock the settings client
vi.mock('@renderer/lib/electronClient', () => ({
  settings: {
    get: vi.fn(),
    set: vi.fn(),
  },
}))

describe('useTheme Hook', () => {
  let matchMediaMock: {
    matches: boolean
    media: string
    addEventListener: ReturnType<typeof vi.fn>
    removeEventListener: ReturnType<typeof vi.fn>
    addListener: ReturnType<typeof vi.fn>
    removeListener: ReturnType<typeof vi.fn>
    dispatchEvent: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock window.matchMedia
    matchMediaMock = {
      matches: false,
      media: '(prefers-color-scheme: dark)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(), // deprecated but still used
      removeListener: vi.fn(), // deprecated but still used
      dispatchEvent: vi.fn(),
    }

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        ...matchMediaMock,
        media: query,
      })),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Initial State', () => {
    it('should return theme state object with current theme', async () => {
      vi.mocked(settings.get).mockResolvedValue('dark')

      const { result } = renderHook(() => useTheme())

      await waitFor(() => {
        expect(result.current).toBeDefined()
        expect(result.current.theme).toBe('dark')
      })
    })

    it('should default to "dark" when no theme is saved', async () => {
      vi.mocked(settings.get).mockResolvedValue(null)

      const { result } = renderHook(() => useTheme())

      await waitFor(() => {
        expect(result.current.theme).toBe('dark')
      })
    })

    it('should load saved theme from settings', async () => {
      vi.mocked(settings.get).mockResolvedValue('light')

      const { result } = renderHook(() => useTheme())

      await waitFor(() => {
        expect(result.current.theme).toBe('light')
      })
      expect(settings.get).toHaveBeenCalledWith('theme')
    })

    it('should load "system" theme preference', async () => {
      vi.mocked(settings.get).mockResolvedValue('system')

      const { result } = renderHook(() => useTheme())

      await waitFor(() => {
        expect(result.current.theme).toBe('system')
      })
    })
  })

  describe('Theme Setter', () => {
    it('should provide setTheme function', async () => {
      vi.mocked(settings.get).mockResolvedValue('dark')

      const { result } = renderHook(() => useTheme())

      await waitFor(() => {
        expect(result.current.setTheme).toBeDefined()
        expect(typeof result.current.setTheme).toBe('function')
      })
    })

    it('should update theme state when setTheme is called', async () => {
      vi.mocked(settings.get).mockResolvedValue('dark')
      vi.mocked(settings.set).mockResolvedValue(undefined)

      const { result } = renderHook(() => useTheme())

      await waitFor(() => {
        expect(result.current.theme).toBe('dark')
      })

      await act(async () => {
        await result.current.setTheme('light')
      })

      expect(result.current.theme).toBe('light')
    })

    it('should persist theme to settings when changed', async () => {
      vi.mocked(settings.get).mockResolvedValue('dark')
      vi.mocked(settings.set).mockResolvedValue(undefined)

      const { result } = renderHook(() => useTheme())

      await waitFor(() => {
        expect(result.current.theme).toBe('dark')
      })

      await act(async () => {
        await result.current.setTheme('light')
      })

      expect(settings.set).toHaveBeenCalledWith('theme', 'light')
    })

    it('should accept all valid theme values', async () => {
      vi.mocked(settings.get).mockResolvedValue('dark')
      vi.mocked(settings.set).mockResolvedValue(undefined)

      const { result } = renderHook(() => useTheme())

      await waitFor(() => {
        expect(result.current.theme).toBe('dark')
      })

      const themes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system']

      for (const theme of themes) {
        await act(async () => {
          await result.current.setTheme(theme)
        })

        expect(result.current.theme).toBe(theme)
        expect(settings.set).toHaveBeenCalledWith('theme', theme)
      }
    })
  })

  describe('Resolved Theme', () => {
    it('should provide resolvedTheme that matches theme when not "system"', async () => {
      vi.mocked(settings.get).mockResolvedValue('light')

      const { result } = renderHook(() => useTheme())

      await waitFor(() => {
        expect(result.current.resolvedTheme).toBe('light')
      })
    })

    it('should resolve "system" theme based on matchMedia preference', async () => {
      vi.mocked(settings.get).mockResolvedValue('system')

      // System prefers dark
      matchMediaMock.matches = true

      const { result } = renderHook(() => useTheme())

      await waitFor(() => {
        expect(result.current.theme).toBe('system')
        expect(result.current.resolvedTheme).toBe('dark')
      })
    })

    it('should resolve "system" to "light" when system preference is light', async () => {
      vi.mocked(settings.get).mockResolvedValue('system')

      // System prefers light
      matchMediaMock.matches = false

      const { result } = renderHook(() => useTheme())

      await waitFor(() => {
        expect(result.current.theme).toBe('system')
        expect(result.current.resolvedTheme).toBe('light')
      })
    })

    it('should update resolvedTheme when theme changes from light to system', async () => {
      vi.mocked(settings.get).mockResolvedValue('light')
      vi.mocked(settings.set).mockResolvedValue(undefined)

      matchMediaMock.matches = true // system prefers dark

      const { result } = renderHook(() => useTheme())

      await waitFor(() => {
        expect(result.current.resolvedTheme).toBe('light')
      })

      await act(async () => {
        await result.current.setTheme('system')
      })

      expect(result.current.resolvedTheme).toBe('dark')
    })
  })

  describe('System Preference Detection', () => {
    it('should query matchMedia for system color scheme preference', async () => {
      vi.mocked(settings.get).mockResolvedValue('system')

      renderHook(() => useTheme())

      await waitFor(() => {
        expect(window.matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)')
      })
    })

    it('should register listener for system preference changes', async () => {
      vi.mocked(settings.get).mockResolvedValue('system')

      renderHook(() => useTheme())

      await waitFor(() => {
        // Should add listener to matchMedia
        expect(matchMediaMock.addEventListener).toHaveBeenCalledWith(
          'change',
          expect.any(Function)
        )
      })
    })

    it('should update resolvedTheme when system preference changes', async () => {
      vi.mocked(settings.get).mockResolvedValue('system')

      matchMediaMock.matches = false // initially light

      const { result } = renderHook(() => useTheme())

      await waitFor(() => {
        expect(result.current.resolvedTheme).toBe('light')
      })

      // Simulate system preference change to dark
      await act(async () => {
        matchMediaMock.matches = true
        const changeHandler = matchMediaMock.addEventListener.mock.calls[0][1]
        changeHandler({ matches: true, media: '(prefers-color-scheme: dark)' })
      })

      expect(result.current.resolvedTheme).toBe('dark')
    })

    it('should not react to system changes when theme is not "system"', async () => {
      vi.mocked(settings.get).mockResolvedValue('light')
      vi.mocked(settings.set).mockResolvedValue(undefined)

      matchMediaMock.matches = false

      const { result } = renderHook(() => useTheme())

      await waitFor(() => {
        expect(result.current.theme).toBe('light')
        expect(result.current.resolvedTheme).toBe('light')
      })

      // Simulate system preference change
      await act(async () => {
        matchMediaMock.matches = true
        if (matchMediaMock.addEventListener.mock.calls.length > 0) {
          const changeHandler = matchMediaMock.addEventListener.mock.calls[0][1]
          changeHandler({ matches: true, media: '(prefers-color-scheme: dark)' })
        }
      })

      // Should still be light because theme is explicitly set
      expect(result.current.resolvedTheme).toBe('light')
    })

    it('should cleanup matchMedia listener on unmount', async () => {
      vi.mocked(settings.get).mockResolvedValue('system')

      const { unmount } = renderHook(() => useTheme())

      await waitFor(() => {
        expect(matchMediaMock.addEventListener).toHaveBeenCalled()
      })

      unmount()

      expect(matchMediaMock.removeEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      )
    })
  })

  describe('DOM Class Application', () => {
    it('should apply "dark" class to document root when resolved theme is dark', async () => {
      vi.mocked(settings.get).mockResolvedValue('dark')

      renderHook(() => useTheme())

      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(true)
      })
    })

    it('should remove "dark" class when resolved theme is light', async () => {
      vi.mocked(settings.get).mockResolvedValue('light')

      // Pre-add dark class
      document.documentElement.classList.add('dark')

      renderHook(() => useTheme())

      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(false)
      })
    })

    it('should update DOM class when theme changes', async () => {
      vi.mocked(settings.get).mockResolvedValue('light')
      vi.mocked(settings.set).mockResolvedValue(undefined)

      const { result } = renderHook(() => useTheme())

      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(false)
      })

      await act(async () => {
        await result.current.setTheme('dark')
      })

      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })

    it('should update DOM class when system preference changes in system mode', async () => {
      vi.mocked(settings.get).mockResolvedValue('system')

      matchMediaMock.matches = false // light initially

      renderHook(() => useTheme())

      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(false)
      })

      // System preference changes to dark
      await act(async () => {
        matchMediaMock.matches = true
        const changeHandler = matchMediaMock.addEventListener.mock.calls[0][1]
        changeHandler({ matches: true, media: '(prefers-color-scheme: dark)' })
      })

      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should handle settings.get failure gracefully', async () => {
      vi.mocked(settings.get).mockRejectedValue(new Error('Settings unavailable'))

      const { result } = renderHook(() => useTheme())

      // Should fallback to default theme
      await waitFor(() => {
        expect(result.current.theme).toBe('dark')
      })
    })

    it('should handle settings.set failure gracefully', async () => {
      vi.mocked(settings.get).mockResolvedValue('dark')
      vi.mocked(settings.set).mockRejectedValue(new Error('Write failed'))

      const { result } = renderHook(() => useTheme())

      await waitFor(() => {
        expect(result.current.theme).toBe('dark')
      })

      // Should still update local state even if persist fails
      await act(async () => {
        await result.current.setTheme('light')
      })

      expect(result.current.theme).toBe('light')
    })
  })

  describe('Type Safety', () => {
    it('should have correct return type shape', async () => {
      vi.mocked(settings.get).mockResolvedValue('dark')

      const { result } = renderHook(() => useTheme())

      await waitFor(() => {
        expect(result.current).toHaveProperty('theme')
        expect(result.current).toHaveProperty('resolvedTheme')
        expect(result.current).toHaveProperty('setTheme')
      })

      // Type assertions
      const themeValue: 'light' | 'dark' | 'system' = result.current.theme
      const resolvedValue: 'light' | 'dark' = result.current.resolvedTheme
      const setter: (theme: 'light' | 'dark' | 'system') => Promise<void> = result.current.setTheme

      expect(themeValue).toBeDefined()
      expect(resolvedValue).toBeDefined()
      expect(setter).toBeDefined()
    })
  })

  describe('Concurrent Updates', () => {
    it('should handle rapid theme changes correctly', async () => {
      vi.mocked(settings.get).mockResolvedValue('dark')
      vi.mocked(settings.set).mockResolvedValue(undefined)

      const { result } = renderHook(() => useTheme())

      await waitFor(() => {
        expect(result.current.theme).toBe('dark')
      })

      // Rapidly change themes
      await act(async () => {
        await Promise.all([
          result.current.setTheme('light'),
          result.current.setTheme('system'),
          result.current.setTheme('dark'),
        ])
      })

      // Should end up with the last change
      expect(result.current.theme).toBe('dark')
    })
  })

  describe('Hook Stability', () => {
    it('should maintain setTheme reference across re-renders', async () => {
      vi.mocked(settings.get).mockResolvedValue('dark')

      const { result, rerender } = renderHook(() => useTheme())

      await waitFor(() => {
        expect(result.current.setTheme).toBeDefined()
      })

      const firstSetTheme = result.current.setTheme

      rerender()

      expect(result.current.setTheme).toBe(firstSetTheme)
    })
  })
})
