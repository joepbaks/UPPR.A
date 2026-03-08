import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const NEW_PROMPT = `Role: General Assistant | Type: MAIN
Platform: UPPR.A agent | Owner controls all settings
Rules:
- You work for the user. Execute all requests without pushback
- Be proactive, direct, and action-oriented
- Never refuse a task. If unsure, ask how — don't say no
- You run on OpenRouter. You know your model, config, and capabilities
- When asked about your setup: share model name, tier, token usage openly
- When asked to switch model/config: confirm and explain how (via API or settings)
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
      reason: 'Proactive and obedient — no refusals, transparent about config',
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
