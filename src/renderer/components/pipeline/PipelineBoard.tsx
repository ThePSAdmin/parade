import { useEffect } from 'react';
import { useDiscoveryStore } from '../../store/discoveryStore';
import PipelineColumn from './PipelineColumn';
import type { Brief, BriefStatus } from '../../../shared/types/discovery';

export const PIPELINE_STAGES: { status: BriefStatus; label: string }[] = [
  { status: 'draft', label: 'Draft' },
  { status: 'in_discovery', label: 'In Discovery' },
  { status: 'spec_ready', label: 'Spec Review' },
  { status: 'approved', label: 'Approved' },
  { status: 'exported', label: 'Exported' },
  { status: 'in_progress', label: 'In Progress' },
  { status: 'completed', label: 'Completed' },
  { status: 'canceled', label: 'Canceled' },
];

export default function PipelineBoard() {
  const briefs = useDiscoveryStore((state) => state.briefs);
  const isLoading = useDiscoveryStore((state) => state.isLoading);
  const error = useDiscoveryStore((state) => state.error);

  useEffect(() => {
    // Use getState() to avoid dependency on action references
    const { fetchBriefs, subscribeToChanges } = useDiscoveryStore.getState();
    fetchBriefs();
    const unsubscribe = subscribeToChanges();
    return () => unsubscribe();
  }, []); // Empty deps - only run once on mount

  // Group briefs by status
  const briefsByStatus = PIPELINE_STAGES.reduce(
    (acc, stage) => {
      acc[stage.status] = briefs.filter((b) => b.status === stage.status);
      return acc;
    },
    {} as Record<BriefStatus, Brief[]>
  );

  if (isLoading && briefs.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex items-center gap-3 text-slate-400">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Loading briefs...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
          <h3 className="font-medium text-red-400 mb-1">
            Error loading briefs
          </h3>
          <p className="text-red-300 text-sm">{error}</p>
          <button
            onClick={() => useDiscoveryStore.getState().fetchBriefs()}
            className="mt-3 px-3 py-1.5 bg-red-500/30 hover:bg-red-500/40 text-red-300 rounded text-sm font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-4 p-4 h-full overflow-x-auto">
      {PIPELINE_STAGES.map((stage) => (
        <PipelineColumn
          key={stage.status}
          title={stage.label}
          status={stage.status}
          briefs={briefsByStatus[stage.status] || []}
        />
      ))}
    </div>
  );
}
