import { z } from 'zod';

export const ScheduledTaskSchema = z.object({
  id: z.string(),
  agentId: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  cronPattern: z.string(),
  taskDefinition: z.string(),
  enabled: z.boolean(),
  lastRun: z.date().nullable(),
  nextRun: z.date().nullable(),
  createdAt: z.date(),
});
export type ScheduledTask = z.infer<typeof ScheduledTaskSchema>;

export const ActivityType = z.enum([
  'CHAT',
  'TOOL_USE',
  'AGENT_TO_AGENT',
  'TASK_EXECUTED',
  'PROMPT_UPDATED',
  'TOOL_CREATED',
  'DB_OPERATION',
  'WEB_SEARCH',
  'ERROR',
]);
export type ActivityType = z.infer<typeof ActivityType>;

export const ActivityLogSchema = z.object({
  id: z.string(),
  agentId: z.string(),
  type: ActivityType,
  summary: z.string(),
  details: z.record(z.unknown()).nullable(),
  tokenCost: z.number().int().nullable(),
  error: z.string().nullable(),
  createdAt: z.date(),
});
export type ActivityLog = z.infer<typeof ActivityLogSchema>;
