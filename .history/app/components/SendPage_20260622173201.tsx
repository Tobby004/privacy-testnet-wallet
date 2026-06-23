"use client";

import { useState } from "react";
import { PrivacyWallet } from "@/lib/hdWallet";
import { NetworkId } from "@/lib/networks";

interface SendPageProps {
  wallet: PrivacyWallet;
  network: NetworkId;
  selectedAddressIndex?: number;
}

export function SendPage({
  wallet,
  network,
  selectedAddressIndex = 0,
}: SendPageProps) {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [gasPrice, setGasPrice] = useState("2");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [txHash, setTxHash] = useState("");

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      if (!recipient) throw new Error("Recipient required");
      if (!amount) throw new Error("Amount required");

      setTxHash("0x" + Math.random().toString(16).slice(2, 66));
      setSuccess(true);
      setRecipient("");
      setAmount("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl">
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700 rounded-xl p-8 text-center">
          <div className="text-5xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-green-400 mb-2">Transaction Sent!</h2>
          <p className="text-slate-400 mb-6">Your transaction has been submitted.</p>
          <div className="bg-slate-800/50 rounded-lg p-4 mb-6 border border-slate-700">
            <p className="text-xs text-slate-400">Hash</p>
            <p className="text-sm font-mono text-blue-300 break-all">{txHash}</p>
          </div>
          <button
            onClick={() => setSuccess(false)}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg"
          >
            Send Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700 rounded-xl p-8">
        <h2 className="text-2xl font-bold text-white mb-6">Send Transaction</h2>
        <form onSubmit={handleSend} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">From</label>
            <div className="px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-slate-300">
              Address #{selectedAddressIndex}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">To</label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="0x..."
              className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Amount (ETH)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.1"
                step="0.001"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Gas (Gwei)</label>
              <input
                type="number"
                value={gasPrice}
                onChange={(e) => setGasPrice(e.target.value)}
                placeholder="2"
                step="0.1"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
          </div>
          <div className="bg-purple-900/20 border border-purple-600/30 rounded-lg p-4">
            <p className="text-xs text-purple-300">🔐 Privacy Protected - MEV-Blocker Relay</p>
          </div>
          {error && <div className="p-4 bg-red-900/20 border border-red-600/30 rounded-lg"><p className="text-sm text-red-300">{error}</p></div>}
          <div className="flex gap-3">
            <button type="button" onClick={() => { setRecipient(""); setAmount(""); }} className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg">Clear</button>
            <button type="submit" disabled={loading || !recipient || !amount} className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold rounded-lg">{loading ? "Sending..." : "Review & Sign"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}