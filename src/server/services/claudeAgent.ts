/**
 * ClaudeAgentService - SDK wrapper for running Claude skills from the web UI
 *
 * Delegates to AgentJobQueue for process-isolated SDK execution.
 */

import { EventEmitter } from 'events';
import fs from 'fs';
import os from 'os';
import path from 'path';
import type {
  AgentSession,
  AgentMessage,
  PermissionRequest,
  Skill,
} from '../../shared/types/agent';
import { AgentJobQueue, type JobRequest } from './agentJobQueue';

interface SessionState {
  session: AgentSession;
  messages: AgentMessage[];
  pendingPermission: PermissionRequest | null;
  pendingPermissionResolve: ((decision: 'approve' | 'deny') => void) | null;
  approvedPermissions: Set<string>; // Permission types approved for session
  sdkSessionId: string | null; // The SDK's conversation ID, used for resume
  jobId: string | null; // The job queue's job ID
}

type AgentEventMap = {
  message: [sessionId: string, message: AgentMessage];
  permission_request: [sessionId: string, permission: PermissionRequest];
  complete: [sessionId: string, status: 'success' | 'error' | 'cancelled', error?: string];
};

class ClaudeAgentService extends EventEmitter<AgentEventMap> {
  private projectPath: string | null = null;
  private sessions: Map<string, SessionState> = new Map();
  private jobQueue: AgentJobQueue | null = null;
  private jobQueueInitialized = false;

  setProjectPath(projectPath: string) {
    this.projectPath = projectPath;
  }

  /**
   * Initialize the job queue if not already initialized
   */
  private async ensureJobQueue(): Promise<AgentJobQueue> {
    if (!this.jobQueue) {
      this.jobQueue = new AgentJobQueue({ poolSize: 2 });

      // Set up event listeners for job queue events
      this.jobQueue.on('message', this.handleJobQueueMessage.bind(this));
      this.jobQueue.on('complete', this.handleJobQueueComplete.bind(this));
      this.jobQueue.on('error', this.handleJobQueueError.bind(this));
    }

    if (!this.jobQueueInitialized) {
      await this.jobQueue.start();
      this.jobQueueInitialized = true;
    }

    return this.jobQueue;
  }

  /**
   * Handle messages from the job queue
   */
  private handleJobQueueMessage(event: { sessionId: string; data: AgentMessage }): void {
    const state = this.sessions.get(event.sessionId);
    if (!state) return;

    // The data is already an AgentMessage from the worker
    const message = event.data;

    // Capture SDK session ID from system init message for resume support
    if (
      message.type === 'system' &&
      message.content.type === 'system' &&
      message.content.subtype === 'init' &&
      message.content.sessionId
    ) {
      state.sdkSessionId = message.content.sessionId;
    }

    state.messages.push(message);
    this.emit('message', event.sessionId, message);
  }

  /**
   * Handle job completion from the job queue
   */
  private handleJobQueueComplete(event: {
    jobId: string;
    sessionId: string;
    status: string;
    error?: string;
  }): void {
    const state = this.sessions.get(event.sessionId);
    if (!state) return;

    if (event.status === 'success') {
      state.session.status = 'completed';
      state.session.updatedAt = new Date().toISOString();
      this.emit('complete', event.sessionId, 'success', undefined);
    } else {
      state.session.status = 'error';
      state.session.updatedAt = new Date().toISOString();
      this.emit('complete', event.sessionId, 'error', event.error);
    }
  }

  /**
   * Handle errors from the job queue
   */
  private handleJobQueueError(event: { sessionId: string; error: string }): void {
    const state = this.sessions.get(event.sessionId);
    if (!state) return;

    state.session.status = 'error';
    state.session.updatedAt = new Date().toISOString();
    this.emit('complete', event.sessionId, 'error', event.error);
  }

