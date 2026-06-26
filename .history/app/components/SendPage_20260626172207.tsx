"use client";

import { useState, useEffect } from "react";
import { PrivacyWallet } from "@/lib/hdWallet";
import { NetworkId, NETWORKS } from "@/lib/networks";
import { ethers } from "ethers";
import { useToast } from "./Toast";
import { resolveRecipient, isENSName, resolveENS } from "@/lib/ensResolver";
import { ArrowUpRight, Copy, ExternalLink, CheckCircle, Clock, XCircle, ShieldCheck } from "lucide-react";

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
  const [ensResolved, setEnsResolved] = useState<string | null>(null);
  const [ensResolving, setEnsResolving] = useState(false);
  const [amount, setAmount] = useState("");
  const [gasPrice, setGasPrice] = useState("2");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [txStatus, setTxStatus] = useState<"pending" | "confirmed" | "failed">("pending");
  const { showToast } = useToast();

  const networkConfig = NETWORKS[network];

  const account = (() => {
    try {
      return wallet.getDerivedAddress(selectedAddressIndex);
    } catch {
      return null;
    }
  })();

  const senderAddress =
    account && typeof account === "object" ? account.address : "Unknown";

  const validateAddress = (addr: string) => {
    try {
      return ethers.isAddress(addr);
    } catch {
      return false;
    }
  };

  const updateHistoryStatus = (hash: string, status: string) => {
    try {
      const history = JSON.parse(localStorage.getItem("tx_history") || "[]");
      const updated = history.map((tx: any) =>
        tx.hash === hash ? { ...tx, status } : tx
      );
      localStorage.setItem("tx_history", JSON.stringify(updated));
    } catch {}
  };

  // Robust polling: tries EVERY rpc each cycle, checks immediately, and
  // also uses waitForTransaction as a backup.
  useEffect(() => {
    if (!txHash || txStatus !== "pending") return;

    let cancelled = false;

    const checkOnce = async (): Promise<boolean> => {
      for (const rpcUrl of networkConfig.rpcUrls) {
        try {
          const provider = new ethers.JsonRpcProvider(rpcUrl);
          const receipt = await provider.getTransactionReceipt(txHash);
          if (receipt && !cancelled) {
            const newStatus = receipt.status === 1 ? "confirmed" : "failed";
            setTxStatus(newStatus);
            updateHistoryStatus(txHash, newStatus);
            if (newStatus === "confirmed") showToast("Transaction confirmed", "success");
            return true;
          }
        } catch {
          // try next rpc
        }
      }
      return false;
    };

    // check immediately
    checkOnce();

    const interval = setInterval(async () => {
      const done = await checkOnce();
      if (done) clearInterval(interval);
    }, 4000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [txHash, txStatus]);

  // Resolve ENS names as the user types
  useEffect(() => {
    const value = recipient.trim();
    if (!isENSName(value)) {
      setEnsResolved(null);
      setEnsResolving(false);
      return;
    }
    let cancelled = false;
    setEnsResolving(true);
    setEnsResolved(null);
    const t = setTimeout(async () => {
      const addr = await resolveENS(value);
      if (!cancelled) {
        setEnsResolved(addr);
        setEnsResolving(false);
      }
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [recipient]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      if (!account || typeof account !== "object" || !account.privateKey) {
        throw new Error("Could not access signing key for this address");
      }
      if (!recipient) throw new Error("Recipient address required");
      // resolve ENS name -> address if needed
      const resolvedTo = await resolveRecipient(recipient);
      if (!amount) throw new Error("Amount required");

      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) throw new Error("Invalid amount");

      const gasPriceNum = parseFloat(gasPrice);
      if (isNaN(gasPriceNum) || gasPriceNum <= 0) throw new Error("Invalid gas price");

      const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrls[0]);
      const signer = new ethers.Wallet(account.privateKey, provider);

      const tx = {
        to: resolvedTo,
        value: ethers.parseEther(amount),
        gasPrice: ethers.parseUnits(gasPrice, "gwei"),
      };

      const txResponse = await signer.sendTransaction(tx);
      const realHash = txResponse.hash;

      setTxHash(realHash);
      setTxStatus("pending");
      setSuccess(true);
      showToast("Transaction broadcast to network", "success");

      const history = JSON.parse(localStorage.getItem("tx_history") || "[]");
      history.unshift({
        hash: realHash,
        from: senderAddress,
        to: resolvedTo,
        value: amount,
        gasPrice,
        timestamp: Date.now(),
        status: "pending",
        network,
      });
      localStorage.setItem("tx_history", JSON.stringify(history.slice(0, 50)));

      // Backup: wait for the tx using the same provider we sent from
      txResponse
        .wait()
        .then((receipt) => {
          if (receipt) {
            const newStatus = receipt.status === 1 ? "confirmed" : "failed";
            setTxStatus(newStatus);
            updateHistoryStatus(realHash, newStatus);
          }
        })
        .catch(() => {});

      setRecipient("");
      setAmount("");
      setGasPrice("2");
    } catch (err: any) {
      const msg =
        err?.shortMessage ||
        err?.reason ||
        err?.message ||
        "Failed to send transaction";
      setError(msg);
      showToast("Transaction failed", "error");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    const StatusIcon =
      txStatus === "confirmed" ? CheckCircle : txStatus === "failed" ? XCircle : Clock;
    const statusColor =
      txStatus === "confirmed"
        ? "text-green-400"
        : txStatus === "failed"
        ? "text-red-400"
        : "text-amber-400";
    const statusText =
      txStatus === "confirmed"
        ? "Transaction Confirmed"
        : txStatus === "failed"
        ? "Transaction Failed"
        : "Transaction Pending";

    return (
      <div className="max-w-2xl">
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700 rounded-xl p-8">
          <div className="text-center py-8">
            <div className="flex justify-center mb-4">
              <StatusIcon className={`w-16 h-16 ${statusColor}`} />
            </div>
            <h2 className={`text-2xl font-bold mb-2 ${statusColor}`}>{statusText}</h2>
            <p className="text-slate-400 mb-6">
              {txStatus === "pending" && "Waiting for the network to confirm…"}
              {txStatus === "confirmed" && "Your transaction is on-chain."}
              {txStatus === "failed" && "The transaction did not succeed."}
            </p>

            <div className="bg-slate-800/50 rounded-lg p-4 mb-6 border border-slate-700 text-left">
              <p className="text-xs text-slate-400 mb-2">Transaction Hash</p>
              <p className="text-sm font-mono text-blue-300 break-all">{txHash}</p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(txHash);
                  showToast("Hash copied", "success");
                }}
                className="mt-3 w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded text-sm"
              >
                <Copy className="w-4 h-4" /> Copy Hash
              </button>
            </div>

            <a
              href={`${networkConfig.explorerUrl}/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg mb-4"
            >
              <ExternalLink className="w-4 h-4" /> View on Explorer
            </a>

            <button
              onClick={() => {
                setSuccess(false);
                setTxHash("");
                setTxStatus("pending");
              }}
              className="w-full mt-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg"
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
          Send testnet ETH on {networkConfig.name}
        </p>

        <form onSubmit={handleSend} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">From</label>
            <div className="px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-slate-400 text-xs font-mono break-all">
              {senderAddress}
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
            {recipient && !validateAddress(recipient) && !isENSName(recipient) && (
              <p className="text-xs text-red-400 mt-1">Invalid address or ENS name</p>
            )}
            {isENSName(recipient) && ensResolving && (
              <p className="text-xs text-slate-400 mt-1">Resolving ENS…</p>
            )}
            {isENSName(recipient) && ensResolved && (
              <p className="text-xs text-green-400 mt-1 break-all">→ {ensResolved}</p>
            )}
            {isENSName(recipient) && !ensResolving && ensResolved === null && (
              <p className="text-xs text-red-400 mt-1">ENS name not found</p>
            )}
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
                min="0"
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
                min="0.1"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
          </div>

          <div className="bg-purple-900/20 border border-purple-600/30 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-300" />
              <p className="text-xs font-semibold text-purple-300">Signed locally</p>
            </div>
            <p className="text-xs text-purple-200 mt-2">
              The transaction is signed in your browser with your private key — it never leaves your device.
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-900/20 border border-red-600/30 rounded-lg">
              <p className="text-sm text-red-300 break-words">{error}</p>
            </div>
          )}

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
              disabled={loading || !recipient || !amount || (!validateAddress(recipient) && !ensResolved)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold rounded-lg"
            >
              <ArrowUpRight className="w-4 h-4" />
              {loading ? "Sending…" : "Sign & Send"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}