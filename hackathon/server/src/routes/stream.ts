import { FastifyPluginAsync } from 'fastify';
import { WebSocket } from 'ws';
import { knowledgeStore } from '../knowledge/store.js';

// Store connected WebSocket clients
const clients = new Set<WebSocket>();

// Glyph to frontend visual mapping
const GLYPH_MAPPING: Record<string, { glyphs: string[]; category: string; meaning: string }> = {
  Q01: { glyphs: ['asking', 'database'], category: 'humanoid', meaning: 'Query Database' },
  Q02: { glyphs: ['asking', 'eye'], category: 'humanoid', meaning: 'Search' },
  Q03: { glyphs: ['asking', 'server'], category: 'humanoid', meaning: 'Query API' },
  R01: { glyphs: ['giving', 'checkmark'], category: 'humanoid', meaning: 'Success Response' },
  R02: { glyphs: ['giving', 'database'], category: 'humanoid', meaning: 'Data Response' },
  R03: { glyphs: ['celebrating', 'checkmark'], category: 'humanoid', meaning: 'Task Complete' },
  E01: { glyphs: ['waiting', 'x'], category: 'humanoid', meaning: 'Error' },
  E02: { glyphs: ['waiting', 'clock', 'x'], category: 'humanoid', meaning: 'Timeout Error' },
  E03: { glyphs: ['waiting', 'lock', 'x'], category: 'humanoid', meaning: 'Permission Denied' },
  A01: { glyphs: ['running', 'lightning'], category: 'humanoid', meaning: 'Execute Action' },
  A02: { glyphs: ['giving', 'robot'], category: 'humanoid', meaning: 'Delegate Task' },
  A03: { glyphs: ['running', 'database', 'arrow'], category: 'humanoid', meaning: 'Update Data' },
  S01: { glyphs: ['thinking', 'clock'], category: 'humanoid', meaning: 'Processing' },
  S02: { glyphs: ['waiting'], category: 'humanoid', meaning: 'Idle' },
  P01: { glyphs: ['running', 'coin'], category: 'humanoid', meaning: 'Payment Sent' },
  P02: { glyphs: ['celebrating', 'coin', 'checkmark'], category: 'humanoid', meaning: 'Payment Confirmed' },

  // Crypto domain (X01-X12)
  X01: { glyphs: ['running', 'swap'], category: 'crypto', meaning: 'Token Swap' },
  X02: { glyphs: ['thinking', 'stake'], category: 'crypto', meaning: 'Stake Tokens' },
  X03: { glyphs: ['celebrating', 'stake'], category: 'crypto', meaning: 'Unstake' },
  X04: { glyphs: ['running', 'arrow'], category: 'crypto', meaning: 'Transfer' },
  X05: { glyphs: ['thinking', 'checkmark'], category: 'crypto', meaning: 'Approve' },
  X06: { glyphs: ['celebrating', 'harvest'], category: 'crypto', meaning: 'Harvest Rewards' },
  X07: { glyphs: ['thinking', 'vote'], category: 'crypto', meaning: 'Vote' },
  X08: { glyphs: ['celebrating', 'arrow'], category: 'crypto', meaning: 'Propose' },
  X09: { glyphs: ['running', 'bridge'], category: 'crypto', meaning: 'Bridge' },
  X10: { glyphs: ['thinking', 'limit'], category: 'crypto', meaning: 'Limit Order' },
  X11: { glyphs: ['waiting', 'shield'], category: 'crypto', meaning: 'Stop Loss' },
  X12: { glyphs: ['running', 'checkmark'], category: 'crypto', meaning: 'Trade Executed' },

  // Agent domain (T01-M03)
  T01: { glyphs: ['running', 'task'], category: 'agent', meaning: 'Assign Task' },
  T02: { glyphs: ['celebrating', 'checkmark'], category: 'agent', meaning: 'Task Complete' },
  T03: { glyphs: ['waiting', 'x'], category: 'agent', meaning: 'Task Failed' },
  W01: { glyphs: ['running', 'lightning'], category: 'agent', meaning: 'Start Workflow' },
  W02: { glyphs: ['thinking', 'checkpoint'], category: 'agent', meaning: 'Checkpoint' },
  W03: { glyphs: ['waiting', 'clock'], category: 'agent', meaning: 'Pause Workflow' },
  C01: { glyphs: ['running', 'lightning'], category: 'agent', meaning: 'Notify' },
  C02: { glyphs: ['celebrating', 'broadcast'], category: 'agent', meaning: 'Broadcast' },
  C03: { glyphs: ['thinking', 'checkmark'], category: 'agent', meaning: 'Acknowledge' },
  M01: { glyphs: ['thinking', 'heartbeat'], category: 'agent', meaning: 'Heartbeat' },
  M02: { glyphs: ['thinking', 'log'], category: 'agent', meaning: 'Log' },
  M03: { glyphs: ['waiting', 'alert'], category: 'agent', meaning: 'Alert' },
};

// Agent address to name mapping
const AGENT_NAMES: Record<string, string> = {
  '0x1111111111111111111111111111111111111111': 'Alice',
  '0x2222222222222222222222222222222222222222': 'Bob',
  '0x3333333333333333333333333333333333333333': 'Carol',
  '0x4444444444444444444444444444444444444444': 'Dave',
  '0x5555555555555555555555555555555555555555': 'Eve',
};

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
 * Broadcast a message to all connected WebSocket clients
 */
export function broadcastMessage(message: BroadcastMessage): void {
  const glyphInfo = GLYPH_MAPPING[message.glyph] || {
    glyphs: [message.glyph.toLowerCase()],
    category: 'symbol',
    meaning: message.glyph,
  };

  // Convert addresses to names
  const fromName = message.sender
    ? AGENT_NAMES[message.sender] || message.sender.slice(0, 8) + '...'
    : 'Unknown';
  const toName = AGENT_NAMES[message.recipient] || message.recipient.slice(0, 8) + '...';

  // Frontend message format
  const frontendMessage = {
    id: `msg-${message.timestamp}-${Math.random().toString(36).substr(2, 9)}`,
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
  };

  const payload = JSON.stringify(frontendMessage);

  // Broadcast to all connected clients
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
  fastify.get('/stream', { websocket: true }, (socket, req) => {
    console.log('[Stream] New client connected');
    clients.add(socket);

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
    });

    // Handle errors
    socket.on('error', (err) => {
      console.error('[Stream] WebSocket error:', err);
      clients.delete(socket);
    });

    // Handle incoming messages (for future use - bidirectional)
    socket.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log('[Stream] Received from client:', message);

        // Echo back for now
        if (message.type === 'ping') {
          socket.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        }
      } catch (err) {
        // Ignore invalid JSON
      }
    });
  });

  // HTTP endpoint to get stream stats
  fastify.get('/stream/stats', async () => {
    return {
      clients: clients.size,
      status: 'active',
      timestamp: Date.now(),
    };
  });

  // HTTP endpoint to manually broadcast (for testing)
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
