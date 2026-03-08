import type { PrismaClient } from '@prisma/client';

export function createScheduledTaskService(prisma: PrismaClient) {
  return {
    async list(agentId: string, userId: string) {
      return prisma.scheduledTask.findMany({
        where: { agentId, agent: { userId } },
        orderBy: { createdAt: 'desc' },
      });
    },

    async create(agentId: string, userId: string, data: {
      name: string;
      description?: string;
      cronPattern: string;
      taskDefinition: string;
    }) {
      const agent = await prisma.agent.findFirst({ where: { id: agentId, userId } });
      if (!agent) throw new Error('Agent not found');

      return prisma.scheduledTask.create({
        data: {
          agentId,
          name: data.name,
          description: data.description,
          cronPattern: data.cronPattern,
          taskDefinition: data.taskDefinition,
          enabled: true,
        },
      });
    },

    async update(taskId: string, userId: string, data: {
      name?: string;
      description?: string;
      cronPattern?: string;
      taskDefinition?: string;
      enabled?: boolean;
    }) {
      const task = await prisma.scheduledTask.findFirst({
        where: { id: taskId, agent: { userId } },
      });
      if (!task) throw new Error('Task not found');

      return prisma.scheduledTask.update({
        where: { id: taskId },
        data,
      });
    },

    async delete(taskId: string, userId: string) {
      const task = await prisma.scheduledTask.findFirst({
        where: { id: taskId, agent: { userId } },
      });
      if (!task) return null;
      await prisma.scheduledTask.delete({ where: { id: taskId } });
      return task;
    },
  };
}
