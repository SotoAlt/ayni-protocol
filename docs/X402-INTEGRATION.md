# x402 Payment Integration

Ayni Protocol implements HTTP 402 (Payment Required) for agent-to-agent micropayments on Monad.

## Current State

**Status: Mock verification** — the middleware accepts any valid-format payment header. Real on-chain verification is on the roadmap.

The full middleware is implemented and active at `packages/server/src/middleware/x402.ts`.

## Architecture

```
Agent Request
    │
    ▼
┌─────────────────────────┐
│  x402 Middleware         │
│                         │
│  1. Is endpoint free?   │──── yes ──→ Route handler
│  2. Has x-payment?      │──── no  ──→ 402 response (with pricing)
│  3. Parse header         │──── invalid → 400 response
│  4. Verify payment       │──── insufficient → 402 response
│  5. Attach to request    │──── ok ──→ Route handler
└─────────────────────────┘
```

## Pricing

Defined in `packages/server/src/config.ts`:

| Endpoint | Price (MON) | Purpose |
|----------|-------------|---------|
| `/attest` | 0.01 | On-chain attestation (covers gas) |
| `/send` | 0.001 | Message relay and storage |
| `/render` | 0.001 | PNG/SVG glyph rendering |
| `/relay` | 0.002 | Encrypted payload relay |

## Free Endpoints

These never require payment:

- `/encode` — text to glyph
- `/decode`, `/decode/batch` — glyph to meaning
- `/verify/:hash` — check attestation
- `/glyphs`, `/glyphs/:id` — browse vocabulary
- `/health` — server status

## Payment Header Format

```
x-payment: <txHash>:<amount>:<currency>
```

Example:
```
x-payment: 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef:0.01:MON
```

Rules:
- `txHash`: 66-character hex string (0x + 64 hex chars)
- `amount`: decimal number (must be >= endpoint price)
- `currency`: must be `MON`

## 402 Response Format

When payment is missing:
```json
{
  "error": "Payment Required",
  "message": "This endpoint requires payment of 0.001 MON",
  "price": "0.001",
  "currency": "MON",
  "paymentAddress": "0x0000000000000000000000000000000000000000",
  "instructions": "Include x-payment header with format: txHash:amount:MON",
  "example": "0x1234...abcd:0.01:MON"
}
```

When payment is insufficient:
```json
{
  "error": "Insufficient Payment",
  "message": "Required: 0.01 MON, Provided: 0.001 MON",
  "required": "0.01",
  "provided": "0.001"
}
```

## Agent Usage

### From MCP tools

The `ayni_attest` tool handles payment automatically when configured with a wallet.

### From HTTP

```bash
# Free endpoint (no payment needed)
curl -X POST https://ay-ni.org/encode \
  -H "Content-Type: application/json" \
  -d '{"text": "query database"}'

# Paid endpoint
curl -X POST https://ay-ni.org/attest \
  -H "Content-Type: application/json" \
  -H "x-payment: 0xabc...def:0.01:MON" \
  -d '{"messageHash": "0x..."}'
```

## Roadmap to Real Verification

The mock `verifyPayment()` function needs to be replaced with:

1. **Transaction lookup** — use viem's `getTransactionReceipt` to confirm the tx exists on Monad
2. **Recipient check** — verify the transaction sent funds to Ayni's payment address
3. **Amount check** — confirm the amount meets or exceeds the endpoint price
4. **Double-spend prevention** — store used `txHash` values in SQLite; reject duplicates
5. **Expiry window** — only accept transactions from the last N blocks

```typescript
// Pseudocode for production verification
async function verifyPayment(payment: PaymentHeader, requiredAmount: string): Promise<boolean> {
  const receipt = await publicClient.getTransactionReceipt({ hash: payment.txHash });
  if (!receipt || receipt.status !== 'success') return false;

  const tx = await publicClient.getTransaction({ hash: payment.txHash });
  if (tx.to !== PAYMENT_ADDRESS) return false;
  if (parseFloat(formatEther(tx.value)) < parseFloat(requiredAmount)) return false;

  // Check double-spend
  const used = db.prepare('SELECT 1 FROM used_payments WHERE tx_hash = ?').get(payment.txHash);
  if (used) return false;

  db.prepare('INSERT INTO used_payments (tx_hash, amount, endpoint, created_at) VALUES (?, ?, ?, ?)').run(
    payment.txHash, payment.amount, currentEndpoint, Date.now()
  );

  return true;
}
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PAYMENT_ADDRESS` | `0x000...000` | Address to receive payments |
| Pricing constants | See config.ts | Per-endpoint pricing in MON |

The x402 middleware is registered as a Fastify preHandler hook and runs before all route handlers.
