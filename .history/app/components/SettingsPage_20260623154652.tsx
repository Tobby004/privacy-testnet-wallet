"use client";

import { useState } from "react";
import { NetworkId, NETWORKS } from "@/lib/networks";
import { decryptMnemonic, encryptMnemonic } from "@/lib/encryption";

interface SettingsPageProps {
  network: NetworkId;
  onLock: () => void;
}

export function SettingsPage({ network, onLock }: SettingsPageProps) {
  const [exportOpen, setExportOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [seedVisible, setSeedVisible] = useState(false);
  const [seed, setSeed] = useState("");
  const [exportPass, setExportPass] = useState("");
  const [exportError, setExportError] = useState("");

  const [currPass, setCurrPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [newPassConf, setNewPassConf] = useState("");
  const [passError, setPassError] = useState("");
  const [passSuccess, setPassSuccess] = useState("");

  const networkConfig = NETWORKS[network];

  const exportSeed = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Export clicked"); // DEBUG
    setExportError("");

    try {
      const enc = localStorage.getItem("encrypted_wallet");
      if (!enc) throw new Error("No wallet");

      const decrypted = decryptMnemonic(enc, exportPass);
      setSeed(decrypted);
      setSeedVisible(true);
      setExportPass("");
    } catch (err: any) {
      setExportError("❌ " + err.message);
    }
  };

  const changePass = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Password change clicked"); // DEBUG
    setPassError("");
    setPassSuccess("");

    try {
      if (!currPass || !newPass || !newPassConf) throw new Error("All fields required");
      if (newPass !== newPassConf) throw new Error("Passwords don't match");
      if (newPass.length < 6) throw new Error("Min 6 chars");

      const enc = localStorage.getItem("encrypted_wallet");
      if (!enc) throw new Error("No wallet");

      const mn = decryptMnemonic(enc, currPass);
      const newEnc = encryptMnemonic(mn, newPass);
      localStorage.setItem("encrypted_wallet", newEnc);

      setPassSuccess("✓ Password changed!");
      setCurrPass("");
      setNewPass("");
      setNewPassConf("");
      setTimeout(() => setPassSuccess(""), 3000);
    } catch (err: any) {
      setPassError("❌ " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* EXPORT SECTION */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <button
          type="button"
          onClick={() => {
            console.log("Toggle export:", !exportOpen);
            setExportOpen(!exportOpen);
          }}
          className="w-full flex justify-between items-center p-3 bg-slate-700 hover:bg-slate-600 rounded mb-4 font-semibold text-white"
        >
          <span>👁️ Export Seed Phrase</span>
          <span>{exportOpen ? "▼" : "→"}</span>
        </button>

        {exportOpen && (
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
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded font-semibold"
            >
              Show Seed
            </button>
            {exportError && <p className="text-red-400 text-sm">{exportError}</p>}

            {seedVisible && (
              <div className="mt-4 space-y-3">
                <div className="bg-yellow-900/30 p-2 rounded text-xs text-yellow-300">
                  ⚠️ Keep this safe!
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
            console.log("Toggle password:", !passwordOpen);
            setPasswordOpen(!passwordOpen);
          }}
          className="w-full flex justify-between items-center p-3 bg-slate-700 hover:bg-slate-600 rounded mb-4 font-semibold text-white"
        >
          <span>🔑 Change Password</span>
          <span>{passwordOpen ? "▼" : "→"}</span>
        </button>

        {passwordOpen && (
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
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded font-semibold"
            >
              Change Password
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