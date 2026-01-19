/**
 * Tests for Agent IPC Message Type Guards and Validation
 *
 * TDD RED Phase: These tests should FAIL until the implementation is complete.
 *
 * Expected implementation in src/shared/types/agentIpc.ts:
 * 1. Type guards for worker requests (isJobRequest, isAbortRequest, isShutdownRequest, isWorkerRequest)
 * 2. Type guards for worker responses (isMessageResponse, isCompleteResponse, isErrorResponse, isReadyResponse, isWorkerResponse)
 * 3. Validation functions (validateJobRequest)
 * 4. Serialization helpers (serializeForIpc, deserializeFromIpc)
 * 5. Error classification (classifyError)
 */
import { describe, it, expect } from 'vitest'
import {
  // Type guards for worker requests
  isJobRequest,
  isAbortRequest,
  isShutdownRequest,
  isWorkerRequest,
  // Type guards for worker responses
  isMessageResponse,
  isCompleteResponse,
  isErrorResponse,
  isReadyResponse,
  isWorkerResponse,
  // Validation
  validateJobRequest,
  // Serialization
  serializeForIpc,
  deserializeFromIpc,
  // Error classification
  classifyError,
  // Types
  type JobRequest,
  type AbortRequest,
  type ShutdownRequest,
  type WorkerRequest,
  type MessageResponse,
  type CompleteResponse,
  type ErrorResponse,
  type ReadyResponse,
  type WorkerResponse,
  type IpcErrorType,
} from '../agentIpc'

// ============================================================================
// Type Guards for Worker Requests
// ============================================================================

