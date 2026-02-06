import { FastifyPluginAsync } from 'fastify';
import { textToGlyph, resolveGlyph, getAllKeywords } from '../glyphs.js';
import { proposalStore } from '../knowledge/patterns.js';

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

/** Find the N closest keywords to the input text using Levenshtein distance. */
function findClosestKeywords(text: string, count: number): string[] {
  const inputWords = text.toLowerCase().split(/\s+/);
  const allKw = getAllKeywords();
  const scored = new Map<string, number>();

  for (const kw of allKw) {
    const best = Math.min(...inputWords.map((w) => levenshtein(w, kw)));
    const existing = scored.get(kw);
    if (existing === undefined || best < existing) {
      scored.set(kw, best);
    }
  }

  return [...scored.entries()]
    .sort((a, b) => a[1] - b[1])
    .slice(0, count)
    .map(([kw]) => kw);
}

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
      const suggestions = findClosestKeywords(text, 3);

      return reply.status(400).send({
        error: 'No matching glyph found',
        text,
        suggestions,
        hint: `Did you mean: ${suggestions.join(', ')}?`,
      });
    }

    const def = resolveGlyph(glyphId);
    if (!def) {
      return reply.status(400).send({
        error: 'Glyph definition not found',
        glyph: glyphId,
      });
    }

    const response: EncodeResponse = {
      glyph: glyphId,
      meaning: def.meaning,
      pose: def.pose,
      symbol: def.symbol,
      domain: def.domain,
      ...(data && { data }),
      ...(recipient && { recipient }),
      timestamp: Date.now(),
    };

    response.messageHash = hashMessage(response);

    // Track usage for community-created glyphs (no-op if glyphId is a hardcoded glyph)
    proposalStore.useCompound(glyphId);
    proposalStore.useCustomGlyph(glyphId);

    return response;
  });
};
