import nacl from "tweetnacl";
import { secretbox } from "tweetnacl";
import { decodeBase64, encodeBase64 } from "tweetnacl-util";

/**
 * Derive a consistent 32-byte key from password
 * Uses a more reliable method based on repeated hashing
 */
async function deriveKey(password: string): Promise<Uint8Array> {
  // Create a TextEncoder to convert password to bytes
  const encoder = new TextEncoder();
  const passwordBytes = encoder.encode(password);

  // Use SubtleCrypto for proper key derivation
  try {
    // Import the password as a key
    const importedKey = await crypto.subtle.importKey(
      "raw",
      passwordBytes,
      { name: "PBKDF2" },
      false,
      ["deriveBits"]
    );

    // Derive 256 bits (32 bytes) using PBKDF2
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: new Uint8Array(16), // Fixed salt for consistency
        iterations: 100000,
        hash: "SHA-256",
      },
      importedKey,
      256 // 256 bits = 32 bytes
    );

    return new Uint8Array(derivedBits);
  } catch (error) {
    // Fallback if SubtleCrypto fails
    console.warn("PBKDF2 failed, using fallback");
    return deriveKeyFallback(password);
  }
}

/**
 * Fallback key derivation (deterministic but simpler)
 */
function deriveKeyFallback(password: string): Uint8Array {
  const key = new Uint8Array(32);
  let hash = 0;

  // Generate initial hash
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit signed int
  }

  // Fill key bytes deterministically
  for (let i = 0; i < 32; i++) {
    hash = Math.imul(hash ^ (i * 73856093), 19349663);
    key[i] = hash & 0xff;
  }

  return key;
}

export async function encryptMnemonic(
  mnemonic: string,
  password: string
): Promise<string> {
  try {
    const key = await deriveKey(password);
    const nonce = nacl.randomBytes(24);
    const message = new TextEncoder().encode(mnemonic);

    const encrypted = secretbox(message, nonce, key);
    if (!encrypted) throw new Error("Encryption failed");

    // Combine nonce + encrypted data
    const combined = new Uint8Array(nonce.length + encrypted.length);
    combined.set(nonce);
    combined.set(encrypted, nonce.length);

    return encodeBase64(combined);
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt mnemonic");
  }
}

export async function decryptMnemonic(
  encrypted: string,
  password: string
): Promise<string> {
  try {
    const key = await deriveKey(password);
    const combined = decodeBase64(encrypted);

    // Extract nonce (first 24 bytes) and ciphertext (rest)
    const nonce = combined.slice(0, 24);
    const ciphertext = combined.slice(24);

    const decrypted = secretbox.open(ciphertext, nonce, key);
    if (!decrypted) {
      throw new Error("Decryption failed - incorrect password or corrupted data");
    }

    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Incorrect password");
  }
}