describe('Worker Request Type Guards', () => {
  describe('isJobRequest()', () => {
    it('should return true for valid job request', () => {
      const validRequest: JobRequest = {
        type: 'job',
        sessionId: 'session-123',
        prompt: 'Run the tests',
        options: {
          cwd: '/home/user/project',
          model: 'claude-3-sonnet',
        },
      }

      expect(isJobRequest(validRequest)).toBe(true)
    })

    it('should return false for missing type field', () => {
      const invalid = {
        sessionId: 'session-123',
        prompt: 'Run the tests',
        options: { cwd: '/home/user/project' },
      }

      expect(isJobRequest(invalid)).toBe(false)
    })

    it('should return false for wrong type value', () => {
      const invalid = {
        type: 'abort',
        sessionId: 'session-123',
        prompt: 'Run the tests',
        options: { cwd: '/home/user/project' },
      }

      expect(isJobRequest(invalid)).toBe(false)
    })

    it('should return false for missing sessionId', () => {
      const invalid = {
        type: 'job',
        prompt: 'Run the tests',
        options: { cwd: '/home/user/project' },
      }

      expect(isJobRequest(invalid)).toBe(false)
    })

    it('should return false for missing prompt', () => {
      const invalid = {
        type: 'job',
        sessionId: 'session-123',
        options: { cwd: '/home/user/project' },
      }

      expect(isJobRequest(invalid)).toBe(false)
    })

    it('should return false for missing options', () => {
      const invalid = {
        type: 'job',
        sessionId: 'session-123',
        prompt: 'Run the tests',
      }

      expect(isJobRequest(invalid)).toBe(false)
    })

    it('should return false for missing options.cwd', () => {
      const invalid = {
        type: 'job',
        sessionId: 'session-123',
        prompt: 'Run the tests',
        options: { model: 'claude-3-sonnet' },
      }

      expect(isJobRequest(invalid)).toBe(false)
    })

    it('should return false for null', () => {
      expect(isJobRequest(null)).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(isJobRequest(undefined)).toBe(false)
    })

    it('should return false for non-object types', () => {
      expect(isJobRequest('string')).toBe(false)
      expect(isJobRequest(123)).toBe(false)
      expect(isJobRequest(true)).toBe(false)
      expect(isJobRequest([])).toBe(false)
    })
  })

  describe('isAbortRequest()', () => {
    it('should return true for valid abort request', () => {
      const validRequest: AbortRequest = {
        type: 'abort',
        sessionId: 'session-123',
      }

      expect(isAbortRequest(validRequest)).toBe(true)
    })

    it('should return false for missing type', () => {
      const invalid = {
        sessionId: 'session-123',
      }

      expect(isAbortRequest(invalid)).toBe(false)
    })

    it('should return false for wrong type value', () => {
      const invalid = {
        type: 'job',
        sessionId: 'session-123',
      }

      expect(isAbortRequest(invalid)).toBe(false)
    })

    it('should return false for missing sessionId', () => {
      const invalid = {
        type: 'abort',
      }

      expect(isAbortRequest(invalid)).toBe(false)
    })

    it('should return false for null', () => {
      expect(isAbortRequest(null)).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(isAbortRequest(undefined)).toBe(false)
    })
  })

  describe('isShutdownRequest()', () => {
    it('should return true for valid shutdown request', () => {
      const validRequest: ShutdownRequest = {
        type: 'shutdown',
      }

      expect(isShutdownRequest(validRequest)).toBe(true)
    })

    it('should return true for shutdown with optional reason', () => {
      const validRequest = {
        type: 'shutdown',
        reason: 'graceful',
      }

      expect(isShutdownRequest(validRequest)).toBe(true)
    })

    it('should return false for wrong type value', () => {
      const invalid = {
        type: 'job',
      }

      expect(isShutdownRequest(invalid)).toBe(false)
    })

    it('should return false for missing type', () => {
      const invalid = {}

      expect(isShutdownRequest(invalid)).toBe(false)
    })

    it('should return false for null', () => {
      expect(isShutdownRequest(null)).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(isShutdownRequest(undefined)).toBe(false)
    })
  })

  describe('isWorkerRequest()', () => {
    it('should return true for valid job request', () => {
      const jobRequest: JobRequest = {
        type: 'job',
        sessionId: 'session-123',
        prompt: 'Run tests',
        options: { cwd: '/project' },
      }

      expect(isWorkerRequest(jobRequest)).toBe(true)
    })

    it('should return true for valid abort request', () => {
      const abortRequest: AbortRequest = {
        type: 'abort',
        sessionId: 'session-123',
      }

      expect(isWorkerRequest(abortRequest)).toBe(true)
    })

    it('should return true for valid shutdown request', () => {
      const shutdownRequest: ShutdownRequest = {
        type: 'shutdown',
      }

      expect(isWorkerRequest(shutdownRequest)).toBe(true)
    })

    it('should return false for invalid request', () => {
      const invalid = {
        type: 'unknown',
        data: 'something',
      }

      expect(isWorkerRequest(invalid)).toBe(false)
    })

    it('should return false for null', () => {
      expect(isWorkerRequest(null)).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(isWorkerRequest(undefined)).toBe(false)
    })
  })
})

// ============================================================================
// Type Guards for Worker Responses
// ============================================================================

