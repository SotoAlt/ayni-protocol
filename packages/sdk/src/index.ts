/**
 * @ayni-protocol/sdk
 *
 * TypeScript SDK for Ayni Protocol - crypto-native coordination layer for AI agents.
 *
 * Features:
 * - Direct contract calls (fully decentralized)
 * - Server API client (convenience)
 * - Message encoding/decoding
 * - On-chain attestation
 * - Agent registration
 */

export { AyniClient, type AyniClientConfig } from './client.js';
export { AyniContracts, type ContractAddresses } from './contracts.js';
export {
  GLYPH_LIBRARY,
  encodeIntent,
  decodeGlyph,
  type Glyph,
  type GlyphId,
} from './glyphs.js';
export { AyniMessage, type MessageOptions, type EncodedMessage } from './message.js';
export { monadTestnet, type ChainConfig } from './chain.js';
export {
  generateKey,
  exportKey,
  importKey,
  deriveKeyFromPassword,
  encrypt,
  decrypt,
  createEncryptedMessage,
  createPlaintextMessage,
  decryptMessage,
  isEncrypted,
  generateSalt,
  hexToBytes,
  bytesToHex,
  type EncryptedPayload,
  type EncryptedMessage,
  type PlaintextMessage,
  type AyniMessage,
} from './crypto.js';
