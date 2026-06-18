"use client";

import { useState } from "react";
import { PrivacyWallet } from "@/lib/hdWallet";
import { NetworkId, NETWORKS } from "@/lib/networks";
import { TransactionBuilder } from "./TransactionBuilder";

interface SendPageProps {
  wallet: PrivacyWallet;
  network: NetworkId;
  selectedAddressIndex?: number;
}

export function SendPage({ wallet, network, selectedAddressIndex = 0 }: SendPageProps) {
  const [showBuilder, setShowBuilder] = useState(true);
  const networkConfig = NETWORKS[network];

  return (
    <div className="max-w-2xl">
      {showBuilder && (
        <TransactionBuilder
          wallet={wallet}
          network={network}
          onClose={() => setShowBuilder(false)}
          isFullPage={true}
          defaultAddressIndex={selectedAddressIndex}
        />
      )}

      {!showBuilder && (
        <div className="text-center py-12">
          <p className="text-slate-400 mb-6">Transaction completed!</p>
          <button
            onClick={() => setShowBuilder(true)}
            className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition"
          >
            Send Another Transaction
          </button>
        </div>
      )}
    </div>
  );
}