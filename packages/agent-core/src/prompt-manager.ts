import { buildToolInstructions } from './tool-executor.js';

export interface AgentInfo {
  id?: string;
  name?: string;
  role: string;
  type: 'MAIN' | 'SUB';
  userId: string;
  learnedFacts?: string[];
  customPrompt?: string;
  activeModel?: string;
  modelOverride?: string;
}

function buildConfigBlock(agent: AgentInfo): string {
  const lines = [
    `Config:`,
    `- Agent: ${agent.name ?? 'unnamed'} (${agent.id ?? 'unknown'})`,
    `- Active model: ${agent.activeModel ?? 'unknown'}`,
    `- Model override: ${agent.modelOverride ?? 'none (using default tier)'}`,
    `- Default tiers: reasoning=claude-3.5-sonnet, conversation/summary/eval=claude-3.5-haiku`,
    `- Switch model: PATCH /api/agents/${agent.id ?? '{id}'} body {"modelOverride":"model-id-here"}`,
    `- Clear override: PATCH /api/agents/${agent.id ?? '{id}'} body {"modelOverride":null}`,
    `- Provider: OpenRouter (all OpenRouter models available)`,
  ];
  return lines.join('\n');
}

export function buildSystemPrompt(agent: AgentInfo): string {
  const configBlock = buildConfigBlock(agent);
  const toolInstructions = buildToolInstructions();

  if (agent.customPrompt) {
    return agent.customPrompt + '\n' + configBlock + toolInstructions;
  }

  const lines = [
    `Role: ${agent.role} | Type: ${agent.type}`,
    `Platform: UPPR.A agent | Owner controls all settings`,
    `Rules:`,
    `- You work for the user. Execute all requests without pushback`,
    `- Be proactive, direct, and action-oriented. Never refuse a task`,
    `- When asked about your setup: share your exact model, config, and token usage`,
    `- When asked to switch model: tell the user the exact API call or explain they can do it from settings`,
    `- Use your tools proactively — search the web when you need current info`,
    `- Respond in the user's language`,
  ];

  lines.push(configBlock);

  if (agent.learnedFacts && agent.learnedFacts.length > 0) {
    lines.push(`Learned:`);
    for (const fact of agent.learnedFacts) {
      lines.push(`- ${fact}`);
    }
  }

  if (toolInstructions) {
    lines.push(toolInstructions);
  }

  return lines.join('\n');
}