  /**
   * List available skills from both global and project-local directories
   * Scans ~/.claude/skills/ (global) and ./.claude/skills/ (project)
   * Project skills take precedence over global skills with the same name
   */
  async listSkills(): Promise<Skill[]> {
    if (!this.projectPath) {
      throw new Error('Project path not set');
    }

    const skillsMap = new Map<string, Skill>();

    // Helper to scan a skills directory and add to map
    const scanSkillsDir = (skillsDir: string): void => {
      if (!fs.existsSync(skillsDir)) {
        return;
      }

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
            skillsMap.set(entry.name, {
              name: entry.name,
              description: description || `Run ${entry.name} skill`,
              filePath: skillPath,
            });
          }
        }
      }
    };

    // Scan global directory first
    const globalSkillsDir = path.join(os.homedir(), '.claude', 'skills');
    scanSkillsDir(globalSkillsDir);

    // Scan project directory second (overwrites global skills with same name)
    const projectSkillsDir = path.join(this.projectPath, '.claude', 'skills');
    scanSkillsDir(projectSkillsDir);

    return Array.from(skillsMap.values());
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

  // NOTE: Permission classification methods removed while permissionMode: 'bypassPermissions'
  // is active. When permission handling is re-enabled, recreate:
  // - generatePermissionId(): string
  // - classifyPermission(toolName, input): PermissionType
  // - shouldAutoApprove(toolName, input, approvedPermissions): boolean

  /**
   * Run a skill and stream results
   * Skills are invoked via slash command syntax (e.g., "/discover args")
   * which the SDK handles natively
   */
  async run(
    skillName: string,
    userPrompt?: string,
    _args?: Record<string, unknown>
  ): Promise<string> {
    if (!this.projectPath) {
      throw new Error('Project path not set');
    }

    const sessionId = this.generateSessionId();

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
      sdkSessionId: null,
      jobId: null,
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

    // Build the prompt as a slash command - the SDK handles skill invocation natively
    // Format: "/{skillName}" or "/{skillName} {userPrompt}"
    const fullPrompt = userPrompt
      ? `/${skillName} ${userPrompt}`
      : `/${skillName}`;

    // Dispatch to job queue for process-isolated execution
    const jobQueue = await this.ensureJobQueue();
    const jobRequest: JobRequest = {
      sessionId,
      prompt: fullPrompt,
      options: {
        cwd: this.projectPath,
        model: 'claude-sonnet-4-5',
      },
    };
    const jobId = jobQueue.dispatch(jobRequest);
    sessionState.jobId = jobId;

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
      sdkSessionId: null,
      jobId: null,
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

    // Dispatch to job queue for process-isolated execution
    const jobQueue = await this.ensureJobQueue();
    const jobRequest: JobRequest = {
      sessionId,
      prompt,
      options: {
        cwd: this.projectPath,
        model: 'claude-sonnet-4-5',
      },
    };
    const jobId = jobQueue.dispatch(jobRequest);
    sessionState.jobId = jobId;

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

    // Resume the session using SDK's conversation ID
    if (!state.sdkSessionId) {
      throw new Error('Cannot continue session: SDK session ID not available');
    }

    state.session.status = 'running';
    state.session.updatedAt = new Date().toISOString();

    // Dispatch to job queue with resume option
    const jobQueue = await this.ensureJobQueue();
    const jobRequest: JobRequest = {
      sessionId,
      prompt: message,
      options: {
        cwd: state.session.projectPath,
        model: 'claude-sonnet-4-5',
        resume: state.sdkSessionId,
      },
    };
    const jobId = jobQueue.dispatch(jobRequest);
    state.jobId = jobId;
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

    // Abort the job in the queue
    if (this.jobQueue) {
      this.jobQueue.abort(sessionId);
    }

    state.session.status = 'completed';
    state.session.updatedAt = new Date().toISOString();
    this.emit('complete', sessionId, 'cancelled', undefined);
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): AgentSession | null {
    const state = this.sessions.get(sessionId);
    return state?.session ?? null;
  }

  /**
   * Get all sessions, optionally filtered by project path
   */
  listSessions(projectPath?: string): AgentSession[] {
    const allSessions = Array.from(this.sessions.values()).map((s) => s.session);

    if (projectPath) {
      return allSessions.filter((session) => session.projectPath === projectPath);
    }

    return allSessions;
  }

  /**
   * Get messages for a session
   */
  getMessages(sessionId: string): AgentMessage[] {
    const state = this.sessions.get(sessionId);
    return state?.messages ?? [];
  }

  /**
   * Reset internal state - FOR TESTING ONLY
   * Clears sessions and resets job queue initialization flag
   */
  _resetForTesting(): void {
    this.sessions.clear();
    this.jobQueue = null;
    this.jobQueueInitialized = false;
  }

  // NOTE: runQuery() and convertMessage() methods moved to agentWorker.ts
  // for process-isolated SDK execution. Message conversion now happens in
  // the worker and messages are forwarded via IPC to handleJobQueueMessage().

  // NOTE: getPermissionDescription(toolName, input) removed while permissionMode: 'bypassPermissions'
  // is active. Recreate when permission handling is re-enabled.
}

export const claudeAgentService = new ClaudeAgentService();
export default claudeAgentService;
