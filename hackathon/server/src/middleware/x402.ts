import { FastifyRequest, FastifyReply } from 'fastify';
import { pricing } from '../config.js';

/**
 * x402 Payment Middleware for Ayni Protocol
 *
 * Implements HTTP 402 Payment Required for premium endpoints.
 * In production, this would integrate with @x402/fastify or a custom
 * payment verification system on Monad.
 *
 * For the hackathon, this is a simplified implementation that:
 * 1. Checks for x-payment header
 * 2. Validates payment proof (mock for now)
 * 3. Returns 402 if payment required but not provided
 */

export interface PaymentHeader {
  txHash: string;
  amount: string;
  currency: string;
}

interface PricingConfig {
  [key: string]: string;
}

// Pricing for different endpoints
const ENDPOINT_PRICING: PricingConfig = {
  '/attest': pricing.attest,
  '/attest/simple': pricing.attest,
  '/send': pricing.send,
  '/send/batch': pricing.send,
  '/render': pricing.render,
};

// Endpoints that require payment
const PAID_ENDPOINTS = new Set(Object.keys(ENDPOINT_PRICING));

// Endpoints that are always free
const FREE_ENDPOINTS = new Set([
  '/encode',
  '/decode',
  '/decode/batch',
  '/verify',
  '/glyphs',
  '/health',
  '/',
]);

/**
 * Parse x-payment header
 * Format: txHash:amount:currency (e.g., "0x123...abc:0.01:MON")
 */
function parsePaymentHeader(header: string): PaymentHeader | null {
  const parts = header.split(':');
  if (parts.length !== 3) return null;

  const [txHash, amount, currency] = parts;

  if (!txHash.startsWith('0x') || txHash.length !== 66) return null;
  if (isNaN(parseFloat(amount))) return null;
  if (currency !== 'MON') return null;

  return { txHash, amount, currency };
}

/**
 * Verify payment on-chain (mock for hackathon)
 * In production, this would:
 * 1. Check transaction exists on Monad
 * 2. Verify recipient is our payment address
 * 3. Verify amount is sufficient
 * 4. Mark transaction as used (prevent double-spending)
 */
async function verifyPayment(payment: PaymentHeader, requiredAmount: string): Promise<boolean> {
  // Mock verification for hackathon
  // Accept any payment header with sufficient amount
  const paymentAmount = parseFloat(payment.amount);
  const required = parseFloat(requiredAmount);

  return paymentAmount >= required;
}

/**
 * x402 middleware factory
 */
export function x402Middleware() {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const path = request.url.split('?')[0];

    // Check if endpoint is free
    if (FREE_ENDPOINTS.has(path)) {
      return; // Continue to handler
    }

    // Check if endpoint matches a free pattern (e.g., /verify/:hash)
    if (path.startsWith('/verify/') || path.startsWith('/glyphs/')) {
      return; // Continue to handler
    }

    // Check if endpoint requires payment
    const basePath = '/' + path.split('/')[1];
    const price = ENDPOINT_PRICING[basePath] || ENDPOINT_PRICING[path];

    if (!price) {
      return; // Unknown endpoint, let router handle 404
    }

    // Check for payment header
    const paymentHeader = request.headers['x-payment'] as string | undefined;

    if (!paymentHeader) {
      return reply.status(402).send({
        error: 'Payment Required',
        message: `This endpoint requires payment of ${price} MON`,
        price,
        currency: 'MON',
        paymentAddress: process.env.PAYMENT_ADDRESS || '0x0000000000000000000000000000000000000000',
        instructions: 'Include x-payment header with format: txHash:amount:MON',
        example: '0x1234...abcd:0.01:MON',
        docs: 'https://docs.ayni-protocol.com/x402',
      });
    }

    // Parse and verify payment
    const payment = parsePaymentHeader(paymentHeader);

    if (!payment) {
      return reply.status(400).send({
        error: 'Invalid Payment Header',
        message: 'x-payment header format: txHash:amount:MON',
        received: paymentHeader,
      });
    }

    const isValid = await verifyPayment(payment, price);

    if (!isValid) {
      return reply.status(402).send({
        error: 'Insufficient Payment',
        message: `Required: ${price} MON, Provided: ${payment.amount} MON`,
        required: price,
        provided: payment.amount,
      });
    }

    // Payment verified, continue to handler
    // Add payment info to request for logging/analytics
    (request as any).payment = payment;
  };
}

/**
 * Get pricing for an endpoint
 */
export function getEndpointPrice(path: string): string | null {
  const basePath = '/' + path.split('/')[1];
  return ENDPOINT_PRICING[basePath] || ENDPOINT_PRICING[path] || null;
}

/**
 * Check if endpoint requires payment
 */
export function requiresPayment(path: string): boolean {
  if (FREE_ENDPOINTS.has(path)) return false;
  if (path.startsWith('/verify/') || path.startsWith('/glyphs/')) return false;

  const basePath = '/' + path.split('/')[1];
  return PAID_ENDPOINTS.has(basePath) || PAID_ENDPOINTS.has(path);
}
