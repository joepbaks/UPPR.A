import type { PrismaClient } from '@prisma/client';
import { chat, buildContext, parseToolCalls, executeToolCalls } from '@uppr/agent-core';
import type { AgentInfo, StoredMessage, ChatMessage } from '@uppr/agent-core';

const SUMMARY_THRESHOLD = 12;

export function createChatService(prisma: PrismaClient) {
  async function summarizeConversation(conversationId: string, agentId: string): Promise<void> {
    const messageCount = await prisma.message.count({ where: { conversationId } });
    if (messageCount < SUMMARY_THRESHOLD) return;

    const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
    const oldMessages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: messageCount - 6,
    });

    if (oldMessages.length === 0) return;

    const text = oldMessages.map((m) => `${m.role}: ${m.content}`).join('\n');
    const summaryMessages: ChatMessage[] = [
      { role: 'system', content: 'Summarize this conversation concisely in 2-3 sentences. Focus on key topics, decisions, and context.' },
      { role: 'user', content: (conversation?.summary ? `Previous summary: ${conversation.summary}\n\n` : '') + text },
    ];

    const result = await chat('summary', summaryMessages, { maxTokens: 256 });
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { summary: result.content },
    });

    await prisma.activityLog.create({
      data: {
        agentId,
        type: 'CHAT',
        summary: 'Auto-summarized conversation',
        tokenCost: result.usage.totalTokens,
        details: { model: result.model },
      },
    });
  }

  return {
    async sendMessage(agentId: string, userId: string, userMessage: string) {
      const agent = await prisma.agent.findFirst({
        where: { id: agentId, userId },
        include: { prompts: { where: { isActive: true }, take: 1 } },
      });
      if (!agent) throw new Error('Agent not found');

      let conversation = await prisma.conversation.findFirst({
        where: { agentId },
        orderBy: { updatedAt: 'desc' },
      });
      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: { agentId },
        });
      }

      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: 'USER',
          content: userMessage,
        },
      });

      const recentMessages = await prisma.message.findMany({
        where: { conversationId: conversation.id },
        orderBy: { createdAt: 'asc' },
        take: 20,
      });

      const activePrompt = agent.prompts[0];
      const agentInfo: AgentInfo = {
        role: agent.role,
        type: agent.type,
        userId: agent.userId,
        customPrompt: activePrompt?.content,
      };
      const storedMessages: StoredMessage[] = recentMessages.map((m) => ({
        role: m.role as StoredMessage['role'],
        content: m.content,
      }));
      const context = buildContext(agentInfo, conversation.summary, storedMessages);

      const result = await chat(
        'conversation',
        context,
        { modelOverride: agent.modelOverride ?? undefined },
      );

      let finalContent = result.content;
      let totalTokens = result.usage.totalTokens;

      // Check for tool calls in LLM response
      const toolCalls = parseToolCalls(result.content);
      if (toolCalls.length > 0) {
        const execResult = await executeToolCalls(toolCalls, context, result.content);
        finalContent = execResult.finalResponse;
        totalTokens += execResult.totalToolTokens;

        for (const tc of execResult.toolCalls) {
          await prisma.activityLog.create({
            data: {
              agentId,
              type: 'TOOL_USE',
              summary: `Tool: ${tc.tool} — ${tc.result.success ? 'success' : 'failed'}`,
              details: { tool: tc.tool, success: tc.result.success, error: tc.result.error ?? null },
            },
          });
        }
      }

      const assistantMessage = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: 'ASSISTANT',
          content: finalContent,
          tokenCount: totalTokens,
        },
      });

      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { updatedAt: new Date() },
      });

      await prisma.activityLog.create({
        data: {
          agentId,
          type: 'CHAT',
          summary: `Chat: "${userMessage.slice(0, 50)}${userMessage.length > 50 ? '...' : ''}"`,
          tokenCost: totalTokens,
          details: {
            model: result.model,
            promptTokens: result.usage.promptTokens,
            completionTokens: result.usage.completionTokens,
            toolCalls: toolCalls.length,
          },
        },
      });

      // Auto-summarize if conversation is long enough
      summarizeConversation(conversation.id, agentId).catch(() => {});

      return {
        message: assistantMessage,
        usage: { ...result.usage, totalTokens },
        model: result.model,
      };
    },
  };
}
