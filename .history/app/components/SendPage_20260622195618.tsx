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

  const validateAddress = (addr: string) => {
    return ethers.isAddress(addr);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      // Validation
      if (!recipient) throw new Error("Recipient address required");
      if (!validateAddress(recipient)) throw new Error("Invalid recipient address");
      if (!amount) throw new Error("Amount required");
      
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) throw new Error("Invalid amount");
      if (amountNum > 10) throw new Error("Amount too large for testnet (max 10 ETH)");

      const gasPriceNum = parseFloat(gasPrice);
      if (isNaN(gasPriceNum) || gasPriceNum <= 0) throw new Error("Invalid gas price");

      // Get nonce
      const address = wallet.getDerivedAddress(selectedAddressIndex);
      const nonceResponse = await fetch("/api/get-nonce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, network }),
      });

      if (!nonceResponse.ok) throw new Error("Failed to get nonce");
      const { nonce } = await nonceResponse.json();

      // Estimate gas
      const gasResponse = await fetch("/api/gas-estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: recipient,
          value: ethers.parseEther(amount),
          network,
        }),
      });

      if (!gasResponse.ok) throw new Error("Failed to estimate gas");
      const { gasLimit } = await gasResponse.json();

      // Build transaction
      const tx = {
        to: recipient,
        value: ethers.parseEther(amount),
        gasLimit: BigInt(gasLimit || 21000),
        gasPrice: ethers.parseUnits(gasPrice, "gwei"),
        nonce: nonce,
        data: "0x",
        chainId: networkConfig.chainId,
      };

      // Sign transaction
      const signer = wallet.getSigner();
      const signedTx = await signer.signTransaction(tx);

      // Send via MEV-Blocker
      const sendResponse = await fetch("/api/private-tx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signedTx,
          network,
        }),
      });

      if (!sendResponse.ok) {
        const errorData = await sendResponse.json();
        throw new Error(errorData.error || "Failed to send transaction");
      }

      const { txHash: hash } = await sendResponse.json();
      setTxHash(hash);
      setTxStatus("pending");
      setSuccess(true);

      // Save to history
      const history = JSON.parse(localStorage.getItem("tx_history") || "[]");
      history.unshift({
        hash,
        from: address,
        to: recipient,
        value: amount,
        gasPrice,
        timestamp: Date.now(),
        status: "pending",
        network,
      });
      localStorage.setItem("tx_history", JSON.stringify(history.slice(0, 50)));

      // Reset form
      setRecipient("");
      setAmount("");
      setGasPrice("2");

      // Poll for confirmation
      pollTransactionStatus(hash);
    } catch (err: any) {
      console.error("Send error:", err);
      setError(err.message || "Failed to send transaction");
    } finally {
      setLoading(false);
    }
  };

  const pollTransactionStatus = async (hash: string) => {
    let attempts = 0;
    const maxAttempts = 60; // Poll for 5 minutes

    const interval = setInterval(async () => {
      attempts++;

      try {
        const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
        const receipt = await provider.getTransactionReceipt(hash);

        if (receipt) {
          setTxStatus(receipt.status === 1 ? "confirmed" : "failed");
          clearInterval(interval);
        }
      } catch (err) {
        console.error("Poll error:", err);
      }

      if (attempts >= maxAttempts) {
        clearInterval(interval);
      }
    }, 5000); // Poll every 5 seconds
  };

  if (success) {
    return (
      <div className="max-w-2xl">
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700 rounded-xl p-8">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">
              {txStatus === "confirmed" ? "✓" : txStatus === "failed" ? "✗" : "⏳"}
            </div>

            <h2
              className={`text-2xl font-bold mb-2 ${
                txStatus === "confirmed"
                  ? "text-green-400"
                  : txStatus === "failed"
                  ? "text-red-400"
                  : "text-yellow-400"
              }`}
            >
              {txStatus === "confirmed"
                ? "Transaction Confirmed!"
                : txStatus === "failed"
                ? "Transaction Failed"
                : "Transaction Pending..."}
            </h2>

            <p className="text-slate-400 mb-6">
              {txStatus === "pending" && "Waiting for confirmation on the blockchain"}
              {txStatus === "confirmed" && "Your transaction has been confirmed"}
              {txStatus === "failed" && "Your transaction failed to execute"}
            </p>

            <div className="bg-slate-800/50 rounded-lg p-4 mb-6 border border-slate-700">
              <p className="text-xs text-slate-400 mb-2">Transaction Hash</p>
              <p className="text-sm font-mono text-blue-300 break-all">{txHash}</p>
              <button
                onClick={() => navigator.clipboard.writeText(txHash)}
                className="mt-3 w-full bg-slate-700 hover:bg-slate-600 text-white py-2 rounded text-sm"
              >
                📋 Copy Hash
              </button>
            </div>

            {txStatus !== "pending" && (
              <a
                href={`${networkConfig.explorerUrl}/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg mb-4"
              >
                🔗 View on Explorer
              </a>
            )}

            <button
              onClick={() => {
                setSuccess(false);
                setTxHash("");
                setTxStatus("pending");
              }}
              className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg"
            >
              Send Another Transaction
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
          Send ETH privately via MEV-Blocker. Each transaction uses a fresh address.
        </p>

        <form onSubmit={handleSend} className="space-y-6">
          {/* From Address */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              From Address
            </label>
            <div className="px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-slate-400 text-sm font-mono">
              {wallet.getDerivedAddress(selectedAddressIndex)}
            </div>
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
            {recipient && !validateAddress(recipient) && (
              <p className="text-xs text-red-400 mt-1">Invalid address format</p>
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
                max="10"
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
                min="0.1"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
              />
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="bg-purple-900/20 border border-purple-600/30 rounded-lg p-4">
            <p className="text-xs font-semibold text-purple-300 mb-2">🔐 Privacy Protected</p>
            <ul className="text-xs text-purple-200 space-y-1">
              <li>✓ Sent via MEV-Blocker (hidden from mempool)</li>
              <li>✓ Fresh address used (not linked to other transactions)</li>
              <li>✓ RPC rotation (no single endpoint sees all activity)</li>
            </ul>
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
              className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={loading || !recipient || !amount || !validateAddress(recipient)}
              className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold rounded-lg transition"
            >
              {loading ? "Sending..." : "Review & Sign"}
            </button>
          </div>
        </form>
      </div>

      {/* Info */}
      <div className="mt-8 bg-blue-900/20 border border-blue-600/30 rounded-xl p-6">
        <p className="text-sm text-blue-200">
          <span className="font-semibold">💡 Testnet Only:</span> This wallet only works with
          Sepolia and Goerli testnets. Use{" "}
          <a href="https://www.sepoliafaucet.io" target="_blank" rel="noopener noreferrer"
            className="text-blue-300 underline">
            Sepolia faucet
          </a>{" "}
          to get test ETH.
        </p>
      </div>
    </div>
  );
}