/**
 * App Component Tests - TDD RED Phase
 *
 * These tests define the expected behavior for HTML class binding in App.tsx.
 * All tests should FAIL initially since the HTML class binding implementation doesn't exist yet.
 *
 * Expected component: src/renderer/App.tsx
 *
 * Requirements:
 * - App.tsx applies 'dark' class to HTML element when theme is 'dark'
 * - App.tsx removes 'dark' class from HTML element when theme is 'light'
 * - App.tsx applies/removes 'dark' class based on system preference when theme is 'system'
 * - index.html should not have hardcoded 'dark' class (controlled by App.tsx)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { BrowserRouter } from 'react-router-dom'

// Import the component
import App from '@renderer/App'

// Mock the useTheme hook
vi.mock('@renderer/hooks/useTheme', () => ({
  useTheme: vi.fn(),
}))

// Import after mocking
import { useTheme } from '@renderer/hooks/useTheme'

// Mock other dependencies to isolate App component
vi.mock('@renderer/store/beadsStore', () => ({
  useBeadsStore: vi.fn((selector) => {
    const mockStoreValue = {
      projects: [],
      activeProjectId: null,
      setActiveProject: vi.fn(),
      loadProjects: vi.fn().mockResolvedValue(undefined),
      isSwitchingProject: false,
      selectedEpic: null,
      batches: [],
      issuesWithDeps: [],
      issues: [],
      clearSelection: vi.fn(),
      getState: vi.fn(function() {
        return this
      }),
    }
    // Bind getState to the object
    mockStoreValue.getState = mockStoreValue.getState.bind(mockStoreValue)

    if (typeof selector === 'function') {
      return selector(mockStoreValue)
    }
    return mockStoreValue
  }),
}))

vi.mock('@renderer/lib/discoveryClient', () => ({
  default: {
    setDatabasePath: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('@renderer/lib/electronClient', () => ({
  settings: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
  },
  dialog: {
    selectFolder: vi.fn(),
  },
  project: {
    checkSetupStatus: vi.fn().mockResolvedValue({ status: 'ready' }),
  },
}))

// Wrap App in BrowserRouter for testing
function AppWithRouter() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  )
}

describe('App - HTML Class Binding', () => {
  const mockSetTheme = vi.fn()
  let htmlElement: HTMLElement

  beforeEach(() => {
    vi.clearAllMocks()

    // Get reference to HTML element before each test
    htmlElement = document.documentElement

    // Clear any existing dark class
    htmlElement.classList.remove('dark')

    // Default mock implementation
    vi.mocked(useTheme).mockReturnValue({
      theme: 'dark',
      resolvedTheme: 'dark',
      setTheme: mockSetTheme,
    })
  })

  afterEach(() => {
    // Clean up after each test
    htmlElement.classList.remove('dark')
  })

  describe('Dark Mode Class Binding', () => {
    it('should apply "dark" class to HTML element when theme is "dark"', async () => {
      vi.mocked(useTheme).mockReturnValue({
        theme: 'dark',
        resolvedTheme: 'dark',
        setTheme: mockSetTheme,
      })

      render(<AppWithRouter />)

      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(true)
      })
    })

    it('should remove "dark" class from HTML element when theme is "light"', async () => {
      // Pre-add dark class to simulate existing state
      document.documentElement.classList.add('dark')

      vi.mocked(useTheme).mockReturnValue({
        theme: 'light',
        resolvedTheme: 'light',
        setTheme: mockSetTheme,
      })

      render(<AppWithRouter />)

      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(false)
      })
    })

    it('should apply "dark" class when resolvedTheme is "dark" in system mode', async () => {
      vi.mocked(useTheme).mockReturnValue({
        theme: 'system',
        resolvedTheme: 'dark',
        setTheme: mockSetTheme,
      })

      render(<AppWithRouter />)

      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(true)
      })
    })

    it('should remove "dark" class when resolvedTheme is "light" in system mode', async () => {
      // Pre-add dark class
      document.documentElement.classList.add('dark')

      vi.mocked(useTheme).mockReturnValue({
        theme: 'system',
        resolvedTheme: 'light',
        setTheme: mockSetTheme,
      })

      render(<AppWithRouter />)

      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(false)
      })
    })
  })

  describe('Theme Changes', () => {
    it('should update HTML class when theme changes from light to dark', async () => {
      const { rerender } = render(<AppWithRouter />)

      // Initial render with light theme
      vi.mocked(useTheme).mockReturnValue({
        theme: 'light',
        resolvedTheme: 'light',
        setTheme: mockSetTheme,
      })

      rerender(<AppWithRouter />)

      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(false)
      })

      // Change to dark theme
      vi.mocked(useTheme).mockReturnValue({
        theme: 'dark',
        resolvedTheme: 'dark',
        setTheme: mockSetTheme,
      })

      rerender(<AppWithRouter />)

      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(true)
      })
    })

    it('should update HTML class when theme changes from dark to light', async () => {
      const { rerender } = render(<AppWithRouter />)

      // Initial render with dark theme
      vi.mocked(useTheme).mockReturnValue({
        theme: 'dark',
        resolvedTheme: 'dark',
        setTheme: mockSetTheme,
      })

      rerender(<AppWithRouter />)

      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(true)
      })

      // Change to light theme
      vi.mocked(useTheme).mockReturnValue({
        theme: 'light',
        resolvedTheme: 'light',
        setTheme: mockSetTheme,
      })

      rerender(<AppWithRouter />)

      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(false)
      })
    })

    it('should update HTML class when theme changes to system mode', async () => {
      const { rerender } = render(<AppWithRouter />)

      // Initial render with light theme
      vi.mocked(useTheme).mockReturnValue({
        theme: 'light',
        resolvedTheme: 'light',
        setTheme: mockSetTheme,
      })

      rerender(<AppWithRouter />)

      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(false)
      })

      // Change to system theme (dark preference)
      vi.mocked(useTheme).mockReturnValue({
        theme: 'system',
        resolvedTheme: 'dark',
        setTheme: mockSetTheme,
      })

      rerender(<AppWithRouter />)

      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(true)
      })
    })
  })

  describe('Initial HTML State', () => {
    it('should call useTheme hook to get theme during render', async () => {
      render(<AppWithRouter />)

      await waitFor(() => {
        expect(useTheme).toHaveBeenCalled()
      })
    })

    it('should respect resolvedTheme for HTML class, not theme', async () => {
      // Test that resolvedTheme is what controls the class, not the raw theme value
      vi.mocked(useTheme).mockReturnValue({
        theme: 'system',
        resolvedTheme: 'light', // resolvedTheme is light despite being in system mode
        setTheme: mockSetTheme,
      })

      render(<AppWithRouter />)

      await waitFor(() => {
        // Should use resolvedTheme for class binding
        expect(document.documentElement.classList.contains('dark')).toBe(false)
      })
    })
  })

  describe('Class Consistency', () => {
    it('should not add or remove other classes, only manage "dark"', async () => {
      // Pre-add some other classes
      document.documentElement.classList.add('custom-class', 'another-class')

      vi.mocked(useTheme).mockReturnValue({
        theme: 'dark',
        resolvedTheme: 'dark',
        setTheme: mockSetTheme,
      })

      render(<AppWithRouter />)

      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(true)
        expect(document.documentElement.classList.contains('custom-class')).toBe(true)
        expect(document.documentElement.classList.contains('another-class')).toBe(true)
      })
    })

    it('should only have dark class when theme is dark', async () => {
      vi.mocked(useTheme).mockReturnValue({
        theme: 'dark',
        resolvedTheme: 'dark',
        setTheme: mockSetTheme,
      })

      render(<AppWithRouter />)

      await waitFor(() => {
        const classList = Array.from(document.documentElement.classList)
        const darkClassCount = classList.filter(c => c === 'dark').length
        expect(darkClassCount).toBeLessThanOrEqual(1) // Should only be present once
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle rapid theme changes', async () => {
      const { rerender } = render(<AppWithRouter />)

      // Rapid theme changes
      const themes = [
        { theme: 'dark' as const, resolvedTheme: 'dark' as const },
        { theme: 'light' as const, resolvedTheme: 'light' as const },
        { theme: 'dark' as const, resolvedTheme: 'dark' as const },
        { theme: 'system' as const, resolvedTheme: 'light' as const },
      ]

      for (const themeState of themes) {
        vi.mocked(useTheme).mockReturnValue({
          ...themeState,
          setTheme: mockSetTheme,
        })
        rerender(<AppWithRouter />)
      }

      // Final state should be light (last resolved theme)
      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(false)
      })
    })

    it('should maintain class binding after app re-initialization', async () => {
      const { rerender, unmount } = render(<AppWithRouter />)

      vi.mocked(useTheme).mockReturnValue({
        theme: 'dark',
        resolvedTheme: 'dark',
        setTheme: mockSetTheme,
      })

      rerender(<AppWithRouter />)

      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(true)
      })

      // Unmount and remount
      unmount()

      render(<AppWithRouter />)

      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(true)
      })
    })
  })

  describe('Integration with useTheme Hook', () => {
    it('should bind HTML class based on useTheme resolvedTheme value', async () => {
      vi.mocked(useTheme).mockReturnValue({
        theme: 'system',
        resolvedTheme: 'dark',
        setTheme: mockSetTheme,
      })

      render(<AppWithRouter />)

      // Should use the hook's resolvedTheme for class binding
      await waitFor(() => {
        expect(useTheme).toHaveBeenCalled()
        expect(document.documentElement.classList.contains('dark')).toBe(true)
      })
    })

    it('should respond to theme changes from useTheme hook', async () => {
      const { rerender } = render(<AppWithRouter />)

      // Simulate hook returning different resolvedTheme
      vi.mocked(useTheme).mockReturnValue({
        theme: 'light',
        resolvedTheme: 'light',
        setTheme: mockSetTheme,
      })

      rerender(<AppWithRouter />)

      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(false)
      })
    })
  })
})
