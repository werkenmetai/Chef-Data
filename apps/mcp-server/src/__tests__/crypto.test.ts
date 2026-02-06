/**
 * Crypto Utilities Tests
 *
 * Tests for the cryptographic utilities including:
 * - Token encryption/decryption roundtrip
 * - Different payload sizes
 * - Invalid key handling
 * - Corrupted ciphertext handling
 * - isEncrypted detection
 */

import { describe, it, expect } from 'vitest';
import { encryptToken, decryptToken, isEncrypted } from '../lib/crypto';

describe('Crypto Utilities', () => {
  const validEncryptionKey = 'test-encryption-key-32-characters!';

  describe('encryptToken / decryptToken roundtrip', () => {
    it('should encrypt and decrypt a simple string', async () => {
      const plaintext = 'my-secret-token';
      const encrypted = await encryptToken(plaintext, validEncryptionKey);
      const decrypted = await decryptToken(encrypted, validEncryptionKey);

      expect(decrypted).toBe(plaintext);
    });

    it('should produce different ciphertext for same plaintext (random IV/salt)', async () => {
      const plaintext = 'my-secret-token';
      const encrypted1 = await encryptToken(plaintext, validEncryptionKey);
      const encrypted2 = await encryptToken(plaintext, validEncryptionKey);

      expect(encrypted1).not.toBe(encrypted2);

      // Both should decrypt to the same value
      const decrypted1 = await decryptToken(encrypted1, validEncryptionKey);
      const decrypted2 = await decryptToken(encrypted2, validEncryptionKey);
      expect(decrypted1).toBe(plaintext);
      expect(decrypted2).toBe(plaintext);
    });

    it('should handle empty string', async () => {
      const plaintext = '';
      const encrypted = await encryptToken(plaintext, validEncryptionKey);
      const decrypted = await decryptToken(encrypted, validEncryptionKey);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle very long plaintext', async () => {
      const plaintext = 'a'.repeat(10000);
      const encrypted = await encryptToken(plaintext, validEncryptionKey);
      const decrypted = await decryptToken(encrypted, validEncryptionKey);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle unicode characters', async () => {
      const plaintext = 'Hello \u00e9\u00f1\u00fc \u4e2d\u6587 \ud83d\ude80';
      const encrypted = await encryptToken(plaintext, validEncryptionKey);
      const decrypted = await decryptToken(encrypted, validEncryptionKey);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle JSON payload', async () => {
      const payload = {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refresh_token: 'rt_abc123',
        expires_in: 3600,
      };
      const plaintext = JSON.stringify(payload);
      const encrypted = await encryptToken(plaintext, validEncryptionKey);
      const decrypted = await decryptToken(encrypted, validEncryptionKey);

      expect(JSON.parse(decrypted)).toEqual(payload);
    });

    it('should handle special characters and newlines', async () => {
      const plaintext = 'line1\nline2\r\ntab\there\t"quotes"\'single\'\\backslash\\';
      const encrypted = await encryptToken(plaintext, validEncryptionKey);
      const decrypted = await decryptToken(encrypted, validEncryptionKey);

      expect(decrypted).toBe(plaintext);
    });
  });

  describe('encryptToken error handling', () => {
    it('should throw when encryption key is missing', async () => {
      await expect(encryptToken('test', '')).rejects.toThrow('Encryption key is required');
    });

    it('should throw when encryption key is undefined', async () => {
      await expect(encryptToken('test', undefined as any)).rejects.toThrow('Encryption key is required');
    });
  });

  describe('decryptToken error handling', () => {
    it('should throw when decryption key is missing', async () => {
      await expect(decryptToken('somedata', '')).rejects.toThrow('Encryption key is required');
    });

    it('should throw when decryption key is undefined', async () => {
      await expect(decryptToken('somedata', undefined as any)).rejects.toThrow('Encryption key is required');
    });

    it('should throw when using wrong decryption key', async () => {
      const encrypted = await encryptToken('secret', validEncryptionKey);
      await expect(decryptToken(encrypted, 'wrong-key-here-must-be-long-too!')).rejects.toThrow(
        'Failed to decrypt token'
      );
    });

    it('should throw when ciphertext is corrupted', async () => {
      const encrypted = await encryptToken('secret', validEncryptionKey);
      // Corrupt the last few characters to ensure we damage the authentication tag
      // AES-GCM auth tag is at the end of the ciphertext and MUST cause decryption to fail
      const len = encrypted.length;
      // Replace last 4 characters with different valid base64 chars
      const corrupted = encrypted.slice(0, len - 4) + 'XXXX';
      await expect(decryptToken(corrupted, validEncryptionKey)).rejects.toThrow('Failed to decrypt token');
    });

    it('should throw when ciphertext is not valid base64', async () => {
      await expect(decryptToken('not-valid-base64!!!', validEncryptionKey)).rejects.toThrow();
    });

    it('should throw when ciphertext is too short', async () => {
      // Valid base64 but too short (needs salt + iv + ciphertext)
      const shortData = btoa('short');
      await expect(decryptToken(shortData, validEncryptionKey)).rejects.toThrow();
    });
  });

  describe('isEncrypted detection', () => {
    it('should detect encrypted tokens', async () => {
      const encrypted = await encryptToken('my-token', validEncryptionKey);
      expect(isEncrypted(encrypted)).toBe(true);
    });

    it('should not detect JWT tokens as encrypted (starts with ey)', () => {
      const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
      expect(isEncrypted(jwt)).toBe(false);
    });

    it('should not detect tokens with dots as encrypted (JWT format)', () => {
      const tokenWithDots = 'abc.def.ghi';
      expect(isEncrypted(tokenWithDots)).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isEncrypted('')).toBe(false);
    });

    it('should return false for null/undefined', () => {
      expect(isEncrypted(null as any)).toBe(false);
      expect(isEncrypted(undefined as any)).toBe(false);
    });

    it('should return false for non-base64 strings', () => {
      expect(isEncrypted('not base64!!!')).toBe(false);
    });

    it('should return false for short base64 strings', () => {
      // Minimum length is 44 decoded bytes
      const shortBase64 = btoa('short');
      expect(isEncrypted(shortBase64)).toBe(false);
    });

    it('should return false for base64 that decodes to JSON', () => {
      // "eyJ" decodes to "{"  - indicates JSON/JWT
      const jsonBase64 = btoa('{"key":"value"}');
      expect(isEncrypted(jsonBase64)).toBe(false);
    });

    it('should correctly identify OAuth access tokens as not encrypted', () => {
      // Typical OAuth access token format
      const oauthToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6Ik1yNS1BVWliZkJpaTdOZDFq...';
      expect(isEncrypted(oauthToken)).toBe(false);
    });
  });

  describe('Different payload sizes', () => {
    const testSizes = [1, 10, 100, 500, 1000, 5000];

    testSizes.forEach(size => {
      it(`should handle ${size} byte payload`, async () => {
        const plaintext = 'x'.repeat(size);
        const encrypted = await encryptToken(plaintext, validEncryptionKey);
        const decrypted = await decryptToken(encrypted, validEncryptionKey);

        expect(decrypted).toBe(plaintext);
        expect(decrypted.length).toBe(size);
      });
    });
  });

  describe('Key derivation consistency', () => {
    it('should produce same decryption with same key', async () => {
      const encrypted = await encryptToken('test-data', validEncryptionKey);

      // Decrypt multiple times with same key
      const decrypted1 = await decryptToken(encrypted, validEncryptionKey);
      const decrypted2 = await decryptToken(encrypted, validEncryptionKey);
      const decrypted3 = await decryptToken(encrypted, validEncryptionKey);

      expect(decrypted1).toBe('test-data');
      expect(decrypted2).toBe('test-data');
      expect(decrypted3).toBe('test-data');
    });

    it('should work with different key lengths', async () => {
      const shortKey = 'short';
      const longKey = 'a'.repeat(100);

      const encrypted1 = await encryptToken('data1', shortKey);
      const encrypted2 = await encryptToken('data2', longKey);

      const decrypted1 = await decryptToken(encrypted1, shortKey);
      const decrypted2 = await decryptToken(encrypted2, longKey);

      expect(decrypted1).toBe('data1');
      expect(decrypted2).toBe('data2');
    });
  });
});
