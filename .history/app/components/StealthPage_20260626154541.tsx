"use client";

import { useState } from "react";
import { PrivacyWallet } from "@/lib/hdWallet";
import { NetworkId } from "@/lib/networks";
import { StealthMetaTab } from "./StealthMetaTab";
import { StealthSendTab } from "./StealthSendTab";
import { StealthScanTab } from "./StealthScanTab";
import { KeyRound, Send, Radar } from "lucide-react";

interface StealthPageProps {
  wallet: PrivacyWallet;
  network: NetworkId;
}

type StealthTab = "meta" | "send" | "scan";

export function StealthPage({ wallet, network }: StealthPageProps) {
  const [tab, setTab] = useState<StealthTab>("meta");

  const tabs = [
    { id: "meta" as const, label: "My Address", Icon: KeyRound },
    { id: "send" as const, label: "Send", Icon: Send },
    { id: "scan" as const, label: "Scan", Icon: Radar },
  ];

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-1">Stealth Payments</h2>
        <p className="text-slate-400 text-sm">
          ERC-5564 stealth addresses — unlinkable payments via shared-secret cryptography.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-6">
        {tabs.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition ${
              tab === id
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700 border border-transparent"
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="text-sm">{label}</span>
          </button>
        ))}
      </div>

      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700 rounded-xl p-6">
        {tab === "meta" && <StealthMetaTab wallet={wallet} />}
        {tab === "send" && <StealthSendTab wallet={wallet} network={network} />}
        {tab === "scan" && <StealthScanTab network={network} />}
      </div>
    </div>
  );
}