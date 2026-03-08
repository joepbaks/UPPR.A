import { Router } from 'express';
import type { Router as RouterType } from 'express';
import type { PrismaClient, Prisma } from '@prisma/client';
import { createToolService } from '../services/tool-service.js';

export function createToolRoutes(prisma: PrismaClient): RouterType {
  const router = Router();
  const toolService = createToolService(prisma);

  // List user tools
  router.get('/', async (req, res, next) => {
    try {
      const tools = await toolService.listTools(req.userId);
      res.json(tools);
    } catch (err) {
      next(err);
    }
  });

  // Create tool
  router.post('/', async (req, res, next) => {
    try {
      const { name, description, fullSchema, requestConfig, credentialRef } = req.body as {
        name: string; description: string; fullSchema: Prisma.InputJsonValue;
        requestConfig: Prisma.InputJsonValue; credentialRef?: string;
      };
      const tool = await toolService.createTool(req.userId, { name, description, fullSchema, requestConfig, credentialRef });
      res.status(201).json(tool);
    } catch (err) {
      next(err);
    }
  });

  // Delete tool
  router.delete('/:id', async (req, res, next) => {
    try {
      const tool = await toolService.deleteTool(req.params['id']!, req.userId);
      if (!tool) return res.status(404).json({ error: 'Tool not found' });
      res.json({ deleted: true });
    } catch (err) {
      next(err);
    }
  });

  // List credentials (no values exposed)
  router.get('/credentials', async (req, res, next) => {
    try {
      const creds = await toolService.listCredentials(req.userId);
      res.json(creds);
    } catch (err) {
      next(err);
    }
  });

  // Create/update credential
  router.post('/credentials', async (req, res, next) => {
    try {
      const { serviceName, value } = req.body as { serviceName: string; value: string };
      const cred = await toolService.createCredential(req.userId, serviceName, value);
      res.status(201).json({ id: cred.id, serviceName: cred.serviceName });
    } catch (err) {
      next(err);
    }
  });

  // Delete credential
  router.delete('/credentials/:id', async (req, res, next) => {
    try {
      const cred = await toolService.deleteCredential(req.params['id']!, req.userId);
      if (!cred) return res.status(404).json({ error: 'Credential not found' });
      res.json({ deleted: true });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
