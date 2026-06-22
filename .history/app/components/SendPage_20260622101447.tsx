"use client";

import { useState } from "react";
import { NetworkId, NETWORKS } from "@/lib/networks";
import { decryptMnemonic, encryptMnemonic } from "@/lib/encryption";

interface SettingsPageProps {
  network: NetworkId;
  onLock: () => void;
}

export function SettingsPage({ network, onLock }: SettingsPageProps) {
  const [activeSection, setActiveSection] = useState<"export" | "password" | null>(null);
  const [showSeedPhrase, setShowSeedPhrase] = useState(false);
  const [seedPhrase, setSeedPhrase] = useState("");
  const [exportPassword, setExportPassword] = useState("");
  const [exportError, setExportError] = useState("");
  const [exportSuccess, setExportSuccess] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const networkConfig = NETWORKS[network];

  // Export Seed Phrase
  const handleExportSeedPhrase = async (e: React.FormEvent) => {
    e.preventDefault();
    setExportError("");
    setExportSuccess(false);
    setLoading(true);

    try {
      if (!exportPassword) {
        throw new Error("Password is required");
      }

      // Get encrypted wallet from localStorage
      const encrypted = localStorage.getItem("encrypted_wallet");
      if (!encrypted) {
        throw new Error("No wallet found");
      }

      // Decrypt using password
      const decrypted = decryptMnemonic(encrypted, exportPassword);
      setSeedPhrase(decrypted);
      setShowSeedPhrase(true);
      setExportSuccess(true);
      setExportPassword("");

      // Auto-hide after 30 seconds
      setTimeout(() => {
        setShowSeedPhrase(false);
        setSeedPhrase("");
      }, 30000);
    } catch (err: any) {
      setExportError(err.message || "Failed to export seed phrase. Wrong password?");
    } finally {
      setLoading(false);
    }
  };

  // Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess(false);
    setLoading(true);

    try {
      if (!currentPassword || !newPassword || !confirmPassword) {
        throw new Error("All fields are required");
      }

      if (newPassword !== confirmPassword) {
        throw new Error("New passwords do not match");
      }

      if (newPassword.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }

      if (newPassword === currentPassword) {
        throw new Error("New password must be different from current password");
      }

      // Get encrypted wallet
      const encrypted = localStorage.getItem("encrypted_wallet");
      if (!encrypted) {
        throw new Error("No wallet found");
      }

      // Decrypt with old password
      const mnemonic = decryptMnemonic(encrypted, currentPassword);

      // Re-encrypt with new password
      const newEncrypted = encryptMnemonic(mnemonic, newPassword);

      // Save new encrypted wallet
      localStorage.setItem("encrypted_wallet", newEncrypted);

      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Hide success message after 3 seconds
      setTimeout(() => {
        setPasswordSuccess(false);
      }, 3000);
    } catch (err: any) {
      setPasswordError(err.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Wallet Info */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700 rounded-xl p-8">
        <h3 className="text-lg font-bold text-white mb-6">Wallet Information</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🌐</div>
              <div>
                <p className="text-sm font-semibold text-slate-300">Current Network</p>
                <p className="text-xs text-slate-500">Active testnet</p>
              </div>
            </div>
            <p className="text-lg font-bold text-purple-400">{networkConfig.name}</p>
          </div>

          <div className="flex items-center justify-between pb-4 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🔐</div>
              <div>
                <p className="text-sm font-semibold text-slate-300">Wallet Type</p>
                <p className="text-xs text-slate-500">Hierarchical Deterministic</p>
              </div>
            </div>
            <p className="text-sm font-mono text-slate-400">BIP-44</p>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🛡️</div>
              <div>
                <p className="text-sm font-semibold text-slate-300">Encryption</p>
                <p className="text-xs text-slate-500">Local key storage</p>
              </div>
            </div>
            <p className="text-sm font-mono text-slate-400">XSalsa20-Poly1305</p>
          </div>
        </div>
      </div>

      {/* Wallet Management */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700 rounded-xl p-8">
        <h3 className="text-lg font-bold text-white mb-6">Wallet Management</h3>
        <div className="space-y-3">
          {/* Export Seed Phrase */}
          <div>
            <button
              onClick={() => setActiveSection(activeSection === "export" ? null : "export")}
              className="w-full flex items-center justify-between p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition group"
            >
              <div className="flex items-center gap-3 text-left">
                <div className="text-2xl">👁️</div>
                <div>
                  <p className="text-sm font-semibold text-white group-hover:text-slate-100">
                    Export Seed Phrase
                  </p>
                  <p className="text-xs text-slate-500">Recovery words (password protected)</p>
                </div>
              </div>
              <span className="text-slate-400">{activeSection === "export" ? "▼" : "→"}</span>
            </button>

            {activeSection === "export" && (
              <div className="mt-4 bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                {!showSeedPhrase ? (
                  <form onSubmit={handleExportSeedPhrase} className="space-y-4">
                    <p className="text-sm text-slate-300 mb-4">
                      Enter your password to view your seed phrase. Keep it safe and secret!
                    </p>

                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">
                        Password
                      </label>
                      <input
                        type="password"
                        value={exportPassword}
                        onChange={(e) => setExportPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                      />
                    </div>

                    {exportError && (
                      <div className="p-3 bg-red-900/20 border border-red-600/30 rounded-lg">
                        <p className="text-sm text-red-300">❌ {exportError}</p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading || !exportPassword}
                      className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-lg transition"
                    >
                      {loading ? "Verifying..." : "Show Seed Phrase"}
                    </button>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
                      <p className="text-sm font-semibold text-yellow-300 mb-2">
                        ⚠️ Keep Your Seed Phrase Safe!
                      </p>
                      <p className="text-xs text-yellow-200">
                        Anyone with this phrase can access your wallet. Store it securely offline.
                      </p>
                    </div>

                    <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
                      <p className="text-sm font-mono text-slate-300 break-words mb-4">
                        {seedPhrase}
                      </p>
                      <button
                        onClick={() => copyToClipboard(seedPhrase)}
                        className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg transition text-sm"
                      >
                        📋 Copy to Clipboard
                      </button>
                    </div>

                    <p className="text-xs text-slate-500">
                      This phrase will be hidden automatically in 30 seconds for security.
                    </p>

                    <button
                      onClick={() => {
                        setShowSeedPhrase(false);
                        setSeedPhrase("");
                      }}
                      className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg transition"
                    >
                      Hide Seed Phrase
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Change Password */}
          <div>
            <button
              onClick={() => setActiveSection(activeSection === "password" ? null : "password")}
              className="w-full flex items-center justify-between p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition group"
            >
              <div className="flex items-center gap-3 text-left">
                <div className="text-2xl">🔑</div>
                <div>
                  <p className="text-sm font-semibold text-white group-hover:text-slate-100">
                    Change Password
                  </p>
                  <p className="text-xs text-slate-500">Update encryption key</p>
                </div>
              </div>
              <span className="text-slate-400">{activeSection === "password" ? "▼" : "→"}</span>
            </button>

            {activeSection === "password" && (
              <div className="mt-4 bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                    />
                  </div>

                  {passwordError && (
                    <div className="p-3 bg-red-900/20 border border-red-600/30 rounded-lg">
                      <p className="text-sm text-red-300">❌ {passwordError}</p>
                    </div>
                  )}

                  {passwordSuccess && (
                    <div className="p-3 bg-green-900/20 border border-green-600/30 rounded-lg">
                      <p className="text-sm text-green-300">✓ Password changed successfully!</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !currentPassword || !newPassword || !confirmPassword}
                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-lg transition"
                  >
                    {loading ? "Updating..." : "Change Password"}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* View on Explorer */}
          <a
            href={`${networkConfig.explorerUrl}/address/0x0000000000000000000000000000000000000000`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition group"
          >
            <div className="flex items-center gap-3 text-left">
              <div className="text-2xl">🔗</div>
              <div>
                <p className="text-sm font-semibold text-white group-hover:text-slate-100">
                  View on Explorer
                </p>
                <p className="text-xs text-slate-500">Browse addresses on {networkConfig.name}</p>
              </div>
            </div>
            <span className="text-slate-400">→</span>
          </a>
        </div>
      </div>

      {/* Privacy & Security */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-600/30 rounded-xl p-6">
          <p className="text-sm font-semibold text-purple-300 mb-3">🔐 Privacy Features</p>
          <ul className="text-xs text-purple-200 space-y-2">
            <li>✓ Fresh address per TX</li>
            <li>✓ MEV-Blocker relay</li>
            <li>✓ RPC rotation</li>
          </ul>
        </div>
        <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border border-green-600/30 rounded-xl p-6">
          <p className="text-sm font-semibold text-green-300 mb-3">🛡️ Security Features</p>
          <ul className="text-xs text-green-200 space-y-2">
            <li>✓ Client-side signing</li>
            <li>✓ Encrypted storage</li>
            <li>✓ No servers</li>
          </ul>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-gradient-to-br from-red-900/20 to-rose-900/20 border border-red-600/30 rounded-xl p-8">
        <h3 className="text-lg font-bold text-red-300 mb-6">Danger Zone</h3>
        <button
          onClick={onLock}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-red-900/30 hover:bg-red-900/50 border border-red-500/50 rounded-lg text-red-300 font-semibold transition"
        >
          🔒 Lock Wallet
        </button>
        <p className="text-xs text-red-200 mt-3">
          Your wallet will be locked and you'll need to enter your password to unlock it again.
        </p>
      </div>
    </div>
  );
}