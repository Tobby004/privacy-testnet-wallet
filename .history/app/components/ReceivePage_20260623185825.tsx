"use client";

import { useState } from "react";
import { PrivacyWallet } from "@/lib/hdWallet";
import { NetworkId, NETWORKS } from "@/lib/networks";

interface ReceivePageProps {
  wallet: PrivacyWallet;
  network: NetworkId;
  selectedAddressIndex?: number;
}

export function ReceivePage({
  wallet,
  network,
  selectedAddressIndex = 0,
}: ReceivePageProps) {
  const [copied, setCopied] = useState(false);
  const networkConfig = NETWORKS[network];

  // Get address
  let address = "";
  try {
    const addressObj = wallet.getDerivedAddress(selectedAddressIndex);
    address = typeof addressObj === "string" ? addressObj : addressObj.address || "";
  } catch (err) {
    address = "Error loading address";
  }

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate QR code URL using free API
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(address)}`;

  return (
    <div className="max-w-2xl">
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700 rounded-xl p-8">
        <h2 className="text-2xl font-bold text-white mb-2">Receive ETH</h2>
        <p className="text-slate-400 text-sm mb-8">
          Share your address to receive testnet ETH
        </p>

        {/* QR Code */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-white p-4 rounded-xl mb-4">
            <img
              src={qrCodeUrl}
              alt="Wallet QR Code"
              className="w-64 h-64"
            />
          </div>
          <p className="text-xs text-slate-500">Scan to send ETH to this address</p>
        </div>

        {/* Address */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 mb-6">
          <p className="text-xs text-slate-400 mb-2">Your Address (#{selectedAddressIndex})</p>
          <p className="text-sm font-mono text-slate-300 break-all mb-4">{address}</p>
          <button
            onClick={copyAddress}
            className={`w-full py-3 rounded-lg font-semibold transition ${
              copied
                ? "bg-green-600 text-white"
                : "bg-purple-600 hover:bg-purple-700 text-white"
            }`}
          >
            {copied ? "✓ Copied!" : "📋 Copy Address"}
          </button>
        </div>

        {/* Privacy Notice */}
        <div className="bg-purple-900/20 border border-purple-600/30 rounded-lg p-4 mb-6">
          <p className="text-xs font-semibold text-purple-300 mb-2">🔐 Privacy Tip</p>
          <p className="text-xs text-purple-200">
            For maximum privacy, use a different address for each transaction. Go to Addresses page to see all your addresses.
          </p>
        </div>

        {/* Explorer Link */}
        <a
          href={`${networkConfig.explorerUrl}/address/${address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center py-3 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg transition"
        >
          🔗 View on Explorer
        </a>
      </div>

      {/* Get Testnet ETH */}
      <div className="mt-8 bg-blue-900/20 border border-blue-600/30 rounded-xl p-6">
        <p className="text-sm font-semibold text-blue-300 mb-3">💰 Need Testnet ETH?</p>
        <p className="text-xs text-blue-200 mb-4">
          Get free testnet ETH from these faucets:
        </p>
        <div className="space-y-2">
          <a
            href="https://sepoliafaucet.com"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-sm text-blue-300 hover:text-blue-200 underline"
          >
            → Sepolia Faucet (sepoliafaucet.com)
          </a>
          <a
            href="https://faucets.chain.link/sepolia"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-sm text-blue-300 hover:text-blue-200 underline"
          >
            → Chainlink Faucet
          </a>
        </div>
      </div>
    </div>
  );
}