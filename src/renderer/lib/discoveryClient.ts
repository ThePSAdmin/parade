// Client wrapper for discovery IPC calls

import type {
  Brief,
  BriefFilters,
  BriefWithRelations,
  InterviewQuestion,
  SMEReview,
  Spec,
  SpecStatus,
  WorkflowEvent,
  PipelineSummary,
} from '../../shared/types/discovery';

// Thin wrapper around the electronAPI discovery methods
const discoveryClient = {
  /**
   * List all briefs with optional filters
   */
  async listBriefs(filters?: BriefFilters): Promise<Brief[]> {
    return window.electron.discovery.listBriefs(filters);
  },

  /**
   * Get a single brief by ID
   */
  async getBrief(id: string): Promise<Brief | null> {
    return window.electron.discovery.getBrief(id);
  },

  /**
   * Get a brief with all related data (questions, reviews, spec, events)
   */
  async getBriefWithRelations(id: string): Promise<BriefWithRelations | null> {
    return window.electron.discovery.getBriefWithRelations(id);
  },

  /**
   * Get interview questions for a brief
   */
  async getQuestions(briefId: string): Promise<InterviewQuestion[]> {
    return window.electron.discovery.getQuestions(briefId);
  },

  /**
   * Get SME reviews for a brief
   */
  async getReviews(briefId: string): Promise<SMEReview[]> {
    return window.electron.discovery.getReviews(briefId);
  },

  /**
   * List all specs with optional status filter
   */
  async listSpecs(filters?: { status?: SpecStatus }): Promise<Spec[]> {
    return window.electron.discovery.listSpecs(filters);
  },

  /**
   * Get a single spec by ID
   */
  async getSpec(id: string): Promise<Spec | null> {
    return window.electron.discovery.getSpec(id);
  },

  /**
   * Get the spec for a specific brief
   */
  async getSpecForBrief(briefId: string): Promise<Spec | null> {
    return window.electron.discovery.getSpecForBrief(briefId);
  },

  /**
   * Get workflow events for a brief
   */
  async getEvents(briefId: string): Promise<WorkflowEvent[]> {
    return window.electron.discovery.getEvents(briefId);
  },

  /**
   * Get recent workflow events across all briefs
   */
  async getRecentEvents(limit?: number): Promise<WorkflowEvent[]> {
    return window.electron.discovery.getRecentEvents(limit);
  },

  /**
   * Get pipeline summary with counts by status
   */
  async getPipelineSummary(): Promise<PipelineSummary> {
    return window.electron.discovery.getPipelineSummary();
  },

  /**
   * Set the discovery database path
   */
  async setDatabasePath(path: string): Promise<void> {
    return window.electron.discovery.setDatabasePath(path);
  },

  /**
   * Get the current discovery database path
   */
  async getDatabasePath(): Promise<string | null> {
    return window.electron.discovery.getDatabasePath();
  },
};

export default discoveryClient;
