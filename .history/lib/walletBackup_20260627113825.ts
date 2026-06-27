/**
 * Encrypted wallet backup — export and import.
 *
 * Bundles the wallet's local data into a single JSON file, encrypted with the
 * user's password (PBKDF2 -> XSalsa20-Poly1305 via tweetnacl). The downloaded
 * file is safe to store: without the password it's useless.
 *
 * Educational/testnet note: this backs up whatever is in localStorage, including
 * the already-encrypted seed blob. The password here protects the backup file
 * itself (defense in depth).
 */

import nacl from "tweetnacl";

// localStorage keys we include in a backup
const BACKUP_KEYS = [
  "encrypted_wallet",
  "stealth_keys",
  "stealth_announcements",
  "tx_history",
  "announcer_mode",
];

const SALT = "anonwallet-backup-v1";
const PBKDF2_ITERATIONS = 100000;

interface BackupPayload {
  version: 1;
  createdAt: number;
  data: Record<string, string | null>;
}

// PBKDF2 via Web Crypto -> 32-byte key
async function deriveKey(password: string): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: enc.encode(SALT),
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    baseKey,
    256
  );
  return new Uint8Array(bits);
}

function toBase64(bytes: Uint8Array): string {
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}

function fromBase64(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/**
 * Create an encrypted backup string from current localStorage data.
 */
export async function exportBackup(password: string): Promise<string> {
  if (!password) throw new Error("Password required to encrypt backup");

  const data: Record<string, string | null> = {};
  for (const key of BACKUP_KEYS) {
    data[key] = localStorage.getItem(key);
  }

  const payload: BackupPayload = {
    version: 1,
    createdAt: Date.now(),
    data,
  };

  const key = await deriveKey(password);
  const nonce = nacl.randomBytes(24);
  const msg = new TextEncoder().encode(JSON.stringify(payload));
  const box = nacl.secretbox(msg, nonce, key);

  const combined = new Uint8Array(nonce.length + box.length);
  combined.set(nonce);
  combined.set(box, nonce.length);

  // wrap in a small envelope so the file is self-describing
  return JSON.stringify({
    app: "AnonWallet",
    type: "encrypted-backup",
    version: 1,
    payload: toBase64(combined),
  });
}

/**
 * Trigger a browser download of the encrypted backup.
 */
export async function downloadBackup(password: string): Promise<void> {
  const contents = await exportBackup(password);
  const blob = new Blob([contents], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `anonwallet-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Decrypt a backup string and restore it into localStorage.
 * Returns the list of restored keys.
 */
export async function importBackup(
  fileContents: string,
  password: string
): Promise<string[]> {
  if (!password) throw new Error("Password required to decrypt backup");

  let envelope: any;
  try {
    envelope = JSON.parse(fileContents);
  } catch {
    throw new Error("Invalid backup file (not valid JSON)");
  }
  if (envelope?.type !== "encrypted-backup" || !envelope?.payload) {
    throw new Error("This file is not an AnonWallet backup");
  }

  const key = await deriveKey(password);
  const combined = fromBase64(envelope.payload);
  const nonce = combined.slice(0, 24);
  const box = combined.slice(24);

  const opened = nacl.secretbox.open(box, nonce, key);
  if (!opened) {
    throw new Error("Wrong password or corrupted backup");
  }

  const payload: BackupPayload = JSON.parse(new TextDecoder().decode(opened));

  const restored: string[] = [];
  for (const [k, v] of Object.entries(payload.data)) {
    if (v !== null && v !== undefined) {
      localStorage.setItem(k, v);
      restored.push(k);
    }
  }
  return restored;
}