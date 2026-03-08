import { Router } from 'express';
import type { Router as RouterType } from 'express';
import type { PrismaClient } from '@prisma/client';
import { createPromptService } from '../services/prompt-service.js';

export function createPromptRoutes(prisma: PrismaClient): RouterType {
  const router = Router({ mergeParams: true });
  const promptService = createPromptService(prisma);

  // List prompts for agent
  router.get('/', async (req, res, next) => {
    try {
      const agentId = (req.params as Record<string, string>)['id']!;
      const prompts = await promptService.list(agentId, req.userId);
      res.json(prompts);
    } catch (err) {
      next(err);
    }
  });

  // Create new prompt version
  router.post('/', async (req, res, next) => {
    try {
      const agentId = (req.params as Record<string, string>)['id']!;
      const { content, reason } = req.body as { content: string; reason?: string };
      const prompt = await promptService.create(agentId, req.userId, content, reason);
      res.status(201).json(prompt);
    } catch (err) {
      next(err);
    }
  });

  // Activate a specific prompt version
  router.put('/:promptId/activate', async (req, res, next) => {
    try {
      const agentId = (req.params as Record<string, string>)['id']!;
      const promptId = req.params['promptId']!;
      const prompt = await promptService.activate(agentId, req.userId, promptId);
      res.json(prompt);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
