import { ethers } from "ethers";

export interface PrivateTransaction {
  to: string;
  value: string;
  data?: string;
  gasLimit?: string;
  nonce: number;
  chainId: number;
}

export function buildTransaction(
  from: string,
  to: string,
  valueEth: string,
  nonce: number,
  chainId: number,
  gasLimit: string = "21000",
  gasPrice: string = ethers.parseUnits("1", "gwei").toString()
): PrivateTransaction {
  const valueWei = ethers.parseEther(valueEth).toString();

  return {
    to,
    value: valueWei,
    nonce,
    chainId,
    gasLimit,
    data: "0x",
  };
}

export async function estimateGasPrivate(
  tx: PrivateTransaction
): Promise<string> {
  const response = await fetch("/api/gas-estimate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(tx),
  });

  if (!response.ok) throw new Error("Gas estimation failed");
  const { gasLimit } = await response.json();
  return gasLimit;
}

export function prepareTxForSigning(
  tx: PrivateTransaction,
  gasPrice: string
): ethers.TransactionRequest {
  return {
    to: tx.to,
    value: tx.value,
    data: tx.data || "0x",
    nonce: tx.nonce,
    gasLimit: tx.gasLimit,
    gasPrice,
    chainId: tx.chainId,
  };
}