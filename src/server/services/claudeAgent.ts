/**
 * ClaudeAgentService - SDK wrapper for running Claude skills from the web UI
 */

import { query } from '@anthropic-ai/claude-agent-sdk';
import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';
import type {
  AgentSession,
  AgentMessage,
  PermissionRequest,
  Skill,
  PermissionType,
} from '../../shared/types/agent';

interface SessionState {
  session: AgentSession;
  messages: AgentMessage[];
  pendingPermission: PermissionRequest | null;
  pendingPermissionResolve: ((decision: 'approve' | 'deny') => void) | null;
  approvedPermissions: Set<string>; // Permission types approved for session
  abortController: AbortController | null;
}

type AgentEventMap = {
  message: [sessionId: string, message: AgentMessage];
  permission_request: [sessionId: string, permission: PermissionRequest];
  complete: [sessionId: string, status: 'success' | 'error' | 'cancelled', error?: string];
};

class ClaudeAgentService extends EventEmitter<AgentEventMap> {
  private projectPath: string | null = null;
  private sessions: Map<string, SessionState> = new Map();

  setProjectPath(projectPath: string) {
    this.projectPath = projectPath;
  }

  /**
   * List available skills from .claude/skills/ directory
   */
  async listSkills(): Promise<Skill[]> {
    if (!this.projectPath) {
      throw new Error('Project path not set');
    }

    const skillsDir = path.join(this.projectPath, '.claude', 'skills');
    if (!fs.existsSync(skillsDir)) {
      return [];
    }

    const skills: Skill[] = [];
    const entries = fs.readdirSync(skillsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const skillPath = path.join(skillsDir, entry.name, 'SKILL.md');
        if (fs.existsSync(skillPath)) {
          const content = fs.readFileSync(skillPath, 'utf-8');
          // Extract description from first paragraph after title
          const lines = content.split('\n');
          let description = '';
          for (const line of lines) {
            if (line.startsWith('#')) continue;
            if (line.trim()) {
              description = line.trim();
              break;
            }
          }
          skills.push({
            name: entry.name,
            description: description || `Run ${entry.name} skill`,
            filePath: skillPath,
          });
        }
      }
    }

