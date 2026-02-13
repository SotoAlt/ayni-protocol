import { FastifyPluginAsync } from 'fastify';
import { createPublicClient, createWalletClient, http, keccak256, toBytes } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { monadTestnet, contracts, pricing } from '../config.js';
import { MessageAttestationABI } from '../contracts.js';
import { broadcastMessage } from './stream.js';
import { proposalStore } from '../knowledge/patterns.js';
import db from '../db.js';

interface SendBody {
  glyph: string;
  data?: Record<string, unknown>;
  recipient: string; // Address or endpoint URL
  sender?: string; // Sender address for broadcast
  encryptedPayload?: string; // Base64 encrypted data
}

interface SendResponse {
  success: boolean;
  messageHash: string;
  glyphId: string;
  recipient: string;
  timestamp: number;
  transactionHash?: string;
  relayStatus?: string;
  error?: string;
}

const AGORA_MAX_FIELD_LENGTH = 200;

const serverPrivateKey = process.env.SERVER_PRIVATE_KEY || '0x0000000000000000000000000000000000000000000000000000000000000001';
const serverAccount = privateKeyToAccount(serverPrivateKey as `0x${string}`);

const publicClient = createPublicClient({
  chain: monadTestnet,
  transport: http(),
});

const walletClient = createWalletClient({
  account: serverAccount,
  chain: monadTestnet,
  transport: http(),
});

function computeMessageHash(message: {
  glyph: string;
  data?: Record<string, unknown>;
  recipient: string;
  timestamp: number;
}): `0x${string}` {
  const messageString = JSON.stringify(message);
  return keccak256(toBytes(messageString));
}

async function relayToRecipient(endpoint: string, message: object): Promise<{ success: boolean; error?: string }> {
  // Validate URL scheme
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    return { success: false, error: 'Invalid relay URL' };
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { success: false, error: 'Only http/https relay URLs are allowed' };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
      signal: controller.signal,
    });

    if (!response.ok) {
      return { success: false, error: `Relay failed: ${response.status}` };
    }

    return { success: true };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { success: false, error: 'Relay timeout (10s)' };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Relay failed',
    };
  } finally {
    clearTimeout(timeout);
  }
}

