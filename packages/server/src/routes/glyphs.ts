import { FastifyPluginAsync } from 'fastify';
import { createPublicClient, http } from 'viem';
import { monadTestnet, contracts } from '../config.js';
import { AyniRegistryABI } from '../contracts.js';

interface Glyph {
  id: string;
  meaning: string;
  pose: string;
  symbol: string;
  visualHash?: string;
  active: boolean;
}

// Default glyphs (used when contracts not deployed)
const DEFAULT_GLYPHS: Glyph[] = [
  {
    id: 'Q01',
    meaning: 'Query Database',
    pose: 'arms_up',
    symbol: 'database',
    active: true,
  },
  {
    id: 'R01',
    meaning: 'Response Success',
    pose: 'arms_down',
    symbol: 'checkmark',
    active: true,
  },
  {
    id: 'E01',
    meaning: 'Error',
    pose: 'distressed',
    symbol: 'x',
    active: true,
  },
  {
    id: 'A01',
    meaning: 'Execute Action',
    pose: 'action',
    symbol: 'diamond',
    active: true,
  },
];

const publicClient = createPublicClient({
  chain: monadTestnet,
  transport: http(),
});

export const glyphsRoute: FastifyPluginAsync = async (fastify) => {
  // List all glyphs
  fastify.get('/glyphs', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            glyphs: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  meaning: { type: 'string' },
                  pose: { type: 'string' },
                  symbol: { type: 'string' },
                  visualHash: { type: 'string' },
                  active: { type: 'boolean' },
                },
              },
            },
            count: { type: 'number' },
            source: { type: 'string' },
          },
        },
      },
    },
  }, async () => {
    if (contracts.ayniRegistry === '0x0000000000000000000000000000000000000000') {
      return {
        glyphs: DEFAULT_GLYPHS,
        count: DEFAULT_GLYPHS.length,
        source: 'local',
        note: 'Contracts not yet deployed - showing default glyphs',
      };
    }

    try {
      const result = await publicClient.readContract({
        address: contracts.ayniRegistry as `0x${string}`,
        abi: AyniRegistryABI,
        functionName: 'getAllGlyphs',
      }) as unknown as Array<[string, string, string, string, string, boolean]>;

      const glyphs: Glyph[] = result.map(([id, meaning, pose, symbol, visualHash, active]) => ({
        id,
        meaning,
        pose,
        symbol,
        visualHash,
        active,
      }));

      return {
        glyphs,
        count: glyphs.length,
        source: 'chain',
      };
    } catch (error) {
      return {
        glyphs: DEFAULT_GLYPHS,
        count: DEFAULT_GLYPHS.length,
        source: 'local',
        error: error instanceof Error ? error.message : 'Failed to fetch from chain',
      };
    }
  });

  // Get active glyphs only
  fastify.get('/glyphs/active', async () => {
    if (contracts.ayniRegistry === '0x0000000000000000000000000000000000000000') {
      return {
        glyphs: DEFAULT_GLYPHS.filter(g => g.active),
        count: DEFAULT_GLYPHS.filter(g => g.active).length,
        source: 'local',
      };
    }

    try {
      const result = await publicClient.readContract({
        address: contracts.ayniRegistry as `0x${string}`,
        abi: AyniRegistryABI,
        functionName: 'getActiveGlyphs',
      }) as unknown as Array<[string, string, string, string, string, boolean]>;

      const glyphs: Glyph[] = result.map(([id, meaning, pose, symbol, visualHash, active]) => ({
        id,
        meaning,
        pose,
        symbol,
        visualHash,
        active,
      }));

      return {
        glyphs,
        count: glyphs.length,
        source: 'chain',
      };
    } catch {
      return {
        glyphs: DEFAULT_GLYPHS.filter(g => g.active),
        count: DEFAULT_GLYPHS.filter(g => g.active).length,
        source: 'local',
      };
    }
  });

  // Get single glyph by ID
  fastify.get<{ Params: { id: string } }>('/glyphs/:id', {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params;
    const normalizedId = id.toUpperCase().trim();

    if (contracts.ayniRegistry === '0x0000000000000000000000000000000000000000') {
      const glyph = DEFAULT_GLYPHS.find(g => g.id === normalizedId);

      if (!glyph) {
        return reply.status(404).send({
          error: 'Glyph not found',
          id: normalizedId,
          available: DEFAULT_GLYPHS.map(g => g.id),
        });
      }

      return {
        ...glyph,
        source: 'local',
      };
    }

    try {
      const result = await publicClient.readContract({
        address: contracts.ayniRegistry as `0x${string}`,
        abi: AyniRegistryABI,
        functionName: 'getGlyph',
        args: [normalizedId],
      }) as unknown as [string, string, string, string, string, boolean];

      const [glyphId, meaning, pose, symbol, visualHash, active] = result;

      return {
        id: glyphId,
        meaning,
        pose,
        symbol,
        visualHash,
        active,
        source: 'chain',
      };
    } catch {
      // Check local fallback
      const glyph = DEFAULT_GLYPHS.find(g => g.id === normalizedId);

      if (!glyph) {
        return reply.status(404).send({
          error: 'Glyph not found',
          id: normalizedId,
        });
      }

      return {
        ...glyph,
        source: 'local',
      };
    }
  });

  // Check if glyph exists
  fastify.get<{ Params: { id: string } }>('/glyphs/:id/exists', {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
    },
  }, async (request) => {
    const { id } = request.params;
    const normalizedId = id.toUpperCase().trim();

    if (contracts.ayniRegistry === '0x0000000000000000000000000000000000000000') {
      const exists = DEFAULT_GLYPHS.some(g => g.id === normalizedId);
      return { id: normalizedId, exists, source: 'local' };
    }

    try {
      const exists = await publicClient.readContract({
        address: contracts.ayniRegistry as `0x${string}`,
        abi: AyniRegistryABI,
        functionName: 'glyphExists',
        args: [normalizedId],
      });

      return { id: normalizedId, exists, source: 'chain' };
    } catch {
      const exists = DEFAULT_GLYPHS.some(g => g.id === normalizedId);
      return { id: normalizedId, exists, source: 'local' };
    }
  });
};
