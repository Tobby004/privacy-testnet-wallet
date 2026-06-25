"use client";

import { useState } from "react";
import { PrivacyWallet } from "@/lib/hdWallet";
import { NetworkId, NETWORKS } from "@/lib/networks";
import { useToast } from "./Toast";
import { Copy, Check, ExternalLink, ShieldCheck, Coins } from "lucide-react";

interface ReceivePageProps {
  wallet: PrivacyWallet;
  network: NetworkId;
  selectedAddressIndex?: number;
}

const ADDRESS_COUNT = 3;

export function ReceivePage({
  wallet,
  network,
  selectedAddressIndex = 0,
}: ReceivePageProps) {
  // Local state so the user can switch addresses here
  const [activeIndex, setActiveIndex] = useState(selectedAddressIndex);
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();
  const networkConfig = NETWORKS[network];

  // Build the list of derived addresses
  const addresses: string[] = [];
  for (let i = 0; i < ADDRESS_COUNT; i++) {
    try {
      const obj = wallet.getDerivedAddress(i);
      addresses.push(typeof obj === "string" ? obj : obj.address || "");
    } catch {
      addresses.push("");
    }
  }

  const address = addresses[activeIndex] || "";

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    showToast("Address copied to clipboard", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(address)}`;

  const shorten = (addr: string) =>
    addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "—";

  return (
    <div className="max-w-2xl">
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700 rounded-xl p-6 sm:p-8">
        <h2 className="text-2xl font-bold text-white mb-2">Receive ETH</h2>
        <p className="text-slate-400 text-sm mb-6">
          Pick an address to receive testnet ETH on {networkConfig.name}
        </p>

        {/* Address Switcher */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {addresses.map((addr, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`px-3 py-3 rounded-lg text-sm font-semibold transition ${
                activeIndex === i
                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700 border border-transparent"
              }`}
            >
              <div>Address #{i}</div>
              <div className="text-xs font-mono mt-1 opacity-70">{shorten(addr)}</div>
            </button>
          ))}
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center mb-6">
          <div className="bg-white p-4 rounded-xl mb-3">
            <img src={qrCodeUrl} alt="Wallet QR Code" className="w-56 h-56" />
          </div>
          <p className="text-xs text-slate-500">Scan to send ETH to this address</p>
        </div>

        {/* Address + copy */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 mb-6">
          <p className="text-xs text-slate-400 mb-2">Your Address (#{activeIndex})</p>
          <p className="text-sm font-mono text-slate-300 break-all mb-4">{address}</p>
          <button
            onClick={copyAddress}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition ${
              copied
                ? "bg-green-600 text-white"
                : "bg-purple-600 hover:bg-purple-700 text-white"
            }`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied!" : "Copy Address"}
          </button>
        </div>

        {/* Privacy Tip */}
        <div className="bg-purple-900/20 border border-purple-600/30 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-4 h-4 text-purple-300" />
            <p className="text-xs font-semibold text-purple-300">Privacy Tip</p>
          </div>
          <p className="text-xs text-purple-200">
            Hand out a different address to each sender so your incoming funds can't be linked together.
          </p>
        </div>

        {/* Explorer Link */}
        <a
          href={`${networkConfig.explorerUrl}/address/${address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg transition"
        >
          <ExternalLink className="w-4 h-4" /> View on Explorer
        </a>
      </div>

      {/* Faucet helper */}
      <div className="mt-8 bg-blue-900/20 border border-blue-600/30 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <Coins className="w-4 h-4 text-blue-300" />
          <p className="text-sm font-semibold text-blue-300">Need Testnet ETH?</p>
        </div>
        <a
          href={networkConfig.faucetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-sm text-blue-300 hover:text-blue-200 underline"
        >
          → {networkConfig.name} faucet
        </a>
      </div>
    </div>
  );
}