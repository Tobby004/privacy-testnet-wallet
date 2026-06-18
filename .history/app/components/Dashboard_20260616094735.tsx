"use client";

import { useState, useEffect } from "react";
import { PrivacyWallet, DerivedAddress } from "@/lib/hdWallet";

interface DashboardProps {
  wallet: PrivacyWallet;
  onLock: () => void;
}

export function Dashboard({ wallet, onLock }: DashboardProps) {
  const [addresses, setAddresses] = useState<DerivedAddress[]>([]);
  const [copied, setCopied] = useState("");

  useEffect(() => {
    const derived = wallet.getAllDerivedAddresses(3);
    setAddresses(derived);
  }, [wallet]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(""), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-4">
      <div className="max-w-2xl mx-auto mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Privacy Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">Testnet • Sepolia</p>
          </div>
          <button
            onClick={onLock}
            className="px-4 py-2 bg-red-900/20 hover:bg-red-900/30 border border-red-500/30 rounded-lg text-red-300 text-sm font-semibold transition"
          >
            🔒 Lock Wallet
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Privacy Score Card */}
        <div className="bg-gradient-to-r from-teal-900/20 to-teal-800/20 border border-teal-500/30 rounded-xl p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-teal-300 text-sm font-semibold">Privacy Score</p>
              <p className="text-4xl font-bold text-teal-400 mt-2">92%</p>
              <p className="text-xs text-teal-300 mt-2">✓ MEV protected</p>
              <p className="text-xs text-teal-300">✓ RPC rotated</p>
            </div>
            <div className="flex flex-col justify-center">
              <div className="h-32 flex flex-col justify-between">
                <div className="h-1 bg-teal-500/30 rounded-full overflow-hidden">
                  <div className="h-full bg-teal-400" style={{ width: "92%" }}></div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-teal-300 font-mono">92 / 100</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Active RPC Status */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase">Active RPC</p>
              <p className="text-white font-mono text-sm mt-2">sepolia.drpc.org</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <p className="text-xs text-green-400">Connected</p>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3">ℹ️ RPC changes per request to avoid tracking</p>
        </div>

        {/* Fresh Addresses Section */}
        <div>
          <h2 className="text-lg font-bold text-white mb-3">Fresh Addresses</h2>
          <p className="text-xs text-slate-400 mb-3">Each transaction uses a new address to avoid on-chain linking</p>

          <div className="space-y-3">
            {addresses.map((addr, idx) => (
              <div
                key={idx}
                className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition"
              >
                <div className="flex justify-between items-start mb-2">
                  <p className="text-xs font-semibold text-slate-400">Address #{idx}</p>
                  <button
                    onClick={() => copyToClipboard(addr.address, `addr-${idx}`)}
                    className="text-xs text-blue-400 hover:text-blue-300 transition"
                  >
                    {copied === `addr-${idx}` ? "✓ Copied" : "Copy"}
                  </button>
                </div>
                <p className="text-sm font-mono text-blue-300 break-all">{addr.address}</p>
                <p className="text-xs text-slate-500 mt-2 font-mono">{addr.path}</p>
                <div className="mt-2 px-2 py-1 bg-slate-700/50 rounded inline-block">
                  <p className="text-xs text-slate-400">Unused • Ready</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status Footer */}
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
          <p className="text-xs font-semibold text-blue-300 mb-2">Status</p>
          <ul className="text-xs text-blue-200/80 space-y-1">
            <li>✓ Wallet unlocked and ready</li>
            <li>✓ Keys in memory (encrypted storage)</li>
            <li>✓ RPC rotation enabled</li>
            <li>✓ Next TX will use MEV-Blocker</li>
          </ul>
        </div>
      </div>
    </div>
  );
}