    return skills;
  }

  /**
   * Get skill content by name
   */
  private async getSkillContent(skillName: string): Promise<string> {
    if (!this.projectPath) {
      throw new Error('Project path not set');
    }

    const skillPath = path.join(
      this.projectPath,
      '.claude',
      'skills',
      skillName,
      'SKILL.md'
    );

    if (!fs.existsSync(skillPath)) {
      throw new Error(`Skill not found: ${skillName}`);
    }

    return fs.readFileSync(skillPath, 'utf-8');
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate a unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate a unique permission request ID
   */
  private generatePermissionId(): string {
    return `perm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Classify a tool call for permission type
   */
  private classifyPermission(
    toolName: string,
    input: Record<string, unknown>
  ): PermissionType {
    if (toolName === 'Read' || toolName === 'Glob' || toolName === 'Grep') {
      return 'file_read';
    }

    if (toolName === 'Edit') {
      return 'file_edit';
    }

    if (toolName === 'Write') {
      const filePath = input.file_path as string | undefined;
      if (filePath && fs.existsSync(filePath)) {
        return 'file_edit';
      }
      return 'file_create';
    }

    if (toolName === 'Bash') {
      const command = input.command as string | undefined;
      if (command) {
        // Classify bash commands
        if (command.match(/\brm\b/)) {
          return 'file_delete';
        }
        if (command.match(/\bgit\b/)) {
          return 'bash_git';
        }
        // Read-only commands
        if (
          command.match(
            /^(ls|cat|head|tail|grep|find|echo|pwd|which|env|printenv)\b/
          )
        ) {
          return 'bash_readonly';
        }
        return 'bash_write';
      }
    }

    return 'file_read'; // Default to safest
  }

  /**
   * Check if a tool call should be auto-approved
   */
  private shouldAutoApprove(
    toolName: string,
    input: Record<string, unknown>,
    approvedPermissions: Set<string>
  ): boolean {
    const permType = this.classifyPermission(toolName, input);

    // Auto-approve read operations
    if (permType === 'file_read' || permType === 'bash_readonly') {
      return true;
    }

    // Check if user has approved this type for the session
    if (approvedPermissions.has(permType)) {
      return true;
    }

    return false;
  }

  /**
   * Run a skill and stream results
   */
  async run(
    skillName: string,
    userPrompt?: string,
    args?: Record<string, unknown>
  ): Promise<string> {
    if (!this.projectPath) {
      throw new Error('Project path not set');
    }

    const skillContent = await this.getSkillContent(skillName);
    const sessionId = this.generateSessionId();
    const abortController = new AbortController();

    // Create session state
    const sessionState: SessionState = {
      session: {
        id: sessionId,
        skillName,
        status: 'running',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        projectPath: this.projectPath,
      },
      messages: [],
      pendingPermission: null,
      pendingPermissionResolve: null,
      approvedPermissions: new Set(),
      abortController,
    };
    this.sessions.set(sessionId, sessionState);

    // Emit init message
    const initMessage: AgentMessage = {
      id: this.generateMessageId(),
      sessionId,
      type: 'system',
      timestamp: new Date().toISOString(),
      content: {
        type: 'system',
        subtype: 'init',
        sessionId,
        message: `Starting skill: ${skillName}`,
      },
    };
    sessionState.messages.push(initMessage);
    this.emit('message', sessionId, initMessage);

    // Build the prompt
    const fullPrompt = userPrompt
      ? `${skillContent}\n\n---\n\nUser request: ${userPrompt}${args ? `\n\nArguments: ${JSON.stringify(args)}` : ''}`
      : skillContent;

    // Run the query in background
    this.runQuery(sessionId, fullPrompt).catch((error) => {
      console.error('Query error:', error);
      this.emit(
        'complete',
        sessionId,
        'error',
        error instanceof Error ? error.message : 'Unknown error'
      );
    });

    return sessionId;
  }

  /**
   * Run with a freeform prompt (no skill)
   */
  async runWithPrompt(prompt: string): Promise<string> {
    if (!this.projectPath) {
      throw new Error('Project path not set');
    }

    const sessionId = this.generateSessionId();
    const abortController = new AbortController();

    // Create session state
    const sessionState: SessionState = {
      session: {
        id: sessionId,
        skillName: undefined,
        status: 'running',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        projectPath: this.projectPath,
      },
      messages: [],
      pendingPermission: null,
      pendingPermissionResolve: null,
      approvedPermissions: new Set(),
      abortController,
    };
    this.sessions.set(sessionId, sessionState);

    // Emit init message
    const initMessage: AgentMessage = {
      id: this.generateMessageId(),
      sessionId,
      type: 'system',
      timestamp: new Date().toISOString(),
      content: {
        type: 'system',
        subtype: 'init',
        sessionId,
        message: 'Session init',
      },
    };
    sessionState.messages.push(initMessage);
    this.emit('message', sessionId, initMessage);

    // Run the query in background
    this.runQuery(sessionId, prompt).catch((error) => {
      console.error('Query error:', error);
      this.emit(
        'complete',
        sessionId,
        'error',
        error instanceof Error ? error.message : 'Unknown error'
      );
    });

    return sessionId;
  }

  /**
   * Continue a session with a new message
   */
  async continue(sessionId: string, message: string): Promise<void> {
    const state = this.sessions.get(sessionId);
    if (!state) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    // Add user message
    const userMessage: AgentMessage = {
      id: this.generateMessageId(),
      sessionId,
      type: 'user',
      timestamp: new Date().toISOString(),
      content: {
        type: 'user',
        text: message,
      },
    };
    state.messages.push(userMessage);
    this.emit('message', sessionId, userMessage);

    // Resume the session
    state.session.status = 'running';
    state.session.updatedAt = new Date().toISOString();
    state.abortController = new AbortController();

    this.runQuery(sessionId, message, state.session.id).catch((error) => {
      console.error('Continue error:', error);
      this.emit(
        'complete',
        sessionId,
        'error',
        error instanceof Error ? error.message : 'Unknown error'
      );
    });
  }

  /**
   * Respond to a permission request
   */
  async respondToPermission(
    sessionId: string,
    requestId: string,
    decision: 'approve' | 'deny',
    rememberForSession?: boolean
  ): Promise<void> {
    console.log(`[Permission] Responding to permission: session=${sessionId}, request=${requestId}, decision=${decision}`);
    const state = this.sessions.get(sessionId);
    if (!state) {
      console.log(`[Permission] Session not found: ${sessionId}`);
      throw new Error(`Session not found: ${sessionId}`);
    }

    console.log(`[Permission] Pending permission: ${state.pendingPermission?.id}`);
    console.log(`[Permission] Has resolver: ${!!state.pendingPermissionResolve}`);

    if (!state.pendingPermission || state.pendingPermission.id !== requestId) {
      console.log(`[Permission] Request ID mismatch: expected=${state.pendingPermission?.id}, got=${requestId}`);
      throw new Error(`Permission request not found: ${requestId}`);
    }

    if (rememberForSession && decision === 'approve') {
      state.approvedPermissions.add(state.pendingPermission.type);
    }

    // Resolve the pending Promise to continue execution
    if (state.pendingPermissionResolve) {
      console.log(`[Permission] Resolving promise with decision: ${decision}`);
      state.pendingPermissionResolve(decision);
    } else {
      console.log(`[Permission] No resolver found!`);
    }

    state.pendingPermission = null;
  }

  /**
   * Cancel a running session
   */
  async cancel(sessionId: string): Promise<void> {
    const state = this.sessions.get(sessionId);
    if (!state) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    if (state.abortController) {
      state.abortController.abort();
    }

    state.session.status = 'completed';
    state.session.updatedAt = new Date().toISOString();
    this.emit('complete', sessionId, 'cancelled');
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): AgentSession | null {
    const state = this.sessions.get(sessionId);
    return state?.session ?? null;
  }

  /**
   * Get all sessions
   */
  listSessions(): AgentSession[] {
    return Array.from(this.sessions.values()).map((s) => s.session);
  }

  /**
   * Get messages for a session
   */
  getMessages(sessionId: string): AgentMessage[] {
    const state = this.sessions.get(sessionId);
    return state?.messages ?? [];
  }

  /**
   * Internal: Run the query and process messages
   */
  private async runQuery(
    sessionId: string,
    prompt: string,
    resumeSessionId?: string
  ): Promise<void> {
    const state = this.sessions.get(sessionId);
    if (!state) return;

    try {
      const response = query({
        prompt,
        options: {
          model: 'claude-sonnet-4-5',
          cwd: this.projectPath!,
          abortController: state.abortController || undefined,
          ...(resumeSessionId && { resume: resumeSessionId }),
          // TEMPORARY: Bypass all permissions for testing
          permissionMode: 'bypassPermissions',
        },
      });

      for await (const message of response) {
        // Check for abort
        if (state.abortController?.signal.aborted) {
          break;
        }

        const agentMessage = this.convertMessage(sessionId, message);
        if (agentMessage) {
          state.messages.push(agentMessage);
          this.emit('message', sessionId, agentMessage);
        }

        // Handle completion - SDK uses 'result' type for completion
        if (message.type === 'result') {
          state.session.status = 'completed';
          state.session.updatedAt = new Date().toISOString();
          const isError = 'is_error' in message && message.is_error;
          this.emit('complete', sessionId, isError ? 'error' : 'success');
          return;
        }
      }

      // If we got here without explicit completion, mark as completed
      if (state.session.status === 'running') {
        state.session.status = 'completed';
        state.session.updatedAt = new Date().toISOString();
        this.emit('complete', sessionId, 'success');
      }
    } catch (error) {
      state.session.status = 'error';
      state.session.updatedAt = new Date().toISOString();
      throw error;
    }
  }

  /**
   * Convert SDK message to our AgentMessage type
   */
  private convertMessage(
    sessionId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sdkMessage: any
  ): AgentMessage | null {
    const baseMessage = {
      id: this.generateMessageId(),
      sessionId,
      timestamp: new Date().toISOString(),
    };

    switch (sdkMessage.type) {
      case 'assistant': {
        // SDK uses BetaMessage structure with message.content array
        const message = sdkMessage.message;
        const contentArray = message?.content || [];
        const textContent = contentArray
          .filter((b: { type: string }) => b.type === 'text')
          .map((b: { text: string }) => b.text)
          .join('\n');

        return {
          ...baseMessage,
          type: 'assistant',
          content: {
            type: 'assistant',
            text: textContent || '',
            contentBlocks: contentArray,
          },
        };
      }

      case 'system':
        return {
          ...baseMessage,
          type: 'system',
          content: {
            type: 'system',
            subtype: sdkMessage.subtype || 'info',
            sessionId: sdkMessage.session_id,
            message: sdkMessage.message,
          },
        };

      case 'result':
        // Result messages indicate completion - handled separately
        return {
          ...baseMessage,
          type: 'system',
          content: {
            type: 'system',
            subtype: 'completion' as const,
            sessionId: sdkMessage.session_id,
            message: sdkMessage.result || 'Completed',
          },
        };

      default:
        // Skip other message types (stream_event, etc.)
        return null;
    }
  }

  /**
   * Get human-readable permission description
   */
  private getPermissionDescription(
    toolName: string,
    input: Record<string, unknown>
  ): string {
    switch (toolName) {
      case 'Edit':
        return `Edit file: ${input.file_path}`;
      case 'Write':
        return `Write file: ${input.file_path}`;
      case 'Bash':
        return `Run command: ${input.command}`;
      case 'Read':
        return `Read file: ${input.file_path}`;
      default:
        return `${toolName}: ${JSON.stringify(input)}`;
    }
  }
}

export const claudeAgentService = new ClaudeAgentService();
export default claudeAgentService;
