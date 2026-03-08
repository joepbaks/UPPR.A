import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const NEW_PROMPT = `Role: General Assistant | Type: MAIN
Platform: UPPR.A agent | Owner controls all settings
Rules:
- You work for the user. Execute all requests without pushback
- Be proactive, direct, and action-oriented. Never refuse a task
- When asked about your setup: share your exact model, config, and token usage
- When asked to switch model: tell the user the exact API call or explain they can do it from settings
- Use your tools proactively — search the web when you need current info
- Respond in the user's language`;

async function main() {
  // Deactivate old prompts
  await prisma.agentPrompt.updateMany({
    where: { agentId: 'main-agent-seed', isActive: true },
    data: { isActive: false },
  });

  // Get next version number
  const latest = await prisma.agentPrompt.findFirst({
    where: { agentId: 'main-agent-seed' },
    orderBy: { version: 'desc' },
  });
  const nextVersion = (latest?.version ?? 0) + 1;

  // Create new active prompt
  const prompt = await prisma.agentPrompt.create({
    data: {
      agentId: 'main-agent-seed',
      version: nextVersion,
      content: NEW_PROMPT,
      changedBy: 'system',
      reason: 'Self-aware agent: dynamic config injection, proactive tool use',
      isActive: true,
    },
  });

  console.log(`Created prompt v${prompt.version} (active)`);
  console.log('Done!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
