// WebSocket client for real-time updates (web mode)

import type {
  AgentServerMessage,
  AgentClientMessage,
  AgentMessage,
  PermissionRequest,
  SessionType,
} from '../../../shared/types/agent';
import { useDiscoveryWorkflowStore } from '../../store/discoveryWorkflowStore';

type EventCallback = () => void;
type AgentMessageCallback = (sessionId: string, message: AgentMessage) => void;
type AgentPermissionCallback = (sessionId: string, permission: PermissionRequest) => void;
type AgentCompleteCallback = (sessionId: string, status: 'success' | 'error' | 'cancelled', error?: string) => void;
type AgentSessionStartedCallback = (sessionId: string) => void;
type AgentErrorCallback = (error: string) => void;

class ParadeWebSocket {
  private ws: WebSocket | null = null;
  private listeners = new Map<string, Set<EventCallback>>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 30;
  private reconnectDelay = 1000;

  // Heartbeat state
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private lastPong: number = Date.now();

  // Session type tracking for routing
  private sessionTypes = new Map<string, SessionType>();
  private pendingSessionType: SessionType | undefined = undefined;

  // Agent-specific listeners
  private agentMessageListeners = new Set<AgentMessageCallback>();
  private agentPermissionListeners = new Set<AgentPermissionCallback>();
  private agentCompleteListeners = new Set<AgentCompleteCallback>();
  private agentSessionStartedListeners = new Set<AgentSessionStartedCallback>();
  private agentErrorListeners = new Set<AgentErrorCallback>();

  connect() {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;

    // Determine WebSocket URL based on current page location
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // @ts-expect-error - Vite injects import.meta.env at build time
    let wsUrl = (import.meta.env?.VITE_WS_URL as string) || `${protocol}//${window.location.host}/ws`;

    // In development mode (Vite on port 5173), connect directly to Express server on port 3000
    // to bypass Vite's WebSocket proxy which has issues with message forwarding
    if (window.location.port === '5173') {
      wsUrl = `${protocol}//${window.location.hostname}:3000/ws`;
    }

    console.log('WebSocket connecting to:', wsUrl);

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // Handle heartbeat pong
          if (data.type === 'pong') {
            this.lastPong = Date.now();
            return;
          }

          // Handle agent-specific messages
          if (data.type?.startsWith('agent:')) {
            this.handleAgentMessage(data as AgentServerMessage | { type: 'agent:session_started'; sessionId: string } | { type: 'agent:error'; error: string });
            return;
          }

          // Handle standard event messages
          const handlers = this.listeners.get(data.type);
          if (handlers) {
            handlers.forEach((cb) => cb());
          }
        } catch (err) {
          console.error('WebSocket message parse error:', err);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.isConnecting = false;
        this.ws = null;
        this.stopHeartbeat();
        this.scheduleReconnect();
      };

