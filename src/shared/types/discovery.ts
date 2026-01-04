// Discovery workflow types - matching discovery.db schema

// ============================================================================
// Enums and Literal Types
// ============================================================================

/** Brief lifecycle status */
export type BriefStatus = 'draft' | 'in_discovery' | 'spec_ready' | 'approved' | 'exported' | 'in_progress' | 'completed' | 'canceled';

/** Spec review status */
export type SpecStatus = 'draft' | 'review' | 'approved' | 'exported';

/** Category of interview question */
export type QuestionCategory = 'technical' | 'business' | 'ux' | 'scope';

/** Type of SME agent performing review */
export type AgentType = 'technical-sme' | 'business-sme';

/** Brief priority levels (1=critical, 4=lowest) */
export type BriefPriority = 1 | 2 | 3 | 4;

/** Priority labels for display */
export const PRIORITY_LABELS: Record<BriefPriority, string> = {
  1: 'Critical',
  2: 'High',
  3: 'Medium',
  4: 'Low',
} as const;

/** Status labels for display */
export const BRIEF_STATUS_LABELS: Record<BriefStatus, string> = {
  draft: 'Draft',
  in_discovery: 'In Discovery',
  spec_ready: 'Spec Ready',
  approved: 'Approved',
  exported: 'Exported',
  in_progress: 'In Progress',
  completed: 'Completed',
  canceled: 'Canceled',
} as const;

// ============================================================================
// JSON Field Types (parsed from string columns)
// ============================================================================

/** Single acceptance criterion */
export interface AcceptanceCriterion {
  id: string;
  description: string;
  completed?: boolean;
}

/** Task in the breakdown */
export interface TaskBreakdownItem {
  id: string;
  title: string;
  description?: string;
  estimatedHours?: number;
  complexity?: 'low' | 'medium' | 'high';
  dependencies?: string[];
}

/** Design notes structure */
export interface DesignNotes {
  approach?: string;
  architecture?: string;
  components?: string[];
  dataFlow?: string;
  integrations?: string[];
  risks?: string[];
  alternatives?: string[];
}

/** SME findings structure */
export interface SMEFindings {
  summary: string;
  strengths?: string[];
  weaknesses?: string[];
  gaps?: string[];
  feasibility?: 'low' | 'medium' | 'high';
  estimatedEffort?: string;
}

/** Workflow event details (varies by event type) */
export interface WorkflowEventDetails {
  previousStatus?: BriefStatus | SpecStatus;
  newStatus?: BriefStatus | SpecStatus;
  agentType?: AgentType;
  questionId?: string;
  specId?: string;
  epicId?: string;
  message?: string;
  [key: string]: unknown;
}

// ============================================================================
// Database Entity Types
// ============================================================================

/**
 * Brief - Initial feature idea entering discovery pipeline
 * Table: briefs
 */
export interface Brief {
  /** Unique identifier (primary key) */
  id: string;
  /** Brief title/name */
  title: string;
  /** Problem statement describing what needs to be solved */
  problem_statement: string | null;
  /** Initial thoughts and context */
  initial_thoughts: string | null;
  /** Priority level (1=critical, 2=high, 3=medium, 4=low) */
  priority: BriefPriority;
  /** Current status in discovery workflow */
  status: BriefStatus;
  /** ISO datetime when created */
  created_at: string;
  /** ISO datetime when last updated */
  updated_at: string | null;
  /** ID of exported epic in beads (if exported) */
  exported_epic_id: string | null;
}

/**
 * Interview Question - Discovery questions and answers for a brief
 * Table: interview_questions
 */
export interface InterviewQuestion {
  /** Unique identifier */
  id: string;
  /** Foreign key to briefs table */
  brief_id: string;
  /** The question text */
  question: string;
  /** Question category */
  category: QuestionCategory;
  /** Answer to the question (null if unanswered) */
  answer: string | null;
  /** ISO datetime when answered */
  answered_at: string | null;
  /** ISO datetime when created */
  created_at: string;
}

/**
 * SME Review - Expert review findings for a brief
 * Table: sme_reviews
 */
export interface SMEReview {
  /** Unique identifier */
  id: string;
  /** Foreign key to briefs table */
  brief_id: string;
  /** Type of SME agent that performed review */
  agent_type: AgentType;
  /** Structured findings (JSON string in DB, parsed type here) */
  findings: string;
  /** Recommendations text */
  recommendations: string;
  /** Concerns and risks text */
  concerns: string;
  /** ISO datetime when created */
  created_at: string;
}

/**
 * SME Review with parsed findings
 */
export interface SMEReviewParsed extends Omit<SMEReview, 'findings'> {
  findings: SMEFindings;
}

/**
 * Spec - Synthesized specification from discovery
 * Table: specs
 */
