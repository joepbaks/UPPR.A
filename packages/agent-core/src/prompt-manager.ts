export interface AgentInfo {
  role: string;
  type: 'MAIN' | 'SUB';
  userId: string;
  learnedFacts?: string[];
}

export function buildSystemPrompt(agent: AgentInfo): string {
  const lines = [
    `Role: ${agent.role} | Type: ${agent.type} | Owner: ${agent.userId}`,
    `Capabilities: [web_search, web_fetch, db_query]`,
    `Rules:`,
    `- Respond concisely and helpfully`,
    `- Stay focused on your role`,
    `- Ask for clarification when tasks are ambiguous`,
  ];

  if (agent.learnedFacts && agent.learnedFacts.length > 0) {
    lines.push(`Learned:`);
    for (const fact of agent.learnedFacts) {
      lines.push(`- ${fact}`);
    }
  }

  return lines.join('\n');
}
