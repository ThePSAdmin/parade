// Project REST routes

import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { setupStatusService } from '../../main/services/setupStatus';
import type { ProjectConfig } from '../../shared/types/ipc';

export const projectRouter = Router();

// Read project config (project.yaml)
projectRouter.get('/config', async (req, res) => {
  try {
    const projectPath = req.query.path as string;
    if (!projectPath) {
      res.status(400).json({ error: 'Missing path query parameter' });
      return;
    }

    const configPath = path.join(projectPath, 'project.yaml');
    if (!fs.existsSync(configPath)) {
      res.json({ config: null });
      return;
    }

    const content = fs.readFileSync(configPath, 'utf-8');
    const config = yaml.load(content) as ProjectConfig;
    res.json({ config });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// Write project config (project.yaml)
projectRouter.put('/config', async (req, res) => {
  try {
    const projectPath = req.body.path as string;
    const config = req.body.config as ProjectConfig;

    if (!projectPath || !config) {
      res.status(400).json({ error: 'Missing path or config in request body' });
      return;
    }

    const configPath = path.join(projectPath, 'project.yaml');

    // Create backup if file exists
    if (fs.existsSync(configPath)) {
      const backupPath = `${configPath}.backup.${Date.now()}`;
      fs.copyFileSync(configPath, backupPath);
    }

    // Write new config
    const yamlContent = yaml.dump(config, {
      indent: 2,
      lineWidth: 120,
      noRefs: true,
    });
    fs.writeFileSync(configPath, yamlContent, 'utf-8');

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// Check project setup status
projectRouter.get('/setup-status', async (req, res) => {
  try {
    const projectPath = req.query.path as string;
    if (!projectPath) {
      res.status(400).json({ error: 'Missing path query parameter' });
      return;
    }

    const result = await setupStatusService.checkSetupStatus(projectPath);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});
