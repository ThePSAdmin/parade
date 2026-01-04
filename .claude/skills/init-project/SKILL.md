---
name: init-project
description: Initialize a new project with guided configuration wizard. Creates project.yaml at repository root along with full directory scaffold (.claude/, .beads/, .design/). Supports single app and monorepo configurations. Use when setting up a new project or adding configuration to an existing one.
---

# Init Project Skill

## Purpose

Guide users through project configuration with progressive disclosure: capture essential project info, configure primary stack, optionally add design system and custom SME agents, then generate `project.yaml` and create directory scaffold.

## When to Use

- Starting a new project from scratch
- Adding Claude Code configuration to an existing codebase
- User says "init project", "set up project", "configure this project"
- No `project.yaml` exists at repository root
- **Enhancing an existing project.yaml** with scaffolding, agents, and design docs

## Arguments

```
/init-project [--minimal]
```

- `--minimal`: Skip optional sections, only ask required questions (6 questions, ~3-4 minutes)

---

## Auto-Detection Mode

When the skill starts, it checks for an existing `project.yaml` with pre-filled values. This allows projects that already have basic configuration to skip redundant questions and proceed directly to scaffolding enhancements.

### Step 0: Check for Existing Configuration

Before starting the wizard, check if project.yaml exists and parse its contents:

```bash
if [ -f "project.yaml" ]; then
  # Parse existing config
  # Skip questions for pre-filled sections
  # Inform user: "Detected existing project.yaml with pre-filled values"
fi
```

### Detection Logic

Read `project.yaml` and check for the following pre-filled sections:

| YAML Path | If Present | Action |
|-----------|------------|--------|
| `project.name` | Has non-empty value | Skip project name question (Phase 1.1) |
| `project.description` | Has non-empty value | Skip project description question (Phase 1.2) |
| `stacks` | Section exists with framework/language | Skip stack selection (Phase 2) |
| `vision.purpose` | Has non-empty value | Skip vision/purpose question (Phase 8.2) |
| `vision.target_users` | Has non-empty value | Skip target users question (Phase 8.2) |
| `vision.core_principles` | Has non-empty array/value | Skip core principles question (Phase 8.2) |
| `vision.boundaries` | Has non-empty array/value | Skip technical boundaries question (Phase 8.2) |
| `vision.success_metrics` | Has non-empty array/value | Skip success metrics question (Phase 8.2) |

### Display Detected Configuration

When existing config is found with values, display:

```
Detected existing project.yaml with:
- Project name: <name>
- Description: <description>
- Stack: <stack type> / <framework> / <language>
- Vision: <defined | not defined>
- [other pre-filled values]

Proceeding with scaffolding enhancements...
```

### Auto-Detection Workflow

1. **Read project.yaml** using Read tool
2. **Parse YAML** to identify pre-filled sections
3. **Store detected values** in wizard state
4. **Display summary** of what was detected
5. **Skip corresponding questions** in subsequent phases
6. **Proceed to enhancements** - create directories, agents, design docs, etc.

### Example: Partially Pre-filled Config

Given this existing `project.yaml`:
```yaml
version: "1.0"
project:
  name: "MyApp"
  description: "A fitness tracking application"
stacks:
  mobile:
    framework: "SwiftUI"
    language: "Swift"
```

The skill will:
1. Display: "Detected existing project.yaml with: Project name: MyApp, Stack: mobile / SwiftUI / Swift"
2. **Skip** Phase 1 (Project Basics) and Phase 2 (Primary Stack) questions
3. **Ask** Phase 3 (Optional Sections) questions
4. **Ask** Phase 8 (Constitution) questions if vision section is missing
5. **Proceed** to Phase 5 (Directory Scaffold) and Phase 6 (Generate Coding Agents)

### Example: Fully Pre-filled Config

If project.yaml has all required sections including vision:
```yaml
version: "1.0"
project:
  name: "MyApp"
  description: "A fitness tracking application"
stacks:
  mobile:
    framework: "SwiftUI"
    language: "Swift"
vision:
  purpose: "Help users track fitness goals"
  target_users: "Health-conscious individuals"
  core_principles:
    - "Privacy first"
    - "Offline capable"
  boundaries:
    - "No cloud sync required"
  success_metrics:
    - "Daily active users"
```

The skill will:
1. Display full summary of detected configuration
2. **Skip** all configuration questions
3. **Proceed directly** to scaffolding:
   - Create `.claude/`, `.beads/`, `.design/` directories
   - Generate coding agents based on detected stack
   - Create design system templates if enabled
   - Initialize beads if not already done

---

