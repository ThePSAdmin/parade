// Filesystem REST routes - replacement for native dialog

import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import os from 'os';

export const filesystemRouter = Router();

// Browse directories - replacement for native folder picker
filesystemRouter.get('/browse', (req, res) => {
  try {
    const dirPath = (req.query.path as string) || os.homedir();

    // Validate path exists and is a directory
    if (!fs.existsSync(dirPath)) {
      res.status(400).json({ error: 'Path does not exist' });
      return;
    }

    const stats = fs.statSync(dirPath);
    if (!stats.isDirectory()) {
      res.status(400).json({ error: 'Path is not a directory' });
      return;
    }

    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    const directories = entries
      .filter((e) => e.isDirectory())
      .map((e) => ({
        name: e.name,
        path: path.join(dirPath, e.name),
        hidden: e.name.startsWith('.'),
      }))
      .sort((a, b) => {
        // Sort: non-hidden first, then alphabetically
        if (a.hidden !== b.hidden) return a.hidden ? 1 : -1;
        return a.name.localeCompare(b.name);
      });

    res.json({
      current: dirPath,
      parent: path.dirname(dirPath),
      isRoot: dirPath === path.dirname(dirPath),
      directories,
    });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Cannot read directory' });
  }
});

// Check if a path is a valid project directory (has .beads/ or .parade/)
filesystemRouter.get('/validate-project', (req, res) => {
  try {
    const dirPath = req.query.path as string;
    if (!dirPath) {
      res.status(400).json({ error: 'Missing path query parameter' });
      return;
    }

    if (!fs.existsSync(dirPath)) {
      res.json({ valid: false, reason: 'Path does not exist' });
      return;
    }

    const hasBeads = fs.existsSync(path.join(dirPath, '.beads'));
    const hasParade = fs.existsSync(path.join(dirPath, '.parade'));
    const hasDiscoveryDb =
      fs.existsSync(path.join(dirPath, 'discovery.db')) ||
      fs.existsSync(path.join(dirPath, '.parade', 'discovery.db'));
    const hasProjectYaml = fs.existsSync(path.join(dirPath, 'project.yaml'));

    const indicators = {
      hasBeads,
      hasParade,
      hasDiscoveryDb,
      hasProjectYaml,
    };

    // Consider valid if it has at least beads or parade directory
    const valid = hasBeads || hasParade;

    res.json({
      valid,
      reason: valid ? 'Valid project directory' : 'No .beads/ or .parade/ directory found',
      indicators,
    });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// Get home directory and common paths
filesystemRouter.get('/shortcuts', (_req, res) => {
  try {
    const home = os.homedir();
    const shortcuts = [
      { name: 'Home', path: home },
      { name: 'Desktop', path: path.join(home, 'Desktop') },
      { name: 'Documents', path: path.join(home, 'Documents') },
      { name: 'Projects', path: path.join(home, 'Projects') },
      { name: 'dev', path: path.join(home, 'dev') },
      { name: 'code', path: path.join(home, 'code') },
    ].filter((s) => fs.existsSync(s.path));

    res.json({ shortcuts });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});
