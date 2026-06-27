"use client";

import { useState } from "react";
import { NetworkId, NETWORKS } from "@/lib/networks";
import { decryptMnemonic, encryptMnemonic } from "@/lib/encryption";
import { BackupPanel } from "./BackupPanel";

interface SettingsPageProps {
  network: NetworkId;
  onLock: () => void;
}

export function SettingsPage({ network, onLock }: SettingsPageProps) {
  const [showExport, setShowExport] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [seedVisible, setSeedVisible] = useState(false);
  const [seed, setSeed] = useState("");
  const [exportPass, setExportPass] = useState("");
  const [exportError, setExportError] = useState("");

  const [currPass, setCurrPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [newPassConf, setNewPassConf] = useState("");
  const [passError, setPassError] = useState("");
  const [passSuccess, setPassSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const networkConfig = NETWORKS[network];

  // Export Seed - ASYNC function
  const exportSeed = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Export clicked");
    setExportError("");
    setLoading(true);

    try {
      const enc = localStorage.getItem("encrypted_wallet");
      if (!enc) throw new Error("No wallet");

      const decrypted = await decryptMnemonic(enc, exportPass);
      setSeed(decrypted);
      setSeedVisible(true);
      setExportPass("");
    } catch (err: any) {
      setExportError("❌ " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Change Password - ASYNC function
  const changePass = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Password change clicked");
    setPassError("");
    setPassSuccess("");
    setLoading(true);

    try {
      if (!currPass || !newPass || !newPassConf) throw new Error("All fields required");
      if (newPass !== newPassConf) throw new Error("Passwords don't match");
      if (newPass.length < 6) throw new Error("Min 6 chars");

      const enc = localStorage.getItem("encrypted_wallet");
      if (!enc) throw new Error("No wallet");

      const mn = await decryptMnemonic(enc, currPass);
      const newEnc = await encryptMnemonic(mn, newPass);
      localStorage.setItem("encrypted_wallet", newEnc);

      setPassSuccess("✓ Password changed!");
      setCurrPass("");
      setNewPass("");
      setNewPassConf("");
      setTimeout(() => setPassSuccess(""), 3000);
    } catch (err: any) {
      setPassError("❌ " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* EXPORT SECTION */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <button
          type="button"
          onClick={() => {
            console.log("Toggle export:", !showExport);
            setShowExport(!showExport);
          }}
          className="w-full flex justify-between items-center p-3 bg-slate-700 hover:bg-slate-600 rounded mb-4 font-semibold text-white"
        >
          <span>👁️ Export Seed Phrase</span>
          <span>{showExport ? "▼" : "→"}</span>
        </button>

        {showExport && (
          <form onSubmit={exportSeed} className="space-y-3 p-4 bg-slate-700/50 rounded">
            <input
              type="password"
              value={exportPass}
              onChange={(e) => setExportPass(e.target.value)}
              placeholder="Enter password"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white"
            />
            <button
              type="submit"
              disabled={loading || !exportPass}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white py-2 rounded font-semibold"
            >
              {loading ? "Loading..." : "Show Seed"}
            </button>
            {exportError && <p className="text-red-400 text-sm">{exportError}</p>}

            {seedVisible && (
              <div className="mt-4 space-y-3">
                <div className="bg-yellow-900/30 p-2 rounded text-xs text-yellow-300">
                  ⚠️ Keep this safe! Anyone with this can access your wallet.
                </div>
                <div className="bg-black p-3 rounded font-mono text-sm text-slate-300 break-words">
                  {seed}
                </div>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(seed)}
                  className="w-full bg-slate-600 hover:bg-slate-500 text-white py-2 rounded text-sm"
                >
                  📋 Copy
                </button>
              </div>
            )}
          </form>
        )}
      </div>

      {/* PASSWORD SECTION */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <button
          type="button"
          onClick={() => {
            console.log("Toggle password:", !showPassword);
            setShowPassword(!showPassword);
          }}
          className="w-full flex justify-between items-center p-3 bg-slate-700 hover:bg-slate-600 rounded mb-4 font-semibold text-white"
        >
          <span>🔑 Change Password</span>
          <span>{showPassword ? "▼" : "→"}</span>
        </button>

        {showPassword && (
          <form onSubmit={changePass} className="space-y-3 p-4 bg-slate-700/50 rounded">
            <input
              type="password"
              value={currPass}
              onChange={(e) => setCurrPass(e.target.value)}
              placeholder="Current password"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white"
            />
            <input
              type="password"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              placeholder="New password"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white"
            />
            <input
              type="password"
              value={newPassConf}
              onChange={(e) => setNewPassConf(e.target.value)}
              placeholder="Confirm new password"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white"
            />
            <button
              type="submit"
              disabled={loading || !currPass || !newPass || !newPassConf}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white py-2 rounded font-semibold"
            >
              {loading ? "Updating..." : "Change Password"}
            </button>
            {passError && <p className="text-red-400 text-sm">{passError}</p>}
            {passSuccess && <p className="text-green-400 text-sm">{passSuccess}</p>}
          </form>
        )}
      </div>

      {/* LOCK BUTTON */}
      <button
        onClick={onLock}
        className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold"
      >
        🔒 Lock Wallet
      </button>
    </div>
  );
}