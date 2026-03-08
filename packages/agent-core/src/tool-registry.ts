export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, { type: string; description: string; required?: boolean }>;
}

export interface ToolResult {
  success: boolean;
  data: unknown;
  error?: string;
}

export type ToolHandler = (params: Record<string, unknown>) => Promise<ToolResult>;

const registry = new Map<string, { definition: ToolDefinition; handler: ToolHandler }>();

export function registerTool(definition: ToolDefinition, handler: ToolHandler): void {
  registry.set(definition.name, { definition, handler });
}

export function getTool(name: string): { definition: ToolDefinition; handler: ToolHandler } | undefined {
  return registry.get(name);
}

export function listTools(): ToolDefinition[] {
  return Array.from(registry.values()).map((t) => t.definition);
}

export function listToolsSummary(): string {
  return listTools()
    .map((t) => `- ${t.name}: ${t.description}`)
    .join('\n');
}

// Built-in: web_search
registerTool(
  {
    name: 'web_search',
    description: 'Search the web for information',
    parameters: {
      query: { type: 'string', description: 'Search query', required: true },
    },
  },
  async (params) => {
    const query = params['query'] as string;
    const searxngUrl = process.env['SEARXNG_URL'] ?? 'http://localhost:8888';
    try {
      const url = `${searxngUrl}/search?q=${encodeURIComponent(query)}&format=json&categories=general&engines=google,duckduckgo`;
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!res.ok) {
        return { success: false, data: null, error: `Search API returned ${res.status}` };
      }
      const json = await res.json() as { results?: Array<{ title: string; url: string; content: string }> };
      const results = (json.results ?? []).slice(0, 5).map((r) => ({
        title: r.title,
        url: r.url,
        snippet: r.content?.slice(0, 200),
      }));
      return { success: true, data: results };
    } catch {
      return { success: false, data: null, error: 'Search service unavailable' };
    }
  },
);

// Built-in: web_fetch
registerTool(
  {
    name: 'web_fetch',
    description: 'Fetch content from a URL',
    parameters: {
      url: { type: 'string', description: 'URL to fetch', required: true },
    },
  },
  async (params) => {
    const url = params['url'] as string;
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(10000),
        headers: { 'User-Agent': 'UPPR-Agent/1.0' },
      });
      if (!res.ok) {
        return { success: false, data: null, error: `HTTP ${res.status}` };
      }
      const text = await res.text();
      // Limit content to prevent token explosion
      const trimmed = text.slice(0, 4000);
      return { success: true, data: { url, content: trimmed, truncated: text.length > 4000 } };
    } catch {
      return { success: false, data: null, error: 'Failed to fetch URL' };
    }
  },
);
