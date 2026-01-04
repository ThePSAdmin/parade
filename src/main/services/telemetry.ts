/**
 * TelemetryService - Agent execution metrics storage and analysis
 *
 * Tracks agent execution metrics for retrospective analysis and self-improvement.
 * Uses discovery.db with WAL mode for concurrent access.
 */

import Database from 'better-sqlite3'
import type {
  AgentTelemetry,
  AgentTelemetryParsed,
  TelemetryAnnotation,
  CreateTelemetryParams,
  CreateAnnotationParams,
  TelemetryFilters,
  EpicTelemetrySummary,
  AgentPerformanceMetrics,
  TelemetryWithAnnotations,
  AgentLabel,
  AgentStatus,
  ErrorType,
} from '../../shared/types/telemetry'

// Maximum retry attempts for SQLITE_BUSY errors
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 100

/**
 * Generate a random ID with prefix
 */
function generateId(prefix: string): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let id = prefix + '-'
  for (let i = 0; i < 8; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return id
}

/**
 * Map compact error codes to full types
 */
function mapErrorType(code?: string): ErrorType | null {
  if (!code) return null
  const map: Record<string, ErrorType> = {
    t: 'test_failure',
    b: 'build_error',
    o: 'timeout',
    v: 'validation',
    u: 'unknown',
  }
  return map[code] || 'unknown'
}

/**
 * Map compact status to full status
 */
function mapStatus(code: string): AgentStatus {
  const map: Record<string, AgentStatus> = {
    s: 'PASS',
    f: 'FAIL',
    b: 'BLOCKED',
  }
  return map[code] || 'FAIL'
}

/**
 * TelemetryService provides storage and analysis of agent execution metrics.
 * Uses the same database as DiscoveryService (discovery.db).
 */
class TelemetryService {
  private db: Database.Database | null = null
  private dbPath: string | null = null
  private initialized = false

  /**
   * Set the path to the database file
   */
  setDatabasePath(path: string): void {
    if (this.dbPath !== path) {
      this.close()
    }
    this.dbPath = path
    this.initialized = false
  }

  /**
   * Get the current database path
   */
  getDatabasePath(): string | null {
    return this.dbPath
  }

  /**
   * Ensure database connection is open and tables are initialized
   */
  private ensureConnection(): Database.Database {
    if (!this.db && this.dbPath) {
      try {
        this.db = new Database(this.dbPath, { readonly: false })
        this.db.pragma('journal_mode = WAL')
        this.db.pragma('busy_timeout = 5000')
        console.log('Telemetry service connected:', this.dbPath)
      } catch (err) {
        console.error('Failed to connect telemetry service:', err)
        throw new Error(`Failed to open telemetry database: ${err}`)
      }
    }
    if (!this.db) {
      throw new Error('Telemetry database not initialized. Call setDatabasePath() first.')
    }

    // Initialize tables if not done
    if (!this.initialized) {
      this.initializeSchema()
      this.initialized = true
    }

    return this.db
  }

  /**
   * Initialize telemetry tables if they don't exist
   */
  private initializeSchema(): void {
    const db = this.db!

    db.exec(`
      CREATE TABLE IF NOT EXISTS agent_telemetry (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL,
        epic_id TEXT,
        agent_type TEXT NOT NULL,
        status TEXT NOT NULL,
        token_count INTEGER,
        duration_ms INTEGER,
        files_modified TEXT,
        files_created TEXT,
        error_type TEXT,
        error_summary TEXT,
        debug_attempts INTEGER DEFAULT 0,
        started_at TEXT NOT NULL,
        completed_at TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS telemetry_annotations (
        id TEXT PRIMARY KEY,
        telemetry_id TEXT REFERENCES agent_telemetry(id),
        annotation_type TEXT NOT NULL,
        description TEXT,
        linked_pattern TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_telemetry_task ON agent_telemetry(task_id);
      CREATE INDEX IF NOT EXISTS idx_telemetry_epic ON agent_telemetry(epic_id);
      CREATE INDEX IF NOT EXISTS idx_telemetry_agent ON agent_telemetry(agent_type);
      CREATE INDEX IF NOT EXISTS idx_telemetry_status ON agent_telemetry(status);
      CREATE INDEX IF NOT EXISTS idx_telemetry_created ON agent_telemetry(created_at);
      CREATE INDEX IF NOT EXISTS idx_annotations_telemetry ON telemetry_annotations(telemetry_id);
      CREATE INDEX IF NOT EXISTS idx_annotations_type ON telemetry_annotations(annotation_type);
    `)

    console.log('Telemetry schema initialized')
  }

