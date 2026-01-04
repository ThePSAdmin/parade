PHASE 1: BRIEF CREATION
────────────────────────────────────────────────────────────
You (in Claude Desktop):  "I want to add athlete experience context to Ascent"
                                    │
                                    ▼
Claude Desktop:            Creates brief, writes to discovery.db
                                    │
                                    ▼
Electron App:              Shows new brief in "Briefs" column


PHASE 2: DISCOVERY (Claude Code Orchestrates)
────────────────────────────────────────────────────────────
You:                       "Start discovery for athlete-context brief"
                                    │
                                    ▼
Claude Code:               Reads brief from discovery.db
                           Generates interview questions
                           Writes questions to discovery.db
                                    │
                                    ▼
Electron App:              Shows "Interview in Progress" status
                                    │
                                    ▼
You (in Claude Desktop):   Answer questions (stored in discovery.db)
                                    │
                                    ▼
Claude Code:               Invokes Technical SME agent
                           │  → Reads codebase, finds patterns
                           │  → Writes findings to discovery.db
                           │
                           Invokes Business SME agent  
                           │  → Reviews domain constraints
                           │  → Writes findings to discovery.db
                                    │
                                    ▼
Electron App:              Shows SME review status, findings


PHASE 3: SPEC SYNTHESIS (Claude Code)
────────────────────────────────────────────────────────────
Claude Code:               Synthesizes spec from:
                           - Brief
                           - Your interview answers
                           - Technical SME findings
                           - Business SME findings
                           
                           Writes spec to discovery.db
                           Status → "Awaiting Approval"
                                    │
                                    ▼
Electron App:              Shows spec for review
                                    │
                                    ▼
You:                       "Approve spec" or "Revise X"
                                    │
                                    ▼
Claude Code:               On approval:
                           → bd create "Athlete Context" -t epic
                           → Creates child tasks in beads
                           → Links discovery.db brief to beads epic


PHASE 4: EXECUTION (Claude Code + Sub-Agents)
────────────────────────────────────────────────────────────
Claude Code:               Reads bd ready --json
                           Analyzes dependencies
                           Assigns tasks to specialized agents:
                           
                           ┌─────────────────────────────────┐
                           │ PARALLEL BATCH (no deps)        │
                           │ • bd-a1b2.1 → Swift Agent       │
                           │ • bd-a1b2.2 → Supabase Agent    │
                           └─────────────────────────────────┘
                                        │
                                        ▼ (wait for completion)
                           ┌─────────────────────────────────┐
                           │ SEQUENTIAL (has deps)           │
                           │ • bd-a1b2.3 → TypeScript Agent  │
                           │   (depends on .1 and .2)        │
                           └─────────────────────────────────┘
                                        │
                                        ▼
                           ┌─────────────────────────────────┐
                           │ REVIEW BATCH                    │
                           │ • All completed → Review Agent  │
                           └─────────────────────────────────┘
                                    │
                                    ▼
Electron App:              Real-time progress (watches .beads/)