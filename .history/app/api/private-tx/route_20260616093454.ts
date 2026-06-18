import { NextRequest, NextResponse } from "next/server";
import { MEV_BLOCKER_RPC } from "@/lib/constants";

export async function POST(request: NextRequest) {
  try {
    const { signedTx } = await request.json();

    if (!signedTx) {
      return NextResponse.json(
        { error: "Missing signedTx" },
        { status: 400 }
      );
    }

    const response = await fetch(MEV_BLOCKER_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_sendRawTransaction",
        params: [signedTx],
        id: Date.now(),
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
      success: true,
      txHash: data.result,
      sentVia: "MEV-Blocker",
    });
  } catch (error) {
    console.error("[Private TX Error]", error);
    return NextResponse.json(
      { error: "Failed to send transaction" },
      { status: 500 }
    );
  }
}