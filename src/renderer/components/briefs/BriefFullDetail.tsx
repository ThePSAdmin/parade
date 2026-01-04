import { useEffect, useState } from 'react';
import { useDiscoveryStore } from '../../store/discoveryStore';
import type { BriefStatus, InterviewQuestion, SMEReviewParsed, SpecParsed } from '../../../shared/types/discovery';
import { Card, CardContent, CardHeader } from '@renderer/components/ui/card';
import { Badge } from '@renderer/components/ui/badge';
import { ScrollArea } from '@renderer/components/ui/scroll-area';
import { StatusIcons, AgentIcons } from '@renderer/lib/iconMap';
import { FileText, ChevronRight, Loader2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const STATUS_CONFIG: Record<BriefStatus, { label: string; color: string; bgColor: string; icon: LucideIcon }> = {
  draft: { label: 'Draft', color: 'text-slate-400', bgColor: 'bg-slate-800', icon: StatusIcons.draft },
  in_discovery: { label: 'In Discovery', color: 'text-sky-400', bgColor: 'bg-sky-950', icon: StatusIcons.in_discovery },
  spec_ready: { label: 'Spec Ready', color: 'text-amber-400', bgColor: 'bg-amber-950', icon: StatusIcons.spec_ready },
  approved: { label: 'Approved', color: 'text-emerald-400', bgColor: 'bg-emerald-950', icon: StatusIcons.approved },
  exported: { label: 'Active', color: 'text-purple-400', bgColor: 'bg-purple-950', icon: StatusIcons.exported },
  in_progress: { label: 'In Progress', color: 'text-blue-400', bgColor: 'bg-blue-950', icon: StatusIcons.in_progress },
  completed: { label: 'Completed', color: 'text-green-400', bgColor: 'bg-green-950', icon: StatusIcons.completed },
  canceled: { label: 'Canceled', color: 'text-red-400', bgColor: 'bg-red-950', icon: StatusIcons.canceled },
};

interface BriefFullDetailProps {
  briefId: string | null;
}

export function BriefFullDetail({ briefId }: BriefFullDetailProps) {
  const { fetchBriefWithRelations, selectedBrief, isBriefLoading } = useDiscoveryStore();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (briefId) {
      fetchBriefWithRelations(briefId);
    }
  }, [briefId, fetchBriefWithRelations]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  if (!briefId) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400">
        <div className="text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-slate-600" />
          <p className="text-lg font-medium text-slate-100">Select a brief to view details</p>
          <p className="text-sm mt-1">Choose a brief from the list to see its full information</p>
        </div>
      </div>
    );
  }

  if (isBriefLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 className="animate-spin h-5 w-5" />
          Loading brief details...
        </div>
      </div>
    );
  }

  if (!selectedBrief) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400">
        Brief not found
      </div>
    );
  }

  const { brief, questions, reviews, spec } = selectedBrief;
  const statusConfig = STATUS_CONFIG[brief.status] || STATUS_CONFIG.draft;
  const answeredQuestions = questions?.filter((q) => q.answer) || [];
  const StatusIcon = statusConfig.icon;

  return (
    <ScrollArea className="flex-1">
      {/* Header */}
      <div className="sticky top-0 bg-slate-950 border-b border-slate-800 p-6 z-10">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <StatusIcon className="w-6 h-6 text-slate-400" />
              <Badge className={`${statusConfig.bgColor} ${statusConfig.color} border-0`}>
                {statusConfig.label}
              </Badge>
              <span className="text-sm text-slate-400">P{brief.priority}</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-100">{brief.title}</h1>
            <p className="text-sm text-slate-400 mt-1">
              Created {new Date(brief.created_at).toLocaleDateString()} · ID: {brief.id}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Overview Section */}
        <CollapsibleSection
          title="Overview"
          isExpanded={expandedSections.has('overview')}
          onToggle={() => toggleSection('overview')}
        >
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-slate-300 mb-1">Problem Statement</h4>
              <p className="text-slate-400 whitespace-pre-wrap">
                {brief.problem_statement || 'No problem statement provided'}
              </p>
            </div>
            {brief.initial_thoughts && (
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-1">Initial Thoughts</h4>
                <p className="text-slate-400 whitespace-pre-wrap">{brief.initial_thoughts}</p>
              </div>
            )}
          </div>
        </CollapsibleSection>

        {/* Interview Questions Section */}
        {questions && questions.length > 0 && (
          <CollapsibleSection
            title={`Interview Questions (${answeredQuestions.length}/${questions.length} answered)`}
            isExpanded={expandedSections.has('questions')}
            onToggle={() => toggleSection('questions')}
          >
            <div className="space-y-4">
              {questions.map((question, index) => (
                <QuestionItem key={question.id} question={question} index={index + 1} />
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* SME Reviews Section */}
        {reviews && reviews.length > 0 && (
          <CollapsibleSection
            title={`SME Reviews (${reviews.length})`}
            isExpanded={expandedSections.has('reviews')}
            onToggle={() => toggleSection('reviews')}
          >
            <div className="space-y-4">
              {reviews.map((review) => (
                <ReviewItem key={review.id} review={review} />
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Specification Section */}
        {spec && (
          <CollapsibleSection
            title="Specification"
            isExpanded={expandedSections.has('spec')}
            onToggle={() => toggleSection('spec')}
            badge={spec.status}
          >
            <SpecDetail spec={spec} />
          </CollapsibleSection>
        )}

        {/* Epic Link */}
        {brief.exported_epic_id && (
          <Card className="bg-purple-950 border-purple-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                {(() => {
                  const RocketIcon = StatusIcons.exported;
                  return <RocketIcon className="w-6 h-6 text-purple-400" />;
                })()}
                <div>
                  <p className="font-medium text-purple-100">Exported to Beads</p>
                  <p className="text-sm text-purple-300">Epic ID: {brief.exported_epic_id}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
}

// Collapsible Section Component
function CollapsibleSection({
  title,
  isExpanded,
  onToggle,
  children,
  badge,
}: {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  badge?: string;
}) {
  return (
    <Card className="border-slate-800 bg-slate-900">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-800 transition-colors"
      >
        <div className="flex items-center gap-2">
          <ChevronRight
            className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
          />
          <span className="font-medium text-slate-100">{title}</span>
          {badge && (
            <Badge className="bg-amber-950 text-amber-400 border-0">
              {badge}
            </Badge>
          )}
        </div>
      </button>
      {isExpanded && <CardContent className="p-4 pt-0 bg-slate-900">{children}</CardContent>}
    </Card>
  );
}

// Question Item Component
function QuestionItem({ question, index }: { question: InterviewQuestion; index: number }) {
  const categoryColors: Record<string, string> = {
    technical: 'bg-sky-950 text-sky-400',
    business: 'bg-emerald-950 text-emerald-400',
    ux: 'bg-purple-950 text-purple-400',
    scope: 'bg-orange-950 text-orange-400',
  };

  return (
    <div className="border-l-2 border-slate-700 pl-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm font-medium text-slate-400">Q{index}</span>
        {question.category && (
          <Badge className={`text-xs ${categoryColors[question.category] || 'bg-slate-800 text-slate-400'} border-0`}>
            {question.category}
          </Badge>
        )}
      </div>
      <p className="font-medium text-slate-100 mb-2">{question.question}</p>
      {question.answer ? (
        <div className="bg-slate-800 rounded p-3">
          <p className="text-sm text-slate-300 whitespace-pre-wrap">{question.answer}</p>
          {question.answered_at && (
            <p className="text-xs text-slate-500 mt-2">
              Answered {new Date(question.answered_at).toLocaleString()}
            </p>
          )}
        </div>
      ) : (
        <p className="text-sm text-slate-500 italic">Not answered yet</p>
      )}
    </div>
  );
}

// Utility to render any value (string, array, object) recursively
function RenderValue({ value, depth = 0 }: { value: unknown; depth?: number }) {
  if (value === null || value === undefined) return null;

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return <span className="text-slate-300">{String(value)}</span>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return null;
    // Check if array of simple values
    if (value.every(v => typeof v === 'string' || typeof v === 'number')) {
      return (
        <ul className="list-disc list-inside space-y-0.5">
          {value.map((item, i) => (
            <li key={i} className="text-sm text-slate-400">{String(item)}</li>
          ))}
        </ul>
      );
    }
    // Array of objects
    return (
      <div className="space-y-2">
        {value.map((item, i) => (
          <div key={i} className="pl-3 border-l-2 border-slate-700">
            <RenderValue value={item} depth={depth + 1} />
          </div>
        ))}
      </div>
    );
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return null;
    return (
      <div className={`space-y-2 ${depth > 0 ? 'pl-3' : ''}`}>
        {entries.map(([key, val]) => (
          <div key={key}>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              {key.replace(/_/g, ' ')}
            </span>
            <div className="mt-0.5 text-sm text-slate-300">
              <RenderValue value={val} depth={depth + 1} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return null;
}

// Review Item Component - Enhanced readability
function ReviewItem({ review }: { review: SMEReviewParsed }) {
  const agentConfig: Record<string, { icon: LucideIcon; label: string; color: string; bgColor: string; borderColor: string }> = {
    'technical-sme': { icon: AgentIcons['technical-sme'], label: 'Technical Review', color: 'text-sky-300', bgColor: 'bg-sky-950', borderColor: 'border-sky-800' },
    'business-sme': { icon: AgentIcons['business-sme'], label: 'Business Review', color: 'text-emerald-300', bgColor: 'bg-emerald-950', borderColor: 'border-emerald-800' },
    'ux-sme': { icon: AgentIcons['ux-sme'], label: 'UX Review', color: 'text-purple-300', bgColor: 'bg-purple-950', borderColor: 'border-purple-800' },
  };

  const config = agentConfig[review.agent_type] || {
    icon: AgentIcons.default, label: review.agent_type.replace(/-/g, ' '), color: 'text-slate-300', bgColor: 'bg-slate-800', borderColor: 'border-slate-700'
  };
  const AgentIcon = config.icon;

  // Extract findings - handle both string and object
  const findings = review.findings;
  let summary = '';
  let strengths: string[] = [];
  let weaknesses: string[] = [];
  let gaps: string[] = [];
  let feasibility: 'low' | 'medium' | 'high' | undefined;
  let estimatedEffort: string | undefined;

  if (findings) {
    if (typeof findings === 'string') {
      summary = findings;
    } else {
      summary = findings.summary || '';
      strengths = findings.strengths || [];
      weaknesses = findings.weaknesses || [];
      gaps = findings.gaps || [];
      feasibility = findings.feasibility;
      estimatedEffort = findings.estimatedEffort;
    }
  }

  return (
    <Card className={`${config.bgColor} ${config.borderColor}`}>
      {/* Header */}
      <CardHeader className={`flex-row items-center gap-3 pb-3 ${config.bgColor} border-b border-slate-800`}>
        <AgentIcon className="w-6 h-6 text-slate-400" />
        <div className="flex-1 space-y-0">
          <h4 className={`font-semibold ${config.color}`}>{config.label}</h4>
          <p className="text-xs text-slate-500">
            {new Date(review.created_at).toLocaleDateString()} at {new Date(review.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </CardHeader>

      {/* Content */}
      <CardContent className="p-4 bg-slate-900 rounded-b-lg space-y-4">
        {/* Summary */}
        {summary && (
          <div>
            <p className="text-sm text-slate-300 leading-relaxed">{summary}</p>
          </div>
        )}

        {/* Strengths */}
        {strengths.length > 0 && (
          <div>
            <h5 className="text-xs font-semibold text-emerald-400 uppercase tracking-wide mb-2 flex items-center gap-1">
              <span>✓</span> Strengths
            </h5>
            <ul className="space-y-1">
              {strengths.map((s, i) => (
                <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                  <span className="text-emerald-500 mt-1">•</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Weaknesses */}
        {weaknesses.length > 0 && (
          <div>
            <h5 className="text-xs font-semibold text-orange-400 uppercase tracking-wide mb-2 flex items-center gap-1">
              <span>!</span> Areas for Improvement
            </h5>
            <ul className="space-y-1">
              {weaknesses.map((w, i) => (
                <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                  <span className="text-orange-500 mt-1">•</span>
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Gaps */}
        {gaps.length > 0 && (
          <div>
            <h5 className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-2 flex items-center gap-1">
              <span>?</span> Gaps Identified
            </h5>
            <ul className="space-y-1">
              {gaps.map((g, i) => (
                <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span>{g}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Feasibility & Estimated Effort */}
        {(feasibility || estimatedEffort) && (
          <div className="flex flex-wrap gap-4">
            {feasibility && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Feasibility:</span>
                <span className={`text-sm font-medium px-2 py-1 rounded ${
                  feasibility === 'high' ? 'bg-emerald-900/50 text-emerald-300' :
                  feasibility === 'medium' ? 'bg-amber-900/50 text-amber-300' :
                  'bg-red-900/50 text-red-300'
                }`}>
                  {feasibility.charAt(0).toUpperCase() + feasibility.slice(1)}
                </span>
              </div>
            )}
            {estimatedEffort && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Estimated Effort:</span>
                <span className="text-sm text-slate-300">{estimatedEffort}</span>
              </div>
            )}
          </div>
        )}

        {/* Recommendations */}
        {review.recommendations && (
          <div className="bg-sky-950 border border-sky-800 rounded-md p-3">
            <h5 className="text-xs font-semibold text-sky-400 uppercase tracking-wide mb-2">
              Recommendations
            </h5>
            <p className="text-sm text-sky-200 whitespace-pre-wrap">{review.recommendations}</p>
          </div>
        )}

        {/* Concerns */}
        {review.concerns && (
          <div className="bg-amber-950 rounded-md p-3 border border-amber-800">
            <h5 className="text-xs font-semibold text-amber-400 uppercase tracking-wide mb-2 flex items-center gap-1">
              <span>⚠</span> Concerns
            </h5>
            <p className="text-sm text-amber-200 whitespace-pre-wrap">{review.concerns}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Spec Detail Component
function SpecDetail({ spec }: { spec: SpecParsed }) {
  // Handle already-parsed fields
  const acceptanceCriteria = spec.acceptance_criteria || [];
  const taskBreakdown = spec.task_breakdown || [];

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium text-slate-100 mb-1">{spec.title}</h4>
        {spec.description && (
          <p className="text-slate-400 whitespace-pre-wrap">{spec.description}</p>
        )}
      </div>

      {acceptanceCriteria.length > 0 && (
        <div>
          <h5 className="text-sm font-medium text-slate-300 mb-3">Acceptance Criteria</h5>
          <ul className="space-y-3">
            {acceptanceCriteria.map((criterion) => (
              <li key={criterion.id} className="flex items-start gap-3 text-sm text-slate-400 leading-relaxed">
                <span className={`flex-shrink-0 mt-0.5 ${criterion.completed ? 'text-emerald-500' : 'text-slate-600'}`}>
                  {criterion.completed ? '✓' : '○'}
                </span>
                <span className="flex-1">{criterion.description}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {taskBreakdown.length > 0 && (
        <div>
          <h5 className="text-sm font-medium text-slate-300 mb-2">Task Breakdown</h5>
          <div className="space-y-2">
            {taskBreakdown.map((task, i) => (
              <div key={task.id} className="flex items-center gap-2 text-sm">
                <span className="w-6 h-6 flex items-center justify-center bg-slate-800 rounded text-xs font-medium text-slate-400">
                  {i + 1}
                </span>
                <span className="text-slate-100 flex-1">{task.title}</span>
                {task.complexity && (
                  <Badge className={`text-xs border-0 ${
                    task.complexity === 'high' ? 'bg-red-950 text-red-400' :
                    task.complexity === 'medium' ? 'bg-amber-950 text-amber-400' :
                    'bg-emerald-950 text-emerald-400'
                  }`}>
                    {task.complexity}
                  </Badge>
                )}
                {task.estimatedHours && (
                  <span className="text-xs text-slate-500">{task.estimatedHours}h</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {spec.design_notes && Object.keys(spec.design_notes).length > 0 && (
        <div className="bg-slate-800 rounded-lg p-4">
          <h5 className="text-sm font-semibold text-slate-300 mb-3">Design Notes</h5>
          <RenderValue value={spec.design_notes} />
        </div>
      )}

      {spec.exported_epic_id && (
        <div className="text-sm text-purple-400">
          Exported to epic: {spec.exported_epic_id}
        </div>
      )}
    </div>
  );
}

export default BriefFullDetail;
