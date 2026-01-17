import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDiscoveryStore, useSelectedBrief } from '../../store/discoveryStore';
import { useBeadsStore } from '../../store/beadsStore';
import wsClient from '@renderer/lib/api/websocket';
import { Card, CardContent } from '@renderer/components/ui/card';
import { Badge } from '@renderer/components/ui/badge';
import { ScrollArea } from '@renderer/components/ui/scroll-area';
import { Progress } from '@renderer/components/ui/progress';
import { Button } from '@renderer/components/ui/button';
import {
  X,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  Loader2,
  ArrowRight,
  CheckCircle2,
  Play,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@renderer/components/ui/dialog';
import type { Issue } from '../../../shared/types/beads';
import { RetroSuggestionsModal } from './RetroSuggestionsModal';

/**
 * Format a duration to a human-readable string
 */
function formatTimeInStage(dateString: string | null): string {
  if (!dateString) return 'Unknown';

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (days > 0) {
    return days === 1 ? '1 day' : `${days} days`;
  }
  if (hours > 0) {
    return hours === 1 ? '1 hour' : `${hours} hours`;
  }
  if (minutes > 0) {
    return minutes === 1 ? '1 minute' : `${minutes} minutes`;
  }
  return 'just now';
}

/**
 * Calculate task summary stats from an array of tasks
 */
function calculateTaskStats(tasks: Issue[]) {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === 'closed').length;
  const blocked = tasks.filter((t) => t.status === 'blocked').length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { total, completed, blocked, percentage };
}

// Collapsible Section Component
interface CollapsibleSectionProps {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  count?: number;
}

function CollapsibleSection({
  title,
  isExpanded,
  onToggle,
  children,
  count,
}: CollapsibleSectionProps) {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <button
        onClick={onToggle}
        aria-expanded={isExpanded}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-800 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown
              className="w-5 h-5 text-slate-400"
              data-testid="collapse-indicator-expanded"
            />
          ) : (
            <ChevronRight
              className="w-5 h-5 text-slate-400"
              data-testid="collapse-indicator-collapsed"
            />
          )}
          <span className="font-medium text-slate-100">{title}</span>
          {count !== undefined && (
            <Badge variant="secondary" className="bg-slate-800 text-slate-400 border-slate-700">
              {count}
            </Badge>
          )}
        </div>
      </button>
      {isExpanded && <CardContent className="p-4 pt-0">{children}</CardContent>}
    </Card>
  );
}

// TaskSummary Section Component
interface TaskSummarySectionProps {
  childTasks: Issue[];
  isLoadingChildren: boolean;
  timeInStage: string;
}

