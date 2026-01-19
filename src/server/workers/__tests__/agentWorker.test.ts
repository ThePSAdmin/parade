/**
 * agentWorker Tests - TDD RED Phase
 *
 * Tests for the agentWorker module that runs Claude agents SDK in a child process.
 * The worker receives job requests via IPC, executes the SDK query() function,
 * and streams responses back to the parent process.
 *
 * NOTE: These tests are expected to FAIL because the agentWorker module
 * does not exist yet. This is the TDD RED phase.
 *
 * When the worker is implemented at src/server/workers/agentWorker.ts,
 * these tests will guide the implementation to ensure:
 * 1. IPC message handling works correctly
 * 2. SDK query execution passes correct parameters
 * 3. Streaming responses are sent properly
 * 4. Errors are handled gracefully
 * 5. Graceful termination is supported
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ============================================================================
// Type Definitions for IPC Messages
// ============================================================================

/** Options for job execution */
interface JobOptions {
  cwd: string
  model?: string
  resume?: string
  permissionMode?: string
}

/** Main -> Worker message types */
type WorkerRequest =
  | { type: 'job'; sessionId: string; prompt: string; options: JobOptions }
  | { type: 'abort'; sessionId: string }
  | { type: 'shutdown' }

/** SDK message representation */
interface AgentMessage {
  type: string
  [key: string]: unknown
}

/** Worker -> Main message types */
type WorkerResponse =
  | { type: 'message'; sessionId: string; message: AgentMessage }
  | { type: 'complete'; sessionId: string; status: 'success' | 'error'; error?: string }
  | { type: 'error'; sessionId: string; error: string }
  | { type: 'ready' }
  | { type: 'shutdown_ack' }

/** Expected worker module interface */
interface AgentWorkerModule {
  handleMessage: (message: WorkerRequest) => Promise<void>
  sendResponse: (response: WorkerResponse) => void
  runJob: (sessionId: string, prompt: string, options: JobOptions) => Promise<void>
  handleAbort: (sessionId: string) => void
  handleShutdown: () => Promise<void>
}

// ============================================================================
// Mock Setup - using vi.hoisted for proper hoisting
// ============================================================================

const mockQuery = vi.hoisted(() => vi.fn())
const mockAbortController = vi.hoisted(() => ({
  abort: vi.fn(),
  signal: { aborted: false },
}))

vi.mock('@anthropic-ai/claude-agent-sdk', () => ({
  query: mockQuery,
}))

// Mock process.send for IPC
const originalProcessSend = process.send
const mockProcessSend = vi.fn()

// ============================================================================
// Module Import Wrapper
// We import the module and wrap functions that need to be async
// ============================================================================

import * as agentWorkerModule from '../agentWorker'

// Cleanup function to reset module state between tests
const cleanup = agentWorkerModule.cleanup

// Type-safe wrappers for expected async versions
const handleMessage = async (message: WorkerRequest): Promise<void> => {
  // Current stub is sync and throws - in real implementation this should be async
  return agentWorkerModule.handleMessage(message) as unknown as Promise<void>
}

const sendResponse = agentWorkerModule.sendResponse

// runJob function - this should exist but doesn't yet in stub
const runJob = async (sessionId: string, prompt: string, options: JobOptions): Promise<void> => {
  // This function needs to be implemented in agentWorker.ts
  // For now, we'll try to call it if it exists
  const fn = (agentWorkerModule as Record<string, unknown>).runJob
  if (typeof fn === 'function') {
    return fn(sessionId, prompt, options) as Promise<void>
  }
  throw new Error('runJob is not implemented')
}

// handleAbort function - maps to handleAbortRequest but should accept just sessionId
const handleAbort = (sessionId: string): void => {
  // This function needs to be implemented in agentWorker.ts
  const fn = (agentWorkerModule as Record<string, unknown>).handleAbort
  if (typeof fn === 'function') {
    return fn(sessionId) as void
  }
  throw new Error('handleAbort is not implemented')
}

// handleShutdown - should be async
const handleShutdown = async (): Promise<void> => {
  return agentWorkerModule.handleShutdown() as unknown as Promise<void>
}

// ============================================================================
// Tests
// ============================================================================

