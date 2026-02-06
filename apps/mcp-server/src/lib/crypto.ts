/**
 * Cryptographic utilities for secure token storage
 *
 * Uses AES-256-GCM for authenticated encryption of OAuth tokens.
 * This ensures tokens are encrypted at rest in the database.
 */

const ALGORITHM = 'AES-GCM';
const IV_LENGTH = 12; // 96 bits for GCM
const TAG_LENGTH = 128; // bits

/**
 * Derive a CryptoKey from the encryption key string
 * Uses PBKDF2 for key derivation from the environment variable
 */
async function deriveKey(keyMaterial: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(keyMaterial);

  // Import the key material
  const baseKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  // Derive the AES key
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: ALGORITHM, length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt a plaintext string using AES-256-GCM
 * Returns base64-encoded ciphertext with IV and salt prepended
 * Format: base64(salt + iv + ciphertext)
 */
export async function encryptToken(plaintext: string, encryptionKey: string): Promise<string> {
  if (!encryptionKey) {
    throw new Error('Encryption key is required');
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);

  // Generate random salt and IV
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  // Derive key and encrypt
  const key = await deriveKey(encryptionKey, salt);
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: ALGORITHM,
      iv,
      tagLength: TAG_LENGTH,
    },
    key,
    data
  );

  // Combine salt + iv + ciphertext
  const combined = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(ciphertext), salt.length + iv.length);

  // Return as base64
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt a ciphertext string encrypted with encryptToken
 * Expects base64-encoded input with salt + iv + ciphertext
 */
export async function decryptToken(ciphertext: string, encryptionKey: string): Promise<string> {
  if (!encryptionKey) {
    throw new Error('Encryption key is required');
  }

  try {
    // Decode base64
    const combined = new Uint8Array(
      atob(ciphertext).split('').map(c => c.charCodeAt(0))
    );

    // Extract salt, iv, and ciphertext
    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 16 + IV_LENGTH);
    const encryptedData = combined.slice(16 + IV_LENGTH);

    // Derive key and decrypt
    const key = await deriveKey(encryptionKey, salt);
    const decrypted = await crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv,
        tagLength: TAG_LENGTH,
      },
      key,
      encryptedData
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    throw new Error('Failed to decrypt token - key may be incorrect or data corrupted');
  }
}

/**
 * Check if a string appears to be encrypted by our encryption system
 * Used during migration to handle both encrypted and unencrypted tokens
 *
 * IMPORTANT: OAuth tokens (JWTs) are also valid base64 and long, so we need
 * to be careful not to misidentify them as encrypted.
 */
export function isEncrypted(value: string): boolean {
  if (!value) return false;

  // OAuth/JWT tokens typically start with 'ey' (base64 for '{"')
  // or contain dots (JWT format: header.payload.signature)
  if (value.startsWith('ey') || value.includes('.')) {
    return false;
  }

  // Check if it looks like our encrypted format (base64 without JWT characteristics)
  try {
    const decoded = atob(value);
    // Minimum length: 16 (salt) + 12 (iv) + 16 (min ciphertext with tag)
    // Our encrypted tokens don't start with '{' (which is what 'ey' decodes to)
    if (decoded.length >= 44 && !decoded.startsWith('{')) {
      return true;
    }
  } catch {
    // Not valid base64, so not encrypted
  }

  return false;
}
