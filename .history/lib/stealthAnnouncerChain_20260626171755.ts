/**
 * On-chain ERC-5564 Announcer integration.
 *
 * Reads and writes the canonical Announcer singleton, deployed deterministically
 * (CREATE2) at the same address on every chain including Sepolia:
 *   0x55649E01B5Df198D18D95b5cc5051630cfD45564
 *
 * On-chain event shape (verified contract ABI):
 *   event Announcement(uint256 indexed schemeId, address indexed stealthAddress,
 *                       address indexed caller, bytes ephemeralPubKey, bytes metadata)
 * The view tag is metadata[0] (no separate field on-chain).
 */

import { ethers } from "ethers";
import { NetworkId, NETWORKS } from "./networks";
import { Announcement } from "./stealthAnnouncer";

export const ANNOUNCER_ADDRESS = "0x55649E01B5Df198D18D95b5cc5051630cfD45564";

export const ANNOUNCER_ABI = [
  "event Announcement(uint256 indexed schemeId, address indexed stealthAddress, address indexed caller, bytes ephemeralPubKey, bytes metadata)",
  "function announce(uint256 schemeId, address stealthAddress, bytes ephemeralPubKey, bytes metadata) external",
];

const SCHEME_ID = 1; // secp256k1

/**
 * Build a provider with request batching DISABLED.
 * Many free-tier RPCs (e.g. drpc.org) reject batches of >3 requests, which
 * ethers does automatically when reading logs. batchMaxCount: 1 forces each
 * call to be sent individually.
 */
function makeProvider(rpcUrl: string): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(rpcUrl, undefined, { batchMaxCount: 1 });
}

export async function announceOnChain(
  network: NetworkId,
  signingPrivateKey: string,
  stealthAddress: string,
  ephemeralPublicKey: string,
  viewTag: string
): Promise<string> {
  const networkConfig = NETWORKS[network];
  const provider = makeProvider(networkConfig.rpcUrls[0]);
  const signer = new ethers.Wallet(signingPrivateKey, provider);
  const contract = new ethers.Contract(ANNOUNCER_ADDRESS, ANNOUNCER_ABI, signer);

  const metadata = viewTag; // first byte is the view tag

  const tx = await contract.announce(
    SCHEME_ID,
    stealthAddress,
    ephemeralPublicKey,
    metadata
  );
  await tx.wait();
  return tx.hash;
}

/**
 * Read announcements from the chain in small block chunks, with batching off,
 * so we stay within free-tier RPC limits. Returns newest-first.
 */
export async function getOnChainAnnouncements(
  network: NetworkId,
  lookbackBlocks = 9000,
  chunkSize = 800
): Promise<Announcement[]> {
  const networkConfig = NETWORKS[network];

  // try each RPC until one works
  let lastErr: any = null;
  for (const rpcUrl of networkConfig.rpcUrls) {
    try {
      const provider = makeProvider(rpcUrl);
      const contract = new ethers.Contract(ANNOUNCER_ADDRESS, ANNOUNCER_ABI, provider);

      const latest = await provider.getBlockNumber();
      const start = Math.max(0, latest - lookbackBlocks);

      const results: Announcement[] = [];
      // query in chunks to respect getLogs block-range limits
      for (let from = start; from <= latest; from += chunkSize) {
        const to = Math.min(from + chunkSize - 1, latest);
        const filter = contract.filters.Announcement(SCHEME_ID);
        const logs = await contract.queryFilter(filter, from, to);
        for (const log of logs as any[]) {
          const { stealthAddress, ephemeralPubKey, metadata } = log.args;
          const viewTag =
            metadata && metadata.length >= 4 ? "0x" + metadata.slice(2, 4) : "0x00";
          results.push({
            schemeId: SCHEME_ID,
            stealthAddress,
            ephemeralPublicKey: ephemeralPubKey,
            viewTag,
            network,
            timestamp: 0,
            txHash: log.transactionHash,
          });
        }
      }
      // newest first
      return results.reverse();
    } catch (err) {
      lastErr = err;
      // try next rpc
    }
  }
  throw lastErr ?? new Error("Failed to read on-chain announcements");
}