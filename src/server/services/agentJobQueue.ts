/**
 * AgentJobQueue - Worker pool management for process isolation
 *
 * Manages a pool of worker processes to execute Claude SDK queries
 * in isolation, preventing crashes from affecting the main Express server.
 */

import { EventEmitter } from 'events';
import * as childProcess from 'child_process';
import type { ChildProcess } from 'child_process';
import path from 'path';

const { fork } = childProcess;

export interface JobRequest {
  sessionId: string;
  prompt: string;
  options: {
    cwd: string;
    model?: string;
    resume?: string;
  };
}

export interface PoolStatus {
  total: number;
  idle: number;
  active: number;
  queued: number;
}

export interface JobEvent {
  jobId: string;
  sessionId: string;
  type: 'started' | 'message' | 'complete' | 'error';
  data?: unknown;
}

interface WorkerState {
  process: ChildProcess;
  status: 'idle' | 'busy';
  currentJob: { jobId: string; sessionId: string } | null;
}

interface QueuedJob {
  jobId: string;
  request: JobRequest;
}

interface WorkerMessage {
  type: 'ready' | 'message' | 'complete' | 'error';
  jobId?: string;
  sessionId?: string;
  status?: string;
  data?: unknown;
  error?: string;
  result?: unknown;
}

export class AgentJobQueue extends EventEmitter {
  private poolSize: number;
  private workers: WorkerState[] = [];
  private jobQueue: QueuedJob[] = [];
  private jobCounter = 0;
  private shuttingDown = false;
  private shutdownResolve: (() => void) | null = null;

  constructor(options?: { poolSize?: number }) {
    super();
    this.poolSize = options?.poolSize ?? 2;
  }

  async start(): Promise<void> {
    const workerScript = path.join(__dirname, 'agentWorker.ts');

    const readyPromises: Promise<void>[] = [];

    for (let i = 0; i < this.poolSize; i++) {
      const { worker, readyPromise } = this.spawnWorker(workerScript);
      this.workers.push({
        process: worker,
        status: 'idle',
        currentJob: null,
      });
      readyPromises.push(readyPromise);
    }

    // Wait for all workers to signal ready (or timeout)
    await Promise.race([
      Promise.all(readyPromises),
      new Promise<void>((resolve) => setTimeout(resolve, 5000)),
    ]);
  }

  private spawnWorker(
    workerScript: string
  ): { worker: ChildProcess; readyPromise: Promise<void> } {
    const worker = fork(workerScript, [], {
      stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
    });

    let readyResolve: () => void;
    const readyPromise = new Promise<void>((resolve) => {
      readyResolve = resolve;
    });

    worker.on('message', (message: WorkerMessage) => {
      if (message.type === 'ready') {
        readyResolve();
        return;
      }

      this.handleWorkerMessage(worker, message);
    });

    worker.on('exit', (code, signal) => {
      this.handleWorkerExit(worker, code, signal);
    });

    return { worker, readyPromise };
  }

  private handleWorkerMessage(worker: ChildProcess, message: WorkerMessage): void {
    const workerState = this.workers.find((w) => w.process === worker);
    if (!workerState) return;

    switch (message.type) {
      case 'message':
        this.emit('message', {
          sessionId: message.sessionId,
          data: message.data,
        });
        break;

      case 'complete':
        this.emit('complete', {
          jobId: message.jobId,
          sessionId: message.sessionId,
          status: message.status,
        });
        this.markWorkerIdle(workerState);
        break;

      case 'error':
        this.emit('error', {
          sessionId: message.sessionId,
          error: message.error,
        });
        break;
    }
  }

