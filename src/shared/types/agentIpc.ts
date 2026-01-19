/**
 * agentIpc - IPC message type guards and validation
 *
 * Type-safe message passing between main process and worker processes.
 */

import type { AgentMessage } from './agent';

// Request types (Main -> Worker)
export interface JobRequest {
  type: 'job';
  sessionId: string;
  prompt: string;
  options: {
    cwd: string;
    model?: string;
    resume?: string;
  };
}

export interface AbortRequest {
  type: 'abort';
  sessionId: string;
}

export interface ShutdownRequest {
  type: 'shutdown';
  reason?: string;
}

export type WorkerRequest = JobRequest | AbortRequest | ShutdownRequest;

// Response types (Worker -> Main)
export interface MessageResponse {
  type: 'message';
  sessionId: string;
  message: AgentMessage;
}

export interface CompleteResponse {
  type: 'complete';
  sessionId: string;
  result: {
    status: 'success' | 'error';
    output?: string;
    error?: string;
  };
}

export interface ErrorResponse {
  type: 'error';
  sessionId: string;
  error: {
    code: string;
    message: string;
    stack?: string;
  };
}

export interface ReadyResponse {
  type: 'ready';
  workerId: string;
  pid?: number;
  capabilities?: string[];
}

export interface ShutdownAckResponse {
  type: 'shutdown_ack';
}

export type WorkerResponse =
  | MessageResponse
  | CompleteResponse
  | ErrorResponse
  | ReadyResponse
  | ShutdownAckResponse;

// Error classification
export type IpcErrorType = 'timeout' | 'sdk_error' | 'ipc_error' | 'unknown';

// Helper to check if value is a non-null object
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Type guards for worker requests
export function isJobRequest(msg: unknown): msg is JobRequest {
  if (!isObject(msg)) return false;
  if (msg.type !== 'job') return false;
  if (typeof msg.sessionId !== 'string') return false;
  if (typeof msg.prompt !== 'string') return false;
  if (!isObject(msg.options)) return false;
  if (typeof msg.options.cwd !== 'string') return false;
  return true;
}

export function isAbortRequest(msg: unknown): msg is AbortRequest {
  if (!isObject(msg)) return false;
  if (msg.type !== 'abort') return false;
  if (typeof msg.sessionId !== 'string') return false;
  return true;
}

export function isShutdownRequest(msg: unknown): msg is ShutdownRequest {
  if (!isObject(msg)) return false;
  if (msg.type !== 'shutdown') return false;
  return true;
}

export function isWorkerRequest(msg: unknown): msg is WorkerRequest {
  return isJobRequest(msg) || isAbortRequest(msg) || isShutdownRequest(msg);
}

// Type guards for worker responses
export function isMessageResponse(msg: unknown): msg is MessageResponse {
  if (!isObject(msg)) return false;
  if (msg.type !== 'message') return false;
  if (typeof msg.sessionId !== 'string') return false;
  if (!isObject(msg.message)) return false;
  return true;
}

export function isCompleteResponse(msg: unknown): msg is CompleteResponse {
  if (!isObject(msg)) return false;
  if (msg.type !== 'complete') return false;
  if (typeof msg.sessionId !== 'string') return false;
  if (!isObject(msg.result)) return false;
  return true;
}

export function isErrorResponse(msg: unknown): msg is ErrorResponse {
  if (!isObject(msg)) return false;
  if (msg.type !== 'error') return false;
  if (typeof msg.sessionId !== 'string') return false;
  if (!isObject(msg.error)) return false;
  return true;
}

export function isReadyResponse(msg: unknown): msg is ReadyResponse {
  if (!isObject(msg)) return false;
  if (msg.type !== 'ready') return false;
  if (typeof msg.workerId !== 'string') return false;
  return true;
}

export function isShutdownAckResponse(msg: unknown): msg is ShutdownAckResponse {
  if (!isObject(msg)) return false;
  if (msg.type !== 'shutdown_ack') return false;
  return true;
}

export function isWorkerResponse(msg: unknown): msg is WorkerResponse {
  return (
    isMessageResponse(msg) ||
    isCompleteResponse(msg) ||
    isErrorResponse(msg) ||
    isReadyResponse(msg) ||
    isShutdownAckResponse(msg)
  );
}

// Validation function
export function validateJobRequest(msg: unknown): JobRequest {
  if (!isObject(msg)) {
    throw new Error('Invalid job request: expected an object');
  }

  if (msg.type !== 'job') {
    throw new Error('Invalid job request: type must be "job"');
  }

  if (typeof msg.sessionId !== 'string') {
    throw new Error('Invalid job request: missing or invalid sessionId');
  }

  if (typeof msg.prompt !== 'string') {
    throw new Error('Invalid job request: missing or invalid prompt');
  }

  if (!isObject(msg.options)) {
    throw new Error('Invalid job request: missing or invalid options');
  }

  if (typeof msg.options.cwd !== 'string') {
    throw new Error('Invalid job request: missing or invalid options.cwd');
  }

  return msg as unknown as JobRequest;
}

// Serialization helpers
export function serializeForIpc<T>(obj: T): string {
  return JSON.stringify(obj, (_key, value) => {
    // Date objects are automatically converted to ISO strings by JSON.stringify
    return value;
  });
}

export function deserializeFromIpc<T>(data: string): T {
  return JSON.parse(data, (_key, value) => {
    // Optionally restore ISO date strings to Date objects
    // For now, we keep them as strings to match test expectations
    return value;
  }) as T;
}

// Error classification
export function classifyError(error: unknown): IpcErrorType {
  if (error === null || error === undefined) {
    return 'unknown';
  }

  // Handle Error objects
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();
    const code = (error as Error & { code?: string }).code?.toLowerCase() || '';

    // Check for timeout errors
    if (
      message.includes('timeout') ||
      name.includes('timeout') ||
      code === 'etimedout'
    ) {
      return 'timeout';
    }

    // Check for SDK errors
    if (
      name.includes('sdk') ||
      message.includes('sdk') ||
      message.includes('anthropic') ||
      message.includes('api') ||
      code.includes('sdk')
    ) {
      return 'sdk_error';
    }

    // Check for IPC errors
    if (
      name.includes('ipc') ||
      message.includes('ipc') ||
      message.includes('channel') ||
      message.includes('worker') ||
      message.includes('process') ||
      code.startsWith('err_ipc')
    ) {
      return 'ipc_error';
    }

    return 'unknown';
  }

  // Handle plain objects with code property (like { code: 'ECONNRESET' })
  if (isObject(error)) {
    const code = (error.code as string)?.toLowerCase?.() || '';
    const message = (error.message as string)?.toLowerCase?.() || '';

    // Check for timeout errors
    if (code === 'etimedout' || message.includes('timeout')) {
      return 'timeout';
    }

    // Check for SDK errors
    if (code.includes('sdk') || message.includes('sdk') || message.includes('api')) {
      return 'sdk_error';
    }

    // Check for IPC/connection errors
    if (
      code.startsWith('err_ipc') ||
      code === 'econnreset' ||
      code === 'epipe' ||
      message.includes('ipc') ||
      message.includes('channel') ||
      message.includes('worker')
    ) {
      return 'ipc_error';
    }

    return 'unknown';
  }

  return 'unknown';
}
