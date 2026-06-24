"use client";

import { ShieldCheck, MapPin, Network, Lock, Check, Minus } from "lucide-react";

interface PrivacyFactor {
  id: string;
  label: string;
  description: string;
  weight: number;
  active: boolean;
  Icon: React.ComponentType<{ className?: string }>;
}

interface PrivacyScoreProps {
  addressCount: number;       // how many addresses derived
  transactionCount: number;   // total transactions made
  usesFreshAddresses: boolean;
}

export function PrivacyScore({
  addressCount,
  transactionCount,
  usesFreshAddresses,
}: PrivacyScoreProps) {
  // Each protection contributes to the score
  const factors: PrivacyFactor[] = [
    {
      id: "fresh",
      label: "Fresh Addresses",
      description: "A new address is derived per transaction, breaking on-chain links",
      weight: 40,
      active: usesFreshAddresses && addressCount > 1,
      Icon: MapPin,
    },
    {
      id: "rpc",
      label: "RPC Rotation",
      description: "Requests rotate across multiple nodes so none sees all activity",
      weight: 25,
      active: true,
      Icon: Network,
    },
    {
      id: "encryption",
      label: "Encrypted Storage",
      description: "Your seed phrase is encrypted locally and never leaves the browser",
      weight: 25,
      active: true,
      Icon: Lock,
    },
    {
      id: "clientside",
      label: "Client-Side Signing",
      description: "Transactions are signed in your browser, keys never sent to a server",
      weight: 10,
      active: true,
      Icon: ShieldCheck,
    },
  ];

  const score = factors.reduce((sum, f) => sum + (f.active ? f.weight : 0), 0);

  const scoreColor =
    score >= 90 ? "text-teal-400" : score >= 70 ? "text-amber-400" : "text-red-400";
  const ringColor =
    score >= 90 ? "stroke-teal-400" : score >= 70 ? "stroke-amber-400" : "stroke-red-400";

  // Circle progress math
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <ShieldCheck className="w-5 h-5 text-teal-400" />
        <h3 className="text-lg font-bold text-white">Privacy Score</h3>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-8">
        {/* Circular gauge */}
        <div className="relative flex-shrink-0">
          <svg width="130" height="130" className="-rotate-90">
            <circle
              cx="65"
              cy="65"
              r={radius}
              fill="none"
              strokeWidth="10"
              className="stroke-slate-700"
            />
            <circle
              cx="65"
              cy="65"
              r={radius}
              fill="none"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className={`${ringColor} transition-all duration-700`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl font-bold ${scoreColor}`}>{score}%</span>
            <span className="text-xs text-slate-500">protected</span>
          </div>
        </div>

        {/* Factor breakdown */}
        <div className="flex-1 w-full space-y-3">
          {factors.map((factor) => (
            <div key={factor.id} className="flex items-start gap-3">
              <div
                className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                  factor.active
                    ? "bg-teal-500/20 text-teal-400"
                    : "bg-slate-700 text-slate-500"
                }`}
              >
                {factor.active ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <Minus className="w-3 h-3" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p
                    className={`text-sm font-semibold ${
                      factor.active ? "text-white" : "text-slate-500"
                    }`}
                  >
                    {factor.label}
                  </p>
                  <span className="text-xs text-slate-500">+{factor.weight}%</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{factor.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}