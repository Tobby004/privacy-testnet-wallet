"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { NetworkId, NETWORKS } from "@/lib/networks";
import { getStealthKeys } from "@/lib/stealthKeys";
import { getAnnouncements, Announcement } from "@/lib/stealthAnnouncer";
import { checkAnnouncement, deriveStealthPrivateKey } from "@/lib/stealth";
import { StealthKeys } from "@/lib/stealth";
import { useToast } from "./Toast";
import { Radar, Loader2, ArrowUpRight, ExternalLink, Info, Inbox } from "lucide-react";

interface StealthScanTabProps {
  network: NetworkId;
}

interface FoundPayment {
  stealthAddress: string;
  ephemeralPublicKey: string;
  amount?: string;
  txHash?: string;
  balance: string; // live on-chain balance
}

export function StealthScanTab({ network }: StealthScanTabProps) {
  const [keys, setKeys] = useState<StealthKeys | null>(null);
  const [scanning, setScanning] = useState(false);
  const [found, setFound] = useState<FoundPayment[]>([]);
  const [scanned, setScanned] = useState(false);
  const [sweepTo, setSweepTo] = useState("");
  const [sweepingIndex, setSweepingIndex] = useState<number | null>(null);
  const { showToast } = useToast();

  const networkConfig = NETWORKS[network];

  useEffect(() => {
    setKeys(getStealthKeys());
  }, []);

  const handleScan = async () => {
    if (!keys) {
      showToast("No stealth keys found — visit My Address first", "error");
      return;
    }
    setScanning(true);
    setScanned(false);
    setFound([]);

    try {
      const announcements: Announcement[] = getAnnouncements(network);
      const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrls[0]);
      const mine: FoundPayment[] = [];

      for (const a of announcements) {
        // view-tag fast path + full check
        const detected = checkAnnouncement(
          keys.spendingPublicKey,
          keys.viewingPrivateKey,
          a.ephemeralPublicKey,
          a.viewTag
        );
        if (detected && detected.toLowerCase() === a.stealthAddress.toLowerCase()) {
          // fetch live balance
          let balance = "0";
          try {
            const bal = await provider.getBalance(a.stealthAddress);
            balance = ethers.formatEther(bal);
          } catch {}
          mine.push({
            stealthAddress: a.stealthAddress,
            ephemeralPublicKey: a.ephemeralPublicKey,
            amount: a.amount,
            txHash: a.txHash,
            balance,
          });
        }
      }

      setFound(mine);
      setScanned(true);
      showToast(`Scan complete — ${mine.length} payment(s) found`, mine.length ? "success" : "info");
    } catch (err: any) {
      showToast("Scan failed", "error");
    } finally {
      setScanning(false);
    }
  };

  const handleSweep = async (payment: FoundPayment, index: number) => {
    if (!keys) return;
    if (!sweepTo || !ethers.isAddress(sweepTo)) {
      showToast("Enter a valid destination address", "error");
      return;
    }
    setSweepingIndex(index);

    try {
      // derive the private key controlling this stealth address
      const stealthPriv = deriveStealthPrivateKey(
        keys.spendingPrivateKey,
        keys.viewingPrivateKey,
        payment.ephemeralPublicKey
      );

      const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrls[0]);
      const signer = new ethers.Wallet(stealthPriv, provider);

      // sanity: the derived key must control this address
      if (signer.address.toLowerCase() !== payment.stealthAddress.toLowerCase()) {
        throw new Error("Derived key does not match stealth address");
      }

      // compute amount to sweep = balance - gas
      const balanceWei = await provider.getBalance(payment.stealthAddress);
      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice ?? ethers.parseUnits("2", "gwei");
      const gasLimit = BigInt(21000);
      const gasCost = gasPrice * gasLimit;

      if (balanceWei <= gasCost) {
        throw new Error("Balance too low to cover gas");
      }

      const sendValue = balanceWei - gasCost;

      const tx = await signer.sendTransaction({
        to: sweepTo,
        value: sendValue,
        gasLimit,
        gasPrice,
      });

      showToast("Sweep transaction sent", "success");
      await tx.wait();
      showToast("Funds swept successfully", "success");

      // refresh
      handleScan();
    } catch (err: any) {
      const msg = err?.shortMessage || err?.reason || err?.message || "Sweep failed";
      showToast(msg, "error");
    } finally {
      setSweepingIndex(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4 flex gap-3">
        <Info className="w-5 h-5 text-blue-300 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-200">
          Scanning checks every announcement with your viewing key to find payments meant for you.
          For each match, you can derive its private key and sweep the funds to any address.
        </p>
      </div>

      <button
        onClick={handleScan}
        disabled={scanning}
        className="w-full flex items-center justify-center gap-2 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold rounded-lg"
      >
        {scanning ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Scanning…</>
        ) : (
          <><Radar className="w-4 h-4" /> Scan for Incoming Payments</>
        )}
      </button>

      {/* Destination for sweeps */}
      <div>
        <label className="block text-sm font-semibold text-slate-300 mb-2">
          Sweep destination (where to move found funds)
        </label>
        <input
          type="text"
          value={sweepTo}
          onChange={(e) => setSweepTo(e.target.value)}
          placeholder="0x… (e.g. one of your normal addresses)"
          className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500 outline-none text-sm font-mono"
        />
      </div>

      {/* Results */}
      {scanned && found.length === 0 && (
        <div className="text-center py-8">
          <Inbox className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No stealth payments found for your keys.</p>
        </div>
      )}

      {found.map((p, i) => (
        <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-green-300">Stealth payment</p>
            <p className="text-lg font-mono font-bold text-orange-400">
              {parseFloat(p.balance).toFixed(4)} ETH
            </p>
          </div>
          <p className="text-xs text-slate-400 mb-1">Stealth address</p>
          <p className="text-xs font-mono text-slate-300 break-all mb-3">{p.stealthAddress}</p>

          {p.txHash && (
            <a
              href={`${networkConfig.explorerUrl}/tx/${p.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-300 hover:text-blue-200 underline mb-3"
            >
              <ExternalLink className="w-3 h-3" /> funding tx
            </a>
          )}

          <button
            onClick={() => handleSweep(p, i)}
            disabled={sweepingIndex === i || parseFloat(p.balance) === 0}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold rounded-lg text-sm"
          >
            {sweepingIndex === i ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Sweeping…</>
            ) : (
              <><ArrowUpRight className="w-4 h-4" /> Sweep Funds</>
            )}
          </button>
        </div>
      ))}
    </div>
  );
}