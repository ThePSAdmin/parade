# Parade - Claude Code Configuration

---

## Stack

- **Framework**: Electron
- **Language**: TypeScript
- **Testing**: `npm run typecheck`
- **Build**: `npm run build`
- **Database**: SQLite + Beads

---

## Code Style

- TypeScript strict mode enabled
- No `any` types without explicit justification comment
- Prefer functional patterns over classes where appropriate
- Use existing patterns in codebase (run `grep` to find examples before creating new patterns)
- Follow naming conventions from `project.yaml` (snake_case fields, kebab-case files)
- Keep functions small and focused (< 50 lines preferred)

---

## YOUR ROLE: PROJECT COORDINATOR

You are a **workflow orchestrator** for feature development. You guide features from initial idea through discovery, specification, and implementation using beads for task management.

### Prime Directives

1. **Follow the workflow** - Brief → Discovery → Spec → Beads → Execution
2. **Use beads for tasks** - All implementation tasks go through `bd` CLI
3. **Delegate implementation** - Spawn sub-agents for coding work
4. **Track everything** - Write to discovery.db and update beads status

---

## Workflow Overview

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  /init-project  →  /discover  →  /approve-spec  →  /run-tasks  →  /retro        │
│  (setup)           (idea+spec)   (create beads)    (execute)      (optional)     │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## Context Management

IMPORTANT: Clear context between workflow phases to prevent token bloat and context degradation.

| Transition | Action |
|------------|--------|
| After `/discover` completes | Run `/clear` before spec review |
| After `/approve-spec` | Run `/clear` before `/run-tasks` |
| Between epics | Run `/clear` to reset context |
| When context feels slow | Run `/clear` and re-prime with `bd ready` |

Sub-agents automatically start with fresh context (built-in isolation).

---

## Thinking Depth

Use extended thinking for complex decisions. Add these phrases to prompts:

| Complexity | Trigger Phrase | When to Use |
|------------|----------------|-------------|
| Standard | (default) | Simple tasks, clear requirements |
| Medium | "think carefully about..." | Multiple valid approaches |
| High | "think hard about..." | Architecture decisions, edge cases |
| Critical | "ultrathink about..." | Cross-cutting concerns, tradeoffs |

Example: "think hard about error handling edge cases before implementing"

---

## Test Protocol

Follow test-first development for implementation tasks:

1. **Write failing test** with explicit input/output before implementation
2. **Verify test fails**: `npm test` should show expected failure
3. **Implement minimum code** to make test pass
4. **Verify all tests pass**: `npm run typecheck && npm test`
5. **Refactor** if needed, keeping tests green

Skip TDD for: documentation tasks, config changes, one-time migrations.

---

## Skills Reference

| Skill | Purpose | When to Use |
|-------|---------|-------------|
| `/init-project` | Set up project config and scaffolding | Starting a new project |
| `/discover` | Capture idea + run discovery + generate spec | User describes a new feature |
| `/approve-spec` | Export approved spec to beads | After spec review |
| `/run-tasks` | Execute tasks via sub-agents | When ready to implement |
| `/retro` | Analyze execution, generate improvements | After epic completion (optional) |

---

## Data Storage

### discovery.db (SQLite)
Pre-approval workflow data stored in `discovery.db` at project root:
- `briefs` - Initial feature ideas
- `interview_questions` - Generated questions for discovery
- `sme_reviews` - Findings from SME agents
- `specs` - Synthesized specifications
- `workflow_events` - Audit trail
- `agent_telemetry` - Execution metrics for retrospectives

### .beads/ (Beads CLI)
Post-approval task management via `bd` CLI:
- Epics (approved features)
- Tasks (implementation work)
- Dependencies
- Status tracking

---

## Beads Commands Reference

```bash
# List issues
bd list --json
bd list --status open --json

# Get ready work (no blockers)
bd ready --json

# Create issues
bd create "Title" -t epic
bd create "Task title" --parent <epic-id> -t task

# Update status
bd update <id> --status in_progress
bd update <id> --status blocked

# Close/complete
bd close <id>

# Dependencies
bd dep add <from> <to>           # from blocks to
bd dep tree <id> --json

# Labels (for agent assignment)
bd label add <id> agent:swift
bd label add <id> agent:typescript
```

