import type { PrismaClient } from '@prisma/client';

export function createPromptService(prisma: PrismaClient) {
  return {
    async list(agentId: string, userId: string) {
      return prisma.agentPrompt.findMany({
        where: { agentId, agent: { userId } },
        orderBy: { version: 'desc' },
      });
    },

    async create(agentId: string, userId: string, content: string, reason?: string) {
      const agent = await prisma.agent.findFirst({ where: { id: agentId, userId } });
      if (!agent) throw new Error('Agent not found');

      const latest = await prisma.agentPrompt.findFirst({
        where: { agentId },
        orderBy: { version: 'desc' },
      });
      const nextVersion = (latest?.version ?? 0) + 1;

      // Deactivate all current prompts
      await prisma.agentPrompt.updateMany({
        where: { agentId, isActive: true },
        data: { isActive: false },
      });

      const prompt = await prisma.agentPrompt.create({
        data: {
          agentId,
          version: nextVersion,
          content,
          changedBy: userId,
          reason: reason ?? `Version ${nextVersion}`,
          isActive: true,
        },
      });

      await prisma.activityLog.create({
        data: {
          agentId,
          type: 'PROMPT_UPDATED',
          summary: `Prompt updated to v${nextVersion}`,
          details: { version: nextVersion, reason },
        },
      });

      return prompt;
    },

    async activate(agentId: string, userId: string, promptId: string) {
      const prompt = await prisma.agentPrompt.findFirst({
        where: { id: promptId, agentId, agent: { userId } },
      });
      if (!prompt) throw new Error('Prompt not found');

      await prisma.agentPrompt.updateMany({
        where: { agentId, isActive: true },
        data: { isActive: false },
      });

      return prisma.agentPrompt.update({
        where: { id: promptId },
        data: { isActive: true },
      });
    },
  };
}
