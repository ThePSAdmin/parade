┌─────────────────────────────────────────────────────────────────────────────┐
│                         HUMAN INTERFACE LAYER                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Claude Desktop / Claude Chat         Electron App (beads-ui fork)        │
│   ┌─────────────────────────┐          ┌─────────────────────────┐         │
│   │ • Create briefs         │          │ • READ-ONLY VIEWS       │         │
│   │ • Answer interview Qs   │          │ • Pipeline status       │         │
│   │ • Review specs          │          │ • Task progress         │         │
│   │ • Approve to proceed    │          │ • Dependency graphs     │         │
│   │ • High-level direction  │          │ • Agent activity        │         │
│   └─────────────────────────┘          └─────────────────────────┘         │
│              │                                    ▲                         │
│              │ (you talk here)                    │ (you watch here)        │
│              ▼                                    │                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                       ORCHESTRATION LAYER                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                    ┌─────────────────────────────┐                         │
│                    │       CLAUDE CODE           │                         │
│                    │      (Coordinator)          │                         │
│                    ├─────────────────────────────┤                         │
│                    │ • Runs discovery workflow   │                         │
│                    │ • Generates interview Qs    │                         │
│                    │ • Invokes SME agents        │                         │
│                    │ • Synthesizes specs         │                         │
│                    │ • Creates beads issues      │                         │
│                    │ • Assigns tasks to agents   │                         │
│                    │ • Manages parallelization   │                         │
│                    │ • Handles dependencies      │                         │
│                    └─────────────────────────────┘                         │
│                                 │                                           │
│              ┌──────────────────┼──────────────────┐                       │
│              ▼                  ▼                  ▼                        │
│   ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐          │
│   │  Swift Agent     │ │  Supabase Agent  │ │  TypeScript Agent│          │
│   │  (iOS code)      │ │  (SQL, RLS, DB)  │ │  (Edge functions)│          │
│   └──────────────────┘ └──────────────────┘ └──────────────────┘          │
│   ┌──────────────────┐ ┌──────────────────┐                               │
│   │  Test Agent      │ │  Review Agent    │                               │
│   │  (QA, coverage)  │ │  (Code review)   │                               │
│   └──────────────────┘ └──────────────────┘                               │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                          DATA LAYER                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────┐    ┌─────────────────────────┐              │
│   │    discovery.db         │    │    .beads/              │              │
│   │    (SQLite)             │    │    (Beads)              │              │
│   ├─────────────────────────┤    ├─────────────────────────┤              │
│   │ • briefs                │    │ • epics (approved specs)│              │
│   │ • interview_questions   │    │ • tasks                 │              │
│   │ • interview_answers     │    │ • dependencies          │              │
│   │ • sme_reviews           │    │ • status tracking       │              │
│   │ • workflow_state        │    │ • agent assignments     │              │
│   └─────────────────────────┘    └─────────────────────────┘              │
│              │                              │                              │
│              └──────────────┬───────────────┘                              │
│                             ▼                                              │
│                    Electron App reads both                                 │
│                    to render unified view                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