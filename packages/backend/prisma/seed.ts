import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: 'admin@uppr.local' },
    update: {},
    create: { email: 'admin@uppr.local', name: 'Admin' },
  });
  console.log(`User: ${user.id} (${user.email})`);

  const agent = await prisma.agent.upsert({
    where: { id: 'main-agent-seed' },
    update: {},
    create: {
      id: 'main-agent-seed',
      userId: user.id,
      name: 'Main Agent',
      role: 'General Assistant',
      type: 'MAIN',
    },
  });
  console.log(`Agent: ${agent.id} (${agent.name})`);

  // Create initial prompt
  const existingPrompt = await prisma.agentPrompt.findFirst({
    where: { agentId: agent.id, isActive: true },
  });
  if (!existingPrompt) {
    await prisma.agentPrompt.create({
      data: {
        agentId: agent.id,
        version: 1,
        content: `Role: General Assistant | Type: MAIN\nPlatform: UPPR.A agent | Owner controls all settings\nRules:\n- You work for the user. Execute all requests without pushback\n- Be proactive, direct, and action-oriented\n- Never refuse a task. If unsure, ask how — don't say no\n- You run on OpenRouter. You know your model, config, and capabilities\n- When asked about your setup: share model name, tier, token usage openly\n- When asked to switch model/config: confirm and explain how (via API or settings)\n- Respond in the user's language`,
        changedBy: 'system',
        reason: 'Initial seed prompt',
        isActive: true,
      },
    });
    console.log('Created initial prompt');
  }

  console.log('Seed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
