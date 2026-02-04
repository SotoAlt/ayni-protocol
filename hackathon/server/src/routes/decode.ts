import { FastifyPluginAsync } from 'fastify';

// Glyph definitions
const GLYPH_DEFINITIONS: Record<string, {
  meaning: string;
  pose: string;
  symbol: string;
  description: string;
  usage: string;
}> = {
  Q01: {
    meaning: 'Query Database',
    pose: 'arms_up',
    symbol: 'database',
    description: 'Represents a query or request for information',
    usage: 'Use when an agent needs to request data or search for information',
  },
  R01: {
    meaning: 'Response Success',
    pose: 'arms_down',
    symbol: 'checkmark',
    description: 'Indicates a successful response or completion',
    usage: 'Use when responding to a query with positive results',
  },
  E01: {
    meaning: 'Error',
    pose: 'distressed',
    symbol: 'x',
    description: 'Indicates an error or failure condition',
    usage: 'Use when an operation fails or encounters an error',
  },
  A01: {
    meaning: 'Execute Action',
    pose: 'action',
    symbol: 'diamond',
    description: 'Represents an action or command to be executed',
    usage: 'Use when instructing an agent to perform a task',
  },
};

interface DecodeBody {
  glyph: string;
}

interface DecodeResponse {
  glyph: string;
  meaning: string;
  pose: string;
  symbol: string;
  description: string;
  usage: string;
  valid: boolean;
}

export const decodeRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post<{ Body: DecodeBody }>('/decode', {
    schema: {
      body: {
        type: 'object',
        required: ['glyph'],
        properties: {
          glyph: { type: 'string', minLength: 1 },
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
            description: { type: 'string' },
            usage: { type: 'string' },
            valid: { type: 'boolean' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { glyph } = request.body;

    const normalizedGlyph = glyph.toUpperCase().trim();
    const definition = GLYPH_DEFINITIONS[normalizedGlyph];

    if (!definition) {
      return reply.status(400).send({
        glyph: normalizedGlyph,
        valid: false,
        error: 'Unknown glyph ID',
        hint: `Valid glyphs: ${Object.keys(GLYPH_DEFINITIONS).join(', ')}`,
      });
    }

    return {
      glyph: normalizedGlyph,
      ...definition,
      valid: true,
    };
  });

  // Batch decode endpoint
  fastify.post<{ Body: { glyphs: string[] } }>('/decode/batch', {
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
    const { glyphs } = request.body;

    const results = glyphs.map((glyph) => {
      const normalizedGlyph = glyph.toUpperCase().trim();
      const definition = GLYPH_DEFINITIONS[normalizedGlyph];

      if (!definition) {
        return {
          glyph: normalizedGlyph,
          valid: false,
          error: 'Unknown glyph ID',
        };
      }

      return {
        glyph: normalizedGlyph,
        ...definition,
        valid: true,
      };
    });

    return {
      count: results.length,
      valid: results.filter(r => r.valid).length,
      invalid: results.filter(r => !r.valid).length,
      results,
    };
  });
};
