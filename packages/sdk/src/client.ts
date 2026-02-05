import { type Account } from 'viem';
import { AyniContracts, type ContractAddresses } from './contracts.js';
import { AyniMessage, type MessageOptions, type EncodedMessage } from './message.js';
import { type GlyphId, encodeIntent, decodeGlyph, GLYPH_LIBRARY } from './glyphs.js';

/**
 * Configuration for AyniClient
 */
export interface AyniClientConfig {
  /**
   * Contract addresses (for direct chain interaction)
   */
  contracts?: ContractAddresses;

  /**
   * Server URL (for API-mediated interaction)
   */
  serverUrl?: string;

  /**
   * Account for signing transactions
   */
  account?: Account;

  /**
   * Use server API instead of direct contract calls
   */
  useServer?: boolean;
}

interface ServerResponse<T> {
  success?: boolean;
  error?: string;
  [key: string]: unknown;
}

/**
 * AyniClient - High-level client for Ayni Protocol
 *
 * Supports both direct contract calls (fully decentralized) and
 * server API calls (convenience).
 */
export class AyniClient {
  private contracts: AyniContracts | null = null;
  private serverUrl: string | null = null;
  private useServer: boolean;

  constructor(config: AyniClientConfig = {}) {
    if (config.contracts) {
      this.contracts = new AyniContracts(config.contracts, config.account);
    }

    this.serverUrl = config.serverUrl || null;
    this.useServer = config.useServer ?? (this.serverUrl !== null);
  }

  /**
   * Encode text intent to glyph
   */
  encode(text: string): GlyphId | null {
    return encodeIntent(text);
  }

  /**
   * Decode glyph ID to full information
   */
  decode(id: string) {
    return decodeGlyph(id);
  }

  /**
   * Get all available glyphs
   */
  getGlyphs() {
    return Object.values(GLYPH_LIBRARY);
  }

  /**
   * Create a new message
   */
  createMessage(options: MessageOptions): AyniMessage {
    return new AyniMessage(options);
  }

  /**
   * Create a query message
   */
  query(data: Record<string, unknown>, recipient?: `0x${string}`): AyniMessage {
    return AyniMessage.query(data, recipient);
  }

  /**
   * Create a response message
   */
  respond(data: Record<string, unknown>, recipient?: `0x${string}`): AyniMessage {
    return AyniMessage.response(data, recipient);
  }

  /**
   * Create an error message
   */
  error(message: string, recipient?: `0x${string}`): AyniMessage {
    return AyniMessage.error(message, recipient);
  }

  /**
   * Create an action message
   */
  action(action: string, params: Record<string, unknown>, recipient?: `0x${string}`): AyniMessage {
    return AyniMessage.action(action, params, recipient);
  }

  /**
   * Attest a message on-chain
   */
  async attest(message: AyniMessage): Promise<{ hash: string; txHash?: string }> {
    const { hash, glyphId, recipient } = message.encodeForChain();

    if (this.useServer && this.serverUrl) {
      return this.attestViaServer(message);
    }

    if (!this.contracts) {
      throw new Error('Contracts not configured. Provide contracts or serverUrl.');
    }

    const receipt = await this.contracts.attest(hash, glyphId, recipient);

    return {
      hash,
      txHash: receipt.transactionHash,
    };
  }

