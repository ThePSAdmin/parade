---
name: discover
description: Unified discovery flow that captures a feature idea, automatically explores the codebase, assesses complexity, and produces a spec. Uses explore agents to gather technical context before asking user questions.
---

# Discover Skill

## Purpose

Transform a user's feature idea into a detailed specification through an intelligent discovery flow. This skill **automatically explores the codebase** to gather technical context, **auto-assesses complexity**, and only asks the user questions that couldn't be answered through exploration.

## When to Use

- User says "I want to build...", "Add a feature for...", "We need..."
- User describes a new capability or enhancement
- Starting a new project or significant feature
- User explicitly invokes `/discover`

---

## Complexity Levels

| Level | Auto-Assessment Criteria | User Questions | Typical Use Case |
|-------|-------------------------|----------------|------------------|
| `quick` | 1-3 files, single component, no new patterns | 1-2 confirmation | Small enhancements, bug fixes, config changes |
| `standard` | 4-10 files, new component or pattern, single subsystem | 3-4 targeted | Most features, new functionality |
| `complex` | 10+ files, multiple subsystems, architectural changes | 5-6 strategic | Large initiatives, cross-cutting concerns |

---

## Process

### Step 0: Path Detection

Determine the location of discovery.db to support both new `.parade/` structure and legacy project root:

```bash
# Path detection for .parade/ structure
if [ -f ".parade/discovery.db" ]; then
  DISCOVERY_DB=".parade/discovery.db"
else
  DISCOVERY_DB="./discovery.db"
fi
```

All subsequent database operations in this skill use `$DISCOVERY_DB` instead of hardcoded `discovery.db`.

### Step 1: Capture Initial Idea

If the user hasn't already described their feature, ask them to describe:
- **What** they want to build
- **Why** they need it (problem being solved)

If the user provided the idea with the `/discover` command, proceed directly to exploration.

### Step 2: Automatic Codebase Exploration (NEW)

**CRITICAL**: Before asking any questions, spawn an explore agent to gather technical context.

**Spawn Explore Agent:**
```
Task: Technical exploration for feature "<feature-title>"

Feature Description:
<user's feature description>

Exploration Goals:
1. Find existing code related to this feature area
2. Identify files that would need modification
3. Discover existing patterns, components, and utilities to reuse
4. Assess technical complexity and risks
5. Note any existing similar functionality

Search Strategy:
- Search for keywords from the feature description
- Look for related components, stores, services, routes
- Check for existing UI patterns that could be extended
- Identify data models and persistence mechanisms involved

Output Format (JSON):
{
  "related_files": ["path/to/file1.ts", ...],
  "estimated_files_to_modify": ["path/to/file.ts", ...],
  "existing_patterns": {
    "components": ["ComponentName", ...],
    "stores": ["storeName", ...],
    "utilities": ["utilityName", ...]
  },
  "reusable_code": [
    {"file": "path/to/file.ts", "what": "description of reusable element"}
  ],
  "complexity_indicators": {
    "files_affected": <number>,
    "subsystems_touched": ["ui", "api", "database", ...],
    "new_patterns_needed": <boolean>,
    "security_implications": <boolean>,
    "data_persistence": <boolean>
  },
  "technical_findings": "Summary of what was discovered...",
  "recommended_approach": "High-level technical approach based on findings...",
  "open_questions": ["Questions that couldn't be answered from code..."]
}
```

### Step 3: Automatic Complexity Assessment (NEW)

Based on exploration findings, automatically determine complexity:

**Quick Enhancement** (auto-assign if ALL true):
- `files_affected` <= 3
- `subsystems_touched` has 1 entry
- `new_patterns_needed` is false
- `security_implications` is false

**Standard Feature** (auto-assign if ANY true):
- `files_affected` between 4-10
- `subsystems_touched` has 2 entries
- `new_patterns_needed` is true
- OR doesn't meet quick criteria but not complex

**Complex Initiative** (auto-assign if ANY true):
- `files_affected` > 10
- `subsystems_touched` has 3+ entries
- `security_implications` is true AND `data_persistence` is true
- Significant architectural changes indicated

