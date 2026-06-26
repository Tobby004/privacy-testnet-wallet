/**
 * Gas presets — Slow / Normal / Fast.
 *
 * Fetches the network's current gas price and applies a multiplier, with a
 * minimum floor so a transaction never broadcasts too low to confirm (the
 * cause of "stuck pending" on testnets where reported gas can be near-zero).
 */

import { ethers } from "ethers";

export type GasSpeed = "slow" | "normal" | "fast";

export interface GasOption {
  speed: GasSpeed;
  label: string;
  gwei: string;       // human-readable gas price
  description: string;
}

// Multipliers over the network's current gas price.
const MULTIPLIERS: Record<GasSpeed, number> = {
  slow: 1.0,
  normal: 1.5,
  fast: 2.0,
};

// Absolute floor (gwei) so testnet txs always confirm.
const MIN_GWEI: Record<GasSpeed, number> = {
  slow: 3,
  normal: 5,
  fast: 10,
};

/**
 * Fetch the three preset gas prices for a network, given an RPC URL.
 * Returns gwei strings ready to display and use.
 */
export async function fetchGasPresets(rpcUrl: string): Promise<GasOption[]> {
  let baseGwei = 5; // fallback if the RPC doesn't report
  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl, undefined, { batchMaxCount: 1 });
    const feeData = await provider.getFeeData();
    if (feeData.gasPrice) {
      baseGwei = Number(ethers.formatUnits(feeData.gasPrice, "gwei"));
    }
  } catch {
    // keep fallback
  }

  const make = (speed: GasSpeed, label: string, description: string): GasOption => {
    const computed = baseGwei * MULTIPLIERS[speed];
    const gwei = Math.max(computed, MIN_GWEI[speed]);
    // round to 2 decimals, strip trailing zeros
    const gweiStr = parseFloat(gwei.toFixed(2)).toString();
    return { speed, label, gwei: gweiStr, description };
  };

  return [
    make("slow", "Slow", "Cheapest; may take longer"),
    make("normal", "Normal", "Balanced speed and cost"),
    make("fast", "Fast", "Confirms quickly"),
  ];
}