/**
 * TDD RED Phase Tests: Pipeline Columns
 *
 * These tests verify the PIPELINE_STAGES configuration for the PipelineBoard.
 *
 * Current state (should fail):
 *   - PIPELINE_STAGES has 5 stages ending at 'exported'
 *   - PIPELINE_STAGES is not exported from the module
 *
 * After implementation (should pass):
 *   - PIPELINE_STAGES will have 7 stages
 *   - PIPELINE_STAGES will be exported
 *   - New stages: in_progress, completed, canceled
 *   - Order: draft, in_discovery, spec_ready, approved, in_progress, completed, canceled
 *
 * Implementation requirements:
 *   1. Export PIPELINE_STAGES from PipelineBoard.tsx
 *   2. Update BriefStatus type to include new statuses
 *   3. Add new stages to PIPELINE_STAGES array
 *   4. Update PipelineColumn statusConfig for new statuses
 *   5. Update StatusIcons map for new statuses
 */

import { describe, it, expect, beforeAll } from 'vitest';

// Type definition for pipeline stage
interface PipelineStage {
  status: string;
  label: string;
}

// Module-level variable to hold imported stages
let PIPELINE_STAGES: PipelineStage[] | undefined;
let importError: Error | null = null;

// Attempt to import PIPELINE_STAGES before tests run
beforeAll(async () => {
  try {
    const module = await import('@renderer/components/pipeline/PipelineBoard');
    PIPELINE_STAGES = (module as { PIPELINE_STAGES?: PipelineStage[] }).PIPELINE_STAGES;
  } catch (err) {
    importError = err instanceof Error ? err : new Error(String(err));
  }
});

