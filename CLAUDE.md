# UPPR.A — Claude Code Instructions

## Project
Token-efficient AI agent platform. Monorepo with Turborepo + pnpm.

## Structure
- `packages/shared` — Zod types shared across packages
- `packages/agent-core` — LLM client (OpenRouter), context manager, prompt manager
- `packages/backend` — Express API + Prisma (PostgreSQL)
- `packages/mcp-server` — Dynamic MCP server (Phase 5)
- `packages/frontend` — React dashboard (Phase 8)

## Commands
```bash
pnpm install                          # Install all deps
pnpm build                            # Build all packages
pnpm --filter backend dev             # Run backend dev server
pnpm --filter backend prisma:push     # Push schema to DB
pnpm --filter backend prisma:seed     # Seed test data
pnpm --filter backend prisma:studio   # Open Prisma Studio
docker compose up -d                  # Start postgres + redis
```

## Code Conventions
- Strict TypeScript — no `any`
- Zod for runtime validation
- kebab-case files, PascalCase types/interfaces
- Every LLM call must track token usage
- System prompts: compact structured format, NOT prose (target <200 tokens)

## Token Efficiency Rules
1. Layered memory: system prompt + summary + last 6 messages only
2. Compact prompts: structured key-value, not prose
3. Lazy tool loading: names + descriptions first, full schema on demand
4. Model tiering: reasoning=sonnet, everything else=haiku
5. Track tokenCount on every message

## Current Phase: 1 (Foundation)
Monorepo setup, Prisma schema, Express API, OpenRouter LLM client, basic chat endpoint.
