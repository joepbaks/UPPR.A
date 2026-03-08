import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from './middleware/auth.js';
import { createAgentRoutes } from './routes/agents.js';

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

app.listen(port, () => {
  console.log(`UPPR.A backend running on port ${port}`);
});
