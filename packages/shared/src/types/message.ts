import { z } from 'zod';

export const MessageRole = z.enum(['USER', 'ASSISTANT', 'SYSTEM']);
export type MessageRole = z.infer<typeof MessageRole>;

export const MessageStatus = z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']);
export type MessageStatus = z.infer<typeof MessageStatus>;

export const MessageSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  role: MessageRole,
  content: z.string(),
  tokenCount: z.number().int().nullable(),
  createdAt: z.date(),
});
export type Message = z.infer<typeof MessageSchema>;

export const ConversationSchema = z.object({
  id: z.string(),
  agentId: z.string(),
  summary: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Conversation = z.infer<typeof ConversationSchema>;

export const AgentMessageSchema = z.object({
  id: z.string(),
  fromAgentId: z.string(),
  toAgentId: z.string(),
  task: z.string(),
  responseFormat: z.string().nullable(),
  response: z.string().nullable(),
  status: MessageStatus,
  tokenCost: z.number().int().nullable(),
  createdAt: z.date(),
  completedAt: z.date().nullable(),
});
export type AgentMessage = z.infer<typeof AgentMessageSchema>;

export const ChatInput = z.object({
  message: z.string().min(1).max(10000),
});
export type ChatInput = z.infer<typeof ChatInput>;
