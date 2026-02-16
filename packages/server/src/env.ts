/**
 * Environment validation — imported first in index.ts.
 *
 * Fails fast if required production env vars are missing or insecure.
 */

import 'dotenv/config';

const isProduction = process.env.NODE_ENV === 'production';

function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) {
    console.error(`FATAL: Missing required env var ${name}`);
    process.exit(1);
  }
  return val;
}

if (isProduction) {
  requireEnv('ADMIN_TOKEN');
  requireEnv('ALLOWED_ORIGINS');

  const pk = process.env.SERVER_PRIVATE_KEY || '';
  if (pk === '0x0000000000000000000000000000000000000000000000000000000000000001') {
    console.error('FATAL: SERVER_PRIVATE_KEY is the default insecure key. Set a real key for production.');
    process.exit(1);
  }
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',
  adminToken: process.env.ADMIN_TOKEN || '',
  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  isProduction,
  minVoteWindowMs: parseInt(process.env.MIN_VOTE_WINDOW_MS || String(ONE_DAY_MS), 10),
  minBaseVoteWindowMs: parseInt(process.env.MIN_BASE_VOTE_WINDOW_MS || String(2 * ONE_DAY_MS), 10),
} as const;
