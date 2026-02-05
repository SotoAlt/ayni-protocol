import { FastifyPluginAsync } from 'fastify';
import { keccak256, toBytes, encodePacked } from 'viem';
import { contracts } from '../config.js';

/**
 * Wallet-Free Hash Endpoint
 *
 * Computes message hash WITHOUT requiring a wallet or on-chain transaction.
 * Users can self-attest later with their own wallet using the returned hash.
 *
 * This is Tier 1 (Free) functionality:
 * - No wallet needed
 * - No gas fees
 * - Returns hash + self-attest instructions
 */

interface HashBody {
  glyph: string;
  data?: Record<string, unknown>;
  recipient?: string;
  sender?: string;
  timestamp?: number;
}

interface HashResponse {
  success: boolean;
  hash: string;
  glyph: string;
  timestamp: number;
  selfAttestInstructions: {
    contractAddress: string;
    functionSignature: string;
    calldata: {
      messageHash: string;
      glyphId: string;
      recipient?: string;
    };
    estimatedGas: string;
    note: string;
  };
  error?: string;
}

// Glyph metadata for encoding
const GLYPH_METADATA: Record<string, { meaning: string; pose: string; symbol: string }> = {
  Q01: { meaning: 'Query Database', pose: 'arms_up', symbol: 'database' },
  R01: { meaning: 'Response Success', pose: 'arms_down', symbol: 'checkmark' },
  E01: { meaning: 'Error', pose: 'distressed', symbol: 'x' },
  A01: { meaning: 'Execute Action', pose: 'action', symbol: 'diamond' },
};

function computeMessageHash(message: HashBody): `0x${string}` {
  // Create deterministic hash from message components
  const messageString = JSON.stringify({
    glyph: message.glyph.toUpperCase(),
    data: message.data || {},
    recipient: message.recipient || '',
    sender: message.sender || '',
    timestamp: message.timestamp || Date.now(),
  });
  return keccak256(toBytes(messageString));
}