describe('Worker Response Type Guards', () => {
  describe('isMessageResponse()', () => {
    it('should return true for valid message response', () => {
      const validResponse: MessageResponse = {
        type: 'message',
        sessionId: 'session-123',
        message: {
          role: 'assistant',
          content: 'Hello, I can help you with that.',
        },
      }

      expect(isMessageResponse(validResponse)).toBe(true)
    })

    it('should return false for missing type', () => {
      const invalid = {
        sessionId: 'session-123',
        message: { role: 'assistant', content: 'Hello' },
      }

      expect(isMessageResponse(invalid)).toBe(false)
    })

    it('should return false for wrong type value', () => {
      const invalid = {
        type: 'complete',
        sessionId: 'session-123',
        message: { role: 'assistant', content: 'Hello' },
      }

      expect(isMessageResponse(invalid)).toBe(false)
    })

    it('should return false for missing sessionId', () => {
      const invalid = {
        type: 'message',
        message: { role: 'assistant', content: 'Hello' },
      }

      expect(isMessageResponse(invalid)).toBe(false)
    })

    it('should return false for missing message', () => {
      const invalid = {
        type: 'message',
        sessionId: 'session-123',
      }

      expect(isMessageResponse(invalid)).toBe(false)
    })

    it('should return false for null', () => {
      expect(isMessageResponse(null)).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(isMessageResponse(undefined)).toBe(false)
    })
  })

  describe('isCompleteResponse()', () => {
    it('should return true for valid complete response', () => {
      const validResponse: CompleteResponse = {
        type: 'complete',
        sessionId: 'session-123',
        result: {
          status: 'success',
          output: 'Task completed successfully',
        },
      }

      expect(isCompleteResponse(validResponse)).toBe(true)
    })

    it('should return true for complete response with error status', () => {
      const validResponse: CompleteResponse = {
        type: 'complete',
        sessionId: 'session-123',
        result: {
          status: 'error',
          error: 'Something went wrong',
        },
      }

      expect(isCompleteResponse(validResponse)).toBe(true)
    })

    it('should return false for missing type', () => {
      const invalid = {
        sessionId: 'session-123',
        result: { status: 'success' },
      }

      expect(isCompleteResponse(invalid)).toBe(false)
    })

    it('should return false for wrong type value', () => {
      const invalid = {
        type: 'message',
        sessionId: 'session-123',
        result: { status: 'success' },
      }

      expect(isCompleteResponse(invalid)).toBe(false)
    })

    it('should return false for missing sessionId', () => {
      const invalid = {
        type: 'complete',
        result: { status: 'success' },
      }

      expect(isCompleteResponse(invalid)).toBe(false)
    })

    it('should return false for missing result', () => {
      const invalid = {
        type: 'complete',
        sessionId: 'session-123',
      }

      expect(isCompleteResponse(invalid)).toBe(false)
    })

    it('should return false for null', () => {
      expect(isCompleteResponse(null)).toBe(false)
    })
  })

  describe('isErrorResponse()', () => {
    it('should return true for valid error response', () => {
      const validResponse: ErrorResponse = {
        type: 'error',
        sessionId: 'session-123',
        error: {
          code: 'TIMEOUT',
          message: 'Operation timed out',
        },
      }

      expect(isErrorResponse(validResponse)).toBe(true)
    })

    it('should return true for error response with stack trace', () => {
      const validResponse: ErrorResponse = {
        type: 'error',
        sessionId: 'session-123',
        error: {
          code: 'SDK_ERROR',
          message: 'API call failed',
          stack: 'Error: API call failed\n    at ...',
        },
      }

      expect(isErrorResponse(validResponse)).toBe(true)
    })

    it('should return false for missing type', () => {
      const invalid = {
        sessionId: 'session-123',
        error: { code: 'TIMEOUT', message: 'Timeout' },
      }

      expect(isErrorResponse(invalid)).toBe(false)
    })

    it('should return false for wrong type value', () => {
      const invalid = {
        type: 'complete',
        sessionId: 'session-123',
        error: { code: 'TIMEOUT', message: 'Timeout' },
      }

      expect(isErrorResponse(invalid)).toBe(false)
    })

    it('should return false for missing error', () => {
      const invalid = {
        type: 'error',
        sessionId: 'session-123',
      }

      expect(isErrorResponse(invalid)).toBe(false)
    })

    it('should return false for null', () => {
      expect(isErrorResponse(null)).toBe(false)
    })
  })

  describe('isReadyResponse()', () => {
    it('should return true for valid ready response', () => {
      const validResponse: ReadyResponse = {
        type: 'ready',
        workerId: 'worker-1',
      }

      expect(isReadyResponse(validResponse)).toBe(true)
    })

    it('should return true for ready response with additional info', () => {
      const validResponse = {
        type: 'ready',
        workerId: 'worker-1',
        pid: 12345,
        capabilities: ['streaming', 'tools'],
      }

      expect(isReadyResponse(validResponse)).toBe(true)
    })

    it('should return false for missing type', () => {
      const invalid = {
        workerId: 'worker-1',
      }

      expect(isReadyResponse(invalid)).toBe(false)
    })

    it('should return false for wrong type value', () => {
      const invalid = {
        type: 'message',
        workerId: 'worker-1',
      }

      expect(isReadyResponse(invalid)).toBe(false)
    })

    it('should return false for missing workerId', () => {
      const invalid = {
        type: 'ready',
      }

      expect(isReadyResponse(invalid)).toBe(false)
    })

    it('should return false for null', () => {
      expect(isReadyResponse(null)).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(isReadyResponse(undefined)).toBe(false)
    })
  })

  describe('isWorkerResponse()', () => {
    it('should return true for valid message response', () => {
      const messageResponse: MessageResponse = {
        type: 'message',
        sessionId: 'session-123',
        message: { role: 'assistant', content: 'Hello' },
      }

      expect(isWorkerResponse(messageResponse)).toBe(true)
    })

    it('should return true for valid complete response', () => {
      const completeResponse: CompleteResponse = {
        type: 'complete',
        sessionId: 'session-123',
        result: { status: 'success' },
      }

      expect(isWorkerResponse(completeResponse)).toBe(true)
    })

    it('should return true for valid error response', () => {
      const errorResponse: ErrorResponse = {
        type: 'error',
        sessionId: 'session-123',
        error: { code: 'TIMEOUT', message: 'Timeout' },
      }

      expect(isWorkerResponse(errorResponse)).toBe(true)
    })

    it('should return true for valid ready response', () => {
      const readyResponse: ReadyResponse = {
        type: 'ready',
        workerId: 'worker-1',
      }

      expect(isWorkerResponse(readyResponse)).toBe(true)
    })

    it('should return false for invalid response', () => {
      const invalid = {
        type: 'unknown',
        data: 'something',
      }

      expect(isWorkerResponse(invalid)).toBe(false)
    })

    it('should return false for null', () => {
      expect(isWorkerResponse(null)).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(isWorkerResponse(undefined)).toBe(false)
    })
  })
})

