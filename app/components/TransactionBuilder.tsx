"use client";

import { useState } from "react";
import { PrivacyWallet } from "@/lib/hdWallet";
import { NetworkId, NETWORKS } from "@/lib/networks";
import { addTransaction } from "@/lib/storage";
import { ethers } from "ethers";

type Step = "form" | "review" | "signing" | "complete";

interface TransactionBuilderProps {
  wallet: PrivacyWallet;
  network: NetworkId;
  onClose: () => void;
}

export function TransactionBuilder({
  wallet,
  network,
  onClose,
}: TransactionBuilderProps) {
  const [step, setStep] = useState<Step>("form");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [gasPrice, setGasPrice] = useState("2");
  const [gasLimit, setGasLimit] = useState("21000");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [txHash, setTxHash] = useState("");
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);

  const networkConfig = NETWORKS[network];

  const handleEstimateGas = async () => {
    setError("");
    setLoading(true);

    try {
      if (!recipient) throw new Error("Recipient address required");
      if (!amount || parseFloat(amount) <= 0) throw new Error("Amount must be greater than 0");

      setGasLimit("21000");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async () => {
    setError("");

    try {
      if (!recipient) throw new Error("Recipient address required");
      if (!amount || parseFloat(amount) <= 0) throw new Error("Amount must be greater than 0");
      if (!ethers.isAddress(recipient)) throw new Error("Invalid recipient address");

      setStep("review");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSign = async () => {
    setError("");
    setLoading(true);

    try {
      setStep("signing");

      const derivedAddr = wallet.getDerivedAddress(selectedAddressIndex);

      const nonceResponse = await fetch("/api/get-nonce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: derivedAddr.address, network }),
      });

      if (!nonceResponse.ok) throw new Error("Failed to get nonce");
      const { nonce } = await nonceResponse.json();

      const tx: ethers.TransactionRequest = {
        to: recipient,
        from: derivedAddr.address,
        value: ethers.parseEther(amount),
        gasLimit: BigInt(gasLimit),
        gasPrice: ethers.parseUnits(gasPrice, "gwei"),
        nonce: nonce,
        chainId: networkConfig.chainId,
        data: "0x",
      };

      const signer = new ethers.Wallet(derivedAddr.privateKey);
      const signedTx = await signer.signTransaction(tx);

      if (!signedTx) throw new Error("Failed to sign transaction");

      const submitResponse = await fetch("/api/private-tx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signedTx }),
      });

      if (!submitResponse.ok) {
        const errorData = await submitResponse.json();
        throw new Error(errorData.error || "Failed to submit transaction");
      }

      const { txHash: hash } = await submitResponse.json();
      setTxHash(hash);

      addTransaction({
        id: hash,
        from: derivedAddr.address,
        to: recipient,
        value: amount,
        txHash: hash,
        network,
        timestamp: Date.now(),
        status: "pending",
      });

      setStep("complete");
    } catch (err: any) {
      console.error("Transaction error:", err);
      setError(err.message || "Failed to send transaction");
      setStep("form");
    } finally {
      setLoading(false);
    }
  };

  const totalCost = (
    parseFloat(amount || "0") +
    (parseFloat(gasLimit) * parseFloat(gasPrice)) / 1e9
  ).toFixed(6);

  if (step === "form") {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-lg w-full p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Send Transaction</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-2xl"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
              <p className="text-xs text-slate-400 mb-2">Network: {networkConfig.name}</p>
              <div>
                <label className="block text-xs text-slate-400 mb-2">From Address</label>
                <select
                  value={selectedAddressIndex}
                  onChange={(e) => setSelectedAddressIndex(parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded text-sm border border-slate-600"
                >
                  {[0, 1, 2].map((idx) => (
                    <option key={idx} value={idx}>
                      Address #{idx}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Recipient Address
              </label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="0x..."
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white font-mono text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
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
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
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
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                />
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm text-slate-400">Total Cost:</p>
                <p className="text-lg font-mono font-semibold text-blue-400">{totalCost} ETH</p>
              </div>
              <p className="text-xs text-slate-500">
                Includes gas fee (~{((parseFloat(gasLimit) * parseFloat(gasPrice)) / 1e9).toFixed(6)} ETH)
              </p>
            </div>

            <div className="bg-green-900/20 border border-green-600/30 rounded-lg p-3">
              <p className="text-xs font-semibold text-green-300">✓ Privacy Protected</p>
              <p className="text-xs text-green-200 mt-1">
                Transaction will be sent via MEV-Blocker. No mempool visibility.
              </p>
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-3">
                <p className="text-sm font-semibold text-red-300">⚠️ Error</p>
                <p className="text-xs text-red-200">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleReview}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:opacity-50 transition"
              >
                {loading ? "Processing..." : "Review & Sign"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === "review") {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-lg w-full p-6">
          <h2 className="text-2xl font-bold text-white mb-6">Review Transaction</h2>

          <div className="space-y-3 mb-6">
            <div className="bg-slate-800/50 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-1">Recipient</p>
              <p className="text-sm font-mono text-blue-300 break-all">{recipient}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-xs text-slate-400">Amount</p>
                <p className="text-sm font-mono text-white mt-1">{amount} ETH</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-xs text-slate-400">Gas Price</p>
                <p className="text-sm font-mono text-white mt-1">{gasPrice} Gwei</p>
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-1">Total Cost</p>
              <p className="text-lg font-mono font-semibold text-green-400">{totalCost} ETH</p>
            </div>
          </div>

          <p className="text-xs text-slate-400 mb-6">
            ⚠️ Make sure the recipient address is correct. This action cannot be undone.
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => setStep("form")}
              className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition"
            >
              Back
            </button>
            <button
              onClick={handleSign}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg disabled:opacity-50 transition"
            >
              {loading ? "Signing..." : "Sign & Send"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "signing") {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-lg w-full p-6 text-center">
          <div className="text-4xl mb-4 animate-spin">🔒</div>
          <h2 className="text-2xl font-bold text-white mb-2">Signing Transaction</h2>
          <p className="text-slate-400 text-sm">
            Your private key is signing locally. This takes a few seconds...
          </p>
        </div>
      </div>
    );
  }

  if (step === "complete") {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-lg w-full p-6 text-center">
          <div className="text-5xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-green-400 mb-2">Transaction Sent!</h2>
          <p className="text-slate-400 text-sm mb-6">
            Your transaction has been submitted via MEV-Blocker private relay.
          </p>

          <div className="bg-slate-800/50 rounded-lg p-4 mb-6">
            <p className="text-xs text-slate-400 mb-2">Transaction Hash</p>
            <p className="text-xs font-mono text-blue-300 break-all">{txHash}</p>
          </div>

          <div className="flex gap-3">
            <a
              href={`${networkConfig.explorerUrl}/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition"
            >
              View on Etherscan →
            </a>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }
}