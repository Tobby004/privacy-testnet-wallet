"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { PrivacyWallet } from "@/lib/hdWallet";
import { NetworkId, NETWORKS } from "@/lib/networks";
import { generateStealthAddress } from "@/lib/stealth";
import { publishAnnouncement } from "@/lib/stealthAnnouncer";
import { announceOnChain } from "@/lib/stealthAnnouncerChain";
import { getAnnouncerMode, setAnnouncerMode, AnnouncerMode } from "@/lib/announcerMode";
import { useToast } from "./Toast";
import { Radar, ArrowRight, ExternalLink, Copy, Info, Loader2, Database, Link2 } from "lucide-react";

interface StealthSendTabProps {
  wallet: PrivacyWallet;
  network: NetworkId;
}

export function StealthSendTab({ wallet, network }: StealthSendTabProps) {
  const [metaAddress, setMetaAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<AnnouncerMode>("local");
  const [derived, setDerived] = useState<{
    stealthAddress: string;
    ephemeralPublicKey: string;
    viewTag: string;
  } | null>(null);
  const [funding, setFunding] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [announceTxHash, setAnnounceTxHash] = useState("");
  const [error, setError] = useState("");
  const { showToast } = useToast();

  const networkConfig = NETWORKS[network];

  useEffect(() => {
    setMode(getAnnouncerMode());
  }, []);

  const toggleMode = (m: AnnouncerMode) => {
    setMode(m);
    setAnnouncerMode(m);
  };

  const isValidMeta = (m: string) =>
    m.startsWith("st:eth:0x") && m.replace("st:eth:0x", "").length === 132;

  const handleDerive = () => {
    setError("");
    setDerived(null);
    setTxHash("");
    setAnnounceTxHash("");
    try {
      if (!isValidMeta(metaAddress.trim())) {
        throw new Error("Invalid stealth meta-address (expected st:eth:0x… 66 bytes)");
      }
      const result = generateStealthAddress(metaAddress.trim());
      setDerived(result);
      showToast("Stealth address derived", "success");
    } catch (err: any) {
      setError(err.message || "Failed to derive stealth address");
    }
  };

  const handleFund = async () => {
    if (!derived) return;
    setError("");
    setFunding(true);

    try {
      if (!amount || parseFloat(amount) <= 0) {
        throw new Error("Enter an amount to send");
      }

      const account = wallet.getDerivedAddress(0);
      const privateKey =
        account && typeof account === "object" ? account.privateKey : null;
      if (!privateKey) throw new Error("Could not access signing key");

      const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrls[0]);
      const signer = new ethers.Wallet(privateKey, provider);

      // 1. fund the stealth address
      const tx = await signer.sendTransaction({
        to: derived.stealthAddress,
        value: ethers.parseEther(amount),
      });
      setTxHash(tx.hash);
      showToast("Funding transaction broadcast", "success");
      await tx.wait();

      // record the funding tx in history so the Privacy Inspector can see it
      try {
        const senderAddr =
          account && typeof account === "object" ? account.address : "";
        const history = JSON.parse(localStorage.getItem("tx_history") || "[]");
        history.unshift({
          hash: tx.hash,
          from: senderAddr,
          to: derived.stealthAddress,
          value: amount,
          gasPrice: "",
          timestamp: Date.now(),
          status: "confirmed",
          network,
          kind: "stealth-funding",
        });
        localStorage.setItem("tx_history", JSON.stringify(history.slice(0, 50)));
      } catch {}

      // 2. publish the announcement (local or on-chain)
      if (mode === "onchain") {
        showToast("Publishing announcement on-chain…", "info");
        const annHash = await announceOnChain(
          network,
          privateKey,
          derived.stealthAddress,
          derived.ephemeralPublicKey,
          derived.viewTag
        );
        setAnnounceTxHash(annHash);
        showToast("Announced on-chain ✓", "success");
      } else {
        publishAnnouncement({
          schemeId: 1,
          stealthAddress: derived.stealthAddress,
          ephemeralPublicKey: derived.ephemeralPublicKey,
          viewTag: derived.viewTag,
          network,
          timestamp: Date.now(),
          amount,
          txHash: tx.hash,
        });
        showToast("Announcement published locally", "success");
      }
    } catch (err: any) {
      const msg = err?.shortMessage || err?.reason || err?.message || "Funding failed";
      setError(msg);
      showToast("Funding failed", "error");
    } finally {
      setFunding(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4 flex gap-3">
        <Info className="w-5 h-5 text-blue-300 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-200">
          Paste a recipient's stealth meta-address. This derives a fresh one-time address
          on their behalf, which you fund with a normal transaction. To test, paste your
          <em> own</em> meta-address from the "My Address" tab.
        </p>
      </div>

      {/* Announcer mode toggle */}
      <div>
        <p className="text-xs font-semibold text-slate-400 mb-2">Announcement mode</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => toggleMode("local")}
            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition ${
              mode === "local"
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700 border border-transparent"
            }`}
          >
            <Database className="w-4 h-4" /> Local (free)
          </button>
          <button
            onClick={() => toggleMode("onchain")}
            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition ${
              mode === "onchain"
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700 border border-transparent"
            }`}
          >
            <Link2 className="w-4 h-4" /> On-chain (ERC-5564)
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          {mode === "local"
            ? "Announcement stored in this browser. Free, works for local testing."
            : "Announcement emitted to the canonical ERC-5564 Announcer. Costs a second gas fee; detectable across devices."}
        </p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-300 mb-2">
          Recipient Meta-Address
        </label>
        <textarea
          value={metaAddress}
          onChange={(e) => setMetaAddress(e.target.value)}
          placeholder="st:eth:0x…"
          rows={3}
          className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500 outline-none text-xs font-mono"
        />
        <button
          onClick={handleDerive}
          disabled={!metaAddress.trim()}
          className="mt-3 w-full flex items-center justify-center gap-2 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold rounded-lg"
        >
          <Radar className="w-4 h-4" /> Derive Stealth Address
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-900/20 border border-red-600/30 rounded-lg">
          <p className="text-sm text-red-300 break-words">{error}</p>
        </div>
      )}

      {derived && (
        <div className="space-y-4">
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <p className="text-xs text-slate-400 mb-2">Generated Stealth Address</p>
            <div className="flex items-center gap-2">
              <p className="text-sm font-mono text-green-300 break-all flex-1">
                {derived.stealthAddress}
              </p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(derived.stealthAddress);
                  showToast("Address copied", "success");
                }}
                className="text-slate-400 hover:text-white flex-shrink-0"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-700 space-y-1">
              <p className="text-xs text-slate-500">
                View tag: <span className="font-mono text-slate-400">{derived.viewTag}</span>
              </p>
              <p className="text-xs text-slate-500 break-all">
                Ephemeral key:{" "}
                <span className="font-mono text-slate-400">
                  {derived.ephemeralPublicKey.slice(0, 30)}…
                </span>
              </p>
            </div>
          </div>

          {!txHash ? (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Amount to Send (ETH)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.01"
                step="0.001"
                min="0"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500 outline-none mb-3"
              />
              <p className="text-xs text-slate-500 mb-3">
                Funds will be sent from your Address #0 to the stealth address above
                {mode === "onchain"
                  ? ", followed by an on-chain announcement (a second transaction)."
                  : ", and an announcement will be published locally."}
              </p>
              <button
                onClick={handleFund}
                disabled={funding || !amount}
                className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold rounded-lg"
              >
                {funding ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
                ) : (
                  <><ArrowRight className="w-4 h-4" /> Fund Stealth Address</>
                )}
              </button>
            </div>
          ) : (
            <div className="bg-green-900/20 border border-green-600/30 rounded-lg p-4">
              <p className="text-sm font-semibold text-green-300 mb-2">
                Stealth payment sent ✓
              </p>
              <p className="text-xs text-green-200 mb-3">
                Funded {amount} ETH{" "}
                {mode === "onchain"
                  ? "and announced on-chain. Detectable from any device with your viewing key."
                  : "and published the announcement locally."}
              </p>
              <div className="space-y-1">
                <a
                  href={`${networkConfig.explorerUrl}/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-green-300 hover:text-green-200 underline"
                >
                  <ExternalLink className="w-4 h-4" /> Funding tx
                </a>
                {announceTxHash && (
                  <a
                    href={`${networkConfig.explorerUrl}/tx/${announceTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-green-300 hover:text-green-200 underline"
                  >
                    <ExternalLink className="w-4 h-4" /> Announcement tx
                  </a>
                )}
              </div>
              <button
                onClick={() => {
                  setDerived(null);
                  setMetaAddress("");
                  setAmount("");
                  setTxHash("");
                  setAnnounceTxHash("");
                }}
                className="mt-4 w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm"
              >
                Send Another
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}