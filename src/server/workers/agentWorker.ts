/**
 * agentWorker - Isolated SDK execution in child process
 *
 * This worker runs Claude SDK queries in isolation, communicating
 * with the parent process via IPC messages.
 */

import { query } from '@anthropic-ai/claude-agent-sdk';

// ============================================================================
// Type Definitions
// ============================================================================

export interface JobOptions {
  cwd: string;
  model?: string;
  resume?: string;
  permissionMode?: string;
  abortController?: AbortController;
}

export interface WorkerJobRequest {
  type: 'job';
  sessionId: string;
  prompt: string;
  options: JobOptions;
}

export interface WorkerAbortRequest {
  type: 'abort';
  sessionId: string;
}

export interface WorkerShutdownRequest {
  type: 'shutdown';
}

export type WorkerRequest = WorkerJobRequest | WorkerAbortRequest | WorkerShutdownRequest;

/** SDK message type - raw message from the Claude SDK */
export interface SDKMessage {
  type: string;
  [key: string]: unknown;
}

export interface WorkerMessageResponse {
  type: 'message';
  sessionId: string;
  message: SDKMessage;
}

export interface WorkerCompleteResponse {
  type: 'complete';
  sessionId: string;
  status: 'success' | 'error';
  error?: string;
}

export interface WorkerErrorResponse {
  type: 'error';
  sessionId: string;
  error: string;
}

export interface WorkerReadyResponse {
  type: 'ready';
}

export interface WorkerShutdownAckResponse {
  type: 'shutdown_ack';
}

export type WorkerResponse =
  | WorkerMessageResponse
  | WorkerCompleteResponse
  | WorkerErrorResponse
  | WorkerReadyResponse
  | WorkerShutdownAckResponse;

// ============================================================================
// State Management
// ============================================================================

/** Track active jobs by session ID */
const activeJobs = new Map<string, AbortController>();

/** Flag to indicate worker is shutting down */
let isShuttingDown = false;

/**
 * Reset module state - exported for testing
 */
export function cleanup(): void {
  // Abort any active jobs
  for (const [, abortController] of activeJobs) {
    abortController.abort();
  }
  activeJobs.clear();
  isShuttingDown = false;
}

// ============================================================================
// IPC Communication
// ============================================================================

/**
 * Send a response to the parent process via IPC
 */
export function sendResponse(response: WorkerResponse): void {
  if (process.send) {
    process.send(response);
  }
}

// ============================================================================
// Message Handling
// ============================================================================

/**
 * Handle incoming IPC messages from parent process
 */
export async function handleMessage(message: WorkerRequest): Promise<void> {
  if (!message || typeof message !== 'object' || !('type' in message)) {
    return;
  }

  switch (message.type) {
    case 'job':
      await handleJobMessage(message);
      break;
    case 'abort':
      handleAbort(message.sessionId);
      break;
    case 'shutdown':
      await handleShutdown();
      break;
    default:
      // Ignore unknown message types
      break;
  }
}

/**
 * Handle job message - validates and runs the job
 */
async function handleJobMessage(message: WorkerJobRequest): Promise<void> {
  // Validate required fields
  if (!message.sessionId) {
    sendResponse({
      type: 'error',
      sessionId: '',
      error: 'Missing required field: sessionId',
    });
    return;
  }

  if (!message.prompt) {
    sendResponse({
      type: 'error',
      sessionId: message.sessionId,
      error: 'Missing required field: prompt',
    });
    return;
  }

  await runJob(message.sessionId, message.prompt, message.options);
}

// ============================================================================
// Job Execution
// ============================================================================

/**
 * Run a Claude SDK query job
 */
export async function runJob(
  sessionId: string,
  prompt: string,
  options: JobOptions
): Promise<void> {
  // Don't start new jobs if shutting down
  if (isShuttingDown) {
    sendResponse({
      type: 'error',
      sessionId,
      error: 'Worker is shutting down',
    });
    return;
  }

  // Create abort controller for this job
  const abortController = new AbortController();
  activeJobs.set(sessionId, abortController);

  try {
    // Build query options
    const queryOptions: Record<string, unknown> = {
      cwd: options.cwd,
      abortController,
    };

    if (options.model) {
      queryOptions.model = options.model;
    }

    if (options.resume) {
      queryOptions.resume = options.resume;
    }

    if (options.permissionMode) {
      queryOptions.permissionMode = options.permissionMode;
    }

    // Call SDK query
    const response = query({
      prompt,
      options: queryOptions,
    });

    // Iterate over SDK response generator
    for await (const message of response) {
      // Check for abort
      if (abortController.signal.aborted) {
        break;
      }

      // Send each message to parent
      sendResponse({
        type: 'message',
        sessionId,
        message: message as SDKMessage,
      });
    }

    // Job completed successfully
    sendResponse({
      type: 'complete',
      sessionId,
      status: 'success',
    });
  } catch (error: unknown) {
    // Handle errors gracefully
    let errorMessage: string;

    if (error instanceof Error) {
      errorMessage = error.message;
      // Handle abort errors gracefully - they're not really errors
      if (error.name === 'AbortError' || abortController.signal.aborted) {
        sendResponse({
          type: 'complete',
          sessionId,
          status: 'success',
        });
        return;
      }
    } else if (typeof error === 'object' && error !== null) {
      errorMessage = JSON.stringify(error);
    } else {
      errorMessage = String(error);
    }

    sendResponse({
      type: 'error',
      sessionId,
      error: errorMessage,
    });
  } finally {
    // Clean up job tracking
    activeJobs.delete(sessionId);
  }
}

// ============================================================================
// Abort Handling
// ============================================================================

/**
 * Abort a running job by session ID
 */
export function handleAbort(sessionId: string): void {
  const abortController = activeJobs.get(sessionId);
  if (abortController) {
    abortController.abort();
  }
  // Silently ignore abort for non-existent sessions
}

// ============================================================================
// Shutdown Handling
// ============================================================================

/**
 * Handle graceful shutdown
 */
export async function handleShutdown(): Promise<void> {
  isShuttingDown = true;

  // Abort all running jobs
  for (const [, abortController] of activeJobs) {
    abortController.abort();
  }

  // Clear active jobs
  activeJobs.clear();

  // Send acknowledgment
  sendResponse({ type: 'shutdown_ack' });
}

// ============================================================================
// IPC Setup (when running as child process)
// ============================================================================

// Setup IPC message handler if running as child process
if (process.send) {
  process.on('message', (message: WorkerRequest) => {
    handleMessage(message).catch((error) => {
      console.error('Unhandled error in message handler:', error);
    });
  });

  // Send ready signal
  sendResponse({ type: 'ready' });
}
