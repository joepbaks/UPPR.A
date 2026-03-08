import type { PrismaClient, Prisma } from '@prisma/client';
import { encrypt, decrypt } from '@uppr/agent-core';

export function createToolService(prisma: PrismaClient) {
  return {
    async listTools(userId: string) {
      return prisma.userTool.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
    },

    async createTool(userId: string, data: {
      name: string;
      description: string;
      fullSchema: Prisma.InputJsonValue;
      requestConfig: Prisma.InputJsonValue;
      credentialRef?: string;
    }) {
      return prisma.userTool.create({
        data: {
          userId,
          name: data.name,
          description: data.description,
          fullSchema: data.fullSchema,
          requestConfig: data.requestConfig,
          credentialRef: data.credentialRef,
          createdBy: userId,
        },
      });
    },

    async deleteTool(id: string, userId: string) {
      const tool = await prisma.userTool.findFirst({ where: { id, userId } });
      if (!tool) return null;
      await prisma.userTool.delete({ where: { id } });
      return tool;
    },

    async listCredentials(userId: string) {
      const creds = await prisma.credential.findMany({
        where: { userId },
        select: { id: true, serviceName: true, createdAt: true, updatedAt: true },
      });
      return creds;
    },

    async createCredential(userId: string, serviceName: string, value: string) {
      const encrypted = encrypt(value);
      return prisma.credential.upsert({
        where: { userId_serviceName: { userId, serviceName } },
        update: { ...encrypted },
        create: { userId, serviceName, ...encrypted },
      });
    },

    async getDecryptedCredential(userId: string, serviceName: string): Promise<string | null> {
      const cred = await prisma.credential.findUnique({
        where: { userId_serviceName: { userId, serviceName } },
      });
      if (!cred) return null;
      return decrypt({ encryptedValue: cred.encryptedValue, iv: cred.iv, authTag: cred.authTag });
    },

    async deleteCredential(id: string, userId: string) {
      const cred = await prisma.credential.findFirst({ where: { id, userId } });
      if (!cred) return null;
      await prisma.credential.delete({ where: { id } });
      return cred;
    },
  };
}