export interface Spec {
  /** Unique identifier */
  id: string;
  /** Foreign key to briefs table */
  brief_id: string;
  /** Spec title */
  title: string;
  /** Spec description */
  description: string | null;
  /** Acceptance criteria (JSON string in DB) */
  acceptance_criteria: string;
  /** Design notes (JSON string in DB) */
  design_notes: string;
  /** Task breakdown (JSON string in DB) */
  task_breakdown: string;
  /** Current status */
  status: SpecStatus;
  /** ISO datetime when approved */
  approved_at: string | null;
  /** ID of exported epic in beads (if exported) */
  exported_epic_id: string | null;
  /** ISO datetime when created */
  created_at: string;
}

/**
 * Spec with parsed JSON fields
 */
export interface SpecParsed extends Omit<Spec, 'acceptance_criteria' | 'design_notes' | 'task_breakdown'> {
  acceptance_criteria: AcceptanceCriterion[];
  design_notes: DesignNotes;
  task_breakdown: TaskBreakdownItem[];
}

/**
 * Workflow Event - Audit trail entry
 * Table: workflow_events
 */
export interface WorkflowEvent {
  /** Auto-increment primary key */
  id: number;
  /** Foreign key to briefs table */
  brief_id: string;
  /** Type of event (e.g., 'status_changed', 'question_answered', 'review_completed') */
  event_type: string;
  /** Event details (JSON string in DB) */
  details: string;
  /** ISO datetime when created */
  created_at: string;
}

/**
 * Workflow Event with parsed details
 */
export interface WorkflowEventParsed extends Omit<WorkflowEvent, 'details'> {
  details: WorkflowEventDetails;
}

// ============================================================================
// Aggregate/View Types
// ============================================================================

/**
 * Brief with all related data for display
 */
export interface BriefWithRelations {
  brief: Brief;
  questions: InterviewQuestion[];
  reviews: SMEReviewParsed[];
  spec: SpecParsed | null;
  events: WorkflowEventParsed[];
}

/**
 * Summary counts for pipeline board display
 */
export interface PipelineSummary {
  draft: number;
  in_discovery: number;
  spec_ready: number;
  approved: number;
  exported: number;
  in_progress: number;
  completed: number;
  canceled: number;
  total: number;
}

/**
 * Brief card data for pipeline visualization
 */
export interface BriefCard {
  id: string;
  title: string;
  priority: BriefPriority;
  status: BriefStatus;
  questionsCount: number;
  questionsAnswered: number;
  hasReviews: boolean;
  hasSpec: boolean;
  createdAt: string;
  updatedAt: string | null;
}

// ============================================================================
// Input Types (for create/update operations)
// ============================================================================

/**
 * Parameters for creating a new brief
 */
export interface CreateBriefParams {
  title: string;
  problem_statement?: string;
  initial_thoughts?: string;
  priority?: BriefPriority;
}

/**
 * Parameters for updating a brief
 */
export interface UpdateBriefParams {
  title?: string;
  problem_statement?: string;
  initial_thoughts?: string;
  priority?: BriefPriority;
  status?: BriefStatus;
}

/**
 * Parameters for creating an interview question
 */
export interface CreateQuestionParams {
  brief_id: string;
  question: string;
  category: QuestionCategory;
}

/**
 * Parameters for answering a question
 */
export interface AnswerQuestionParams {
  id: string;
  answer: string;
}

/**
 * Parameters for creating an SME review
 */
export interface CreateSMEReviewParams {
  brief_id: string;
  agent_type: AgentType;
  findings: SMEFindings;
  recommendations: string;
  concerns: string;
}

/**
 * Parameters for creating a spec
 */
export interface CreateSpecParams {
  brief_id: string;
  title: string;
  description?: string;
  acceptance_criteria: AcceptanceCriterion[];
  design_notes: DesignNotes;
  task_breakdown: TaskBreakdownItem[];
}

/**
 * Parameters for updating a spec
 */
export interface UpdateSpecParams {
  title?: string;
  description?: string;
  acceptance_criteria?: AcceptanceCriterion[];
  design_notes?: DesignNotes;
  task_breakdown?: TaskBreakdownItem[];
  status?: SpecStatus;
}

// ============================================================================
// Filter Types
// ============================================================================

/**
 * Filters for listing briefs
 */
export interface BriefFilters {
  status?: BriefStatus | BriefStatus[];
  priority?: BriefPriority | BriefPriority[];
  search?: string;
  hasSpec?: boolean;
  hasReviews?: boolean;
}

/**
 * Filters for listing workflow events
 */
export interface EventFilters {
  brief_id?: string;
  event_type?: string | string[];
  since?: string;
  until?: string;
}
