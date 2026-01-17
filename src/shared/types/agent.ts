/**
 * Shared types for Claude Agent SDK integration
 */

// Session types
export interface AgentSession {
  id: string;
  skillName?: string;  // Optional for freeform prompt sessions
  status: AgentSessionStatus;
  createdAt: string;
  updatedAt: string;
  projectPath: string;
}

export type AgentSessionStatus =
  | 'running'
  | 'paused'
  | 'completed'
  | 'error'
  | 'waiting_permission';

// Message types from the SDK
export type AgentMessageType =
  | 'assistant'
  | 'tool_call'
  | 'tool_result'
  | 'error'
  | 'system'
  | 'user';

export interface AgentMessage {
  id: string;
  sessionId: string;
  type: AgentMessageType;
  timestamp: string;
  content: AgentMessageContent;
}

export type AgentMessageContent =
  | AssistantContent
  | ToolCallContent
  | ToolResultContent
  | ErrorContent
  | SystemContent
  | UserContent;

export interface AssistantContent {
  type: 'assistant';
  text: string;
  contentBlocks?: ContentBlock[];
}

export interface ContentBlock {
  type: 'text' | 'tool_use';
  text?: string;
  name?: string;
  input?: Record<string, unknown>;
}

export interface ToolCallContent {
  type: 'tool_call';
  toolName: string;
  input: Record<string, unknown>;
}

export interface ToolResultContent {
  type: 'tool_result';
  toolName: string;
  result: string;
  isError?: boolean;
}

export interface ErrorContent {
  type: 'error';
  errorType: string;
  message: string;
  tool?: string;
}

export interface SystemContent {
  type: 'system';
  subtype: 'init' | 'completion' | 'info' | 'compact_boundary' | 'status' | 'hook_response' | 'task_notification';
  sessionId?: string;
  message?: string;
}

export interface UserContent {
  type: 'user';
  text: string;
}

// Permission types
export type PermissionType =
  | 'file_read'
  | 'file_edit'
  | 'file_create'
  | 'file_delete'
  | 'bash_readonly'
  | 'bash_write'
  | 'bash_git';

export interface PermissionRequest {
  id: string;
  sessionId: string;
  type: PermissionType;
  toolName: string;
  input: Record<string, unknown>;
  description: string;
  filePath?: string;
  command?: string;
  diff?: string;
  timestamp: string;
}

export interface PermissionDecision {
  requestId: string;
  decision: 'approve' | 'deny';
  rememberForSession?: boolean;
}

// Skill types
export interface Skill {
  name: string;
  description: string;
  filePath: string;
}

// WebSocket message types (Client -> Server)
export type AgentClientMessage =
  | AgentRunMessage
  | AgentContinueMessage
  | AgentPermissionMessage
  | AgentCancelMessage;

export interface AgentRunMessage {
  type: 'agent:run';
  skill: string;
  args?: Record<string, unknown>;
  prompt?: string;
}

export interface AgentContinueMessage {
  type: 'agent:continue';
  sessionId: string;
  message: string;
}

export interface AgentPermissionMessage {
  type: 'agent:permission';
  sessionId: string;
  requestId: string;
  decision: 'approve' | 'deny';
  rememberForSession?: boolean;
}

export interface AgentCancelMessage {
  type: 'agent:cancel';
  sessionId: string;
}

// WebSocket message types (Server -> Client)
export type AgentServerMessage =
  | AgentMessageEvent
  | AgentPermissionRequestEvent
  | AgentCompleteEvent
  | AgentErrorEvent;

export interface AgentMessageEvent {
  type: 'agent:message';
  sessionId: string;
  message: AgentMessage;
}

export interface AgentPermissionRequestEvent {
  type: 'agent:permission_request';
  sessionId: string;
  permission: PermissionRequest;
}

export interface AgentCompleteEvent {
  type: 'agent:complete';
  sessionId: string;
  status: 'success' | 'error' | 'cancelled';
  error?: string;
}

export interface AgentErrorEvent {
  type: 'agent:error';
  sessionId: string;
  error: string;
}

// API types
export interface ListSkillsResponse {
  skills: Skill[];
  error?: string;
}

export interface ListSessionsResponse {
  sessions: AgentSession[];
  error?: string;
}

export interface RunSkillParams {
  skill: string;
  prompt?: string;
  args?: Record<string, unknown>;
}

export interface RunSkillResponse {
  sessionId: string;
  error?: string;
}
