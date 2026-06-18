import { NETWORKS, NetworkId } from "./networks";

export interface SavedAddress {
  address: string;
  label: string;
  network: NetworkId;
  index: number;
  createdAt: number;
}

export interface Transaction {
  id: string;
  from: string;
  to: string;
  value: string; // in ETH
  txHash: string;
  network: NetworkId;
  timestamp: number;
  status: "pending" | "confirmed" | "failed";
}

// Store metadata about addresses (labels, networks)
export function saveAddressLabel(
  address: string,
  label: string,
  network: NetworkId,
  index: number
) {
  const key = `address_${address}_${network}`;
  localStorage.setItem(
    key,
    JSON.stringify({
      address,
      label,
      network,
      index,
      createdAt: Date.now(),
    })
  );
}

export function getAddressLabel(
  address: string,
  network: NetworkId
): string | null {
  const key = `address_${address}_${network}`;
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data).label : null;
}

// Store transaction history
export function addTransaction(tx: Transaction) {
  const txs = getAllTransactions();
  txs.push(tx);
  localStorage.setItem("transactions", JSON.stringify(txs));
}

export function getAllTransactions(): Transaction[] {
  const data = localStorage.getItem("transactions");
  return data ? JSON.parse(data) : [];
}

export function getTransactionsByNetwork(network: NetworkId): Transaction[] {
  return getAllTransactions().filter((tx) => tx.network === network);
}