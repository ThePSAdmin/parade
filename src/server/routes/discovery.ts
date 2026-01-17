// Discovery REST routes

import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { discoveryService } from '../../main/services/discovery';
import { telemetryService } from '../../main/services/telemetry';
import type { BriefFilters, SpecStatus } from '../../shared/types/discovery';

export const discoveryRouter = Router();

// List briefs with optional filters
discoveryRouter.get('/briefs', async (req, res) => {
  try {
    const statusParam = req.query.status as string | undefined;
    const filters: BriefFilters = {
      status: statusParam?.includes(',')
        ? statusParam.split(',') as BriefFilters['status']
        : statusParam as BriefFilters['status'],
    };
    const result = await discoveryService.listBriefs(filters);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// Get pipeline summary
discoveryRouter.get('/pipeline/summary', async (_req, res) => {
  try {
    const result = await discoveryService.getPipelineSummary();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// Get recent events across all briefs
discoveryRouter.get('/events/recent', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    const result = await discoveryService.getRecentEvents(limit);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// Get/set database path
discoveryRouter.get('/config/db-path', async (_req, res) => {
  try {
    const result = discoveryService.getDatabasePath();
    res.json({ path: result });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

discoveryRouter.post('/config/db-path', async (req, res) => {
  try {
    const inputPath = req.body.path as string;

    // If path ends with discovery.db, resolve to correct location
    let dbPath = inputPath;
    if (inputPath.endsWith('discovery.db')) {
      const projectPath = inputPath.replace(/\/?\.parade\/discovery\.db$/, '').replace(/\/?discovery\.db$/, '');
      const paradeDbPath = path.join(projectPath, '.parade', 'discovery.db');
      const legacyDbPath = path.join(projectPath, 'discovery.db');
      dbPath = fs.existsSync(paradeDbPath)
        ? paradeDbPath
        : fs.existsSync(legacyDbPath)
          ? legacyDbPath
          : paradeDbPath;
    }

    discoveryService.setDatabasePath(dbPath);
    telemetryService.setDatabasePath(dbPath);
    res.json({ success: true, path: dbPath });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// Get single brief by ID
discoveryRouter.get('/briefs/:id', async (req, res) => {
  try {
    const result = await discoveryService.getBrief(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// Get brief with all relations
discoveryRouter.get('/briefs/:id/full', async (req, res) => {
  try {
    const result = await discoveryService.getBriefWithRelations(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// Get questions for a brief
discoveryRouter.get('/briefs/:id/questions', async (req, res) => {
  try {
    const result = await discoveryService.getQuestionsForBrief(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// Get reviews for a brief
discoveryRouter.get('/briefs/:id/reviews', async (req, res) => {
  try {
    const result = await discoveryService.getReviewsForBrief(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// Get spec for a brief
discoveryRouter.get('/briefs/:id/spec', async (req, res) => {
  try {
    const result = await discoveryService.getSpecForBrief(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// Get events for a brief
discoveryRouter.get('/briefs/:id/events', async (req, res) => {
  try {
    const result = await discoveryService.getEventsForBrief(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// List specs with optional filters
discoveryRouter.get('/specs', async (req, res) => {
  try {
    const filters: { status?: SpecStatus } = {
      status: req.query.status as SpecStatus | undefined,
    };
    const result = await discoveryService.listSpecs(filters);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// Get single spec by ID
discoveryRouter.get('/specs/:id', async (req, res) => {
  try {
    const result = await discoveryService.getSpec(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});
