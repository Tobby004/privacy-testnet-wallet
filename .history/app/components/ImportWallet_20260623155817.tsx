"use client";

import { useState } from "react";
import { ethers } from "ethers";
import { PrivacyWallet } from "@/lib/hdWallet";
import { encryptMnemonic } from "@/lib/encryption";
import { NetworkId } from "@/lib/networks";

interface ImportWalletProps {
  onWalletCreated: (wallet: PrivacyWallet) => void;
}

export function ImportWallet({ onWalletCreated }: ImportWalletProps) {
  const [step, setStep] = useState<"initial" | "create" | "import">("initial");
  const [mnemonic, setMnemonic] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [importMnemonic, setImportMnemonic] = useState("");
  const [importPassword, setImportPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [network, setNetwork] = useState<NetworkId>("sepolia");

  // Generate new wallet
  const generateNewWallet = async () => {
    try {
      setError("");
      const newMnemonic = ethers.Mnemonic.entropyToPhrase(
        ethers.getRandomValues(new Uint8Array(16))
      );
      setMnemonic(newMnemonic);
      setStep("create");
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Create wallet with password
  const handleCreateWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!mnemonic) throw new Error("No mnemonic generated");
      if (!password) throw new Error("Password required");
      if (password !== confirmPassword) throw new Error("Passwords don't match");
      if (password.length < 6) throw new Error("Password must be at least 6 characters");

      // Encrypt mnemonic
      const encrypted = await encryptMnemonic(mnemonic, password);

      // Save to localStorage
      localStorage.setItem("encrypted_wallet", encrypted);

      // Create wallet
      const wallet = new PrivacyWallet(mnemonic);

      // Call callback
      onWalletCreated(wallet);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Import existing wallet
  const handleImportWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!importMnemonic) throw new Error("Seed phrase required");
      if (!importPassword) throw new Error("Password required");

      // Validate mnemonic
      const mnemonicObj = ethers.Mnemonic.fromPhrase(importMnemonic);
      if (!mnemonicObj) throw new Error("Invalid seed phrase");

      // Encrypt mnemonic
      const encrypted = await encryptMnemonic(importMnemonic, importPassword);

      // Save to localStorage
      localStorage.setItem("encrypted_wallet", encrypted);

      // Create wallet
      const wallet = new PrivacyWallet(importMnemonic);

      // Call callback
      onWalletCreated(wallet);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Initial screen
  if (step === "initial") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">🔐</div>
            <h1 className="text-3xl font-bold text-white mb-2">AnonWallet</h1>
            <p className="text-slate-400">Privacy-first testnet wallet</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={generateNewWallet}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-6 rounded-lg transition text-lg"
            >
              ➕ Create New Wallet
            </button>

            <button
              onClick={() => setStep("import")}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-4 px-6 rounded-lg transition text-lg"
            >
              📥 Import Existing Wallet
            </button>
          </div>

          <div className="mt-8 bg-blue-900/20 border border-blue-600/30 rounded-lg p-4">
            <p className="text-xs text-blue-200">
              💡 <span className="font-semibold">Testnet Only:</span> This wallet works on Sepolia and Goerli testnets. Your private keys are encrypted and stored locally.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Create wallet screen
  if (step === "create") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">🔒</div>
            <h1 className="text-2xl font-bold text-white">Secure Your Wallet</h1>
            <p className="text-slate-400 mt-2">Set a password to encrypt your seed phrase</p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-6">
            <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4 mb-4">
              <p className="text-sm font-semibold text-yellow-300 mb-3">📝 Save Your Seed Phrase</p>
              <div className="bg-slate-900 rounded p-3 mb-3">
                <p className="text-sm font-mono text-slate-300 break-words">{mnemonic}</p>
              </div>
              <p className="text-xs text-yellow-200">
                Write this down and keep it safe. You'll need it to recover your wallet.
              </p>
            </div>

            <form onSubmit={handleCreateWallet} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-900/20 border border-red-600/30 rounded-lg">
                  <p className="text-sm text-red-300">❌ {error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !password || !confirmPassword}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-lg transition"
              >
                {loading ? "Creating..." : "Create Wallet"}
              </button>
            </form>

            <button
              onClick={() => {
                setStep("initial");
                setMnemonic("");
                setPassword("");
                setConfirmPassword("");
                setError("");
              }}
              className="w-full mt-3 text-slate-400 hover:text-slate-300 text-sm"
            >
              ← Back
            </button>
          </div>

          <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4">
            <p className="text-xs text-blue-200">
              🔐 <span className="font-semibold">Your password:</span> Encrypts your seed phrase before storing locally. Never shared with servers.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Import wallet screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">📥</div>
          <h1 className="text-2xl font-bold text-white">Import Wallet</h1>
          <p className="text-slate-400 mt-2">Enter your seed phrase and password</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <form onSubmit={handleImportWallet} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Seed Phrase (12 words)
              </label>
              <textarea
                value={importMnemonic}
                onChange={(e) => setImportMnemonic(e.target.value)}
                placeholder="word1 word2 word3..."
                className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500 outline-none"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Password
              </label>
              <input
                type="password"
                value={importPassword}
                onChange={(e) => setImportPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-900/20 border border-red-600/30 rounded-lg">
                <p className="text-sm text-red-300">❌ {error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !importMnemonic || !importPassword}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-lg transition"
            >
              {loading ? "Importing..." : "Import Wallet"}
            </button>
          </form>

          <button
            onClick={() => {
              setStep("initial");
              setImportMnemonic("");
              setImportPassword("");
              setError("");
            }}
            className="w-full mt-3 text-slate-400 hover:text-slate-300 text-sm"
          >
            ← Back
          </button>
        </div>

        <div className="mt-6 bg-blue-900/20 border border-blue-600/30 rounded-lg p-4">
          <p className="text-xs text-blue-200">
            🔐 <span className="font-semibold">Your password:</span> Never shared with servers. Stored locally only.
          </p>
        </div>
      </div>
    </div>
  );
}