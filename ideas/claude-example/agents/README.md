# Ascent Training Sub-Agents

## Overview

This directory contains specialized sub-agent definitions for the Ascent Training project. These agents can be invoked by the main agent to provide expert guidance in specific domains.

---

## Available Agents

| Agent | Color | Specialty | When to Use |
|-------|-------|-----------|-------------|
| **ascent-ios-architect** | 🔵 Blue | iOS architecture, MVVM patterns, file structure | Planning iOS features |
| **ascent-supabase-architect** | 🟦 Cyan | Database schema, Edge Functions, RLS policies | Planning database/backend |
| **ascent-ui-designer** | 🟢 Emerald | Progressive disclosure, design system, UX | Creating/reviewing UI |
| **ascent-bug-fixer** | 🟠 Amber | Bug diagnosis, resolution, knowledge base | Active bug during development |
| **ascent-code-reviewer** | 🟣 Purple | Pre-merge quality gate, architecture compliance | Before feature merge (REQUIRED) |
| **ascent-autonomous-coding-agent** | 🔵 Blue | Feature Brief → Implementation, test-driven | Large refactorings, background work |

---

## Quick Reference

### Planning a Feature

**Small features (manual coding):**
- iOS changes → `ascent-ios-architect`
- Database changes → `ascent-supabase-architect`
- UI components → `ascent-ui-designer`

**Large features (autonomous):**
- Have feature brief → `ascent-autonomous-coding-agent`
- Generates app_spec.txt + feature_list.json
- Runs test-driven implementation
- See: `Docs/.../architecture/agents/autonomous-coding-guide.md`

### During Development

- Bug encountered → `ascent-bug-fixer`
- Design question → `ascent-ui-designer`
- Architecture question → `ascent-ios-architect` or `ascent-supabase-architect`

### Before Merge (REQUIRED)

- Feature complete → `ascent-code-reviewer`

---

## Autonomous Coding Workflow

```
Feature Brief → app_spec.txt → feature_list.json → Implementation → Code Review
```

**When to use:**
- Large refactorings
- Systematic changes across many files
- Background work (can run while you do other things)
- Well-defined features with clear requirements

**See complete guide:**
`Docs/AscentTraining_Docs/architecture/agents/autonomous-coding-guide.md`

---

## Documentation

**For detailed usage information, see:**
- `Docs/AscentTraining_Docs/architecture/agents/overview.md` - System overview
- `Docs/AscentTraining_Docs/architecture/agents/usage-guide.md` - Complete usage guide
- `Docs/AscentTraining_Docs/architecture/agents/autonomous-coding-guide.md` - Autonomous workflow

**Bug Knowledge Base:**
- `Docs/AscentTraining_Docs/bug-knowledge-base.md` - Self-improving bug repository

---

## Agent Definitions

Each agent has a dedicated `.md` file in this directory with:
- Agent metadata (name, description, color)
- Knowledge base references (which docs to read)
- Specialized patterns and guidance
- Output format specifications

---

## How They Work

1. **Main agent** delegates to specialist based on task
2. **Specialist agent** runs in separate context window
3. **Specialist** provides expert guidance
4. **Main agent** implements recommendations
5. **Knowledge preserved** (bug-fixer auto-documents)

**Special: Autonomous coding agent**
- Reads feature brief
- Generates implementation plan
- Runs autonomous test-driven development
- Consults other specialists as needed
- Commits progress incrementally

---

## Philosophy

Each agent follows these principles:

- **Documentation-driven** - Always read relevant docs first
- **Pattern-based** - Use canonical patterns from docs
- **Simplification** - Make code simpler, not more complex
- **Architecture compliance** - Enforce standards consistently
- **Team learning** - Document everything (especially bug-fixer)
- **Test-driven** - Autonomous agent writes tests first

---

## For More Information

See the complete documentation in:
```
Docs/AscentTraining_Docs/architecture/agents/
```
