"use client";

import { useState } from "react";
import { encryptMnemonic } from "@/lib/encryption";
import { PrivacyWallet } from "@/lib/hdWallet";

export function ImportWallet({
  onSuccess,
}: {
  onSuccess: (wallet: PrivacyWallet) => void;
}) {
  const [mnemonic, setMnemonic] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!mnemonic.trim()) throw new Error("Mnemonic required");
      if (password !== confirm) throw new Error("Passwords don't match");
      if (password.length < 12) throw new Error("Password too weak");

      const wallet = new PrivacyWallet(mnemonic);
      const encrypted = encryptMnemonic(mnemonic, password);
      localStorage.setItem("encrypted_wallet", encrypted);

      setMnemonic("");
      setPassword("");
      setConfirm("");
      onSuccess(wallet);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 mb-4">
            <span className="text-3xl">🔒</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Privacy Wallet</h1>
          <p className="text-sm text-slate-500 mt-2">Secure key management for testnet</p>
        </div>

        <form onSubmit={handleImport} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              BIP-39 Mnemonic
            </label>
            <textarea
              value={mnemonic}
              onChange={(e) => setMnemonic(e.target.value)}
              placeholder="word1 word2 word3 ... (12 or 24 words)"
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm font-mono"
              spellCheck="false"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Strong password (12+ chars)"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm"
            />
            <p className="text-xs text-slate-500 mt-1">Never store plaintext mnemonics</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat password"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-semibold text-red-800">⚠️ Error</p>
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 bg-blue-900 text-white font-semibold rounded-lg hover:bg-blue-800 disabled:opacity-50 transition"
          >
            {loading ? "Importing..." : "Import Wallet"}
          </button>
        </form>

        <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs font-semibold text-blue-900 mb-1">🔐 Security Guarantee</p>
          <p className="text-xs text-blue-800 leading-relaxed">
            Your keys stay encrypted in the browser. Never sent to any server. All signing happens locally.
          </p>
        </div>
      </div>
    </div>
  );
}