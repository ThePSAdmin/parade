import { useState, useCallback, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChevronDown, Check, X, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@renderer/components/ui/dialog';
import { Button } from '@renderer/components/ui/button';
import { ScrollArea } from '@renderer/components/ui/scroll-area';

// ============================================================================
// Types
// ============================================================================

export interface ConstitutionSection {
  id: string;
  title: string;
  content: string;
}

export interface SectionReview {
  sectionId: string;
  approved: boolean;
  comment?: string;
}

export interface ConstitutionReview {
  approved: boolean;
  sectionReviews: SectionReview[];
}

export interface ConstitutionReviewerProps {
  sections: ConstitutionSection[];
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (review: ConstitutionReview) => void;
}

// ============================================================================
// Section Review State
// ============================================================================

type SectionStatus = 'pending' | 'approved' | 'changes_requested';

interface SectionState {
  status: SectionStatus;
  comment: string;
  showCommentField: boolean;
}

// ============================================================================
// Accordion Section Component
// ============================================================================

interface AccordionSectionProps {
  section: ConstitutionSection;
  state: SectionState;
  isExpanded: boolean;
  onToggle: () => void;
  onApprove: () => void;
  onRequestChanges: () => void;
  onCommentChange: (comment: string) => void;
}

function AccordionSection({
  section,
  state,
  isExpanded,
  onToggle,
  onApprove,
  onRequestChanges,
  onCommentChange,
}: AccordionSectionProps) {
  const statusIcon = useMemo(() => {
    switch (state.status) {
      case 'approved':
        return <Check className="h-4 w-4 text-green-400" />;
      case 'changes_requested':
        return <MessageSquare className="h-4 w-4 text-amber-400" />;
      default:
        return null;
    }
  }, [state.status]);

  const statusBadge = useMemo(() => {
    switch (state.status) {
      case 'approved':
        return (
          <span className="text-xs px-2 py-0.5 rounded-full bg-green-900/50 text-green-300 border border-green-700">
            Approved
          </span>
        );
      case 'changes_requested':
        return (
          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-900/50 text-amber-300 border border-amber-700">
            Changes Requested
          </span>
        );
      default:
        return (
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-400 border border-slate-600">
            Pending Review
          </span>
        );
    }
  }, [state.status]);

  return (
    <div className="border border-slate-700 rounded-lg overflow-hidden bg-slate-900/50">
      {/* Header */}
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'w-full flex items-center justify-between px-4 py-3 text-left transition-colors',
          'hover:bg-slate-800/50',
          isExpanded && 'bg-slate-800/30'
        )}
      >
        <div className="flex items-center gap-3">
          {statusIcon}
          <span className="font-medium text-slate-200">{section.title}</span>
        </div>
        <div className="flex items-center gap-3">
          {statusBadge}
          <ChevronDown
            className={cn(
              'h-4 w-4 text-slate-400 transition-transform duration-200',
              isExpanded && 'rotate-180'
            )}
          />
        </div>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="border-t border-slate-700">
          {/* Markdown Content */}
          <div className="p-4 bg-slate-900/30">
            <div className="prose prose-invert prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {section.content}
              </ReactMarkdown>
            </div>
          </div>

          {/* Review Actions */}
          <div className="px-4 py-3 bg-slate-800/30 border-t border-slate-700">
            <div className="flex items-center gap-2 mb-3">
              <Button
                type="button"
                variant={state.status === 'approved' ? 'default' : 'outline'}
                size="sm"
                onClick={onApprove}
                className={cn(
                  state.status === 'approved' &&
                    'bg-green-600 hover:bg-green-700 text-white'
                )}
              >
                <Check className="h-4 w-4 mr-1" />
                Approve
              </Button>
              <Button
                type="button"
                variant={state.status === 'changes_requested' ? 'default' : 'outline'}
                size="sm"
                onClick={onRequestChanges}
                className={cn(
                  state.status === 'changes_requested' &&
                    'bg-amber-600 hover:bg-amber-700 text-white'
                )}
              >
                <X className="h-4 w-4 mr-1" />
                Request Changes
              </Button>
            </div>

            {/* Comment Field */}
            {state.showCommentField && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Comment (describe requested changes)
                </label>
                <textarea
                  value={state.comment}
                  onChange={(e) => onCommentChange(e.target.value)}
                  placeholder="Describe what changes you would like to see in this section..."
                  className={cn(
                    'w-full min-h-[100px] px-3 py-2 rounded-md',
                    'bg-slate-900 border border-slate-600',
                    'text-slate-200 placeholder:text-slate-500',
                    'focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500',
                    'resize-y text-sm'
                  )}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function ConstitutionReviewer({
  sections,
  isOpen,
  onClose,
  onSubmit,
}: ConstitutionReviewerProps) {
  // Track which sections are expanded
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    () => new Set(sections.length > 0 ? [sections[0].id] : [])
  );

  // Track review state for each section
  const [sectionStates, setSectionStates] = useState<Record<string, SectionState>>(() =>
    sections.reduce(
      (acc, section) => ({
        ...acc,
        [section.id]: {
          status: 'pending' as SectionStatus,
          comment: '',
          showCommentField: false,
        },
      }),
      {}
    )
  );

  // Toggle section expansion
  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }, []);

  // Handle approve
  const handleApprove = useCallback((sectionId: string) => {
    setSectionStates((prev) => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        status: 'approved',
        showCommentField: false,
        comment: '',
      },
    }));
  }, []);

  // Handle request changes
  const handleRequestChanges = useCallback((sectionId: string) => {
    setSectionStates((prev) => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        status: 'changes_requested',
        showCommentField: true,
      },
    }));
  }, []);

  // Handle comment change
  const handleCommentChange = useCallback((sectionId: string, comment: string) => {
    setSectionStates((prev) => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        comment,
      },
    }));
  }, []);

  // Check if all sections have been reviewed
  const allSectionsReviewed = useMemo(() => {
    return sections.every((section) => {
      const state = sectionStates[section.id];
      if (!state) return false;
      if (state.status === 'pending') return false;
      // If changes requested, must have a comment
      if (state.status === 'changes_requested' && !state.comment.trim()) return false;
      return true;
    });
  }, [sections, sectionStates]);

  // Check if all sections are approved
  const allSectionsApproved = useMemo(() => {
    return sections.every((section) => {
      const state = sectionStates[section.id];
      return state?.status === 'approved';
    });
  }, [sections, sectionStates]);

  // Calculate review progress
  const reviewProgress = useMemo(() => {
    const reviewed = sections.filter((section) => {
      const state = sectionStates[section.id];
      if (!state || state.status === 'pending') return false;
      if (state.status === 'changes_requested' && !state.comment.trim()) return false;
      return true;
    }).length;
    return { reviewed, total: sections.length };
  }, [sections, sectionStates]);

  // Handle submit
  const handleSubmit = useCallback(() => {
    const review: ConstitutionReview = {
      approved: allSectionsApproved,
      sectionReviews: sections.map((section) => {
        const state = sectionStates[section.id];
        return {
          sectionId: section.id,
          approved: state?.status === 'approved',
          comment: state?.status === 'changes_requested' ? state.comment : undefined,
        };
      }),
    };
    onSubmit(review);
  }, [sections, sectionStates, allSectionsApproved, onSubmit]);

  // Reset state when dialog opens
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        onClose();
      }
    },
    [onClose]
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-xl text-slate-100">
            Review Constitution
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Review each section of the constitution. You can approve sections or request
            changes with comments.
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex items-center gap-3 px-1 py-2">
          <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full transition-all duration-300',
                allSectionsApproved ? 'bg-green-500' : 'bg-blue-500'
              )}
              style={{
                width: `${(reviewProgress.reviewed / reviewProgress.total) * 100}%`,
              }}
            />
          </div>
          <span className="text-sm text-slate-400 whitespace-nowrap">
            {reviewProgress.reviewed} of {reviewProgress.total} reviewed
          </span>
        </div>

        {/* Scrollable sections */}
        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-3 py-2">
            {sections.map((section) => (
              <AccordionSection
                key={section.id}
                section={section}
                state={
                  sectionStates[section.id] || {
                    status: 'pending',
                    comment: '',
                    showCommentField: false,
                  }
                }
                isExpanded={expandedSections.has(section.id)}
                onToggle={() => toggleSection(section.id)}
                onApprove={() => handleApprove(section.id)}
                onRequestChanges={() => handleRequestChanges(section.id)}
                onCommentChange={(comment) => handleCommentChange(section.id, comment)}
              />
            ))}
          </div>
        </ScrollArea>

        {/* Footer */}
        <DialogFooter className="flex-shrink-0 border-t border-slate-700 pt-4 mt-4">
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-slate-400">
              {allSectionsApproved ? (
                <span className="text-green-400">All sections approved</span>
              ) : allSectionsReviewed ? (
                <span className="text-amber-400">Some sections have requested changes</span>
              ) : (
                <span>Complete review of all sections to submit</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={!allSectionsReviewed}
                className={cn(
                  allSectionsApproved
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                )}
              >
                {allSectionsApproved ? 'Approve Constitution' : 'Submit Review'}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ConstitutionReviewer;
