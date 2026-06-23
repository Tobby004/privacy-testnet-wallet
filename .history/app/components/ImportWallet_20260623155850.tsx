"use client";

import { useState } from "react";
import { PrivacyWallet } from "@/lib/hdWallet";
import { encryptMnemonic } from "@/lib/encryption";
import { NetworkId, NETWORKS } from "@/lib/networks";

interface ImportWalletProps {
  onSuccess: (wallet: PrivacyWallet) => void;
  selectedNetwork: NetworkId;
  onNetworkChange: (network: NetworkId) => void;
}

export function ImportWallet({ onSuccess, selectedNetwork, onNetworkChange }: ImportWalletProps) {
  const [step, setStep] = useState<"landing" | "setup">("landing");
  const [mode, setMode] = useState<"generate" | "import">("generate");
  const [seedPhrase, setSeedPhrase] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [generatedSeed, setGeneratedSeed] = useState("");

  const handleGenerateWallet = async () => {
    setError("");
    setLoading(true);

    try {
      const { mnemonic, wallet } = PrivacyWallet.generateTestnetWallet();
      setGeneratedSeed(mnemonic);
      setSeedPhrase(mnemonic);
      setStep("setup");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImportWallet = () => {
    setStep("setup");
  };

  const handleCreateWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!seedPhrase) {
      setError("Seed phrase is required");
      return;
    }

    if (!password) {
      setError("Password is required");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const wallet = new PrivacyWallet(seedPhrase);
      const encrypted = await encryptMnemonic(mnemonic, password);

      localStorage.setItem("encrypted_wallet", encrypted);
      localStorage.setItem("selected_network", selectedNetwork);

      onSuccess(wallet);
    } catch (err: any) {
      setError(err.message || "Failed to create wallet");
    } finally {
      setLoading(false);
    }
  };

  // Landing Page
  if (step === "landing") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        {/* Header with Logo */}
        <div className="border-b border-slate-800/50 px-8 py-4">
          <div className="max-w-6xl mx-auto flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center font-bold text-slate-950">
              A
            </div>
            <div>
              <p className="font-bold text-white text-lg">AnonWallet</p>
              <p className="text-xs text-teal-400 font-semibold">testnet</p>
            </div>
          </div>
        </div>

        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="grid grid-cols-2 gap-16 max-w-6xl w-full">
            {/* Left: Marketing Copy */}
            <div className="flex flex-col justify-center">
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-500/50 mb-6">
                  <span className="w-2 h-2 bg-teal-400 rounded-full animate-pulse"></span>
                  <span className="text-xs font-semibold text-teal-300">LIVE ON TESTNET</span>
                </div>
              </div>

              <h1 className="text-5xl font-bold text-white mb-4 leading-tight">
                Your transactions.{" "}
                <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                  Invisible.
                </span>
              </h1>

              <p className="text-lg text-slate-400 mb-8 leading-relaxed">
                A privacy-first Web3 wallet that generates fresh addresses for every transaction — so no one can trace your on-chain activity.
              </p>

              {/* Features */}
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <div className="text-2xl mt-1">🔐</div>
                  <div>
                    <p className="font-semibold text-white">Non-custodial</p>
                    <p className="text-sm text-slate-500">Keys stay in your browser, always</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="text-2xl mt-1">📍</div>
                  <div>
                    <p className="font-semibold text-white">Fresh address per tx</p>
                    <p className="text-sm text-slate-500">Breaks on-chain transaction linking</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="text-2xl mt-1">🌐</div>
                  <div>
                    <p className="font-semibold text-white">Multi-network</p>
                    <p className="text-sm text-slate-500">Scroll Sepolia & Sepolia testnets</p>
                  </div>
                </div>
              </div>

              {/* Supported Networks */}
              <div className="flex items-center gap-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Supported networks</p>
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span className="text-xs text-slate-400">Scroll Sepolia</span>
                </div>
                <div className="flex gap-2 ml-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-xs text-slate-400">Sepolia</span>
                </div>
              </div>
            </div>

            {/* Right: Setup Card */}
            <div className="flex flex-col justify-center">
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700 rounded-2xl p-8 backdrop-blur-xl">
                <h2 className="text-2xl font-bold text-white mb-2">Get started</h2>
                <p className="text-slate-400 text-sm mb-8">Create a new wallet or import an existing one.</p>

                {/* Mode Selector */}
                <div className="grid grid-cols-2 gap-3 mb-8">
                  <button
                    onClick={() => {
                      setMode("generate");
                      setSeedPhrase("");
                    }}
                    className={`p-4 rounded-lg font-semibold transition ${
                      mode === "generate"
                        ? "bg-teal-500/20 border border-teal-500/50 text-teal-300"
                        : "bg-slate-700/50 border border-slate-600 text-slate-400 hover:bg-slate-700"
                    }`}
                  >
                    Generate New
                  </button>
                  <button
                    onClick={() => {
                      setMode("import");
                      setGeneratedSeed("");
                    }}
                    className={`p-4 rounded-lg font-semibold transition ${
                      mode === "import"
                        ? "bg-teal-500/20 border border-teal-500/50 text-teal-300"
                        : "bg-slate-700/50 border border-slate-600 text-slate-400 hover:bg-slate-700"
                    }`}
                  >
                    Import Existing
                  </button>
                </div>

                {/* Generate Mode */}
                {mode === "generate" && (
                  <button
                    onClick={handleGenerateWallet}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 disabled:opacity-50 text-white font-bold py-4 px-6 rounded-xl transition shadow-lg mb-6"
                  >
                    {loading ? "Generating..." : "Generate New Wallet"}
                  </button>
                )}

                {/* Import Mode */}
                {mode === "import" && (
                  <>
                    <div className="mb-6">
                      <label className="block text-sm font-semibold text-slate-300 mb-2">Seed Phrase (12 or 24 words)</label>
                      <textarea
                        value={seedPhrase}
                        onChange={(e) => setSeedPhrase(e.target.value)}
                        placeholder="Enter your seed phrase here..."
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition"
                        rows={4}
                      />
                    </div>
                    <button
                      onClick={handleImportWallet}
                      disabled={!seedPhrase.trim()}
                      className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 disabled:opacity-50 text-white font-bold py-4 px-6 rounded-xl transition shadow-lg"
                    >
                      Continue
                    </button>
                  </>
                )}

                {/* Security Features */}
                <div className="mt-8 pt-8 border-t border-slate-700 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>🔒</span>
                    <span>Local keys</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>✓</span>
                    <span>No servers</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>🔐</span>
                    <span>Open source</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Setup Page (Password & Confirmation)
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-teal-500/20 border border-teal-500/30 mb-4">
            <span className="text-3xl">🔐</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Secure Your Wallet</h1>
          <p className="text-sm text-slate-400 mt-2">Set a password to encrypt your seed phrase</p>
        </div>

        {generatedSeed && (
          <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-xl p-6 mb-8">
            <p className="text-sm font-semibold text-yellow-300 mb-3">📝 Save Your Seed Phrase</p>
            <div className="bg-slate-900 rounded-lg p-4 border border-slate-700 mb-4">
              <p className="text-sm font-mono text-slate-300 break-words">{generatedSeed}</p>
            </div>
            <p className="text-xs text-yellow-200">
              Write this down and keep it safe. You'll need it to recover your wallet.
            </p>
          </div>
        )}

        <form onSubmit={handleCreateWallet} className="space-y-4">
          {/* Password Input */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a strong password"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-900/20 border border-red-600/30 rounded-lg">
              <p className="text-sm font-semibold text-red-300">❌ {error}</p>
            </div>
          )}

          {/* Network Selector */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Starting Network</label>
            <select
              value={selectedNetwork}
              onChange={(e) => onNetworkChange(e.target.value as NetworkId)}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition"
            >
              {Object.entries(NETWORKS).map(([id, config]) => (
                <option key={id} value={id}>
                  {config.name}
                </option>
              ))}
            </select>
          </div>

          {/* Create Wallet Button */}
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 disabled:opacity-50 text-white font-bold py-4 px-6 rounded-xl transition shadow-lg mt-6"
          >
            {loading ? "Creating Wallet..." : "Create Wallet"}
          </button>

          {/* Back Button */}
          <button
            type="button"
            onClick={() => {
              setStep("landing");
              setSeedPhrase("");
              setPassword("");
              setConfirmPassword("");
            }}
            className="w-full text-slate-400 hover:text-slate-300 text-sm font-medium transition"
          >
            ← Back
          </button>
        </form>

        {/* Info Box */}
        <div className="mt-8 p-4 bg-blue-900/20 border border-blue-600/30 rounded-lg">
          <p className="text-xs text-blue-200">
            <span className="font-semibold">🔒 Your password:</span> Encrypts your seed phrase before storing locally. Never shared with servers.
          </p>
        </div>
      </div>
    </div>
  );
}