import type { PrismaClient } from '@prisma/client';
import { chat, buildContext } from '@uppr/agent-core';
import type { AgentInfo, StoredMessage } from '@uppr/agent-core';

export function createChatService(prisma: PrismaClient) {
  return {
    async sendMessage(agentId: string, userId: string, userMessage: string) {
      // Get agent
      const agent = await prisma.agent.findFirst({
        where: { id: agentId, userId },
        include: { prompts: { where: { isActive: true }, take: 1 } },
      });
      if (!agent) throw new Error('Agent not found');

      // Get or create conversation
      let conversation = await prisma.conversation.findFirst({
        where: { agentId },
        orderBy: { updatedAt: 'desc' },
      });
      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: { agentId },
        });
      }

      // Save user message
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: 'USER',
          content: userMessage,
        },
      });

      // Load recent messages
      const recentMessages = await prisma.message.findMany({
        where: { conversationId: conversation.id },
        orderBy: { createdAt: 'asc' },
        take: 20,
      });

      // Build context
      const agentInfo: AgentInfo = {
        role: agent.role,
        type: agent.type,
        userId: agent.userId,
      };
      const storedMessages: StoredMessage[] = recentMessages.map((m) => ({
        role: m.role as StoredMessage['role'],
        content: m.content,
      }));
      const context = buildContext(agentInfo, conversation.summary, storedMessages);

      // Call LLM
      const result = await chat(
        'conversation',
        context,
        { modelOverride: agent.modelOverride ?? undefined },
      );

      // Save assistant message
      const assistantMessage = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: 'ASSISTANT',
          content: result.content,
          tokenCount: result.usage.totalTokens,
        },
      });

      // Update conversation timestamp
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { updatedAt: new Date() },
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          agentId,
          type: 'CHAT',
          summary: `Chat: "${userMessage.slice(0, 50)}${userMessage.length > 50 ? '...' : ''}"`,
          tokenCost: result.usage.totalTokens,
          details: {
            model: result.model,
            promptTokens: result.usage.promptTokens,
            completionTokens: result.usage.completionTokens,
          },
        },
      });

      return {
        message: assistantMessage,
        usage: result.usage,
        model: result.model,
      };
    },
  };
}
