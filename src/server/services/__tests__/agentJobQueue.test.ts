/**
 * Tests for AgentJobQueue service - Worker pool management for process isolation
 *
 * TDD RED phase: These tests define the expected interface for AgentJobQueue
 * which manages a pool of worker processes to execute Claude SDK queries
 * in isolation, preventing crashes from affecting the main Express server.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventEmitter } from 'events';

// Mock child_process before importing the module
vi.mock('child_process', () => ({
  fork: vi.fn(),
}));

// Import the module under test (doesn't exist yet - tests will fail)
import { AgentJobQueue, JobRequest, PoolStatus, JobEvent } from '../agentJobQueue';
import { fork } from 'child_process';

// Helper to create a mock child process
function createMockWorker() {
  const worker = new EventEmitter() as EventEmitter & {
    send: ReturnType<typeof vi.fn>;
    kill: ReturnType<typeof vi.fn>;
    pid: number;
    connected: boolean;
  };
  worker.send = vi.fn();
  worker.kill = vi.fn();
  worker.pid = Math.floor(Math.random() * 10000);
  worker.connected = true;
  return worker;
}

describe('AgentJobQueue', () => {
  let queue: AgentJobQueue;
  let mockWorkers: ReturnType<typeof createMockWorker>[];

  beforeEach(() => {
    vi.clearAllMocks();
    mockWorkers = [];

    // Setup fork mock to return new mock workers
    vi.mocked(fork).mockImplementation(() => {
      const worker = createMockWorker();
      mockWorkers.push(worker);
      return worker as ReturnType<typeof fork>;
    });
  });

  afterEach(async () => {
    if (queue) {
      await queue.stop(true);
    }
  });

  describe('Worker Pool Initialization', () => {
    it('creates correct number of workers (default 2)', async () => {
      queue = new AgentJobQueue();
      await queue.start();

      expect(fork).toHaveBeenCalledTimes(2);
      expect(mockWorkers).toHaveLength(2);
    });

    it('workers start in idle state', async () => {
      queue = new AgentJobQueue();
      await queue.start();

      const status = queue.getStatus();
      expect(status.idle).toBe(2);
      expect(status.active).toBe(0);
      expect(status.total).toBe(2);
    });

    it('can be configured with different pool size', async () => {
      queue = new AgentJobQueue({ poolSize: 4 });
      await queue.start();

      expect(fork).toHaveBeenCalledTimes(4);

      const status = queue.getStatus();
      expect(status.total).toBe(4);
      expect(status.idle).toBe(4);
    });

    it('passes correct worker script path to fork', async () => {
      queue = new AgentJobQueue();
      await queue.start();

      // Verify fork was called with the worker script path
      expect(fork).toHaveBeenCalledWith(
        expect.stringContaining('agentWorker'),
        expect.any(Array),
        expect.any(Object)
      );
    });
  });

  describe('Job Dispatch', () => {
    beforeEach(async () => {
      queue = new AgentJobQueue();
      await queue.start();
    });

    it('dispatches job to available worker', () => {
      const job: JobRequest = {
        sessionId: 'session-123',
        prompt: 'Hello world',
        options: {
          cwd: '/test/project',
        },
      };

      const jobId = queue.dispatch(job);

      expect(jobId).toBeDefined();
      expect(typeof jobId).toBe('string');
      expect(mockWorkers[0].send).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'job',
          jobId: expect.any(String),
          sessionId: 'session-123',
          prompt: 'Hello world',
        })
      );
    });

    it('returns job ID for tracking', () => {
      const job: JobRequest = {
        sessionId: 'session-456',
        prompt: 'Test prompt',
        options: {
          cwd: '/test/project',
        },
      };

      const jobId = queue.dispatch(job);

      expect(jobId).toMatch(/^job_/);
    });

    it('queues job if all workers busy', () => {
      // Dispatch jobs to fill all workers
      const job1: JobRequest = {
        sessionId: 'session-1',
        prompt: 'Job 1',
        options: { cwd: '/test' },
      };
      const job2: JobRequest = {
        sessionId: 'session-2',
        prompt: 'Job 2',
        options: { cwd: '/test' },
      };
      const job3: JobRequest = {
        sessionId: 'session-3',
        prompt: 'Job 3',
        options: { cwd: '/test' },
      };

      queue.dispatch(job1);
      queue.dispatch(job2);
      const job3Id = queue.dispatch(job3);

      // Third job should be queued, not dispatched immediately
      const status = queue.getStatus();
      expect(status.active).toBe(2);
      expect(status.queued).toBe(1);
      expect(job3Id).toBeDefined();
    });

    it('emits job started event', () => {
      const startedHandler = vi.fn();
      queue.on('started', startedHandler);

      const job: JobRequest = {
        sessionId: 'session-789',
        prompt: 'Test',
        options: { cwd: '/test' },
      };

      queue.dispatch(job);

      expect(startedHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          jobId: expect.any(String),
          sessionId: 'session-789',
        })
      );
    });

    it('passes model and resume options to worker', () => {
      const job: JobRequest = {
        sessionId: 'session-model',
        prompt: 'Continue task',
        options: {
          cwd: '/test/project',
          model: 'claude-opus-4',
          resume: 'prev-session-id',
        },
      };

      queue.dispatch(job);

      expect(mockWorkers[0].send).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            model: 'claude-opus-4',
            resume: 'prev-session-id',
          }),
        })
      );
    });
  });

  describe('Worker Crash Detection', () => {
    beforeEach(async () => {
      queue = new AgentJobQueue();
      await queue.start();
    });

    it('detects worker exit event', () => {
      const exitHandler = vi.fn();
      queue.on('worker:exit', exitHandler);

      // Simulate worker crash
      mockWorkers[0].emit('exit', 1, null);

      expect(exitHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          workerId: expect.any(Number),
          code: 1,
        })
      );
    });

    it('emits error event with session context when job was running', () => {
      const errorHandler = vi.fn();
      queue.on('error', errorHandler);

      // Dispatch a job first
      const job: JobRequest = {
        sessionId: 'session-crash',
        prompt: 'This will crash',
        options: { cwd: '/test' },
      };
      queue.dispatch(job);

      // Simulate worker crash
      mockWorkers[0].emit('exit', 1, 'SIGSEGV');

      expect(errorHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: 'session-crash',
          error: expect.stringContaining('Worker crashed'),
        })
      );
    });

    it('automatically respawns crashed worker', async () => {
      const initialCallCount = vi.mocked(fork).mock.calls.length;

      // Simulate worker crash
      mockWorkers[0].emit('exit', 1, null);

      // Wait for respawn
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(fork).toHaveBeenCalledTimes(initialCallCount + 1);
    });

    it('marks affected job as failed', () => {
      const completeHandler = vi.fn();
      const errorHandler = vi.fn();
      queue.on('complete', completeHandler);
      queue.on('error', errorHandler); // Listen for error to prevent unhandled error

      // Dispatch a job
      const job: JobRequest = {
        sessionId: 'session-fail',
        prompt: 'Will fail',
        options: { cwd: '/test' },
      };
      const jobId = queue.dispatch(job);

      // Simulate worker crash
      mockWorkers[0].emit('exit', 1, null);

      expect(completeHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          jobId,
          sessionId: 'session-fail',
          status: 'failed',
          error: expect.stringContaining('Worker crashed'),
        })
      );
    });
  });

  describe('Pool Management', () => {
    beforeEach(async () => {
      queue = new AgentJobQueue();
      await queue.start();
    });

    it('graceful shutdown waits for running jobs', async () => {
      // Dispatch a job
      const job: JobRequest = {
        sessionId: 'session-shutdown',
        prompt: 'Long running job',
        options: { cwd: '/test' },
      };
      queue.dispatch(job);

      // Start shutdown (don't await yet)
      const shutdownPromise = queue.stop(false);

      // Verify workers not killed immediately
      expect(mockWorkers[0].kill).not.toHaveBeenCalled();

      // Simulate job completion
      mockWorkers[0].emit('message', {
        type: 'complete',
        jobId: expect.any(String),
        result: 'success',
      });

      await shutdownPromise;

      // Now workers should be terminated
      for (const worker of mockWorkers) {
        expect(worker.kill).toHaveBeenCalled();
      }
    });

    it('force shutdown kills all workers immediately', async () => {
      // Dispatch a job
      const job: JobRequest = {
        sessionId: 'session-force',
        prompt: 'Job to kill',
        options: { cwd: '/test' },
      };
      queue.dispatch(job);

      // Force shutdown
      await queue.stop(true);

      // All workers should be killed
      for (const worker of mockWorkers) {
        expect(worker.kill).toHaveBeenCalled();
      }
    });

    it('can get pool status (active/idle/total workers)', () => {
      const status = queue.getStatus();

      expect(status).toEqual(
        expect.objectContaining({
          active: expect.any(Number),
          idle: expect.any(Number),
          total: expect.any(Number),
          queued: expect.any(Number),
        })
      );
    });

    it('updates status when workers become busy/idle', () => {
      // Initially all idle
      expect(queue.getStatus().idle).toBe(2);
      expect(queue.getStatus().active).toBe(0);

      // Dispatch a job
      const job: JobRequest = {
        sessionId: 'session-status',
        prompt: 'Status test',
        options: { cwd: '/test' },
      };
      queue.dispatch(job);

      // One worker busy now
      expect(queue.getStatus().idle).toBe(1);
      expect(queue.getStatus().active).toBe(1);
    });
  });

  describe('Event Emission', () => {
    beforeEach(async () => {
      queue = new AgentJobQueue();
      await queue.start();
    });

    it('emits message events from workers', () => {
      const messageHandler = vi.fn();
      queue.on('message', messageHandler);

      // Dispatch a job
      const job: JobRequest = {
        sessionId: 'session-msg',
        prompt: 'Test message events',
        options: { cwd: '/test' },
      };
      queue.dispatch(job);

      // Simulate worker sending a message
      mockWorkers[0].emit('message', {
        type: 'message',
        sessionId: 'session-msg',
        data: {
          type: 'assistant',
          text: 'Hello from worker',
        },
      });

      expect(messageHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: 'session-msg',
          data: expect.objectContaining({
            type: 'assistant',
          }),
        })
      );
    });

    it('emits complete events when job finishes', () => {
      const completeHandler = vi.fn();
      queue.on('complete', completeHandler);

      // Dispatch a job
      const job: JobRequest = {
        sessionId: 'session-complete',
        prompt: 'Complete test',
        options: { cwd: '/test' },
      };
      const jobId = queue.dispatch(job);

      // Simulate job completion
      mockWorkers[0].emit('message', {
        type: 'complete',
        jobId,
        sessionId: 'session-complete',
        status: 'success',
      });

      expect(completeHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          jobId,
          sessionId: 'session-complete',
          status: 'success',
        })
      );
    });

    it('emits error events on failures', () => {
      const errorHandler = vi.fn();
      queue.on('error', errorHandler);

      // Dispatch a job
      const job: JobRequest = {
        sessionId: 'session-error',
        prompt: 'Error test',
        options: { cwd: '/test' },
      };
      queue.dispatch(job);

      // Simulate worker error
      mockWorkers[0].emit('message', {
        type: 'error',
        sessionId: 'session-error',
        error: 'Something went wrong',
      });

      expect(errorHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: 'session-error',
          error: 'Something went wrong',
        })
      );
    });

    it('includes sessionId in all events', () => {
      const events: Array<{ sessionId?: string }> = [];
      queue.on('started', (e) => events.push(e));
      queue.on('message', (e) => events.push(e));
      queue.on('complete', (e) => events.push(e));

      // Dispatch a job
      const job: JobRequest = {
        sessionId: 'session-events',
        prompt: 'Events test',
        options: { cwd: '/test' },
      };
      const jobId = queue.dispatch(job);

      // Simulate various events
      mockWorkers[0].emit('message', {
        type: 'message',
        sessionId: 'session-events',
        data: {},
      });
      mockWorkers[0].emit('message', {
        type: 'complete',
        jobId,
        sessionId: 'session-events',
        status: 'success',
      });

      // All events should have sessionId
      for (const event of events) {
        expect(event.sessionId).toBe('session-events');
      }
    });
  });

  describe('Queue Processing', () => {
    beforeEach(async () => {
      queue = new AgentJobQueue();
      await queue.start();
    });

    it('processes queued jobs when workers become available', () => {
      // Fill up workers
      queue.dispatch({
        sessionId: 'session-1',
        prompt: 'Job 1',
        options: { cwd: '/test' },
      });
      const jobId2 = queue.dispatch({
        sessionId: 'session-2',
        prompt: 'Job 2',
        options: { cwd: '/test' },
      });
      const jobId3 = queue.dispatch({
        sessionId: 'session-3',
        prompt: 'Job 3',
        options: { cwd: '/test' },
      });

      // Job 3 should be queued
      expect(queue.getStatus().queued).toBe(1);

      // Complete job 1
      mockWorkers[0].emit('message', {
        type: 'complete',
        jobId: expect.any(String),
        sessionId: 'session-1',
        status: 'success',
      });

      // Job 3 should now be dispatched
      expect(queue.getStatus().queued).toBe(0);
      expect(queue.getStatus().active).toBe(2);
    });
  });

  describe('Interface Compliance', () => {
    it('extends EventEmitter', () => {
      queue = new AgentJobQueue();
      expect(queue).toBeInstanceOf(EventEmitter);
    });

    it('has required methods', () => {
      queue = new AgentJobQueue();
      expect(typeof queue.start).toBe('function');
      expect(typeof queue.stop).toBe('function');
      expect(typeof queue.dispatch).toBe('function');
      expect(typeof queue.getStatus).toBe('function');
    });
  });
});
