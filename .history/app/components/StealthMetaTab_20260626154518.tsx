"use client";

import { useState, useEffect } from "react";
import { PrivacyWallet } from "@/lib/hdWallet";
import { getStealthKeys, getOrDeriveStealthKeys } from "@/lib/stealthKeys";
import { StealthKeys } from "@/lib/stealth";
import { useToast } from "./Toast";
import { Copy, Check, Eye, KeyRound, Info, Loader2, ShieldCheck } from "lucide-react";

interface StealthMetaTabProps {
  wallet: PrivacyWallet;
}

export function StealthMetaTab({ wallet }: StealthMetaTabProps) {
  const [keys, setKeys] = useState<StealthKeys | null>(null);
  const [deriving, setDeriving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showKeys, setShowKeys] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    // load cached keys if they exist (don't auto-derive — that needs the signing key)
    setKeys(getStealthKeys());
  }, []);

  const handleDerive = async () => {
    setDeriving(true);
    try {
      const account = wallet.getDerivedAddress(0);
      const privateKey =
        account && typeof account === "object" ? account.privateKey : null;
      if (!privateKey) throw new Error("Could not access signing key");

      const derived = await getOrDeriveStealthKeys(privateKey);
      setKeys(derived);
      showToast("Stealth keys derived from your wallet", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to derive stealth keys", "error");
    } finally {
      setDeriving(false);
    }
  };

  // First-time state: no keys yet, prompt to derive
  if (!keys) {
    return (
      <div className="space-y-6">
        <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4 flex gap-3">
          <Info className="w-5 h-5 text-blue-300 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-200">
            Your stealth keys are derived from your wallet by signing a fixed message.
            This means they're recoverable from your seed phrase alone — no separate backup needed.
          </p>
        </div>

        <div className="text-center py-8">
          <ShieldCheck className="w-12 h-12 text-purple-400 mx-auto mb-4" />
          <p className="text-slate-300 font-semibold mb-2">Generate your stealth meta-address</p>
          <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
            We'll derive your spending and viewing keys deterministically from your wallet.
            The same wallet always produces the same stealth keys.
          </p>
          <button
            onClick={handleDerive}
            disabled={deriving}
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold rounded-lg"
          >
            {deriving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Deriving…</>
            ) : (
              <><KeyRound className="w-4 h-4" /> Derive Stealth Keys</>
            )}
          </button>
        </div>
      </div>
    );
  }

  const copyMeta = () => {
    navigator.clipboard.writeText(keys.stealthMetaAddress);
    setCopied(true);
    showToast("Meta-address copied", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(keys.stealthMetaAddress)}`;

  return (
    <div className="space-y-6">
      <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4 flex gap-3">
        <Info className="w-5 h-5 text-blue-300 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-200">
          Share this meta-address publicly. Anyone can use it to send you funds at a fresh,
          unlinkable stealth address — but only you can detect and spend what you receive.
          These keys are derived from your wallet, so they're always recoverable.
        </p>
      </div>

      <div className="flex flex-col items-center">
        <div className="bg-white p-4 rounded-xl mb-3">
          <img src={qrUrl} alt="Stealth meta-address QR" className="w-52 h-52" />
        </div>
        <p className="text-xs text-slate-500">Your stealth meta-address</p>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <KeyRound className="w-4 h-4 text-purple-300" />
          <p className="text-xs text-slate-400">Stealth Meta-Address</p>
        </div>
        <p className="text-xs font-mono text-slate-300 break-all mb-4">
          {keys.stealthMetaAddress}
        </p>
        <button
          onClick={copyMeta}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition ${
            copied ? "bg-green-600 text-white" : "bg-purple-600 hover:bg-purple-700 text-white"
          }`}
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? "Copied!" : "Copy Meta-Address"}
        </button>
      </div>

      <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4">
        <button
          onClick={() => setShowKeys(!showKeys)}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-semibold text-slate-300">
              Advanced: view underlying keys
            </span>
          </div>
          <span className="text-slate-500">{showKeys ? "▼" : "→"}</span>
        </button>

        {showKeys && (
          <div className="mt-4 space-y-3">
            <div className="bg-amber-900/20 border border-amber-600/30 rounded p-3">
              <p className="text-xs text-amber-200">
                The viewing key lets a third party <em>detect</em> your incoming payments
                but not spend them. The spending key controls the funds — never share it.
              </p>
            </div>
            <KeyRow label="Spending Public Key" value={keys.spendingPublicKey} />
            <KeyRow label="Viewing Public Key" value={keys.viewingPublicKey} />
            <KeyRow label="Spending Private Key" value={keys.spendingPrivateKey} secret />
            <KeyRow label="Viewing Private Key" value={keys.viewingPrivateKey} secret />
          </div>
        )}
      </div>
    </div>
  );
}

function KeyRow({ label, value, secret }: { label: string; value: string; secret?: boolean }) {
  return (
    <div>
      <p className={`text-xs mb-1 ${secret ? "text-red-300" : "text-slate-400"}`}>
        {label} {secret && "(keep secret)"}
      </p>
      <p className="text-xs font-mono text-slate-400 break-all bg-slate-900/50 rounded px-2 py-1">
        {value}
      </p>
    </div>
  );
}