**Present Assessment to User:**
```
## Discovery: <feature-title>

### Codebase Exploration Complete

**Complexity Assessment:** <quick|standard|complex>

**Technical Findings:**
<technical_findings from exploration>

**Files Likely to Change:**
- <list from estimated_files_to_modify>

**Existing Patterns to Reuse:**
- <components, stores, utilities found>

**Recommended Approach:**
<recommended_approach from exploration>

---

<If quick>
This looks straightforward. I just need to confirm a few things:
1. [confirmation question based on open_questions]
2. Anything else I should know?

<If standard>
I have a good technical picture. A few questions to finalize the spec:
1. [targeted question from open_questions]
2. [UX/business question]
3. What's the success criteria?

<If complex>
This is a significant undertaking. Let me ask some strategic questions:
1. [architectural question from open_questions]
2. [scope/phasing question]
3. [risk mitigation question]
4. What are the must-haves vs nice-to-haves?
```

### Step 4: Generate Brief ID

Create a kebab-case ID from the title:
```
"Add athlete experience tracking" -> "athlete-experience-tracking"
```

### Step 5: Initialize Database and Create Brief

Run schema migration and insert brief with exploration results:

```bash
# Ensure tables exist with exploration_results column
sqlite3 "$DISCOVERY_DB" "
CREATE TABLE IF NOT EXISTS briefs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  problem_statement TEXT,
  initial_thoughts TEXT,
  priority INTEGER DEFAULT 2,
  complexity_level TEXT DEFAULT 'standard',
  exploration_results TEXT,
  status TEXT DEFAULT 'draft',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT,
  exported_epic_id TEXT
);

-- Migrations (idempotent)
ALTER TABLE briefs ADD COLUMN complexity_level TEXT DEFAULT 'standard';
ALTER TABLE briefs ADD COLUMN exploration_results TEXT;
" 2>/dev/null || true

# Insert the brief with exploration results
sqlite3 "$DISCOVERY_DB" "INSERT INTO briefs (id, title, problem_statement, initial_thoughts, priority, complexity_level, exploration_results, status)
VALUES ('<brief-id>', '<title>', '<problem>', '<initial_thoughts>', <priority>, '<complexity_level>', '<exploration_json>', 'in_discovery');"
```

### Step 6: Present Targeted Questions

Questions are now **targeted based on exploration findings**. Only ask what couldn't be determined from code:

#### Quick (1-2 confirmations)
```
## Discovery: <brief-title>
Complexity: Quick Enhancement

Based on my exploration, I found:
- <key finding 1>
- <key finding 2>

Just need to confirm:
1. <specific confirmation from open_questions>
2. Anything else I should know about this change?
```

#### Standard (3-4 targeted questions)
```
## Discovery: <brief-title>
Complexity: Standard Feature

Based on my exploration:
- Files to modify: <list>
- Existing patterns to reuse: <list>
- Recommended approach: <summary>

A few questions to finalize:
1. <open question from exploration>
2. Who are the primary users and what's their workflow?
3. How will we verify this works correctly?
4. What's in MVP vs future phases? (if applicable)
```

#### Complex (5-6 strategic questions)
```
## Discovery: <brief-title>
Complexity: Complex Initiative

Based on my exploration:
- Scope: <number> files across <subsystems>
- Key challenges: <from exploration>
- Recommended approach: <summary>

Strategic questions:
1. <architectural question from open_questions>
2. <another open question>
3. Who are all the stakeholders affected?
4. What are the must-haves vs nice-to-haves for MVP?
5. What's the rollout/migration strategy?
6. Any compliance or security requirements I should know about?
```

### Step 7: Record Answers

Store questions and answers in the database:

```sql
-- Ensure table exists
CREATE TABLE IF NOT EXISTS interview_questions (
  id TEXT PRIMARY KEY,
  brief_id TEXT REFERENCES briefs(id),
  question TEXT NOT NULL,
  category TEXT,
  answer TEXT,
  answered_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Insert all questions with answers
INSERT INTO interview_questions (id, brief_id, question, category, answer, answered_at, created_at)
VALUES
  ('<brief-id>-q1', '<brief-id>', 'Question 1...', 'technical', '<answer1>', datetime('now'), datetime('now')),
  ('<brief-id>-q2', '<brief-id>', 'Question 2...', 'business', '<answer2>', datetime('now'), datetime('now')),
  ...;
```

### Step 8: SME Review (Based on Complexity)

**Note:** The initial explore agent (Step 2) already gathered significant technical context. SME review now focuses on **validation and additional analysis**, not discovery.

#### Quick -> Skip SME, proceed directly to Step 9

For quick enhancements, the exploration findings are sufficient. Skip SME agents.

#### Standard -> Optional Technical SME for Validation

Only spawn Technical SME if exploration found:
- Complex integration points
- Security-sensitive areas
- Performance concerns

