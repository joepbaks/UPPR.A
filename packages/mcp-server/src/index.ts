/**
 * UPPR.A MCP Server
 * Exposes agent tools via Model Context Protocol.
 * Connects to the backend API to list and execute tools.
 */

export interface McpTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface McpRequest {
  method: string;
  params?: Record<string, unknown>;
}

export interface McpResponse {
  result?: unknown;
  error?: { code: number; message: string };
}

const BACKEND_URL = process.env['BACKEND_URL'] ?? 'http://localhost:3001';

async function fetchTools(): Promise<McpTool[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/tools`);
    if (!res.ok) return getBuiltInTools();
    const tools = await res.json() as Array<{ name: string; description: string; fullSchema: Record<string, unknown> }>;
    return tools.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.fullSchema,
    }));
  } catch {
    return getBuiltInTools();
  }
}

function getBuiltInTools(): McpTool[] {
  return [
    {
      name: 'web_search',
      description: 'Search the web for information',
      inputSchema: {
        type: 'object',
        properties: { query: { type: 'string', description: 'Search query' } },
        required: ['query'],
      },
    },
    {
      name: 'web_fetch',
      description: 'Fetch content from a URL',
      inputSchema: {
        type: 'object',
        properties: { url: { type: 'string', description: 'URL to fetch' } },
        required: ['url'],
      },
    },
    {
      name: 'agent_chat',
      description: 'Chat with an UPPR agent',
      inputSchema: {
        type: 'object',
        properties: {
          agentId: { type: 'string', description: 'Agent ID' },
          message: { type: 'string', description: 'Message to send' },
        },
        required: ['agentId', 'message'],
      },
    },
  ];
}

export async function handleRequest(request: McpRequest): Promise<McpResponse> {
  switch (request.method) {
    case 'tools/list': {
      const tools = await fetchTools();
      return { result: { tools } };
    }
    case 'tools/call': {
      const { name, arguments: args } = request.params as { name: string; arguments: Record<string, unknown> };
      try {
        const res = await fetch(`${BACKEND_URL}/api/agents/${args['agentId'] ?? 'main-agent-seed'}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: `Use tool ${name} with params: ${JSON.stringify(args)}` }),
        });
        const data = await res.json();
        return { result: { content: [{ type: 'text', text: JSON.stringify(data) }] } };
      } catch (err) {
        return { error: { code: -1, message: String(err) } };
      }
    }
    default:
      return { error: { code: -32601, message: `Unknown method: ${request.method}` } };
  }
}

// Stdio transport for MCP
if (process.argv.includes('--stdio')) {
  process.stdin.setEncoding('utf8');
  let buffer = '';
  process.stdin.on('data', (chunk: string) => {
    buffer += chunk;
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const request = JSON.parse(line) as McpRequest & { id?: number };
        handleRequest(request).then((response) => {
          process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: request.id, ...response }) + '\n');
        });
      } catch {
        // Skip malformed JSON
      }
    }
  });
}
