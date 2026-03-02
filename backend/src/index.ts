import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { createHealthRouter } from './routes/health';
import { verifyPlatformToken } from './middleware/verifyPlatformToken';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const prisma = new PrismaClient();

app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);
app.use(
  cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
  })
);
app.use(express.json());

app.set('prisma', prisma);

// Public endpoints (no auth) — registered before verifyPlatformToken
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.use('/api/health', createHealthRouter(app));

// All /api/* routes from this point forward require a platform-issued app token.
// The shell injects Authorization: Bearer <platform-token> via api.ts.
// Set PLATFORM_INTERNAL_SECRET (or PLATFORM_APP_TOKEN_SECRET) in env vars.
app.use('/api', verifyPlatformToken);

// Protected API routes — add new routers here:
// app.use('/api/your-resource', createYourResourceRouter(app));

app.listen(PORT, () => {
  console.log(`[beacon-app-min] API listening on port ${PORT}`);
});
