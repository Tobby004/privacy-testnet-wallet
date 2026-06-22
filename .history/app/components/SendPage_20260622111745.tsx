"use client";

import { useState } from "react";
import { NetworkId, NETWORKS } from "@/lib/networks";
import { decryptMnemonic, encryptMnemonic } from "@/lib/encryption";

interface SettingsPageProps {
  network: NetworkId;
  onLock: () => void;
}

export function SettingsPage({ network, onLock }: SettingsPageProps) {
  const [showExport, setShowExport] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [seedPhraseVisible, setSeedPhraseVisible] = useState(false);
  const [seedPhrase, setSeedPhrase] = useState("");
  const [exportPass, setExportPass] = useState("");
  const [exportMsg, setExportMsg] = useState("");

  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [newPassConfirm, setNewPassConfirm] = useState("");
  const [passMsg, setPassMsg] = useState("");

  const networkConfig = NETWORKS[network];

  // Export Seed
  const handleExportClick = async (e: React.FormEvent) => {
    e.preventDefault();
    setExportMsg("");

    try {
      const encrypted = localStorage.getItem("encrypted_wallet");
      if (!encrypted) throw new Error("No wallet found");

      const decrypted = decryptMnemonic(encrypted, exportPass);
      setSeedPhrase(decrypted);
      setSeedPhraseVisible(true);
      setExportPass("");
    } catch (err: any) {
      setExportMsg("❌ " + err.message);
    }
  };

  // Change Password
  const handleChangePassClick = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMsg("");

    try {
      if (!oldPass || !newPass || !newPassConfirm) {
        throw new Error("All fields required");
      }
      if (newPass !== newPassConfirm) {
        throw new Error("Passwords don't match");
      }
      if (newPass.length < 6) {
        throw new Error("Password too short");
      }

      const encrypted = localStorage.getItem("encrypted_wallet");
      if (!encrypted) throw new Error("No wallet found");

      const mnemonic = decryptMnemonic(encrypted, oldPass);
      const newEncrypted = encryptMnemonic(mnemonic, newPass);
      localStorage.setItem("encrypted_wallet", newEncrypted);

      setPassMsg("✓ Password changed!");
      setOldPass("");
      setNewPass("");
      setNewPassConfirm("");

      setTimeout(() => setPassMsg(""), 3000);
    } catch (err: any) {
      setPassMsg("❌ " + err.message);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Info Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <p className="text-xs text-slate-500">Network</p>
          <p className="text-lg font-bold text-purple-400 mt-2">{networkConfig.name}</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <p className="text-xs text-slate-500">Type</p>
          <p className="text-lg font-bold text-slate-300 mt-2">BIP-44</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <p className="text-xs text-slate-500">Encryption</p>
          <p className="text-lg font-bold text-slate-300 mt-2">XSalsa20</p>
        </div>
      </div>

      {/* Export Seed Phrase */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700 rounded-xl p-6">
        <button
          onClick={() => setShowExport(!showExport)}
          className="w-full flex items-center justify-between p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition mb-4"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">👁️</span>
            <div className="text-left">
              <p className="font-semibold text-white">Export Seed Phrase</p>
              <p className="text-xs text-slate-500">View recovery words</p>
            </div>
          </div>
          <span className="text-slate-400">{showExport ? "▼" : "→"}</span>
        </button>

        {showExport && (
          <form onSubmit={handleExportClick} className="space-y-4 bg-slate-800/30 p-4 rounded-lg">
            <input
              type="password"
              value={exportPass}
              onChange={(e) => setExportPass(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm"
            />
            <button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 rounded"
            >
              Show Seed Phrase
            </button>
            {exportMsg && <p className="text-sm text-center">{exportMsg}</p>}

            {seedPhraseVisible && (
              <div className="space-y-3 mt-4">
                <div className="bg-yellow-900/30 border border-yellow-600/50 rounded p-3">
                  <p className="text-xs text-yellow-300">
                    ⚠️ Keep this safe! Anyone with this phrase can access your wallet.
                  </p>
                </div>
                <div className="bg-slate-900 border border-slate-600 rounded p-3">
                  <p className="text-sm font-mono text-slate-300 break-words">{seedPhrase}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(seedPhrase);
                    alert("Copied!");
                  }}
                  className="w-full bg-slate-700 hover:bg-slate-600 text-white py-2 rounded text-sm"
                >
                  📋 Copy
                </button>
              </div>
            )}
          </form>
        )}
      </div>

      {/* Change Password */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700 rounded-xl p-6">
        <button
          onClick={() => setShowPassword(!showPassword)}
          className="w-full flex items-center justify-between p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition mb-4"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔑</span>
            <div className="text-left">
              <p className="font-semibold text-white">Change Password</p>
              <p className="text-xs text-slate-500">Update encryption key</p>
            </div>
          </div>
          <span className="text-slate-400">{showPassword ? "▼" : "→"}</span>
        </button>

        {showPassword && (
          <form onSubmit={handleChangePassClick} className="space-y-4 bg-slate-800/30 p-4 rounded-lg">
            <input
              type="password"
              value={oldPass}
              onChange={(e) => setOldPass(e.target.value)}
              placeholder="Current password"
              className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm"
            />
            <input
              type="password"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              placeholder="New password"
              className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm"
            />
            <input
              type="password"
              value={newPassConfirm}
              onChange={(e) => setNewPassConfirm(e.target.value)}
              placeholder="Confirm new password"
              className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm"
            />
            <button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 rounded"
            >
              Change Password
            </button>
            {passMsg && <p className="text-sm text-center">{passMsg}</p>}
          </form>
        )}
      </div>

      {/* Danger Zone */}
      <div className="bg-red-900/20 border border-red-600/30 rounded-xl p-6">
        <button
          onClick={onLock}
          className="w-full bg-red-900/30 hover:bg-red-900/50 border border-red-600 text-red-300 font-semibold py-3 rounded-lg"
        >
          🔒 Lock Wallet
        </button>
      </div>
    </div>
  );
}