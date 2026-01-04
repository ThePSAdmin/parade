/**
 * Agent Telemetry Types
 *
 * Types for tracking agent execution metrics, enabling retrospective
 * analysis and self-improvement of agent prompts.
 */

// ============================================================================
// Enums and Literal Types
// ============================================================================

/** Agent execution status */
export type AgentStatus = 'PASS' | 'FAIL' | 'BLOCKED'

/** Error categorization */
export type ErrorType = 'test_failure' | 'build_error' | 'timeout' | 'validation' | 'unknown'

/** Annotation type for retrospective */
export type AnnotationType = 'caused_bug' | 'pattern_identified' | 'prompt_issue' | 'efficiency_note'

/** Agent types from labels */
export type AgentLabel =
  | 'typescript'
  | 'swift'
  | 'sql'
  | 'test'
  | 'test-writer'
  | 'context-builder'
  | 'debug'
  | 'technical-sme'
  | 'business-sme'

// ============================================================================
// Compact Agent Output Schema
// ============================================================================

/**
 * Compact agent output JSON - minimal schema to prevent context overflow
 * Agents return this at completion (single-letter keys for token efficiency)
 *
 * Example success: {"s":"s","t":1200,"m":["src/file.ts"],"c":[]}
 * Example failure: {"s":"f","e":"t","x":"Test failed: expected 3 got 2"}
 */
export interface AgentOutput {
  /** Status: 's' for success, 'f' for fail, 'b' for blocked */
  s: 's' | 'f' | 'b'
  /** Token estimate (optional, agent provides if available) */
  t?: number
  /** Modified files - array of paths */
  m?: string[]
  /** Created files - array of paths */
  c?: string[]
  /** Error type code (only on failure): t=test, b=build, o=timeout, v=validation, u=unknown */
  e?: 't' | 'b' | 'o' | 'v' | 'u'
  /** Error message (truncated to 200 chars, only on failure) */
  x?: string
}

// ============================================================================
// Database Entity Types
// ============================================================================

/**
 * AgentTelemetry - Captured metrics from agent execution
 * Table: agent_telemetry
 */
export interface AgentTelemetry {
  /** Unique identifier (e.g., 'telem-a3f8x2') */
  id: string
  /** Beads task ID (e.g., 'customTaskTracker-1gp.1') */
  task_id: string
  /** Parent epic ID */
  epic_id: string | null
  /** Agent type from label */
  agent_type: AgentLabel
  /** Execution result */
  status: AgentStatus
  /** Tokens used (estimated) */
  token_count: number | null
  /** Execution time in ms */
  duration_ms: number | null
  /** Modified file paths (JSON string in DB) */
  files_modified: string
  /** Created file paths (JSON string in DB) */
  files_created: string
  /** Error category if failed */
  error_type: ErrorType | null
  /** Brief error description */
  error_summary: string | null
  /** Debug loop count */
  debug_attempts: number
  /** ISO datetime start */
  started_at: string
  /** ISO datetime end */
  completed_at: string
  /** ISO datetime record created */
  created_at: string
}

/**
 * AgentTelemetry with parsed JSON fields
 */
export interface AgentTelemetryParsed
  extends Omit<AgentTelemetry, 'files_modified' | 'files_created'> {
  files_modified: string[]
  files_created: string[]
}

/**
 * TelemetryAnnotation - Retrospective notes on telemetry
 * Table: telemetry_annotations
 */
export interface TelemetryAnnotation {
  id: string
  telemetry_id: string
  annotation_type: AnnotationType
  description: string | null
  linked_pattern: string | null
  created_at: string
}

// ============================================================================
// Input Types
// ============================================================================

/**
 * Parameters for creating telemetry record
 */
export interface CreateTelemetryParams {
  task_id: string
  epic_id?: string
  agent_type: AgentLabel
  output: AgentOutput
  started_at: string
  completed_at: string
  debug_attempts?: number
}

/**
 * Parameters for creating annotation
 */
export interface CreateAnnotationParams {
  telemetry_id: string
  annotation_type: AnnotationType
  description?: string
  linked_pattern?: string
}

// ============================================================================
// Query/Filter Types
// ============================================================================

/**
 * Filters for telemetry queries
 */
export interface TelemetryFilters {
  epic_id?: string
  agent_type?: AgentLabel | AgentLabel[]
  status?: AgentStatus | AgentStatus[]
  since?: string
  until?: string
  has_errors?: boolean
  min_debug_attempts?: number
}

/**
 * Aggregated metrics for retrospective
 */
export interface EpicTelemetrySummary {
  epic_id: string
  total_tasks: number
  passed: number
  failed: number
  blocked: number
  total_tokens: number
  total_duration_ms: number
  total_debug_attempts: number
  by_agent: Partial<
    Record<
      AgentLabel,
      {
        count: number
        passed: number
        failed: number
        avg_tokens: number
        avg_duration_ms: number
      }
    >
  >
  error_breakdown: Record<ErrorType, number>
}

/**
 * Agent performance metrics across epics
 */
export interface AgentPerformanceMetrics {
  agent_type: AgentLabel
  total_executions: number
  success_rate: number
  avg_tokens: number
  avg_duration_ms: number
  debug_rate: number
}

/**
 * Telemetry with annotations for analysis
 */
export interface TelemetryWithAnnotations extends AgentTelemetryParsed {
  annotations: TelemetryAnnotation[]
}
