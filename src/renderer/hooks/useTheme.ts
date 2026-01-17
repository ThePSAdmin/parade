/**
 * useTheme Hook
 *
 * Manages theme state with persistence and system preference detection.
 * Supports three modes: 'light', 'dark', and 'system' (auto-detect).
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { settings } from '@renderer/lib/electronClient';

type Theme = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface UseThemeResult {
  /** Current theme preference ('light', 'dark', or 'system') */
  theme: Theme;
  /** Actual theme being applied (resolves 'system' to 'light' or 'dark') */
  resolvedTheme: ResolvedTheme;
  /** Update theme preference and persist to settings */
  setTheme: (theme: Theme) => Promise<void>;
}

/**
 * Hook to manage application theme with system preference detection.
 *
 * Features:
 * - Loads initial theme from settings
 * - Persists theme changes to settings.json
 * - Detects system color scheme preference
 * - Listens for system preference changes
 * - Applies 'dark' class to document root
 * - Defaults to 'dark' if no saved preference
 */
export function useTheme(): UseThemeResult {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(false);
  const mediaQueryRef = useRef<MediaQueryList | null>(null);
  const listenerRef = useRef<((e: MediaQueryListEvent) => void) | null>(null);

  // Resolve the actual theme (convert 'system' to 'light' or 'dark')
  const resolvedTheme: ResolvedTheme = theme === 'system'
    ? (systemPrefersDark ? 'dark' : 'light')
    : theme;

  // Load initial theme from settings
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await settings.get<Theme>('theme');
        if (savedTheme) {
          setThemeState(savedTheme);
        } else {
          // Default to 'dark' if no saved theme
          setThemeState('dark');
        }
      } catch (error) {
        // Fallback to default on error
        console.error('Failed to load theme:', error);
        setThemeState('dark');
      }
    };

    loadTheme();
  }, []);

  // Detect system preference and listen for changes
  useEffect(() => {
    // Query system preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQueryRef.current = mediaQuery;

    // Set initial system preference
    setSystemPrefersDark(mediaQuery.matches);

    // Listen for system preference changes
    const listener = (e: MediaQueryListEvent) => {
      setSystemPrefersDark(e.matches);
    };
    listenerRef.current = listener;

    mediaQuery.addEventListener('change', listener);

    // Cleanup listener on unmount
    return () => {
      if (mediaQueryRef.current && listenerRef.current) {
        mediaQueryRef.current.removeEventListener('change', listenerRef.current);
      }
    };
  }, []);

  // Apply dark class to document root based on resolved theme
  useEffect(() => {
    if (resolvedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [resolvedTheme]);

  // Theme setter with persistence
  const setTheme = useCallback(async (newTheme: Theme) => {
    // Update local state first (optimistic update)
    setThemeState(newTheme);

    // Persist to settings (fire-and-forget, don't block on failure)
    try {
      await settings.set('theme', newTheme);
    } catch (error) {
      console.error('Failed to persist theme:', error);
      // Don't revert state - local change still applies
    }
  }, []);

  return {
    theme,
    resolvedTheme,
    setTheme,
  };
}
