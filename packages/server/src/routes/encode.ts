import { FastifyPluginAsync } from 'fastify';
import { GLYPHS, textToGlyph } from '../glyphs.js';

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
  domain: string;
  data?: Record<string, unknown>;
  timestamp: number;
  recipient?: string;
  messageHash?: string;
}

function hashMessage(message: EncodeResponse): string {
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
    config: { rateLimit: { max: 200, timeWindow: '1 minute' } },
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
    },
  }, async (request, reply) => {
    const { text, data, recipient } = request.body;

    const glyphId = textToGlyph(text);

    if (!glyphId) {
      return reply.status(400).send({
        error: 'No matching glyph found',
        text,
        hint: `Try keywords like: ${Object.values(GLYPHS).flatMap(g => g.keywords.slice(0, 2)).slice(0, 10).join(', ')}`,
      });
    }

    const def = GLYPHS[glyphId];

    const response: EncodeResponse = {
      glyph: glyphId,
      meaning: def.meaning,
      pose: def.pose,
      symbol: def.symbol,
      domain: def.domain,
      timestamp: Date.now(),
    };

    if (data) response.data = data;
    if (recipient) response.recipient = recipient;

    response.messageHash = hashMessage(response);

    return response;
  });
};
