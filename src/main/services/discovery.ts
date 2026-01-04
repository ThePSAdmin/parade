// DiscoveryService - Access to discovery.db SQLite database
// This service reads workflow data that Claude Code writes during discovery
// and provides limited write access for sync operations

import Database from 'better-sqlite3';
import type {
  Brief,
  BriefFilters,
  BriefWithRelations,
  InterviewQuestion,
  SMEReview,
  SMEReviewParsed,
  SMEFindings,
  Spec,
  SpecParsed,
  SpecStatus,
  AcceptanceCriterion,
  DesignNotes,
  TaskBreakdownItem,
  WorkflowEvent,
  WorkflowEventParsed,
  WorkflowEventDetails,
  PipelineSummary,
  BriefStatus,
} from '../../shared/types/discovery';

// Maximum retry attempts for SQLITE_BUSY errors
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 100;

/**
 * DiscoveryService provides access to the discovery.db SQLite database.
 * It uses better-sqlite3 for synchronous database operations with WAL mode for
 * concurrent access support.
 *
 * Note: The service primarily provides read access but includes limited write
 * operations for sync purposes (e.g., updateBriefStatus for syncing epic status).
 */
class DiscoveryService {
  private db: Database.Database | null = null;
  private dbPath: string | null = null;

  /**
   * Set the path to the discovery.db file
   * @param path - Absolute path to discovery.db
   */
  setDatabasePath(path: string): void {
    // Close existing connection if path changes
    if (this.dbPath !== path) {
      this.close();
    }
    this.dbPath = path;
  }

  /**
   * Get the current database path
   */
  getDatabasePath(): string | null {
    return this.dbPath;
  }

  /**
   * Ensure database connection is open and return it
   * Opens with write access for sync operations
   */
  private ensureConnection(): Database.Database {
    if (!this.db && this.dbPath) {
      try {
        // Open with write access for sync operations
        this.db = new Database(this.dbPath, { readonly: false });
        // Enable WAL mode for better concurrent access
        this.db.pragma('journal_mode = WAL');
        // Set busy timeout for handling concurrent access
        this.db.pragma('busy_timeout = 5000');
        console.log('Discovery database connected:', this.dbPath);
      } catch (err) {
        console.error('Failed to connect to discovery database:', err);
        throw new Error(`Failed to open discovery database: ${err}`);
      }
    }
    if (!this.db) {
      throw new Error('Discovery database not initialized. Call setDatabasePath() first.');
    }
    return this.db;
  }

