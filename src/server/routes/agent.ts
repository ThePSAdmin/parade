// Agent REST routes for skill listing and session management

import { Router } from 'express';
import { claudeAgentService } from '../services/claudeAgent';
import type {
  ListSkillsResponse,
  ListSessionsResponse,
  RunSkillResponse,
  RunSkillParams,
} from '../../shared/types/agent';

export const agentRouter = Router();

// List available skills
agentRouter.get('/skills', async (_req, res) => {
  try {
    const skills = await claudeAgentService.listSkills();
    const response: ListSkillsResponse = { skills };
    res.json(response);
  } catch (err) {
    res.status(500).json({
      skills: [],
      error: err instanceof Error ? err.message : 'Unknown error',
    } as ListSkillsResponse);
  }
});

// List sessions
agentRouter.get('/sessions', async (_req, res) => {
  try {
    const sessions = claudeAgentService.listSessions();
    const response: ListSessionsResponse = { sessions };
    res.json(response);
  } catch (err) {
    res.status(500).json({
      sessions: [],
      error: err instanceof Error ? err.message : 'Unknown error',
    } as ListSessionsResponse);
  }
});

// Get session by ID
agentRouter.get('/sessions/:id', async (req, res) => {
  try {
    const session = claudeAgentService.getSession(req.params.id);
    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }
    res.json({ session });
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Unknown error',
    });
  }
});

// Get messages for a session
agentRouter.get('/sessions/:id/messages', async (req, res) => {
  try {
    const messages = claudeAgentService.getMessages(req.params.id);
    res.json({ messages });
  } catch (err) {
    res.status(500).json({
      messages: [],
      error: err instanceof Error ? err.message : 'Unknown error',
    });
  }
});

// Run a skill (POST for starting a new session)
agentRouter.post('/run', async (req, res) => {
  try {
    const { skill, prompt, args } = req.body as RunSkillParams;
    if (!skill) {
      res.status(400).json({ error: 'Skill name is required' } as RunSkillResponse);
      return;
    }
    const sessionId = await claudeAgentService.run(skill, prompt, args);
    const response: RunSkillResponse = { sessionId };
    res.json(response);
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Unknown error',
    } as RunSkillResponse);
  }
});

// Continue a session with a new message
agentRouter.post('/sessions/:id/continue', async (req, res) => {
  try {
    const { message } = req.body as { message: string };
    if (!message) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }
    await claudeAgentService.continue(req.params.id, message);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Unknown error',
    });
  }
});

// Respond to a permission request
agentRouter.post('/sessions/:id/permission', async (req, res) => {
  try {
    const { requestId, decision, rememberForSession } = req.body as {
      requestId: string;
      decision: 'approve' | 'deny';
      rememberForSession?: boolean;
    };
    if (!requestId || !decision) {
      res.status(400).json({ error: 'requestId and decision are required' });
      return;
    }
    await claudeAgentService.respondToPermission(
      req.params.id,
      requestId,
      decision,
      rememberForSession
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Unknown error',
    });
  }
});

// Cancel a session
agentRouter.post('/sessions/:id/cancel', async (req, res) => {
  try {
    await claudeAgentService.cancel(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Unknown error',
    });
  }
});
