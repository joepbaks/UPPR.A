import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from './middleware/auth.js';
import { createAgentRoutes } from './routes/agents.js';
import { createToolRoutes } from './routes/tools.js';

const app = express();
const prisma = new PrismaClient();
const port = parseInt(process.env['PORT'] ?? '3001', 10);

app.use(cors({ origin: process.env['FRONTEND_URL'] ?? 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', authMiddleware(prisma));
app.use('/api/agents', createAgentRoutes(prisma));
app.use('/api/tools', createToolRoutes(prisma));

// Global JSON error handler — prevents HTML error pages
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('API Error:', err.message);
  res.status(500).json({ error: err.message });
});

app.listen(port, () => {
  console.log(`UPPR.A backend running on port ${port}`);
});
