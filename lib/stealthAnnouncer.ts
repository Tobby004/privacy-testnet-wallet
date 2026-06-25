/**
 * Local Announcer store (educational stand-in for the on-chain ERC-5564 Announcer).
 *
 * On mainnet/Sepolia, the canonical Announcer at
 * 0x55649E01B5Df198D18D95b5cc5051630cfD45564 emits an `Announcement` event
 * containing (schemeId, stealthAddress, caller, ephemeralPubKey, metadata).
 * The recipient scans those events and runs checkAnnouncement() on each.
 *
 * Here we store the same announcement payload in localStorage so the full
 * scan -> detect -> derive flow works on testnet without gas. The cryptography
 * is identical; only the announcement transport differs.
 *
 * To go fully on-chain later, swap these read/write functions for contract
 * event reads/writes — nothing else in the app needs to change.
 */

export interface Announcement {
  schemeId: number;          // 1 = secp256k1
  stealthAddress: string;    // the one-time address funds were sent to
  ephemeralPublicKey: string; // sender's ephemeral pubkey (recipient needs this)
  viewTag: string;           // 1-byte fast-scan tag
  network: string;           // which testnet
  timestamp: number;
  // educational extras (NOT part of the on-chain event):
  amount?: string;           // what the sender intended to send
  txHash?: string;           // funding tx, if broadcast
}

const STORAGE_KEY = "stealth_announcements";

/** Read all announcements (the local equivalent of scanning the event log). */
export function getAnnouncements(network?: string): Announcement[] {
  try {
    const all: Announcement[] = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]"
    );
    return network ? all.filter((a) => a.network === network) : all;
  } catch {
    return [];
  }
}

/** Publish an announcement (the local equivalent of emitting the event). */
export function publishAnnouncement(a: Announcement): void {
  const all = getAnnouncements();
  all.unshift(a);
  // keep the store bounded
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all.slice(0, 200)));
}

/** Clear all local announcements (handy for testing/reset). */
export function clearAnnouncements(): void {
  localStorage.removeItem(STORAGE_KEY);
}