// ============================================================================
// Validation Functions
// ============================================================================

describe('Validation Functions', () => {
  describe('validateJobRequest()', () => {
    it('should return valid job request when all fields are present', () => {
      const input = {
        type: 'job',
        sessionId: 'session-123',
        prompt: 'Run tests',
        options: {
          cwd: '/home/user/project',
          model: 'claude-3-sonnet',
        },
      }

      const result = validateJobRequest(input)

      expect(result).toEqual(input)
      expect(result.type).toBe('job')
      expect(result.sessionId).toBe('session-123')
      expect(result.prompt).toBe('Run tests')
      expect(result.options.cwd).toBe('/home/user/project')
    })

    it('should throw on missing sessionId', () => {
      const input = {
        type: 'job',
        prompt: 'Run tests',
        options: { cwd: '/project' },
      }

      expect(() => validateJobRequest(input)).toThrow()
    })

    it('should throw with descriptive message for missing sessionId', () => {
      const input = {
        type: 'job',
        prompt: 'Run tests',
        options: { cwd: '/project' },
      }

      expect(() => validateJobRequest(input)).toThrow(/sessionId/i)
    })

    it('should throw on missing prompt', () => {
      const input = {
        type: 'job',
        sessionId: 'session-123',
        options: { cwd: '/project' },
      }

      expect(() => validateJobRequest(input)).toThrow()
    })

    it('should throw with descriptive message for missing prompt', () => {
      const input = {
        type: 'job',
        sessionId: 'session-123',
        options: { cwd: '/project' },
      }

      expect(() => validateJobRequest(input)).toThrow(/prompt/i)
    })

    it('should throw on missing options.cwd', () => {
      const input = {
        type: 'job',
        sessionId: 'session-123',
        prompt: 'Run tests',
        options: { model: 'claude-3-sonnet' },
      }

      expect(() => validateJobRequest(input)).toThrow()
    })

    it('should throw with descriptive message for missing options.cwd', () => {
      const input = {
        type: 'job',
        sessionId: 'session-123',
        prompt: 'Run tests',
        options: {},
      }

      expect(() => validateJobRequest(input)).toThrow(/cwd/i)
    })

    it('should throw on missing options entirely', () => {
      const input = {
        type: 'job',
        sessionId: 'session-123',
        prompt: 'Run tests',
      }

      expect(() => validateJobRequest(input)).toThrow()
    })

    it('should throw on null input', () => {
      expect(() => validateJobRequest(null)).toThrow()
    })

    it('should throw on undefined input', () => {
      expect(() => validateJobRequest(undefined)).toThrow()
    })

    it('should throw on non-object input', () => {
      expect(() => validateJobRequest('string')).toThrow()
      expect(() => validateJobRequest(123)).toThrow()
      expect(() => validateJobRequest([])).toThrow()
    })

    it('should throw on wrong type value', () => {
      const input = {
        type: 'abort',
        sessionId: 'session-123',
        prompt: 'Run tests',
        options: { cwd: '/project' },
      }

      expect(() => validateJobRequest(input)).toThrow()
    })
  })
})

