"use client";

import { useState } from "react";
import { encryptMnemonic } from "@/lib/encryption";
import { PrivacyWallet } from "@/lib/hdWallet";

type Mode = "menu" | "import" | "generate";

type ImportWalletProps = {
  onSuccess: (wallet: PrivacyWallet) => void;
  selectedNetwork: "sepolia" | "goerli";
  onNetworkChange: (network: "sepolia" | "goerli") => void;
};
export function ImportWallet({
  onSuccess,
  selectedNetwork,
  onNetworkChange,
}: ImportWalletProps) {
  const [mode, setMode] = useState<Mode>("menu");
  const [mnemonic, setMnemonic] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generatedMnemonic, setGeneratedMnemonic] = useState("");
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!mnemonic.trim()) throw new Error("Mnemonic required");
      if (password !== confirm) throw new Error("Passwords don't match");
      if (password.length < 12) throw new Error("Password too weak (min 12 chars)");

      const wallet = new PrivacyWallet(mnemonic);
      const encrypted = encryptMnemonic(mnemonic, password);
      localStorage.setItem("encrypted_wallet", encrypted);
      localStorage.setItem("wallet_password_hint", password.substring(0, 2) + "***");

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

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!password) throw new Error("Password required");
      if (password !== confirm) throw new Error("Passwords don't match");
      if (password.length < 12) throw new Error("Password too weak (min 12 chars)");

      // Generate a new testnet wallet
      const { mnemonic: newMnemonic, wallet } = PrivacyWallet.generateTestnetWallet();
      
      // Encrypt and store
      const encrypted = encryptMnemonic(newMnemonic, password);
      localStorage.setItem("encrypted_wallet", encrypted);
      localStorage.setItem("wallet_password_hint", password.substring(0, 2) + "***");

      setGeneratedMnemonic(newMnemonic);
      setPassword("");
      setConfirm("");
      
      // Auto-proceed to wallet after 2 seconds
      setTimeout(() => onSuccess(wallet), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedMnemonic);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Menu screen - choose import or generate
  if (mode === "menu") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-12">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 mb-4">
              <span className="text-3xl">🔒</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Privacy Wallet</h1>
            <p className="text-sm text-slate-500 mt-2">Secure key management for testnet</p>
          </div>

          <div className="space-y-3">
            {/* Generate Testnet Wallet Button */}
            <button
              onClick={() => setMode("generate")}
              className="w-full px-6 py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition shadow-lg"
            >
              <div className="text-lg mb-1">✨ Generate Testnet Wallet</div>
              <div className="text-xs opacity-90">Create a new random wallet (easiest)</div>
            </button>

            {/* Import Existing Wallet Button */}
            <button
              onClick={() => setMode("import")}
              className="w-full px-6 py-4 bg-blue-900 hover:bg-blue-800 text-white font-semibold rounded-lg transition"
            >
              <div className="text-lg mb-1">📥 Import Existing Wallet</div>
              <div className="text-xs opacity-90">Use your own mnemonic seed phrase</div>
            </button>
          </div>

          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs font-semibold text-blue-900 mb-2">🔐 How It Works</p>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>✓ Keys stay encrypted locally</li>
              <li>✓ Never sent to any server</li>
              <li>✓ All signing happens in browser</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Generate screen - show generated mnemonic
  if (mode === "generate" && generatedMnemonic) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Your Testnet Wallet Created! ✨</h1>
            <p className="text-sm text-slate-500 mt-2">Save your seed phrase in a safe place</p>
          </div>

          {/* Mnemonic Display */}
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 mb-6">
            <p className="text-xs font-semibold text-yellow-900 mb-3">⚠️ SAVE THIS SEED PHRASE</p>
            <p className="text-sm font-mono text-black bg-white p-3 rounded border border-yellow-200 break-words leading-relaxed mb-4 max-h-32 overflow-y-auto">
              {generatedMnemonic}
            </p>
            <button
              onClick={copyToClipboard}
              className="w-full px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-semibold rounded transition"
            >
              {copied ? "✓ Copied to clipboard" : "📋 Copy to clipboard"}
            </button>
          </div>

          {/* Important Warning */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-xs font-semibold text-red-800 mb-2">🚨 Important</p>
            <ul className="text-xs text-red-700 space-y-1">
              <li>• Write this down on paper (not digital)</li>
              <li>• Never share this phrase with anyone</li>
              <li>• Anyone with this phrase controls your wallet</li>
            </ul>
          </div>

          <p className="text-xs text-slate-500 text-center">
            ✓ Wallet created and encrypted. Redirecting in a moment...
          </p>
        </div>
      </div>
    );
  }

  // Generate screen - enter password
  if (mode === "generate") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <button
            onClick={() => setMode("menu")}
            className="mb-6 text-blue-600 hover:text-blue-700 text-sm font-semibold"
          >
            ← Back
          </button>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Create New Wallet</h1>
            <p className="text-sm text-slate-500 mt-2">Set a password to encrypt your seed phrase</p>
          </div>

          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Strong password (12+ chars)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-700 text-sm"
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat password"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-700 text-sm"
                >
                  {showConfirm ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
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
              className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg disabled:opacity-50 transition"
            >
              {loading ? "Generating..." : "Generate Wallet"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Import screen
  if (mode === "import") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <button
            onClick={() => setMode("menu")}
            className="mb-6 text-blue-600 hover:text-blue-700 text-sm font-semibold"
          >
            ← Back
          </button>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Import Wallet</h1>
            <p className="text-sm text-slate-500 mt-2">Enter your existing BIP-39 seed phrase</p>
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
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm font-mono"
                spellCheck="false"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Strong password (12+ chars)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-700 text-sm"
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat password"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-700 text-sm"
                >
                  {showConfirm ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
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
            <p className="text-xs font-semibold text-blue-900">🔐 Security Guarantee</p>
            <p className="text-xs text-blue-800 mt-1">
              Your keys stay encrypted in the browser. Never sent to any server.
            </p>
          </div>
        </div>
      </div>
    );
  }
}