**Technical SME Agent (if needed):**
```
Task: Validate technical approach for brief '<brief-id>'

Exploration Already Found:
<exploration_results JSON from brief>

Interview Answers:
<from interview_questions table>

Focus On:
1. Validate the recommended approach from exploration
2. Identify any risks the exploration missed
3. Confirm pattern recommendations are appropriate
4. Flag any additional concerns

Output: Write validation to sme_reviews table with agent_type = 'technical-sme'
```

#### Complex -> Full SME Review + Custom Agents

For complex initiatives, spawn SME agents to validate and expand on exploration:

**Technical SME Agent:**
```
Task: Deep technical review for brief '<brief-id>'

Exploration Found:
<exploration_results JSON>

Additional Analysis Needed:
1. Validate architectural approach
2. Identify cross-cutting concerns
3. Assess migration/rollout risks
4. Review security implications

Output: Write findings to sme_reviews table
```

**Business SME Agent:**
```
Task: Business review for brief '<brief-id>'

Context:
- Exploration results and interview answers from $DISCOVERY_DB

Analyze:
1. Validate requirements completeness
2. Check for missing stakeholder considerations
3. Identify business risks
4. Confirm success metrics are measurable

Output: Write findings to sme_reviews table with agent_type = 'business-sme'
```

**Custom Agents (if defined in project.yaml):**
```bash
if [ -f "project.yaml" ]; then
  # Parse agents.custom[] array
  # For each custom agent, spawn with their prompt_file
fi
```

Insert SME reviews:
```sql
CREATE TABLE IF NOT EXISTS sme_reviews (
  id TEXT PRIMARY KEY,
  brief_id TEXT REFERENCES briefs(id),
  agent_type TEXT NOT NULL,
  findings TEXT,
  recommendations TEXT,
  concerns TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

INSERT INTO sme_reviews (id, brief_id, agent_type, findings, recommendations, concerns, created_at)
VALUES ('<brief-id>-tech-review', '<brief-id>', 'technical-sme', '<findings>', '<recommendations>', '<concerns>', datetime('now'));
```

### Step 8a: Load Design Registries (Pattern Reuse)

Before synthesizing the spec, load existing patterns to ensure consistency:

```bash
# Load existing components, fields, and patterns
COMPONENTS_FILE=".design/Components.md"
FIELDS_FILE=".design/Fields.md"
PATTERNS_FILE=".design/Patterns.md"

# Extract key sections for context
if [ -f "$COMPONENTS_FILE" ]; then
  # Get list of documented components
  AVAILABLE_COMPONENTS=$(grep -E "^### " "$COMPONENTS_FILE" | sed 's/### //' | head -20)
fi

if [ -f "$FIELDS_FILE" ]; then
  # Get list of documented fields/enums
  AVAILABLE_FIELDS=$(grep -E "^\| \`" "$FIELDS_FILE" | sed 's/| `//' | cut -d'`' -f1 | head -30)
fi

if [ -f "$PATTERNS_FILE" ]; then
  # Get list of documented patterns
  AVAILABLE_PATTERNS=$(grep -E "^### " "$PATTERNS_FILE" | sed 's/### //' | head -20)
fi
```

**Present available patterns during spec synthesis:**

When generating the spec's design notes and task breakdown, reference existing patterns:

```
Available Components (from .design/Components.md):
- Button, Card, Badge, Input, Select, Dialog, Tabs, Toast, ...

Available Fields (from .design/Fields.md):
- id, created_at, updated_at, status, priority, title, description, ...
- Enums: IssueStatus, IssueType, BriefStatus, Priority, ...

