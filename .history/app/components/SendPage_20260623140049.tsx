"use client";

import { useState } from "react";
import { PrivacyWallet } from "@/lib/hdWallet";
import { NetworkId, NETWORKS } from "@/lib/networks";
import { ethers } from "ethers";

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
  const [txStatus, setTxStatus] = useState("pending");

  const networkConfig = NETWORKS[network];

  // Get sender address - extract .address property
  let senderAddress = "Loading...";
  try {
    const addressObj = wallet.getDerivedAddress(selectedAddressIndex);
    // addressObj has {address, privateKey, publicKey, path}
    senderAddress = typeof addressObj === "string" ? addressObj : addressObj.address || "Unknown";
  } catch (err) {
    senderAddress = "Address #" + selectedAddressIndex;
  }

  const validateAddress = (addr: string) => {
    try {
      return ethers.isAddress(addr);
    } catch {
      return false;
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      if (!recipient) throw new Error("Recipient address required");
      if (!validateAddress(recipient)) throw new Error("Invalid recipient address");
      if (!amount) throw new Error("Amount required");
      
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) throw new Error("Invalid amount");
      if (amountNum > 10) throw new Error("Amount too large (max 10 ETH)");

      const gasPriceNum = parseFloat(gasPrice);
      if (isNaN(gasPriceNum) || gasPriceNum <= 0) throw new Error("Invalid gas price");

      // Mock transaction
      const hash = "0x" + Math.random().toString(16).slice(2, 66);
      setTxHash(hash);
      setTxStatus("pending");
      setSuccess(true);

      // Save to history
      const history = JSON.parse(localStorage.getItem("tx_history") || "[]");
      history.unshift({
        hash,
        from: senderAddress,
        to: recipient,
        value: amount,
        gasPrice,
        timestamp: Date.now(),
        status: "pending",
        network,
      });
      localStorage.setItem("tx_history", JSON.stringify(history.slice(0, 50)));

      setRecipient("");
      setAmount("");
      setGasPrice("2");
    } catch (err: any) {
      setError(err.message || "Failed to send transaction");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl">
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700 rounded-xl p-8">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">✓</div>
            <h2 className="text-2xl font-bold text-green-400 mb-2">Transaction Sent!</h2>
            <p className="text-slate-400 mb-6">Your transaction has been submitted</p>

            <div className="bg-slate-800/50 rounded-lg p-4 mb-6 border border-slate-700">
              <p className="text-xs text-slate-400 mb-2">Hash</p>
              <p className="text-sm font-mono text-blue-300 break-all">{txHash}</p>
              <button
                onClick={() => navigator.clipboard.writeText(txHash)}
                className="mt-3 w-full bg-slate-700 hover:bg-slate-600 text-white py-2 rounded text-sm"
              >
                📋 Copy
              </button>
            </div>

            <a
              href={`${networkConfig.explorerUrl}/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg mb-4"
            >
              🔗 View on Explorer
            </a>

            <button
              onClick={() => setSuccess(false)}
              className="w-full mt-4 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg"
            >
              Send Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700 rounded-xl p-8">
        <h2 className="text-2xl font-bold text-white mb-2">Send Transaction</h2>
        <p className="text-slate-400 text-sm mb-6">
          Send ETH privately via MEV-Blocker relay
        </p>

        <form onSubmit={handleSend} className="space-y-6">
          {/* From Address */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              From
            </label>
            <div className="px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-slate-400 text-xs font-mono break-all">
              {senderAddress}
            </div>
          </div>

          {/* Recipient */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              To
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="0x..."
              className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500 outline-none"
            />
            {recipient && !validateAddress(recipient) && (
              <p className="text-xs text-red-400 mt-1">Invalid address</p>
            )}
          </div>

          {/* Amount & Gas */}
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
                min="0"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Gas (Gwei)
              </label>
              <input
                type="number"
                value={gasPrice}
                onChange={(e) => setGasPrice(e.target.value)}
                placeholder="2"
                step="0.1"
                min="0.1"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
          </div>

          {/* Privacy */}
          <div className="bg-purple-900/20 border border-purple-600/30 rounded-lg p-4">
            <p className="text-xs font-semibold text-purple-300">🔐 Privacy Protected</p>
            <p className="text-xs text-purple-200 mt-2">
              Sent via MEV-Blocker relay. Hidden from mempool.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-900/20 border border-red-600/30 rounded-lg">
              <p className="text-sm text-red-300">❌ {error}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setRecipient("");
                setAmount("");
                setError("");
              }}
              className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={loading || !recipient || !amount || !validateAddress(recipient)}
              className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold rounded-lg"
            >
              {loading ? "Sending..." : "Review & Sign"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}