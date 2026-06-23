"use client";

import { useState } from "react";
import { PrivacyWallet } from "@/lib/hdWallet";
import { NetworkId } from "@/lib/networks";

interface LayoutProps {
  wallet: PrivacyWallet;
  network: NetworkId;
  onNetworkChange: (network: NetworkId) => void;
  onLock: () => void;
  currentPage: string;
  onPageChange: (page: string) => void;
  children: React.ReactNode;
}

export function WalletLayout({
  wallet,
  network,
  onNetworkChange,
  onLock,
  currentPage,
  onPageChange,
  children,
}: LayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-screen w-56 bg-gradient-to-b from-slate-900/80 to-slate-950/80 border-r border-slate-800 backdrop-blur-xl p-6 flex flex-col overflow-y-auto">
        {/* Logo */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center font-bold text-white">
              A
            </div>
            <div>
              <p className="font-bold text-white text-lg">AnonWallet</p>
              <p className="text-xs text-purple-400 font-semibold">testnet</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-2 flex-1 mb-8">
          {[
            { id: "overview", label: "Overview", icon: "📊" },
            { id: "addresses", label: "Addresses", icon: "📍" },
            { id: "send", label: "Send", icon: "📤" },
            { id: "history", label: "History", icon: "📜" },
            { id: "settings", label: "Settings", icon: "⚙️" },
            { id: "receive", label: "Receive", icon: "📥" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${
                currentPage === item.id
                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                  : "text-slate-400 hover:text-slate-300 hover:bg-slate-800/50"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Network Selector */}
        <div className="mb-6 pb-6 border-t border-slate-800">
          <p className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wider">Network</p>
          <div className="space-y-2">
            {[
              { id: "sepolia", name: "Sepolia", color: "from-orange-500 to-yellow-500" },
              { id: "goerli", name: "Goerli", color: "from-blue-500 to-cyan-500" },
            ].map((net) => (
              <button
                key={net.id}
                onClick={() => onNetworkChange(net.id as NetworkId)}
                className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition ${
                  network === net.id
                    ? `bg-gradient-to-r ${net.color} text-white`
                    : "bg-slate-800/50 text-slate-400 hover:bg-slate-800"
                }`}
              >
                {net.name}
              </button>
            ))}
          </div>
        </div>

        {/* Lock Button */}
        <button
          onClick={onLock}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-900/20 hover:bg-red-900/30 border border-red-500/30 rounded-lg text-red-300 font-semibold transition"
        >
          🔒 Lock Wallet
        </button>
      </div>

      {/* Main Content */}
      <div className="ml-56 min-h-screen">
        {/* Top Bar */}
        <div className="sticky top-0 z-40 border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white capitalize">
                {currentPage === "overview" && "Overview"}
                {currentPage === "addresses" && "Addresses"}
                {currentPage === "send" && "Send Transaction"}
                {currentPage === "history" && "Transaction History"}
                {currentPage === "settings" && "Settings"}
              </h1>
            </div>
            <div className="text-sm text-slate-400">
              {network === "sepolia" && "🌐 Sepolia Testnet"}
              {network === "goerli" && "🌐 Goerli Testnet"}
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-8">{children}</div>
      </div>
    </div>
  );
}