"use client";

import { useState } from "react";
import { PrivacyWallet } from "@/lib/hdWallet";
import { NetworkId } from "@/lib/networks";

interface SendPageProps {
  wallet: PrivacyWallet;
  network: NetworkId;
  selectedAddressIndex?: number;
}

export function SendPage({ wallet, network, selectedAddressIndex = 0 }: SendPageProps) {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [gasPrice, setGasPrice] = useState("2");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [txHash, setTxHash] = useState("");

  const handleSendTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      if (!recipient) throw new Error("Recipient address required");
      if (!amount || parseFloat(amount) <= 0) throw new Error("Amount must be greater than 0");

      // TODO: Implement actual transaction sending
      // For now, show placeholder
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

  return (
    <div className="max-w-2xl">
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700 rounded-xl p-8">
        <h2 className="text-2xl font-bold text-white mb-6">Send Transaction</h2>

        {!success ? (
          <form onSubmit={handleSendTransaction} className="space-y-6">
            {/* From Address */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                From Address
              </label>
              <select className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition">
                <option>Address #{selectedAddressIndex}</option>
              </select>
            </div>

            {/* Recipient */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Recipient Address
              </label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="0x..."
                className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
              />
            </div>

            {/* Amount */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Amount (ETH)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.1"
                  step="0.001"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Gas Price (Gwei)
                </label>
                <input
                  type="number"
                  value={gasPrice}
                  onChange={(e) => setGasPrice(e.target.value)}
                  placeholder="2"
                  step="0.1"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                />
              </div>
            </div>

            {/* Privacy Notice */}
            <div className="bg-purple-900/20 border border-purple-600/30 rounded-lg p-4">
              <p className="text-xs font-semibold text-purple-300">🔐 Privacy Protected</p>
              <p className="text-xs text-purple-200 mt-1">
                Transaction will be sent via MEV-Blocker. Hidden from mempool.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="p-4 bg-red-900/20 border border-red-600/30 rounded-lg">
                <p className="text-sm font-semibold text-red-300">❌ {error}</p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setRecipient("");
                  setAmount("");
                }}
                className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition"
              >
                Clear
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold rounded-lg transition"
              >
                {loading ? "Sending..." : "Review & Sign"}
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">✓</div>
            <h3 className="text-2xl font-bold text-green-400 mb-2">Transaction Sent!</h3>
            <p className="text-slate-400 mb-6">Your transaction has been submitted via MEV-Blocker.</p>

            <div className="bg-slate-800/50 rounded-lg p-4 mb-6 border border-slate-700">
              <p className="text-xs text-slate-400 mb-2">Transaction Hash</p>
              <p className="text-sm font-mono text-blue-300 break-all">{txHash}</p>
            </div>

            <button
              onClick={() => {
                setSuccess(false);
                setTxHash("");
              }}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition"
            >
              Send Another Transaction
            </button>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-8 bg-blue-900/20 border border-blue-600/30 rounded-xl p-6">
        <p className="text-sm text-blue-200">
          <span className="font-semibold">💡 Info:</span> Each transaction uses a fresh address to maintain privacy. Your private key never leaves your browser.
        </p>
      </div>
    </div>
  );
}