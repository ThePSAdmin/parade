// Zustand store for Claude Agent SDK integration

import { create } from 'zustand';
import type {
  AgentSession,
  AgentMessage,
  Skill,
  PermissionRequest,
} from '../../shared/types/agent';
import { agentApi } from '../lib/api/agentApi';
import { wsClient } from '../lib/api/websocket';

interface ProjectMismatchWarning {
  sessionProjectPath: string;
  currentProjectPath: string | null;
  pendingMessage: string;
}

// Helper for localStorage keys
const getInputStorageKey = (projectPath: string) => `agent-input-${projectPath}`;

interface AgentState {
  // Skills
  skills: Skill[];
  isLoadingSkills: boolean;

  // Sessions
  sessions: AgentSession[];
  activeSessionId: string | null;
  activeProjectPath: string | null;

  // Messages for active session
  messages: AgentMessage[];

  // UI state
  isStreaming: boolean;
  pendingPermission: PermissionRequest | null;
  pendingProjectMismatch: ProjectMismatchWarning | null;
  error: string | null;

  // Input state
  inputValue: string;

  // Actions - Skills
  fetchSkills: () => Promise<void>;

  // Actions - Sessions
  fetchSessions: () => Promise<void>;
  setActiveSession: (sessionId: string | null) => void;
  setActiveProjectPath: (projectPath: string | null) => void;

  // Actions - Running skills
  runSkill: (skillName: string, prompt?: string) => void;
  continueSession: (message: string) => void;
  cancelSession: () => void;

  // Actions - Permissions
  approvePermission: (rememberForSession?: boolean) => void;
  denyPermission: () => void;

  // Actions - Project mismatch
  clearProjectMismatchWarning: () => void;
  proceedWithMismatchedProject: () => void;

  // Actions - UI
  setInputValue: (value: string) => void;
  clearError: () => void;

  // Event subscription
  subscribeToAgentEvents: () => () => void;
}