describe('Pipeline Stages Configuration', () => {
  describe('PIPELINE_STAGES Export', () => {
    it('should export PIPELINE_STAGES from PipelineBoard module', () => {
      // This test verifies that PIPELINE_STAGES is exported
      // FAILS NOW: PIPELINE_STAGES is not exported (const, not export const)
      expect(importError).toBeNull();
      expect(PIPELINE_STAGES).toBeDefined();
      expect(Array.isArray(PIPELINE_STAGES)).toBe(true);
    });
  });

  describe('PIPELINE_STAGES Array Length', () => {
    it('should have exactly 7 pipeline stages', () => {
      // FAILS NOW: Only 5 stages exist, and export doesn't exist
      expect(PIPELINE_STAGES).toBeDefined();
      expect(PIPELINE_STAGES).toHaveLength(7);
    });
  });

  describe('PIPELINE_STAGES Individual Stage Values', () => {
    it('should have draft as the first stage (index 0)', () => {
      expect(PIPELINE_STAGES).toBeDefined();
      expect(PIPELINE_STAGES![0]).toEqual({
        status: 'draft',
        label: 'Draft',
      });
    });

    it('should have in_discovery as the second stage (index 1)', () => {
      expect(PIPELINE_STAGES).toBeDefined();
      expect(PIPELINE_STAGES![1]).toEqual({
        status: 'in_discovery',
        label: 'In Discovery',
      });
    });

    it('should have spec_ready as the third stage (index 2)', () => {
      expect(PIPELINE_STAGES).toBeDefined();
      expect(PIPELINE_STAGES![2]).toEqual({
        status: 'spec_ready',
        label: 'Spec Review',
      });
    });

    it('should have approved as the fourth stage (index 3)', () => {
      expect(PIPELINE_STAGES).toBeDefined();
      expect(PIPELINE_STAGES![3]).toEqual({
        status: 'approved',
        label: 'Approved',
      });
    });

    it('should have in_progress as the fifth stage (index 4)', () => {
      // FAILS NOW: Index 4 is 'exported', not 'in_progress'
      expect(PIPELINE_STAGES).toBeDefined();
      expect(PIPELINE_STAGES![4]).toEqual({
        status: 'in_progress',
        label: 'In Progress',
      });
    });

    it('should have completed as the sixth stage (index 5)', () => {
      // FAILS NOW: Index 5 does not exist (only 5 stages)
      expect(PIPELINE_STAGES).toBeDefined();
      expect(PIPELINE_STAGES![5]).toEqual({
        status: 'completed',
        label: 'Completed',
      });
    });

    it('should have canceled as the seventh stage (index 6)', () => {
      // FAILS NOW: Index 6 does not exist (only 5 stages)
      expect(PIPELINE_STAGES).toBeDefined();
      expect(PIPELINE_STAGES![6]).toEqual({
        status: 'canceled',
        label: 'Canceled',
      });
    });
  });

  describe('PIPELINE_STAGES Status Values', () => {
    it('should contain all required status values', () => {
      expect(PIPELINE_STAGES).toBeDefined();
      const statuses = PIPELINE_STAGES!.map((stage) => stage.status);

      // All 7 required statuses
      expect(statuses).toContain('draft');
      expect(statuses).toContain('in_discovery');
      expect(statuses).toContain('spec_ready');
      expect(statuses).toContain('approved');
      expect(statuses).toContain('in_progress');   // NEW
      expect(statuses).toContain('completed');      // NEW
      expect(statuses).toContain('canceled');       // NEW
    });

    it('should NOT contain exported status (replaced by new workflow)', () => {
      // The 'exported' status is being replaced by in_progress/completed/canceled flow
      expect(PIPELINE_STAGES).toBeDefined();
      const statuses = PIPELINE_STAGES!.map((stage) => stage.status);

      expect(statuses).not.toContain('exported');
    });

    it('should have unique status values (no duplicates)', () => {
      expect(PIPELINE_STAGES).toBeDefined();
      const statuses = PIPELINE_STAGES!.map((stage) => stage.status);
      const uniqueStatuses = new Set(statuses);

      expect(uniqueStatuses.size).toBe(statuses.length);
    });
  });

  describe('PIPELINE_STAGES Label Values', () => {
    it('should have non-empty labels for all stages', () => {
      expect(PIPELINE_STAGES).toBeDefined();
      PIPELINE_STAGES!.forEach((stage) => {
        expect(stage.label).toBeDefined();
        expect(typeof stage.label).toBe('string');
        expect(stage.label.length).toBeGreaterThan(0);
      });
    });

    it('should have correct human-readable labels for each status', () => {
      expect(PIPELINE_STAGES).toBeDefined();

      const expectedLabels: Record<string, string> = {
        draft: 'Draft',
        in_discovery: 'In Discovery',
        spec_ready: 'Spec Review',
        approved: 'Approved',
        in_progress: 'In Progress',
        completed: 'Completed',
        canceled: 'Canceled',
      };

      PIPELINE_STAGES!.forEach((stage) => {
        expect(stage.label).toBe(expectedLabels[stage.status]);
      });
    });
  });

  describe('PIPELINE_STAGES Order', () => {
    it('should have stages in correct workflow order', () => {
      expect(PIPELINE_STAGES).toBeDefined();

      const expectedOrder = [
        'draft',
        'in_discovery',
        'spec_ready',
        'approved',
        'in_progress',
        'completed',
        'canceled',
      ];

      const actualOrder = PIPELINE_STAGES!.map((stage) => stage.status);

      expect(actualOrder).toEqual(expectedOrder);
    });

    it('should maintain discovery workflow stages before execution stages', () => {
      // Discovery stages come first: draft -> in_discovery -> spec_ready -> approved
      // Execution stages follow: in_progress -> completed
      // Terminal state last: canceled
      expect(PIPELINE_STAGES).toBeDefined();

      const statuses = PIPELINE_STAGES!.map((stage) => stage.status);

      const draftIndex = statuses.indexOf('draft');
      const discoveryIndex = statuses.indexOf('in_discovery');
      const specIndex = statuses.indexOf('spec_ready');
      const approvedIndex = statuses.indexOf('approved');
      const progressIndex = statuses.indexOf('in_progress');
      const completedIndex = statuses.indexOf('completed');
      const canceledIndex = statuses.indexOf('canceled');

      // Verify order: draft < in_discovery < spec_ready < approved < in_progress < completed < canceled
      expect(draftIndex).toBeLessThan(discoveryIndex);
      expect(discoveryIndex).toBeLessThan(specIndex);
      expect(specIndex).toBeLessThan(approvedIndex);
      expect(approvedIndex).toBeLessThan(progressIndex);
      expect(progressIndex).toBeLessThan(completedIndex);
      expect(completedIndex).toBeLessThan(canceledIndex);
    });
  });
});

describe('BriefStatus Type Compatibility', () => {
  it('should have stages with status values matching expected BriefStatus type', () => {
    // After implementation, BriefStatus type should include all these values
    const expectedBriefStatuses = [
      'draft',
      'in_discovery',
      'spec_ready',
      'approved',
      'in_progress',
      'completed',
      'canceled',
    ];

    expect(PIPELINE_STAGES).toBeDefined();

    PIPELINE_STAGES!.forEach((stage) => {
      expect(expectedBriefStatuses).toContain(stage.status);
    });
  });
});

describe('Pipeline Column Rendering Requirements', () => {
  // These tests document what PipelineBoard should render
  // They will help guide the component update

  it('should render 7 columns (one per stage)', () => {
    // This is a documentation test for expected behavior
    // The actual rendering test would require @testing-library/react
    expect(PIPELINE_STAGES).toBeDefined();
    expect(PIPELINE_STAGES).toHaveLength(7);
  });

  it('should have column titles matching stage labels', () => {
    expect(PIPELINE_STAGES).toBeDefined();

    const expectedTitles = [
      'Draft',
      'In Discovery',
      'Spec Review',
      'Approved',
      'In Progress',
      'Completed',
      'Canceled',
    ];

    const actualTitles = PIPELINE_STAGES!.map((stage) => stage.label);
    expect(actualTitles).toEqual(expectedTitles);
  });
});
