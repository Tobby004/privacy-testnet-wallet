"use client";

import { useState, useEffect, useMemo } from "react";
import { PrivacyWallet } from "@/lib/hdWallet";
import { NetworkId } from "@/lib/networks";
import { getAnnouncements } from "@/lib/stealthAnnouncer";
import { Network, Eye, EyeOff, Info, RefreshCw } from "lucide-react";

interface TransactionGraphProps {
  wallet: PrivacyWallet;
  network: NetworkId;
}

const ADDRESS_COUNT = 3;

type NodeKind = "own" | "stealth" | "external";

interface GNode {
  id: string;        // lowercased address
  label: string;     // shortened
  kind: NodeKind;
  x: number;
  y: number;
}

interface GEdge {
  from: string;
  to: string;
  kind: "normal" | "stealth-funding" | "stealth-sweep";
  value: string;
}

const short = (a: string) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "");

export function TransactionGraph({ wallet, network }: TransactionGraphProps) {
  const [showStealthLinks, setShowStealthLinks] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // gather local data
  const { nodes, edges } = useMemo(() => {
    const ownAddrs: string[] = [];
    for (let i = 0; i < ADDRESS_COUNT; i++) {
      try {
        const obj = wallet.getDerivedAddress(i);
        ownAddrs.push((typeof obj === "string" ? obj : obj.address || "").toLowerCase());
      } catch {}
    }
    const ownSet = new Set(ownAddrs);

    let txHistory: any[] = [];
    try {
      txHistory = JSON.parse(localStorage.getItem("tx_history") || "[]");
    } catch {}
    const announcements = getAnnouncements();
    const stealthSet = new Set(announcements.map((a) => a.stealthAddress.toLowerCase()));

    // build node set
    const nodeMap = new Map<string, GNode>();
    const kindOf = (addr: string): NodeKind => {
      const a = addr.toLowerCase();
      if (ownSet.has(a)) return "own";
      if (stealthSet.has(a)) return "stealth";
      return "external";
    };
    const ensureNode = (addr: string) => {
      const id = addr.toLowerCase();
      if (!id) return;
      if (!nodeMap.has(id)) {
        nodeMap.set(id, { id, label: short(addr), kind: kindOf(addr), x: 0, y: 0 });
      }
    };

    const edges: GEdge[] = [];
    for (const tx of txHistory) {
      if (!tx.from || !tx.to) continue;
      ensureNode(tx.from);
      ensureNode(tx.to);
      const kind: GEdge["kind"] =
        tx.kind === "stealth-funding"
          ? "stealth-funding"
          : tx.kind === "stealth-sweep"
          ? "stealth-sweep"
          : "normal";
      edges.push({ from: tx.from.toLowerCase(), to: tx.to.toLowerCase(), kind, value: tx.value || "" });
    }
    // ensure own addresses always show even with no tx
    ownAddrs.forEach((a) => ensureNode(a));

    // simple circular layout, grouped by kind
    const nodes = [...nodeMap.values()];
    const W = 640, H = 420, cx = W / 2, cy = H / 2;
    const groups: Record<NodeKind, GNode[]> = { own: [], stealth: [], external: [] };
    nodes.forEach((n) => groups[n.kind].push(n));

    // own in center column, stealth on a ring, external on outer ring
    groups.own.forEach((n, i) => {
      const total = groups.own.length;
      n.x = cx;
      n.y = total === 1 ? cy : cy - 80 + (160 / Math.max(1, total - 1)) * i;
    });
    const placeRing = (arr: GNode[], radius: number, phase = 0) => {
      arr.forEach((n, i) => {
        const ang = phase + (2 * Math.PI * i) / Math.max(1, arr.length);
        n.x = cx + radius * Math.cos(ang);
        n.y = cy + radius * Math.sin(ang);
      });
    };
    placeRing(groups.stealth, 130, -Math.PI / 2);
    placeRing(groups.external, 210, Math.PI / 6);

    return { nodes, edges };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet, refreshKey]);

  const nodeById = useMemo(() => {
    const m = new Map<string, GNode>();
    nodes.forEach((n) => m.set(n.id, n));
    return m;
  }, [nodes]);

  // edges to render: hide stealth edges when toggle is off
  const visibleEdges = edges.filter((e) =>
    showStealthLinks ? true : e.kind === "normal"
  );

  const colorFor = (kind: NodeKind) =>
    kind === "own" ? "#a78bfa" : kind === "stealth" ? "#34d399" : "#64748b";

  const edgeColor = (k: GEdge["kind"]) =>
    k === "stealth-funding" ? "#f59e0b" : k === "stealth-sweep" ? "#ef4444" : "#475569";

  const hasData = edges.length > 0;

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Transaction Graph</h2>
          <p className="text-slate-400 text-sm">
            See how your addresses connect — and how stealth links can re-expose them.
          </p>
        </div>
        <button
          onClick={() => setRefreshKey((k) => k + 1)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Toggle — the signature interaction */}
      <button
        onClick={() => setShowStealthLinks((v) => !v)}
        className={`mb-4 flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition border ${
          showStealthLinks
            ? "bg-amber-500/15 text-amber-300 border-amber-500/40"
            : "bg-slate-800 text-slate-300 border-slate-700"
        }`}
      >
        {showStealthLinks ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        {showStealthLinks ? "Showing stealth links" : "Stealth links hidden"}
      </button>

      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700 rounded-xl p-4">
        {!hasData ? (
          <div className="text-center py-16">
            <Network className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">
              No transactions yet. Send or receive to build your graph.
            </p>
          </div>
        ) : (
          <svg viewBox="0 0 640 420" className="w-full h-auto">
            {/* edges */}
            {visibleEdges.map((e, i) => {
              const a = nodeById.get(e.from);
              const b = nodeById.get(e.to);
              if (!a || !b) return null;
              return (
                <g key={i}>
                  <line
                    x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                    stroke={edgeColor(e.kind)}
                    strokeWidth={e.kind === "normal" ? 1.5 : 2}
                    strokeDasharray={e.kind === "normal" ? "0" : "5 4"}
                    opacity={0.7}
                  />
                </g>
              );
            })}
            {/* nodes */}
            {nodes.map((n) => (
              <g key={n.id}>
                <circle cx={n.x} cy={n.y} r={n.kind === "own" ? 14 : 10}
                  fill={colorFor(n.kind)} opacity={0.9} />
                <text x={n.x} y={n.y + (n.kind === "own" ? 28 : 24)}
                  textAnchor="middle" fontSize="9" fill="#94a3b8"
                  fontFamily="monospace">
                  {n.label}
                </text>
              </g>
            ))}
          </svg>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-slate-700/50 text-xs">
          <LegendDot color="#a78bfa" label="Your address" />
          <LegendDot color="#34d399" label="Stealth address" />
          <LegendDot color="#64748b" label="External" />
          <LegendLine color="#f59e0b" label="Stealth funding" />
          <LegendLine color="#ef4444" label="Stealth sweep" />
        </div>
      </div>

      {/* Explainer */}
      <div className="mt-4 bg-blue-900/20 border border-blue-600/30 rounded-lg p-4 flex gap-3">
        <Info className="w-5 h-5 text-blue-300 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-200">
          Toggle stealth links off to see the network as an outsider would — stealth addresses
          float free, unlinked to you. Toggle them on to reveal the connections <em>your own</em>{" "}
          funding and sweeping create. Dashed amber/red edges are where you linked a stealth
          address back to yourself.
        </p>
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-3 h-3 rounded-full" style={{ background: color }} />
      <span className="text-slate-400">{label}</span>
    </div>
  );
}

function LegendLine({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-4 h-0.5" style={{ background: color }} />
      <span className="text-slate-400">{label}</span>
    </div>
  );
}