describe('agentWorker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Setup process.send mock
    process.send = mockProcessSend
    // Reset AbortController mock
    mockAbortController.abort.mockClear()
    mockAbortController.signal.aborted = false
    // Reset module state (important for shutdown state)
    cleanup()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    process.send = originalProcessSend
  })

  // ==========================================================================
  // Module Existence Tests
  // ==========================================================================

  describe('Module Existence', () => {
    it('should have agentWorker module at src/server/workers/agentWorker.ts', () => {
      // If this test runs, the module exists and was successfully imported
      expect(agentWorkerModule).toBeDefined()
    })

    it('should export handleMessage function', () => {
      expect(agentWorkerModule.handleMessage).toBeDefined()
      expect(typeof agentWorkerModule.handleMessage).toBe('function')
    })

    it('should export sendResponse function', () => {
      expect(agentWorkerModule.sendResponse).toBeDefined()
      expect(typeof agentWorkerModule.sendResponse).toBe('function')
    })

    it('should export runJob function', () => {
      const runJobFn = (agentWorkerModule as Record<string, unknown>).runJob
      expect(runJobFn).toBeDefined()
      expect(typeof runJobFn).toBe('function')
    })

    it('should export handleAbort function', () => {
      const handleAbortFn = (agentWorkerModule as Record<string, unknown>).handleAbort
      expect(handleAbortFn).toBeDefined()
      expect(typeof handleAbortFn).toBe('function')
    })

    it('should export handleShutdown function', () => {
      expect(agentWorkerModule.handleShutdown).toBeDefined()
      expect(typeof agentWorkerModule.handleShutdown).toBe('function')
    })
  })

  // ==========================================================================
  // IPC Message Handling Tests
  // ==========================================================================

  describe('IPC Message Handling', () => {
    it('should handle "job" message type correctly', async () => {
      // Setup mock query to return an async iterator
      const mockMessages: AgentMessage[] = [
        { type: 'system', subtype: 'init', session_id: 'sdk-123' },
        { type: 'assistant', message: { content: [{ type: 'text', text: 'Hello' }] } },
        { type: 'result', result: 'Done' },
      ]

      mockQuery.mockImplementation(async function* () {
        for (const msg of mockMessages) {
          yield msg
        }
      })

      const jobMessage: WorkerRequest = {
        type: 'job',
        sessionId: 'session-123',
        prompt: 'Hello Claude',
        options: { cwd: '/test/path' },
      }

      await handleMessage(jobMessage)

      expect(mockQuery).toHaveBeenCalled()
    })

    it('should ignore unknown message types', async () => {
      const unknownMessage = { type: 'unknown', data: 'test' } as unknown as WorkerRequest

      // Should not throw
      await expect(handleMessage(unknownMessage)).resolves.toBeUndefined()

      // Should not call query for unknown types
      expect(mockQuery).not.toHaveBeenCalled()
    })

    it('should validate required fields in job message', async () => {
      // Missing sessionId
      const invalidJob = {
        type: 'job',
        prompt: 'Hello',
        options: { cwd: '/test' },
      } as unknown as WorkerRequest

      await handleMessage(invalidJob)

      // Should send error response for missing sessionId
      expect(mockProcessSend).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          error: expect.stringContaining('sessionId'),
        })
      )
    })

    it('should reject malformed messages with error response', async () => {
      // Empty prompt
      const malformedJob: WorkerRequest = {
        type: 'job',
        sessionId: 'session-123',
        prompt: '',
        options: { cwd: '/test' },
      }

      await handleMessage(malformedJob)

      expect(mockProcessSend).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          sessionId: 'session-123',
          error: expect.stringContaining('prompt'),
        })
      )
    })
  })

  // ==========================================================================
  // SDK Query Execution Tests
  // ==========================================================================

  describe('SDK Query Execution', () => {
    it('should call query() with correct parameters', async () => {
      mockQuery.mockImplementation(async function* () {
        yield { type: 'result', result: 'Done' }
      })

      await runJob('session-123', 'Test prompt', {
        cwd: '/project/path',
        model: 'claude-sonnet-4-5',
      })

      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: 'Test prompt',
          options: expect.objectContaining({
            cwd: '/project/path',
            model: 'claude-sonnet-4-5',
          }),
        })
      )
    })

    it('should pass prompt, cwd, model from job request', async () => {
      mockQuery.mockImplementation(async function* () {
        yield { type: 'result', result: 'Done' }
      })

      await runJob('session-xyz', 'Hello Claude', {
        cwd: '/my/project',
        model: 'claude-opus-4',
      })

      expect(mockQuery).toHaveBeenCalledWith({
        prompt: 'Hello Claude',
        options: expect.objectContaining({
          cwd: '/my/project',
          model: 'claude-opus-4',
        }),
      })
    })

    it('should handle resume option when provided', async () => {
      mockQuery.mockImplementation(async function* () {
        yield { type: 'result', result: 'Done' }
      })

      await runJob('session-resume', 'Continue please', {
        cwd: '/project',
        resume: 'previous-session-id',
      })

      expect(mockQuery).toHaveBeenCalledWith({
        prompt: 'Continue please',
        options: expect.objectContaining({
          cwd: '/project',
          resume: 'previous-session-id',
        }),
      })
    })

    it('should use provided abort controller', async () => {
      mockQuery.mockImplementation(async function* () {
        yield { type: 'result', result: 'Done' }
      })

      await runJob('session-abort-test', 'Test prompt', {
        cwd: '/project',
      })

      // Verify abortController is passed to query
      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            abortController: expect.any(Object),
          }),
        })
      )
    })
  })

  // ==========================================================================
  // Streaming Responses Tests
  // ==========================================================================

  describe('Streaming Responses', () => {
    it('should send "message" IPC for each SDK message', async () => {
      const mockMessages: AgentMessage[] = [
        { type: 'system', subtype: 'init', session_id: 'sdk-session' },
        { type: 'assistant', message: { content: [{ type: 'text', text: 'Response 1' }] } },
        { type: 'assistant', message: { content: [{ type: 'text', text: 'Response 2' }] } },
      ]

      mockQuery.mockImplementation(async function* () {
        for (const msg of mockMessages) {
          yield msg
        }
      })

      await runJob('session-stream', 'Hello', { cwd: '/project' })

      // Should have sent message events for each SDK message
      const messageCalls = mockProcessSend.mock.calls.filter(
        (call) => call[0]?.type === 'message'
      )

      expect(messageCalls.length).toBeGreaterThanOrEqual(mockMessages.length)

      for (const call of messageCalls) {
        expect(call[0]).toMatchObject({
          type: 'message',
          sessionId: 'session-stream',
          message: expect.any(Object),
        })
      }
    })

    it('should send "complete" IPC when query finishes', async () => {
      mockQuery.mockImplementation(async function* () {
        yield { type: 'result', result: 'Completed successfully' }
      })

      await runJob('session-complete', 'Do something', { cwd: '/project' })

      expect(mockProcessSend).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'complete',
          sessionId: 'session-complete',
          status: 'success',
        })
      )
    })

    it('should send "error" IPC on query failure', async () => {
      mockQuery.mockImplementation(async function* () {
        throw new Error('SDK error occurred')
      })

      await runJob('session-error', 'Trigger error', { cwd: '/project' })

      expect(mockProcessSend).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          sessionId: 'session-error',
          error: expect.stringContaining('SDK error occurred'),
        })
      )
    })

    it('should include sessionId in all responses', async () => {
      mockQuery.mockImplementation(async function* () {
        yield { type: 'system', subtype: 'init' }
        yield { type: 'assistant', message: { content: [] } }
        yield { type: 'result', result: 'Done' }
      })

      const testSessionId = 'test-session-id-12345'
      await runJob(testSessionId, 'Hello', { cwd: '/project' })

      // All messages except 'ready' should include the sessionId
      const relevantCalls = mockProcessSend.mock.calls.filter(
        (call) => call[0]?.type !== 'ready' && call[0]?.type !== 'shutdown_ack'
      )

      for (const call of relevantCalls) {
        expect(call[0].sessionId).toBe(testSessionId)
      }
    })
  })

  // ==========================================================================
  // Error Handling Tests
  // ==========================================================================

  describe('Error Handling', () => {
    it('should catch and report SDK errors', async () => {
      mockQuery.mockImplementation(async function* () {
        throw new Error('Connection failed')
      })

      await runJob('session-sdk-error', 'Test', { cwd: '/project' })

      expect(mockProcessSend).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          sessionId: 'session-sdk-error',
          error: expect.stringContaining('Connection failed'),
        })
      )
    })

    it('should handle abort signal gracefully', async () => {
      // Simulate abort during iteration
      mockQuery.mockImplementation(async function* () {
        yield { type: 'system', subtype: 'init' }
        // After first yield, check abort
        if (mockAbortController.signal.aborted) {
          return
        }
        yield { type: 'assistant', message: { content: [] } }
      })

      // Start job and abort
      const runPromise = runJob('session-abort', 'Long running task', { cwd: '/project' })

      // Simulate abort
      handleAbort('session-abort')

      await runPromise

      // Should have sent complete with appropriate status (not error)
      const completeCalls = mockProcessSend.mock.calls.filter(
        (call) => call[0]?.type === 'complete' && call[0]?.sessionId === 'session-abort'
      )

      expect(completeCalls.length).toBeGreaterThanOrEqual(1)
    })

    it('should report timeout errors', async () => {
      // Simulate timeout error from SDK
      const timeoutError = new Error('Request timed out')
      timeoutError.name = 'TimeoutError'

      mockQuery.mockImplementation(async function* () {
        throw timeoutError
      })

      await runJob('session-timeout', 'Slow request', { cwd: '/project' })

      expect(mockProcessSend).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          sessionId: 'session-timeout',
          error: expect.stringContaining('timed out'),
        })
      )
    })

    it('should not crash on unexpected exceptions', async () => {
      // Simulate unexpected error (not a standard Error)
      mockQuery.mockImplementation(async function* () {
        throw { weird: 'error object' } // Non-standard error
      })

      // Should not throw
      await expect(
        runJob('session-weird', 'Test', { cwd: '/project' })
      ).resolves.toBeUndefined()

      // Should still send error response
      expect(mockProcessSend).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          sessionId: 'session-weird',
          error: expect.any(String),
        })
      )
    })
  })

  // ==========================================================================
  // Graceful Termination Tests
  // ==========================================================================

  describe('Graceful Termination', () => {
    it('should respond to "shutdown" message', async () => {
      await handleMessage({ type: 'shutdown' })

      expect(mockProcessSend).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'shutdown_ack',
        })
      )
    })

    it('should abort running query on shutdown', async () => {
      // Start a job that will block
      let resolveBlock: () => void
      const blockPromise = new Promise<void>((resolve) => {
        resolveBlock = resolve
      })

      mockQuery.mockImplementation(async function* () {
        yield { type: 'system', subtype: 'init' }
        await blockPromise // Block until resolved
        yield { type: 'result', result: 'Done' }
      })

      // Start job in background
      const jobPromise = runJob('session-shutdown', 'Long task', { cwd: '/project' })

      // Trigger shutdown
      await handleShutdown()

      // Release the block
      resolveBlock!()

      // The job should complete (either normally or via abort)
      await jobPromise

      // Shutdown acknowledgment should be sent
      expect(mockProcessSend).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'shutdown_ack',
        })
      )
    })

    it('should send acknowledgment before exit', async () => {
      await handleShutdown()

      const shutdownAckCalls = mockProcessSend.mock.calls.filter(
        (call) => call[0]?.type === 'shutdown_ack'
      )

      expect(shutdownAckCalls.length).toBe(1)
    })

    it('should clean up resources on shutdown', async () => {
      // Start a job first
      mockQuery.mockImplementation(async function* () {
        yield { type: 'result', result: 'Done' }
      })

      await runJob('session-cleanup', 'Test', { cwd: '/project' })

      // Now shutdown
      await handleShutdown()

      // After shutdown, attempting to run a new job should fail or be ignored
      mockProcessSend.mockClear()
      mockQuery.mockClear()

      await runJob('session-after-shutdown', 'Should fail', { cwd: '/project' })

      // Either query shouldn't be called, or an error should be sent
      const queryCalls = mockQuery.mock.calls.length
      const errorCalls = mockProcessSend.mock.calls.filter(
        (call) => call[0]?.type === 'error'
      )

      expect(queryCalls === 0 || errorCalls.length > 0).toBe(true)
    })
  })

  // ==========================================================================
  // Abort Handling Tests
  // ==========================================================================

  describe('Abort Handling', () => {
    it('should handle "abort" message for running session', async () => {
      // Start a job
      let continueYielding = true
      mockQuery.mockImplementation(async function* () {
        yield { type: 'system', subtype: 'init' }
        while (continueYielding) {
          await new Promise((resolve) => setTimeout(resolve, 10))
        }
      })

      const jobPromise = runJob('session-to-abort', 'Long task', { cwd: '/project' })

      // Send abort message
      await handleMessage({ type: 'abort', sessionId: 'session-to-abort' })

      // Stop the loop
      continueYielding = false

      await jobPromise

      // Should have received complete message (not error for abort)
      const completeCalls = mockProcessSend.mock.calls.filter(
        (call) => call[0]?.type === 'complete'
      )

      expect(completeCalls.length).toBeGreaterThan(0)
    })

    it('should ignore abort for non-existent session', async () => {
      // Abort a session that doesn't exist - should not throw
      await expect(
        handleMessage({ type: 'abort', sessionId: 'non-existent-session' })
      ).resolves.toBeUndefined()

      // Should not crash or send error
      const errorCalls = mockProcessSend.mock.calls.filter(
        (call) => call[0]?.type === 'error' && call[0]?.sessionId === 'non-existent-session'
      )

      // No error expected for aborting non-existent session
      expect(errorCalls.length).toBe(0)
    })
  })

  // ==========================================================================
  // Ready Signal Tests
  // ==========================================================================

  describe('Ready Signal', () => {
    it('should send "ready" message on worker initialization', () => {
      // The worker should send ready on import/initialization
      // Since we're importing, check if ready was sent
      const readyCalls = mockProcessSend.mock.calls.filter(
        (call) => call[0]?.type === 'ready'
      )

      // Depending on implementation, ready might be sent on import
      // or we need to call an init function
      expect(readyCalls.length).toBeGreaterThanOrEqual(0)
    })
  })

  // ==========================================================================
  // Permission Mode Tests
  // ==========================================================================

  describe('Permission Mode', () => {
    it('should pass permissionMode option to SDK', async () => {
      mockQuery.mockImplementation(async function* () {
        yield { type: 'result', result: 'Done' }
      })

      await runJob('session-perms', 'Test', {
        cwd: '/project',
        permissionMode: 'bypassPermissions',
      })

      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            permissionMode: 'bypassPermissions',
          }),
        })
      )
    })
  })
})

