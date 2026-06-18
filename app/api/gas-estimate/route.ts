import { NextRequest, NextResponse } from "next/server";
import { RPC_ENDPOINTS } from "@/lib/constants";

let rpcIndex = 0;

function getNextRPC(): string {
  const rpc = RPC_ENDPOINTS[rpcIndex % RPC_ENDPOINTS.length];
  rpcIndex++;
  return rpc;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rpcUrl = getNextRPC();

    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_estimateGas",
        params: [
          {
            to: body.to,
            value: body.value,
            data: body.data || "0x",
          },
        ],
        id: 1,
      }),
    });

    const data = await response.json();

    if (data.error) {
      return NextResponse.json(
        { error: data.error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      gasLimit: data.result,
    });
  } catch (error) {
    console.error("[Gas Estimate Error]", error);
    return NextResponse.json(
      { error: "Gas estimation failed" },
      { status: 500 }
    );
  }
}