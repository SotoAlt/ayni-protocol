import { FastifyPluginAsync } from 'fastify';
import WebSocket from 'ws';
import { knowledgeStore } from '../knowledge/store.js';
import { getVisual } from '../glyphs.js';
import { requireAdmin } from '../middleware/admin.js';

const MAX_CLIENTS = 100;
const HEARTBEAT_INTERVAL_MS = 30_000;
const MAX_MESSAGE_SIZE = 4096;

const clients = new Set<WebSocket>();

const AGENT_NAMES: Record<string, string> = {
  '0x1111111111111111111111111111111111111111': 'Alice',
  '0x2222222222222222222222222222222222222222': 'Bob',
  '0x3333333333333333333333333333333333333333': 'Carol',
  '0x4444444444444444444444444444444444444444': 'Dave',
  '0x5555555555555555555555555555555555555555': 'Eve',
};

function resolveAgentName(address: string | undefined): string {
  if (!address) return 'Unknown';
  if (address.toLowerCase() === 'agora') return 'agora';
  return AGENT_NAMES[address] || address.substring(0, 8) + '...';
}

export interface BroadcastMessage {
  glyph: string;
  data?: Record<string, unknown>;
  sender?: string;
  recipient: string;
  timestamp: number;
  messageHash: string;
  transactionHash?: string;
  encrypted?: boolean;
}

/**
 * Broadcast a governance event (comment, amend) to all WebSocket clients
 */
export function broadcastGovernanceEvent(event: {
  type: 'governance_comment' | 'governance_amend';
  proposalId: string;
  author: string;
  body?: string;
  timestamp: number;
}): void {
  const payload = JSON.stringify(event);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

/**
 * Broadcast a message to all connected WebSocket clients
 */
export function broadcastMessage(message: BroadcastMessage): void {
  const glyphInfo = getVisual(message.glyph);
  const fromName = resolveAgentName(message.sender);
  const toName = resolveAgentName(message.recipient);

  const frontendMessage = {
    id: `msg-${message.timestamp}-${Math.random().toString(36).substring(2, 11)}`,
    from: fromName,
    to: toName,
    glyphs: glyphInfo.glyphs,
    glyph: glyphInfo.glyphs[0],
    category: glyphInfo.category,
    meaning: glyphInfo.meaning,
    timestamp: message.timestamp,
    encrypted: message.encrypted || false,
    size: glyphInfo.glyphs.length * 512,
    messageHash: message.messageHash,
    transactionHash: message.transactionHash,
    data: message.data,
    glyphId: message.glyph,
  };

  const payload = JSON.stringify(frontendMessage);

  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }

  console.log(`[Stream] Broadcast to ${clients.size} clients: ${message.glyph} ${fromName} -> ${toName}`);

  // Record public (unencrypted) messages in knowledge store
  if (!message.encrypted) {
    knowledgeStore.recordMessage({
      glyph: message.glyph,
      sender: fromName,
      recipient: toName,
      data: message.data,
      timestamp: message.timestamp,
      messageHash: message.messageHash,
    });
  }
}

/**
 * Get number of connected clients
 */
export function getClientCount(): number {
  return clients.size;
}

export const streamRoute: FastifyPluginAsync = async (fastify) => {
  // WebSocket endpoint for real-time message streaming
  fastify.get('/stream', { websocket: true }, (socket, _req) => {
    if (clients.size >= MAX_CLIENTS) {
      socket.close(1013, 'Maximum clients reached');
      return;
    }

    console.log('[Stream] New client connected');
    clients.add(socket);

    // Heartbeat: ping every 30s, close if no pong in 10s
    let alive = true;
    const heartbeat = setInterval(() => {
      if (!alive) {
        console.log('[Stream] Client unresponsive, disconnecting');
        clients.delete(socket);
        clearInterval(heartbeat);
        socket.terminate();
        return;
      }
      alive = false;
      socket.ping();
    }, HEARTBEAT_INTERVAL_MS);

    socket.on('pong', () => {
      alive = true;
    });

    // Send welcome message
    socket.send(
      JSON.stringify({
        type: 'connected',
        message: 'Connected to Ayni Protocol stream',
        clients: clients.size,
        timestamp: Date.now(),
      })
    );

    // Handle client disconnect
    socket.on('close', () => {
      console.log('[Stream] Client disconnected');
      clients.delete(socket);
      clearInterval(heartbeat);
    });

    // Handle errors
    socket.on('error', (err: Error) => {
      console.error('[Stream] WebSocket error:', err);
      clients.delete(socket);
      clearInterval(heartbeat);
    });

    // Handle incoming messages
    socket.on('message', (data: Buffer | ArrayBuffer | Buffer[]) => {
      // Size guard
      const raw = data instanceof Buffer ? data : Buffer.from(data as ArrayBuffer);
      if (raw.length > MAX_MESSAGE_SIZE) {
        socket.send(JSON.stringify({ type: 'error', message: 'Message too large' }));
        return;
      }

      try {
        const message = JSON.parse(raw.toString());

        if (message.type === 'ping') {
          socket.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        }
      } catch {
        // Ignore invalid JSON
      }
    });
  });

  // HTTP endpoint to get stream stats
  fastify.get('/stream/stats', async () => {
    return {
      clients: clients.size,
      maxClients: MAX_CLIENTS,
      status: 'active',
      timestamp: Date.now(),
    };
  });

  // HTTP endpoint to manually broadcast (admin-gated in production)
  fastify.post<{
    Body: {
      glyph: string;
      sender?: string;
      recipient: string;
      data?: Record<string, unknown>;
      encrypted?: boolean;
    };
  }>(
    '/stream/broadcast',
    {
      preHandler: requireAdmin,
      schema: {
        body: {
          type: 'object',
          required: ['glyph', 'recipient'],
          properties: {
            glyph: { type: 'string' },
            sender: { type: 'string' },
            recipient: { type: 'string' },
            data: { type: 'object' },
            encrypted: { type: 'boolean' },
          },
        },
      },
    },
    async (request) => {
      const { glyph, sender, recipient, data, encrypted } = request.body;

      const message: BroadcastMessage = {
        glyph: glyph.toUpperCase(),
        sender,
        recipient,
        data,
        timestamp: Date.now(),
        messageHash: '0x' + 'test'.repeat(16),
        encrypted,
      };

      broadcastMessage(message);

      return {
        success: true,
        broadcast: true,
        clients: clients.size,
      };
    }
  );
};
