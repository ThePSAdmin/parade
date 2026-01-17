import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@renderer/components/ui/dialog';
import { Button } from '@renderer/components/ui/button';
import { Textarea } from '@renderer/components/ui/textarea';
import { Input } from '@renderer/components/ui/input';
import { ScrollArea } from '@renderer/components/ui/scroll-area';
import {
  useDiscoveryWorkflowStore,
  useDiscoveryStep,
  useDiscoverySubmitting,
  useDiscoveryQuestions,
  useDiscoveryAnswers,
  type DiscoveryStep,
} from '@renderer/store/discoveryWorkflowStore';
import { CheckCircle2, Loader2 } from 'lucide-react';
import wsClient from '@renderer/lib/api/websocket';

interface DiscoveryWorkflowModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Step configuration for the indicator
const STEPS: { key: DiscoveryStep; label: string }[] = [
  { key: 'input', label: 'Feature Input' },
  { key: 'qa', label: 'Q&A' },
  { key: 'complete', label: 'Complete' },
];

function StepIndicator({ currentStep }: { currentStep: DiscoveryStep }) {
  const stepIndex = STEPS.findIndex((s) => s.key === currentStep);

  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {STEPS.map((step, index) => {
        const isActive = step.key === currentStep;
        const isCompleted = index < stepIndex;

        return (
          <div key={step.key} className="flex items-center">
            {/* Step badge */}
            <div className="flex items-center gap-2">
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  transition-colors duration-200
                  ${isActive ? 'bg-sky-500 text-white' : ''}
                  ${isCompleted ? 'bg-sky-600 text-white' : ''}
                  ${!isActive && !isCompleted ? 'bg-slate-700 text-slate-400' : ''}
                `}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={`
                  text-sm font-medium
                  ${isActive ? 'text-sky-400' : ''}
                  ${isCompleted ? 'text-slate-300' : ''}
                  ${!isActive && !isCompleted ? 'text-slate-500' : ''}
                `}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {index < STEPS.length - 1 && (
              <div
                className={`
                  w-8 h-0.5 mx-2
                  ${index < stepIndex ? 'bg-sky-500' : 'bg-slate-700'}
                `}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function FeatureInputForm() {
  const [featureDescription, setFeatureDescription] = useState('');
  const { setStep, setSubmitting } = useDiscoveryWorkflowStore();
  const isSubmitting = useDiscoverySubmitting();

  const handleSubmit = () => {
    if (!featureDescription.trim()) return;
    setSubmitting(true);
    wsClient.runSkill('discover', featureDescription, undefined, 'discovery');
    setStep('qa'); // Move to Q&A step
    setSubmitting(false);
  };

  return (
    <div className="flex-1 flex flex-col">
      <h3 className="text-lg font-semibold text-slate-100 mb-2">
        Describe Your Feature
      </h3>
      <p className="text-sm text-slate-400 mb-4">
        Tell us about the feature you want to build. Include the problem it
        solves, the expected behavior, and any constraints.
      </p>
      <Textarea
        value={featureDescription}
        onChange={(e) => setFeatureDescription(e.target.value)}
        placeholder="Describe your feature idea..."
        className="flex-1 min-h-[200px] bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 resize-none"
      />
      <div className="mt-4 flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={!featureDescription.trim() || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Starting Discovery...
            </>
          ) : (
            'Start Discovery'
          )}
        </Button>
      </div>
    </div>
  );
}

interface DiscoveryQAPanelProps {
  onCancel: () => void;
}

function DiscoveryQAPanel({ onCancel }: DiscoveryQAPanelProps) {
  const questions = useDiscoveryQuestions();
  const answers = useDiscoveryAnswers();
  const { sdkSessionId, setAnswer } = useDiscoveryWorkflowStore();
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Find first unanswered question
  const currentQuestionIndex = questions.findIndex((_, i) => !answers.has(i));
  const currentQuestion = questions[currentQuestionIndex];
  const isComplete = currentQuestionIndex === -1 && questions.length > 0;
  const isWaitingForQuestions = questions.length === 0;

  // Auto-scroll to bottom when new questions arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        '[data-radix-scroll-area-viewport]'
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [questions.length, answers.size]);

  const handleSubmitAnswer = () => {
    if (!currentAnswer.trim() || !sdkSessionId) return;
    setAnswer(currentQuestionIndex, currentAnswer);
    wsClient.continueSession(sdkSessionId, currentAnswer);
    setCurrentAnswer('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitAnswer();
    }
  };

  const handleCancelClick = () => {
    setShowCancelConfirm(true);
  };

  const handleConfirmCancel = () => {
    setShowCancelConfirm(false);
    // Cancel the agent session if one exists
    if (sdkSessionId) {
      wsClient.cancelSession(sdkSessionId);
    }
    onCancel();
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Progress indicator */}
      <div className="text-sm text-slate-400 mb-4">
        {isWaitingForQuestions ? (
          <span className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Waiting for discovery questions...
          </span>
        ) : isComplete ? (
          <span className="text-green-400">All questions answered</span>
        ) : (
          `Question ${currentQuestionIndex + 1} of ${questions.length}`
        )}
      </div>

      {/* Chat history */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 mb-4 pr-4">
        {questions.map((q, i) => (
          <div key={i} className="mb-4">
            {/* Agent question */}
            <div className="bg-slate-800 p-3 rounded-lg">
              <p className="text-slate-100 whitespace-pre-wrap">{q.text}</p>
            </div>
            {/* User answer */}
            {answers.has(i) && (
              <div className="bg-sky-900/30 p-3 rounded-lg mt-2 ml-8">
                <p className="text-slate-300 whitespace-pre-wrap">
                  {answers.get(i)}
                </p>
              </div>
            )}
          </div>
        ))}
      </ScrollArea>

      {/* Input for current question */}
      {!isComplete && currentQuestion && (
        <div className="flex gap-2">
          <Input
            value={currentAnswer}
            onChange={(e) => setCurrentAnswer(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your answer..."
            className="flex-1 bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500"
          />
          <Button
            onClick={handleSubmitAnswer}
            disabled={!currentAnswer.trim() || !sdkSessionId}
          >
            Send
          </Button>
        </div>
      )}

      {/* Cancel button */}
      <div className="mt-4 flex justify-between items-center">
        <Button
          variant="ghost"
          onClick={handleCancelClick}
          className="text-slate-400 hover:text-slate-200"
        >
          Cancel Discovery
        </Button>
      </div>

      {/* Cancel confirmation dialog */}
      <Dialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <DialogContent className="max-w-md bg-slate-900 border-slate-800 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-slate-100">
              Cancel Discovery?
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Are you sure you want to cancel? Your progress in this discovery
              session will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowCancelConfirm(false)}
              className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-slate-100"
            >
              Continue Discovery
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmCancel}
              className="bg-red-600 hover:bg-red-700"
            >
              Cancel Discovery
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CompleteStep() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
        </div>
        <h3 className="text-lg font-semibold text-slate-100 mb-2">
          Discovery Complete
        </h3>
        <p className="text-sm text-slate-400">
          Your feature specification has been generated successfully. You can
          now review and approve it.
        </p>
      </div>
    </div>
  );
}

export function DiscoveryWorkflowModal({
  open,
  onOpenChange,
}: DiscoveryWorkflowModalProps) {
  const currentStep = useDiscoveryStep();
  const { reset } = useDiscoveryWorkflowStore();
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  // Determine if we should block navigation (in progress and not complete)
  const isInProgress = open && (currentStep === 'input' || currentStep === 'qa');

  // Browser beforeunload handler - warns when user tries to close/refresh browser
  useEffect(() => {
    if (!isInProgress) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue =
        'You have unsaved discovery progress. Are you sure you want to leave?';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isInProgress]);

  const handleOpenChange = (newOpen: boolean) => {
    // If trying to close and not on complete step, show confirmation
    if (!newOpen && currentStep !== 'complete') {
      setShowCloseConfirm(true);
      return;
    }
    onOpenChange(newOpen);
  };

  const handleConfirmClose = () => {
    setShowCloseConfirm(false);
    reset();
    onOpenChange(false);
  };

  const handleCancelClose = () => {
    setShowCloseConfirm(false);
  };

  const handleQACancel = () => {
    reset();
    onOpenChange(false);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'input':
        return <FeatureInputForm />;
      case 'qa':
        return <DiscoveryQAPanel onCancel={handleQACancel} />;
      case 'complete':
        return <CompleteStep />;
      default:
        return null;
    }
  };

  return (
    <>
      {/* Main workflow dialog */}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-4xl min-h-[600px] bg-slate-900 border-slate-800 text-slate-100 flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl text-slate-100">
              Discovery Workflow
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Create a detailed specification for your feature through guided
              discovery.
            </DialogDescription>
          </DialogHeader>

          <StepIndicator currentStep={currentStep} />

          <div className="flex-1 flex flex-col">{renderStepContent()}</div>
        </DialogContent>
      </Dialog>

      {/* Close confirmation dialog */}
      <Dialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
        <DialogContent className="max-w-md bg-slate-900 border-slate-800 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-slate-100">
              Discard Discovery Progress?
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              You have unsaved progress in the discovery workflow. Are you sure
              you want to close? All progress will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={handleCancelClose}
              className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-slate-100"
            >
              Continue Working
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmClose}
              className="bg-red-600 hover:bg-red-700"
            >
              Discard Progress
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default DiscoveryWorkflowModal;
