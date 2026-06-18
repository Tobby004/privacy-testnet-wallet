"use client";

import { useState, useEffect } from "react";
import { PrivacyWallet, DerivedAddress } from "@/lib/hdWallet";
import { NetworkId, NETWORKS } from "@/lib/networks";
import { getAllTransactions } from "@/lib/storage";
import { TransactionBuilder } from "./TransactionBuilder";
import { TutorialModal } from "./TutorialModal";
import { HelpIcon } from "./HelpIcon";

interface DashboardProps {
  wallet: PrivacyWallet;
  network: NetworkId;
  onNetworkChange: (network: NetworkId) => void;
  onLock: () => void;
}

export function Dashboard({ wallet, network, onNetworkChange, onLock }: DashboardProps) {
  const [addresses, setAddresses] = useState<DerivedAddress[]>([]);
  const [balances, setBalances] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState("");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [showTransactionBuilder, setShowTransactionBuilder] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    // Check if user has seen tutorial
    const hasSeenTutorial = localStorage.getItem("tutorial_seen");
    if (!hasSeenTutorial) {
      setShowTutorial(true);
      localStorage.setItem("tutorial_seen", "true");
    }

    const derived = wallet.getAllDerivedAddresses(3);
    setAddresses(derived);
    
    derived.forEach((addr) => {
      fetchBalance(addr.address);
    });

    setTransactions(getAllTransactions().filter(tx => tx.network === network));
    setLoading(false);
  }, [wallet, network]);

  const fetchBalance = async (address: string) => {
    try {
      const response = await fetch("/api/get-balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, network }),
      });
      const data = await response.json();
      if (data.balance) {
        setBalances(prev => ({ ...prev, [address]: data.balance }));
      }
    } catch (error) {
      console.error("Failed to fetch balance:", error);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(""), 2000);
  };

  const networkConfig = NETWORKS[network];
  
  if (!networkConfig) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-lg">Error: Network configuration not found</p>
        </div>
      </div>
    );
  }

  const totalBalance = addresses.reduce((sum, addr) => {
    const balance = parseFloat(balances[addr.address] || "0");
    return sum + balance;
  }, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header with Help */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold">Privacy Wallet</h1>
            <div className="flex gap-4 mt-3 flex-wrap">
              <div className="px-3 py-1 bg-teal-900/30 border border-teal-500/30 rounded-full">
                <p className="text-xs font-semibold text-teal-300">🌐 {networkConfig.name}</p>
              </div>
              <div className="px-3 py-1 bg-blue-900/30 border border-blue-500/30 rounded-full">
                <p className="text-xs font-semibold text-blue-300">⛓️ Chain: {networkConfig.chainId}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowTutorial(true)}
              className="px-3 py-2 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg text-slate-300 text-sm font-semibold transition"
            >
              📖 Tutorial
            </button>
            <button
              onClick={onLock}
              className="px-4 py-2 bg-red-900/20 hover:bg-red-900/30 border border-red-500/30 rounded-lg text-red-300 text-sm font-semibold transition"
            >
              🔒 Lock
            </button>
          </div>
        </div>

        {/* Total Balance Card - POLISHED */}
        <div className="mb-8 bg-gradient-to-r from-green-900/20 via-emerald-900/20 to-teal-900/20 border border-green-500/30 rounded-xl p-8 shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-green-300 font-semibold mb-2 uppercase tracking-wider">Total Balance</p>
              <p className="text-5xl font-bold text-green-400">{totalBalance.toFixed(4)}</p>
              <p className="text-xs text-green-200/70 mt-3">Across {addresses.length} fresh addresses on {networkConfig.name}</p>
            </div>
            <div className="text-5xl opacity-20">💰</div>
          </div>
        </div>

        {/* Network Selector - POLISHED */}
        <div className="mb-8 bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <p className="text-sm font-semibold text-slate-300">Switch Network</p>
            <HelpIcon text="Different testnets have different addresses. Your addresses are unique per network to maintain privacy." title="Why networks matter" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(NETWORKS).map(([id, config]) => (
              <button
                key={id}
                onClick={() => onNetworkChange(id as NetworkId)}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  network === id
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-slate-700 hover:bg-slate-600 text-slate-300"
                }`}
              >
                {config.name}
              </button>
            ))}
          </div>
        </div>

        {/* Get Testnet ETH - POLISHED */}
        <div className="mb-8 bg-gradient-to-r from-yellow-900/20 to-amber-900/20 border border-yellow-600/30 rounded-xl p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-semibold text-yellow-300 mb-2">⚡ Get Testnet ETH</p>
              <p className="text-xs text-yellow-200 mb-4">Your addresses start at 0 ETH. Get test funds from the faucet below (takes ~30 seconds).</p>
              <a
                href={networkConfig.faucetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-semibold rounded-lg transition shadow-md"
              >
                Get {networkConfig.name} ETH →
              </a>
            </div>
            <div className="text-4xl opacity-20">🌐</div>
          </div>
        </div>

        {/* Fresh Addresses Section - POLISHED */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-2xl font-bold text-white">Your Addresses</h2>
            <HelpIcon 
              text="Each address is independently derived using BIP-44. Using different addresses prevents on-chain linking of your transactions." 
              title="Fresh Addresses"
            />
          </div>
          <p className="text-sm text-slate-400 mb-6">
            Each transaction uses a new address. Observers can't link your transfers together.
          </p>

          <div className="grid gap-4">
            {addresses.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <p className="text-lg">Loading addresses...</p>
              </div>
            ) : (
              addresses.map((addr, idx) => (
                <div
                  key={idx}
                  className="bg-slate-800/30 border border-slate-700 rounded-xl p-6 hover:border-slate-600 hover:bg-slate-800/50 transition group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-sm font-bold text-slate-300 bg-slate-700/50 px-3 py-1 rounded-lg">Address #{idx}</p>
                        <p className="text-xs text-slate-500 font-mono">{addr.path}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(addr.address, `addr-${idx}`)}
                      className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-semibold rounded transition"
                    >
                      {copied === `addr-${idx}` ? "✓ Copied" : "📋 Copy"}
                    </button>
                  </div>

                  <div className="bg-slate-900/50 rounded-lg p-3 mb-4 border border-slate-700">
                    <p className="text-sm font-mono text-blue-300 break-all">{addr.address}</p>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <p className="text-xs font-semibold text-slate-400">Ready for transaction</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Balance</p>
                      <p className="text-sm font-mono font-semibold text-green-400 mt-1">
                        {balances[addr.address] ? `${parseFloat(balances[addr.address]).toFixed(4)} ETH` : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Transactions - POLISHED */}
        {transactions.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-2xl font-bold text-white">Recent Transactions</h2>
              <div className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-xs font-semibold">
                {transactions.length}
              </div>
            </div>
            <div className="space-y-3">
              {transactions.slice(-5).reverse().map((tx) => (
                <div
                  key={tx.id}
                  className="bg-slate-800/30 border border-slate-700 rounded-lg p-4 hover:bg-slate-800/50 transition"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-200">
                        📤 Sent {tx.value} ETH
                      </p>
                      <p className="text-xs font-mono text-slate-500 mt-1">
                        To: {tx.to.substring(0, 12)}...{tx.to.substring(tx.to.length - 10)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                        tx.status === "confirmed" 
                          ? "bg-green-900/40 text-green-300"
                          : tx.status === "pending"
                          ? "bg-yellow-900/40 text-yellow-300 animate-pulse"
                          : "bg-red-900/40 text-red-300"
                      }`}>
                        {tx.status === "confirmed" ? "✓" : tx.status === "pending" ? "⏳" : "✕"} {tx.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">
                    {new Date(tx.timestamp).toLocaleDateString()} at {new Date(tx.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Privacy Features Highlight - NEW */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 border border-blue-600/30 rounded-lg p-4">
            <p className="text-sm font-semibold text-blue-300 mb-2">🔐 Privacy Features</p>
            <ul className="text-xs text-blue-200 space-y-1">
              <li>✓ Fresh addresses per transaction</li>
              <li>✓ MEV-Blocker private relay</li>
              <li>✓ RPC endpoint rotation</li>
            </ul>
          </div>
          <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border border-green-600/30 rounded-lg p-4">
            <p className="text-sm font-semibold text-green-300 mb-2">🔒 Security Features</p>
            <ul className="text-xs text-green-200 space-y-1">
              <li>✓ Client-side signing only</li>
              <li>✓ Encrypted key storage</li>
              <li>✓ No servers, no tracking</li>
            </ul>
          </div>
        </div>

        {/* Status Footer - POLISHED */}
        <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <p className="text-xs font-semibold text-green-300">Wallet Active</p>
            </div>
            <p className="text-xs text-slate-500">
              {networkConfig.name} • {addresses.length} addresses ready • {transactions.length} transactions
            </p>
          </div>
        </div>

        {/* Action Buttons - POLISHED */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setShowTransactionBuilder(true)}
            className="px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-lg transition shadow-lg text-center"
          >
            📤 Send Transaction
          </button>
          <button
            onClick={() => setShowHistory(true)}
            className="px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold rounded-lg transition shadow-lg text-center"
          >
            📊 View History
          </button>
        </div>
      </div>

      {/* Tutorial Modal */}
      {showTutorial && (
        <TutorialModal onComplete={() => setShowTutorial(false)} />
      )}

      {/* Transaction Builder Modal */}
      {showTransactionBuilder && (
        <TransactionBuilder
          wallet={wallet}
          network={network}
          onClose={() => setShowTransactionBuilder(false)}
        />
      )}

      {/* Transaction History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Transaction History</h2>
              <button
                onClick={() => setShowHistory(false)}
                className="text-slate-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>

            {transactions.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No transactions yet. Send one to get started!</p>
            ) : (
              <div className="space-y-3">
                {transactions.reverse().map((tx) => (
                  <div
                    key={tx.id}
                    className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:bg-slate-800/70 transition"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-white">📤 Sent {tx.value} ETH</p>
                        <p className="text-xs text-slate-400 font-mono mt-2">From: {tx.from.substring(0, 12)}...{tx.from.substring(tx.from.length - 10)}</p>
                        <p className="text-xs text-slate-400 font-mono">To: {tx.to.substring(0, 12)}...{tx.to.substring(tx.to.length - 10)}</p>
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full font-semibold whitespace-nowrap ml-4 ${
                        tx.status === "confirmed" 
                          ? "bg-green-900/40 text-green-300"
                          : tx.status === "pending"
                          ? "bg-yellow-900/40 text-yellow-300"
                          : "bg-red-900/40 text-red-300"
                      }`}>
                        {tx.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-slate-700">
                      <p className="text-xs text-slate-500">
                        {new Date(tx.timestamp).toLocaleDateString()} {new Date(tx.timestamp).toLocaleTimeString()}
                      </p>
                      <a
                        href={`${networkConfig.explorerUrl}/tx/${tx.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
                      >
                        View on Etherscan →
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}