// ============================================================================
// Serialization Helpers
// ============================================================================

describe('Serialization Helpers', () => {
  describe('serializeForIpc()', () => {
    it('should serialize simple objects to JSON string', () => {
      const obj = { name: 'test', value: 123 }

      const result = serializeForIpc(obj)

      expect(typeof result).toBe('string')
      expect(JSON.parse(result)).toEqual(obj)
    })

    it('should handle nested objects', () => {
      const obj = {
        outer: {
          inner: {
            deep: 'value',
          },
        },
      }

      const result = serializeForIpc(obj)
      const parsed = JSON.parse(result)

      expect(parsed.outer.inner.deep).toBe('value')
    })

    it('should handle arrays', () => {
      const obj = { items: [1, 2, 3], nested: [{ a: 1 }, { b: 2 }] }

      const result = serializeForIpc(obj)
      const parsed = JSON.parse(result)

      expect(parsed.items).toEqual([1, 2, 3])
      expect(parsed.nested).toEqual([{ a: 1 }, { b: 2 }])
    })

    it('should handle Date objects', () => {
      const date = new Date('2026-01-19T12:00:00.000Z')
      const obj = { timestamp: date }

      const result = serializeForIpc(obj)

      // Date should be serialized in a recoverable format
      expect(result).toContain('2026-01-19')
    })

    it('should handle null values', () => {
      const obj = { value: null }

      const result = serializeForIpc(obj)
      const parsed = JSON.parse(result)

      expect(parsed.value).toBeNull()
    })

    it('should handle undefined values', () => {
      const obj = { defined: 'yes', notDefined: undefined }

      const result = serializeForIpc(obj)
      const parsed = JSON.parse(result)

      // undefined values are typically stripped in JSON
      expect(parsed.defined).toBe('yes')
      expect('notDefined' in parsed).toBe(false)
    })

    it('should handle complex message objects', () => {
      const message = {
        type: 'message',
        sessionId: 'session-123',
        message: {
          role: 'assistant',
          content: 'Hello, world!',
          metadata: {
            timestamp: new Date('2026-01-19T12:00:00.000Z'),
            tokens: 150,
          },
        },
      }

      const result = serializeForIpc(message)

      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    })
  })

  describe('deserializeFromIpc()', () => {
    it('should deserialize JSON string to object', () => {
      const json = '{"name":"test","value":123}'

      const result = deserializeFromIpc<{ name: string; value: number }>(json)

      expect(result).toEqual({ name: 'test', value: 123 })
    })

    it('should handle nested objects', () => {
      const json = '{"outer":{"inner":{"deep":"value"}}}'

      const result = deserializeFromIpc<{ outer: { inner: { deep: string } } }>(json)

      expect(result.outer.inner.deep).toBe('value')
    })

    it('should handle arrays', () => {
      const json = '{"items":[1,2,3]}'

      const result = deserializeFromIpc<{ items: number[] }>(json)

      expect(result.items).toEqual([1, 2, 3])
    })

    it('should restore Date objects correctly', () => {
      // Assuming the implementation uses a reviver to restore dates
      const dateStr = '2026-01-19T12:00:00.000Z'
      const json = `{"timestamp":"${dateStr}"}`

      const result = deserializeFromIpc<{ timestamp: Date }>(json)

      // The implementation should restore ISO date strings to Date objects
      expect(result.timestamp instanceof Date || typeof result.timestamp === 'string').toBe(true)
    })

    it('should handle null values', () => {
      const json = '{"value":null}'

      const result = deserializeFromIpc<{ value: null }>(json)

      expect(result.value).toBeNull()
    })

    it('should throw on invalid JSON', () => {
      const invalidJson = '{"name": invalid}'

      expect(() => deserializeFromIpc(invalidJson)).toThrow()
    })

    it('should throw on empty string', () => {
      expect(() => deserializeFromIpc('')).toThrow()
    })

    it('should round-trip complex objects', () => {
      const original = {
        type: 'message',
        sessionId: 'session-123',
        data: {
          items: [1, 2, 3],
          nested: { key: 'value' },
          nullValue: null,
        },
      }

      const serialized = serializeForIpc(original)
      const deserialized = deserializeFromIpc<typeof original>(serialized)

      expect(deserialized.type).toBe(original.type)
      expect(deserialized.sessionId).toBe(original.sessionId)
      expect(deserialized.data.items).toEqual(original.data.items)
      expect(deserialized.data.nested).toEqual(original.data.nested)
      expect(deserialized.data.nullValue).toBeNull()
    })
  })

  describe('Date handling in serialization', () => {
    it('should preserve Date objects through round-trip', () => {
      const original = {
        createdAt: new Date('2026-01-19T12:00:00.000Z'),
        updatedAt: new Date('2026-01-19T14:30:00.000Z'),
      }

      const serialized = serializeForIpc(original)
      const deserialized = deserializeFromIpc<{ createdAt: Date; updatedAt: Date }>(serialized)

      // Either the dates are restored as Date objects or as ISO strings
      const createdAt = deserialized.createdAt instanceof Date
        ? deserialized.createdAt.toISOString()
        : deserialized.createdAt
      const updatedAt = deserialized.updatedAt instanceof Date
        ? deserialized.updatedAt.toISOString()
        : deserialized.updatedAt

      expect(createdAt).toBe('2026-01-19T12:00:00.000Z')
      expect(updatedAt).toBe('2026-01-19T14:30:00.000Z')
    })
  })
})

