import type { ChatMessage } from './llm-client.js';
import { buildSystemPrompt } from './prompt-manager.js';
import type { AgentInfo } from './prompt-manager.js';

export interface StoredMessage {
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
}

const MAX_RECENT_MESSAGES = 6;

const ROLE_MAP: Record<StoredMessage['role'], ChatMessage['role']> = {
  USER: 'user',
  ASSISTANT: 'assistant',
  SYSTEM: 'system',
};

/**
 * Build the context (messages array) for an LLM call.
 * Phase 1: system prompt + last N messages. No rolling summary yet.
 */
export function buildContext(
  agent: AgentInfo,
  conversationSummary: string | null,
  recentMessages: StoredMessage[],
): ChatMessage[] {
  const systemPrompt = buildSystemPrompt(agent);
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
  ];

  if (conversationSummary) {
    messages.push({
      role: 'system',
      content: `Conversation summary so far: ${conversationSummary}`,
    });
  }

  const recent = recentMessages.slice(-MAX_RECENT_MESSAGES);
  for (const msg of recent) {
    messages.push({
      role: ROLE_MAP[msg.role],
      content: msg.content,
    });
  }

  return messages;
}
