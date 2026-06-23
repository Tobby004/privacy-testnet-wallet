"use client";

import { useEffect, useState } from "react";
import { NetworkId, NETWORKS } from "@/lib/networks";
import { getAllTransactions } from "@/lib/storage";

interface HistoryPageProps {
  network: NetworkId;
}

export function HistoryPage({ network }: HistoryPageProps) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const networkConfig = NETWORKS[network];

  useEffect(() => {
    setTransactions(getAllTransactions().filter((tx) => tx.network === network).reverse());
  }, [network]);

  if (transactions.length === 0) {
    return (
      <div className="max-w-2xl">
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700 rounded-xl p-12 text-center">
          <div className="text-5xl mb-4">📜</div>
          <p className="text-lg font-semibold text-white mb-2">No transactions yet</p>
          <p className="text-slate-400">Send a transaction to see it appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">All Transactions</h2>
        <div className="bg-teal-500/20 text-teal-300 px-4 py-2 rounded-full text-sm font-semibold">
          {transactions.length} total
        </div>
      </div>

      <div className="space-y-3">
        {transactions.map((tx) => (
          <div
            key={tx.id}
            className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700 hover:border-slate-600 rounded-xl p-6 transition"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <p className="text-lg font-bold text-white">Sent {tx.value} ETH</p>
                <p className="text-xs font-mono text-slate-500 mt-2">
                  From: {tx.from.substring(0, 10)}...{tx.from.substring(tx.from.length - 8)}
                </p>
                <p className="text-xs font-mono text-slate-500 mt-1">
                  To: {tx.to.substring(0, 10)}...{tx.to.substring(tx.to.length - 8)}
                </p>
              </div>
              <div className="text-right">
                <span
                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
                    tx.status === "confirmed"
                      ? "bg-green-900/30 text-green-300"
                      : tx.status === "pending"
                      ? "bg-yellow-900/30 text-yellow-300"
                      : "bg-red-900/30 text-red-300"
                  }`}
                >
                  {tx.status === "confirmed" && "✓"}
                  {tx.status === "pending" && "⏳"}
                  {tx.status === "failed" && "✕"}
                  {tx.status.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-700">
              <p className="text-xs text-slate-500">
                {new Date(tx.timestamp).toLocaleDateString()} at{" "}
                {new Date(tx.timestamp).toLocaleTimeString()}
              </p>
              <a
                href={`${networkConfig.explorerUrl}/tx/${tx.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition"
              >
                View on Etherscan →
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}