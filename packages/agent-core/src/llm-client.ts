import OpenAI from 'openai';

export const MODEL_TIERS = {
  reasoning:    'anthropic/claude-3.5-sonnet',
  conversation: 'anthropic/claude-3.5-haiku',
  summary:      'anthropic/claude-3.5-haiku',
  evaluation:   'anthropic/claude-3.5-haiku',
  extraction:   'anthropic/claude-3.5-haiku',
  toolSelect:   'anthropic/claude-3.5-haiku',
} as const;

export type ModelTier = keyof typeof MODEL_TIERS;

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  maxTokens?: number;
  temperature?: number;
  modelOverride?: string;
}

export interface ChatResult {
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    const apiKey = process.env['OPENROUTER_API_KEY'];
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY environment variable is required');
    }
    client = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey,
    });
  }
  return client;
}

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function chat(
  tier: ModelTier,
  messages: ChatMessage[],
  options?: ChatOptions,
): Promise<ChatResult> {
  const model = options?.modelOverride ?? MODEL_TIERS[tier];
  const openai = getClient();

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await openai.chat.completions.create({
        model,
        messages,
        max_tokens: options?.maxTokens ?? 1024,
        temperature: options?.temperature ?? 0.7,
      });

      if (!response.choices || response.choices.length === 0) {
        throw new Error(
          `OpenRouter returned no choices. Model: ${model}, ID: ${response.id ?? 'unknown'}`,
        );
      }

      const choice = response.choices[0]!;
      if (!choice.message?.content) {
        throw new Error(
          `OpenRouter returned empty content. Finish reason: ${choice.finish_reason ?? 'unknown'}`,
        );
      }

      return {
        content: choice.message.content,
        model: response.model ?? model,
        usage: {
          promptTokens: response.usage?.prompt_tokens ?? 0,
          completionTokens: response.usage?.completion_tokens ?? 0,
          totalTokens: response.usage?.total_tokens ?? 0,
        },
      };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < MAX_RETRIES) {
        console.warn(`LLM call failed (attempt ${attempt + 1}/${MAX_RETRIES + 1}): ${lastError.message}. Retrying...`);
        await sleep(RETRY_DELAY_MS * (attempt + 1));
      }
    }
  }

  throw lastError ?? new Error('LLM call failed after retries');
}
