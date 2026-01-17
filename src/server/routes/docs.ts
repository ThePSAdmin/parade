// Docs REST routes

import { Router } from 'express';
import { docsService } from '../../main/services/docs';

export const docsRouter = Router();

// List files from docs/, .claude/, .design/ directories
docsRouter.get('/', async (_req, res) => {
  try {
    const result = await docsService.listFiles();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// Read file contents
docsRouter.get('/file', async (req, res) => {
  try {
    const filePath = req.query.path as string;
    if (!filePath) {
      res.status(400).json({ error: 'Missing path query parameter' });
      return;
    }
    const result = await docsService.readFile(filePath);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});
