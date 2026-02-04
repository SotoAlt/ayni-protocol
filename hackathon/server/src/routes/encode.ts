import { FastifyPluginAsync } from 'fastify';

// Glyph mapping for text-to-glyph conversion
const GLYPH_MAPPINGS: Record<string, { patterns: string[]; glyph: string }> = {
  Q01: {
    patterns: ['query', 'search', 'find', 'get', 'fetch', 'lookup', 'database', 'db'],
    glyph: 'Q01',
  },
  R01: {
    patterns: ['success', 'ok', 'done', 'complete', 'finished', 'response', 'result', 'found'],
    glyph: 'R01',
  },
  E01: {
    patterns: ['error', 'fail', 'failed', 'exception', 'problem', 'issue', 'bug', 'crash'],
    glyph: 'E01',
  },
  A01: {
    patterns: ['execute', 'run', 'action', 'do', 'perform', 'start', 'begin', 'process'],
    glyph: 'A01',
  },
};

// Glyph metadata
const GLYPH_METADATA: Record<string, { meaning: string; pose: string; symbol: string }> = {
  Q01: { meaning: 'Query Database', pose: 'arms_up', symbol: 'database' },
  R01: { meaning: 'Response Success', pose: 'arms_down', symbol: 'checkmark' },
  E01: { meaning: 'Error', pose: 'distressed', symbol: 'x' },
  A01: { meaning: 'Execute Action', pose: 'action', symbol: 'diamond' },
};

interface EncodeBody {
  text: string;
  data?: Record<string, unknown>;
  recipient?: string;
}

interface EncodeResponse {
  glyph: string;
  meaning: string;
  pose: string;
  symbol: string;
  data?: Record<string, unknown>;
  timestamp: number;
  recipient?: string;
  messageHash?: string;
}

function textToGlyph(text: string): string | null {
  const lowerText = text.toLowerCase();

  for (const [, config] of Object.entries(GLYPH_MAPPINGS)) {
    for (const pattern of config.patterns) {
      if (lowerText.includes(pattern)) {
        return config.glyph;
      }
    }
  }

  return null;
}

function hashMessage(message: EncodeResponse): string {
  // Simple hash for demo - in production use keccak256
  const str = JSON.stringify(message);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return '0x' + Math.abs(hash).toString(16).padStart(64, '0');
}

export const encodeRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post<{ Body: EncodeBody }>('/encode', {
    schema: {
      body: {
        type: 'object',
        required: ['text'],
        properties: {
          text: { type: 'string', minLength: 1 },
          data: { type: 'object' },
          recipient: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            glyph: { type: 'string' },
            meaning: { type: 'string' },
            pose: { type: 'string' },
            symbol: { type: 'string' },
            data: { type: 'object' },
            timestamp: { type: 'number' },
            recipient: { type: 'string' },
            messageHash: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { text, data, recipient } = request.body;

    const glyphId = textToGlyph(text);

    if (!glyphId) {
      return reply.status(400).send({
        error: 'No matching glyph found',
        text,
        hint: 'Try using keywords like: query, success, error, execute',
      });
    }

    const metadata = GLYPH_METADATA[glyphId];

    const response: EncodeResponse = {
      glyph: glyphId,
      meaning: metadata.meaning,
      pose: metadata.pose,
      symbol: metadata.symbol,
      timestamp: Date.now(),
    };

    if (data) {
      response.data = data;
    }

    if (recipient) {
      response.recipient = recipient;
    }

    response.messageHash = hashMessage(response);

    return response;
  });
};
