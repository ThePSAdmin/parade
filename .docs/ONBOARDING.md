# Parade Onboarding Guide

Welcome to Parade, a workflow orchestration system for transforming feature ideas into implemented code through Claude Code. This guide walks you through the complete workflow from project initialization to task execution.

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Step 1: Initialize Project](#step-1-initialize-project-init-project)
4. [Step 2: Discover Feature](#step-2-discover-feature-discover)
5. [Step 3: Approve Specification](#step-3-approve-specification-approve-spec)
6. [Step 4: Run Tasks](#step-4-run-tasks-run-tasks)
7. [Step 5: Retrospective](#step-5-retrospective-optional)
8. [Tips and Best Practices](#tips-and-best-practices)
9. [Troubleshooting](#troubleshooting)

---

## Overview

Parade follows a streamlined 4-step workflow:

```
┌────────────────────────────────────────────────────────────────────┐
│  /init-project  →  /discover  →  /approve-spec  →  /run-tasks     │
│  (setup)           (idea+spec)   (create beads)    (execute)       │
└────────────────────────────────────────────────────────────────────┘
                                                          │
                                                          ▼
                                               ┌─────────────────────┐
                                               │  Retrospective      │
                                               │  (self-improvement) │
                                               └─────────────────────┘
```

**Key Concepts:**

- **discovery.db**: SQLite database storing pre-approval workflow data (briefs, interview questions, SME reviews, specs)
- **Beads (.beads/)**: Post-approval task management via the `bd` CLI (epics, tasks, dependencies)
- **Sub-agents**: Specialized agents spawned for implementation work (typescript-agent, swift-agent, sql-agent, etc.)

---

## Prerequisites

Before starting, ensure you have:

- Claude Code installed and configured
- The `bd` CLI (Beads) installed and available in your PATH
  ```bash
  npm install -g beads
  ```
- SQLite3 available for database operations
- Git initialized in your project repository

---

## Step 1: Initialize Project (/init-project)

The `/init-project` skill sets up your project configuration and directory scaffold. This is typically run once per project.

### When to Use

- Starting a new project from scratch
- Adding Claude Code configuration to an existing codebase
- No `project.yaml` exists at the repository root

### Command

```
/init-project
```

Or for a faster setup with minimal questions:

```
/init-project --minimal
```

### What Happens

1. **Project Basics**: You'll be asked for project name, description, and repository type (single app or monorepo)
2. **Stack Configuration**: Select stack type (frontend, backend, mobile, database), framework, language, and testing framework
3. **Optional Sections**: Configure design system, data governance, or custom SME agents
4. **Constitution Generation**: Optionally create a project constitution defining vision, principles, and boundaries
5. **Beads Check**: Verifies Beads is installed; provides installation instructions if missing
6. **File Generation**: Creates configuration files and directory scaffold

### Outputs

**Files Created:**
- `project.yaml` - Main project configuration
- `.claude/CLAUDE.md` - Project instructions for Claude
- `.claude/agents/*.md` - Coding agents based on your stack (e.g., typescript-agent.md, swift-agent.md)
- `.docs/CONSTITUTION.md` - Project constitution (if created)

**Directories Created:**
- `.claude/skills/` - Workflow skills
- `.claude/agents/` - Agent definitions
- `.claude/schemas/` - JSON schemas
- `.claude/templates/` - File templates
- `.beads/` - Beads task management
- `.design/` - Design system docs (if enabled)

---

## Step 2: Discover Feature (/discover)

The `/discover` skill combines brief creation and discovery into a single streamlined flow. It captures your feature idea, assesses complexity, asks targeted questions, optionally spawns SME agents, and synthesizes a specification.

### When to Use

- You have a new feature idea to develop
- User says "I want to build...", "Add a feature for...", "We need..."
- Starting work on a significant enhancement

### Command

```
/discover
```

Or describe your feature directly:

```
I want to add user authentication with OAuth support
```

Claude will invoke `/discover` automatically.

### Complexity Levels

Parade assesses complexity to adjust the discovery depth:

| Level | Questions | SME Agents | Typical Use Case |
|-------|-----------|------------|------------------|
| `quick` | 3 essential | None (skip to spec) | Small enhancements, bug fixes |
| `standard` | 5-6 questions | Technical + Business | Most features |
| `complex` | 8+ questions | Full SME review | Large initiatives, architectural changes |

### What Happens

1. **Capture Idea**: Describe what you want to build
2. **Assess Complexity**: Claude asks if this is quick/standard/complex
3. **Batched Questions**: All questions presented at once (answer all together)
4. **SME Review** (standard/complex): Technical and business agents review your answers
5. **Synthesize Spec**: Combines all findings into a specification
6. **Present for Review**: Shows the complete spec for your approval

### Example Interaction

```
You: I want to add a way for users to track their workout progress

Claude: This sounds like a standard feature. Let me gather some details.

## Discovery: Workout Progress Tracking
Complexity: Standard Feature

Please answer these questions (all at once is fine):

**Technical**
1. How should progress data integrate with existing workout models?
2. What chart library should we use for visualizations?

**Business**
3. What time ranges should users be able to view?
4. Should progress be shareable with trainers?

**UX**
5. Walk me through the ideal user flow for viewing progress.
6. What's MVP vs future phases?

[After answers and SME review]

## Specification Ready for Review

**Workout Progress Tracking**

Description:
Enable users to view their workout history through interactive charts...

Acceptance Criteria:
- [ ] Users can view progress charts for any exercise
- [ ] Charts support daily, weekly, and monthly views
- [ ] Empty state shows helpful onboarding message

Proposed Tasks:
1. Database schema for progress tracking [agent:sql]
2. Progress API endpoint [agent:typescript]
3. Chart component implementation [agent:typescript]
4. Integration and testing [agent:test]

To approve: /approve-spec workout-progress-tracking-spec
```

---

## Step 3: Approve Specification (/approve-spec)

The `/approve-spec` skill converts an approved specification into actionable beads tasks.

### When to Use

- After reviewing the spec from `/discover`
- You're satisfied with the proposed approach
- Ready to begin implementation

### Command

```
/approve-spec <spec-id>
```

### What Happens

1. **Load Spec**: Retrieves spec from `discovery.db`, verifies status is 'review'
2. **Create Epic**: Creates a parent epic in beads for the feature
3. **Parse Tasks**: Extracts task breakdown from the spec
4. **Create Tasks**: Creates child tasks under the epic with proper descriptions
5. **Set Dependencies**: Establishes task dependencies based on the spec
6. **Assign Labels**: Adds `agent:*` labels for execution routing
7. **TDD Mode** (if enabled): Creates test tasks that block implementation tasks
8. **Close-up Task**: Creates final verification task that depends on all others
9. **Update Database**: Marks spec as approved, links to epic

### Example Output

```
## Spec Approved and Exported to Beads

Epic: bd-x7y8 - Workout Progress Tracking

Tasks created:
- bd-x7y8.1: Database schema [agent:sql]
- bd-x7y8.2: Progress API endpoint [agent:typescript] → depends on .1
- bd-x7y8.3: Chart component [agent:typescript] → depends on .2
- bd-x7y8.4: Integration testing [agent:test] → depends on .3
- bd-x7y8.final: Epic close-up checklist [agent:test] → depends on ALL

Ready work (no blockers):
- bd-x7y8.1: Database schema

To start execution: /run-tasks
```

### With TDD Mode Enabled

If your `project.yaml` has `workflow.tdd_enabled: true`:

```
Tasks created (with test-first pairing):
- bd-x7y8.1: Database schema [agent:sql]
- bd-x7y8.2t: Write tests for: Progress API [agent:test-writer]
- bd-x7y8.2: Progress API endpoint [agent:typescript] → depends on .1, .2t
- bd-x7y8.3t: Write tests for: Chart component [agent:test-writer]
- bd-x7y8.3: Chart component [agent:typescript] → depends on .2, .3t

Test/Impl Pairings:
- bd-x7y8.2t ⟷ bd-x7y8.2 (test blocks impl)
- bd-x7y8.3t ⟷ bd-x7y8.3 (test blocks impl)
```

---

## Step 4: Run Tasks (/run-tasks)

The `/run-tasks` skill orchestrates task execution through coordinated sub-agents.

### When to Use

- After `/approve-spec` has created tasks
- Ready to begin implementation
- There are open tasks in beads

### Command

```
/run-tasks              # Run all ready tasks
/run-tasks <epic-id>    # Run tasks for specific epic only
```

### What Happens

1. **Check TDD Config**: Determines if test-first gating is enabled
2. **Get Ready Work**: Queries beads for tasks with no blockers
3. **Spawn Agents**: Launches appropriate agents based on `agent:*` labels
4. **Monitor Completion**: Waits for all agents, collects results
5. **Run Verification**: Validates acceptance criteria, runs tests
6. **Update Status**: Closes successful tasks, marks failures as blocked
7. **Repeat**: Continues until no more ready work
8. **Epic Completion**: Prompts for close when all tasks done

### Agent Types

| Label | Agent | Purpose |
|-------|-------|---------|
| `agent:sql` | sql-agent | Database schema, migrations |
| `agent:typescript` | typescript-agent | TypeScript/Node implementation |
| `agent:swift` | swift-agent | iOS/Swift implementation |
| `agent:test` | test-agent | Verification, testing |
| `agent:test-writer` | test-writer-agent | Write tests (TDD RED phase) |

### Example Execution Flow

```
/run-tasks bd-x7y8

Claude: ## Starting Task Execution

Epic: bd-x7y8 - Workout Progress Tracking

### Batch 1
Spawning agents...
- bd-x7y8.1: Database schema [agent:sql]

[Agent completes]

## Batch 1 Complete
✅ bd-x7y8.1: Database schema - PASS (closed)

Newly unblocked:
- bd-x7y8.2: Progress API endpoint [agent:typescript]

### Batch 2
Spawning agents...
- bd-x7y8.2: Progress API endpoint [agent:typescript]

[Continues through all batches]

## Execution Complete

All tasks closed. Feature ready for review.

Options:
1. Close epic
2. Close with retrospective (recommended)
3. Keep open for manual review
```

---

## Step 5: Retrospective (Optional)

At the end of an epic, Parade can run a retrospective analysis to improve future work.

### When It Triggers

- Automatically offered when all epic tasks complete
- User can choose to run it or skip

### What Happens

1. **Analyze Execution**: Reviews task completion times, debug attempts, patterns
2. **Identify Improvements**: Suggests agent prompt tweaks, workflow adjustments
3. **Extract Patterns**: Documents reusable solutions found during debugging
4. **Update Knowledge Base**: Adds insights to `.claude/retrospectives/INSIGHTS.md`
5. **Close Epic**: Merges work and closes the epic

### Benefits

- **Self-improving workflow**: Each epic makes the system smarter
- **Documented patterns**: Solutions captured for future reference
- **Agent optimization**: Prompts refined based on real execution

---

## Tips and Best Practices

### General Workflow

- **Follow the sequence**: init → discover → approve → run
- **Don't skip discovery**: Even for "simple" features, discovery catches edge cases
- **Review specs carefully**: This is your last chance to adjust scope before implementation

### Discovery Phase

- **Answer thoroughly**: SME agents use your answers to make recommendations
- **Question the questions**: If a question doesn't fit, say so
- **Request custom SMEs**: For domain-specific features, add custom SME agents in project.yaml

### Spec Approval

- **Check task granularity**: Tasks should be small enough for a single agent
- **Verify dependencies**: Ensure the dependency graph makes sense
- **Consider TDD**: Enable TDD mode for better test coverage

### Task Execution

- **Monitor progress**: Watch for blocked tasks that need attention
- **Don't interrupt batches**: Let parallel tasks complete before intervening
- **Use retrospectives**: After complex epics, run retrospective analysis to improve future work

### Beads Commands Reference

```bash
# View all tasks
bd list --json

# See what's ready to work on
bd ready --json

# Check task details
bd show <task-id> --json

# View dependency tree
bd dep tree <epic-id> --json

# Manual status updates (if needed)
bd update <task-id> --status blocked
bd close <task-id>
```

---

## Troubleshooting

### "No ready work" but tasks exist

Check for dependency issues:
```bash
bd dep tree <epic-id> --json
```

Tasks may be blocked by incomplete dependencies.

### Agent task fails repeatedly

1. Check the task's acceptance criteria: `bd show <task-id>`
2. Review the agent output in `.docs/features/<epic-id>/<task-id>.md`
3. Consider breaking the task into smaller pieces

### TDD tests fail in wrong phase

- **RED phase tests pass**: Tests are too loose or don't test the right things
- **GREEN phase tests fail**: Implementation doesn't match test expectations

### Database sync issues

If `discovery.db` and beads get out of sync:
```bash
# Check spec status
sqlite3 discovery.db "SELECT id, status, exported_epic_id FROM specs;"

# Verify epic exists
bd show <epic-id>
```

---

## Next Steps

After completing this onboarding:

1. Run `/init-project` to set up your project configuration
2. Describe a feature to Claude and use `/discover`
3. Follow the workflow through approval and implementation
4. Check `/workflow-status` anytime to see current state

For detailed documentation on each skill, see the skill files in `.claude/skills/`.

---

## Related Resources

- [Beads Documentation](https://github.com/steveyegge/beads) - Task management CLI
- [Claude Code](https://claude.ai/claude-code) - Anthropic's CLI for Claude
