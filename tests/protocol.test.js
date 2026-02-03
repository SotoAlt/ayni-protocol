#!/usr/bin/env node

/**
 * Protocol Module Tests
 *
 * Tests for Encoder, Decoder, and Agent classes
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import crypto from 'crypto';

import { Encoder } from '../src/protocol/Encoder.js';
import { Decoder } from '../src/protocol/Decoder.js';
import { Agent } from '../src/protocol/Agent.js';
import { GlyphLibrary } from '../src/core/GlyphLibrary.js';

describe('Encoder', () => {
  it('should encode a simple message', () => {
    const encoder = new Encoder();
    const msg = encoder.encode({
      glyph: 'Q01',
      data: { table: 'users' }
    });

    assert.strictEqual(msg.glyph, 'Q01');
    assert.deepStrictEqual(msg.data, { table: 'users' });
    assert.ok(msg.timestamp > 0);
  });

  it('should reject unknown glyphs', () => {
    const encoder = new Encoder();
    assert.throws(() => {
      encoder.encode({ glyph: 'INVALID' });
    }, /Unknown glyph/);
  });

  it('should auto-detect glyph from text', () => {
    const encoder = new Encoder();
    const msg = encoder.encode({
      text: 'query database for users'
    });

    assert.strictEqual(msg.glyph, 'Q01');
  });

  it('should encode query messages', () => {
    const encoder = new Encoder();
    const msg = encoder.query('database', { filter: 'active' });

    assert.strictEqual(msg.glyph, 'Q01');
    assert.strictEqual(msg.data.target, 'database');
  });

  it('should encode response messages', () => {
    const encoder = new Encoder();
    const msg = encoder.response('success', { count: 42 });

    assert.strictEqual(msg.glyph, 'R01');
    assert.strictEqual(msg.data.status, 'success');
  });

  it('should encode error messages', () => {
    const encoder = new Encoder();
    const msg = encoder.error('permission', 'Access denied');

    assert.strictEqual(msg.glyph, 'E03');
    assert.strictEqual(msg.data.errorType, 'permission');
    assert.strictEqual(msg.data.message, 'Access denied');
  });

  it('should encode action messages', () => {
    const encoder = new Encoder();
    const msg = encoder.action('create', { item: 'document' });

    assert.strictEqual(msg.glyph, 'A04');
    assert.strictEqual(msg.data.action, 'create');
  });

  it('should encode state messages', () => {
    const encoder = new Encoder();
    const msg = encoder.state('processing', { progress: 50 });

    assert.strictEqual(msg.glyph, 'S02');
    assert.strictEqual(msg.data.state, 'processing');
  });

  it('should encrypt data when key provided', () => {
    const key = crypto.randomBytes(32);
    const encoder = new Encoder({ encryptionKey: key, encrypt: true });

    const msg = encoder.encode({
      glyph: 'Q01',
      data: { secret: 'password123' }
    });

    assert.ok(msg.encryption.encrypted);
    assert.ok(msg.data.ciphertext);
    assert.ok(msg.data.iv);
    assert.ok(msg.data.authTag);

    // Data should not contain plaintext
    assert.ok(!JSON.stringify(msg.data).includes('password123'));
  });

  it('should serialize to binary', () => {
    const encoder = new Encoder();
    const msg = encoder.encode({ glyph: 'Q01', data: {} });
    const binary = encoder.toBinary(msg);

    assert.ok(Buffer.isBuffer(binary));
    assert.ok(binary.length > 0);
  });

  it('should serialize to compact format', () => {
    const encoder = new Encoder();
    const msg = encoder.encode({ glyph: 'Q01', data: { test: true } });
    const compact = encoder.toCompact(msg);

    assert.ok(compact.startsWith('Q01:'));
    assert.ok(compact.length < 100);
  });

  it('should include payment info', () => {
    const encoder = new Encoder();
    const msg = encoder.encode({
      glyph: 'Q01',
      data: {},
      payment: {
        amount: '0.001',
        currency: 'ETH',
        recipient: '0x1234'
      }
    });

    assert.ok(msg.payment);
    assert.strictEqual(msg.payment.amount, '0.001');
    assert.strictEqual(msg.payment.currency, 'ETH');
  });
});

describe('Decoder', () => {
  it('should decode a simple message', () => {
    const decoder = new Decoder();
    const decoded = decoder.decode({
      glyph: 'Q01',
      data: { table: 'users' },
      timestamp: 1234567890
    });

    assert.strictEqual(decoded.glyph, 'Q01');
    assert.strictEqual(decoded.meaning, 'Query Database');
    assert.strictEqual(decoded.category, 'query');
    assert.deepStrictEqual(decoded.data, { table: 'users' });
  });

  it('should reject unknown glyphs', () => {
    const decoder = new Decoder();
    assert.throws(() => {
      decoder.decode({ glyph: 'INVALID', data: {} });
    }, /Unknown glyph/);
  });

  it('should decode from compact format', () => {
    const decoder = new Decoder();
    const decoded = decoder.decode('Q01:eyJ0ZXN0Ijp0cnVlfQ==');

    assert.strictEqual(decoded.glyph, 'Q01');
    assert.ok(decoded.data.test);
  });

  it('should decrypt encrypted data', () => {
    const key = crypto.randomBytes(32);
    const encoder = new Encoder({ encryptionKey: key, encrypt: true });
    const decoder = new Decoder({ decryptionKey: key });

    const original = { secret: 'password123' };
    const msg = encoder.encode({ glyph: 'Q01', data: original });

    const decoded = decoder.decode(msg);

    assert.strictEqual(decoded.data.secret, 'password123');
    assert.strictEqual(decoded.encrypted, true);
  });

  it('should indicate encrypted data without key', () => {
    const key = crypto.randomBytes(32);
    const encoder = new Encoder({ encryptionKey: key, encrypt: true });
    const decoder = new Decoder(); // No key

    const msg = encoder.encode({ glyph: 'Q01', data: { secret: 'test' } });
    const decoded = decoder.decode(msg);

    assert.ok(decoded.data.encrypted);
    assert.strictEqual(decoded.data.reason, 'No decryption key provided');
  });

  it('should check message categories', () => {
    const decoder = new Decoder();

    assert.ok(decoder.isQuery({ glyph: 'Q01' }));
    assert.ok(decoder.isResponse({ glyph: 'R01' }));
    assert.ok(decoder.isError({ glyph: 'E01' }));
    assert.ok(decoder.isAction({ glyph: 'A01' }));
    assert.ok(decoder.isState({ glyph: 'S01' }));
  });

  it('should detect payment required', () => {
    const decoder = new Decoder();

    assert.ok(decoder.requiresPayment({ glyph: 'E02' }));
    assert.ok(!decoder.requiresPayment({ glyph: 'Q01' }));
  });

  it('should convert to human-readable text', () => {
    const decoder = new Decoder();
    const decoded = decoder.decode({
      glyph: 'Q01',
      data: { originalText: 'Get all users' },
      timestamp: 1234567890
    });

    const text = decoder.toHumanReadable(decoded);

    assert.ok(text.includes('Q01'));
    assert.ok(text.includes('Query Database'));
    assert.ok(text.includes('Get all users'));
  });

  it('should validate messages', () => {
    const decoder = new Decoder();

    const valid = decoder.validate({ glyph: 'Q01', timestamp: 123 });
    assert.ok(valid.valid);
    assert.strictEqual(valid.errors.length, 0);

    const invalid = decoder.validate({ timestamp: 123 });
    assert.ok(!invalid.valid);
    assert.ok(invalid.errors.includes('Missing glyph ID'));
  });

  it('should get visual representation', () => {
    const decoder = new Decoder();
    const visual = decoder.getVisual('Q01');

    assert.ok(visual);
    assert.strictEqual(visual.id, 'Q01');
    assert.ok(visual.ascii);
    assert.ok(visual.binary);
    assert.ok(visual.base64);
  });
});

describe('Agent', () => {
  it('should create agent with name', () => {
    const agent = new Agent({ name: 'TestAgent' });
    assert.strictEqual(agent.name, 'TestAgent');
  });

  it('should generate random name if not provided', () => {
    const agent = new Agent();
    assert.ok(agent.name.startsWith('Agent_'));
  });

  it('should send messages', () => {
    const alice = new Agent({ name: 'Alice' });
    const bob = new Agent({ name: 'Bob' });

    const envelope = alice.send({
      glyph: 'Q01',
      data: { query: 'test' },
      to: bob
    });

    assert.strictEqual(envelope.from, 'Alice');
    assert.strictEqual(envelope.to, 'Bob');
    assert.strictEqual(envelope.message.glyph, 'Q01');
  });

  it('should receive and decode messages', () => {
    const alice = new Agent({ name: 'Alice' });
    const bob = new Agent({ name: 'Bob' });

    const envelope = alice.send({
      glyph: 'Q01',
      data: { table: 'users' },
      to: bob
    });

    const decoded = bob.receive(envelope);

    assert.strictEqual(decoded.glyph, 'Q01');
    assert.strictEqual(decoded.meaning, 'Query Database');
  });

  it('should track statistics', () => {
    const alice = new Agent({ name: 'Alice' });
    const bob = new Agent({ name: 'Bob' });

    alice.send({ glyph: 'Q01', data: {}, to: bob });
    alice.send({ glyph: 'Q01', data: {}, to: bob });

    const stats = alice.getStats();
    assert.strictEqual(stats.messagesSent, 2);
    assert.ok(stats.bytesSent > 0);
    assert.strictEqual(stats.glyphUsage.Q01, 2);
  });

  it('should create pairs with shared encryption', () => {
    const [alice, bob] = Agent.createPair('Alice', 'Bob');

    assert.strictEqual(alice.name, 'Alice');
    assert.strictEqual(bob.name, 'Bob');
    assert.ok(alice.encryptionKey);
    assert.deepStrictEqual(alice.encryptionKey, bob.encryptionKey);
  });

  it('should encrypt messages between paired agents', () => {
    const [alice, bob] = Agent.createPair();

    const envelope = alice.send({
      glyph: 'Q01',
      data: { secret: 'password' },
      to: bob
    });

    // Message should be encrypted
    assert.ok(envelope.message.encryption?.encrypted);

    // Bob should be able to decrypt
    const decoded = bob.receive(envelope);
    assert.strictEqual(decoded.data.secret, 'password');
  });

  it('should provide helper methods for common operations', () => {
    const [alice, bob] = Agent.createPair();

    // Query
    const q = alice.query('database', { table: 'users' }, bob);
    assert.strictEqual(q.message.glyph, 'Q01');

    // Respond
    const r = bob.respond('success', { count: 5 }, alice);
    assert.strictEqual(r.message.glyph, 'R01');

    // Error
    const e = alice.error('timeout', 'Request timed out', bob);
    assert.strictEqual(e.message.glyph, 'E05');

    // Action
    const a = alice.action('create', { item: 'doc' }, bob);
    assert.strictEqual(a.message.glyph, 'A04');

    // State
    const s = bob.state('processing', {}, alice);
    assert.strictEqual(s.message.glyph, 'S02');
  });

  it('should register and call message handlers', () => {
    const alice = new Agent({ name: 'Alice' });
    const bob = new Agent({ name: 'Bob' });

    let handlerCalled = false;
    bob.on('query', (decoded, envelope) => {
      handlerCalled = true;
      return decoded;
    });

    const envelope = alice.send({ glyph: 'Q01', data: {}, to: bob });
    bob.receive(envelope);

    assert.ok(handlerCalled);
  });

  it('should handle wildcard handlers', () => {
    const alice = new Agent({ name: 'Alice' });
    const bob = new Agent({ name: 'Bob' });

    let messageCount = 0;
    bob.on('*', (decoded) => {
      messageCount++;
      return decoded;
    });

    bob.receive(alice.send({ glyph: 'Q01', data: {}, to: bob }));
    bob.receive(alice.send({ glyph: 'R01', data: {}, to: bob }));

    assert.strictEqual(messageCount, 2);
  });

  it('should reset statistics', () => {
    const alice = new Agent({ name: 'Alice' });
    alice.send({ glyph: 'Q01', data: {}, to: 'Bob' });

    assert.strictEqual(alice.stats.messagesSent, 1);

    alice.resetStats();
    assert.strictEqual(alice.stats.messagesSent, 0);
  });

  it('should generate encryption keys', () => {
    const key = Agent.generateKey();
    assert.ok(Buffer.isBuffer(key));
    assert.strictEqual(key.length, 32);
  });
});

// Run tests
console.log('Running Protocol Module Tests...\n');
