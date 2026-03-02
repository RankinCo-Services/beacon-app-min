/**
 * Verifies the platform-issued API token (Option B). Use in place of verifyClerkJwt
 * when app backends receive requests from the shell with Authorization: Bearer <platform-token>.
 * Sets req.headers['x-user-id'], req.headers['x-tenant-id'], and req.tenantId from the token payload.
 * See beacon-tenant docs/PLATFORM_APP_CONTRACT.md.
 */

import { Request, Response, NextFunction } from 'express';
// eslint-disable-next-line @typescript-eslint/no-require-imports -- required for Render/build resolution
const jwt = require('jsonwebtoken') as { verify: (token: string, secret: string, options: { algorithms: string[] }) => unknown };

const PLATFORM_APP_TOKEN_SECRET =
  process.env.PLATFORM_APP_TOKEN_SECRET || process.env.PLATFORM_INTERNAL_SECRET;

interface PlatformTokenPayload {
  sub: string;
  tenant_id: string;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
    }
  }
}

export async function verifyPlatformToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const auth = req.headers.authorization;
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (!PLATFORM_APP_TOKEN_SECRET) {
    console.error('[verifyPlatformToken] PLATFORM_APP_TOKEN_SECRET or PLATFORM_INTERNAL_SECRET not set');
    res.status(500).json({ error: 'Server configuration error' });
    return;
  }

  try {
    const payload = jwt.verify(token, PLATFORM_APP_TOKEN_SECRET, {
      algorithms: ['HS256'],
    }) as PlatformTokenPayload;

    const userId = payload.sub;
    const tenantId = payload.tenant_id;

    if (!userId || !tenantId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    req.headers['x-user-id'] = userId;
    req.headers['x-tenant-id'] = tenantId;
    (req as Request & { tenantId?: string }).tenantId = tenantId;
    next();
  } catch (err) {
    const e = err as { message?: string; name?: string };
    if (e.name === 'TokenExpiredError') {
      res.status(401).json({ error: 'Token expired' });
      return;
    }
    if (e.name === 'JsonWebTokenError') {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    console.error('[verifyPlatformToken]', e?.message);
    res.status(500).json({ error: 'Internal server error' });
  }
}