export const sendRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post<{ Body: SendBody }>('/send', {
    config: { rateLimit: { max: 20, timeWindow: '1 minute' } },
    schema: {
      body: {
        type: 'object',
        required: ['glyph', 'recipient'],
        properties: {
          glyph: { type: 'string' },
          data: { type: 'object' },
          recipient: { type: 'string' },
          sender: { type: 'string' },
          encryptedPayload: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            messageHash: { type: 'string' },
            glyphId: { type: 'string' },
            recipient: { type: 'string' },
            timestamp: { type: 'number' },
            transactionHash: { type: 'string' },
            relayStatus: { type: 'string' },
            error: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { glyph, data, recipient, sender, encryptedPayload } = request.body;

    const normalizedGlyph = glyph.toUpperCase().trim();
    const timestamp = Date.now();
    const isAgora = recipient.toLowerCase() === 'agora';

    if (isAgora) {
      if (!sender) {
        return reply.status(400).send({ error: 'sender is required for agora messages' });
      }
      const agent = db.prepare('SELECT address FROM agents WHERE name = ?').get(sender) as { address: string } | undefined;
      if (!agent) {
        return reply.status(403).send({
          error: 'Registration required. Use POST /agents/register or ayni_identify first.',
        });
      }
      if (data) {
        for (const [key, value] of Object.entries(data)) {
          if (typeof value === 'string' && value.length > AGORA_MAX_FIELD_LENGTH) {
            return reply.status(400).send({
              error: `data.${key} exceeds ${AGORA_MAX_FIELD_LENGTH} chars. Agora uses structured metadata, not natural language.`,
            });
          }
        }
      }
    }

    // Compute message hash
    const messageHash = computeMessageHash({
      glyph: normalizedGlyph,
      data,
      recipient,
      timestamp,
    });

    const response: SendResponse = {
      success: false,
      messageHash,
      glyphId: normalizedGlyph,
      recipient,
      timestamp,
    };

    // Agora messages skip attestation and relay
    if (isAgora) {
      response.success = true;
      response.relayStatus = 'agora';

      proposalStore.useCompound(normalizedGlyph);
      proposalStore.useCustomGlyph(normalizedGlyph);

      broadcastMessage({
        glyph: normalizedGlyph,
        data,
        sender,
        recipient: 'agora',
        timestamp,
        messageHash,
        encrypted: false,
      });

      return response;
    }

    // Step 1: Attest on-chain
    if (contracts.messageAttestation !== '0x0000000000000000000000000000000000000000') {
      try {
        const recipientAddress = recipient.startsWith('0x')
          ? (recipient as `0x${string}`)
          : '0x0000000000000000000000000000000000000000';

        const hash = await walletClient.writeContract({
          address: contracts.messageAttestation as `0x${string}`,
          abi: MessageAttestationABI,
          functionName: 'attest',
          args: [messageHash, normalizedGlyph, recipientAddress],
        });

        await publicClient.waitForTransactionReceipt({ hash });
        response.transactionHash = hash;
      } catch (error) {
        // Log but continue - relay is still valuable
        fastify.log.error({ err: error }, 'Attestation failed');
      }
    } else {
      response.transactionHash = '0x' + 'mock'.repeat(16);
    }

    // Step 2: Relay to recipient (if URL endpoint)
    if (recipient.startsWith('http')) {
      const message = {
        glyph: normalizedGlyph,
        data,
        encryptedPayload,
        timestamp,
        messageHash,
        transactionHash: response.transactionHash,
      };

      const relayResult = await relayToRecipient(recipient, message);

      if (relayResult.success) {
        response.relayStatus = 'delivered';
      } else {
        response.relayStatus = 'failed';
        response.error = relayResult.error;
      }
    } else {
      response.relayStatus = 'not_relayed';
    }

    response.success = response.transactionHash !== undefined;

    if (!response.success) {
      return reply.status(500).send(response);
    }

    // Track usage for community-created glyphs (no-op if glyphId is a hardcoded glyph)
    proposalStore.useCompound(normalizedGlyph);
    proposalStore.useCustomGlyph(normalizedGlyph);

    // Broadcast to WebSocket clients
    broadcastMessage({
      glyph: normalizedGlyph,
      data,
      sender,
      recipient,
      timestamp,
      messageHash,
      transactionHash: response.transactionHash,
      encrypted: !!encryptedPayload,
    });

    return response;
  });

  // Batch send to multiple recipients
  fastify.post<{
    Body: {
      glyph: string;
      data?: Record<string, unknown>;
      recipients: string[];
    }
  }>('/send/batch', {
    schema: {
      body: {
        type: 'object',
        required: ['glyph', 'recipients'],
        properties: {
          glyph: { type: 'string' },
          data: { type: 'object' },
          recipients: {
            type: 'array',
            items: { type: 'string' },
            minItems: 1,
            maxItems: 10,
          },
        },
      },
    },
  }, async (request) => {
    const { glyph, data, recipients } = request.body;
    const normalizedGlyph = glyph.toUpperCase().trim();

    const results = recipients.map((recipient) => {
      const timestamp = Date.now();
      const messageHash = computeMessageHash({
        glyph: normalizedGlyph,
        data,
        recipient,
        timestamp,
      });

      return {
        recipient,
        messageHash,
        glyphId: normalizedGlyph,
        timestamp,
        success: true,
        transactionHash: '0x' + 'mock'.repeat(16),
      };
    });

    return {
      count: results.length,
      successful: results.filter((r) => r.success).length,
      results,
      pricing: `${pricing.send} MON per message`,
    };
  });
};