## Process Overview

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
| REQUIRED PHASE   | --> | OPTIONAL PHASE   | --> | CONSTITUTION     | --> | OUTPUT PHASE     |
| - Project name   |     | - Design system  |     | - Vision/purpose |     | - Write YAML     |
| - Purpose        |     | - Data governance|     | - Target users   |     | - Create dirs    |
| - Primary stack  |     | - Custom SME     |     | - Core principles|     | - Save docs      |
└──────────────────┘     └──────────────────┘     | - Boundaries     |     | - Show summary   |
                                                  | - Success metrics|     └──────────────────┘
                                                  | - Review/approve |
                                                  └──────────────────┘
```

**Target: Complete minimal setup in under 5 minutes**

---

## Execution Protocol

When this skill is invoked:

1. **Run Auto-Detection** (Step 0): Check if `project.yaml` exists with pre-filled values
   - If detected, display summary and skip questions for pre-filled sections
   - Store detected values in wizard state for use in later phases
2. **Check for existing config**: If project.yaml exists but user wants to change values, offer merge/replace options
3. **Ask questions ONE AT A TIME** (only for non-detected sections), wait for user response
4. **Validate each response** before proceeding
5. **Build YAML incrementally** from validated responses (merged with detected values)
6. **Write final project.yaml** using Write tool (only update sections that changed)
7. **Create directory scaffold** with templates
8. **Generate coding agents** based on stack selection (detected or user-provided)
9. **Show summary** with next steps

---

## Phase 1: Project Basics (Required)

### 1.1 Project Name
**Ask:** "What is the name of this project?"
**Validate:** Pattern `^[a-zA-Z][a-zA-Z0-9-_ ]*$`, max 100 chars
**Error:** "Project name must start with a letter and can only contain letters, numbers, spaces, dashes, and underscores."

### 1.2 Purpose/Description
**Ask:** "Describe the project in 1-2 sentences. What problem does it solve?"
**Validate:** Non-empty string

### 1.3 Repository Type
**Ask:** "Is this a single-app or monorepo project? [1] Single app [2] Monorepo"
**Store:** `repo_type = "single"` or `"monorepo"`

---

## Phase 2: Primary Stack (Required)

### 2.1 Stack Type
**Ask:** "What type of stack? [1] Frontend [2] Backend [3] Mobile [4] Database"
**Store:** `stack_type = "frontend"/"backend"/"mobile"/"database"`

### 2.2 Framework
**Ask:** Framework options based on stack_type (Next.js, React, SwiftUI, Express, etc.)
**Offer:** Numbered menu with "Other (specify)" option

### 2.3 Language
**Ask:** "Primary language? [1] TypeScript [2] JavaScript [3] Swift [4] Python [5] Go [6] Other"

### 2.4 Testing Framework
**Ask:** "Unit testing framework? [1] Jest [2] Vitest [3] XCTest [4] pytest [5] None [6] Other"

### 2.5 Commands
**Ask:** Test, lint, and build commands
**Offer smart defaults** based on stack type (e.g., `npm test`, `swift test`, `pytest`)

---

## Phase 3: Optional Sections

**Ask:** "Configure optional sections? [1] Design System [2] Data Governance [3] Custom SME [4] Additional Apps [S] Skip"

### Design System (if selected)
- Path to design docs (default: `.design/`)
- Create starter templates? (Y/n)
- Color scheme preference (light/dark/both)

### Custom SME Agent (if selected)

When user selects "Custom SME", collect the following information:

1. **Agent Name**
   - **Ask:** "What should this SME agent be called? (e.g., 'fitness-domain', 'security-expert', 'compliance-sme')"
   - **Validate:** kebab-case format, no spaces
   - **Store:** `agent_name` and `agent_label` (same value)

2. **Domain Expertise Description**
   - **Ask:** "Describe the domain expertise this agent should have. What area does it specialize in?"
   - **Validate:** Non-empty string, 1-2 sentences
   - **Store:** `domain_expertise`

3. **Key Files and Patterns**
   - **Ask:** "What key files, patterns, or areas of the codebase should this agent focus on when reviewing?"
   - **Validate:** Non-empty string
   - **Store:** `key_patterns`

4. **Generate Agent File**
   - **Read template** from `.claude/templates/custom-sme-agent.md.template`
   - **Substitute placeholders:**
     - `{{AGENT_NAME}}` → Agent name (formatted: "Fitness Domain Expert" from "fitness-domain")
     - `{{AGENT_LABEL}}` → agent_label (kebab-case: "fitness-domain")
     - `{{DOMAIN_DESCRIPTION}}` → domain_expertise
     - `{{DOMAIN_EXPERTISE}}` → domain_expertise (detailed description)
     - `{{KEY_PATTERNS}}` → key_patterns
   - **Write agent file** to `.claude/agents/<agent-label>.md`
   - **Note:** The template already includes the standardized output format (findings JSON structure, plain text recommendations/concerns)

5. **Add to project.yaml**
   - Add entry to `agents.custom[]` array:
     ```yaml
     agents:
       custom:
         - name: "<Agent Name>"
           label: "<agent-label>"
           prompt_file: ".claude/agents/<agent-label>.md"
     ```

**Important:** The `custom-sme-agent.md.template` template already includes the standardized output format, so all generated custom SME agents will automatically use the correct structure (findings as JSON with summary/strengths/weaknesses/gaps/feasibility/estimatedEffort, recommendations and concerns as plain text).

**See:** `docs/project-yaml-spec.md` for full YAML structure and examples

---

## Phase 4: Generate Configuration

### YAML Generation

Use Write tool to create `project.yaml` at repository root.

**Single-app structure:**
```yaml
version: "1.0"
project:
  name: "${project_name}"
  description: "${project_description}"