function TaskSummarySection({
  childTasks,
  isLoadingChildren,
  timeInStage,
}: TaskSummarySectionProps) {
  const stats = useMemo(() => calculateTaskStats(childTasks), [childTasks]);

  return (
    <Card
      className="bg-slate-900 border-slate-800"
      data-testid="task-summary-section"
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <span className="font-medium text-slate-100">Task Progress</span>
          {isLoadingChildren && (
            <Loader2
              className="w-4 h-4 animate-spin text-slate-400"
              data-testid="task-summary-loading"
            />
          )}
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <Progress
            value={stats.percentage}
            className="h-2"
            data-testid="task-progress-bar"
            aria-valuenow={stats.percentage}
          />
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          {/* Task count */}
          <div>
            <p className="text-slate-400">Tasks</p>
            <p className="text-slate-100 font-medium">
              {stats.total} {stats.total === 1 ? 'task' : 'tasks'}
            </p>
          </div>

          {/* Completion percentage */}
          <div>
            <p className="text-slate-400">Completed</p>
            <p className="text-slate-100 font-medium">{stats.percentage}%</p>
          </div>

          {/* Blocked tasks */}
          <div>
            <p className="text-slate-400">Blocked</p>
            <div className="flex items-center gap-1">
              {stats.blocked > 0 && (
                <span
                  data-testid="blocked-tasks-indicator"
                  className="flex items-center gap-1 text-amber-400 warning"
                >
                  <AlertTriangle className="w-3 h-3" />
                  {stats.blocked} blocked
                </span>
              )}
              {stats.blocked === 0 && (
                <span className="text-slate-100 font-medium">0 blocked</span>
              )}
            </div>
          </div>

          {/* Time in stage */}
          <div>
            <p className="text-slate-400">Time in stage</p>
            <p className="text-slate-100 font-medium">{timeInStage}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function BriefDetailView() {
  const navigate = useNavigate();
  const selectedBrief = useSelectedBrief();
  const { clearSelection, isBriefLoading } = useDiscoveryStore();
  const { childTasks, isLoadingChildren, fetchChildTasks } = useBeadsStore();

  // Track expanded state for each section - all collapsed by default
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    basicInfo: false,
    interviewQA: false,
    smeReviews: false,
    specDetails: false,
  });

  // Track approval state
  const [isApproving, setIsApproving] = useState(false);

  // Track retro modal state
  const [showRetroModal, setShowRetroModal] = useState(false);
  const [retroSuggestions, setRetroSuggestions] = useState<string[]>([]);
  const [hasTriggeredRetro, setHasTriggeredRetro] = useState(false);

  // Track start tasks state
  const [showStartTasksConfirm, setShowStartTasksConfirm] = useState(false);
  const [isStartingTasks, setIsStartingTasks] = useState(false);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Handle View Tasks navigation - navigates to Kanban with epicId filter
  const handleViewTasks = () => {
    if (selectedBrief?.brief.exported_epic_id) {
      navigate(`/kanban?epicId=${encodeURIComponent(selectedBrief.brief.exported_epic_id)}`);
    }
  };

  // Handle spec approval - runs approve-spec skill with session resume
  const handleApproveSpec = () => {
    if (!selectedBrief?.spec) return;
    setIsApproving(true);

    const resumeSessionId = selectedBrief.brief.sdk_session_id ?? undefined;
    // Run approve-spec skill with spec title and resume session
    wsClient.runSkill(
      'approve-spec',
      selectedBrief.spec.title,
      undefined,
      'discovery', // sessionType
      resumeSessionId
    );

    // Note: isApproving will be reset by websocket completion handler
  };

  // Handle spec rejection
  const handleRejectSpec = () => {
    // For now, just show a message or trigger spec revision
    // Future: increment rejection count, re-run discovery
    console.log('Spec rejected - revision needed');
  };

  // Handle starting tasks - runs run-tasks skill with session resume
  const handleStartTasks = () => {
    if (!selectedBrief?.brief.exported_epic_id) return;
    setIsStartingTasks(true);

    const resumeSessionId = selectedBrief.brief.sdk_session_id ?? undefined;
    // Run run-tasks skill with epic ID and resume session
    wsClient.runSkill(
      'run-tasks',
      selectedBrief.brief.exported_epic_id,
      undefined,
      'discovery',
      resumeSessionId
    );

    setShowStartTasksConfirm(false);
    // Note: isStartingTasks will be reset by websocket completion handler
  };

  // Fetch child tasks when an exported brief is selected
  const exportedEpicId = selectedBrief?.brief.exported_epic_id;
  useEffect(() => {
    if (exportedEpicId) {
      fetchChildTasks(exportedEpicId);
    }
  }, [exportedEpicId, fetchChildTasks]);

  // Calculate time in stage
  const timeInStage = useMemo(() => {
    if (!selectedBrief) return 'Unknown';
    const dateToUse =
      selectedBrief.brief.updated_at || selectedBrief.brief.created_at;
    return formatTimeInStage(dateToUse);
  }, [selectedBrief]);

  // Calculate if epic is complete (all children closed)
  const isEpicComplete = useMemo(() => {
    if (!selectedBrief?.brief.exported_epic_id || childTasks.length === 0) {
      return false;
    }
    return childTasks.every((task) => task.status === 'closed');
  }, [selectedBrief?.brief.exported_epic_id, childTasks]);

  // Effect to trigger retro when epic completes
  useEffect(() => {
    if (isEpicComplete && !hasTriggeredRetro && selectedBrief?.brief.sdk_session_id) {
      setHasTriggeredRetro(true);

      // Run retro with session resume
      wsClient.runSkill(
        'retro',
        selectedBrief.brief.exported_epic_id!,
        undefined,
        'discovery',
        selectedBrief.brief.sdk_session_id
      );

      // TODO: Listen for retro completion via WebSocket and parse suggestions
      // For now, show modal with placeholder
      // In production, suggestions would come from agent response
      setTimeout(() => {
        setRetroSuggestions([
          'Consider adding more unit tests for edge cases',
          'Document the new API endpoints',
          'Review error handling patterns',
        ]);
        setShowRetroModal(true);
      }, 2000);
    }
  }, [isEpicComplete, hasTriggeredRetro, selectedBrief]);

  // Handlers for retro modal
  const handleApproveRetro = (selectedSuggestions: string[]) => {
    console.log('Approved suggestions:', selectedSuggestions);
    // TODO: Apply suggestions (create follow-up tasks, update docs, etc.)
    setShowRetroModal(false);
  };

  const handleDismissRetro = () => {
    setShowRetroModal(false);
  };

  if (!selectedBrief) {
    return (
      <div className="p-6 text-center text-slate-500">
        Select a brief to view details
      </div>
    );
  }

  if (isBriefLoading) {
    return <div className="p-6 text-center text-slate-400">Loading...</div>;
  }

  const hasQuestions = selectedBrief.questions && selectedBrief.questions.length > 0;
  const hasReviews = selectedBrief.reviews && selectedBrief.reviews.length > 0;
  const hasSpec = selectedBrief.spec !== null && selectedBrief.spec !== undefined;
  const hasExportedEpic = selectedBrief.brief.exported_epic_id !== null;

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        {/* Header with close button */}
        <div className="flex justify-between items-start">
          <h2 className="text-xl font-semibold text-slate-100">
            {selectedBrief.brief.title}
          </h2>
          <button
            onClick={clearSelection}
            className="text-slate-400 hover:text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
            <span className="sr-only">Close</span>
          </button>
        </div>

        {/* View Tasks button for exported briefs (any status with an exported epic) */}
        {hasExportedEpic && (
          <Button
            onClick={handleViewTasks}
            data-testid="brief-detail-view-tasks"
            className="w-full bg-sky-600 hover:bg-sky-700 text-white flex items-center justify-center gap-2"
          >
            View Tasks
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}

        {/* Start Tasks button for exported briefs that are not complete */}
        {hasExportedEpic && !isEpicComplete && (
          <Button
            onClick={() => setShowStartTasksConfirm(true)}
            disabled={isStartingTasks}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2"
          >
            {isStartingTasks ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Starting Tasks...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Start Tasks
              </>
            )}
          </Button>
        )}

        {/* Epic Complete Indicator */}
        {isEpicComplete && (
          <Card className="bg-emerald-900/20 border-emerald-700">
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="font-medium text-emerald-300">Epic Complete!</p>
                <p className="text-sm text-emerald-400/70">All tasks have been closed.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Task Summary Section for exported briefs */}
        {hasExportedEpic && (
          <TaskSummarySection
            childTasks={childTasks}
            isLoadingChildren={isLoadingChildren}
            timeInStage={timeInStage}
          />
        )}

        {/* Basic Info Section */}
        <CollapsibleSection
          title="Basic Info"
          isExpanded={expandedSections.basicInfo}
          onToggle={() => toggleSection('basicInfo')}
        >
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-slate-300 mb-1">Problem</p>
              <p className="text-sm text-slate-400">
                {selectedBrief.brief.problem_statement || 'Not specified'}
              </p>
            </div>
            {selectedBrief.brief.initial_thoughts && (
              <div>
                <p className="text-sm font-medium text-slate-300 mb-1">Initial Thoughts</p>
                <p className="text-sm text-slate-400 whitespace-pre-wrap">
                  {selectedBrief.brief.initial_thoughts}
                </p>
              </div>
            )}
          </div>
        </CollapsibleSection>

        {/* Interview Q&A Section */}
        {hasQuestions && (
          <CollapsibleSection
            title="Interview Q&A"
            isExpanded={expandedSections.interviewQA}
            onToggle={() => toggleSection('interviewQA')}
            count={selectedBrief.questions!.length}
          >
            <div className="space-y-2">
              {selectedBrief.questions!.map((q) => (
                <div key={q.id} className="bg-slate-800 p-3 rounded border border-slate-700">
                  <p className="font-medium text-sm text-slate-100">{q.question}</p>
                  {q.answer && (
                    <p className="text-sm text-slate-400 mt-2">{q.answer}</p>
                  )}
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* SME Reviews Section */}
        {hasReviews && (
          <CollapsibleSection
            title="SME Reviews"
            isExpanded={expandedSections.smeReviews}
            onToggle={() => toggleSection('smeReviews')}
            count={selectedBrief.reviews!.length}
          >
            <div className="space-y-3">
              {selectedBrief.reviews!.map((r) => (
                <div key={r.id} className="border-l-2 border-sky-500 pl-3">
                  <p className="text-sm font-medium text-slate-100">{r.agent_type}</p>
                  <p className="text-xs text-slate-400 mt-1">{r.recommendations}</p>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Spec Details Section */}
        {hasSpec && (
          <CollapsibleSection
            title="Spec Details"
            isExpanded={expandedSections.specDetails}
            onToggle={() => toggleSection('specDetails')}
          >
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-100">
                {selectedBrief.spec!.title}
              </p>
              {selectedBrief.spec!.description && (
                <p className="text-sm text-slate-400">
                  {selectedBrief.spec!.description}
                </p>
              )}
              <Badge variant="outline" className="bg-slate-800 text-slate-400 border-slate-700">
                {selectedBrief.spec!.status}
              </Badge>

              {/* Approve/Reject buttons for specs not yet approved or exported */}
              {selectedBrief.spec!.status !== 'approved' && selectedBrief.spec!.status !== 'exported' && (
                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={handleRejectSpec}
                    variant="outline"
                    className="flex-1 border-red-600 text-red-400 hover:bg-red-600/10"
                  >
                    Reject
                  </Button>
                  <Button
                    onClick={handleApproveSpec}
                    disabled={isApproving}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  >
                    {isApproving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Approving...
                      </>
                    ) : (
                      'Approve Spec'
                    )}
                  </Button>
                </div>
              )}
            </div>
          </CollapsibleSection>
        )}
      </div>

      {/* Start Tasks Confirmation Dialog */}
      <Dialog open={showStartTasksConfirm} onOpenChange={setShowStartTasksConfirm}>
        <DialogContent className="max-w-md bg-slate-900 border-slate-800 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-slate-100">Start Task Execution?</DialogTitle>
            <DialogDescription className="text-slate-400">
              This will begin running tasks for this epic using AI agents.
              Tasks will be executed in parallel batches based on their dependencies.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowStartTasksConfirm(false)}
              className="border-slate-700 text-slate-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleStartTasks}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Start Tasks
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Retro Suggestions Modal */}
      <RetroSuggestionsModal
        open={showRetroModal}
        onOpenChange={setShowRetroModal}
        suggestions={retroSuggestions}
        onApprove={handleApproveRetro}
        onDismiss={handleDismissRetro}
      />
    </ScrollArea>
  );
}
