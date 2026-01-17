// Events client for real-time updates
// Conditionally uses Electron IPC or WebSocket based on environment

import { wsClient } from './websocket';

// Detect if running in Electron or web browser
const isElectron = typeof window !== 'undefined' && 'electron' in window;

// Events client that works in both environments
export const events = {
  onBeadsChange(callback: () => void): () => void {
    if (isElectron) {
      return window.electron.events.onBeadsChange(callback);
    }
    return wsClient.onBeadsChange(callback);
  },

  onDiscoveryChange(callback: () => void): () => void {
    if (isElectron) {
      return window.electron.events.onDiscoveryChange(callback);
    }
    return wsClient.onDiscoveryChange(callback);
  },
};

export default events;