export const useAgentStore = create<AgentState>((set, get) => ({
  // Initial state
  skills: [],
  isLoadingSkills: false,
  sessions: [],
  activeSessionId: null,
  activeProjectPath: null,
  messages: [],
  isStreaming: false,
  pendingPermission: null,
  pendingProjectMismatch: null,
  error: null,
  inputValue: '',

  // Fetch available skills
  fetchSkills: async () => {
    if (get().isLoadingSkills) return;
    set({ isLoadingSkills: true, error: null });
    try {
      const skills = await agentApi.listSkills();
      set({ skills, isLoadingSkills: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load skills',
        isLoadingSkills: false,
      });
    }
  },

  // Fetch sessions
  fetchSessions: async () => {
    try {
      const { activeProjectPath } = get();
      const sessions = await agentApi.listSessions(activeProjectPath ?? undefined);
      set({ sessions });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load sessions',
      });
    }
  },

  // Set active session
  setActiveSession: (sessionId) => {
    set({ activeSessionId: sessionId, messages: [], pendingPermission: null });

    // Load messages for session if one is selected
    if (sessionId) {
      agentApi
        .getMessages(sessionId)
        .then((messages) => {
          // Only update if still the active session
          if (get().activeSessionId === sessionId) {
            set({ messages });
          }
        })
        .catch((err) => {
          console.error('Failed to load session messages:', err);
        });
    }
  },

  // Set active project path
  setActiveProjectPath: (projectPath) => {
    const { activeProjectPath: oldPath, inputValue } = get();

    // Save current input for old project
    if (oldPath && inputValue) {
      localStorage.setItem(getInputStorageKey(oldPath), inputValue);
    }

    // Restore input for new project (or empty string)
    let restoredInput = '';
    if (projectPath) {
      restoredInput = localStorage.getItem(getInputStorageKey(projectPath)) || '';
    }

    set({
      activeProjectPath: projectPath,
      sessions: [],
      activeSessionId: null,
      messages: [],
      inputValue: restoredInput,
    });
    if (projectPath) {
      get().fetchSessions();
    }
  },

  // Run a skill via WebSocket for streaming
  runSkill: (skillName, prompt) => {
    set({ isStreaming: true, messages: [], error: null, pendingPermission: null });
    wsClient.runSkill(skillName, prompt);
  },

  // Continue session with a new message
  continueSession: (message) => {
    const { activeSessionId, activeProjectPath, sessions } = get();
    if (!activeSessionId) {
      set({ error: 'No active session' });
      return;
    }

    // Check if session's projectPath matches activeProjectPath
    const session = sessions.find((s) => s.id === activeSessionId);
    if (session && session.projectPath !== activeProjectPath) {
      // Mismatch - session belongs to different project
      // Set a flag in state to show warning
      set({
        pendingProjectMismatch: {
          sessionProjectPath: session.projectPath,
          currentProjectPath: activeProjectPath,
          pendingMessage: message,
        },
      });
      return; // Don't proceed
    }

    // Add user message optimistically
    const userMessage: AgentMessage = {
      id: `user_${Date.now()}`,
      sessionId: activeSessionId,
      type: 'user',
      timestamp: new Date().toISOString(),
      content: {
        type: 'user',
        text: message,
      },
    };
    set((state) => ({
      messages: [...state.messages, userMessage],
      isStreaming: true,
      inputValue: '',
    }));

    // Clear saved input when message is sent
    if (activeProjectPath) {
      localStorage.removeItem(getInputStorageKey(activeProjectPath));
    }

    wsClient.continueSession(activeSessionId, message);
  },

  // Cancel current session
  cancelSession: () => {
    const { activeSessionId } = get();
    if (activeSessionId) {
      wsClient.cancelSession(activeSessionId);
      set({ isStreaming: false });
    }
  },

  // Approve permission request
  approvePermission: (rememberForSession) => {
    const { activeSessionId, pendingPermission } = get();
    if (!activeSessionId || !pendingPermission) return;

    wsClient.respondToPermission(
      activeSessionId,
      pendingPermission.id,
      'approve',
      rememberForSession
    );
    set({ pendingPermission: null });
  },

  // Deny permission request
  denyPermission: () => {
    const { activeSessionId, pendingPermission } = get();
    if (!activeSessionId || !pendingPermission) return;

    wsClient.respondToPermission(
      activeSessionId,
      pendingPermission.id,
      'deny'
    );
    set({ pendingPermission: null });
  },

  // Project mismatch actions
  clearProjectMismatchWarning: () => {
    set({ pendingProjectMismatch: null });
  },

  proceedWithMismatchedProject: () => {
    const { pendingProjectMismatch, activeSessionId } = get();
    if (!pendingProjectMismatch || !activeSessionId) return;

    const { pendingMessage } = pendingProjectMismatch;

    // Clear the warning
    set({ pendingProjectMismatch: null });

    // Add user message optimistically
    const userMessage: AgentMessage = {
      id: `user_${Date.now()}`,
      sessionId: activeSessionId,
      type: 'user',
      timestamp: new Date().toISOString(),
      content: {
        type: 'user',
        text: pendingMessage,
      },
    };
    set((state) => ({
      messages: [...state.messages, userMessage],
      isStreaming: true,
      inputValue: '',
    }));

    // Clear saved input when message is sent
    const { activeProjectPath } = get();
    if (activeProjectPath) {
      localStorage.removeItem(getInputStorageKey(activeProjectPath));
    }

    // Proceed with the message despite the mismatch
    wsClient.continueSession(activeSessionId, pendingMessage);
  },

  // UI actions
  setInputValue: (value) => {
    const { activeProjectPath } = get();
    set({ inputValue: value });
    if (activeProjectPath) {
      localStorage.setItem(getInputStorageKey(activeProjectPath), value);
    }
  },
  clearError: () => set({ error: null }),

  // Subscribe to WebSocket agent events
  subscribeToAgentEvents: () => {
    const unsubMessage = wsClient.onAgentMessage((sessionId, message) => {
      const { activeSessionId } = get();
      // Only add message if it's for the active session
      if (sessionId === activeSessionId) {
        set((state) => ({
          messages: [...state.messages, message],
        }));
      }
    });

    const unsubPermission = wsClient.onAgentPermissionRequest(
      (sessionId, permission) => {
        const { activeSessionId } = get();
        if (sessionId === activeSessionId) {
          set({ pendingPermission: permission, isStreaming: false });
        }
      }
    );

    const unsubComplete = wsClient.onAgentComplete((sessionId, status, error) => {
      const { activeSessionId } = get();
      if (sessionId === activeSessionId) {
        set({
          isStreaming: false,
          error: status === 'error' ? error : null,
        });
      }
      // Refresh sessions list
      get().fetchSessions();
    });

    const unsubSessionStarted = wsClient.onAgentSessionStarted((sessionId) => {
      set({ activeSessionId: sessionId });
      // Refresh sessions list
      get().fetchSessions();
    });

    const unsubError = wsClient.onAgentError((error) => {
      set({ error, isStreaming: false });
    });

    // Return combined unsubscribe function
    return () => {
      unsubMessage();
      unsubPermission();
      unsubComplete();
      unsubSessionStarted();
      unsubError();
    };
  },
}));

// Selector hooks for optimized re-renders
export const useActiveSession = () =>
  useAgentStore((state) =>
    state.sessions.find((s) => s.id === state.activeSessionId)
  );

export const useAgentMessages = () => useAgentStore((state) => state.messages);

export const useAgentSkills = () => useAgentStore((state) => state.skills);

export const useIsAgentStreaming = () =>
  useAgentStore((state) => state.isStreaming);

export const usePendingPermission = () =>
  useAgentStore((state) => state.pendingPermission);

export default useAgentStore;
