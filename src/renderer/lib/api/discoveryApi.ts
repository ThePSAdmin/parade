// Discovery REST API client (web mode)

import { api } from './httpClient';
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
} from '../../../shared/types/discovery';

export const discoveryApi = {
  async listBriefs(filters?: BriefFilters): Promise<Brief[]> {
    // Convert array filter to comma-separated string
    const statusStr = Array.isArray(filters?.status) ? filters.status.join(',') : filters?.status;
    return api.get<Brief[]>('/api/discovery/briefs', {
      status: statusStr,
    });
  },

  async getBrief(id: string): Promise<Brief | null> {
    return api.get<Brief | null>(`/api/discovery/briefs/${id}`);
  },

  async getBriefWithRelations(id: string): Promise<BriefWithRelations | null> {
    return api.get<BriefWithRelations | null>(`/api/discovery/briefs/${id}/full`);
  },

  async getQuestions(briefId: string): Promise<InterviewQuestion[]> {
    return api.get<InterviewQuestion[]>(`/api/discovery/briefs/${briefId}/questions`);
  },

  async getReviews(briefId: string): Promise<SMEReview[]> {
    return api.get<SMEReview[]>(`/api/discovery/briefs/${briefId}/reviews`);
  },

  async listSpecs(filters?: { status?: SpecStatus }): Promise<Spec[]> {
    return api.get<Spec[]>('/api/discovery/specs', {
      status: filters?.status,
    });
  },

  async getSpec(id: string): Promise<Spec | null> {
    return api.get<Spec | null>(`/api/discovery/specs/${id}`);
  },

  async getSpecForBrief(briefId: string): Promise<Spec | null> {
    return api.get<Spec | null>(`/api/discovery/briefs/${briefId}/spec`);
  },

  async getEvents(briefId: string): Promise<WorkflowEvent[]> {
    return api.get<WorkflowEvent[]>(`/api/discovery/briefs/${briefId}/events`);
  },

  async getRecentEvents(limit?: number): Promise<WorkflowEvent[]> {
    return api.get<WorkflowEvent[]>('/api/discovery/events/recent', { limit });
  },

  async getPipelineSummary(): Promise<PipelineSummary> {
    return api.get<PipelineSummary>('/api/discovery/pipeline/summary');
  },

  async setDatabasePath(path: string): Promise<void> {
    await api.post('/api/discovery/config/db-path', { path });
  },

  async getDatabasePath(): Promise<string | null> {
    const result = await api.get<{ path: string | null }>('/api/discovery/config/db-path');
    return result.path;
  },

  async setSdkSessionId(briefId: string, sdkSessionId: string): Promise<{ success: boolean; error?: string }> {
    return api.post<{ success: boolean; error?: string }>(`/api/discovery/briefs/${briefId}/sdk-session`, {
      sdkSessionId,
    });
  },
};

export default discoveryApi;
