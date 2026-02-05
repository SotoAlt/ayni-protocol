import { FastifyPluginAsync } from 'fastify';
import { GLYPHS, GlyphDefinition } from '../glyphs.js';

interface DecodeResult {
  glyph: string;
  valid: boolean;
  meaning?: string;
  pose?: string;
  symbol?: string;
  domain?: string;
  description?: string;
  usage?: string;
  error?: string;
}

function decodeGlyph(raw: string): DecodeResult {
  const normalized = raw.toUpperCase().trim();
  const def: GlyphDefinition | undefined = GLYPHS[normalized];

  if (!def) {
    return { glyph: normalized, valid: false, error: 'Unknown glyph ID' };
  }

  return {
    glyph: normalized,
    meaning: def.meaning,
    pose: def.pose,
    symbol: def.symbol,
    domain: def.domain,
    description: def.description,
    usage: def.usage,
    valid: true,
  };
}

export const decodeRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post<{ Body: { glyph: string } }>('/decode', {
    config: { rateLimit: { max: 200, timeWindow: '1 minute' } },
    schema: {
      body: {
        type: 'object',
        required: ['glyph'],
        properties: {
          glyph: { type: 'string', minLength: 1 },
        },
      },
    },
  }, async (request, reply) => {
    const result = decodeGlyph(request.body.glyph);

    if (!result.valid) {
      return reply.status(400).send({
        ...result,
        hint: `Valid glyphs: ${Object.keys(GLYPHS).join(', ')}`,
      });
    }

    return result;
  });

  fastify.post<{ Body: { glyphs: string[] } }>('/decode/batch', {
    config: { rateLimit: { max: 200, timeWindow: '1 minute' } },
    schema: {
      body: {
        type: 'object',
        required: ['glyphs'],
        properties: {
          glyphs: {
            type: 'array',
            items: { type: 'string' },
            minItems: 1,
            maxItems: 100,
          },
        },
      },
    },
  }, async (request) => {
    const results = request.body.glyphs.map(decodeGlyph);
    const validCount = results.filter((r) => r.valid).length;

    return {
      count: results.length,
      valid: validCount,
      invalid: results.length - validCount,
      results,
    };
  });
};
