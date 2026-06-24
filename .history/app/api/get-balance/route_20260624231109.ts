import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import { NETWORKS, NetworkId } from "@/lib/networks";

let rpcIndex = 0;

function getNextRPC(network: string = "sepolia"): string {
  // Pull RPCs from the central networks config so all networks are supported
  const config = (network in NETWORKS)
    ? NETWORKS[network as NetworkId]
    : NETWORKS.sepolia;
  const urls = config.rpcUrls;
  const rpc = urls[rpcIndex % urls.length];
  rpcIndex++;
  return rpc;
}

export async function POST(request: NextRequest) {
  try {
    const { address, network } = await request.json();

    if (!address) {
      return NextResponse.json({ error: "Missing address" }, { status: 400 });
    }

    const rpcUrl = getNextRPC(network || "sepolia");

    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const balance = await provider.getBalance(address);
      const balanceEth = ethers.formatEther(balance);

      return NextResponse.json({
        address,
        balance: balanceEth,
        balanceWei: balance.toString(),
        network: network || "sepolia",
      });
    } catch (rpcError) {
      console.error("RPC error:", rpcError);
      return NextResponse.json(
        { error: "RPC request failed", details: String(rpcError) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[Balance Error]", error);
    return NextResponse.json(
      { error: "Failed to fetch balance", details: String(error) },
      { status: 500 }
    );
  }
}