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

interface AgentState {
  // Skills
  skills: Skill[];
  isLoadingSkills: boolean;

  // Sessions
  sessions: AgentSession[];
  activeSessionId: string | null;

  // Messages for active session
  messages: AgentMessage[];

  // UI state
  isStreaming: boolean;
  pendingPermission: PermissionRequest | null;
  error: string | null;

  // Input state
  inputValue: string;

  // Actions - Skills
  fetchSkills: () => Promise<void>;

  // Actions - Sessions
  fetchSessions: () => Promise<void>;
  setActiveSession: (sessionId: string | null) => void;

  // Actions - Running skills
  runSkill: (skillName: string, prompt?: string) => void;
  continueSession: (message: string) => void;
  cancelSession: () => void;

  // Actions - Permissions
  approvePermission: (rememberForSession?: boolean) => void;
  denyPermission: () => void;

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
  messages: [],
  isStreaming: false,
  pendingPermission: null,
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
      const sessions = await agentApi.listSessions();
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

  // Run a skill via WebSocket for streaming
  runSkill: (skillName, prompt) => {
    set({ isStreaming: true, messages: [], error: null, pendingPermission: null });
    wsClient.runSkill(skillName, prompt);
  },

  // Continue session with a new message
  continueSession: (message) => {
    const { activeSessionId } = get();
    if (!activeSessionId) {
      set({ error: 'No active session' });
      return;
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

  // UI actions
  setInputValue: (value) => set({ inputValue: value }),
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