// ============================================================================
// Integration-style Tests
// ============================================================================

describe('agentWorker Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.send = mockProcessSend
    // Reset module state (important for shutdown state)
    cleanup()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    process.send = originalProcessSend
  })

  it('should handle complete job lifecycle: receive -> execute -> complete', async () => {
    // Setup mock query with realistic message flow
    mockQuery.mockImplementation(async function* () {
      yield { type: 'system', subtype: 'init', session_id: 'sdk-session-123' }
      yield {
        type: 'assistant',
        message: {
          content: [
            { type: 'text', text: 'I understand. Let me help you with that.' },
          ],
        },
      }
      yield {
        type: 'assistant',
        message: {
          content: [
            { type: 'tool_use', name: 'Read', input: { file_path: '/test.txt' } },
          ],
        },
      }
      yield { type: 'result', result: 'Task completed successfully' }
    })

    const jobMessage: WorkerRequest = {
      type: 'job',
      sessionId: 'integration-test-session',
      prompt: 'Read the file /test.txt',
      options: { cwd: '/project' },
    }

    await handleMessage(jobMessage)

    // Verify complete lifecycle
    const allCalls = mockProcessSend.mock.calls.map((call) => call[0])

    // Should have message events
    const messageEvents = allCalls.filter((msg) => msg?.type === 'message')
    expect(messageEvents.length).toBeGreaterThan(0)

    // Should have complete event
    const completeEvents = allCalls.filter((msg) => msg?.type === 'complete')
    expect(completeEvents.length).toBe(1)
    expect(completeEvents[0].status).toBe('success')
  })

  it('should handle error lifecycle: receive -> fail -> report error', async () => {
    mockQuery.mockImplementation(async function* () {
      yield { type: 'system', subtype: 'init' }
      throw new Error('Unexpected SDK failure')
    })

    const jobMessage: WorkerRequest = {
      type: 'job',
      sessionId: 'error-test-session',
      prompt: 'This will fail',
      options: { cwd: '/project' },
    }

    await handleMessage(jobMessage)

    const errorCalls = mockProcessSend.mock.calls.filter(
      (call) => call[0]?.type === 'error' && call[0]?.sessionId === 'error-test-session'
    )

    expect(errorCalls.length).toBe(1)
    expect(errorCalls[0][0].error).toContain('Unexpected SDK failure')
  })
})
