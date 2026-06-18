"use client";

import { useState, useEffect } from "react";
import { PrivacyWallet } from "@/lib/hdWallet";
import { decryptMnemonic } from "@/lib/encryption";
import { ImportWallet } from "./components/ImportWallet";
import { Dashboard } from "./components/Dashboard";

type View = "import" | "dashboard" | "unlock";

export default function Home() {
  const [view, setView] = useState<View>("import");
  const [wallet, setWallet] = useState<PrivacyWallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [passwordAttempt, setPasswordAttempt] = useState("");
  const [unlockError, setUnlockError] = useState("");

  // On mount, check if wallet exists in localStorage
  useEffect(() => {
    const encrypted = localStorage.getItem("encrypted_wallet");
    if (encrypted) {
      // Wallet exists, ask for password to unlock
      setView("unlock");
    }
    setLoading(false);
  }, []);

  const handleImportSuccess = (newWallet: PrivacyWallet) => {
    setWallet(newWallet);
    setView("dashboard");
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnlockError("");

    try {
      const encrypted = localStorage.getItem("encrypted_wallet");
      if (!encrypted) throw new Error("No wallet found");

      const mnemonic = decryptMnemonic(encrypted, passwordAttempt);
      const unlockedWallet = new PrivacyWallet(mnemonic);
      
      setWallet(unlockedWallet);
      setPasswordAttempt("");
      setView("dashboard");
    } catch (err: any) {
      setUnlockError("Wrong password");
    }
  };

  const handleLock = () => {
    setWallet(null);
    setPasswordAttempt("");
    setView("unlock");
  };

  const handleForgetWallet = () => {
    if (confirm("Are you sure? This will delete the encrypted wallet from this device.")) {
      localStorage.removeItem("encrypted_wallet");
      localStorage.removeItem("wallet_password_hint");
      setWallet(null);
      setView("import");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🔒</div>
          <p className="text-white text-lg">Loading wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {view === "import" && <ImportWallet onSuccess={handleImportSuccess} />}
      
      {view === "unlock" && (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
          <div className="w-full max-w-sm">
            <div className="text-center mb-8">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 mb-4">
                <span className="text-3xl">🔐</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Unlock Wallet</h1>
              <p className="text-sm text-slate-500 mt-2">Enter your password to decrypt your keys</p>
            </div>

            <form onSubmit={handleUnlock} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={passwordAttempt}
                  onChange={(e) => setPasswordAttempt(e.target.value)}
                  placeholder="Enter password"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm"
                  autoFocus
                />
              </div>

              {unlockError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-semibold text-red-800">❌ {unlockError}</p>
                </div>
              )}

              <button
                type="submit"
                className="w-full px-4 py-3 bg-blue-900 text-white font-semibold rounded-lg hover:bg-blue-800 transition"
              >
                Unlock Wallet
              </button>
            </form>

            <div className="mt-6 space-y-3">
              <button
                onClick={handleForgetWallet}
                className="w-full px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 font-semibold rounded-lg transition text-sm"
              >
                Forget This Wallet
              </button>
            </div>

            <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs font-semibold text-blue-900">ℹ️ Wallet Detected</p>
              <p className="text-xs text-blue-800 mt-1">
                A wallet is saved on this device. Enter your password to unlock it.
              </p>
            </div>
          </div>
        </div>
      )}

      {view === "dashboard" && wallet && (
        <Dashboard wallet={wallet} onLock={handleLock} />
      )}
    </>
  );
}