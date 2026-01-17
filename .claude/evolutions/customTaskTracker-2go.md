# Evolution: customTaskTracker-2go

**Date**: 2026-01-17
**Epic**: Slash Command Autocomplete in Agent View

## Additions

### Components
- **SlashCommandAutocomplete** - Input wrapper with command autocomplete dropdown

### Fields/Types
- **BuiltInCommand** - Interface for Claude Code CLI command metadata
- **Command** - Unified command interface for autocomplete

### Patterns
- **Input Autocomplete Pattern** - Dropdown autocomplete triggered by input text
- **useAllCommands Hook** - Hook composition merging static + dynamic data

## Registry Updates

| Registry | Change |
|----------|--------|
| `.design/Components.md` | +1 component (SlashCommandAutocomplete) |
| `.design/Fields.md` | +2 types (BuiltInCommand, Command) |
| `.design/Patterns.md` | +2 patterns (Input Autocomplete, useAllCommands) |

## Files Created

- `src/shared/constants/claudeCommands.ts` - Built-in command definitions
- `src/renderer/hooks/useAllCommands.ts` - Command merging hook
- `src/renderer/components/agent/SlashCommandAutocomplete.tsx` - Autocomplete component

## Files Modified

- `src/server/services/claudeAgent.ts` - Extended to scan global skills directory
- `src/renderer/components/agent/AgentPanel.tsx` - Integrated autocomplete component
