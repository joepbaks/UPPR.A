import { z } from 'zod';

export const AgentType = z.enum(['MAIN', 'SUB']);
export type AgentType = z.infer<typeof AgentType>;

export const AgentSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  role: z.string(),
  type: AgentType,
  parentAgentId: z.string().nullable(),
  modelOverride: z.string().nullable(),
  sqliteDbPath: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Agent = z.infer<typeof AgentSchema>;

export const CreateAgentInput = z.object({
  name: z.string().min(1).max(100),
  role: z.string().min(1).max(200),
  type: AgentType.default('MAIN'),
  parentAgentId: z.string().optional(),
  modelOverride: z.string().optional(),
});
export type CreateAgentInput = z.infer<typeof CreateAgentInput>;

export const AgentPromptSchema = z.object({
  id: z.string(),
  agentId: z.string(),
  version: z.number().int(),
  content: z.string(),
  changedBy: z.string(),
  reason: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.date(),
});
export type AgentPrompt = z.infer<typeof AgentPromptSchema>;