  /**
   * Execute an operation with retry logic for SQLITE_BUSY errors
   */
  private withRetry<T>(operation: () => T): T {
    let lastError: Error | null = null
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        return operation()
      } catch (err: unknown) {
        const error = err as Error & { code?: string }
        if (error.code === 'SQLITE_BUSY' && attempt < MAX_RETRIES - 1) {
          lastError = error
          const start = Date.now()
          while (Date.now() - start < RETRY_DELAY_MS) {
            // Busy wait
          }
          continue
        }
        throw err
      }
    }
    throw lastError
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.db) {
      try {
        this.db.close()
        console.log('Telemetry service connection closed')
      } catch (err) {
        console.error('Error closing telemetry service:', err)
      }
      this.db = null
      this.initialized = false
    }
  }

  /**
   * Check if service is connected
   */
  isConnected(): boolean {
    return this.db !== null
  }

  // ==========================================================================
  // CRUD Operations
  // ==========================================================================

  /**
   * Record agent telemetry from parsed output
   */
  recordTelemetry(params: CreateTelemetryParams): string {
    const db = this.ensureConnection()
    const id = generateId('telem')
    const { task_id, epic_id, agent_type, output, started_at, completed_at, debug_attempts } =
      params

    const status = mapStatus(output.s)
    const errorType = mapErrorType(output.e)
    const durationMs = new Date(completed_at).getTime() - new Date(started_at).getTime()

    return this.withRetry(() => {
      const stmt = db.prepare(`
        INSERT INTO agent_telemetry (
          id, task_id, epic_id, agent_type, status,
          token_count, duration_ms, files_modified, files_created,
          error_type, error_summary, debug_attempts,
          started_at, completed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)

      stmt.run(
        id,
        task_id,
        epic_id || null,
        agent_type,
        status,
        output.t || null,
        durationMs,
        JSON.stringify(output.m || []),
        JSON.stringify(output.c || []),
        errorType,
        output.x ? output.x.substring(0, 500) : null,
        debug_attempts || 0,
        started_at,
        completed_at
      )

      return id
    })
  }

  /**
   * Get telemetry by ID
   */
  getTelemetry(id: string): AgentTelemetryParsed | null {
    const db = this.ensureConnection()

    return this.withRetry(() => {
      const stmt = db.prepare('SELECT * FROM agent_telemetry WHERE id = ?')
      const row = stmt.get(id) as AgentTelemetry | undefined
      if (!row) return null

      return this.parseTelemetryRow(row)
    })
  }

  /**
   * Get telemetry for a specific task
   */
  getTelemetryForTask(taskId: string): AgentTelemetryParsed[] {
    const db = this.ensureConnection()

    return this.withRetry(() => {
      const stmt = db.prepare(
        'SELECT * FROM agent_telemetry WHERE task_id = ? ORDER BY created_at DESC'
      )
      const rows = stmt.all(taskId) as AgentTelemetry[]
      return rows.map((row) => this.parseTelemetryRow(row))
    })
  }

  /**
   * Get telemetry for an epic
   */
  getTelemetryForEpic(epicId: string): AgentTelemetryParsed[] {
    const db = this.ensureConnection()

    return this.withRetry(() => {
      const stmt = db.prepare(
        'SELECT * FROM agent_telemetry WHERE epic_id = ? ORDER BY created_at DESC'
      )
      const rows = stmt.all(epicId) as AgentTelemetry[]
      return rows.map((row) => this.parseTelemetryRow(row))
    })
  }

  /**
   * List telemetry with filters
   */
  listTelemetry(filters?: TelemetryFilters): AgentTelemetryParsed[] {
    const db = this.ensureConnection()

    let sql = 'SELECT * FROM agent_telemetry'
    const conditions: string[] = []
    const params: (string | number)[] = []

    if (filters?.epic_id) {
      conditions.push('epic_id = ?')
      params.push(filters.epic_id)
    }

    if (filters?.agent_type) {
      if (Array.isArray(filters.agent_type)) {
        const placeholders = filters.agent_type.map(() => '?').join(', ')
        conditions.push(`agent_type IN (${placeholders})`)
        params.push(...filters.agent_type)
      } else {
        conditions.push('agent_type = ?')
        params.push(filters.agent_type)
      }
    }

    if (filters?.status) {
      if (Array.isArray(filters.status)) {
        const placeholders = filters.status.map(() => '?').join(', ')
        conditions.push(`status IN (${placeholders})`)
        params.push(...filters.status)
      } else {
        conditions.push('status = ?')
        params.push(filters.status)
      }
    }

    if (filters?.since) {
      conditions.push('created_at >= ?')
      params.push(filters.since)
    }

    if (filters?.until) {
      conditions.push('created_at <= ?')
      params.push(filters.until)
    }

    if (filters?.has_errors) {
      conditions.push('error_type IS NOT NULL')
    }

    if (filters?.min_debug_attempts !== undefined) {
      conditions.push('debug_attempts >= ?')
      params.push(filters.min_debug_attempts)
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ')
    }

    sql += ' ORDER BY created_at DESC'

    return this.withRetry(() => {
      const stmt = db.prepare(sql)
      const rows = stmt.all(...params) as AgentTelemetry[]
      return rows.map((row) => this.parseTelemetryRow(row))
    })
  }

  // ==========================================================================
  // Annotations
  // ==========================================================================

  /**
   * Add retrospective annotation
   */
  addAnnotation(params: CreateAnnotationParams): string {
    const db = this.ensureConnection()
    const id = generateId('annot')

    return this.withRetry(() => {
      const stmt = db.prepare(`
        INSERT INTO telemetry_annotations (id, telemetry_id, annotation_type, description, linked_pattern)
        VALUES (?, ?, ?, ?, ?)
      `)

      stmt.run(
        id,
        params.telemetry_id,
        params.annotation_type,
        params.description || null,
        params.linked_pattern || null
      )

      return id
    })
  }

  /**
   * Get annotations for telemetry record
   */
  getAnnotations(telemetryId: string): TelemetryAnnotation[] {
    const db = this.ensureConnection()

    return this.withRetry(() => {
      const stmt = db.prepare(
        'SELECT * FROM telemetry_annotations WHERE telemetry_id = ? ORDER BY created_at DESC'
      )
      return stmt.all(telemetryId) as TelemetryAnnotation[]
    })
  }

  /**
   * Get telemetry marked as causing bugs
   */
  getBugCausingTelemetry(): TelemetryWithAnnotations[] {
    const db = this.ensureConnection()

    return this.withRetry(() => {
      const stmt = db.prepare(`
        SELECT DISTINCT t.* FROM agent_telemetry t
        INNER JOIN telemetry_annotations a ON t.id = a.telemetry_id
        WHERE a.annotation_type = 'caused_bug'
        ORDER BY t.created_at DESC
      `)
      const rows = stmt.all() as AgentTelemetry[]

      return rows.map((row) => ({
        ...this.parseTelemetryRow(row),
        annotations: this.getAnnotations(row.id),
      }))
    })
  }

  // ==========================================================================
  // Analysis Queries (for /retro skill)
  // ==========================================================================

  /**
   * Get aggregated metrics for an epic
   */
  getEpicSummary(epicId: string): EpicTelemetrySummary {
    const db = this.ensureConnection()

    return this.withRetry(() => {
      // Basic counts
      const summaryStmt = db.prepare(`
        SELECT
          COUNT(*) as total_tasks,
          SUM(CASE WHEN status = 'PASS' THEN 1 ELSE 0 END) as passed,
          SUM(CASE WHEN status = 'FAIL' THEN 1 ELSE 0 END) as failed,
          SUM(CASE WHEN status = 'BLOCKED' THEN 1 ELSE 0 END) as blocked,
          SUM(COALESCE(token_count, 0)) as total_tokens,
          SUM(COALESCE(duration_ms, 0)) as total_duration_ms,
          SUM(COALESCE(debug_attempts, 0)) as total_debug_attempts
        FROM agent_telemetry
        WHERE epic_id = ?
      `)
      const summary = summaryStmt.get(epicId) as Record<string, number>

      // By agent type
      const byAgentStmt = db.prepare(`
        SELECT
          agent_type,
          COUNT(*) as count,
          SUM(CASE WHEN status = 'PASS' THEN 1 ELSE 0 END) as passed,
          SUM(CASE WHEN status = 'FAIL' THEN 1 ELSE 0 END) as failed,
          AVG(COALESCE(token_count, 0)) as avg_tokens,
          AVG(COALESCE(duration_ms, 0)) as avg_duration_ms
        FROM agent_telemetry
        WHERE epic_id = ?
        GROUP BY agent_type
      `)
      const byAgentRows = byAgentStmt.all(epicId) as Array<{
        agent_type: AgentLabel
        count: number
        passed: number
        failed: number
        avg_tokens: number
        avg_duration_ms: number
      }>

      const byAgent: EpicTelemetrySummary['by_agent'] = {}
      for (const row of byAgentRows) {
        byAgent[row.agent_type] = {
          count: row.count,
          passed: row.passed,
          failed: row.failed,
          avg_tokens: Math.round(row.avg_tokens),
          avg_duration_ms: Math.round(row.avg_duration_ms),
        }
      }

      // Error breakdown
      const errorStmt = db.prepare(`
        SELECT error_type, COUNT(*) as count
        FROM agent_telemetry
        WHERE epic_id = ? AND error_type IS NOT NULL
        GROUP BY error_type
      `)
      const errorRows = errorStmt.all(epicId) as Array<{ error_type: ErrorType; count: number }>

      const errorBreakdown: Record<ErrorType, number> = {
        test_failure: 0,
        build_error: 0,
        timeout: 0,
        validation: 0,
        unknown: 0,
      }
      for (const row of errorRows) {
        errorBreakdown[row.error_type] = row.count
      }

      return {
        epic_id: epicId,
        total_tasks: summary.total_tasks || 0,
        passed: summary.passed || 0,
        failed: summary.failed || 0,
        blocked: summary.blocked || 0,
        total_tokens: summary.total_tokens || 0,
        total_duration_ms: summary.total_duration_ms || 0,
        total_debug_attempts: summary.total_debug_attempts || 0,
        by_agent: byAgent,
        error_breakdown: errorBreakdown,
      }
    })
  }

  /**
   * Get agent performance across all epics
   */
  getAgentPerformance(agentType?: AgentLabel): AgentPerformanceMetrics[] {
    const db = this.ensureConnection()

    return this.withRetry(() => {
      let sql = `
        SELECT
          agent_type,
          COUNT(*) as total_executions,
          CAST(SUM(CASE WHEN status = 'PASS' THEN 1 ELSE 0 END) AS REAL) / COUNT(*) as success_rate,
          AVG(COALESCE(token_count, 0)) as avg_tokens,
          AVG(COALESCE(duration_ms, 0)) as avg_duration_ms,
          CAST(SUM(CASE WHEN debug_attempts > 0 THEN 1 ELSE 0 END) AS REAL) / COUNT(*) as debug_rate
        FROM agent_telemetry
      `

      const params: string[] = []
      if (agentType) {
        sql += ' WHERE agent_type = ?'
        params.push(agentType)
      }

      sql += ' GROUP BY agent_type ORDER BY total_executions DESC'

      const stmt = db.prepare(sql)
      return stmt.all(...params) as AgentPerformanceMetrics[]
    })
  }

  /**
   * Get recent failures for pattern analysis
   */
  getRecentFailures(limit = 20): TelemetryWithAnnotations[] {
    const db = this.ensureConnection()

    return this.withRetry(() => {
      const stmt = db.prepare(`
        SELECT * FROM agent_telemetry
        WHERE status IN ('FAIL', 'BLOCKED')
        ORDER BY created_at DESC
        LIMIT ?
      `)
      const rows = stmt.all(limit) as AgentTelemetry[]

      return rows.map((row) => ({
        ...this.parseTelemetryRow(row),
        annotations: this.getAnnotations(row.id),
      }))
    })
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Parse a telemetry row, converting JSON strings to arrays
   */
  private parseTelemetryRow(row: AgentTelemetry): AgentTelemetryParsed {
    return {
      ...row,
      files_modified: this.parseJsonArray(row.files_modified),
      files_created: this.parseJsonArray(row.files_created),
    }
  }

  /**
   * Safely parse a JSON array string
   */
  private parseJsonArray(jsonString: string | null): string[] {
    if (!jsonString) return []
    try {
      return JSON.parse(jsonString) as string[]
    } catch {
      return []
    }
  }
}

// Export singleton instance
export const telemetryService = new TelemetryService()
export default telemetryService