Available Patterns (from .design/Patterns.md):
- Zustand Store Pattern, IPC Handler Pattern, useEffect Data Loading, ...
```

**Spec should reference existing patterns where applicable:**
- Use existing components rather than creating new ones
- Reuse field naming conventions and existing enums
- Follow documented patterns for state management, data fetching, etc.

Only propose NEW components/fields/patterns when existing ones don't fit the requirement.

### Step 9: Synthesize Spec

Create specification from discovery findings:

```sql
CREATE TABLE IF NOT EXISTS specs (
  id TEXT PRIMARY KEY,
  brief_id TEXT REFERENCES briefs(id),
  title TEXT NOT NULL,
  description TEXT,
  acceptance_criteria TEXT,
  design_notes TEXT,
  task_breakdown TEXT,
  status TEXT DEFAULT 'draft',
  approved_at TEXT,
  exported_epic_id TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

INSERT INTO specs (id, brief_id, title, description, acceptance_criteria, design_notes, task_breakdown, status, created_at)
VALUES (
  '<brief-id>-spec',
  '<brief-id>',
  '<spec title>',
  '<detailed description>',
  '<JSON array of acceptance criteria>',
  '<technical design notes from SME or user answers>',
  '<JSON array of proposed tasks>',
  'review',
  datetime('now')
);
```

Update brief status:
```sql
UPDATE briefs SET status = 'spec_ready', updated_at = datetime('now') WHERE id = '<brief-id>';
```

### Step 10: Present Spec for Review

```
## Specification Ready for Review

### <Spec Title>
**Complexity:** <quick|standard|complex>

**Description:**
<description>

**Acceptance Criteria:**
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

**Design Notes:**
<technical approach from SME review or derived from answers>

**Patterns & Components:**
*Existing (from registries):*
- Components: Card, Badge, Button (from .design/Components.md)
- Fields: status, priority, created_at (from .design/Fields.md)
- Patterns: Zustand Store, IPC Handler (from .design/Patterns.md)

*New (will be added by /evolve):*
- Component: <NewComponentName> - <brief description>
- Field: <new_field_name> - <type and purpose>
- Pattern: <NewPattern> - <what it does>

**Proposed Tasks:**
1. Task 1: <description> [agent:sql]
2. Task 2: <description> [agent:typescript]
3. Task 3: <description> [agent:swift]

**Dependencies:**
- Task 3 depends on Task 1, Task 2

---

To approve and create beads tasks: /approve-spec <brief-id>-spec
To request changes: Tell me what to revise
```

**Note:** New components, fields, and patterns will be captured by `/evolve` at epic completion and added to the registries for future reuse.

---

## Schema Migration

When running `/discover`, ensure the database schema includes the `complexity_level` and `exploration_results` columns:

```sql
-- Create briefs table if not exists (includes exploration_results)
CREATE TABLE IF NOT EXISTS briefs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  problem_statement TEXT,
  initial_thoughts TEXT,
  priority INTEGER DEFAULT 2,
  complexity_level TEXT DEFAULT 'standard',
  exploration_results TEXT,
  status TEXT DEFAULT 'draft',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT,
  exported_epic_id TEXT
);

-- Migrations for existing databases (idempotent)
ALTER TABLE briefs ADD COLUMN complexity_level TEXT DEFAULT 'standard';
ALTER TABLE briefs ADD COLUMN exploration_results TEXT;
```

For idempotent migration in bash:
```bash
sqlite3 "$DISCOVERY_DB" "ALTER TABLE briefs ADD COLUMN complexity_level TEXT DEFAULT 'standard';" 2>/dev/null || true
sqlite3 "$DISCOVERY_DB" "ALTER TABLE briefs ADD COLUMN exploration_results TEXT;" 2>/dev/null || true
```

---

## Workflow Events

Log key events throughout the process:

```sql
CREATE TABLE IF NOT EXISTS workflow_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  brief_id TEXT,
  event_type TEXT,
  details TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

INSERT INTO workflow_events (brief_id, event_type, details) VALUES
  ('<brief-id>', 'discover_started', '{}'),
  ('<brief-id>', 'exploration_started', '{}'),
  ('<brief-id>', 'exploration_complete', '{"files_found": <n>, "complexity_assessed": "<level>"}'),
  ('<brief-id>', 'questions_presented', '{"count": <n>, "complexity": "<level>"}'),
  ('<brief-id>', 'answers_recorded', '{}'),
  ('<brief-id>', 'sme_review_started', '{"agents": ["technical-sme"]}'),  -- if applicable
  ('<brief-id>', 'sme_review_complete', '{}'),  -- if applicable
  ('<brief-id>', 'spec_generated', '{"spec_id": "<brief-id>-spec"}');
```

---

## Example Interactions

### Quick Enhancement Example

**User:** I want to change the default sort order in the task list from ascending to descending

**Claude:** Let me explore the codebase to understand the current implementation...

*[Spawns explore agent]*

**Claude:**
```
## Discovery: default-sort-order-change

### Codebase Exploration Complete

**Complexity Assessment:** Quick Enhancement

**Technical Findings:**
Found TaskList.tsx with a `sortDirection` state initialized to 'asc' on line 45.
The component uses a simple toggle pattern.

**Files to Change:**
- src/renderer/components/TaskList.tsx (1 file)

**Existing Patterns:**
- Uses standard useState for sort state
- No persistence currently (resets on refresh)

**Recommended Approach:**
Change the default value of `sortDirection` from 'asc' to 'desc' in the useState call.

---

