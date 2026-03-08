import { getTool, listToolsSummary } from './tool-registry.js';
import { chat } from './llm-client.js';
import type { ChatMessage } from './llm-client.js';
import type { ToolResult } from './tool-registry.js';

export interface ToolCall {
  tool: string;
  params: Record<string, unknown>;
}

export interface ExecutionResult {
  toolCalls: Array<{ tool: string; result: ToolResult }>;
  finalResponse: string;
  totalToolTokens: number;
}

/**
 * Parse tool calls from LLM response.
 * Expected format in response: [TOOL_CALL: tool_name({"param": "value"})]
 */
export function parseToolCalls(content: string): ToolCall[] {
  const calls: ToolCall[] = [];
  const regex = /\[TOOL_CALL:\s*(\w+)\((\{[^}]*\})\)\]/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    try {
      const params = JSON.parse(match[2]!) as Record<string, unknown>;
      calls.push({ tool: match[1]!, params });
    } catch {
      // Skip malformed tool calls
    }
  }
  return calls;
}

/**
 * Execute tool calls and generate a final response incorporating results.
 */
export async function executeToolCalls(
  toolCalls: ToolCall[],
  originalMessages: ChatMessage[],
  originalResponse: string,
): Promise<ExecutionResult> {
  const results: Array<{ tool: string; result: ToolResult }> = [];

  for (const call of toolCalls) {
    const tool = getTool(call.tool);
    if (!tool) {
      results.push({ tool: call.tool, result: { success: false, data: null, error: `Unknown tool: ${call.tool}` } });
      continue;
    }
    const result = await tool.handler(call.params);
    results.push({ tool: call.tool, result });
  }

  // Feed tool results back to LLM for final response
  const toolResultsText = results
    .map((r) => `Tool "${r.tool}": ${r.result.success ? JSON.stringify(r.result.data) : `Error: ${r.result.error}`}`)
    .join('\n');

  const followUpMessages: ChatMessage[] = [
    ...originalMessages,
    { role: 'assistant', content: originalResponse },
    { role: 'user', content: `Tool results:\n${toolResultsText}\n\nPlease provide a final response incorporating these results.` },
  ];

  const followUp = await chat('conversation', followUpMessages, { maxTokens: 1024 });

  return {
    toolCalls: results,
    finalResponse: followUp.content,
    totalToolTokens: followUp.usage.totalTokens,
  };
}

/**
 * Build tool instructions for the system prompt.
 */
export function buildToolInstructions(): string {
  const tools = listToolsSummary();
  if (!tools) return '';
  return `\nAvailable tools:\n${tools}\nTo use a tool, include in your response: [TOOL_CALL: tool_name({"param": "value"})]`;
}
