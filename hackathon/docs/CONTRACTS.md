# Ayni Protocol Smart Contracts

## Chain Configuration

**Network:** Monad Testnet

| Property | Value |
|----------|-------|
| Chain ID | 10143 |
| RPC URL | https://testnet-rpc.monad.xyz |
| Explorer | https://testnet.monad.xyz |
| Currency | MON |

## Contract Addresses

> **Note:** Update these addresses after deployment.

| Contract | Address | Status |
|----------|---------|--------|
| AyniRegistry | `TBD` | Not deployed |
| MessageAttestation | `TBD` | Not deployed |
| AgentRegistry | `TBD` | Not deployed |

## Contract Overview

### AyniRegistry

Stores glyph definitions. DAO-governable in future versions.

**Key Functions:**

```solidity
// Get a glyph by ID
function getGlyph(string calldata id) external view returns (Glyph memory);

// Get all glyphs
function getAllGlyphs() external view returns (Glyph[] memory);

// Check if glyph is active
function isGlyphActive(string calldata id) external view returns (bool);

// Register new glyph (owner only)
function registerGlyph(Glyph calldata glyph) external onlyOwner;
```

**Glyph Struct:**

```solidity
struct Glyph {
    string id;           // "Q01", "R01", etc.
    string meaning;      // "Query Database"
    string pose;         // "arms_up"
    string symbol;       // "database"
    bytes32 visualHash;  // Hash of visual pattern
    bool active;
}
```

**Events:**

```solidity
event GlyphRegistered(string indexed id, string meaning, string pose, string symbol);
event GlyphUpdated(string indexed id, string meaning, string pose, string symbol);
event GlyphDeactivated(string indexed id);
event GlyphActivated(string indexed id);
```

---

### MessageAttestation

Stores message hashes for trustless verification.

**Key Functions:**

```solidity
// Attest a message with recipient
function attest(
    bytes32 messageHash,
    string calldata glyphId,
    address recipient
) external;

// Attest without recipient
function attestSimple(bytes32 messageHash, string calldata glyphId) external;

// Verify a message
function verify(bytes32 messageHash) external view returns (Attestation memory);

// Check if attested
function isAttested(bytes32 messageHash) external view returns (bool);

// Get attestations by sender
function getAttestations(address sender) external view returns (Attestation[] memory);

// Get attestations received
function getReceivedAttestations(address recipient) external view returns (Attestation[] memory);
```

**Attestation Struct:**

```solidity
struct Attestation {
    bytes32 messageHash;
    address sender;
    uint256 timestamp;
    string glyphId;
    address recipient;
}
```

**Events:**

```solidity
event MessageAttested(
    bytes32 indexed messageHash,
    address indexed sender,
    address indexed recipient,
    string glyphId,
    uint256 timestamp
);
```

---

### AgentRegistry

ERC-8004 compatible agent identity registry.

**Key Functions:**

```solidity
// Register new agent (mints ERC-721)
function registerAgent(Agent calldata agent) external returns (uint256 tokenId);

// Update agent info
function updateAgent(uint256 tokenId, Agent calldata agent) external;

// Get agent by token ID
function getAgent(uint256 tokenId) external view returns (Agent memory);

// Get agent by owner address
function getAgentByOwner(address owner) external view returns (Agent memory);

// Find agents by protocol
function findByProtocol(string calldata protocol) external view returns (uint256[] memory);

// Check if address has agent
function hasAgent(address addr) external view returns (bool);
```

**Agent Struct:**

```solidity
struct Agent {
    string name;
    string serviceUrl;     // API endpoint
    string[] protocols;    // ["ayni", "mcp", "a2a"]
    string agentCard;      // IPFS hash
    uint256 registeredAt;
    bool active;
}
```

**Events:**

```solidity
event AgentRegistered(
    uint256 indexed tokenId,
    address indexed owner,
    string name,
    string serviceUrl
);
event AgentUpdated(uint256 indexed tokenId, string name, string serviceUrl);
event AgentDeactivated(uint256 indexed tokenId);
event AgentActivated(uint256 indexed tokenId);
```

---

## ABIs

