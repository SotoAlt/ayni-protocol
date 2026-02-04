/**
 * Ayni Protocol Crypto Module
 *
 * AES-256-GCM encryption for private message payloads.
 * Public glyph + encrypted data = audit trail without exposing content.
 *
 * Design:
 * - Free tier: glyph + plaintext data (no privacy)
 * - Paid tier: glyph + encrypted data (private payload)
 *
 * Message structure:
 * {
 *   glyph: "Q01",              // PUBLIC - visible in audit trail
 *   timestamp: 1706745600,     // PUBLIC - when it happened
 *   sender: "0x...",           // PUBLIC - who sent it
 *   recipient: "0x...",        // PUBLIC - who receives it
 *   encryptedData: "base64..." // PRIVATE - AES-256-GCM encrypted
 * }
 */

// Crypto functions using Web Crypto API (works in Node.js 19+ and browsers)
const subtle = globalThis.crypto?.subtle;

export interface EncryptedPayload {
  ciphertext: string; // Base64 encoded
  iv: string; // Base64 encoded (12 bytes for GCM)
  tag: string; // Base64 encoded (16 bytes for GCM auth tag)
  algorithm: 'AES-256-GCM';
  version: '1.0';
}

export interface EncryptedMessage {
  glyph: string;
  timestamp: number;
  sender?: string;
  recipient?: string;
  encryptedData: EncryptedPayload;
  encrypted: true;
}

export interface PlaintextMessage {
  glyph: string;
  timestamp: number;
  sender?: string;
  recipient?: string;
  data: Record<string, unknown>;
  encrypted: false;
}

export type AyniMessage = EncryptedMessage | PlaintextMessage;

/**
 * Generate a random AES-256 key for encryption.
 * In production, use key exchange (ECDH) between agents.
 */
export async function generateKey(): Promise<CryptoKey> {
  if (!subtle) {
    throw new Error('Web Crypto API not available');
  }

  return subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true, // extractable
    ['encrypt', 'decrypt']
  );
}

/**
 * Export a CryptoKey to raw bytes (for storage/transmission).
 */
export async function exportKey(key: CryptoKey): Promise<Uint8Array> {
  if (!subtle) {
    throw new Error('Web Crypto API not available');
  }

  const exported = await subtle.exportKey('raw', key);
  return new Uint8Array(exported);
}

/**
 * Import raw key bytes into a CryptoKey.
 */
export async function importKey(keyBytes: Uint8Array): Promise<CryptoKey> {
  if (!subtle) {
    throw new Error('Web Crypto API not available');
  }

  return subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Derive a shared key from a password/passphrase using PBKDF2.
 * Useful for simple shared secret scenarios.
 */
export async function deriveKeyFromPassword(
  password: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  if (!subtle) {
    throw new Error('Web Crypto API not available');
  }

  const encoder = new TextEncoder();
  const passwordKey = await subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  return subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt data payload with AES-256-GCM.
 *
 * @param data - The data object to encrypt
 * @param key - AES-256 key (CryptoKey or raw bytes)
 * @returns Encrypted payload with ciphertext, IV, and auth tag
 */
export async function encrypt(
  data: Record<string, unknown>,
  key: CryptoKey | Uint8Array
): Promise<EncryptedPayload> {
  if (!subtle) {
    throw new Error('Web Crypto API not available');
  }

  // Import key if raw bytes provided
  const cryptoKey = key instanceof Uint8Array ? await importKey(key) : key;

  // Generate random IV (12 bytes recommended for GCM)
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));

  // Encode data to bytes
  const encoder = new TextEncoder();
  const plaintext = encoder.encode(JSON.stringify(data));

  // Encrypt with AES-GCM
  const encrypted = await subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
      tagLength: 128, // 16 bytes auth tag
    },
    cryptoKey,
    plaintext
  );

  // GCM appends auth tag to ciphertext
  const encryptedArray = new Uint8Array(encrypted);
  const ciphertext = encryptedArray.slice(0, -16);
  const tag = encryptedArray.slice(-16);

  return {
    ciphertext: uint8ArrayToBase64(ciphertext),
    iv: uint8ArrayToBase64(iv),
    tag: uint8ArrayToBase64(tag),
    algorithm: 'AES-256-GCM',
    version: '1.0',
  };
}

