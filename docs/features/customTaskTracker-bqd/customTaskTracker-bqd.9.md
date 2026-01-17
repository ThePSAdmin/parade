# Test Task: Write tests for theme toggle UI in SettingsView

**Task ID**: customTaskTracker-bqd.9
**Implementation Task**: customTaskTracker-bqd.3
**Status**: RED Phase Complete
**Date**: 2026-01-17

## Overview

Created comprehensive failing tests for the theme toggle UI in SettingsView component following TDD RED phase methodology. The component will render a theme selection dropdown with Light/Dark/System options that integrates with the useTheme hook.

## Test File Created

**Location**: `/home/anthony/dev/parade/src/renderer/components/__tests__/SettingsView.test.tsx`

## Test Coverage

### 1. Theme Section Rendering (4 tests)
- Theme section renders in settings
- Label component renders with proper text
- Select component renders with combobox role
- Label and Select are properly associated via htmlFor/id

### 2. Theme Options (5 tests)
- Current theme value displays in select trigger
- Light option available when dropdown opened
- Dark option available when dropdown opened
- System option available when dropdown opened
- Exactly three theme options present

### 3. Current Theme Selection (4 tests)
- Displays "Light" when theme is light
- Displays "Dark" when theme is dark
- Displays "System" when theme is system
- Shows selected indicator on current theme option

### 4. Theme Selection Interaction (6 tests)
- Calls setTheme when Light option selected
- Calls setTheme when Dark option selected
- Calls setTheme when System option selected
- Calls setTheme with correct value type (string)
- Only calls setTheme once per selection
- No duplicate calls on single interaction

### 5. Integration with useTheme Hook (3 tests)
- Calls useTheme hook during render
- Updates displayed value when theme changes
- Uses setTheme function from useTheme hook

### 6. Accessibility (6 tests)
- Has accessible label for screen readers
- Is keyboard navigable (Tab key)
- Opens dropdown with Enter key
- Allows arrow key navigation through options
- Has proper ARIA attributes (aria-expanded)
- Combobox role with accessible name

### 7. Visual Styling (2 tests)
- Theme section visually separated or grouped
- Uses UI components from component library

### 8. Edge Cases (3 tests)
- Handles rapid theme changes correctly
- Handles undefined theme gracefully
- Maintains selection state after re-render

### 9. Component Structure (2 tests)
- Renders within settings layout/container
- Theme setting in logical position within settings

## Expected Component Structure

The SettingsView component should include:

```tsx
import { Label } from '@renderer/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@renderer/components/ui/select'
import { useTheme } from '@renderer/hooks/useTheme'

// Inside component:
const { theme, setTheme } = useTheme()

<div>
  <Label htmlFor="theme-select">Theme</Label>
  <Select value={theme} onValueChange={setTheme}>
    <SelectTrigger id="theme-select">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="light">Light</SelectItem>
      <SelectItem value="dark">Dark</SelectItem>
      <SelectItem value="system">System</SelectItem>
    </SelectContent>
  </Select>
</div>
```

## Key Behaviors Tested

1. **Component Integration**: SettingsView should call useTheme() to get current theme state and setTheme function

2. **UI Rendering**: Theme section includes Label and Select components from UI library with proper associations

3. **Theme Options**: Select dropdown provides exactly three options: Light, Dark, and System

4. **Current Selection Display**: Select trigger displays the current theme value from useTheme hook

5. **User Interaction**: Selecting any option calls setTheme() with the chosen theme value ('light', 'dark', or 'system')

6. **Accessibility**: Full keyboard navigation support with proper ARIA attributes and screen reader labels

7. **State Synchronization**: Component re-renders when theme changes, updating displayed value

## Mock Setup

Tests mock:
- `@renderer/hooks/useTheme` with controllable return values
- Default mock returns: `{ theme: 'dark', resolvedTheme: 'dark', setTheme: mockFn }`

## Running the Tests

```bash
npm test -- src/renderer/components/__tests__/SettingsView.test.tsx
```

**Expected Result**: All tests should FAIL with module resolution error because SettingsView doesn't exist yet.

**Current Status**:
```
Error: Failed to resolve import "@renderer/components/SettingsView" from
"src/renderer/components/__tests__/SettingsView.test.tsx". Does the file exist?
```

This is the expected RED phase behavior - the component doesn't exist yet.

## Test Patterns Used

Following established patterns from existing tests:
- React Testing Library for component testing (`render`, `screen`, `within`)
- `userEvent` for realistic user interactions
- `vi.mock()` for hook mocking
- Comprehensive accessibility checks
- Edge case coverage

## UI Components Required

The implementation will use these existing UI components:
- `/src/renderer/components/ui/label.tsx` - Label component (Radix UI)
- `/src/renderer/components/ui/select.tsx` - Select components (Radix UI)

Both components already exist and are fully implemented with proper styling.

## Integration Points

1. **useTheme Hook**: Must be implemented first (task customTaskTracker-bqd.8 creates tests, customTaskTracker-bqd.2 implements)
2. **Settings Component**: SettingsView component must exist or be created (implementation in customTaskTracker-bqd.3)

## Next Steps

1. Implement useTheme hook (customTaskTracker-bqd.2)
2. Implement theme toggle UI in SettingsView (customTaskTracker-bqd.3)
3. Run tests to verify they pass (GREEN phase)
4. Refactor if needed while keeping tests green

## Notes

- Tests are syntactically correct and will run once SettingsView exists
- All 35 test cases cover comprehensive functionality
- Tests verify both rendering and interaction behaviors
- Accessibility is thoroughly tested (keyboard navigation, ARIA, screen readers)
- Tests follow TDD best practices with clear, focused assertions
