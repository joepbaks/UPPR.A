import { Router } from 'express';
import type { Router as RouterType } from 'express';
import type { PrismaClient } from '@prisma/client';
import { CreateAgentInput, ChatInput } from '@uppr/shared';
import { createAgentService } from '../services/agent-service.js';
import { createChatService } from '../services/chat-service.js';
import { createAgentMessageService } from '../services/agent-message-service.js';
import { createScheduledTaskService } from '../services/scheduled-task-service.js';
import { createPromptRoutes } from './prompts.js';

export function createAgentRoutes(prisma: PrismaClient): RouterType {
  const router = Router();
  const agentService = createAgentService(prisma);
  const chatService = createChatService(prisma);
  const agentMessageService = createAgentMessageService(prisma);
  const scheduledTaskService = createScheduledTaskService(prisma);

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

  // Prompt routes
  router.use('/:id/prompts', createPromptRoutes(prisma));

  // Send message to another agent
  router.post('/:id/messages', async (req, res, next) => {
    try {
      const { toAgentId, task } = req.body as { toAgentId: string; task: string };
      const result = await agentMessageService.sendMessage(
        req.params['id']!, toAgentId, task, req.userId,
      );
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  });

  // Get sent messages
  router.get('/:id/messages/sent', async (req, res, next) => {
    try {
      const messages = await agentMessageService.listSent(req.params['id']!, req.userId);
      res.json(messages);
    } catch (err) {
      next(err);
    }
  });

  // Get received messages
  router.get('/:id/messages/received', async (req, res, next) => {
    try {
      const messages = await agentMessageService.listReceived(req.params['id']!, req.userId);
      res.json(messages);
    } catch (err) {
      next(err);
    }
  });

  // Scheduled tasks CRUD
  router.get('/:id/tasks', async (req, res, next) => {
    try {
      const tasks = await scheduledTaskService.list(req.params['id']!, req.userId);
      res.json(tasks);
    } catch (err) {
      next(err);
    }
  });

  router.post('/:id/tasks', async (req, res, next) => {
    try {
      const { name, description, cronPattern, taskDefinition } = req.body as {
        name: string; description?: string; cronPattern: string; taskDefinition: string;
      };
      const task = await scheduledTaskService.create(req.params['id']!, req.userId, {
        name, description, cronPattern, taskDefinition,
      });
      res.status(201).json(task);
    } catch (err) {
      next(err);
    }
  });

  router.put('/:id/tasks/:taskId', async (req, res, next) => {
    try {
      const task = await scheduledTaskService.update(req.params['taskId']!, req.userId, req.body as Record<string, unknown>);
      res.json(task);
    } catch (err) {
      next(err);
    }
  });

  router.delete('/:id/tasks/:taskId', async (req, res, next) => {
    try {
      const task = await scheduledTaskService.delete(req.params['taskId']!, req.userId);
      if (!task) return res.status(404).json({ error: 'Task not found' });
      res.json({ deleted: true });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
