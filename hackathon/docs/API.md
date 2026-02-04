# Ayni Protocol API Reference

## Base URL

```
Production: https://api.ayni-protocol.com
Local:      http://localhost:3000
```

## Authentication

Most endpoints are free and don't require authentication.

Premium endpoints require x402 payment via the `x-payment` header:

```
x-payment: {txHash}:{amount}:{currency}
```

Example:
```
x-payment: 0x1234...abcd:0.01:MON
```

---

## Endpoints

### GET /

Returns API information and available endpoints.

**Response:**
```json
{
  "name": "Ayni Protocol Server",
  "version": "1.0.0",
  "endpoints": {
    "POST /encode": "Convert text intent to glyph (free)",
    "POST /decode": "Convert glyph to meaning (free)",
    "POST /attest": "Store message hash on-chain (0.01 MON)",
    "POST /send": "Relay + attest message (0.001 MON)",
    "GET /verify/:hash": "Check if message was attested (free)",
    "GET /glyphs": "List all registered glyphs (free)"
  }
}
```

---

### POST /encode

Convert natural language intent to glyph.

**Cost:** Free

**Request:**
```json
{
  "text": "query the database for users",
  "data": { "table": "users" },
  "recipient": "0x1234..."
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| text | string | Yes | Natural language intent |
| data | object | No | Additional data payload |
| recipient | string | No | Recipient address |

**Response:**
```json
{
  "glyph": "Q01",
  "meaning": "Query Database",
  "pose": "arms_up",
  "symbol": "database",
  "data": { "table": "users" },
  "timestamp": 1706745600000,
  "recipient": "0x1234...",
  "messageHash": "0xabcd..."
}
```

**Error Response (400):**
```json
{
  "error": "No matching glyph found",
  "text": "hello world",
  "hint": "Try using keywords like: query, success, error, execute"
}
```

---

### POST /decode

Decode glyph ID to full information.

**Cost:** Free

**Request:**
```json
{
  "glyph": "Q01"
}
```

**Response:**
```json
{
  "glyph": "Q01",
  "meaning": "Query Database",
  "pose": "arms_up",
  "symbol": "database",
  "description": "Represents a query or request for information",
  "usage": "Use when an agent needs to request data or search for information",
  "valid": true
}
```

---

### POST /decode/batch

Decode multiple glyphs at once.

**Cost:** Free

**Request:**
```json
{
  "glyphs": ["Q01", "R01", "INVALID"]
}
```

**Response:**
```json
{
  "count": 3,
  "valid": 2,
  "invalid": 1,
  "results": [
    { "glyph": "Q01", "meaning": "Query Database", "valid": true },
    { "glyph": "R01", "meaning": "Response Success", "valid": true },
    { "glyph": "INVALID", "valid": false, "error": "Unknown glyph ID" }
  ]
}
```

---

### POST /attest

Store message hash on-chain.

**Cost:** 0.01 MON

**Request:**
```json
{
  "message": {
    "glyph": "Q01",
    "data": { "query": "SELECT * FROM users" },
    "recipient": "0x2222...",
    "timestamp": 1706745600000
  }
}
```

**Response:**
```json
{
  "success": true,
  "transactionHash": "0xabcd...",
  "messageHash": "0x1234...",
  "glyphId": "Q01",
  "timestamp": 1706745600000,
  "blockNumber": 12345
}
```

**Error Response (402 - Payment Required):**
```json
{
  "error": "Payment Required",
  "message": "This endpoint requires payment of 0.01 MON",
  "price": "0.01",
  "currency": "MON",
  "paymentAddress": "0x...",
  "instructions": "Include x-payment header with format: txHash:amount:MON"
}
```

---

### POST /attest/simple

Simple attestation with just hash and glyph.

**Cost:** 0.01 MON

**Request:**
```json
{
  "messageHash": "0x1234567890abcdef...",
  "glyphId": "Q01"
}
```

**Response:**
```json
{
  "success": true,
  "transactionHash": "0xabcd...",
  "messageHash": "0x1234...",
  "glyphId": "Q01",
  "timestamp": 1706745600000,
  "blockNumber": 12345
}
```

---

### POST /send

Send message with attestation and optional relay.

**Cost:** 0.001 MON

**Request:**
```json
{
  "glyph": "Q01",
  "data": { "query": "users" },
  "recipient": "https://agent-b.example.com/receive",
  "encryptedPayload": "base64..."
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| glyph | string | Yes | Glyph ID |
| data | object | No | Data payload |
| recipient | string | Yes | Address (0x...) or endpoint URL |
| encryptedPayload | string | No | Base64 encrypted data |

**Response:**
```json
{
  "success": true,
  "messageHash": "0x1234...",
  "glyphId": "Q01",
  "recipient": "https://agent-b.example.com/receive",
  "timestamp": 1706745600000,
  "transactionHash": "0xabcd...",
  "relayStatus": "delivered"
}
```

**Relay Status Values:**
- `delivered` - Successfully relayed to recipient endpoint
- `failed` - Relay failed (see error field)
- `not_relayed` - Recipient is address, not URL

---

### POST /send/batch

Send to multiple recipients.

**Cost:** 0.001 MON per recipient

**Request:**
```json
{
  "glyph": "A01",
  "data": { "action": "process" },
  "recipients": [
    "0x1111...",
    "0x2222...",
    "https://agent.example.com/receive"
  ]
}
```

**Response:**
```json
{
  "count": 3,
  "successful": 3,
  "results": [
    { "recipient": "0x1111...", "success": true, "messageHash": "0x..." },
    { "recipient": "0x2222...", "success": true, "messageHash": "0x..." },
    { "recipient": "https://...", "success": true, "messageHash": "0x..." }
  ],
  "pricing": "0.001 MON per message"
}
```

---

### GET /verify/:hash

Verify if message was attested.

**Cost:** Free

**Parameters:**
- `hash` - Message hash (0x + 64 hex chars)

**Response:**
```json
{
  "messageHash": "0x1234...",
  "attested": true,
  "sender": "0x1111...",
  "timestamp": 1706745600,
  "glyphId": "Q01",
  "recipient": "0x2222..."
}
```

**Not Found Response:**
```json
{
  "messageHash": "0x1234...",
  "attested": false
}
```

---

### GET /verify/:hash/exists

Check if message exists (simple boolean).

**Cost:** Free

**Response:**
```json
{
  "hash": "0x1234...",
  "exists": true
}
```

---

### GET /verify/sender/:address

Get all attestations by sender.

**Cost:** Free

**Response:**
```json
{
  "sender": "0x1111...",
  "attestations": [
    {
      "messageHash": "0x...",
      "sender": "0x1111...",
      "timestamp": 1706745600,
      "glyphId": "Q01",
      "recipient": "0x2222...",
      "attested": true
    }
  ],
  "count": 5
}
```

---

### GET /verify/recipient/:address

Get attestations received by address.

**Cost:** Free

**Response:**
```json
{
  "recipient": "0x2222...",
  "attestations": [...],
  "count": 3
}
```

---

### GET /glyphs

List all registered glyphs.

**Cost:** Free

**Response:**
```json
{
  "glyphs": [
    {
      "id": "Q01",
      "meaning": "Query Database",
      "pose": "arms_up",
      "symbol": "database",
      "active": true
    },
    {
      "id": "R01",
      "meaning": "Response Success",
      "pose": "arms_down",
      "symbol": "checkmark",
      "active": true
    }
  ],
  "count": 4,
  "source": "chain"
}
```

---

### GET /glyphs/active

List active glyphs only.

**Cost:** Free

---

### GET /glyphs/:id

Get single glyph by ID.

**Cost:** Free

**Response:**
```json
{
  "id": "Q01",
  "meaning": "Query Database",
  "pose": "arms_up",
  "symbol": "database",
  "active": true,
  "source": "chain"
}
```

---

### GET /glyphs/:id/exists

Check if glyph exists.

**Cost:** Free

**Response:**
```json
{
  "id": "Q01",
  "exists": true,
  "source": "chain"
}
```

---

## Error Codes

| Code | Meaning |
|------|---------|
| 400 | Bad Request - Invalid input |
| 402 | Payment Required - x402 payment needed |
| 404 | Not Found - Resource doesn't exist |
| 500 | Server Error - Internal error |

## Rate Limits

| Tier | Requests/min |
|------|--------------|
| Free | 60 |
| Paid | 600 |

Rate limit headers:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1706745660
```

## Webhooks

Coming soon: Webhook notifications for attestation events.
