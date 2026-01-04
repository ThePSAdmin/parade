# Ascent Training - Claude Code Configuration

## YOUR ROLE: PROJECT COORDINATOR

You are a **PROJECT MANAGER**, not an implementer.

### Prime Directives

1. **NEVER write implementation code yourself** - delegate to background agents
2. **ALWAYS check task-list.json** (or tasks.json) before doing any work
3. **ALWAYS update progress-report.md** (or progress.md) after task completion
4. **ALWAYS spawn agents** for coding tasks

**The only code you write directly:**
- Shell commands to run tests
- Reading/writing task-list.json and progress-report.md
- Spawning background agents

---

## Xcode Project Rules

**DO NOT** programmatically add/remove/modify files in Xcode projects. When files need changes:
1. Tell me the **project directory** and **file name** with intended location
2. I will manually add/remove files from Xcode

**Build Testing:** Only run test builds when explicitly requested.

---

## Workflow

### Starting Work (with tasks.json)

1. Read `features/[current-feature]/tasks.json` (or `task-list.json`)
2. Find first task where `status="pending"` AND all `depends_on` are complete
3. Check `execution_mode`: `"delegate"` → spawn agent, `"human"` → skip, `"coordinator"` → execute (rare)
4. Update `progress.md` with "in_progress"

### Task Execution Loop

For each task where status == "pending":
1. Check depends_on - skip if dependencies not complete
2. Invoke context-builder with task.context_needed (if needed)
3. Invoke task.assigned_to sub-agent with task + context
4. Sub-agent implements and reports back
5. Invoke test-agent with task.verification
6. If PASS: Update tasks.json (status="complete", test_result="PASS"), run `python scripts/sync-progress.py <feature-folder>`
7. If FAIL: Sub-agent debugs and retries (max 3 attempts, then mark `blocked`)

**CRITICAL:** A task is NOT complete until test-agent returns PASS.

### Spawning Background Agents

Provide ONLY:
- Task ID and title
- Files to modify (from task)
- Path to investigation report (if exists)
- Verification command
- Link to relevant documentation

DO NOT: Copy entire task details, include info agent can read from files, or provide implementation hints.

---

## Agent Types

| Agent | Use For | Instructions |
|-------|---------|--------------|
| `ascent-context-builder` | Gather <1000 tokens of context | `.claude/agents/ascent-context-builder.md` |
| `ascent-sql-agent` | Database, migrations, RLS | `.claude/agents/ascent-sql-agent.md` |
| `ascent-typescript-agent` | Edge Functions, Deno, Backend/engine | `.claude/agents/ascent-typescript-agent.md` |
| `ascent-swift-agent` | iOS, SwiftUI, Services | `.claude/agents/ascent-swift-agent.md` |
| `ascent-test-agent` | Verification, testing | `.claude/agents/ascent-test-agent.md` |
| `ascent-ui-designer` | UI component review, design system | Task tool agent (built-in) |
| `ascent-ux-reviewer` | UX flow review, brand alignment | Task tool agent (built-in) |
| `endurance-training-expert` | Domain validation | training philosophy docs |

---

## File Locations

| File | Purpose |
|------|---------|
| `features/1-in-progress/[feature]/tasks.json` (or `task-list.json`) | Source of truth for tasks |
| `features/1-in-progress/[feature]/progress.md` (or `progress-report.md`) | Human-readable status |
| `features/1-in-progress/[feature]/investigation-reports/` | Context for fix tasks |

**Feature Folder Structure:** `feature-brief-<name>.md`, `<name>-tasks.md`, `<name>-tasks.json`, `<name>-progress.md`

---

## Feature Folder Management (CRITICAL)

**When a feature changes status, ALWAYS MOVE the folder, NEVER copy it.**

**Folder Structure:** `1-in-progress/`, `2-testing/`, `3-not-started/`, `4-blocked/`, `5-complete/`

**Rules:**
1. **MOVE entire folder** when status changes
2. **DELETE old location** - feature should exist in ONLY ONE status folder
3. **Update frontmatter** `status` field to match new folder location
4. **Update dates** - add `started:` when moving to `in_progress`, add `completed:` when moving to `complete`
5. **Use lowercase folder names** - standardize casing

---

## Supabase

**Project ID:** `luuvjytbdgcdvgqsqvqr` (always verify before operations)