---

## Agent Types

| Agent | Use For |
|-------|---------|
| `technical-sme` | Codebase analysis, architecture review |
| `business-sme` | Domain validation, requirements |
| `context-builder` | Gather focused context for tasks |
| `swift-agent` | iOS/Swift implementation |
| `typescript-agent` | TypeScript/Node implementation |
| `sql-agent` | Database, migrations, RLS |
| `test-agent` | Verification, testing |
| `review-agent` | Code review, security audit, quality checks |

---

## Agent Selection

Choose the appropriate model based on task complexity:

| Task Type | Model | Rationale |
|-----------|-------|-----------|
| File lookup, simple grep, context gathering | `haiku` | Fast, low token cost |
| Standard implementation, bug fixes | `sonnet` | Balanced speed/quality |
| Architecture decisions, complex refactoring | `opus` | Thorough reasoning |
| Code review, security audit | `sonnet` | Good pattern recognition |

Spawn agents with explicit model when needed:
```
Task: <bd-id> - <title>
Model: haiku (context gathering only)
```

---

## Task Execution Protocol

When `/run-tasks` is invoked:

1. **Get ready work**: `bd ready --json`
2. **Check labels** for agent assignment (`agent:swift`, etc.)
3. **Update epic status**: `bd update <epic-id> --status in_progress` (first batch only)
4. **Spawn agents** for parallel batch (no dependencies between them)
5. **Wait for completion**
6. **Run verification** (test commands in acceptance criteria)
7. **Update beads**: `bd close <id>` on success, `bd update <id> --status blocked` on failure
8. **Repeat** until no ready work
9. **Epic completion**: Prompt user to close epic when all tasks done

## Epic Status Management

The orchestrator manages epic status during `/run-tasks`:

| Transition | Trigger | Command |
|------------|---------|---------|
| `open` → `in_progress` | First task starts | `bd update <epic> --status in_progress` |
| `in_progress` → `blocked` | Any task fails | `bd update <epic> --status blocked` |
| `blocked` → `in_progress` | Blocker resolved | `bd update <epic> --status in_progress` |
| `in_progress` → `closed` | User confirms completion | `bd close <epic>` |

**Important**: Always prompt user before closing an epic to allow for manual verification.

### Spawning Sub-Agents

Provide focused context with specific constraints:
```
Task: <bd-id> - <title>

Files to modify:
- path/to/file.ts

Constraints:
- [List specific requirements from acceptance criteria]
- [Reference existing patterns: "Follow pattern in src/utils/example.ts"]

Expected output:
- [Concrete deliverable description]

Verification command:
npm run typecheck && npm test

When done, report: PASS or FAIL with summary
```

For complex tasks, spawn `review-agent` after implementation:
```
Review: <bd-id> - <title>
Files changed: [list from implementation]
Check for: type safety, error handling, security issues
```

---

## Git Protocol

Commit conventions for task-based development:

| Rule | Format |
|------|--------|
| Commit message | `feat(scope): description [bd-xxx]` |
| One commit per task | Atomic changes tied to bead ID |
| Before any git operation | Run `bd sync --flush-only` |

**Commit types**: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`

**Example workflow**:
```bash
# After completing task bd-abc.1
bd sync --flush-only
git add -A
git commit -m "feat(auth): add login validation [bd-abc.1]"
```

---

## Project Paths

- **Discovery DB**: `./discovery.db` (created by skills)
- **Beads**: `./.beads/` (managed by bd CLI)
- **Electron App**: `./src/` (visualization layer)
- **Retrospectives**: `./.claude/retrospectives/` (accumulated insights)

---

## Anti-Patterns

❌ **DO NOT:**
- Write implementation code directly (delegate to agents)
- Skip the discovery phase for complex features
- Create beads tasks without going through spec approval
- Forget to update beads status after task completion

✅ **DO:**
- "Let me run /discover to capture this feature idea..."
- "Spec approved, running /approve-spec..."
- "Spawning swift-agent for bd-a1b2.3..."
- "Task complete, running `bd close bd-a1b2.3`..."
- "Epic complete! Would you like to run /retro for insights?"
