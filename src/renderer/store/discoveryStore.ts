// Zustand store for discovery data with real-time event subscriptions

import { create } from 'zustand';
import discoveryClient from '../lib/discoveryClient';
import { events } from '../lib/api/events';
import type {
  Brief,
  BriefWithRelations,
  Spec,
  PipelineSummary,
  BriefFilters,
  SpecStatus,
  WorkflowEvent,
} from '../../shared/types/discovery';

interface DiscoveryState {
  // Data
  briefs: Brief[];
  selectedBriefId: string | null;
  selectedBrief: BriefWithRelations | null;
  specs: Spec[];
  pipelineSummary: PipelineSummary | null;
  recentEvents: WorkflowEvent[];

  // Loading states (used as guards to prevent overlapping fetches)
  isLoading: boolean;
  isBriefLoading: boolean;
  isPipelineLoading: boolean;
  isSpecsLoading: boolean;
  error: string | null;

  // Filters
  filters: BriefFilters;
  specFilters: { status?: SpecStatus };

  // Actions
  fetchBriefs: () => Promise<void>;
  fetchBriefWithRelations: (id: string) => Promise<void>;
  fetchSpecs: () => Promise<void>;
  fetchPipelineSummary: () => Promise<void>;
  fetchRecentEvents: (limit?: number) => Promise<void>;
  selectBrief: (id: string | null) => void;
  setFilters: (filters: Partial<BriefFilters>) => void;
  setSpecFilters: (filters: { status?: SpecStatus }) => void;
  clearError: () => void;
  clearSelection: () => void;
  refreshAll: () => Promise<void>;

  // Event subscription
  subscribeToChanges: () => () => void; // Returns unsubscribe function
}

export const useDiscoveryStore = create<DiscoveryState>((set, get) => ({
  // Initial state
  briefs: [],
  selectedBriefId: null,
  selectedBrief: null,
  specs: [],
  pipelineSummary: null,
  recentEvents: [],
  isLoading: false,
  isBriefLoading: false,
  isPipelineLoading: false,
  isSpecsLoading: false,
  error: null,
  filters: {},
  specFilters: {},

  // Actions
  fetchBriefs: async () => {
    // Guard: prevent overlapping fetches
    if (get().isLoading) return;

    set({ isLoading: true, error: null });
    try {
      const briefs = await discoveryClient.listBriefs(get().filters);
      set({ briefs, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch briefs',
        isLoading: false,
      });
    }
  },

  fetchBriefWithRelations: async (id: string) => {
    // Guard: prevent overlapping fetches for the same brief
    if (get().isBriefLoading) return;

    set({ isBriefLoading: true, error: null });
    try {
      const selectedBrief = await discoveryClient.getBriefWithRelations(id);
      set({ selectedBrief, selectedBriefId: id, isBriefLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch brief details',
        isBriefLoading: false,
      });
    }
  },

  fetchSpecs: async () => {
    // Guard: prevent overlapping fetches
    if (get().isSpecsLoading) return;

    set({ isSpecsLoading: true, error: null });
    try {
      const specs = await discoveryClient.listSpecs(get().specFilters);
      set({ specs, isSpecsLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch specs',
        isSpecsLoading: false,
      });
    }
  },

  fetchPipelineSummary: async () => {
    // Guard: prevent overlapping fetches
    if (get().isPipelineLoading) return;

    set({ isPipelineLoading: true });
    try {
      const pipelineSummary = await discoveryClient.getPipelineSummary();
      set({ pipelineSummary, isPipelineLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch pipeline summary',
        isPipelineLoading: false,
      });
    }
  },

  fetchRecentEvents: async (limit?: number) => {
    try {
      const recentEvents = await discoveryClient.getRecentEvents(limit);
      set({ recentEvents });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch recent events',
      });
    }
  },

  selectBrief: (id: string | null) => {
    set({ selectedBriefId: id });
    if (id) {
      get().fetchBriefWithRelations(id);
    } else {
      set({ selectedBrief: null });
    }
  },

  setFilters: (newFilters: Partial<BriefFilters>) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    }));
    get().fetchBriefs();
  },

  setSpecFilters: (specFilters: { status?: SpecStatus }) => {
    set({ specFilters });
    get().fetchSpecs();
  },

  clearError: () => {
    set({ error: null });
  },

  clearSelection: () => {
    set({ selectedBriefId: null, selectedBrief: null });
  },

  refreshAll: async () => {
    const { fetchBriefs, fetchPipelineSummary, fetchBriefWithRelations, selectedBriefId } = get();

    // Run fetches in parallel
    await Promise.all([
      fetchBriefs(),
      fetchPipelineSummary(),
      selectedBriefId ? fetchBriefWithRelations(selectedBriefId) : Promise.resolve(),
    ]);
  },

  subscribeToChanges: () => {
    const unsubscribe = events.onDiscoveryChange(() => {
      // Refresh data when discovery.db changes
      const { fetchBriefs, fetchPipelineSummary, fetchBriefWithRelations, selectedBriefId } = get();

      fetchBriefs();
      fetchPipelineSummary();

      // If a brief is selected, refresh it too
      if (selectedBriefId) {
        fetchBriefWithRelations(selectedBriefId);
      }
    });
    return unsubscribe;
  },
}));

// Selector hooks for optimized re-renders
export const useSelectedBrief = () =>
  useDiscoveryStore((state) => state.selectedBrief);

export const useBriefsList = () =>
  useDiscoveryStore((state) => state.briefs);

export const usePipelineSummary = () =>
  useDiscoveryStore((state) => state.pipelineSummary);

export const useDiscoveryLoading = () =>
  useDiscoveryStore((state) => ({
    isLoading: state.isLoading,
    isBriefLoading: state.isBriefLoading,
    isPipelineLoading: state.isPipelineLoading,
    isSpecsLoading: state.isSpecsLoading,
  }));

export const useDiscoveryError = () =>
  useDiscoveryStore((state) => state.error);
