// Contract ABIs for viem interactions

export const AyniRegistryABI = [
  {
    inputs: [],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [{ internalType: 'string', name: 'id', type: 'string' }],
    name: 'activateGlyph',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'string', name: 'id', type: 'string' }],
    name: 'deactivateGlyph',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getActiveGlyphs',
    outputs: [
      {
        components: [
          { internalType: 'string', name: 'id', type: 'string' },
          { internalType: 'string', name: 'meaning', type: 'string' },
          { internalType: 'string', name: 'pose', type: 'string' },
          { internalType: 'string', name: 'symbol', type: 'string' },
          { internalType: 'bytes32', name: 'visualHash', type: 'bytes32' },
          { internalType: 'bool', name: 'active', type: 'bool' },
        ],
        internalType: 'struct AyniRegistry.Glyph[]',
        name: '',
        type: 'tuple[]',
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
        components: [
          { internalType: 'string', name: 'id', type: 'string' },
          { internalType: 'string', name: 'meaning', type: 'string' },
          { internalType: 'string', name: 'pose', type: 'string' },
          { internalType: 'string', name: 'symbol', type: 'string' },
          { internalType: 'bytes32', name: 'visualHash', type: 'bytes32' },
          { internalType: 'bool', name: 'active', type: 'bool' },
        ],
        internalType: 'struct AyniRegistry.Glyph[]',
        name: '',
        type: 'tuple[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'string', name: 'id', type: 'string' }],
    name: 'getGlyph',
    outputs: [
      {
        components: [
          { internalType: 'string', name: 'id', type: 'string' },
          { internalType: 'string', name: 'meaning', type: 'string' },
          { internalType: 'string', name: 'pose', type: 'string' },
          { internalType: 'string', name: 'symbol', type: 'string' },
          { internalType: 'bytes32', name: 'visualHash', type: 'bytes32' },
          { internalType: 'bool', name: 'active', type: 'bool' },
        ],
        internalType: 'struct AyniRegistry.Glyph',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getGlyphCount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'string', name: 'id', type: 'string' }],
    name: 'glyphExists',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'string', name: 'id', type: 'string' }],
    name: 'isGlyphActive',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          { internalType: 'string', name: 'id', type: 'string' },
          { internalType: 'string', name: 'meaning', type: 'string' },
          { internalType: 'string', name: 'pose', type: 'string' },
          { internalType: 'string', name: 'symbol', type: 'string' },
          { internalType: 'bytes32', name: 'visualHash', type: 'bytes32' },
          { internalType: 'bool', name: 'active', type: 'bool' },
        ],
        internalType: 'struct AyniRegistry.Glyph',
        name: 'glyph',
        type: 'tuple',
      },
    ],
    name: 'registerGlyph',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

