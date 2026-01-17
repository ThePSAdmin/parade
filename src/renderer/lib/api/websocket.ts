// WebSocket client for real-time updates (web mode)

type EventCallback = () => void;

class ParadeWebSocket {
  private ws: WebSocket | null = null;
  private listeners = new Map<string, Set<EventCallback>>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000;

  connect() {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;

    // Determine WebSocket URL based on current page location
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // @ts-expect-error - Vite injects import.meta.env at build time
    const wsUrl = (import.meta.env?.VITE_WS_URL as string) || `${protocol}//${window.location.host}`;

    console.log('WebSocket connecting to:', wsUrl);

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
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

  disconnect() {
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
