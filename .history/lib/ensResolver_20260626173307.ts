/**
 * ENS resolution helper.
 *
 * ENS names live on Ethereum mainnet, so we resolve names against a mainnet
 * provider even when the wallet is operating on a testnet. The resolved address
 * is then used for the transaction on whatever network is selected.
 *
 * Uses several public mainnet RPCs with fallback — if one is down or rate-limited,
 * it tries the next. Batching is disabled to respect free-tier limits.
 */

import { ethers } from "ethers";

// Public mainnet RPCs (no API key). Tried in order until one resolves.
const MAINNET_RPCS = [
  "https://ethereum-rpc.publicnode.com",
  "https://rpc.ankr.com/eth",
  "https://eth.drpc.org",
  "https://cloudflare-eth.com",
  "https://eth.llamarpc.com",
];

function makeProvider(rpcUrl: string): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(rpcUrl, 1, { batchMaxCount: 1 });
}

/** True if the string looks like an ENS name (e.g. "alice.eth"). */
export function isENSName(input: string): boolean {
  const v = input.trim().toLowerCase();
  return (
    v.includes(".") &&
    (v.endsWith(".eth") || v.endsWith(".xyz") || v.endsWith(".cb.id"))
  );
}

/**
 * Resolve an ENS name to an address, trying each RPC until one succeeds.
 * Returns null only if the name genuinely doesn't resolve on a working RPC.
 */
export async function resolveENS(name: string): Promise<string | null> {
  const trimmed = name.trim();
  for (const rpc of MAINNET_RPCS) {
    try {
      const provider = makeProvider(rpc);
      // resolveName returns address or null; a thrown error = RPC problem, try next
      const addr = await provider.resolveName(trimmed);
      // if the call succeeded (even returning null = "no such name"), trust it
      return addr;
    } catch {
      // RPC failed, try the next one
      continue;
    }
  }
  // all RPCs failed
  return null;
}

/** Reverse-resolve an address to a primary ENS name (for display). Null if none. */
export async function lookupENS(address: string): Promise<string | null> {
  for (const rpc of MAINNET_RPCS) {
    try {
      const provider = makeProvider(rpc);
      return await provider.lookupAddress(address);
    } catch {
      continue;
    }
  }
  return null;
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