export const MessageAttestationABI = [
  {
    inputs: [
      { internalType: 'bytes32', name: 'messageHash', type: 'bytes32' },
      { internalType: 'string', name: 'glyphId', type: 'string' },
      { internalType: 'address', name: 'recipient', type: 'address' },
    ],
    name: 'attest',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'messageHash', type: 'bytes32' },
      { internalType: 'string', name: 'glyphId', type: 'string' },
    ],
    name: 'attestSimple',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'attestationCount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'sender', type: 'address' }],
    name: 'getAttestationCount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'sender', type: 'address' },
      { internalType: 'uint256', name: 'offset', type: 'uint256' },
      { internalType: 'uint256', name: 'limit', type: 'uint256' },
    ],
    name: 'getAttestationHashes',
    outputs: [{ internalType: 'bytes32[]', name: '', type: 'bytes32[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'sender', type: 'address' }],
    name: 'getAttestations',
    outputs: [
      {
        components: [
          { internalType: 'bytes32', name: 'messageHash', type: 'bytes32' },
          { internalType: 'address', name: 'sender', type: 'address' },
          { internalType: 'uint256', name: 'timestamp', type: 'uint256' },
          { internalType: 'string', name: 'glyphId', type: 'string' },
          { internalType: 'address', name: 'recipient', type: 'address' },
        ],
        internalType: 'struct MessageAttestation.Attestation[]',
        name: '',
        type: 'tuple[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'recipient', type: 'address' }],
    name: 'getReceivedAttestations',
    outputs: [
      {
        components: [
          { internalType: 'bytes32', name: 'messageHash', type: 'bytes32' },
          { internalType: 'address', name: 'sender', type: 'address' },
          { internalType: 'uint256', name: 'timestamp', type: 'uint256' },
          { internalType: 'string', name: 'glyphId', type: 'string' },
          { internalType: 'address', name: 'recipient', type: 'address' },
        ],
        internalType: 'struct MessageAttestation.Attestation[]',
        name: '',
        type: 'tuple[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes32', name: 'messageHash', type: 'bytes32' }],
    name: 'isAttested',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes32', name: 'messageHash', type: 'bytes32' }],
    name: 'verify',
    outputs: [
      {
        components: [
          { internalType: 'bytes32', name: 'messageHash', type: 'bytes32' },
          { internalType: 'address', name: 'sender', type: 'address' },
          { internalType: 'uint256', name: 'timestamp', type: 'uint256' },
          { internalType: 'string', name: 'glyphId', type: 'string' },
          { internalType: 'address', name: 'recipient', type: 'address' },
        ],
        internalType: 'struct MessageAttestation.Attestation',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'messageHash', type: 'bytes32' },
      { internalType: 'address', name: 'expectedSender', type: 'address' },
    ],
    name: 'verifyFrom',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'bytes32', name: 'messageHash', type: 'bytes32' },
      { indexed: true, internalType: 'address', name: 'sender', type: 'address' },
      { indexed: true, internalType: 'address', name: 'recipient', type: 'address' },
      { indexed: false, internalType: 'string', name: 'glyphId', type: 'string' },
      { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
    ],
    name: 'MessageAttested',
    type: 'event',
  },
] as const;

export const AgentRegistryABI = [
  {
    inputs: [],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'activateAgent',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'deactivateAgent',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'string', name: 'protocol', type: 'string' }],
    name: 'findByProtocol',
    outputs: [{ internalType: 'uint256[]', name: '', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'offset', type: 'uint256' },
      { internalType: 'uint256', name: 'limit', type: 'uint256' },
    ],
    name: 'getActiveAgents',
    outputs: [
      {
        components: [
          { internalType: 'string', name: 'name', type: 'string' },
          { internalType: 'string', name: 'serviceUrl', type: 'string' },
          { internalType: 'string[]', name: 'protocols', type: 'string[]' },
          { internalType: 'string', name: 'agentCard', type: 'string' },
          { internalType: 'uint256', name: 'registeredAt', type: 'uint256' },
          { internalType: 'bool', name: 'active', type: 'bool' },
        ],
        internalType: 'struct AgentRegistry.Agent[]',
        name: '',
        type: 'tuple[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'getAgent',
    outputs: [
      {
        components: [
          { internalType: 'string', name: 'name', type: 'string' },
          { internalType: 'string', name: 'serviceUrl', type: 'string' },
          { internalType: 'string[]', name: 'protocols', type: 'string[]' },
          { internalType: 'string', name: 'agentCard', type: 'string' },
          { internalType: 'uint256', name: 'registeredAt', type: 'uint256' },
          { internalType: 'bool', name: 'active', type: 'bool' },
        ],
        internalType: 'struct AgentRegistry.Agent',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'owner', type: 'address' }],
    name: 'getAgentByOwner',
    outputs: [
      {
        components: [
          { internalType: 'string', name: 'name', type: 'string' },
          { internalType: 'string', name: 'serviceUrl', type: 'string' },
          { internalType: 'string[]', name: 'protocols', type: 'string[]' },
          { internalType: 'string', name: 'agentCard', type: 'string' },
          { internalType: 'uint256', name: 'registeredAt', type: 'uint256' },
          { internalType: 'bool', name: 'active', type: 'bool' },
        ],
        internalType: 'struct AgentRegistry.Agent',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getAgentCount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'owner', type: 'address' }],
    name: 'getTokenIdByOwner',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'addr', type: 'address' }],
    name: 'hasAgent',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'isActive',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          { internalType: 'string', name: 'name', type: 'string' },
          { internalType: 'string', name: 'serviceUrl', type: 'string' },
          { internalType: 'string[]', name: 'protocols', type: 'string[]' },
          { internalType: 'string', name: 'agentCard', type: 'string' },
          { internalType: 'uint256', name: 'registeredAt', type: 'uint256' },
          { internalType: 'bool', name: 'active', type: 'bool' },
        ],
        internalType: 'struct AgentRegistry.Agent',
        name: 'agent',
        type: 'tuple',
      },
    ],
    name: 'registerAgent',
    outputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
      {
        components: [
          { internalType: 'string', name: 'name', type: 'string' },
          { internalType: 'string', name: 'serviceUrl', type: 'string' },
          { internalType: 'string[]', name: 'protocols', type: 'string[]' },
          { internalType: 'string', name: 'agentCard', type: 'string' },
          { internalType: 'uint256', name: 'registeredAt', type: 'uint256' },
          { internalType: 'bool', name: 'active', type: 'bool' },
        ],
        internalType: 'struct AgentRegistry.Agent',
        name: 'agent',
        type: 'tuple',
      },
    ],
    name: 'updateAgent',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'tokenId', type: 'uint256' },
      { indexed: true, internalType: 'address', name: 'owner', type: 'address' },
      { indexed: false, internalType: 'string', name: 'name', type: 'string' },
      { indexed: false, internalType: 'string', name: 'serviceUrl', type: 'string' },
    ],
    name: 'AgentRegistered',
    type: 'event',
  },
] as const;
