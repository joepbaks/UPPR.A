const BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API Error ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  type: 'MAIN' | 'SUB';
  modelOverride: string | null;
  createdAt: string;
  subAgents: Array<{ id: string; name: string; role: string }>;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  tokenCount: number | null;
  createdAt: string;
}

export interface Conversation {
  id: string;
  agentId: string;
  summary: string | null;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatResponse {
  message: Message;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
  model: string;
}

export interface ActivityLogEntry {
  id: string;
  agentId: string;
  type: string;
  summary: string;
  details: Record<string, unknown> | null;
  tokenCost: number | null;
  error: string | null;
  createdAt: string;
}

export interface AgentPrompt {
  id: string;
  agentId: string;
  version: number;
  content: string;
  changedBy: string;
  reason: string | null;
  isActive: boolean;
  createdAt: string;
}

export const api = {
  agents: {
    list: () => request<Agent[]>('/agents'),
    get: (id: string) => request<Agent>(`/agents/${id}`),
    create: (data: { name: string; role: string; type?: string }) =>
      request<Agent>('/agents', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) => request(`/agents/${id}`, { method: 'DELETE' }),
  },
  chat: {
    send: (agentId: string, message: string) =>
      request<ChatResponse>(`/agents/${agentId}/chat`, {
        method: 'POST',
        body: JSON.stringify({ message }),
      }),
    conversations: (agentId: string) =>
      request<Conversation[]>(`/agents/${agentId}/conversations`),
  },
  activity: {
    list: (agentId: string) => request<ActivityLogEntry[]>(`/agents/${agentId}/activity`),
  },
  prompts: {
    list: (agentId: string) => request<AgentPrompt[]>(`/agents/${agentId}/prompts`),
    create: (agentId: string, content: string, reason?: string) =>
      request<AgentPrompt>(`/agents/${agentId}/prompts`, {
        method: 'POST',
        body: JSON.stringify({ content, reason }),
      }),
    activate: (agentId: string, promptId: string) =>
      request<AgentPrompt>(`/agents/${agentId}/prompts/${promptId}/activate`, { method: 'PUT' }),
  },
};
