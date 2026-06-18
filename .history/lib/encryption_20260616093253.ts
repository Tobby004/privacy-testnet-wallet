import nacl from "tweetnacl";
import { secretbox, randomBytes } from "tweetnacl";
import * as util from "tweetnacl-util";

export function encryptMnemonic(
  mnemonic: string,
  password: string
): string {
  const passwordBytes = util.decodeUTF8(password);
  const hash = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    hash[i] = (passwordBytes[i % passwordBytes.length] || 0) ^ (i * 7);
  }

  const nonce = randomBytes(secretbox.nonceLength);
  const messageBytes = util.decodeUTF8(mnemonic);
  const encrypted = secretbox(messageBytes, nonce, hash);

  if (!encrypted) throw new Error("Encryption failed");

  const combined = new Uint8Array(nonce.length + encrypted.length);
  combined.set(nonce);
  combined.set(encrypted, nonce.length);

  return util.encodeBase64(combined);
}

export function decryptMnemonic(
  encrypted: string,
  password: string
): string {
  const passwordBytes = util.decodeUTF8(password);
  const hash = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    hash[i] = (passwordBytes[i % passwordBytes.length] || 0) ^ (i * 7);
  }

  const combined = util.decodeBase64(encrypted);
  const nonce = combined.slice(0, secretbox.nonceLength);
  const ciphertext = combined.slice(secretbox.nonceLength);

  const decrypted = secretbox.open(ciphertext, nonce, hash);
  if (!decrypted) throw new Error("Decryption failed");

  return util.encodeUTF8(decrypted);
}