This is straightforward. Just need to confirm:
1. Should the preference persist across sessions, or is resetting on refresh OK?
2. Anything else I should know?
```

**User:**
1. Resetting is fine for now
2. No, that's all

**Claude:** [Generates spec directly, no SME agents]

### Standard Feature Example

**User:** We need to add a way for users to filter tasks by label

**Claude:** Let me explore the codebase to understand the label system and filtering patterns...

*[Spawns explore agent]*

**Claude:**
```
## Discovery: task-label-filter

### Codebase Exploration Complete

**Complexity Assessment:** Standard Feature

**Technical Findings:**
- Labels are stored in the `labels` field on tasks (array of strings)
- TaskList.tsx already has filtering for status, could extend pattern
- FilterBar.tsx component exists with status/priority dropdowns
- beadsStore.ts has `getTasksByStatus()` - could add similar `getTasksByLabel()`

**Files Likely to Change:**
- src/renderer/components/FilterBar.tsx (add label dropdown)
- src/renderer/components/TaskList.tsx (apply label filter)
- src/renderer/store/beadsStore.ts (add filter helper)

**Existing Patterns to Reuse:**
- FilterBar dropdown pattern (already has status/priority)
- Store filter methods pattern

**Recommended Approach:**
1. Add `selectedLabels` state to FilterBar
2. Create multi-select label dropdown (reuse existing dropdown styling)
3. Add `getTasksByLabels()` to beadsStore
4. Wire filter to TaskList

---

I have a good technical picture. A few questions to finalize:

1. Should this be single-select or multi-select (filter by multiple labels)?
2. Who primarily uses labels - is this for power users or everyone?
3. How will we verify this works correctly?
```

**User:**
1. Multi-select - users should filter by multiple labels
2. Everyone uses labels, it's a core workflow
3. Filter by 2+ labels and verify only matching tasks show

**Claude:** [Generates spec, no additional SME needed - exploration was thorough]

### Complex Initiative Example

**User:** We need to add user authentication with role-based permissions

**Claude:** Let me explore the codebase to understand the current architecture...

*[Spawns explore agent]*

**Claude:**
```
## Discovery: user-authentication-rbac

### Codebase Exploration Complete

**Complexity Assessment:** Complex Initiative

**Technical Findings:**
- Currently no auth - app assumes single user
- Electron main process has no session management
- All IPC handlers are unprotected
- Database has no user_id foreign keys
- 15+ API routes would need auth middleware

**Scope:**
- 20+ files across main process, renderer, and server
- Touches: auth, database, API, UI

**Key Challenges:**
- Need to retrofit user_id to existing data models
- Migration strategy for existing data
- Session management in Electron context
- Role definitions and permission checks

**Recommended Approach:**
Multi-phase rollout:
1. Add User model and auth service
2. Add middleware to IPC/API routes
3. Retrofit existing models with user_id
4. Add role-based permission checks
5. Update UI for multi-user

---

This is a significant undertaking. Strategic questions:

1. What authentication method? (local passwords, OAuth, SSO?)
2. What roles do you need? (admin, member, viewer?)
3. What's the migration plan for existing data?
4. What are must-haves vs nice-to-haves for MVP?
5. Any compliance requirements (SOC2, GDPR)?
6. Timeline/phasing preferences?
```

**User:** [Provides answers to strategic questions]

**Claude:** [Spawns Technical SME + Business SME for validation, then generates spec]

---

## Output

After successful execution:
- Brief record in `$DISCOVERY_DB` with `complexity_level` and `exploration_results` set
- Exploration findings stored as JSON in brief
- Interview questions and answers recorded (only questions that couldn't be answered by exploration)
- SME reviews in `sme_reviews` table (for complex only, optional for standard)
- Spec in `specs` table with status 'review'
- Brief status updated to 'spec_ready'
- User presented with spec for approval

---

## Key Improvements (Explore-First Flow)

| Aspect | Previous Flow | New Explore-First Flow |
|--------|---------------|------------------------|
| First step | Ask user for complexity | Auto-explore codebase |
| Complexity | User-assessed | Auto-assessed from exploration |
| Technical questions | Asked to user | Answered by exploration |
| User questions | 3-10 depending on complexity | Only what exploration couldn't answer |
| SME agents | Required for standard/complex | Optional - exploration often sufficient |
| Time to spec | Multiple rounds of Q&A | Single round after exploration |

### Benefits

1. **Reduced user burden** - Technical questions answered automatically
2. **Better accuracy** - Complexity based on actual code analysis, not user estimate
3. **Faster specs** - Exploration provides most context upfront
4. **Smarter questions** - Only ask what the code can't tell us
5. **Consistent quality** - Same exploration depth regardless of user expertise
