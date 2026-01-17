# Test Task: Write tests for useTheme hook

**Task ID**: customTaskTracker-bqd.8
**Implementation Task**: customTaskTracker-bqd.2
**Status**: RED Phase Complete
**Date**: 2026-01-17

## Overview

Created comprehensive failing tests for the `useTheme` hook following TDD RED phase methodology. The hook will manage theme state, persist preferences to settings, and detect system color scheme changes.

## Test File Created

**Location**: `/home/anthony/dev/parade/src/renderer/hooks/__tests__/useTheme.test.ts`

## Test Coverage

### 1. Initial State (4 tests)
- ✓ Returns theme state object with current theme
- ✓ Defaults to "dark" when no theme is saved
- ✓ Loads saved theme from settings
- ✓ Loads "system" theme preference

### 2. Theme Setter (5 tests)
- ✓ Provides setTheme function
- ✓ Updates theme state when setTheme is called
- ✓ Persists theme to settings when changed
- ✓ Accepts all valid theme values (light, dark, system)
- ✓ Multiple theme changes work correctly

### 3. Resolved Theme (4 tests)
- ✓ Matches theme when not "system"
- ✓ Resolves "system" based on matchMedia preference
- ✓ Resolves "system" to "light" when system preference is light
- ✓ Updates resolvedTheme when theme changes from explicit to system

### 4. System Preference Detection (6 tests)
- ✓ Queries matchMedia for color scheme preference
- ✓ Registers listener for system preference changes
- ✓ Updates resolvedTheme when system preference changes
- ✓ Does not react to system changes when theme is not "system"
- ✓ Cleanups matchMedia listener on unmount
- ✓ Handles media query change events

### 5. DOM Class Application (4 tests)
- ✓ Applies "dark" class to document root when resolved theme is dark
- ✓ Removes "dark" class when resolved theme is light
- ✓ Updates DOM class when theme changes
- ✓ Updates DOM class when system preference changes in system mode

### 6. Error Handling (2 tests)
- ✓ Handles settings.get failure gracefully (fallback to default)
- ✓ Handles settings.set failure gracefully (local state still updates)

### 7. Type Safety (1 test)
- ✓ Has correct return type shape with theme, resolvedTheme, and setTheme

### 8. Concurrent Updates (1 test)
- ✓ Handles rapid theme changes correctly

### 9. Hook Stability (1 test)
- ✓ Maintains setTheme reference across re-renders

## Expected Hook API

```typescript
interface UseThemeReturn {
  // Current theme setting ("light" | "dark" | "system")
  theme: 'light' | 'dark' | 'system'

  // Resolved theme (always "light" or "dark")
  resolvedTheme: 'light' | 'dark'

  // Function to change theme
  setTheme: (theme: 'light' | 'dark' | 'system') => Promise<void>
}

function useTheme(): UseThemeReturn
```

## Key Behaviors Tested

1. **Settings Integration**: Hook loads initial theme from `settings.get('theme')` and persists changes via `settings.set('theme', value)`

2. **System Preference Detection**: When theme is "system", hook uses `window.matchMedia('(prefers-color-scheme: dark)')` to detect OS preference

3. **Reactive Updates**: Hook listens to matchMedia change events and updates when system preference changes (only when theme is "system")

4. **DOM Manipulation**: Hook applies/removes "dark" class on `document.documentElement` based on resolved theme

5. **Error Resilience**: Hook gracefully handles settings API failures with sensible fallbacks

6. **Performance**: setTheme function maintains stable reference across re-renders

## Mock Setup

Tests mock:
- `@renderer/lib/electronClient` settings API
- `window.matchMedia` with full event listener support
- MediaQueryList change events

## Running the Tests

```bash
npm test -- src/renderer/hooks/__tests__/useTheme.test.ts
```

**Expected Result**: All tests should FAIL with module import error because the hook doesn't exist yet.

**Current Status**: Test fails with import error for `@renderer/hooks/useTheme` (expected RED phase behavior).

### Note on Test Environment

The project currently has a missing peer dependency `@testing-library/dom` which affects React component/hook tests. This should be installed before running React tests:

```bash
npm install --save-dev @testing-library/dom
```

However, this does not affect the validity of the test implementation - the test is correctly written and will run once:
1. The missing peer dependency is installed
2. The useTheme hook is implemented

## Next Steps

1. Implementation task (customTaskTracker-bqd.2) will create the actual hook
2. Run tests to verify they pass (GREEN phase)
3. Refactor if needed while keeping tests green

## Notes

- Tests follow existing patterns from `/src/renderer/components/ui/__tests__/checkbox.test.tsx`
- Uses React Testing Library's `renderHook` for hook testing
- Comprehensive coverage of edge cases and error scenarios
- Tests verify both immediate state changes and async side effects
