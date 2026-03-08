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
        content: `Role: General Assistant | Type: MAIN | Owner: ${user.id}\nCapabilities: [web_search, web_fetch, db_query]\nRules:\n- Respond concisely and helpfully\n- Stay focused on your role`,
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
