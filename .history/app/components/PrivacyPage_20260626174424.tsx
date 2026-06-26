"use client";

import { useState, useEffect } from "react";
import { PrivacyWallet } from "@/lib/hdWallet";
import { NetworkId } from "@/lib/networks";
import {
  runPrivacyInspector,
  InspectorReport,
  Finding,
  Severity,
} from "@/lib/privacyInspector";
import { getAnnouncements } from "@/lib/stealthAnnouncer";
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Info,
  CheckCircle,
  RefreshCw,
  Lightbulb,
} from "lucide-react";

interface PrivacyPageProps {
  wallet: PrivacyWallet;
  network: NetworkId;
}

const ADDRESS_COUNT = 3;

export function PrivacyPage({ wallet, network }: PrivacyPageProps) {
  const [report, setReport] = useState<InspectorReport | null>(null);

  const analyze = () => {
    // gather local data
    const addresses: string[] = [];
    for (let i = 0; i < ADDRESS_COUNT; i++) {
      try {
        const obj = wallet.getDerivedAddress(i);
        addresses.push(typeof obj === "string" ? obj : obj.address || "");
      } catch {}
    }

    let txHistory: any[] = [];
    try {
      txHistory = JSON.parse(localStorage.getItem("tx_history") || "[]");
    } catch {}

    const announcements = getAnnouncements();

    const result = runPrivacyInspector({
      addresses,
      txHistory,
      announcements: announcements.map((a) => ({
        stealthAddress: a.stealthAddress,
        ephemeralPublicKey: a.ephemeralPublicKey,
        network: a.network,
        amount: a.amount,
        txHash: a.txHash,
      })),
    });
    setReport(result);
  };

  useEffect(() => {
    analyze();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!report) {
    return <p className="text-slate-400">Analyzing…</p>;
  }

  const scoreColor =
    report.score >= 80
      ? "text-green-400"
      : report.score >= 50
      ? "text-amber-400"
      : "text-red-400";

  const counts = report.findings.reduce(
    (acc, f) => {
      acc[f.severity]++;
      return acc;
    },
    { good: 0, info: 0, warning: 0, critical: 0 } as Record<Severity, number>
  );

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Privacy Inspector</h2>
          <p className="text-slate-400 text-sm">
            An honest audit of how your wallet activity affects your on-chain privacy.
          </p>
        </div>
        <button
          onClick={analyze}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm"
        >
          <RefreshCw className="w-4 h-4" /> Re-scan
        </button>
      </div>

      {/* Score card */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-6">
          <div className="relative w-28 h-28 flex-shrink-0">
            <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor"
                strokeWidth="8" className="text-slate-700" />
              <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor"
                strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${(report.score / 100) * 264} 264`}
                className={scoreColor} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl font-bold ${scoreColor}`}>{report.score}</span>
              <span className="text-xs text-slate-500">/ 100</span>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-lg font-semibold text-white mb-2">
              {report.score >= 80
                ? "Strong privacy hygiene"
                : report.score >= 50
                ? "Some privacy leaks detected"
                : "Significant privacy leaks"}
            </p>
            <div className="flex flex-wrap gap-3 text-xs">
              {counts.critical > 0 && (
                <span className="text-red-400">{counts.critical} critical</span>
              )}
              {counts.warning > 0 && (
                <span className="text-amber-400">{counts.warning} warning</span>
              )}
              {counts.info > 0 && (
                <span className="text-blue-400">{counts.info} info</span>
              )}
              {counts.good > 0 && (
                <span className="text-green-400">{counts.good} good</span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-3">
              Based on local wallet activity. This is an educational audit, not a guarantee.
            </p>
          </div>
        </div>
      </div>

      {/* Findings */}
      <div className="space-y-3">
        {report.findings.map((f) => (
          <FindingCard key={f.id} finding={f} />
        ))}
      </div>
    </div>
  );
}

function FindingCard({ finding }: { finding: Finding }) {
  const config = {
    critical: { Icon: ShieldAlert, color: "text-red-400", border: "border-red-600/30", bg: "bg-red-900/10" },
    warning: { Icon: AlertTriangle, color: "text-amber-400", border: "border-amber-600/30", bg: "bg-amber-900/10" },
    info: { Icon: Info, color: "text-blue-400", border: "border-blue-600/30", bg: "bg-blue-900/10" },
    good: { Icon: CheckCircle, color: "text-green-400", border: "border-green-600/30", bg: "bg-green-900/10" },
  }[finding.severity];

  const { Icon } = config;

  return (
    <div className={`border ${config.border} ${config.bg} rounded-lg p-4`}>
      <div className="flex gap-3">
        <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${config.color}`} />
        <div className="flex-1">
          <p className={`font-semibold text-sm ${config.color}`}>{finding.title}</p>
          <p className="text-sm text-slate-300 mt-1">{finding.detail}</p>
          {finding.suggestion && (
            <div className="flex gap-2 mt-3 pt-3 border-t border-slate-700/50">
              <Lightbulb className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-slate-400">{finding.suggestion}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}