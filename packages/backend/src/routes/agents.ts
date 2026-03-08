import { Router } from 'express';
import type { Router as RouterType } from 'express';
import type { PrismaClient } from '@prisma/client';
import { CreateAgentInput, ChatInput } from '@uppr/shared';
import { createAgentService } from '../services/agent-service.js';
import { createChatService } from '../services/chat-service.js';

export function createAgentRoutes(prisma: PrismaClient): RouterType {
  const router = Router();
  const agentService = createAgentService(prisma);
  const chatService = createChatService(prisma);

  // List agents
  router.get('/', async (req, res, next) => {
    try {
      const agents = await agentService.list(req.userId);
      res.json(agents);
    } catch (err) {
      next(err);
    }
  });

  // Get agent by ID
  router.get('/:id', async (req, res, next) => {
    try {
      const agent = await agentService.getById(req.params['id']!, req.userId);
      if (!agent) return res.status(404).json({ error: 'Agent not found' });
      res.json(agent);
    } catch (err) {
      next(err);
    }
  });

  // Create agent
  router.post('/', async (req, res, next) => {
    try {
      const parsed = CreateAgentInput.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
      }
      const agent = await agentService.create({
        userId: req.userId,
        ...parsed.data,
      });
      res.status(201).json(agent);
    } catch (err) {
      next(err);
    }
  });

  // Delete agent
  router.delete('/:id', async (req, res, next) => {
    try {
      const agent = await agentService.delete(req.params['id']!, req.userId);
      if (!agent) return res.status(404).json({ error: 'Agent not found' });
      res.json({ deleted: true });
    } catch (err) {
      next(err);
    }
  });

  // Chat with agent
  router.post('/:id/chat', async (req, res, next) => {
    try {
      const parsed = ChatInput.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
      }
      const result = await chatService.sendMessage(
        req.params['id']!,
        req.userId,
        parsed.data.message,
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  // Get conversations for agent
  router.get('/:id/conversations', async (req, res, next) => {
    try {
      const conversations = await prisma.conversation.findMany({
        where: { agentId: req.params['id']!, agent: { userId: req.userId } },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
        orderBy: { updatedAt: 'desc' },
      });
      res.json(conversations);
    } catch (err) {
      next(err);
    }
  });

  // Get activity log for agent
  router.get('/:id/activity', async (req, res, next) => {
    try {
      const logs = await prisma.activityLog.findMany({
        where: { agentId: req.params['id']!, agent: { userId: req.userId } },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      res.json(logs);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
