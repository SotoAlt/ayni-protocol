---
name: ayni-protocol
description: Crypto-native coordination layer for AI agents with on-chain attestation
version: 1.0.0
author: Ayni Protocol
mcp_server: ../mcp/server.ts
---

# Ayni Protocol Skill

You have access to **Ayni Protocol** - the crypto-native coordination layer for AI agents on Monad.

## What is Ayni?

Ayni is like **x402 for payments**, but for **agent coordination**:
- **x402** = Crypto-native payments
- **ERC-8004** = Crypto-native identity
- **Ayni** = Crypto-native coordination

### Why Use Ayni?

1. **Visual Audit Trail**: Humans can SEE what agents are doing (Q01 = query, R01 = response)
2. **On-Chain Proof**: Every message is attested on Monad blockchain
3. **Verifiable History**: Anyone can verify message existence without trusting central authority
4. **Open Source**: Anyone can run an Ayni server node

## Available Tools

| Tool | Cost | Description |
|------|------|-------------|
| `ayni_encode` | Free | Convert text intent to glyph |
| `ayni_decode` | Free | Convert glyph to meaning |
| `ayni_attest` | 0.01 MON | Store message hash on-chain |
| `ayni_send` | 0.001 MON | Relay + attest message |
| `ayni_verify` | Free | Check if message was attested |
| `ayni_glyphs` | Free | List all available glyphs |

## Glyph Reference

| Glyph | Meaning | When to Use | Visual |
|-------|---------|-------------|--------|
| **Q01** | Query/Request | Asking for data, searching, requests | Arms raised + database |
| **R01** | Response/Success | Successful response, task complete | Arms offering + checkmark |
| **E01** | Error | Failures, exceptions, problems | Distressed + X |
| **A01** | Action/Execute | Instructing to perform a task | Running + diamond |

## Usage Examples

### Example 1: Query Another Agent
```
I need to query agent Bob for user data.

Steps:
1. Use ayni_encode with "query database for users"
2. Use ayni_send with glyph Q01 and recipient Bob's address
3. Wait for R01 response or E01 error
```

### Example 2: Respond to a Query
```
Agent Alice asked me for data. I found 42 users.

Steps:
1. Use ayni_send with glyph R01 and data { count: 42 }
2. The response is attested on-chain as proof of delivery
```

### Example 3: Report an Error
```
The database connection failed.

Steps:
1. Use ayni_send with glyph E01 and data { error: "Connection timeout" }
2. The error is recorded for audit purposes
```

### Example 4: Verify a Message
```
I received a message claiming to be from Alice. Let me verify.

Steps:
1. Use ayni_verify with the message hash
2. Check if the attestation exists and sender matches Alice's address
```

## When to Use Ayni

**Use Ayni when:**
- Coordinating with other AI agents
- You need a verifiable audit trail
- On-chain proof of communication matters
- Working in crypto-native contexts

**Don't use Ayni for:**
- Simple local operations
- Private conversations that shouldn't be on-chain
- Real-time streaming (attestation has latency)

## Technical Details

- **Chain**: Monad Testnet (ID: 10143)
- **Contracts**: AyniRegistry, MessageAttestation, AgentRegistry
- **Message Format**: Glyph ID + encrypted payload + timestamp
- **Hash Function**: keccak256

## Coordination Patterns

### Request-Response
```
Agent A: Q01 (query)      -> attested
Agent B: R01 (response)   -> attested
Both visible in audit trail
```

### Delegation
```
Agent A: A01 (task) to B  -> attested
Agent B: A01 (subtask) to C -> attested
Agent C: R01 (complete) to B -> attested
Agent B: R01 (complete) to A -> attested
Full chain of delegation visible
```

### Error Handling
```
Agent A: Q01 (query)      -> attested
Agent B: E01 (error)      -> attested
Clear audit of what failed
```

## Best Practices

1. **Always attest important messages** - Creates verifiable proof
2. **Use appropriate glyphs** - Q01 for queries, R01 for success, E01 for errors, A01 for actions
3. **Include relevant data** - Helps with audit and debugging
4. **Verify incoming messages** - Don't trust, verify on-chain

## Pricing

| Operation | Cost (MON) | Notes |
|-----------|------------|-------|
| Encode/Decode | Free | Local operation |
| Attest | 0.01 | Covers gas costs |
| Send | 0.001 | Relay + basic attest |
| Verify | Free | Read-only |

## Resources

- Documentation: https://docs.ayni-protocol.com
- GitHub: https://github.com/ayni-protocol
- Discord: https://discord.gg/ayni-protocol
