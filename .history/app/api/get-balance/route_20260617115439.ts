import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";

const RPC_URLS: Record<string, string[]> = {
  sepolia: [
    "https://sepolia.drpc.org",
    "https://rpc.sepolia.org",
    "https://ethereum-sepolia-rpc.publicnode.com",
  ],
  goerli: [
    "https://goerli.drpc.org",
    "https://rpc.goerli.mudit.blog",
  ],
};

let rpcIndex = 0;

function getNextRPC(network: string = "sepolia"): string {
  const urls = RPC_URLS[network] || RPC_URLS.sepolia;
  const rpc = urls[rpcIndex % urls.length];
  rpcIndex++;
  return rpc;
}

export async function POST(request: NextRequest) {
  try {
    const { address, network } = await request.json();

    if (!address) {
      return NextResponse.json(
        { error: "Missing address" },
        { status: 400 }
      );
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