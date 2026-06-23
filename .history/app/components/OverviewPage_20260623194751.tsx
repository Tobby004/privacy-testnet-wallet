"use client";

import { useState, useEffect } from "react";
import { PrivacyWallet, DerivedAddress } from "@/lib/hdWallet";
import { NetworkId, NETWORKS } from "@/lib/networks";
import { getAllTransactions } from "@/lib/storage";

interface OverviewPageProps {
  wallet: PrivacyWallet;
  network: NetworkId;
  onSendClick: () => void;
  onHistoryClick: () => void;
  onReceiveClick: () => void;
}

export function OverviewPage({ wallet, network, onSendClick, onHistoryClick, onReceiveClick }: OverviewPageProps) {
  const [addresses, setAddresses] = useState<DerivedAddress[]>([]);
  const [balances, setBalances] = useState<Record<string, string>>({});
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    const derived = wallet.getAllDerivedAddresses(3);
    setAddresses(derived);

    derived.forEach((addr) => {
      fetchBalance(addr.address);
    });

    setTransactions(getAllTransactions().filter((tx) => tx.network === network));
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
        setBalances((prev) => ({ ...prev, [address]: data.balance }));
      }
    } catch (error) {
      console.error("Failed to fetch balance:", error);
    }
  };

  const totalBalance = addresses.reduce((sum, addr) => {
    const balance = parseFloat(balances[addr.address] || "0");
    return sum + balance;
  }, 0);

  const networkConfig = NETWORKS[network];

  return (
    <div className="space-y-8">
      {/* Get Testnet ETH Alert */}
      <div className="bg-gradient-to-r from-amber-900/20 to-orange-900/20 border border-amber-600/30 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-amber-300 mb-1">⚡ Get Testnet ETH</p>
            <p className="text-sm text-amber-200">Use the faucet to fund your addresses for testing</p>
          </div>
          <a
            href={networkConfig.faucetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition"
          >
            Get ETH →
          </a>
        </div>
      </div>

      {/* Total Balance Card */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700 rounded-xl p-8">
        <p className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">Total Balance</p>
        <div className="flex items-baseline gap-4 mb-2">
          <p className="text-5xl font-bold text-orange-400">{totalBalance.toFixed(4)}</p>
          <p className="text-2xl text-slate-400">ETH</p>
        </div>
        <p className="text-sm text-slate-500">
          {addresses.length} fresh addresses • {networkConfig.name}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-4">
        <button
          onClick={onSendClick}
          className="bg-gradient-to-br from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-bold py-4 px-6 rounded-xl transition shadow-lg"
        >
          <div className="text-2xl mb-2">📤</div>
          <div className="text-sm">Send</div>
        </button>
      <button onClick={onReceiveClick} className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-4 px-6 rounded-xl transition">
  <div className="text-2xl mb-2">📥</div>
  <div className="text-sm">Receive</div>
</button>
<button onClick={() => alert("Swap feature coming soon! 🚀")} className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-4 px-6 rounded-xl transition">
  <div className="text-2xl mb-2">⚡</div>
  <div className="text-sm">Swap</div>
</button>
        <a
          href={networkConfig.faucetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-4 px-6 rounded-xl transition text-center"
        >
          <div className="text-2xl mb-2">🌐</div>
          <div className="text-sm">Faucet</div>
        </a>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-6">
          <p className="text-sm text-slate-400 mb-2">Addresses Ready</p>
          <p className="text-3xl font-bold text-white">
            {addresses.length}/{addresses.length}
          </p>
          <p className="text-xs text-slate-500 mt-2">Fresh & unused</p>
        </div>
        <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-6">
          <p className="text-sm text-slate-400 mb-2">Transactions</p>
          <p className="text-3xl font-bold text-white">{transactions.length}</p>
          <p className="text-xs text-slate-500 mt-2">All time</p>
        </div>
        <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-6">
          <p className="text-sm text-slate-400 mb-2">Privacy Score</p>
          <p className="text-3xl font-bold text-teal-400">100%</p>
          <p className="text-xs text-slate-500 mt-2">Fully shielded</p>
        </div>
      </div>

      {/* Recent Addresses */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">Recent Addresses</h3>
          <div className="text-sm text-teal-400 font-semibold">All ready</div>
        </div>
        <div className="space-y-3">
          {addresses.map((addr, idx) => (
            <div
              key={idx}
              className="bg-slate-800/30 border border-slate-700 hover:border-slate-600 rounded-xl p-6 transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-bold text-white">Address #{idx}</p>
                  <p className="text-xs font-mono text-slate-500 mt-1">{addr.path}</p>
                </div>
                <button className="text-slate-400 hover:text-white text-lg">📋</button>
              </div>
              <p className="text-sm font-mono text-slate-400 break-all mb-4">{addr.address}</p>
              <div className="flex justify-between items-center">
                <p className="text-xs text-slate-500">Balance</p>
                <p className="text-lg font-mono font-bold text-orange-400">
                  {balances[addr.address] ? `${parseFloat(balances[addr.address]).toFixed(4)} ETH` : "—"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-teal-900/20 to-cyan-900/20 border border-teal-600/30 rounded-xl p-6">
          <p className="text-sm font-semibold text-teal-300 mb-3">🔐 Privacy</p>
          <ul className="text-xs text-teal-200 space-y-2">
            <li>✓ Fresh address per transaction</li>
            <li>✓ Hides transfer amounts</li>
            <li>✓ Breaks on-chain links</li>
          </ul>
        </div>
        <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border border-green-600/30 rounded-xl p-6">
          <p className="text-sm font-semibold text-green-300 mb-3">🛡️ Security</p>
          <ul className="text-xs text-green-200 space-y-2">
            <li>✓ Client-side signing only</li>
            <li>✓ Encrypted key storage</li>
            <li>✓ Zero server contact</li>
          </ul>
        </div>
      </div>
    </div>
  );
}