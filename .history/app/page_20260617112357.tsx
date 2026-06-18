"use client";

import { useState, useEffect } from "react";
import { PrivacyWallet } from "@/lib/hdWallet";
import { decryptMnemonic } from "@/lib/encryption";
import { NetworkId } from "@/lib/networks";
import { ImportWallet } from "./components/ImportWallet";
import { Dashboard } from "./components/Dashboard";

type View = "import" | "dashboard" | "unlock";

export default function Home() {
  const [view, setView] = useState<View>("import");
  const [wallet, setWallet] = useState<PrivacyWallet | null>(null);
  const [network, setNetwork] = useState<NetworkId>("sepolia");
  const [loading, setLoading] = useState(true);
  const [passwordAttempt, setPasswordAttempt] = useState("");
  const [unlockError, setUnlockError] = useState("");

  useEffect(() => {
    const encrypted = localStorage.getItem("encrypted_wallet");
    const savedNetwork = (localStorage.getItem("selected_network") as NetworkId) || "sepolia";
    
    if (encrypted) {
      setNetwork(savedNetwork);
      setView("unlock");
    }
    setLoading(false);
  }, []);

  const handleImportSuccess = (newWallet: PrivacyWallet) => {
    setWallet(newWallet);
    localStorage.setItem("selected_network", network);
    setView("dashboard");
  };

  const handleNetworkChange = (newNetwork: NetworkId) => {
    setNetwork(newNetwork);
    localStorage.setItem("selected_network", newNetwork);
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnlockError("");

    try {
      const encrypted = localStorage.getItem("encrypted_wallet");
      const savedNetwork = (localStorage.getItem("selected_network") as NetworkId) || "sepolia";
      
      if (!encrypted) throw new Error("No wallet found");

      const mnemonic = decryptMnemonic(encrypted, passwordAttempt);
      const unlockedWallet = new PrivacyWallet(mnemonic);
      
      setWallet(unlockedWallet);
      setNetwork(savedNetwork);
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
      {view === "import" && (
        <ImportWallet 
          onSuccess={handleImportSuccess}
          selectedNetwork={network}
          onNetworkChange={handleNetworkChange}
        />
      )}
      
      {view === "unlock" && (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
          <div className="w-full max-w-sm">
            <div className="text-center mb-8">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 mb-4">
                <span className="text-3xl">🔐</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Unlock Wallet</h1>
              <p className="text-sm text-slate-500 mt-2">Network: <span className="font-semibold">{network}</span></p>
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
          </div>
        </div>
      )}

      {view === "dashboard" && wallet && (
        <Dashboard 
          wallet={wallet} 
          network={network}
          onNetworkChange={handleNetworkChange}
          onLock={handleLock} 
        />
      )}
    </>
  );
}