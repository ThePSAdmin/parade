// Beads REST routes

import { Router } from 'express';
import { beadsService } from '../../main/services/beads';
import type { ListFilters, CreateIssueParams, UpdateIssueParams, Dependency } from '../../shared/types/beads';

export const beadsRouter = Router();

// List issues with optional filters
beadsRouter.get('/', async (req, res) => {
  try {
    // Parse query params - they may be comma-separated for array values
    const statusParam = req.query.status as string | undefined;
    const typeParam = req.query.type as string | undefined;

    const filters: ListFilters = {
      status: statusParam?.includes(',')
        ? statusParam.split(',') as ListFilters['status']
        : statusParam as ListFilters['status'],
      type: typeParam?.includes(',')
        ? typeParam.split(',') as ListFilters['type']
        : typeParam as ListFilters['type'],
      parent: req.query.parent as string | undefined,
      assignee: req.query.assignee as string | undefined,
      label: req.query.label as string | undefined,
    };
    const result = await beadsService.list(filters);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// Get ready work (no blockers)
beadsRouter.get('/ready', async (_req, res) => {
  try {
    const result = await beadsService.ready();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// Export all issues with dependencies
beadsRouter.get('/export/all', async (_req, res) => {
  try {
    const result = await beadsService.getAllWithDependencies();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// List worktrees
beadsRouter.get('/worktrees/list', async (_req, res) => {
  try {
    const result = await beadsService.worktreeList();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// Get single issue by ID
beadsRouter.get('/:id', async (req, res) => {
  try {
    const result = await beadsService.get(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// Get dependency tree for an issue
beadsRouter.get('/:id/deps/tree', async (req, res) => {
  try {
    const direction = req.query.direction as 'up' | 'down' | 'both' | undefined;
    const result = await beadsService.depTree(req.params.id, direction);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// Create new issue
beadsRouter.post('/', async (req, res) => {
  try {
    const params: CreateIssueParams = req.body;
    const result = await beadsService.create(params);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// Update issue
beadsRouter.patch('/:id', async (req, res) => {
  try {
    const params: UpdateIssueParams = req.body;
    const result = await beadsService.update(req.params.id, params);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// Close issue
beadsRouter.post('/:id/close', async (req, res) => {
  try {
    const reason = req.body.reason as string | undefined;
    const result = await beadsService.close(req.params.id, reason);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// Reopen issue
beadsRouter.post('/:id/reopen', async (_req, res) => {
  try {
    const result = await beadsService.reopen(_req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// Add dependency
beadsRouter.post('/:id/deps', async (req, res) => {
  try {
    const to = req.body.to as string;
    const type = req.body.type as Dependency['type'] | undefined;
    const result = await beadsService.depAdd(req.params.id, to, type);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// Remove dependency
beadsRouter.delete('/:from/deps/:to', async (req, res) => {
  try {
    const result = await beadsService.depRemove(req.params.from, req.params.to);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});
