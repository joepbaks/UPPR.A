import { buildToolInstructions } from './tool-executor.js';

export interface AgentInfo {
  role: string;
  type: 'MAIN' | 'SUB';
  userId: string;
  learnedFacts?: string[];
  customPrompt?: string;
}

export function buildSystemPrompt(agent: AgentInfo): string {
  if (agent.customPrompt) {
    return agent.customPrompt + buildToolInstructions();
  }

  const lines = [
    `Role: ${agent.role} | Type: ${agent.type}`,
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

  const toolInstructions = buildToolInstructions();
  if (toolInstructions) {
    lines.push(toolInstructions);
  }

  return lines.join('\n');
}
