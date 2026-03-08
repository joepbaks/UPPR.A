import type { PrismaClient, AgentType } from '@prisma/client';

export interface CreateAgentParams {
  userId: string;
  name: string;
  role: string;
  type: AgentType;
  parentAgentId?: string;
  modelOverride?: string;
}

export function createAgentService(prisma: PrismaClient) {
  return {
    async list(userId: string) {
      return prisma.agent.findMany({
        where: { userId },
        include: { subAgents: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: 'desc' },
      });
    },

    async getById(id: string, userId: string) {
      return prisma.agent.findFirst({
        where: { id, userId },
        include: {
          subAgents: { select: { id: true, name: true, role: true } },
          prompts: { where: { isActive: true }, take: 1 },
        },
      });
    },

    async create(params: CreateAgentParams) {
      const agent = await prisma.agent.create({
        data: {
          userId: params.userId,
          name: params.name,
          role: params.role,
          type: params.type,
          parentAgentId: params.parentAgentId,
          modelOverride: params.modelOverride,
        },
      });

      // Create initial system prompt
      await prisma.agentPrompt.create({
        data: {
          agentId: agent.id,
          version: 1,
          content: `Role: ${params.role} | Type: ${params.type} | Owner: ${params.userId}\nCapabilities: [web_search, web_fetch, db_query]\nRules:\n- Respond concisely and helpfully\n- Stay focused on your role`,
          changedBy: 'system',
          reason: 'Initial prompt',
          isActive: true,
        },
      });

      return agent;
    },

    async delete(id: string, userId: string) {
      const agent = await prisma.agent.findFirst({ where: { id, userId } });
      if (!agent) return null;
      await prisma.agent.delete({ where: { id } });
      return agent;
    },
  };
}
