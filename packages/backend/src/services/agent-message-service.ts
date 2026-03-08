import type { PrismaClient } from '@prisma/client';
import { chat, buildContext } from '@uppr/agent-core';
import type { AgentInfo, StoredMessage } from '@uppr/agent-core';

export function createAgentMessageService(prisma: PrismaClient) {
  return {
    async sendMessage(fromAgentId: string, toAgentId: string, task: string, userId: string) {
      const fromAgent = await prisma.agent.findFirst({ where: { id: fromAgentId, userId } });
      if (!fromAgent) throw new Error('Source agent not found');

      const toAgent = await prisma.agent.findFirst({
        where: { id: toAgentId, userId },
        include: { prompts: { where: { isActive: true }, take: 1 } },
      });
      if (!toAgent) throw new Error('Target agent not found');

      const agentMessage = await prisma.agentMessage.create({
        data: {
          fromAgentId,
          toAgentId,
          task,
          status: 'PROCESSING',
        },
      });

      try {
        const agentInfo: AgentInfo = {
          role: toAgent.role,
          type: toAgent.type,
          userId: toAgent.userId,
          customPrompt: toAgent.prompts[0]?.content,
        };
        const context = buildContext(agentInfo, null, []);
        context.push({ role: 'user', content: `Task from agent "${fromAgent.name}": ${task}` });

        const result = await chat(
          'conversation',
          context,
          { modelOverride: toAgent.modelOverride ?? undefined },
        );

        const updated = await prisma.agentMessage.update({
          where: { id: agentMessage.id },
          data: {
            response: result.content,
            status: 'COMPLETED',
            tokenCost: result.usage.totalTokens,
            completedAt: new Date(),
          },
        });

        await prisma.activityLog.create({
          data: {
            agentId: toAgentId,
            type: 'AGENT_TO_AGENT',
            summary: `Received task from ${fromAgent.name}: "${task.slice(0, 50)}"`,
            tokenCost: result.usage.totalTokens,
            details: { fromAgentId, model: result.model },
          },
        });

        return updated;
      } catch (err) {
        await prisma.agentMessage.update({
          where: { id: agentMessage.id },
          data: { status: 'FAILED' },
        });
        throw err;
      }
    },

    async listSent(agentId: string, userId: string) {
      return prisma.agentMessage.findMany({
        where: { fromAgentId: agentId, fromAgent: { userId } },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    },

    async listReceived(agentId: string, userId: string) {
      return prisma.agentMessage.findMany({
        where: { toAgentId: agentId, toAgent: { userId } },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    },
  };
}
