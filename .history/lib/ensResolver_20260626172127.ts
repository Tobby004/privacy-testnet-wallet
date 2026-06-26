/**
 * ENS resolution helper.
 *
 * ENS names live on Ethereum mainnet, so we resolve names against a mainnet
 * provider even when the wallet is operating on a testnet. The resolved address
 * is then used for the transaction on whatever network is selected.
 *
 * Reverse resolution (address -> name) is also provided for display.
 */

import { ethers } from "ethers";

// Public mainnet RPC for ENS lookups (read-only, no key needed).
// Batching disabled to stay friendly with free-tier limits.
const MAINNET_RPC = "https://eth.llamarpc.com";

let cachedProvider: ethers.JsonRpcProvider | null = null;
function mainnetProvider(): ethers.JsonRpcProvider {
  if (!cachedProvider) {
    cachedProvider = new ethers.JsonRpcProvider(MAINNET_RPC, 1, { batchMaxCount: 1 });
  }
  return cachedProvider;
}

/** True if the string looks like an ENS name (e.g. "alice.eth"). */
export function isENSName(input: string): boolean {
  const v = input.trim().toLowerCase();
  return v.includes(".") && (v.endsWith(".eth") || v.endsWith(".xyz") || v.endsWith(".cb.id"));
}

/**
 * Resolve an ENS name to an address. Returns null if it doesn't resolve.
 */
export async function resolveENS(name: string): Promise<string | null> {
  try {
    const addr = await mainnetProvider().resolveName(name.trim());
    return addr; // null if not found
  } catch {
    return null;
  }
}

/**
 * Reverse-resolve an address to a primary ENS name (for display). Null if none.
 */
export async function lookupENS(address: string): Promise<string | null> {
  try {
    return await mainnetProvider().lookupAddress(address);
  } catch {
    return null;
  }
}

/**
 * Given user input that is EITHER a 0x address OR an ENS name, return a usable
 * 0x address. Throws with a clear message if it can't be resolved.
 */
export async function resolveRecipient(input: string): Promise<string> {
  const trimmed = input.trim();
  if (ethers.isAddress(trimmed)) return trimmed;
  if (isENSName(trimmed)) {
    const resolved = await resolveENS(trimmed);
    if (!resolved) throw new Error(`Could not resolve ENS name "${trimmed}"`);
    return resolved;
  }
  throw new Error("Enter a valid address or ENS name");
}