-- Agent Telemetry Schema
-- Tracks agent execution metrics for retrospective analysis and self-improvement
-- Added to discovery.db alongside briefs, specs, etc.

-- Agent Telemetry: Captured after each agent execution
CREATE TABLE IF NOT EXISTS agent_telemetry (
  id TEXT PRIMARY KEY,                    -- e.g., 'telem-a3f8x2'
  task_id TEXT NOT NULL,                  -- beads task ID (e.g., 'customTaskTracker-1gp.1')
  epic_id TEXT,                           -- parent epic ID for grouping
  agent_type TEXT NOT NULL,               -- from agent:* label (e.g., 'typescript', 'swift', 'sql')
  status TEXT NOT NULL,                   -- 'PASS' | 'FAIL' | 'BLOCKED'

  -- Resource metrics
  token_count INTEGER,                    -- tokens used (estimated or from API)
  duration_ms INTEGER,                    -- execution time in milliseconds

  -- File changes (JSON arrays for compact storage)
  files_modified TEXT,                    -- JSON: ["path/to/file1.ts", "path/to/file2.ts"]
  files_created TEXT,                     -- JSON: ["path/to/newfile.ts"]

  -- Failure context (only populated on FAIL/BLOCKED)
  error_type TEXT,                        -- 'test_failure' | 'build_error' | 'timeout' | 'validation' | 'unknown'
  error_summary TEXT,                     -- Brief error description (max 500 chars)

  -- Debug loop tracking
  debug_attempts INTEGER DEFAULT 0,       -- Number of debug-agent spawns

  -- Timestamps
  started_at TEXT NOT NULL,               -- ISO datetime
  completed_at TEXT NOT NULL,             -- ISO datetime
  created_at TEXT DEFAULT (datetime('now'))
);

-- Retrospective Annotations: Added during /retro skill
-- Links telemetry to post-hoc analysis
CREATE TABLE IF NOT EXISTS telemetry_annotations (
  id TEXT PRIMARY KEY,                    -- e.g., 'annot-b4c9y3'
  telemetry_id TEXT REFERENCES agent_telemetry(id),
  annotation_type TEXT NOT NULL,          -- 'caused_bug' | 'pattern_identified' | 'prompt_issue' | 'efficiency_note'
  description TEXT,                       -- Human-readable note
  linked_pattern TEXT,                    -- Reference to debug-knowledge file if applicable
  created_at TEXT DEFAULT (datetime('now'))
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_telemetry_task ON agent_telemetry(task_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_epic ON agent_telemetry(epic_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_agent ON agent_telemetry(agent_type);
CREATE INDEX IF NOT EXISTS idx_telemetry_status ON agent_telemetry(status);
CREATE INDEX IF NOT EXISTS idx_telemetry_created ON agent_telemetry(created_at);
CREATE INDEX IF NOT EXISTS idx_annotations_telemetry ON telemetry_annotations(telemetry_id);
CREATE INDEX IF NOT EXISTS idx_annotations_type ON telemetry_annotations(annotation_type);
