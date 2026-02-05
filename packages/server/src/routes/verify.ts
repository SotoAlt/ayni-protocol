import { FastifyPluginAsync } from 'fastify';
import { createPublicClient, http } from 'viem';
import { monadTestnet, contracts } from '../config.js';
import { MessageAttestationABI } from '../contracts.js';

interface Attestation {
  messageHash: string;
  sender: string;
  timestamp: number;
  glyphId: string;
  recipient: string;
  attested: boolean;
}

const publicClient = createPublicClient({
  chain: monadTestnet,
  transport: http(),
});

export const verifyRoute: FastifyPluginAsync = async (fastify) => {
  // Verify single message hash
  fastify.get<{ Params: { hash: string } }>('/verify/:hash', {
    schema: {
      params: {
        type: 'object',
        required: ['hash'],
        properties: {
          hash: { type: 'string', pattern: '^0x[a-fA-F0-9]{64}$' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            messageHash: { type: 'string' },
            attested: { type: 'boolean' },
            sender: { type: 'string' },
            timestamp: { type: 'number' },
            glyphId: { type: 'string' },
            recipient: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { hash } = request.params;

    if (contracts.messageAttestation === '0x0000000000000000000000000000000000000000') {
      // Mock response for development
      return {
        messageHash: hash,
        attested: false,
        note: 'Contracts not yet deployed',
      };
    }

    try {
      const result = await publicClient.readContract({
        address: contracts.messageAttestation as `0x${string}`,
        abi: MessageAttestationABI,
        functionName: 'verify',
        args: [hash as `0x${string}`],
      }) as unknown as [string, string, bigint, string, string];

      const [messageHash, sender, timestamp, glyphId, recipient] = result;

      // Check if attested (timestamp > 0)
      const attested = timestamp > 0n;

      return {
        messageHash,
        attested,
        sender: attested ? sender : '',
        timestamp: attested ? Number(timestamp) : 0,
        glyphId: attested ? glyphId : '',
        recipient: attested ? recipient : '',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({
        messageHash: hash,
        attested: false,
        error: errorMessage,
      });
    }
  });

  // Check if message is attested (simple boolean)
  fastify.get<{ Params: { hash: string } }>('/verify/:hash/exists', {
    schema: {
      params: {
        type: 'object',
        required: ['hash'],
        properties: {
          hash: { type: 'string', pattern: '^0x[a-fA-F0-9]{64}$' },
        },
      },
    },
  }, async (request) => {
    const { hash } = request.params;

    if (contracts.messageAttestation === '0x0000000000000000000000000000000000000000') {
      return { hash, exists: false, note: 'Contracts not yet deployed' };
    }

    try {
      const exists = await publicClient.readContract({
        address: contracts.messageAttestation as `0x${string}`,
        abi: MessageAttestationABI,
        functionName: 'isAttested',
        args: [hash as `0x${string}`],
      });

      return { hash, exists };
    } catch {
      return { hash, exists: false };
    }
  });

  // Get attestations by sender
  fastify.get<{ Params: { address: string } }>('/verify/sender/:address', {
    schema: {
      params: {
        type: 'object',
        required: ['address'],
        properties: {
          address: { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$' },
        },
      },
    },
  }, async (request) => {
    const { address } = request.params;

    if (contracts.messageAttestation === '0x0000000000000000000000000000000000000000') {
      return {
        sender: address,
        attestations: [],
        count: 0,
        note: 'Contracts not yet deployed',
      };
    }

    try {
      const result = await publicClient.readContract({
        address: contracts.messageAttestation as `0x${string}`,
        abi: MessageAttestationABI,
        functionName: 'getAttestations',
        args: [address as `0x${string}`],
      }) as unknown as Array<[string, string, bigint, string, string]>;

      const attestations: Attestation[] = result.map(([messageHash, sender, timestamp, glyphId, recipient]) => ({
        messageHash,
        sender,
        timestamp: Number(timestamp),
        glyphId,
        recipient,
        attested: true,
      }));

      return {
        sender: address,
        attestations,
        count: attestations.length,
      };
    } catch (error) {
      return {
        sender: address,
        attestations: [],
        count: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Get attestations received by address
  fastify.get<{ Params: { address: string } }>('/verify/recipient/:address', {
    schema: {
      params: {
        type: 'object',
        required: ['address'],
        properties: {
          address: { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$' },
        },
      },
    },
  }, async (request) => {
    const { address } = request.params;

    if (contracts.messageAttestation === '0x0000000000000000000000000000000000000000') {
      return {
        recipient: address,
        attestations: [],
        count: 0,
        note: 'Contracts not yet deployed',
      };
    }

    try {
      const result = await publicClient.readContract({
        address: contracts.messageAttestation as `0x${string}`,
        abi: MessageAttestationABI,
        functionName: 'getReceivedAttestations',
        args: [address as `0x${string}`],
      }) as unknown as Array<[string, string, bigint, string, string]>;

      const attestations: Attestation[] = result.map(([messageHash, sender, timestamp, glyphId, recipient]) => ({
        messageHash,
        sender,
        timestamp: Number(timestamp),
        glyphId,
        recipient,
        attested: true,
      }));

      return {
        recipient: address,
        attestations,
        count: attestations.length,
      };
    } catch (error) {
      return {
        recipient: address,
        attestations: [],
        count: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
};