export const hashRoute: FastifyPluginAsync = async (fastify) => {
  /**
   * POST /message/hash
   *
   * Compute hash for a message without requiring a wallet.
   * Returns the hash and instructions for self-attestation.
   */
  fastify.post<{ Body: HashBody }>('/message/hash', {
    schema: {
      body: {
        type: 'object',
        required: ['glyph'],
        properties: {
          glyph: { type: 'string', minLength: 1 },
          data: { type: 'object' },
          recipient: { type: 'string' },
          sender: { type: 'string' },
          timestamp: { type: 'number' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            hash: { type: 'string' },
            glyph: { type: 'string' },
            timestamp: { type: 'number' },
            selfAttestInstructions: {
              type: 'object',
              properties: {
                contractAddress: { type: 'string' },
                functionSignature: { type: 'string' },
                calldata: {
                  type: 'object',
                  properties: {
                    messageHash: { type: 'string' },
                    glyphId: { type: 'string' },
                    recipient: { type: 'string' },
                  },
                },
                estimatedGas: { type: 'string' },
                note: { type: 'string' },
              },
            },
            error: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const body = request.body;

    // Normalize glyph ID
    const normalizedGlyph = body.glyph.toUpperCase().trim();

    // Validate glyph exists
    if (!GLYPH_METADATA[normalizedGlyph]) {
      return reply.status(400).send({
        success: false,
        hash: '',
        glyph: normalizedGlyph,
        timestamp: Date.now(),
        selfAttestInstructions: {
          contractAddress: '',
          functionSignature: '',
          calldata: { messageHash: '', glyphId: normalizedGlyph },
          estimatedGas: '0',
          note: '',
        },
        error: `Invalid glyph ID. Valid: ${Object.keys(GLYPH_METADATA).join(', ')}`,
      });
    }

    const timestamp = body.timestamp || Date.now();

    // Compute the hash
    const messageWithTimestamp = { ...body, glyph: normalizedGlyph, timestamp };
    const hash = computeMessageHash(messageWithTimestamp);

    // Build self-attest instructions
    const selfAttestInstructions = {
      contractAddress: contracts.messageAttestation,
      functionSignature: body.recipient
        ? 'attest(bytes32 messageHash, string glyphId, address recipient)'
        : 'attestSimple(bytes32 messageHash, string glyphId)',
      calldata: {
        messageHash: hash,
        glyphId: normalizedGlyph,
        ...(body.recipient && { recipient: body.recipient }),
      },
      estimatedGas: body.recipient ? '~80,000' : '~60,000',
      note: 'Call this function on the MessageAttestation contract with your own wallet to create an on-chain attestation.',
    };

    return {
      success: true,
      hash,
      glyph: normalizedGlyph,
      glyphMetadata: GLYPH_METADATA[normalizedGlyph],
      timestamp,
      message: {
        glyph: normalizedGlyph,
        data: body.data || {},
        recipient: body.recipient,
        sender: body.sender,
        timestamp,
      },
      selfAttestInstructions,
    };
  });

  /**
   * POST /message/batch-hash
   *
   * Compute hashes for multiple messages at once.
   * Useful for batch processing without wallet.
   */
  fastify.post<{ Body: { messages: HashBody[] } }>('/message/batch-hash', {
    schema: {
      body: {
        type: 'object',
        required: ['messages'],
        properties: {
          messages: {
            type: 'array',
            items: {
              type: 'object',
              required: ['glyph'],
              properties: {
                glyph: { type: 'string' },
                data: { type: 'object' },
                recipient: { type: 'string' },
                sender: { type: 'string' },
                timestamp: { type: 'number' },
              },
            },
            maxItems: 100, // Limit batch size
          },
        },
      },
    },
  }, async (request, reply) => {
    const { messages } = request.body;

    const results = messages.map((msg) => {
      const normalizedGlyph = msg.glyph.toUpperCase().trim();

      if (!GLYPH_METADATA[normalizedGlyph]) {
        return {
          success: false,
          error: `Invalid glyph: ${msg.glyph}`,
          hash: '',
          glyph: normalizedGlyph,
        };
      }

      const timestamp = msg.timestamp || Date.now();
      const messageWithTimestamp = { ...msg, glyph: normalizedGlyph, timestamp };
      const hash = computeMessageHash(messageWithTimestamp);

      return {
        success: true,
        hash,
        glyph: normalizedGlyph,
        timestamp,
      };
    });

    const successCount = results.filter((r) => r.success).length;

    return {
      success: true,
      total: messages.length,
      successful: successCount,
      failed: messages.length - successCount,
      results,
    };
  });

  /**
   * GET /message/hash-preview
   *
   * Preview what the hash would be for a query (GET request friendly).
   */
  fastify.get<{ Querystring: { glyph: string; data?: string } }>('/message/hash-preview', {
    schema: {
      querystring: {
        type: 'object',
        required: ['glyph'],
        properties: {
          glyph: { type: 'string' },
          data: { type: 'string' }, // JSON string
        },
      },
    },
  }, async (request, reply) => {
    const { glyph, data } = request.query;

    const normalizedGlyph = glyph.toUpperCase().trim();

    if (!GLYPH_METADATA[normalizedGlyph]) {
      return reply.status(400).send({
        error: `Invalid glyph ID. Valid: ${Object.keys(GLYPH_METADATA).join(', ')}`,
      });
    }

    let parsedData = {};
    if (data) {
      try {
        parsedData = JSON.parse(data);
      } catch {
        return reply.status(400).send({ error: 'Invalid JSON in data parameter' });
      }
    }

    const timestamp = Date.now();
    const message = { glyph: normalizedGlyph, data: parsedData, timestamp };
    const hash = computeMessageHash(message);

    return {
      hash,
      glyph: normalizedGlyph,
      glyphMetadata: GLYPH_METADATA[normalizedGlyph],
      timestamp,
      note: 'This is a preview hash. Use POST /message/hash for full response with self-attest instructions.',
    };
  });
};
