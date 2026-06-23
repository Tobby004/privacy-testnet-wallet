"use client";

import { useState, useEffect } from "react";
import { PrivacyWallet } from "@/lib/hdWallet";
import { decryptMnemonic } from "@/lib/encryption";
import type { NetworkId } from "@/lib/networks";
import { ImportWallet } from "./components/ImportWallet";
import { WalletLayout } from "./components/WalletLayout";
import { OverviewPage } from "./components/OverviewPage";
import { AddressesPage } from "./components/AddressesPage";
import { SendPage } from "./components/SendPage";
import { ReceivePage } from "./components/ReceivePage";
import { HistoryPage } from "./components/HistoryPage";
import { SettingsPage } from "./components/SettingsPage";

type View = "import" | "wallet";
type WalletPage =
  | "overview"
  | "addresses"
  | "send"
  | "history"
  |  "receive"
  | "settings";

export default function Home() {
  const [view, setView] = useState<View>("import");
  const [wallet, setWallet] = useState<PrivacyWallet | null>(null);
  const [network, setNetwork] = useState<NetworkId>("sepolia");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] =
    useState<WalletPage>("overview");
  const [passwordAttempt, setPasswordAttempt] = useState("");
  const [unlockError, setUnlockError] = useState("");
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const encrypted = localStorage.getItem("encrypted_wallet");
      const savedNetwork =
        (localStorage.getItem("selected_network") as NetworkId) ??
        "sepolia";
      setNetwork(savedNetwork);
      setView(encrypted ? "wallet" : "import");
    } catch (error) {
      console.error("Failed to load wallet settings:", error);
      setView("import");
    } finally {
      setLoading(false);
    }
  }, []);
  const handleImportSuccess = (newWallet: PrivacyWallet) => {
    setWallet(newWallet);
    if (typeof window !== "undefined") {
      localStorage.setItem("selected_network", network);
    }
    setView("wallet");
  };
 const handleNetworkChange = (newNetwork: NetworkId) => {
  setNetwork(newNetwork);
  if (typeof window !== "undefined") {
    localStorage.setItem("selected_network", newNetwork);
  }
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
      setView("wallet");
    } catch (err: any) {
      setUnlockError("Wrong password");
    }
  };

  const handleLock = () => {
    setWallet(null);
    setPasswordAttempt("");
    setView("import");
  };

  const handleSendFromAddress = (addressIndex: number) => {
    setSelectedAddressIndex(addressIndex);
    setCurrentPage("send");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🔐</div>
          <p className="text-white text-lg">Loading wallet...</p>
        </div>
      </div>
    );
  }

  if (view === "import") {
    return <ImportWallet onSuccess={handleImportSuccess} selectedNetwork={network} onNetworkChange={handleNetworkChange} />;
  }

  if (!wallet) {
    // Unlock screen
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-50/10 mb-4">
              <span className="text-3xl">🔐</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Unlock Wallet</h1>
            <p className="text-sm text-slate-400 mt-2">Enter your password to continue</p>
          </div>

          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Password</label>
              <input
                type="password"
                value={passwordAttempt}
                onChange={(e) => setPasswordAttempt(e.target.value)}
                placeholder="Enter password"
                className="w-full px-4 py-3 border border-slate-600 rounded-lg bg-slate-800 text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition"
                autoFocus
              />
            </div>

            {unlockError && (
              <div className="p-3 bg-red-900/20 border border-red-600/30 rounded-lg">
                <p className="text-sm font-semibold text-red-300">❌ {unlockError}</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full px-4 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition"
            >
              Unlock Wallet
            </button>
          </form>

          <button
            onClick={() => {
              if (confirm("Are you sure? This will delete the wallet from this device.")) {
                localStorage.removeItem("encrypted_wallet");
                localStorage.removeItem("selected_network");
                setWallet(null);
                setNetwork("sepolia");
                setView("import");
              }
            }}
            className="w-full mt-4 px-4 py-2 bg-red-900/20 hover:bg-red-900/30 border border-red-600/30 text-red-300 font-semibold rounded-lg transition"
          >
            Forget This Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <WalletLayout
      wallet={wallet}
      network={network}
      onNetworkChange={handleNetworkChange}
      onLock={handleLock}
      currentPage={currentPage}
      onPageChange={(page: string) => setCurrentPage(page as WalletPage)}
    >
  {currentPage === "overview" && (
  <OverviewPage 
    wallet={wallet} 
    network={network}
    onSendClick={() => setCurrentPage("send")}
    onHistoryClick={() => setCurrentPage("history")}
    onReceiveClick={() => setCurrentPage("receive")}
  />
)}

      {currentPage === "addresses" && (
        <AddressesPage
          wallet={wallet}
          network={network}
          onSendFromAddress={handleSendFromAddress}
        />
      )}

      {currentPage === "send" && (
        <SendPage
          wallet={wallet}
          network={network}
          selectedAddressIndex={selectedAddressIndex}
        />
      )}
      {currentPage === "receive" && (
  <ReceivePage
    wallet={wallet}
    network={network}
    selectedAddressIndex={selectedAddressIndex}
  />
)}
      {currentPage === "history" && (
        <HistoryPage network={network} />
      )}

      {currentPage === "settings" && (
        <SettingsPage network={network} onLock={handleLock} />
      )}
    </WalletLayout>
  );
}