  /**
   * Attest via server API
   */
  private async attestViaServer(message: AyniMessage): Promise<{ hash: string; txHash?: string }> {
    if (!this.serverUrl) throw new Error('Server URL not configured');

    const response = await fetch(`${this.serverUrl}/attest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: {
          glyph: message.glyph,
          data: message.data,
          recipient: message.recipient,
          timestamp: message.timestamp,
        },
      }),
    });

    const result = await response.json() as ServerResponse<{ messageHash: string; transactionHash?: string }>;

    if (!response.ok) {
      throw new Error(result.error || 'Attestation failed');
    }

    return {
      hash: result.messageHash as string,
      txHash: result.transactionHash as string | undefined,
    };
  }

  /**
   * Verify if a message was attested
   */
  async verify(messageHash: `0x${string}`): Promise<{
    attested: boolean;
    sender?: string;
    timestamp?: number;
    glyphId?: string;
    recipient?: string;
  }> {
    if (this.useServer && this.serverUrl) {
      return this.verifyViaServer(messageHash);
    }

    if (!this.contracts) {
      throw new Error('Contracts not configured');
    }

    const result = await this.contracts.verify(messageHash);
    const [hash, sender, timestamp, glyphId, recipient] = result as [string, string, bigint, string, string];

    const attested = timestamp > 0n;

    return {
      attested,
      sender: attested ? sender : undefined,
      timestamp: attested ? Number(timestamp) : undefined,
      glyphId: attested ? glyphId : undefined,
      recipient: attested ? recipient : undefined,
    };
  }

  /**
   * Verify via server API
   */
  private async verifyViaServer(messageHash: string): Promise<{
    attested: boolean;
    sender?: string;
    timestamp?: number;
    glyphId?: string;
    recipient?: string;
  }> {
    if (!this.serverUrl) throw new Error('Server URL not configured');

    const response = await fetch(`${this.serverUrl}/verify/${messageHash}`);
    const result = await response.json() as ServerResponse<{
      attested: boolean;
      sender?: string;
      timestamp?: number;
      glyphId?: string;
      recipient?: string;
    }>;

    return {
      attested: result.attested as boolean,
      sender: result.sender as string | undefined,
      timestamp: result.timestamp as number | undefined,
      glyphId: result.glyphId as string | undefined,
      recipient: result.recipient as string | undefined,
    };
  }

  /**
   * Send a message (attest + relay)
   */
  async send(message: AyniMessage, endpoint?: string): Promise<{
    hash: string;
    txHash?: string;
    relayed?: boolean;
  }> {
    if (this.useServer && this.serverUrl) {
      return this.sendViaServer(message, endpoint);
    }

    // Direct mode: just attest
    const { hash, txHash } = await this.attest(message);

    // Manual relay if endpoint provided
    if (endpoint) {
      try {
        await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(message.encode()),
        });
        return { hash, txHash, relayed: true };
      } catch {
        return { hash, txHash, relayed: false };
      }
    }

    return { hash, txHash };
  }

  /**
   * Send via server API
   */
  private async sendViaServer(message: AyniMessage, endpoint?: string): Promise<{
    hash: string;
    txHash?: string;
    relayed?: boolean;
  }> {
    if (!this.serverUrl) throw new Error('Server URL not configured');

    const response = await fetch(`${this.serverUrl}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        glyph: message.glyph,
        data: message.data,
        recipient: endpoint || message.recipient,
      }),
    });

    const result = await response.json() as ServerResponse<{
      messageHash: string;
      transactionHash?: string;
      relayStatus?: string;
    }>;

    return {
      hash: result.messageHash as string,
      txHash: result.transactionHash as string | undefined,
      relayed: result.relayStatus === 'delivered',
    };
  }

  /**
   * Register an agent on-chain
   */
  async registerAgent(agent: {
    name: string;
    serviceUrl: string;
    protocols: string[];
    agentCard?: string;
  }): Promise<{ tokenId?: bigint; txHash?: string }> {
    if (!this.contracts) {
      throw new Error('Contracts not configured');
    }

    const receipt = await this.contracts.registerAgent({
      name: agent.name,
      serviceUrl: agent.serviceUrl,
      protocols: agent.protocols,
      agentCard: agent.agentCard || '',
    });

    // Extract tokenId from logs if available
    // For now, just return the tx hash
    return {
      txHash: receipt.transactionHash,
    };
  }

  /**
   * Find agents by protocol
   */
  async findAgents(protocol: string): Promise<bigint[]> {
    if (!this.contracts) {
      throw new Error('Contracts not configured');
    }

    return this.contracts.findByProtocol(protocol) as Promise<bigint[]>;
  }

  /**
   * Get agent details
   */
  async getAgent(tokenId: bigint) {
    if (!this.contracts) {
      throw new Error('Contracts not configured');
    }

    return this.contracts.getAgent(tokenId);
  }
}
