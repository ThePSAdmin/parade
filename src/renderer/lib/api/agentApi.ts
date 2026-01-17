// Agent API client for REST calls

import { api } from './httpClient';
import type {
  Skill,
  AgentSession,
  AgentMessage,
  ListSkillsResponse,
  ListSessionsResponse,
  RunSkillResponse,
} from '../../../shared/types/agent';

export const agentApi = {
  // List available skills
  async listSkills(): Promise<Skill[]> {
    const result = await api.get<ListSkillsResponse>('/api/agent/skills');
    if (result.error) throw new Error(result.error);
    return result.skills;
  },

  // List sessions
  async listSessions(projectPath?: string): Promise<AgentSession[]> {
    const result = await api.get<ListSessionsResponse>(
      '/api/agent/sessions',
      projectPath ? { projectPath } : undefined
    );
    if (result.error) throw new Error(result.error);
    return result.sessions;
  },

  // Get session by ID
  async getSession(sessionId: string): Promise<AgentSession | null> {
    const result = await api.get<{ session?: AgentSession; error?: string }>(
      `/api/agent/sessions/${sessionId}`
    );
    if (result.error) throw new Error(result.error);
    return result.session ?? null;
  },

  // Get messages for a session
  async getMessages(sessionId: string): Promise<AgentMessage[]> {
    const result = await api.get<{ messages: AgentMessage[]; error?: string }>(
      `/api/agent/sessions/${sessionId}/messages`
    );
    if (result.error) throw new Error(result.error);
    return result.messages;
  },

  // Run a skill (via REST - use WebSocket for streaming)
  async runSkill(
    skill: string,
    prompt?: string,
    args?: Record<string, unknown>
  ): Promise<string> {
    const result = await api.post<RunSkillResponse>('/api/agent/run', {
      skill,
      prompt,
      args,
    });
    if (result.error) throw new Error(result.error);
    return result.sessionId!;
  },

  // Continue a session
  async continueSession(sessionId: string, message: string): Promise<void> {
    const result = await api.post<{ success?: boolean; error?: string }>(
      `/api/agent/sessions/${sessionId}/continue`,
      { message }
    );
    if (result.error) throw new Error(result.error);
  },

  // Respond to permission
  async respondToPermission(
    sessionId: string,
    requestId: string,
    decision: 'approve' | 'deny',
    rememberForSession?: boolean
  ): Promise<void> {
    const result = await api.post<{ success?: boolean; error?: string }>(
      `/api/agent/sessions/${sessionId}/permission`,
      { requestId, decision, rememberForSession }
    );
    if (result.error) throw new Error(result.error);
  },

  // Cancel a session
  async cancelSession(sessionId: string): Promise<void> {
    const result = await api.post<{ success?: boolean; error?: string }>(
      `/api/agent/sessions/${sessionId}/cancel`
    );
    if (result.error) throw new Error(result.error);
  },
};

export default agentApi;