  /**
   * Execute a query with retry logic for SQLITE_BUSY errors
   */
  private withRetry<T>(operation: () => T): T {
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        return operation();
      } catch (err: unknown) {
        const error = err as Error & { code?: string };
        if (error.code === 'SQLITE_BUSY' && attempt < MAX_RETRIES - 1) {
          lastError = error;
          // Simple synchronous delay for retry
          const start = Date.now();
          while (Date.now() - start < RETRY_DELAY_MS) {
            // Busy wait
          }
          continue;
        }
        throw err;
      }
    }
    throw lastError;
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.db) {
      try {
        this.db.close();
        console.log('Discovery database connection closed');
      } catch (err) {
        console.error('Error closing discovery database:', err);
      }
      this.db = null;
    }
  }

  /**
   * Check if database is connected and accessible
   */
  isConnected(): boolean {
    if (!this.db || !this.dbPath) {
      return false;
    }
    try {
      this.db.prepare('SELECT 1').get();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if the database connection is healthy
   * Similar to isConnected but uses exec for a simpler check
   */
  isHealthy(): boolean {
    try {
      this.db?.exec('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Reconnect to the database
   * Closes existing connection and reopens it
   */
  reconnect(): void {
    this.close();
    this.ensureConnection();
  }

  // ==========================================================================
  // Briefs
  // ==========================================================================

  /**
   * List all briefs with optional filtering
   * @param filters - Optional filters for status, priority, search, etc.
   */
  listBriefs(filters?: BriefFilters): Brief[] {
    const db = this.ensureConnection();

    let sql = 'SELECT * FROM briefs';
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (filters?.status) {
      if (Array.isArray(filters.status)) {
        const placeholders = filters.status.map(() => '?').join(', ');
        conditions.push(`status IN (${placeholders})`);
        params.push(...filters.status);
      } else {
        conditions.push('status = ?');
        params.push(filters.status);
      }
    }

    if (filters?.priority) {
      if (Array.isArray(filters.priority)) {
        const placeholders = filters.priority.map(() => '?').join(', ');
        conditions.push(`priority IN (${placeholders})`);
        params.push(...filters.priority);
      } else {
        conditions.push('priority = ?');
        params.push(filters.priority);
      }
    }

    if (filters?.search) {
      conditions.push('(title LIKE ? OR problem_statement LIKE ? OR initial_thoughts LIKE ?)');
      const searchPattern = `%${filters.search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    if (filters?.hasSpec !== undefined) {
      if (filters.hasSpec) {
        conditions.push('EXISTS (SELECT 1 FROM specs WHERE specs.brief_id = briefs.id)');
      } else {
        conditions.push('NOT EXISTS (SELECT 1 FROM specs WHERE specs.brief_id = briefs.id)');
      }
    }

    if (filters?.hasReviews !== undefined) {
      if (filters.hasReviews) {
        conditions.push('EXISTS (SELECT 1 FROM sme_reviews WHERE sme_reviews.brief_id = briefs.id)');
      } else {
        conditions.push('NOT EXISTS (SELECT 1 FROM sme_reviews WHERE sme_reviews.brief_id = briefs.id)');
      }
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY created_at DESC';

    return this.withRetry(() => {
      const stmt = db.prepare(sql);
      return stmt.all(...params) as Brief[];
    });
  }

  /**
   * Get a single brief by ID
   * @param id - Brief ID
   */
  getBrief(id: string): Brief | null {
    const db = this.ensureConnection();

    return this.withRetry(() => {
      const stmt = db.prepare('SELECT * FROM briefs WHERE id = ?');
      const result = stmt.get(id);
      return (result as Brief) || null;
    });
  }

  /**
   * Get a brief with all its related data (questions, reviews, spec, events)
   * @param id - Brief ID
   */
  getBriefWithRelations(id: string): BriefWithRelations | null {
    const brief = this.getBrief(id);
    if (!brief) {
      return null;
    }

    const questions = this.getQuestionsForBrief(id);
    const reviews = this.getReviewsForBrief(id);
    const spec = this.getSpecForBrief(id);
    const events = this.getEventsForBrief(id);

    // Parse reviews to SMEReviewParsed
    const parsedReviews: SMEReviewParsed[] = reviews.map((review) => ({
      ...review,
      findings: this.parseJson<SMEFindings>(review.findings, { summary: '' }),
    }));

    // Parse spec to SpecParsed if exists
    let parsedSpec: SpecParsed | null = null;
    if (spec) {
      // Parse acceptance_criteria - handle both array of strings and array of objects
      const rawCriteria = this.parseJson<unknown>(spec.acceptance_criteria, []);
      let acceptanceCriteria: AcceptanceCriterion[] = [];
      
      if (Array.isArray(rawCriteria)) {
        acceptanceCriteria = rawCriteria.map((item, index) => {
          // If it's already an object with id and description, use it
          if (typeof item === 'object' && item !== null && 'description' in item) {
            return item as AcceptanceCriterion;
          }
          // If it's a string, convert to object format
          if (typeof item === 'string') {
            return {
              id: `criterion-${index}`,
              description: item,
              completed: false,
            };
          }
          // Fallback for other types
          return {
            id: `criterion-${index}`,
            description: String(item),
            completed: false,
          };
        });
      }

      parsedSpec = {
        ...spec,
        acceptance_criteria: acceptanceCriteria,
        design_notes: this.parseJson<DesignNotes>(spec.design_notes, {}),
        task_breakdown: this.parseJson<TaskBreakdownItem[]>(spec.task_breakdown, []),
      };
    }

    // Parse events to WorkflowEventParsed
    const parsedEvents: WorkflowEventParsed[] = events.map((event) => ({
      ...event,
      details: this.parseJson<WorkflowEventDetails>(event.details, {}),
    }));

    return {
      brief,
      questions,
      reviews: parsedReviews,
      spec: parsedSpec,
      events: parsedEvents,
    };
  }

  /**
   * Update a brief's status
   * Used by sync service to sync beads epic status to brief status
   * @param id - Brief ID
   * @param status - New status
   * @returns Promise resolving to success result
   */
  async updateBriefStatus(id: string, status: BriefStatus): Promise<{ success: boolean }> {
    const db = this.ensureConnection();

    return this.withRetry(() => {
      const stmt = db.prepare(
        'UPDATE briefs SET status = ?, updated_at = datetime(\'now\') WHERE id = ?'
      );
      const result = stmt.run(status, id);
      return { success: result.changes > 0 };
    });
  }

  // ==========================================================================
  // Interview Questions
  // ==========================================================================

  /**
   * Get all interview questions for a brief
   * @param briefId - Brief ID
   */
  getQuestionsForBrief(briefId: string): InterviewQuestion[] {
    const db = this.ensureConnection();

    return this.withRetry(() => {
      const stmt = db.prepare(
        'SELECT * FROM interview_questions WHERE brief_id = ? ORDER BY created_at ASC'
      );
      return stmt.all(briefId) as InterviewQuestion[];
    });
  }

  // ==========================================================================
  // SME Reviews
  // ==========================================================================

  /**
   * Get all SME reviews for a brief
   * @param briefId - Brief ID
   */
  getReviewsForBrief(briefId: string): SMEReview[] {
    const db = this.ensureConnection();

    return this.withRetry(() => {
      const stmt = db.prepare(
        'SELECT * FROM sme_reviews WHERE brief_id = ? ORDER BY created_at ASC'
      );
      return stmt.all(briefId) as SMEReview[];
    });
  }

  // ==========================================================================
  // Specs
  // ==========================================================================

  /**
   * List all specs with optional status filter
   * @param filters - Optional filters including status
   */
  listSpecs(filters?: { status?: SpecStatus }): Spec[] {
    const db = this.ensureConnection();

    let sql = 'SELECT * FROM specs';
    const params: string[] = [];

    if (filters?.status) {
      sql += ' WHERE status = ?';
      params.push(filters.status);
    }

    sql += ' ORDER BY created_at DESC';

    return this.withRetry(() => {
      const stmt = db.prepare(sql);
      return stmt.all(...params) as Spec[];
    });
  }

  /**
   * Get a single spec by ID
   * @param id - Spec ID
   */
  getSpec(id: string): Spec | null {
    const db = this.ensureConnection();

    return this.withRetry(() => {
      const stmt = db.prepare('SELECT * FROM specs WHERE id = ?');
      const result = stmt.get(id);
      return (result as Spec) || null;
    });
  }

  /**
   * Get the spec for a specific brief
   * @param briefId - Brief ID
   */
  getSpecForBrief(briefId: string): Spec | null {
    const db = this.ensureConnection();

    return this.withRetry(() => {
      const stmt = db.prepare('SELECT * FROM specs WHERE brief_id = ?');
      const result = stmt.get(briefId);
      return (result as Spec) || null;
    });
  }

  // ==========================================================================
  // Workflow Events
  // ==========================================================================

  /**
   * Get all workflow events for a brief
   * @param briefId - Brief ID
   */
  getEventsForBrief(briefId: string): WorkflowEvent[] {
    const db = this.ensureConnection();

    return this.withRetry(() => {
      const stmt = db.prepare(
        'SELECT * FROM workflow_events WHERE brief_id = ? ORDER BY created_at DESC'
      );
      return stmt.all(briefId) as WorkflowEvent[];
    });
  }

  /**
   * Get recent workflow events across all briefs
   * @param limit - Maximum number of events to return (default: 50)
   */
  getRecentEvents(limit: number = 50): WorkflowEvent[] {
    const db = this.ensureConnection();

    return this.withRetry(() => {
      const stmt = db.prepare(
        'SELECT * FROM workflow_events ORDER BY created_at DESC LIMIT ?'
      );
      return stmt.all(limit) as WorkflowEvent[];
    });
  }

  // ==========================================================================
  // Pipeline Summary
  // ==========================================================================

  /**
   * Get summary counts for the discovery pipeline
   * Returns count of briefs in each status
   */
  getPipelineSummary(): PipelineSummary {
    const db = this.ensureConnection();

    return this.withRetry(() => {
      const stmt = db.prepare(`
        SELECT
          status,
          COUNT(*) as count
        FROM briefs
        GROUP BY status
      `);
      const rows = stmt.all() as Array<{ status: BriefStatus; count: number }>;

      // Initialize with zeros
      const summary: PipelineSummary = {
        draft: 0,
        in_discovery: 0,
        spec_ready: 0,
        approved: 0,
        exported: 0,
        in_progress: 0,
        completed: 0,
        canceled: 0,
        total: 0,
      };

      // Fill in counts from query results
      for (const row of rows) {
        if (row.status in summary) {
          summary[row.status as keyof Omit<PipelineSummary, 'total'>] = row.count;
        }
        summary.total += row.count;
      }

      return summary;
    });
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Parse a JSON string from database, returning default on failure
   */
  private parseJson<T>(jsonString: string | null, defaultValue: T): T {
    if (!jsonString) {
      return defaultValue;
    }
    try {
      return JSON.parse(jsonString) as T;
    } catch {
      console.warn('Failed to parse JSON from database:', jsonString.substring(0, 100));
      return defaultValue;
    }
  }
}

// Export singleton instance
export const discoveryService = new DiscoveryService();
export default discoveryService;