vision:
  purpose: "${project_description}"
stacks:
  ${stack_type}:
    framework: "${framework}"
    language: "${language}"
    testing:
      unit: "${test_framework}"
      commands:
        test: "${test_command}"
        lint: "${lint_command}"
        build: "${build_command}"
design_system:
  enabled: ${design_system_enabled}
  path: "${design_system_path}"
  docs: []
data_governance:
  auth_provider: ""
  naming_conventions:
    dates: "created_at"
    enums: "SCREAMING_SNAKE"
    fields: "snake_case"
    files: "kebab-case"
    directories: "kebab-case"
agents:
  custom: []
```

**See:** `docs/project-yaml-spec.md` for validation checklist and complete examples

---

## Phase 5: Create Directory Scaffold

### Core Directories (always created)
```bash
mkdir -p .claude/skills .claude/agents .claude/schemas .claude/templates .beads
mkdir -p .design  # if design_system.enabled
```

### Template Files

**CLAUDE.md**: Project instructions with stack info
- Check if exists, offer: [1] Keep [2] Replace (backup) [3] Merge (add Stack section)
- Use templates from `.claude/templates/CLAUDE.md.template`
- Substitute: `{{PROJECT_NAME}}`, `{{FRAMEWORK}}`, `{{LANGUAGE}}`, etc.

**beads/config.yaml**: Beads CLI configuration
- Check if exists, offer: [1] Keep [2] Replace (backup)
- Use templates from `.claude/templates/beads-config.yaml.template`
- Substitute: `{{PROJECT_PREFIX}}` (lowercase, no spaces)

### Design System Templates (if enabled)

Create starter files in `.design/`:
- `Colors.md` - Color palette (primary, semantic, neutral)
- `Typography.md` - Font families and scale
- `Components.md` - Component patterns

### Check and Initialize Beads

Beads is a **required dependency** for Parade. Check if it's installed:

```bash
which bd
```

**If Beads is NOT installed:**

Display installation instructions:
```
⚠️  Beads CLI not found

Beads is required for task management. Install it with:

  npm install -g beads

Or visit: https://github.com/steveyegge/beads

