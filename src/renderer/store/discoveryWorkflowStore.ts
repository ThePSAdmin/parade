// Zustand store for discovery modal/workflow state management

import { create } from 'zustand';

// Discovery workflow step types
export type DiscoveryStep = 'input' | 'qa' | 'complete';

// Discovery question from agent
export interface DiscoveryQuestion {
  index: number;
  text: string;
}

interface DiscoveryWorkflowState {
  // Workflow state
  currentStep: DiscoveryStep;
  sessionId: string | null; // Internal session tracking
  sdkSessionId: string | null; // Claude Code SDK session ID for resume
  briefId: string | null; // Associated brief ID

  // Q&A state
  questions: DiscoveryQuestion[];
  answers: Map<number, string>; // Question index -> answer

  // Spec iteration state
  rejectionCount: number;

  // UI state
  isSubmitting: boolean;
  error: string | null;

  // Actions
  startDiscovery: (briefId: string) => void;
  setSdkSessionId: (id: string) => void;
  addQuestion: (question: string) => void;
  setAnswer: (index: number, answer: string) => void;
  incrementRejection: () => void;
  reset: () => void;
  setStep: (step: DiscoveryStep) => void;
  setSubmitting: (isSubmitting: boolean) => void;
  setError: (error: string | null) => void;
}

// Generate a simple unique session ID
const generateSessionId = (): string => {
  return `dw_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

export const useDiscoveryWorkflowStore = create<DiscoveryWorkflowState>(
  (set) => ({
    // Initial state
    currentStep: 'input',
    sessionId: null,
    sdkSessionId: null,
    briefId: null,
    questions: [],
    answers: new Map(),
    rejectionCount: 0,
    isSubmitting: false,
    error: null,

    // Initialize a new discovery session
    startDiscovery: (briefId: string) => {
      set({
        currentStep: 'input',
        sessionId: generateSessionId(),
        sdkSessionId: null,
        briefId,
        questions: [],
        answers: new Map(),
        rejectionCount: 0,
        isSubmitting: false,
        error: null,
      });
    },

    // Store SDK session ID for potential resume
    setSdkSessionId: (id: string) => {
      set({ sdkSessionId: id });
    },

    // Append a question from the agent
    addQuestion: (question: string) => {
      set((state) => {
        const newQuestion: DiscoveryQuestion = {
          index: state.questions.length,
          text: question,
        };
        return {
          questions: [...state.questions, newQuestion],
        };
      });
    },

    // Record user answer for a question
    setAnswer: (index: number, answer: string) => {
      set((state) => {
        const newAnswers = new Map(state.answers);
        newAnswers.set(index, answer);
        return { answers: newAnswers };
      });
    },

    // Increment rejection counter when spec is rejected
    incrementRejection: () => {
      set((state) => ({
        rejectionCount: state.rejectionCount + 1,
      }));
    },

    // Reset all state
    reset: () => {
      set({
        currentStep: 'input',
        sessionId: null,
        sdkSessionId: null,
        briefId: null,
        questions: [],
        answers: new Map(),
        rejectionCount: 0,
        isSubmitting: false,
        error: null,
      });
    },

    // Change current workflow step
    setStep: (step: DiscoveryStep) => {
      set({ currentStep: step });
    },

    // Set submitting state
    setSubmitting: (isSubmitting: boolean) => {
      set({ isSubmitting });
    },

    // Set error message
    setError: (error: string | null) => {
      set({ error });
    },
  })
);

// Selector hooks for optimized re-renders
export const useDiscoveryStep = () =>
  useDiscoveryWorkflowStore((state) => state.currentStep);

export const useDiscoveryQuestions = () =>
  useDiscoveryWorkflowStore((state) => state.questions);

export const useDiscoveryAnswers = () =>
  useDiscoveryWorkflowStore((state) => state.answers);

export const useDiscoveryError = () =>
  useDiscoveryWorkflowStore((state) => state.error);

export const useDiscoverySubmitting = () =>
  useDiscoveryWorkflowStore((state) => state.isSubmitting);

export const useDiscoveryBriefId = () =>
  useDiscoveryWorkflowStore((state) => state.briefId);

export const useDiscoveryRejectionCount = () =>
  useDiscoveryWorkflowStore((state) => state.rejectionCount);

export default useDiscoveryWorkflowStore;