### AyniRegistry ABI

```json
[
  {
    "inputs": [{"type": "string", "name": "id"}],
    "name": "getGlyph",
    "outputs": [{"type": "tuple", "components": [
      {"type": "string", "name": "id"},
      {"type": "string", "name": "meaning"},
      {"type": "string", "name": "pose"},
      {"type": "string", "name": "symbol"},
      {"type": "bytes32", "name": "visualHash"},
      {"type": "bool", "name": "active"}
    ]}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllGlyphs",
    "outputs": [{"type": "tuple[]", "components": [...]}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"type": "string", "name": "id"}],
    "name": "isGlyphActive",
    "outputs": [{"type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  }
]
```

### MessageAttestation ABI

```json
[
  {
    "inputs": [
      {"type": "bytes32", "name": "messageHash"},
      {"type": "string", "name": "glyphId"},
      {"type": "address", "name": "recipient"}
    ],
    "name": "attest",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"type": "bytes32", "name": "messageHash"}],
    "name": "verify",
    "outputs": [{"type": "tuple", "components": [
      {"type": "bytes32", "name": "messageHash"},
      {"type": "address", "name": "sender"},
      {"type": "uint256", "name": "timestamp"},
      {"type": "string", "name": "glyphId"},
      {"type": "address", "name": "recipient"}
    ]}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"type": "bytes32", "name": "messageHash"}],
    "name": "isAttested",
    "outputs": [{"type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  }
]
```

---

## Deployment

### Using Foundry

```bash
cd hackathon/contracts

# Install dependencies
forge install OpenZeppelin/openzeppelin-contracts
forge install foundry-rs/forge-std

# Build
forge build

# Test
forge test -vvv

# Deploy (requires private key)
forge script script/Deploy.s.sol \
  --rpc-url https://testnet-rpc.monad.xyz \
  --broadcast \
  --verify
```

### Deployment Script

Create `script/Deploy.s.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/AyniRegistry.sol";
import "../src/MessageAttestation.sol";
import "../src/AgentRegistry.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        AyniRegistry registry = new AyniRegistry();
        MessageAttestation attestation = new MessageAttestation();
        AgentRegistry agents = new AgentRegistry();

        console.log("AyniRegistry:", address(registry));
        console.log("MessageAttestation:", address(attestation));
        console.log("AgentRegistry:", address(agents));

        vm.stopBroadcast();
    }
}
```

---

## Verification

After deployment, verify contracts on Monad Explorer:

```bash
forge verify-contract \
  --chain-id 10143 \
  --compiler-version v0.8.20 \
  <CONTRACT_ADDRESS> \
  src/AyniRegistry.sol:AyniRegistry
```

---

## Security Considerations

1. **Owner Control**: AyniRegistry uses Ownable for glyph management. Transfer ownership to multisig or DAO for decentralization.

2. **Message Uniqueness**: Each message hash can only be attested once. This prevents replay attacks.

3. **Agent Identity**: AgentRegistry uses ERC-721, so agent identity is transferable. Consider whether this is desired for your use case.

4. **Gas Optimization**: For high-volume attestation, consider batch operations or L2 deployment.

---

## Interacting with Contracts

### Using viem (JavaScript)

```typescript
import { createPublicClient, http } from 'viem';
import { monadTestnet } from './chain';

const client = createPublicClient({
  chain: monadTestnet,
  transport: http(),
});

// Read glyph
const glyph = await client.readContract({
  address: AYNI_REGISTRY_ADDRESS,
  abi: AyniRegistryABI,
  functionName: 'getGlyph',
  args: ['Q01'],
});

// Verify attestation
const attestation = await client.readContract({
  address: MESSAGE_ATTESTATION_ADDRESS,
  abi: MessageAttestationABI,
  functionName: 'verify',
  args: [messageHash],
});
```

### Using ethers.js

```typescript
import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider('https://testnet-rpc.monad.xyz');
const contract = new ethers.Contract(
  MESSAGE_ATTESTATION_ADDRESS,
  MessageAttestationABI,
  provider
);

const attestation = await contract.verify(messageHash);
```
