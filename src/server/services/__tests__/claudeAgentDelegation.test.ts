/**
 * Integration tests for claudeAgentService delegation to AgentJobQueue
 *
 * TDD RED phase: These tests define the expected behavior when claudeAgentService
 * delegates to the AgentJobQueue for process-isolated SDK execution.
 *
 * NOTE: These tests will FAIL until claudeAgentService is refactored to use
 * the job queue instead of calling the SDK directly.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventEmitter } from 'events';

// Create a mock job queue instance that we can control
function createMockJobQueue() {
  const emitter = new EventEmitter();
  let jobCounter = 0;

  const mockQueue = {
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
    dispatch: vi.fn().mockImplementation(() => {
      return `job_${++jobCounter}`;
    }),
    abort: vi.fn(),
    getStatus: vi.fn().mockReturnValue({ total: 2, idle: 2, active: 0, queued: 0 }),
    on: vi.fn().mockImplementation((event: string, handler: (...args: unknown[]) => void) => {
      emitter.on(event, handler);
      return mockQueue;
    }),
    off: vi.fn().mockImplementation((event: string, handler: (...args: unknown[]) => void) => {
      emitter.off(event, handler);
      return mockQueue;
    }),
    removeListener: vi.fn().mockImplementation((event: string, handler: (...args: unknown[]) => void) => {
      emitter.removeListener(event, handler);
      return mockQueue;
    }),
    // Helper methods for tests to emit events
    _emit: (event: string, data: unknown) => emitter.emit(event, data),
    _emitter: emitter,
  };

  return mockQueue;
}

// Store the mock queue so we can access it in tests
let mockJobQueue: ReturnType<typeof createMockJobQueue>;

// Mock the SDK query function to prevent actual API calls
vi.mock('@anthropic-ai/claude-agent-sdk', () => ({
  query: vi.fn(),
}));

// Mock the AgentJobQueue module with a proper class mock
vi.mock('../agentJobQueue', () => {
  // Create a mock class that can be instantiated with `new`
  const MockAgentJobQueue = vi.fn(function (this: ReturnType<typeof createMockJobQueue>) {
    const queue = createMockJobQueue();
    mockJobQueue = queue;
    Object.assign(this, queue);
    return this;
  });

  return {
    AgentJobQueue: MockAgentJobQueue,
  };
});

// Import after mocking
import { claudeAgentService } from '../claudeAgent';

describe('claudeAgentService delegation to AgentJobQueue', () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    // Reset service internal state so each test gets a fresh job queue
    claudeAgentService._resetForTesting();

    // Create fresh mock for each test (this will be replaced when job queue is created)
    mockJobQueue = createMockJobQueue();

    // Set project path for tests
    claudeAgentService.setProjectPath('/test/project');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Delegation to Job Queue', () => {
    it('run() should dispatch job to AgentJobQueue instead of calling SDK directly', async () => {
      const sessionId = await claudeAgentService.run('discover', 'Test feature');

      expect(sessionId).toBeDefined();
      expect(typeof sessionId).toBe('string');
      expect(mockJobQueue.dispatch).toHaveBeenCalledTimes(1);
      expect(mockJobQueue.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: expect.any(String),
          prompt: '/discover Test feature',
          options: expect.objectContaining({
            cwd: '/test/project',
          }),
        })
      );
    });

    it('run() should include skill invocation as slash command in prompt', async () => {
      await claudeAgentService.run('init-project');

      expect(mockJobQueue.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: '/init-project',
        })
      );
    });

    it('runWithPrompt() should dispatch job to AgentJobQueue', async () => {
      const sessionId = await claudeAgentService.runWithPrompt('Hello, help me debug this code');

      expect(sessionId).toBeDefined();
      expect(mockJobQueue.dispatch).toHaveBeenCalledTimes(1);
      expect(mockJobQueue.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: expect.any(String),
          prompt: 'Hello, help me debug this code',
          options: expect.objectContaining({
            cwd: '/test/project',
          }),
        })
      );
    });

    it('jobs should include sessionId matching returned session ID', async () => {
      const sessionId = await claudeAgentService.runWithPrompt('Test prompt');

      const dispatchCall = mockJobQueue.dispatch.mock.calls[0][0];
      expect(dispatchCall.sessionId).toBe(sessionId);
    });

    it('jobs should include model option when specified', async () => {
      // Future: When model selection is added to run()
      // For now, verify the job structure includes options
      await claudeAgentService.runWithPrompt('Test prompt');

      expect(mockJobQueue.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            cwd: '/test/project',
          }),
        })
      );
    });
  });

  describe('Event Forwarding', () => {
    it('messages from job queue should be emitted as message events', async () => {
      const messageHandler = vi.fn();
      claudeAgentService.on('message', messageHandler);

      const sessionId = await claudeAgentService.runWithPrompt('Test prompt');

      // Simulate job queue emitting a message event
      const testMessage = {
        id: 'msg_123',
        sessionId,
        type: 'assistant' as const,
        timestamp: new Date().toISOString(),
        content: {
          type: 'assistant' as const,
          text: 'Hello from the worker',
        },
      };

      mockJobQueue._emit('message', {
        sessionId,
        data: testMessage,
      });

      expect(messageHandler).toHaveBeenCalledWith(
        sessionId,
        expect.objectContaining({
          content: expect.objectContaining({
            text: 'Hello from the worker',
          }),
        })
      );
    });

    it('completions from job queue should be emitted as complete events', async () => {
      const completeHandler = vi.fn();
      claudeAgentService.on('complete', completeHandler);

      const sessionId = await claudeAgentService.runWithPrompt('Test prompt');

      // Simulate job queue emitting completion
      mockJobQueue._emit('complete', {
        jobId: 'job_1',
        sessionId,
        status: 'success',
      });

      expect(completeHandler).toHaveBeenCalledWith(sessionId, 'success', undefined);
    });

    it('errors from job queue should be emitted as complete with error status', async () => {
      const completeHandler = vi.fn();
      claudeAgentService.on('complete', completeHandler);

      const sessionId = await claudeAgentService.runWithPrompt('Test prompt');

      // Simulate job queue emitting error completion
      mockJobQueue._emit('complete', {
        jobId: 'job_1',
        sessionId,
        status: 'failed',
        error: 'Worker crashed with code 1',
      });

      expect(completeHandler).toHaveBeenCalledWith(sessionId, 'error', 'Worker crashed with code 1');
    });

    it('should forward error events from job queue', async () => {
      const completeHandler = vi.fn();
      claudeAgentService.on('complete', completeHandler);

      const sessionId = await claudeAgentService.runWithPrompt('Test prompt');

      // Simulate job queue emitting error event
      mockJobQueue._emit('error', {
        sessionId,
        error: 'SDK error: rate limit exceeded',
      });

      expect(completeHandler).toHaveBeenCalledWith(sessionId, 'error', 'SDK error: rate limit exceeded');
    });
  });

  describe('Session Management', () => {
    it('session state should be created when job dispatched', async () => {
      const sessionId = await claudeAgentService.runWithPrompt('Test prompt');

      const session = claudeAgentService.getSession(sessionId);
      expect(session).not.toBeNull();
      expect(session?.id).toBe(sessionId);
      expect(session?.status).toBe('running');
    });

    it('session state should be updated when messages received', async () => {
      const sessionId = await claudeAgentService.runWithPrompt('Test prompt');

      // Simulate receiving a message
      const testMessage = {
        id: 'msg_456',
        sessionId,
        type: 'assistant' as const,
        timestamp: new Date().toISOString(),
        content: {
          type: 'assistant' as const,
          text: 'Response text',
        },
      };

      mockJobQueue._emit('message', {
        sessionId,
        data: testMessage,
      });

      const messages = claudeAgentService.getMessages(sessionId);
      // Should have at least the init message and the new message
      expect(messages.length).toBeGreaterThanOrEqual(2);
    });

    it('session should be retrievable via getSession()', async () => {
      const sessionId = await claudeAgentService.run('discover', 'New feature');

      const session = claudeAgentService.getSession(sessionId);
      expect(session).toBeDefined();
      expect(session?.id).toBe(sessionId);
      expect(session?.skillName).toBe('discover');
      expect(session?.projectPath).toBe('/test/project');
    });

    it('session status should update to completed on job completion', async () => {
      const sessionId = await claudeAgentService.runWithPrompt('Test prompt');

      // Simulate job completion
      mockJobQueue._emit('complete', {
        jobId: 'job_1',
        sessionId,
        status: 'success',
      });

      const session = claudeAgentService.getSession(sessionId);
      expect(session?.status).toBe('completed');
    });

    it('session status should update to error on job failure', async () => {
      const sessionId = await claudeAgentService.runWithPrompt('Test prompt');

      // Simulate job failure
      mockJobQueue._emit('complete', {
        jobId: 'job_1',
        sessionId,
        status: 'failed',
        error: 'Something went wrong',
      });

      const session = claudeAgentService.getSession(sessionId);
      expect(session?.status).toBe('error');
    });
  });

  describe('Cancel Propagation', () => {
    it('cancel() should abort the job in the queue', async () => {
      const sessionId = await claudeAgentService.runWithPrompt('Test prompt');

      await claudeAgentService.cancel(sessionId);

      // The service should have some mechanism to abort the job
      // This could be via abort() method or similar
      expect(mockJobQueue.abort).toHaveBeenCalledWith(sessionId);
    });

    it('cancelled jobs should emit complete with cancelled status', async () => {
      const completeHandler = vi.fn();
      claudeAgentService.on('complete', completeHandler);

      const sessionId = await claudeAgentService.runWithPrompt('Test prompt');

      await claudeAgentService.cancel(sessionId);

      expect(completeHandler).toHaveBeenCalledWith(sessionId, 'cancelled', undefined);
    });

    it('session status should update to completed after cancel', async () => {
      const sessionId = await claudeAgentService.runWithPrompt('Test prompt');

      await claudeAgentService.cancel(sessionId);

      const session = claudeAgentService.getSession(sessionId);
      expect(session?.status).toBe('completed');
    });
  });

  describe('Continue Support', () => {
    it('continue() should dispatch a new job with resume option', async () => {
      const sessionId = await claudeAgentService.runWithPrompt('Initial prompt');

      // Simulate SDK session ID being set (from init message)
      // In real implementation, this comes from the worker
      mockJobQueue._emit('message', {
        sessionId,
        data: {
          id: 'msg_init',
          sessionId,
          type: 'system',
          timestamp: new Date().toISOString(),
          content: {
            type: 'system',
            subtype: 'init',
            sessionId: 'sdk_session_abc123',
            message: 'Session initialized',
          },
        },
      });

      // Clear previous dispatch call count
      mockJobQueue.dispatch.mockClear();

      await claudeAgentService.continue(sessionId, 'Follow up message');

      expect(mockJobQueue.dispatch).toHaveBeenCalledTimes(1);
      expect(mockJobQueue.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId,
          prompt: 'Follow up message',
          options: expect.objectContaining({
            cwd: '/test/project',
            resume: 'sdk_session_abc123',
          }),
        })
      );
    });

    it('continue() should throw if session not found', async () => {
      await expect(claudeAgentService.continue('nonexistent', 'message')).rejects.toThrow(
        'Session not found: nonexistent'
      );
    });

    it('continue() should throw if SDK session ID not available', async () => {
      const sessionId = await claudeAgentService.runWithPrompt('Initial prompt');

      // Don't emit an init message with SDK session ID

      await expect(claudeAgentService.continue(sessionId, 'Follow up')).rejects.toThrow(
        'SDK session ID not available'
      );
    });
  });

  describe('Job Queue Lifecycle', () => {
    it('should initialize job queue on first use', async () => {
      // The job queue should be started when needed
      await claudeAgentService.runWithPrompt('Test prompt');

      expect(mockJobQueue.start).toHaveBeenCalled();
    });

    it('should reuse existing job queue for subsequent calls', async () => {
      await claudeAgentService.runWithPrompt('First prompt');
      await claudeAgentService.runWithPrompt('Second prompt');

      // start() should only be called once
      expect(mockJobQueue.start).toHaveBeenCalledTimes(1);
    });

    it('should set up event listeners on job queue', async () => {
      await claudeAgentService.runWithPrompt('Test prompt');

      // Verify listeners were registered
      expect(mockJobQueue.on).toHaveBeenCalledWith('message', expect.any(Function));
      expect(mockJobQueue.on).toHaveBeenCalledWith('complete', expect.any(Function));
      expect(mockJobQueue.on).toHaveBeenCalledWith('error', expect.any(Function));
    });
  });

  describe('Error Handling', () => {
    it('should throw if project path not set', async () => {
      // Create new instance without project path
      vi.resetModules();
      const freshModule = await import('../claudeAgent');
      const freshService = freshModule.claudeAgentService;

      await expect(freshService.runWithPrompt('Test')).rejects.toThrow('Project path not set');
    });

    it('should handle job queue dispatch errors gracefully', async () => {
      // First call to initialize the job queue
      await claudeAgentService.runWithPrompt('Initial call to create queue');

      // Now mock dispatch to throw on the NEXT call
      mockJobQueue.dispatch.mockImplementationOnce(() => {
        throw new Error('Queue is full');
      });

      await expect(claudeAgentService.runWithPrompt('Test')).rejects.toThrow('Queue is full');
    });

    it('should handle worker crash events', async () => {
      const completeHandler = vi.fn();
      claudeAgentService.on('complete', completeHandler);

      const sessionId = await claudeAgentService.runWithPrompt('Test prompt');

      // Simulate worker crash via error event
      mockJobQueue._emit('complete', {
        jobId: 'job_1',
        sessionId,
        status: 'failed',
        error: 'Worker crashed with code 1',
      });

      expect(completeHandler).toHaveBeenCalledWith(sessionId, 'error', 'Worker crashed with code 1');
    });
  });
});
