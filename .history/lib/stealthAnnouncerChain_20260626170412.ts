/**
 * On-chain ERC-5564 Announcer integration.
 *
 * Reads and writes the canonical Announcer singleton, deployed deterministically
 * (CREATE2) at the same address on every chain including Sepolia:
 *   0x55649E01B5Df198D18D95b5cc5051630cfD45564
 *
 * On-chain event shape (from the verified contract ABI):
 *   event Announcement(
 *     uint256 indexed schemeId,
 *     address indexed stealthAddress,
 *     address indexed caller,
 *     bytes ephemeralPubKey,
 *     bytes metadata        // first byte MUST be the view tag
 *   )
 *
 * Note the spec packs the view tag into metadata[0]; there is no separate viewTag
 * field on-chain. We pack on announce and unpack on scan.
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
 * Publish an announcement on-chain. Signs with the provided private key
 * (typically the same address that funded the stealth payment).
 * Returns the announce() transaction hash.
 */
export async function announceOnChain(
  network: NetworkId,
  signingPrivateKey: string,
  stealthAddress: string,
  ephemeralPublicKey: string,
  viewTag: string // "0x.." single byte
): Promise<string> {
  const networkConfig = NETWORKS[network];
  const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrls[0]);
  const signer = new ethers.Wallet(signingPrivateKey, provider);
  const contract = new ethers.Contract(ANNOUNCER_ADDRESS, ANNOUNCER_ABI, signer);

  // metadata: first byte is the view tag (spec requirement)
  const metadata = viewTag; // already a 1-byte hex like "0x58"

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
 * Read announcements from the chain by querying Announcement event logs.
 * Returns them in the same shape as the local store so the scanner is unchanged.
 *
 * fromBlock can be limited to avoid scanning the whole chain; for testnet/demo
 * we look back a bounded window from the latest block.
 */
export async function getOnChainAnnouncements(
  network: NetworkId,
  lookbackBlocks = 50000
): Promise<Announcement[]> {
  const networkConfig = NETWORKS[network];
  const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrls[0]);
  const contract = new ethers.Contract(ANNOUNCER_ADDRESS, ANNOUNCER_ABI, provider);

  const latest = await provider.getBlockNumber();
  const fromBlock = Math.max(0, latest - lookbackBlocks);

  const filter = contract.filters.Announcement(SCHEME_ID);
  const logs = await contract.queryFilter(filter, fromBlock, latest);

  return logs.map((log: any) => {
    const { stealthAddress, ephemeralPubKey, metadata } = log.args;
    // view tag is the first byte of metadata
    const viewTag = metadata && metadata.length >= 4 ? "0x" + metadata.slice(2, 4) : "0x00";
    return {
      schemeId: SCHEME_ID,
      stealthAddress,
      ephemeralPublicKey: ephemeralPubKey,
      viewTag,
      network,
      timestamp: 0, // could fetch block timestamp if needed
      txHash: log.transactionHash,
    } as Announcement;
  });
}