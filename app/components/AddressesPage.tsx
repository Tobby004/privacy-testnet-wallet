"use client";

import { useState, useEffect } from "react";
import { PrivacyWallet, DerivedAddress } from "@/lib/hdWallet";
import { NetworkId } from "@/lib/networks";

interface AddressesPageProps {
  wallet: PrivacyWallet;
  network: NetworkId;
  onSendFromAddress: (addressIndex: number) => void;
}

export function AddressesPage({ wallet, network, onSendFromAddress }: AddressesPageProps) {
  const [addresses, setAddresses] = useState<DerivedAddress[]>([]);
  const [balances, setBalances] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const derived = wallet.getAllDerivedAddresses(3);
    setAddresses(derived);

    derived.forEach((addr) => {
      fetchBalance(addr.address);
    });
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

  const copyToClipboard = (text: string, addr: string) => {
    navigator.clipboard.writeText(text);
    setCopied(addr);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="max-w-2xl">
        <p className="text-slate-400">
          Each transaction uses a fresh address — observers cannot link your transfers.
        </p>
      </div>

      <div className="space-y-4">
        {addresses.map((addr, idx) => (
          <div
            key={idx}
            className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700 hover:border-slate-600 rounded-xl p-8 transition"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-yellow-500 flex items-center justify-center font-bold text-slate-950">
                    {idx}
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">Address #{idx}</p>
                    <p className="text-xs text-teal-400 font-semibold mt-1">Ready for transaction</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => copyToClipboard(addr.address, addr.address)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 text-sm font-semibold transition"
              >
                {copied === addr.address ? "✓ Copied" : "📋 Copy"}
              </button>
            </div>

            {/* Address Display */}
            <div className="bg-slate-900/50 rounded-lg p-4 mb-6 border border-slate-700">
              <p className="text-sm font-mono text-blue-300 break-all">{addr.address}</p>
            </div>

            {/* Balance and Action */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 mb-1">Balance</p>
                <p className="text-2xl font-mono font-bold text-orange-400">
                  {balances[addr.address] ? `${parseFloat(balances[addr.address]).toFixed(4)} ETH` : "—"}
                </p>
              </div>
              <button
                onClick={() => onSendFromAddress(idx)}
                className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-semibold rounded-lg transition shadow-md"
              >
                ➤ Send from here
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Info Box */}
      <div className="bg-blue-900/20 border border-blue-600/30 rounded-xl p-6 mt-8">
        <p className="text-sm text-blue-200">
          <span className="font-semibold">💡 Tip:</span> Using different addresses for each transaction prevents on-chain analysis. Each address is independently derived using BIP-44.
        </p>
      </div>
    </div>
  );
}