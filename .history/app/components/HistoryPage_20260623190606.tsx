"use client";

import { useState, useEffect } from "react";
import { NetworkId, NETWORKS } from "@/lib/networks";

interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  gasPrice: string;
  timestamp: number;
  status: string;
  network: string;
}

interface HistoryPageProps {
  network: NetworkId;
}

export function HistoryPage({ network }: HistoryPageProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "confirmed" | "failed">("all");
  const networkConfig = NETWORKS[network];

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = () => {
    try {
      const history = JSON.parse(localStorage.getItem("tx_history") || "[]");
      setTransactions(history);
    } catch (err) {
      console.error("Failed to load history:", err);
      setTransactions([]);
    }
  };

  const clearHistory = () => {
    if (confirm("Clear all transaction history? This cannot be undone.")) {
      localStorage.removeItem("tx_history");
      setTransactions([]);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const shortenAddress = (addr: string) => {
    if (!addr) return "Unknown";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const shortenHash = (hash: string) => {
    if (!hash) return "Unknown";
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "text-green-400 bg-green-900/20 border-green-600/30";
      case "failed":
        return "text-red-400 bg-red-900/20 border-red-600/30";
      default:
        return "text-yellow-400 bg-yellow-900/20 border-yellow-600/30";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return "✓";
      case "failed":
        return "✗";
      default:
        return "⏳";
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (filter === "all") return true;
    return tx.status === filter;
  });

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Transaction History</h2>
          <p className="text-slate-400 text-sm mt-1">
            {transactions.length} total transactions
          </p>
        </div>
        {transactions.length > 0 && (
          <button
            onClick={clearHistory}
            className="px-4 py-2 bg-red-900/30 hover:bg-red-900/50 border border-red-600/50 text-red-300 rounded-lg text-sm transition"
          >
            Clear History
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {(["all", "pending", "confirmed", "failed"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition capitalize ${
              filter === status
                ? "bg-purple-600 text-white"
                : "bg-slate-700/50 text-slate-400 hover:bg-slate-700"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Transactions */}
      {filteredTransactions.length === 0 ? (
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700 rounded-xl p-12 text-center">
          <div className="text-5xl mb-4">📭</div>
          <h3 className="text-xl font-bold text-white mb-2">No Transactions Yet</h3>
          <p className="text-slate-400">
            {filter === "all"
              ? "Your transactions will appear here once you start sending."
              : `No ${filter} transactions found.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTransactions.map((tx, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700 rounded-xl p-6 hover:border-slate-600 transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">📤</div>
                  <div>
                    <p className="font-semibold text-white">Sent {tx.value} ETH</p>
                    <p className="text-xs text-slate-500">{formatDate(tx.timestamp)}</p>
                  </div>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                    tx.status
                  )}`}
                >
                  {getStatusIcon(tx.status)} {tx.status}
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">From</span>
                  <span className="font-mono text-slate-300">{shortenAddress(tx.from)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">To</span>
                  <span className="font-mono text-slate-300">{shortenAddress(tx.to)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Gas Price</span>
                  <span className="text-slate-300">{tx.gasPrice} Gwei</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-700">
                  <span className="text-slate-500">Hash</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-blue-300 text-xs">{shortenHash(tx.hash)}</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(tx.hash)}
                      className="text-slate-400 hover:text-slate-300"
                      title="Copy hash"
                    >
                      📋
                    </button>
                  </div>
                </div>
              </div>

              {/* Explorer Link */}
              <a
                href={`${networkConfig.explorerUrl}/tx/${tx.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 block w-full text-center py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition"
              >
                🔗 View on Explorer
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}