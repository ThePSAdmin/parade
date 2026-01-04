// Electron main process entry point

import { app, BrowserWindow, shell } from 'electron';
import path from 'path';
import { registerIpcHandlers } from './ipc/handlers';
import { registerProjectHandlers } from './ipc/project-handlers';
import { fileWatcherService } from './services/fileWatcher';
import { discoveryService } from './services/discovery';
import beadsService from './services/beads';
import settingsService from './services/settings';
import { docsService } from './services/docs';
import { telemetryService } from './services/telemetry';
import { IPC_CHANNELS } from '../shared/types/ipc';

let mainWindow: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// Debounce function for IPC events to prevent excessive re-renders
function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number): T {
  let timeoutId: NodeJS.Timeout | null = null;
  return ((...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), ms);
  }) as T;
}

// Debounced IPC event senders (300ms to coalesce rapid file changes)
const sendDiscoveryChange = debounce(() => {
  mainWindow?.webContents.send(IPC_CHANNELS.EVENTS.DISCOVERY_CHANGED);
}, 300);

const sendBeadsChange = debounce(() => {
  mainWindow?.webContents.send(IPC_CHANNELS.EVENTS.BEADS_CHANGED);
}, 300);

/**
 * Initialize file watchers based on saved project path
 */
function initializeFileWatchers(): void {
  const projectPath = settingsService.get('beadsProjectPath');
  if (projectPath) {
    // Initialize DiscoveryService with database path
    const discoveryDbPath = path.join(projectPath, 'discovery.db');
    discoveryService.setDatabasePath(discoveryDbPath);
    console.log('DiscoveryService initialized with:', discoveryDbPath);

    // Initialize TelemetryService with same database path
    telemetryService.setDatabasePath(discoveryDbPath);
    console.log('TelemetryService initialized with:', discoveryDbPath);

    // Initialize BeadsService with project path
    beadsService.setProjectPath(projectPath);
    console.log('BeadsService initialized with:', projectPath);

    // Initialize DocsService with project path
    docsService.setProjectPath(projectPath);
    console.log('DocsService initialized with:', projectPath);

    // Watch discovery.db for changes
    fileWatcherService.watchDiscovery(discoveryDbPath);

    // Watch .beads/ directory for changes
    const beadsPath = path.join(projectPath, '.beads');
    fileWatcherService.watchBeads(beadsPath);

    console.log('File watchers initialized for project:', projectPath);
  } else {
    console.log('No project path configured, file watchers not started');
  }
}

/**
 * Set up file watcher event listeners
 */
function setupFileWatcherEvents(): void {
  fileWatcherService.on('change', (event) => {
    if (event.type === 'discovery') {
      sendDiscoveryChange();
    } else if (event.type === 'beads') {
      sendBeadsChange();
    }
  });

  fileWatcherService.on('error', (error) => {
    console.error('File watcher error:', error);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    title: 'Parade',
    backgroundColor: '#f9fafb', // gray-50
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false, // Required for better-sqlite3
    },
  });

  // Open external links in browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Register IPC handlers before creating window
app.whenReady().then(() => {
  registerIpcHandlers();
  registerProjectHandlers();

  // Initialize services BEFORE creating window so they're ready when renderer starts
  setupFileWatcherEvents();
  initializeFileWatchers();

  // Now create the window
  createWindow();

  app.on('activate', () => {
    // On macOS, re-create window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Clean up file watchers before app quits
app.on('before-quit', () => {
  fileWatcherService.stopAll();
  console.log('File watchers stopped on app quit');
});

// Security: prevent navigation to unknown URLs
app.on('web-contents-created', (_, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    if (parsedUrl.origin !== 'http://localhost:5173') {
      event.preventDefault();
    }
  });
});
