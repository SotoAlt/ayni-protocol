import {
  createPublicClient,
  createWalletClient,
  http,
  type PublicClient,
  type WalletClient,
  type Account,
} from 'viem';
import { monadTestnet } from './chain.js';

/**
 * Contract addresses configuration
 */
export interface ContractAddresses {
  ayniRegistry: `0x${string}`;
  messageAttestation: `0x${string}`;
  agentRegistry: `0x${string}`;
}

// Contract ABIs (simplified for SDK)
export const AyniRegistryABI = [
  {
    inputs: [{ type: 'string', name: 'id' }],
    name: 'getGlyph',
    outputs: [
      {
        type: 'tuple',
        components: [
          { type: 'string', name: 'id' },
          { type: 'string', name: 'meaning' },
          { type: 'string', name: 'pose' },
          { type: 'string', name: 'symbol' },
          { type: 'bytes32', name: 'visualHash' },
          { type: 'bool', name: 'active' },
        ],
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getAllGlyphs',
    outputs: [
      {
        type: 'tuple[]',
        components: [
          { type: 'string', name: 'id' },
          { type: 'string', name: 'meaning' },
          { type: 'string', name: 'pose' },
          { type: 'string', name: 'symbol' },
          { type: 'bytes32', name: 'visualHash' },
          { type: 'bool', name: 'active' },
        ],
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ type: 'string', name: 'id' }],
    name: 'isGlyphActive',
    outputs: [{ type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export const MessageAttestationABI = [
  {
    inputs: [
      { type: 'bytes32', name: 'messageHash' },
      { type: 'string', name: 'glyphId' },
      { type: 'address', name: 'recipient' },
    ],
    name: 'attest',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { type: 'bytes32', name: 'messageHash' },
      { type: 'string', name: 'glyphId' },
    ],
    name: 'attestSimple',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ type: 'bytes32', name: 'messageHash' }],
    name: 'verify',
    outputs: [
      {
        type: 'tuple',
        components: [
          { type: 'bytes32', name: 'messageHash' },
          { type: 'address', name: 'sender' },
          { type: 'uint256', name: 'timestamp' },
          { type: 'string', name: 'glyphId' },
          { type: 'address', name: 'recipient' },
        ],
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ type: 'bytes32', name: 'messageHash' }],
    name: 'isAttested',
    outputs: [{ type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ type: 'address', name: 'sender' }],
    name: 'getAttestations',
    outputs: [
      {
        type: 'tuple[]',
        components: [
          { type: 'bytes32', name: 'messageHash' },
          { type: 'address', name: 'sender' },
          { type: 'uint256', name: 'timestamp' },
          { type: 'string', name: 'glyphId' },
          { type: 'address', name: 'recipient' },
        ],
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export const AgentRegistryABI = [
  {
    inputs: [
      {
        type: 'tuple',
        name: 'agent',
        components: [
          { type: 'string', name: 'name' },
          { type: 'string', name: 'serviceUrl' },
          { type: 'string[]', name: 'protocols' },
          { type: 'string', name: 'agentCard' },
          { type: 'uint256', name: 'registeredAt' },
          { type: 'bool', name: 'active' },
        ],
      },
    ],
    name: 'registerAgent',
    outputs: [{ type: 'uint256', name: 'tokenId' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ type: 'uint256', name: 'tokenId' }],
    name: 'getAgent',
    outputs: [
      {
        type: 'tuple',
        components: [
          { type: 'string', name: 'name' },
          { type: 'string', name: 'serviceUrl' },
          { type: 'string[]', name: 'protocols' },
          { type: 'string', name: 'agentCard' },
          { type: 'uint256', name: 'registeredAt' },
          { type: 'bool', name: 'active' },
        ],
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ type: 'address', name: 'owner' }],
    name: 'getAgentByOwner',
    outputs: [
      {
        type: 'tuple',
        components: [
          { type: 'string', name: 'name' },
          { type: 'string', name: 'serviceUrl' },
          { type: 'string[]', name: 'protocols' },
          { type: 'string', name: 'agentCard' },
          { type: 'uint256', name: 'registeredAt' },
          { type: 'bool', name: 'active' },
        ],
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ type: 'address', name: 'addr' }],
    name: 'hasAgent',
    outputs: [{ type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ type: 'string', name: 'protocol' }],
    name: 'findByProtocol',
    outputs: [{ type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

/**
 * AyniContracts - Direct contract interactions
 */
export class AyniContracts {
  public readonly addresses: ContractAddresses;
  private publicClient: PublicClient;
  private walletClient: WalletClient | null = null;

  constructor(addresses: ContractAddresses, account?: Account) {
    this.addresses = addresses;
    this.publicClient = createPublicClient({
      chain: monadTestnet,
      transport: http(),
    });

    if (account) {
      this.walletClient = createWalletClient({
        account,
        chain: monadTestnet,
        transport: http(),
      });
    }
  }

  /**
   * Set wallet for write operations
   */
  setAccount(account: Account): void {
    this.walletClient = createWalletClient({
      account,
      chain: monadTestnet,
      transport: http(),
    });
  }

  // === Glyph Registry ===

  async getGlyph(id: string) {
    return this.publicClient.readContract({
      address: this.addresses.ayniRegistry,
      abi: AyniRegistryABI,
      functionName: 'getGlyph',
      args: [id],
    });
  }

  async getAllGlyphs() {
    return this.publicClient.readContract({
      address: this.addresses.ayniRegistry,
      abi: AyniRegistryABI,
      functionName: 'getAllGlyphs',
    });
  }

  async isGlyphActive(id: string) {
    return this.publicClient.readContract({
      address: this.addresses.ayniRegistry,
      abi: AyniRegistryABI,
      functionName: 'isGlyphActive',
      args: [id],
    });
  }

  // === Message Attestation ===

  async attest(messageHash: `0x${string}`, glyphId: string, recipient: `0x${string}`) {
    if (!this.walletClient) throw new Error('Wallet not configured');

    const hash = await this.walletClient.writeContract({
      address: this.addresses.messageAttestation,
      abi: MessageAttestationABI,
      functionName: 'attest',
      args: [messageHash, glyphId, recipient],
    });

    return this.publicClient.waitForTransactionReceipt({ hash });
  }

  async attestSimple(messageHash: `0x${string}`, glyphId: string) {
    if (!this.walletClient) throw new Error('Wallet not configured');

    const hash = await this.walletClient.writeContract({
      address: this.addresses.messageAttestation,
      abi: MessageAttestationABI,
      functionName: 'attestSimple',
      args: [messageHash, glyphId],
    });

    return this.publicClient.waitForTransactionReceipt({ hash });
  }

  async verify(messageHash: `0x${string}`) {
    return this.publicClient.readContract({
      address: this.addresses.messageAttestation,
      abi: MessageAttestationABI,
      functionName: 'verify',
      args: [messageHash],
    });
  }

  async isAttested(messageHash: `0x${string}`) {
    return this.publicClient.readContract({
      address: this.addresses.messageAttestation,
      abi: MessageAttestationABI,
      functionName: 'isAttested',
      args: [messageHash],
    });
  }

  async getAttestations(sender: `0x${string}`) {
    return this.publicClient.readContract({
      address: this.addresses.messageAttestation,
      abi: MessageAttestationABI,
      functionName: 'getAttestations',
      args: [sender],
    });
  }

  // === Agent Registry ===

  async registerAgent(agent: {
    name: string;
    serviceUrl: string;
    protocols: string[];
    agentCard: string;
  }) {
    if (!this.walletClient) throw new Error('Wallet not configured');

    const hash = await this.walletClient.writeContract({
      address: this.addresses.agentRegistry,
      abi: AgentRegistryABI,
      functionName: 'registerAgent',
      args: [
        {
          name: agent.name,
          serviceUrl: agent.serviceUrl,
          protocols: agent.protocols,
          agentCard: agent.agentCard,
          registeredAt: 0n,
          active: true,
        },
      ],
    });

    return this.publicClient.waitForTransactionReceipt({ hash });
  }

  async getAgent(tokenId: bigint) {
    return this.publicClient.readContract({
      address: this.addresses.agentRegistry,
      abi: AgentRegistryABI,
      functionName: 'getAgent',
      args: [tokenId],
    });
  }

  async getAgentByOwner(owner: `0x${string}`) {
    return this.publicClient.readContract({
      address: this.addresses.agentRegistry,
      abi: AgentRegistryABI,
      functionName: 'getAgentByOwner',
      args: [owner],
    });
  }

  async hasAgent(address: `0x${string}`) {
    return this.publicClient.readContract({
      address: this.addresses.agentRegistry,
      abi: AgentRegistryABI,
      functionName: 'hasAgent',
      args: [address],
    });
  }

  async findByProtocol(protocol: string) {
    return this.publicClient.readContract({
      address: this.addresses.agentRegistry,
      abi: AgentRegistryABI,
      functionName: 'findByProtocol',
      args: [protocol],
    });
  }
}
