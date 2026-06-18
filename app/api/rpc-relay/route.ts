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
    const { method, params, id } = body;

    if (!method) {
      return NextResponse.json(
        { error: "Missing method" },
        { status: 400 }
      );
    }

    const rpcUrl = getNextRPC();

    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method,
        params,
        id,
      }),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[RPC Error]", error);
    return NextResponse.json(
      { error: "RPC request failed" },
      { status: 500 }
    );
  }
}