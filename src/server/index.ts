// Express server entry point for web deployment

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import fs from 'fs';

// Import existing services (reuse from src/main/services/)
import { beadsService } from '../main/services/beads';
import { discoveryService } from '../main/services/discovery';
import { telemetryService } from '../main/services/telemetry';
import { docsService } from '../main/services/docs';
import { fileWatcherService } from '../main/services/fileWatcher';
// Import server-specific settings service (doesn't use Electron)
import { serverSettingsService } from './services/settings';

// Import routes
import { beadsRouter } from './routes/beads';
import { discoveryRouter } from './routes/discovery';
import { telemetryRouter } from './routes/telemetry';
import { docsRouter } from './routes/docs';
import { settingsRouter } from './routes/settings';
import { projectRouter } from './routes/project';
import { filesystemRouter } from './routes/filesystem';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/beads', beadsRouter);
app.use('/api/discovery', discoveryRouter);
app.use('/api/telemetry', telemetryRouter);
app.use('/api/docs', docsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/project', projectRouter);
app.use('/api/filesystem', filesystemRouter);

// App info endpoint (replaces Electron app.getVersion)
app.get('/api/app/version', (_req, res) => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../../package.json'), 'utf-8'));
  res.json(packageJson.version);
});

// Serve static frontend in production
// When running via tsx (dev), __dirname is src/server
// When running compiled, __dirname is dist/server
// Web files are built to dist/web
const webDistPath = path.resolve(__dirname, '../../dist/web');
if (fs.existsSync(webDistPath)) {
  console.log('Serving static files from:', webDistPath);
  app.use(express.static(webDistPath));
  // Catch-all for SPA routing - use regex pattern for Express 5 compatibility
  app.get(/^\/(?!api).*/, (_req, res) => {
    res.sendFile(path.join(webDistPath, 'index.html'));
  });
} else {
  // In dev mode without build, show helpful message
  app.get('/', (_req, res) => {
    res.send(`
      <html>
        <body style="font-family: system-ui; padding: 40px; background: #0f172a; color: #e2e8f0;">
          <h1>Parade API Server</h1>
          <p>The API server is running, but no frontend build found.</p>
          <p>For development, access the Vite dev server at <a href="http://localhost:5173" style="color: #38bdf8;">http://localhost:5173</a></p>
          <p>For production, run: <code style="background: #1e293b; padding: 4px 8px; border-radius: 4px;">npm run build:web</code></p>
          <h3>API Endpoints:</h3>
          <ul>
            <li><a href="/api/health" style="color: #38bdf8;">/api/health</a></li>
            <li>/api/beads</li>
            <li>/api/discovery</li>
            <li>/api/settings</li>
          </ul>
        </body>
      </html>
    `);
  });
}

// WebSocket connection tracking
const clients = new Set<WebSocket>();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log('WebSocket client connected. Total:', clients.size);

  ws.on('close', () => {
    clients.delete(ws);
    console.log('WebSocket client disconnected. Total:', clients.size);
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
    clients.delete(ws);
  });
});

// Broadcast to all connected WebSocket clients
function broadcast(type: string) {
  const message = JSON.stringify({ type });
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Wire file watcher to WebSocket broadcasts
fileWatcherService.on('change', (event) => {
  if (event.type === 'discovery') {
    broadcast('discovery:changed');
  } else if (event.type === 'beads') {
    broadcast('beads:changed');
  }
});

// Initialize services with project path
function initializeServices(projectPath: string) {
  console.log('Initializing services for project:', projectPath);

  // Determine discovery.db path (.parade/ preferred, fallback to root)
  const paradeDbPath = path.join(projectPath, '.parade', 'discovery.db');
  const legacyDbPath = path.join(projectPath, 'discovery.db');
  const discoveryDbPath = fs.existsSync(paradeDbPath)
    ? paradeDbPath
    : fs.existsSync(legacyDbPath)
      ? legacyDbPath
      : paradeDbPath;

  // Initialize all services
  beadsService.setProjectPath(projectPath);
  discoveryService.setDatabasePath(discoveryDbPath);
  telemetryService.setDatabasePath(discoveryDbPath);
  docsService.setProjectPath(projectPath);

  // Start file watchers
  fileWatcherService.stopAll();
  fileWatcherService.watchDiscovery(discoveryDbPath);
  fileWatcherService.watchBeads(path.join(projectPath, '.beads'));

  console.log('Services initialized:');
  console.log('  - Beads project path:', projectPath);
  console.log('  - Discovery DB path:', discoveryDbPath);
}

// Get initial project path from settings or environment
const projectPath = process.env.PARADE_PROJECT_PATH || serverSettingsService.get('beadsProjectPath') || process.cwd();

// Initialize services
initializeServices(projectPath);

// Export for use in routes that need to reinitialize services
export { initializeServices, serverSettingsService, broadcast };

// Start server
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(Number(PORT), HOST, () => {
  console.log(`\nParade server running at http://${HOST}:${PORT}`);
  console.log(`Project path: ${projectPath}`);
  console.log('\nEndpoints:');
  console.log('  - API: /api/*');
  console.log('  - WebSocket: ws://localhost:' + PORT);
  console.log('  - Health: /api/health');
});