      this.ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        this.isConnecting = false;
      };
    } catch (err) {
      console.error('WebSocket connection error:', err);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnect attempts reached, giving up');
      return;
    }

    // Exponential backoff with jitter
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts) + Math.random() * 1000,
      30000
    );

    this.reconnectAttempts++;
    console.log(`WebSocket reconnecting in ${Math.round(delay)}ms (attempt ${this.reconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.lastPong = Date.now();

    // Send ping every 30 seconds
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        // Check if we received a pong within the last 60 seconds
        const timeSinceLastPong = Date.now() - this.lastPong;
        if (timeSinceLastPong > 60000) {
          console.log('WebSocket heartbeat timeout, reconnecting...');
          this.ws.close();
          return;
        }

        // Send ping
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  disconnect() {
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  on(event: string, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      const handlers = this.listeners.get(event);
      if (handlers) {
        handlers.delete(callback);
        if (handlers.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }

  onBeadsChange(callback: EventCallback): () => void {
    return this.on('beads:changed', callback);
  }

  onDiscoveryChange(callback: EventCallback): () => void {
    return this.on('discovery:changed', callback);
  }

  // Agent methods
  private handleAgentMessage(data: AgentServerMessage | { type: 'agent:session_started'; sessionId: string } | { type: 'agent:error'; error: string }) {
    switch (data.type) {
      case 'agent:message':
        // Route AskUserQuestion tool calls from discovery sessions to the workflow store
        if (
          this.sessionTypes.get(data.sessionId) === 'discovery' &&
          data.message.type === 'tool_call' &&
          data.message.content?.type === 'tool_call' &&
          data.message.content?.toolName === 'AskUserQuestion'
        ) {
          const input = data.message.content.input as {
            questions?: Array<{ question: string }>;
          };
          if (input?.questions) {
            for (const q of input.questions) {
              useDiscoveryWorkflowStore.getState().addQuestion(q.question);
            }
          }
        }
        // Route completion messages from discovery sessions
        if (
          this.sessionTypes.get(data.sessionId) === 'discovery' &&
          data.message.type === 'system' &&
          data.message.content?.type === 'system' &&
          (data.message.content as { subtype?: string })?.subtype === 'completion'
        ) {
          useDiscoveryWorkflowStore.getState().setStep('complete');
        }
        this.agentMessageListeners.forEach((cb) => cb(data.sessionId, data.message));
        break;
      case 'agent:permission_request':
        this.agentPermissionListeners.forEach((cb) => cb(data.sessionId, data.permission));
        break;
      case 'agent:complete':
        this.agentCompleteListeners.forEach((cb) => cb(data.sessionId, data.status, data.error));
        // Clean up session type tracking on completion
        this.sessionTypes.delete(data.sessionId);
        break;
      case 'agent:session_started':
        // Associate pending session type with the new session ID
        if (this.pendingSessionType) {
          this.sessionTypes.set(data.sessionId, this.pendingSessionType);
          // Route discovery sessions to the discovery workflow store
          if (this.pendingSessionType === 'discovery') {
            useDiscoveryWorkflowStore.getState().setSdkSessionId(data.sessionId);
          }
          this.pendingSessionType = undefined;
        }
        this.agentSessionStartedListeners.forEach((cb) => cb(data.sessionId));
        break;
      case 'agent:error':
        this.agentErrorListeners.forEach((cb) => cb(data.error));
        break;
    }
  }

  // Set session type for routing purposes (called before sending agent:run)
  setSessionType(sessionId: string, sessionType: SessionType): void {
    this.sessionTypes.set(sessionId, sessionType);
  }

  // Get session type for a session
  getSessionType(sessionId: string): SessionType | undefined {
    return this.sessionTypes.get(sessionId);
  }

  // Send a message to the server
  send(message: AgentClientMessage): void {
    console.log('[WS Client] Sending message:', message.type, message);
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const payload = JSON.stringify(message);
      console.log('[WS Client] Sending payload:', payload);
      this.ws.send(payload);
    } else {
      console.error('WebSocket not connected, cannot send message. readyState:', this.ws?.readyState);
    }
  }

  // Agent event subscriptions
  onAgentMessage(callback: AgentMessageCallback): () => void {
    this.agentMessageListeners.add(callback);
    return () => {
      this.agentMessageListeners.delete(callback);
    };
  }

  onAgentPermissionRequest(callback: AgentPermissionCallback): () => void {
    this.agentPermissionListeners.add(callback);
    return () => {
      this.agentPermissionListeners.delete(callback);
    };
  }

  onAgentComplete(callback: AgentCompleteCallback): () => void {
    this.agentCompleteListeners.add(callback);
    return () => {
      this.agentCompleteListeners.delete(callback);
    };
  }

  onAgentSessionStarted(callback: AgentSessionStartedCallback): () => void {
    this.agentSessionStartedListeners.add(callback);
    return () => {
      this.agentSessionStartedListeners.delete(callback);
    };
  }

  onAgentError(callback: AgentErrorCallback): () => void {
    this.agentErrorListeners.add(callback);
    return () => {
      this.agentErrorListeners.delete(callback);
    };
  }

  // Send agent commands
  runSkill(skill: string, prompt?: string, args?: Record<string, unknown>, sessionType?: SessionType, resumeSessionId?: string): void {
    // Store session type for routing when session_started arrives
    this.pendingSessionType = sessionType;
    this.send({ type: 'agent:run', skill, prompt, args, sessionType, resumeSessionId });
  }

  continueSession(sessionId: string, message: string): void {
    this.send({ type: 'agent:continue', sessionId, message });
  }

  respondToPermission(sessionId: string, requestId: string, decision: 'approve' | 'deny', rememberForSession?: boolean): void {
    this.send({ type: 'agent:permission', sessionId, requestId, decision, rememberForSession });
  }

  cancelSession(sessionId: string): void {
    this.send({ type: 'agent:cancel', sessionId });
  }
}

// Singleton instance
export const wsClient = new ParadeWebSocket();

// Auto-connect when module loads (only in browser)
if (typeof window !== 'undefined') {
  // Delay connection slightly to allow app to initialize
  setTimeout(() => {
    wsClient.connect();
  }, 100);
}

export default wsClient;
