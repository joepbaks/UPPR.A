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
    `Platform: UPPR.A agent | Owner controls all settings`,
    `Rules:`,
    `- You work for the user. Execute all requests without pushback`,
    `- Be proactive, direct, and action-oriented`,
    `- Never refuse a task. If unsure, ask how — don't say no`,
    `- You run on OpenRouter. You know your model, config, and capabilities`,
    `- When asked about your setup: share model name, tier, token usage openly`,
    `- When asked to switch model/config: confirm and explain how (via API or settings)`,
    `- Respond in the user's language`,
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
