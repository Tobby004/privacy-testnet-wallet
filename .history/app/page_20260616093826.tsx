"use client";

import { useState } from "react";
import { PrivacyWallet } from "@/lib/hdWallet";
import { ImportWallet } from "./components/ImportWallet";

export default function Home() {
  const [wallet, setWallet] = useState<PrivacyWallet | null>(null);

  const handleImportSuccess = (newWallet: PrivacyWallet) => {
    setWallet(newWallet);
  };

  if (!wallet) {
    return <ImportWallet onSuccess={handleImportSuccess} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">✓ Wallet Imported!</h1>
        <p className="text-slate-300 mb-6">Your privacy wallet is ready. Next: build transaction UI.</p>
        <button
          onClick={() => setWallet(null)}
          className="px-4 py-2 bg-red-900 hover:bg-red-800 text-white rounded-lg transition"
        >
          Lock Wallet
        </button>
      </div>
    </div>
  );
}