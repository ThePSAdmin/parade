// Client wrapper for discovery IPC calls
// Conditionally uses Electron IPC or HTTP API based on environment

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
import { discoveryApi } from './api/discoveryApi';

// Detect if running in Electron or web browser
const isElectron = typeof window !== 'undefined' && 'electron' in window;

// Electron IPC implementation
const electronDiscovery = {
  async listBriefs(filters?: BriefFilters): Promise<Brief[]> {
    return window.electron.discovery.listBriefs(filters);
  },

  async getBrief(id: string): Promise<Brief | null> {
    return window.electron.discovery.getBrief(id);
  },

  async getBriefWithRelations(id: string): Promise<BriefWithRelations | null> {
    return window.electron.discovery.getBriefWithRelations(id);
  },

  async getQuestions(briefId: string): Promise<InterviewQuestion[]> {
    return window.electron.discovery.getQuestions(briefId);
  },

  async getReviews(briefId: string): Promise<SMEReview[]> {
    return window.electron.discovery.getReviews(briefId);
  },

  async listSpecs(filters?: { status?: SpecStatus }): Promise<Spec[]> {
    return window.electron.discovery.listSpecs(filters);
  },

  async getSpec(id: string): Promise<Spec | null> {
    return window.electron.discovery.getSpec(id);
  },

  async getSpecForBrief(briefId: string): Promise<Spec | null> {
    return window.electron.discovery.getSpecForBrief(briefId);
  },

  async getEvents(briefId: string): Promise<WorkflowEvent[]> {
    return window.electron.discovery.getEvents(briefId);
  },

  async getRecentEvents(limit?: number): Promise<WorkflowEvent[]> {
    return window.electron.discovery.getRecentEvents(limit);
  },

  async getPipelineSummary(): Promise<PipelineSummary> {
    return window.electron.discovery.getPipelineSummary();
  },

  async setDatabasePath(path: string): Promise<void> {
    return window.electron.discovery.setDatabasePath(path);
  },

  async getDatabasePath(): Promise<string | null> {
    return window.electron.discovery.getDatabasePath();
  },
};

// Export discovery client - uses Electron IPC or HTTP API based on environment
const discoveryClient = isElectron ? electronDiscovery : discoveryApi;

export default discoveryClient;