/**
 * Decrypt data payload encrypted with AES-256-GCM.
 *
 * @param payload - The encrypted payload
 * @param key - AES-256 key (CryptoKey or raw bytes)
 * @returns Decrypted data object
 */
export async function decrypt(
  payload: EncryptedPayload,
  key: CryptoKey | Uint8Array
): Promise<Record<string, unknown>> {
  if (!subtle) {
    throw new Error('Web Crypto API not available');
  }

  // Validate algorithm
  if (payload.algorithm !== 'AES-256-GCM') {
    throw new Error(`Unsupported algorithm: ${payload.algorithm}`);
  }

  // Import key if raw bytes provided
  const cryptoKey = key instanceof Uint8Array ? await importKey(key) : key;

  // Decode Base64 components
  const iv = base64ToUint8Array(payload.iv);
  const ciphertext = base64ToUint8Array(payload.ciphertext);
  const tag = base64ToUint8Array(payload.tag);

  // GCM expects ciphertext + tag concatenated
  const encryptedData = new Uint8Array(ciphertext.length + tag.length);
  encryptedData.set(ciphertext);
  encryptedData.set(tag, ciphertext.length);

  // Decrypt
  const decrypted = await subtle.decrypt(
    {
      name: 'AES-GCM',
      iv,
      tagLength: 128,
    },
    cryptoKey,
    encryptedData
  );

  // Decode and parse JSON
  const decoder = new TextDecoder();
  const plaintext = decoder.decode(decrypted);
  return JSON.parse(plaintext);
}

/**
 * Create an encrypted Ayni message.
 */
export async function createEncryptedMessage(
  glyph: string,
  data: Record<string, unknown>,
  key: CryptoKey | Uint8Array,
  options: { sender?: string; recipient?: string } = {}
): Promise<EncryptedMessage> {
  const encryptedData = await encrypt(data, key);

  return {
    glyph: glyph.toUpperCase(),
    timestamp: Date.now(),
    sender: options.sender,
    recipient: options.recipient,
    encryptedData,
    encrypted: true,
  };
}

/**
 * Create a plaintext Ayni message (no encryption).
 */
export function createPlaintextMessage(
  glyph: string,
  data: Record<string, unknown>,
  options: { sender?: string; recipient?: string } = {}
): PlaintextMessage {
  return {
    glyph: glyph.toUpperCase(),
    timestamp: Date.now(),
    sender: options.sender,
    recipient: options.recipient,
    data,
    encrypted: false,
  };
}

/**
 * Decrypt an encrypted Ayni message.
 */
export async function decryptMessage(
  message: EncryptedMessage,
  key: CryptoKey | Uint8Array
): Promise<PlaintextMessage> {
  const data = await decrypt(message.encryptedData, key);

  return {
    glyph: message.glyph,
    timestamp: message.timestamp,
    sender: message.sender,
    recipient: message.recipient,
    data,
    encrypted: false,
  };
}

/**
 * Check if a message is encrypted.
 */
export function isEncrypted(message: AyniMessage): message is EncryptedMessage {
  return message.encrypted === true;
}

// Helper functions for Base64 encoding/decoding (URL-safe)
function uint8ArrayToBase64(bytes: Uint8Array): string {
  // Use standard base64 for compatibility
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Generate a random salt for key derivation.
 */
export function generateSalt(): Uint8Array {
  return globalThis.crypto.getRandomValues(new Uint8Array(16));
}

/**
 * Convert a hex string to Uint8Array.
 */
export function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleanHex.substr(i * 2, 2), 16);
  }
  return bytes;
}

/**
 * Convert Uint8Array to hex string.
 */
export function bytesToHex(bytes: Uint8Array): string {
  return '0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}
