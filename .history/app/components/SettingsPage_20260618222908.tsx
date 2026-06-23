"use client";

import { useState } from "react";
import { NetworkId, NETWORKS } from "@/lib/networks";

interface SettingsPageProps {
  network: NetworkId;
  onLock: () => void;
}

export function SettingsPage({ network, onLock }: SettingsPageProps) {
  const [showSeedPhrase, setShowSeedPhrase] = useState(false);
  const [seedPhrase, setSeedPhrase] = useState("");

  const handleExportSeedPhrase = async () => {
    try {
      const encrypted = localStorage.getItem("encrypted_wallet");
      if (encrypted) {
        // In a real scenario, we'd decrypt with password
        // For now, show that the feature would work
        setShowSeedPhrase(true);
      }
    } catch (error) {
      console.error("Error exporting seed phrase:", error);
    }
  };

  const networkConfig = NETWORKS[network];

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
            <p className="text-lg font-bold text-teal-400">{networkConfig.name}</p>
          </div>

          <div className="flex items-center justify-between pb-4 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🔐</div>
              <div>
                <p className="text-sm font-semibold text-slate-300">Wallet Type</p>
                <p className="text-xs text-slate-500">HD Wallet (BIP-44)</p>
              </div>
            </div>
            <p className="text-sm font-mono text-slate-400">Fresh addresses</p>
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
          <button className="w-full flex items-center justify-between p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition group">
            <div className="flex items-center gap-3">
              <div className="text-2xl">👁️</div>
              <div className="text-left">
                <p className="text-sm font-semibold text-white group-hover:text-slate-100">View Seed Phrase</p>
                <p className="text-xs text-slate-500">Recovery words</p>
              </div>
            </div>
            <span className="text-slate-400">→</span>
          </button>

          <button className="w-full flex items-center justify-between p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition group">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🔑</div>
              <div className="text-left">
                <p className="text-sm font-semibold text-white group-hover:text-slate-100">Change Password</p>
                <p className="text-xs text-slate-500">Update encryption key</p>
              </div>
            </div>
            <span className="text-slate-400">→</span>
          </button>

          <a
            href={networkConfig.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition group"
          >
            <div className="flex items-center gap-3">
              <div className="text-2xl">🔗</div>
              <div className="text-left">
                <p className="text-sm font-semibold text-white group-hover:text-slate-100">View on Explorer</p>
                <p className="text-xs text-slate-500">Browse addresses on Etherscan</p>
              </div>
            </div>
            <span className="text-slate-400">→</span>
          </a>
        </div>
      </div>

      {/* Privacy & Security Info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-teal-900/20 to-cyan-900/20 border border-teal-600/30 rounded-xl p-6">
          <p className="text-sm font-semibold text-teal-300 mb-3">🔐 Privacy Features</p>
          <ul className="text-xs text-teal-200 space-y-2">
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