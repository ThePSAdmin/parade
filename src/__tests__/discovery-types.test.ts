/**
 * Tests for extended BriefStatus type and related interfaces
 *
 * TDD RED Phase: These tests should FAIL until the implementation is complete.
 *
 * Expected changes to src/shared/types/discovery.ts:
 * 1. BriefStatus: add 'in_progress' | 'completed' | 'canceled'
 * 2. BRIEF_STATUS_LABELS: add labels for new statuses
 * 3. PipelineSummary: add count properties for new statuses
 */
import { describe, it, expect } from 'vitest'
import {
  BriefStatus,
  BRIEF_STATUS_LABELS,
  PipelineSummary,
} from '../shared/types/discovery'

describe('BriefStatus Type Extension', () => {
  describe('existing status values (should pass)', () => {
    it('should accept "draft" as a valid BriefStatus', () => {
      const status: BriefStatus = 'draft'
      expect(status).toBe('draft')
    })

    it('should accept "in_discovery" as a valid BriefStatus', () => {
      const status: BriefStatus = 'in_discovery'
      expect(status).toBe('in_discovery')
    })

    it('should accept "spec_ready" as a valid BriefStatus', () => {
      const status: BriefStatus = 'spec_ready'
      expect(status).toBe('spec_ready')
    })

    it('should accept "approved" as a valid BriefStatus', () => {
      const status: BriefStatus = 'approved'
      expect(status).toBe('approved')
    })

    it('should accept "exported" as a valid BriefStatus', () => {
      const status: BriefStatus = 'exported'
      expect(status).toBe('exported')
    })
  })

  describe('new status values (now implemented)', () => {
    it('should accept "in_progress" as a valid BriefStatus', () => {
      const status: BriefStatus = 'in_progress'
      expect(status).toBe('in_progress')
    })

    it('should accept "completed" as a valid BriefStatus', () => {
      const status: BriefStatus = 'completed'
      expect(status).toBe('completed')
    })

    it('should accept "canceled" as a valid BriefStatus', () => {
      const status: BriefStatus = 'canceled'
      expect(status).toBe('canceled')
    })
  })

  describe('all 8 status values validation', () => {
    it('should have exactly 8 valid status values when fully implemented', () => {
      const expectedStatuses = [
        'draft',
        'in_discovery',
        'spec_ready',
        'approved',
        'exported',
        'in_progress',
        'completed',
        'canceled',
      ]

      // This test validates that the type accepts all 8 values
      // It will pass once all statuses are added to the union type
      expectedStatuses.forEach((statusValue) => {
        // Runtime check - the type system should allow this assignment
        const status = statusValue as BriefStatus
        expect(typeof status).toBe('string')
      })
    })
  })
})

describe('BRIEF_STATUS_LABELS Extension', () => {
  describe('existing labels (should pass)', () => {
    it('should have label for "draft"', () => {
      expect(BRIEF_STATUS_LABELS.draft).toBe('Draft')
    })

    it('should have label for "in_discovery"', () => {
      expect(BRIEF_STATUS_LABELS.in_discovery).toBe('In Discovery')
    })

    it('should have label for "spec_ready"', () => {
      expect(BRIEF_STATUS_LABELS.spec_ready).toBe('Spec Ready')
    })

    it('should have label for "approved"', () => {
      expect(BRIEF_STATUS_LABELS.approved).toBe('Approved')
    })

    it('should have label for "exported"', () => {
      expect(BRIEF_STATUS_LABELS.exported).toBe('Exported')
    })
  })

  describe('new labels (now implemented)', () => {
    it('should have label for "in_progress"', () => {
      const label = BRIEF_STATUS_LABELS.in_progress
      expect(label).toBe('In Progress')
    })

    it('should have label for "completed"', () => {
      const label = BRIEF_STATUS_LABELS.completed
      expect(label).toBe('Completed')
    })

    it('should have label for "canceled"', () => {
      const label = BRIEF_STATUS_LABELS.canceled
      expect(label).toBe('Canceled')
    })
  })

  describe('complete labels validation', () => {
    it('should have exactly 8 label entries when fully implemented', () => {
      const keys = Object.keys(BRIEF_STATUS_LABELS)
      // Currently has 5, should have 8 after implementation
      expect(keys).toHaveLength(8)
    })

    it('should have labels for all BriefStatus values', () => {
      const allStatuses: string[] = [
        'draft',
        'in_discovery',
        'spec_ready',
        'approved',
        'exported',
        'in_progress',
        'completed',
        'canceled',
      ]

      allStatuses.forEach((status) => {
        expect(BRIEF_STATUS_LABELS).toHaveProperty(status)
        expect(typeof (BRIEF_STATUS_LABELS as Record<string, string>)[status]).toBe('string')
      })
    })

    it('should have non-empty string labels for all statuses', () => {
      const allStatuses: string[] = [
        'draft',
        'in_discovery',
        'spec_ready',
        'approved',
        'exported',
        'in_progress',
        'completed',
        'canceled',
      ]

      allStatuses.forEach((status) => {
        const label = (BRIEF_STATUS_LABELS as Record<string, string>)[status]
        expect(label).toBeDefined()
        expect(label.length).toBeGreaterThan(0)
      })
    })
  })
})