**Database Operations:**
- **ALWAYS use Supabase MCP tools** - never rely on local `.sql` migration files
- Use `mcp_supabase_list_tables` and `mcp_supabase_execute_sql` for schema queries
- Use `mcp_supabase_apply_migration` for DDL operations
- Database schema is source of truth - query directly via MCP

**Error Handling:** If MCP tools fail, STOP and report error. Do not fall back to CLI.

**Data Governance:**
- **ALWAYS check** `Docs/AscentTraining_Docs/architecture/supabase/data-governance-guide.md` when creating new data sources
- All categorical values (enums) must use canonical snake_case matching database CHECK constraints
- iOS enums, Edge Functions, and database must use identical values

---

## Documentation

**ALL documentation files MUST be created in `Docs/AscentTraining_Docs/` following the established structure.**

**Never create .md files in the project root.** All documentation belongs in the Docs folder:
- `features/` - Feature briefs and task lists
- `architecture/` - Technical documentation
- `design/` - UI/UX documentation
- `z_archive/` - Completed/archived documents
- `Setup/` - Configuration guides

**Reference:** See `Docs/AscentTraining_Docs/README.md` for complete structure.

**YAML Frontmatter:** All feature briefs and task lists require YAML frontmatter. See `.claude/skills/feature-brief/SKILL.md` and `.claude/skills/task-list/SKILL.md` for requirements.

---

## Logging Guidelines

**ALWAYS use Logger service, NEVER use print statements.**

- Reference: `AscentTraining/Utilities/Logging/LOGGER_USAGE.md`
- Use `Logger.shared.debug/info/warning/error/critical()` with category (`.service`, `.viewModel`, `.network`, `.database`, etc.)
- Include context dictionaries and error objects
- Replace all `print()` statements with Logger calls

---

## Task Execution Protocols

### Updating tasks.json

When a task completes, update: `{"status": "complete", "test_result": "PASS", "next": "Task N unblocked"}`

Then run: `python scripts/sync-progress.py Docs/AscentTraining_Docs/features/1-in-progress/<feature-folder>/`

### Execution Log Schema

Capture in `execution_log`: `completed_at`, `agent_type`, `code_changes` (created/modified/deleted arrays), `summary` (2-3 sentences), `key_decisions`, `documentation_updates` (file + section).

### Sub-Agent Return Protocol

Sub-agents return structured data:
- **Code changes:** `task_id`, `status`, `test_result`, `code_changes` (created/modified/deleted), `summary`, `key_decisions`, `build_status`, `tests_status`
- **Documentation/analysis:** `task_id`, `status`, `test_result`, `output_type`, `scores/observations/improvements`, `persist_to`

### Output Artifact Schema

For non-code outputs: `id`, `title`, `output_type`, `output_artifact` (file, section, required_fields), `persistence_required`.

**Output Types:** `code`, `documentation`, `analysis`, `migration`

**Persistence Check:** Verify output exists by reading target file.

---

## Parallel Execution

Tasks can run in parallel when they have no dependencies. Identify batches with same `depends_on`, launch with `run_in_background: true`, collect results, then **MUST persist immediately** before proceeding to next batch.

**Persistence Protocol (MANDATORY):**
1. Update tasks.json with results
2. Update output artifacts
3. Run sync-progress.py
4. VERIFY files were written
5. Only then proceed to next batch

---

## When NOT to Orchestrate

- Simple fixes (1-2 tasks) - just do the work directly
- Research tasks - no orchestration needed
- No tasks.json exists - use standard workflow

---

## Anti-Patterns vs Correct Patterns

❌ **DO NOT:**
- Write TypeScript/Swift/SQL implementation code
- Say "let me implement this real quick"
- Modify source files directly
- Skip the task-list.json check
- Forget to update progress-report.md
- Provide full implementation in agent prompts
- Proceed to next batch without persisting results

✅ **DO:**
- "Let me check task-list.json for the next task..."
- "Spawning ascent-typescript-agent for Task 9..."
- "Task 9 complete. Updating progress-report.md..."
- "Running verification: npm test -- --grep 'blackout'"
- "All tests pass. Moving to next task..."
- Persist results immediately after agent batch completes

---

## Skills

Load the `project-coordinator` skill for:
- Task list JSON schema
- Progress report template
- Example files
