import nacl from "tweetnacl";
import { secretbox } from "tweetnacl";
import {
  decodeBase64,
  encodeBase64,
} from "tweetnacl-util";

// Derive a key from password using a simple method
function deriveKey(password: string): Uint8Array {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  
  // Use SubtleCrypto for key derivation
  // For now, use a simple deterministic hash
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    hash = ((hash << 5) - hash) + password.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Create a 32-byte key from password
  const keyArray = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    keyArray[i] = (hash ^ (i * 31)) & 0xff;
  }
  
  return keyArray;
}

export function encryptMnemonic(mnemonic: string, password: string): string {
  try {
    const key = deriveKey(password);
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

export function decryptMnemonic(encrypted: string, password: string): string {
  try {
    const key = deriveKey(password);
    const combined = decodeBase64(encrypted);

    // Extract nonce and ciphertext
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