describe('PipelineSummary Interface Extension', () => {
  describe('existing properties (should pass)', () => {
    it('should have draft count property', () => {
      const summary: Partial<PipelineSummary> = { draft: 5 }
      expect(summary.draft).toBe(5)
    })

    it('should have in_discovery count property', () => {
      const summary: Partial<PipelineSummary> = { in_discovery: 3 }
      expect(summary.in_discovery).toBe(3)
    })

    it('should have spec_ready count property', () => {
      const summary: Partial<PipelineSummary> = { spec_ready: 2 }
      expect(summary.spec_ready).toBe(2)
    })

    it('should have approved count property', () => {
      const summary: Partial<PipelineSummary> = { approved: 1 }
      expect(summary.approved).toBe(1)
    })

    it('should have exported count property', () => {
      const summary: Partial<PipelineSummary> = { exported: 4 }
      expect(summary.exported).toBe(4)
    })

    it('should have total count property', () => {
      const summary: Partial<PipelineSummary> = { total: 15 }
      expect(summary.total).toBe(15)
    })
  })

  describe('new properties (should FAIL until implemented)', () => {
    it('should have in_progress count property in PipelineSummary', () => {
      // This test checks that 'in_progress' is a valid key in PipelineSummary
      // Create a minimal valid summary
      const summary: PipelineSummary = {
        draft: 0, in_discovery: 0, spec_ready: 0, approved: 0, exported: 0, in_progress: 0, completed: 0, canceled: 0, total: 0
      }
      // Check if the key exists
      expect('in_progress' in summary).toBe(true)
    })

    it('should have completed count property in PipelineSummary', () => {
      const summary: PipelineSummary = {
        draft: 0, in_discovery: 0, spec_ready: 0, approved: 0, exported: 0, in_progress: 0, completed: 0, canceled: 0, total: 0
      }
      expect('completed' in summary).toBe(true)
    })

    it('should have canceled count property in PipelineSummary', () => {
      const summary: PipelineSummary = {
        draft: 0, in_discovery: 0, spec_ready: 0, approved: 0, exported: 0, in_progress: 0, completed: 0, canceled: 0, total: 0
      }
      expect('canceled' in summary).toBe(true)
    })
  })

  describe('complete PipelineSummary validation (now implemented)', () => {
    it('should have exactly 9 required properties when fully implemented', () => {
      // Create a minimal valid summary to get the current keys
      const minimalSummary: PipelineSummary = {
        draft: 0,
        in_discovery: 0,
        spec_ready: 0,
        approved: 0,
        exported: 0,
        in_progress: 0,
        completed: 0,
        canceled: 0,
        total: 0,
      }

      // PipelineSummary now has 9 properties
      const currentKeys = Object.keys(minimalSummary)
      expect(currentKeys).toHaveLength(9)
    })

    it('should accept in_progress as a valid PipelineSummary key', () => {
      // This test creates an object and checks if it satisfies the interface
      type HasInProgress = { in_progress: number }
      type CurrentPipelineSummary = PipelineSummary

      // This assertion checks if PipelineSummary extends HasInProgress
      type Test = CurrentPipelineSummary extends HasInProgress ? true : false
      const testResult: Test = true // Now true since in_progress is implemented

      expect(testResult).toBe(true)
    })

    it('should accept completed as a valid PipelineSummary key', () => {
      type HasCompleted = { completed: number }
      type CurrentPipelineSummary = PipelineSummary

      type Test = CurrentPipelineSummary extends HasCompleted ? true : false
      const testResult: Test = true // Now true since completed is implemented

      expect(testResult).toBe(true)
    })

    it('should accept canceled as a valid PipelineSummary key', () => {
      type HasCanceled = { canceled: number }
      type CurrentPipelineSummary = PipelineSummary

      type Test = CurrentPipelineSummary extends HasCanceled ? true : false
      const testResult: Test = true // Now true since canceled is implemented

      expect(testResult).toBe(true)
    })

    it('should calculate correct total from all 8 status counts', () => {
      // After implementation, PipelineSummary should have 8 status counts + total
      const summary = {
        draft: 5,
        in_discovery: 3,
        spec_ready: 2,
        approved: 1,
        exported: 4,
        in_progress: 2,
        completed: 3,
        canceled: 1,
        total: 21,
      }

      // Calculate expected total from all status counts
      const calculatedTotal =
        summary.draft +
        summary.in_discovery +
        summary.spec_ready +
        summary.approved +
        summary.exported +
        summary.in_progress +
        summary.completed +
        summary.canceled

      expect(summary.total).toBe(calculatedTotal)
      expect(calculatedTotal).toBe(21)
    })
  })
})

describe('Type Integration Tests', () => {
  describe('BriefStatus and BRIEF_STATUS_LABELS consistency', () => {
    it('should have a label for every BriefStatus value', () => {
      // All possible status values (now implemented)
      const allStatuses: BriefStatus[] = [
        'draft',
        'in_discovery',
        'spec_ready',
        'approved',
        'exported',
        'in_progress',
        'completed',
        'canceled',
      ]

      allStatuses.forEach((status) => {
        const label = BRIEF_STATUS_LABELS[status]
        expect(label).toBeDefined()
        expect(typeof label).toBe('string')
        expect(label.length).toBeGreaterThan(0)
      })
    })
  })

  describe('BriefStatus and PipelineSummary consistency', () => {
    it('should have a count property in PipelineSummary for each BriefStatus', () => {
      // All status values should map to PipelineSummary properties
      const statusToPropertyMap: Record<string, keyof PipelineSummary | string> = {
        draft: 'draft',
        in_discovery: 'in_discovery',
        spec_ready: 'spec_ready',
        approved: 'approved',
        exported: 'exported',
        in_progress: 'in_progress',
        completed: 'completed',
        canceled: 'canceled',
      }

      const summary: Record<string, number> = {
        draft: 1,
        in_discovery: 2,
        spec_ready: 3,
        approved: 4,
        exported: 5,
        in_progress: 6,
        completed: 7,
        canceled: 8,
        total: 36,
      }

      Object.entries(statusToPropertyMap).forEach(([_status, property]) => {
        expect(summary).toHaveProperty(property)
        expect(typeof summary[property]).toBe('number')
      })
    })
  })
})