Options:
1. Install now (I'll wait)
2. Continue without beads (limited functionality)
3. Exit and install manually
```

**If Beads IS installed:**

Initialize the project:
```bash
bd init --prefix "$PROJECT_PREFIX"
```

Verify initialization:
```bash
bd doctor
```

**See:** `docs/init-troubleshooting.md` for error handling scenarios

---

## Phase 6: Generate Coding Agents

After stack selection, generate stack-specific coding agents to assist with implementation tasks.

### Framework-to-Template Mapping

Based on the selected stack, copy and customize the appropriate agent template:

| Stack Type | Framework/Language | Template File | Output File |
|------------|-------------------|---------------|-------------|
| frontend | TypeScript, JavaScript, React, Next.js, Vue, Svelte | `typescript-agent.md.template` | `typescript-agent.md` |
| backend | TypeScript, JavaScript, Node.js, Express | `typescript-agent.md.template` | `typescript-agent.md` |
| mobile | Swift, SwiftUI, UIKit | `swift-agent.md.template` | `swift-agent.md` |
| database | PostgreSQL, Supabase, SQLite | `sql-agent.md.template` | `sql-agent.md` |

### Agent Generation Logic

For each applicable stack type:

1. **Detect framework type** from user responses in Phase 2
2. **Select template** based on mapping table above
3. **Read template** from `.claude/templates/agents/<template-name>`
4. **Substitute placeholders** with collected values:
   - `{{PROJECT_NAME}}` → project_name
   - `{{FRAMEWORK}}` → framework (e.g., "Vitest", "SwiftUI", "PostgreSQL")
   - `{{LANGUAGE}}` → language (e.g., "TypeScript", "Swift")
   - `{{TEST_COMMAND}}` → test_command
   - `{{BUILD_COMMAND}}` → build_command
5. **Write agent file** to `.claude/agents/<agent-name>.md`

### Placeholder Substitution Examples

**TypeScript Agent:**
- `{{PROJECT_NAME}}` → "MyAwesomeApp"
- `{{FRAMEWORK}}` → "Vitest"
- `{{LANGUAGE}}` → "TypeScript"
- `{{TEST_COMMAND}}` → "npm test"
- `{{BUILD_COMMAND}}` → "npm run build"

**Swift Agent:**
- `{{PROJECT_NAME}}` → "MyiOSApp"
- `{{FRAMEWORK}}` → "SwiftUI"
- `{{LANGUAGE}}` → "Swift"
- `{{TEST_COMMAND}}` → "swift test"
- `{{BUILD_COMMAND}}` → "swift build"

**SQL Agent:**
- `{{PROJECT_NAME}}` → "MyDatabaseProject"
- `{{FRAMEWORK}}` → "PostgreSQL"
- `{{LANGUAGE}}` → "SQL"
- `{{TEST_COMMAND}}` → "psql -f tests/schema_test.sql"
- `{{BUILD_COMMAND}}` → "supabase db reset"

### Multi-Stack Projects

For projects with multiple stack types (e.g., full-stack apps):
- Generate agents for each relevant stack
- Example: A Next.js + Supabase project generates:
  - `typescript-agent.md` (frontend/backend)
  - `sql-agent.md` (database)

### Agent File Handling

**If agent file exists:**
- Offer: [1] Keep [2] Replace (backup to `.md.bak`) [3] Skip
- Default: Keep existing agents to preserve customizations

**Backup naming:**
- `typescript-agent.md.bak`
- If backup exists, use timestamp: `typescript-agent.md.bak.20260102_143000`

---

## Phase 7: Existing Configuration Handling

### Detection
```bash
ls -la project.yaml 2>/dev/null && echo "EXISTS" || echo "NOT_FOUND"
```

### If EXISTS
**Offer options:**
1. **View** - Display current configuration
2. **Merge** - Add new sections while preserving existing
3. **Replace** - Backup to `project.yaml.bak` and start fresh

### Merge Strategy
- Use Edit tool to surgically add/update sections
- Preserve existing project name, description, stacks
- Add new optional sections (design_system, agents, etc.)
- Show diff before applying changes

### Backup Logic
```bash
# Always backup before replace
cp project.yaml project.yaml.bak
# If backup exists, create timestamped: project.yaml.bak.20260102_143000
```

**See:** `docs/config-merge-patterns.md` for detailed merge procedures and examples

---

## Phase 8: Constitution Generation

Generate a project constitution that defines vision, principles, and boundaries.

### 8.1 Prompt for Constitution Details

**Ask:** "Would you like to create a project constitution? This defines your app's vision, principles, and boundaries. [Y/n]"

If user declines, skip to Output phase.

### 8.2 Collect Constitution Information

Ask the following questions ONE AT A TIME:

#### Vision/Purpose
**Ask:** "What is the vision or purpose of this application? What problem does it solve and why does it matter?"
**Validate:** Non-empty string, at least 20 characters
**Store:** `constitution_purpose`

#### Target Users
**Ask:** "Who are the target users? Describe your primary audience and their needs."
**Validate:** Non-empty string
**Store:** `constitution_target_users`

#### Core Principles
**Ask:** "What are the core principles that guide this project? List 3-5 principles (one per line or comma-separated)."
**Validate:** Non-empty string
**Transform:** Format as bullet list if not already
**Store:** `constitution_core_principles`

#### Technical Boundaries
**Ask:** "What are the technical boundaries or constraints? (e.g., offline-first, no external APIs, specific platforms only)"
**Validate:** Non-empty string
**Transform:** Format as bullet list if not already
**Store:** `constitution_technical_boundaries`

#### Success Metrics
**Ask:** "How will you measure success? Define 2-4 key metrics."
**Validate:** Non-empty string
**Transform:** Format as bullet list if not already
**Store:** `constitution_success_metrics`

### 8.3 Generate Constitution from Template

1. **Read template** from `.claude/templates/CONSTITUTION.md.template`
2. **Substitute placeholders:**
   - `{{PROJECT_NAME}}` → project_name (from Phase 1)
   - `{{PURPOSE}}` → constitution_purpose
   - `{{TARGET_USERS}}` → constitution_target_users
   - `{{CORE_PRINCIPLES}}` → constitution_core_principles (formatted as bullet list)
   - `{{TECHNICAL_BOUNDARIES}}` → constitution_technical_boundaries (formatted as bullet list)
   - `{{SUCCESS_METRICS}}` → constitution_success_metrics (formatted as bullet list)

### 8.4 Review and Approve Flow

**Present the generated constitution:**
```
## Generated Constitution

[Display full generated CONSTITUTION.md content]

---

Please review the constitution above.

[1] Approve - Save to docs/CONSTITUTION.md
[2] Edit - Make changes before saving
[3] Skip - Don't create a constitution
```

#### If Approved (Option 1)
1. Create `docs/` directory if it doesn't exist: `mkdir -p docs`
2. Write constitution to `docs/CONSTITUTION.md` using Write tool
3. Continue to Output phase

#### If Edit Requested (Option 2)
**Ask:** "Which section would you like to edit? [1] Purpose [2] Target Users [3] Core Principles [4] Technical Boundaries [5] Success Metrics [6] All sections"

Based on selection:
- **Specific section (1-5):** Re-prompt for that section only, then regenerate and present for review again
- **All sections (6):** Re-run all prompts from 8.2

After edits, return to 8.4 (present for review again).

#### If Skipped (Option 3)
- Log: "Constitution skipped by user"
- Continue to Output phase

### 8.5 Constitution File Handling

**If `docs/CONSTITUTION.md` exists:**
**Offer options:**
1. **View** - Display current constitution
2. **Replace** - Backup to `CONSTITUTION.md.bak` and create new
3. **Skip** - Keep existing constitution

**Backup Logic:**
```bash
# Always backup before replace
cp docs/CONSTITUTION.md docs/CONSTITUTION.md.bak
# If backup exists, create timestamped: CONSTITUTION.md.bak.20260102_143000
```

### Formatting Helpers

**Bullet List Transformation:**
When user provides comma-separated or plain text lists, transform to markdown bullet list:

Input: `"Performance first, User privacy, Offline capable"`
Output:
```
- Performance first
- User privacy
- Offline capable
```

Input: `"Must work offline\nNo cloud dependencies\nSingle binary deployment"`
Output:
```
- Must work offline
- No cloud dependencies
- Single binary deployment
```

---

## Output

### Success Summary
```
## Project Initialized Successfully!

### Files Created
- project.yaml (project configuration)
- .claude/CLAUDE.md (project instructions)
- .claude/agents/swift-agent.md (Swift coding agent)
- .claude/agents/fitness-domain.md (custom SME) [if created]
- docs/CONSTITUTION.md (project constitution) [if created]

**Note:** All custom SME agents are generated with the standardized output format, ensuring consistent structure across all reviews (findings as JSON with summary/strengths/weaknesses/gaps/feasibility/estimatedEffort, recommendations and concerns as plain text).

### Directories Created
- .claude/skills/, .claude/agents/, .claude/schemas/, .beads/, .design/
- docs/ [if constitution created]

### Configuration Summary
Project: MyAwesomeApp
Stack: SwiftUI / Swift / XCTest
Design System: Enabled
Coding Agents: swift-agent
Custom SMEs: fitness-domain
Constitution: Created [or Skipped]

---

## What's Next?

1. **Start building a feature:**
   Run `/create-brief` to capture your first feature idea

2. **Review your config:**
   Open `project.yaml` to review or manually adjust settings

3. **Review your constitution:**
   Open `docs/CONSTITUTION.md` to review your project's guiding principles

4. **Add more agents:**
   Run `/init-project` again to add more SME agents

5. **Review generated agents:**
   Check `.claude/agents/` for coding agents tailored to your stack

Need help? Run `/help` for available commands.
```

---

## Quick Reference: Minimal Flow

For `--minimal` flag:

**Ask only 6 questions:**
1. Project name
2. Project description (1-2 sentences)
3. Stack type [1-4]
4. Framework (based on stack)
5. Primary language [1-6]
6. Test command (with smart default)

**Generate minimal YAML**, create directories, show success message.
**Total time: ~3-4 minutes**

---

## Reference Documentation

For detailed specifications, merge procedures, and troubleshooting:

- **docs/project-yaml-spec.md** - Complete YAML schema, validation rules, examples
- **docs/config-merge-patterns.md** - Merge/replace logic, backup procedures, existing config handling
- **docs/init-troubleshooting.md** - Error scenarios, validation failures, recovery procedures