  private handleWorkerExit(
    worker: ChildProcess,
    code: number | null,
    signal: string | NodeJS.Signals | null
  ): void {
    const workerIndex = this.workers.findIndex((w) => w.process === worker);
    if (workerIndex === -1) return;

    const workerState = this.workers[workerIndex];

    this.emit('worker:exit', {
      workerId: worker.pid,
      code,
      signal,
    });

    // If the worker was processing a job, emit error and complete events
    if (workerState.currentJob) {
      const { jobId, sessionId } = workerState.currentJob;
      const errorMessage = `Worker crashed with code ${code}`;

      // Only emit error if there are listeners (to avoid uncaught error exception)
      if (this.listenerCount('error') > 0) {
        this.emit('error', {
          sessionId,
          error: errorMessage,
        });
      }

      this.emit('complete', {
        jobId,
        sessionId,
        status: 'failed',
        error: errorMessage,
      });
    }

    // Remove the crashed worker from the pool
    this.workers.splice(workerIndex, 1);

    // Respawn unless we're shutting down
    if (!this.shuttingDown) {
      const workerScript = path.join(__dirname, 'agentWorker.ts');
      const { worker: newWorker } = this.spawnWorker(workerScript);
      this.workers.push({
        process: newWorker,
        status: 'idle',
        currentJob: null,
      });

      // Process queue if there are waiting jobs
      this.processQueue();
    }

    // Check if we can resolve shutdown
    this.checkShutdown();
  }

  private markWorkerIdle(workerState: WorkerState): void {
    workerState.status = 'idle';
    workerState.currentJob = null;

    // Process any queued jobs
    this.processQueue();

    // Check if we can resolve shutdown
    this.checkShutdown();
  }

  private processQueue(): void {
    if (this.shuttingDown) return;

    const idleWorker = this.workers.find((w) => w.status === 'idle');
    if (!idleWorker || this.jobQueue.length === 0) return;

    const queuedJob = this.jobQueue.shift()!;
    this.dispatchToWorker(idleWorker, queuedJob.jobId, queuedJob.request);
  }

  private dispatchToWorker(
    workerState: WorkerState,
    jobId: string,
    job: JobRequest
  ): void {
    workerState.status = 'busy';
    workerState.currentJob = { jobId, sessionId: job.sessionId };

    workerState.process.send({
      type: 'job',
      jobId,
      sessionId: job.sessionId,
      prompt: job.prompt,
      options: job.options,
    });

    this.emit('started', {
      jobId,
      sessionId: job.sessionId,
    });
  }

  private checkShutdown(): void {
    if (!this.shuttingDown || !this.shutdownResolve) return;

    // Check if all workers are idle
    const allIdle = this.workers.every((w) => w.status === 'idle');
    if (allIdle) {
      // Kill all workers
      for (const worker of this.workers) {
        worker.process.kill();
      }
      this.shutdownResolve();
      this.shutdownResolve = null;
    }
  }

  async stop(force?: boolean): Promise<void> {
    this.shuttingDown = true;

    if (force) {
      // Force kill all workers immediately
      for (const worker of this.workers) {
        worker.process.kill();
      }
      return;
    }

    // Graceful shutdown - wait for active jobs to complete
    const activeWorkers = this.workers.filter((w) => w.status === 'busy');
    if (activeWorkers.length === 0) {
      // No active jobs, kill all workers
      for (const worker of this.workers) {
        worker.process.kill();
      }
      return;
    }

    // Wait for jobs to complete
    return new Promise<void>((resolve) => {
      this.shutdownResolve = resolve;
    });
  }

  dispatch(job: JobRequest): string {
    const jobId = `job_${++this.jobCounter}`;

    // Find an idle worker
    const idleWorker = this.workers.find((w) => w.status === 'idle');

    if (idleWorker) {
      this.dispatchToWorker(idleWorker, jobId, job);
    } else {
      // Queue the job
      this.jobQueue.push({ jobId, request: job });
    }

    return jobId;
  }

  /**
   * Abort a running job by session ID
   * Sends abort message to the worker handling this session
   */
  abort(sessionId: string): void {
    // Find the worker handling this session
    const worker = this.workers.find(
      (w) => w.currentJob?.sessionId === sessionId
    );

    if (worker) {
      // Send abort message to worker
      worker.process.send({
        type: 'abort',
        sessionId,
      });
    } else {
      // Check if job is queued - remove it from queue
      const queueIndex = this.jobQueue.findIndex(
        (qj) => qj.request.sessionId === sessionId
      );
      if (queueIndex !== -1) {
        this.jobQueue.splice(queueIndex, 1);
      }
    }
  }

  getStatus(): PoolStatus {
    const idle = this.workers.filter((w) => w.status === 'idle').length;
    const active = this.workers.filter((w) => w.status === 'busy').length;

    return {
      total: this.workers.length,
      idle,
      active,
      queued: this.jobQueue.length,
    };
  }
}
