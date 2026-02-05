/**
 * Admin token middleware for destructive endpoints.
 *
 * Checks `Authorization: Bearer <ADMIN_TOKEN>` header.
 * Skipped in development when ADMIN_TOKEN is not set.
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { env } from '../env.js';

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (!env.adminToken) {
    // No admin token configured — allow in dev
    return;
  }

  const auth = request.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    reply.status(401).send({ error: 'Missing Authorization header' });
    return;
  }

  const token = auth.slice(7);
  if (token !== env.adminToken) {
    reply.status(401).send({ error: 'Invalid admin token' });
    return;
  }
}
