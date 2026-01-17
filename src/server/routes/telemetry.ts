// Telemetry REST routes

import { Router } from 'express';
import { telemetryService } from '../../main/services/telemetry';
import type { CreateTelemetryParams, CreateAnnotationParams, TelemetryFilters, AgentLabel } from '../../shared/types/telemetry';

export const telemetryRouter = Router();

// Record agent execution
telemetryRouter.post('/', async (req, res) => {
  try {
    const params: CreateTelemetryParams = req.body;
    const result = await telemetryService.recordTelemetry(params);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// List telemetry with filters
telemetryRouter.get('/', async (req, res) => {
  try {
    const statusParam = req.query.status as string | undefined;
    const agentTypeParam = req.query.agent_type as string | undefined;
    const filters: TelemetryFilters = {
      epic_id: req.query.epic_id as string | undefined,
      agent_type: agentTypeParam?.includes(',')
        ? agentTypeParam.split(',') as TelemetryFilters['agent_type']
        : agentTypeParam as TelemetryFilters['agent_type'],
      status: statusParam?.includes(',')
        ? statusParam.split(',') as TelemetryFilters['status']
        : statusParam as TelemetryFilters['status'],
      since: req.query.since as string | undefined,
      until: req.query.until as string | undefined,
    };
    const result = await telemetryService.listTelemetry(filters);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// Get agent performance metrics
telemetryRouter.get('/performance', async (req, res) => {
  try {
    const agentType = req.query.agentType as AgentLabel | undefined;
    const result = await telemetryService.getAgentPerformance(agentType);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// Get recent failures
telemetryRouter.get('/failures/recent', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    const result = await telemetryService.getRecentFailures(limit);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// Get bug-causing telemetry
telemetryRouter.get('/bugs', async (_req, res) => {
  try {
    const result = await telemetryService.getBugCausingTelemetry();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// Get telemetry for a task
telemetryRouter.get('/task/:taskId', async (req, res) => {
  try {
    const result = await telemetryService.getTelemetryForTask(req.params.taskId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// Get telemetry for an epic
telemetryRouter.get('/epic/:epicId', async (req, res) => {
  try {
    const result = await telemetryService.getTelemetryForEpic(req.params.epicId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// Get epic summary
telemetryRouter.get('/epic/:epicId/summary', async (req, res) => {
  try {
    const result = await telemetryService.getEpicSummary(req.params.epicId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// Get single telemetry by ID
telemetryRouter.get('/:id', async (req, res) => {
  try {
    const result = await telemetryService.getTelemetry(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// Get annotations for telemetry
telemetryRouter.get('/:id/annotations', async (req, res) => {
  try {
    const result = await telemetryService.getAnnotations(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// Add annotation to telemetry
telemetryRouter.post('/:id/annotations', async (req, res) => {
  try {
    const params: CreateAnnotationParams = {
      ...req.body,
      telemetryId: req.params.id,
    };
    const result = await telemetryService.addAnnotation(params);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});
