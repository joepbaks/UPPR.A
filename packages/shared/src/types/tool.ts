import { z } from 'zod';

export const UserToolSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  description: z.string(),
  fullSchema: z.record(z.unknown()),
  requestConfig: z.record(z.unknown()),
  credentialRef: z.string().nullable(),
  createdBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type UserTool = z.infer<typeof UserToolSchema>;

export const CredentialSchema = z.object({
  id: z.string(),
  userId: z.string(),
  serviceName: z.string(),
  encryptedValue: z.string(),
  iv: z.string(),
  authTag: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Credential = z.infer<typeof CredentialSchema>;