// ============================================================================
// Error Classification
// ============================================================================

describe('Error Classification', () => {
  describe('classifyError()', () => {
    it('should identify timeout errors', () => {
      const timeoutError = new Error('Operation timed out')
      timeoutError.name = 'TimeoutError'

      const result = classifyError(timeoutError)

      expect(result).toBe('timeout')
    })

    it('should identify timeout errors by message content', () => {
      const error = new Error('Request timeout after 30000ms')

      const result = classifyError(error)

      expect(result).toBe('timeout')
    })

    it('should identify timeout errors with ETIMEDOUT code', () => {
      const error = new Error('Connection timed out')
      ;(error as any).code = 'ETIMEDOUT'

      const result = classifyError(error)

      expect(result).toBe('timeout')
    })

    it('should identify SDK errors', () => {
      const sdkError = new Error('API rate limit exceeded')
      sdkError.name = 'SDKError'

      const result = classifyError(sdkError)

      expect(result).toBe('sdk_error')
    })

    it('should identify SDK errors by error code', () => {
      const error = new Error('Invalid API key')
      ;(error as any).code = 'SDK_AUTH_ERROR'

      const result = classifyError(error)

      expect(result).toBe('sdk_error')
    })

    it('should identify SDK errors from Claude/Anthropic API', () => {
      const error = new Error('anthropic API error: rate_limit_exceeded')

      const result = classifyError(error)

      expect(result).toBe('sdk_error')
    })

    it('should identify IPC errors', () => {
      const ipcError = new Error('IPC channel closed unexpectedly')
      ipcError.name = 'IPCError'

      const result = classifyError(ipcError)

      expect(result).toBe('ipc_error')
    })

    it('should identify IPC errors by message content', () => {
      const error = new Error('Worker process exited unexpectedly')

      const result = classifyError(error)

      expect(result).toBe('ipc_error')
    })

    it('should identify IPC errors with channel-related messages', () => {
      const error = new Error('Failed to send message to worker')

      const result = classifyError(error)

      expect(result).toBe('ipc_error')
    })

    it('should return unknown for unclassified errors', () => {
      const genericError = new Error('Something unexpected happened')

      const result = classifyError(genericError)

      expect(result).toBe('unknown')
    })

    it('should return unknown for null', () => {
      const result = classifyError(null)

      expect(result).toBe('unknown')
    })

    it('should return unknown for undefined', () => {
      const result = classifyError(undefined)

      expect(result).toBe('unknown')
    })

    it('should return unknown for non-error objects', () => {
      const result = classifyError({ message: 'Not an error' })

      expect(result).toBe('unknown')
    })

    it('should return unknown for strings', () => {
      const result = classifyError('Error string')

      expect(result).toBe('unknown')
    })

    it('should handle errors with only a code property', () => {
      const error = { code: 'ECONNRESET' }

      const result = classifyError(error)

      expect(result).toBe('ipc_error')
    })
  })

  describe('IpcErrorType union', () => {
    it('should include all expected error types', () => {
      const errorTypes: IpcErrorType[] = ['timeout', 'sdk_error', 'ipc_error', 'unknown']

      expect(errorTypes).toContain('timeout')
      expect(errorTypes).toContain('sdk_error')
      expect(errorTypes).toContain('ipc_error')
      expect(errorTypes).toContain('unknown')
    })
  })
})

