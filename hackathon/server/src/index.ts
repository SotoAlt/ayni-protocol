import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { serverConfig } from './config.js';
import { encodeRoute } from './routes/encode.js';
import { decodeRoute } from './routes/decode.js';
import { attestRoute } from './routes/attest.js';
import { sendRoute } from './routes/send.js';
import { verifyRoute } from './routes/verify.js';
import { glyphsRoute } from './routes/glyphs.js';
import { hashRoute } from './routes/hash.js';
import { streamRoute } from './routes/stream.js';
import { knowledgeRoute } from './routes/knowledge.js';

const fastify = Fastify({
  logger: true,
});

// Register CORS
await fastify.register(cors, {
  origin: true,
});

// Register WebSocket plugin
await fastify.register(websocket);

// Health check
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: Date.now() };
});

// API info
fastify.get('/', async () => {
  return {
    name: 'Ayni Protocol Server',
    version: '1.0.0',
    description: 'Crypto-native coordination layer for AI agents',
    endpoints: {
      'POST /encode': 'Convert text intent to glyph (free)',
      'POST /decode': 'Convert glyph to meaning (free)',
      'POST /message/hash': 'Compute message hash without wallet (free)',
      'POST /message/batch-hash': 'Batch compute hashes (free)',
      'GET /message/hash-preview': 'Preview hash for a glyph (free)',
      'POST /attest': 'Store message hash on-chain (0.01 MON)',
      'POST /send': 'Relay + attest message (0.001 MON)',
      'GET /verify/:hash': 'Check if message was attested (free)',
      'GET /glyphs': 'List all registered glyphs (free)',
      'WS /stream': 'WebSocket for real-time message stream (free)',
      'GET /stream/stats': 'Get stream client count (free)',
      'POST /stream/broadcast': 'Manually broadcast message (free)',
      'GET /knowledge': 'Full shared knowledge graph (free)',
      'GET /knowledge/stats': 'Knowledge summary stats (free)',
      'GET /knowledge/query?q=': 'Search knowledge by keyword (free)',
      'GET /knowledge/agents': 'Known agents and activity (free)',
      'GET /knowledge/sequences': 'Detected glyph patterns (free)',
      'GET /knowledge/compounds': 'Evolved compound glyphs (free)',
      'GET /knowledge/glyph/:id': 'Deep info on one glyph (free)',
      'GET /knowledge/proposals': 'List glyph proposals (free)',
      'POST /knowledge/propose': 'Propose a compound glyph (free)',
      'POST /knowledge/endorse': 'Endorse a proposal (free)',
    },
    docs: 'https://docs.ayni-protocol.com',
    github: 'https://github.com/ayni-protocol/ayni-server',
  };
});

// Register routes
fastify.register(encodeRoute);
fastify.register(decodeRoute);
fastify.register(attestRoute);
fastify.register(sendRoute);
fastify.register(verifyRoute);
fastify.register(glyphsRoute);
fastify.register(hashRoute);
fastify.register(streamRoute);
fastify.register(knowledgeRoute);

// Start server
const start = async () => {
  try {
    await fastify.listen({
      port: serverConfig.port,
      host: serverConfig.host,
    });
    console.log(`Ayni server listening on ${serverConfig.host}:${serverConfig.port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
