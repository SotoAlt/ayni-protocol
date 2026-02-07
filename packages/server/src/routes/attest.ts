import { FastifyPluginAsync } from 'fastify';
import { createPublicClient, createWalletClient, http, keccak256, toBytes, verifyMessage } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { monadTestnet, contracts, pricing } from '../config.js';
import { MessageAttestationABI } from '../contracts.js';

interface AttestBody {
  message: {
    glyph: string;
    data?: Record<string, unknown>;
    recipient?: string;
    timestamp?: number;
  };
  sender?: string;
  agentSignature?: string;
  agentAddress?: string;
}

// Create viem clients
const publicClient = createPublicClient({
  chain: monadTestnet,
  transport: http(),
});

// Server wallet for attestations (in production, use secure key management)
const serverPrivateKey = process.env.SERVER_PRIVATE_KEY || '0x0000000000000000000000000000000000000000000000000000000000000001';
const serverAccount = privateKeyToAccount(serverPrivateKey as `0x${string}`);

const walletClient = createWalletClient({
  account: serverAccount,
  chain: monadTestnet,
  transport: http(),
});

function computeMessageHash(message: AttestBody['message']): `0x${string}` {
  const messageString = JSON.stringify({
    glyph: message.glyph,
    data: message.data || {},
    recipient: message.recipient || '',
    timestamp: message.timestamp || Date.now(),
  });
  return keccak256(toBytes(messageString));
}

export const attestRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post<{ Body: AttestBody }>('/attest', {
    schema: {
      body: {
        type: 'object',
        required: ['message'],
        properties: {
          message: {
            type: 'object',
            required: ['glyph'],
            properties: {
              glyph: { type: 'string' },
              data: { type: 'object' },
              recipient: { type: 'string' },
              timestamp: { type: 'number' },
            },
          },
          sender: { type: 'string' },
          agentSignature: { type: 'string' },
          agentAddress: { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            transactionHash: { type: 'string' },
            messageHash: { type: 'string' },
            glyphId: { type: 'string' },
            timestamp: { type: 'number' },
            blockNumber: { type: 'number' },
            error: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { message, sender, agentSignature, agentAddress } = request.body;

    // Validate glyph ID
    const validGlyphs = ['Q01', 'R01', 'E01', 'A01'];
    const normalizedGlyph = message.glyph.toUpperCase().trim();

    if (!validGlyphs.includes(normalizedGlyph)) {
      return reply.status(400).send({
        success: false,
        error: `Invalid glyph ID. Valid: ${validGlyphs.join(', ')}`,
        messageHash: '',
        glyphId: normalizedGlyph,
        timestamp: Date.now(),
      });
    }

    // Compute message hash
    const messageHash = computeMessageHash(message);
    const timestamp = message.timestamp || Date.now();

    // Verify agent self-attestation signature if provided
    let selfAttested = false;
    if (agentSignature && agentAddress) {
      try {
        const valid = await verifyMessage({
          address: agentAddress as `0x${string}`,
          message: messageHash,
          signature: agentSignature as `0x${string}`,
        });
        selfAttested = valid;
      } catch {
        // Invalid signature — fall back to server attestation
      }
    }

    // Check if contracts are deployed
    if (contracts.messageAttestation === '0x0000000000000000000000000000000000000000') {
      // Mock response for development
      return {
        success: true,
        transactionHash: '0x' + 'mock'.repeat(16),
        messageHash,
        glyphId: normalizedGlyph,
        timestamp,
        blockNumber: 0,
        selfAttested,
        attester: selfAttested ? agentAddress : serverAccount.address,
        note: 'Mock attestation - contracts not yet deployed',
        pricing: pricing.attest + ' MON',
      };
    }

    try {
      // Submit attestation to chain
      const recipient = message.recipient as `0x${string}` || '0x0000000000000000000000000000000000000000';

      const hash = await walletClient.writeContract({
        address: contracts.messageAttestation as `0x${string}`,
        abi: MessageAttestationABI,
        functionName: 'attest',
        args: [messageHash, normalizedGlyph, recipient],
      });

      // Wait for confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      return {
        success: true,
        transactionHash: hash,
        messageHash,
        glyphId: normalizedGlyph,
        timestamp,
        blockNumber: Number(receipt.blockNumber),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({
        success: false,
        error: errorMessage,
        messageHash,
        glyphId: normalizedGlyph,
        timestamp,
      });
    }
  });

  // Simple attestation with just hash
  fastify.post<{ Body: { messageHash: string; glyphId: string } }>('/attest/simple', {
    schema: {
      body: {
        type: 'object',
        required: ['messageHash', 'glyphId'],
        properties: {
          messageHash: { type: 'string', pattern: '^0x[a-fA-F0-9]{64}$' },
          glyphId: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const { messageHash, glyphId } = request.body;

    const normalizedGlyph = glyphId.toUpperCase().trim();

    if (contracts.messageAttestation === '0x0000000000000000000000000000000000000000') {
      return {
        success: true,
        transactionHash: '0x' + 'mock'.repeat(16),
        messageHash,
        glyphId: normalizedGlyph,
        timestamp: Date.now(),
        note: 'Mock attestation - contracts not yet deployed',
      };
    }

    try {
      const hash = await walletClient.writeContract({
        address: contracts.messageAttestation as `0x${string}`,
        abi: MessageAttestationABI,
        functionName: 'attestSimple',
        args: [messageHash as `0x${string}`, normalizedGlyph],
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      return {
        success: true,
        transactionHash: hash,
        messageHash,
        glyphId: normalizedGlyph,
        timestamp: Date.now(),
        blockNumber: Number(receipt.blockNumber),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({
        success: false,
        error: errorMessage,
        messageHash,
        glyphId: normalizedGlyph,
        timestamp: Date.now(),
      });
    }
  });
};