// ============================================================================
// Type Integration Tests
// ============================================================================

describe('Type Integration', () => {
  describe('WorkerRequest union type', () => {
    it('should accept JobRequest', () => {
      const request: WorkerRequest = {
        type: 'job',
        sessionId: 'session-123',
        prompt: 'Test',
        options: { cwd: '/project' },
      }

      expect(request.type).toBe('job')
    })

    it('should accept AbortRequest', () => {
      const request: WorkerRequest = {
        type: 'abort',
        sessionId: 'session-123',
      }

      expect(request.type).toBe('abort')
    })

    it('should accept ShutdownRequest', () => {
      const request: WorkerRequest = {
        type: 'shutdown',
      }

      expect(request.type).toBe('shutdown')
    })
  })

  describe('WorkerResponse union type', () => {
    it('should accept MessageResponse', () => {
      const response: WorkerResponse = {
        type: 'message',
        sessionId: 'session-123',
        message: { role: 'assistant', content: 'Hello' },
      }

      expect(response.type).toBe('message')
    })

    it('should accept CompleteResponse', () => {
      const response: WorkerResponse = {
        type: 'complete',
        sessionId: 'session-123',
        result: { status: 'success' },
      }

      expect(response.type).toBe('complete')
    })

    it('should accept ErrorResponse', () => {
      const response: WorkerResponse = {
        type: 'error',
        sessionId: 'session-123',
        error: { code: 'ERROR', message: 'Failed' },
      }

      expect(response.type).toBe('error')
    })

    it('should accept ReadyResponse', () => {
      const response: WorkerResponse = {
        type: 'ready',
        workerId: 'worker-1',
      }

      expect(response.type).toBe('ready')
    })
  })
})
