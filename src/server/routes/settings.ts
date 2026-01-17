// Settings REST routes

import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { serverSettingsService } from '../services/settings';
import { beadsService } from '../../main/services/beads';
import { discoveryService } from '../../main/services/discovery';
import { telemetryService } from '../../main/services/telemetry';
import { docsService } from '../../main/services/docs';
import { fileWatcherService } from '../../main/services/fileWatcher';
import { claudeAgentService } from '../services/claudeAgent';

export const settingsRouter = Router();

// Get all settings
settingsRouter.get('/', async (_req, res) => {
  try {
    const result = serverSettingsService.getAll();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// Get setting by key
settingsRouter.get('/:key', async (req, res) => {
  try {
    const key = req.params.key;
    if (key === 'all') {
      const result = serverSettingsService.getAll();
      res.json(result);
    } else {
      const result = serverSettingsService.get(key as 'beadsProjectPath' | 'claudeApiKey' | 'projects');
      res.json(result);
    }
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// Set setting by key
settingsRouter.put('/:key', async (req, res) => {
  try {
    const key = req.params.key;
    const value = req.body.value;

    serverSettingsService.set(key as 'beadsProjectPath' | 'claudeApiKey' | 'projects', value);

    // If beads path changed, update all services and watchers
    if (key === 'beadsProjectPath' && typeof value === 'string') {
      const projectPath = value;

      // Update BeadsService
      beadsService.setProjectPath(projectPath);

      // Update DiscoveryService - check .parade/ first, fallback to root
      const paradeDbPath = path.join(projectPath, '.parade', 'discovery.db');
      const legacyDbPath = path.join(projectPath, 'discovery.db');
      const discoveryDbPath = fs.existsSync(paradeDbPath)
        ? paradeDbPath
        : fs.existsSync(legacyDbPath)
          ? legacyDbPath
          : paradeDbPath;
      discoveryService.setDatabasePath(discoveryDbPath);

      // Update TelemetryService (shares discovery.db)
      telemetryService.setDatabasePath(discoveryDbPath);

      // Update DocsService
      docsService.setProjectPath(projectPath);

      // Update ClaudeAgentService
      claudeAgentService.setProjectPath(projectPath);

      // Restart file watchers
      fileWatcherService.stopAll();
      fileWatcherService.watchDiscovery(discoveryDbPath);
      fileWatcherService.watchBeads(path.join(projectPath, '.beads'));

      console.log('Services reinitialized for project path:', projectPath);
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});
