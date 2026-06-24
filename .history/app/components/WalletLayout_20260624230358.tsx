"use client";

import { useState } from "react";
import { PrivacyWallet } from "@/lib/hdWallet";
import { NetworkId } from "@/lib/networks";
import {
  LayoutDashboard,
  MapPin,
  ArrowUpRight,
  ArrowDownLeft,
  ScrollText,
  Settings as SettingsIcon,
  Lock,
  Globe,
  Menu,
  X,
} from "lucide-react";

interface LayoutProps {
  wallet: PrivacyWallet;
  network: NetworkId;
  onNetworkChange: (network: NetworkId) => void;
  onLock: () => void;
  currentPage: string;
  onPageChange: (page: string) => void;
  children: React.ReactNode;
}

const navItems = [
  { id: "overview", label: "Overview", Icon: LayoutDashboard },
  { id: "addresses", label: "Addresses", Icon: MapPin },
  { id: "send", label: "Send", Icon: ArrowUpRight },
  { id: "receive", label: "Receive", Icon: ArrowDownLeft },
  { id: "history", label: "History", Icon: ScrollText },
  { id: "settings", label: "Settings", Icon: SettingsIcon },
];

const networks = [
  { id: "sepolia", name: "Sepolia", color: "from-orange-500 to-yellow-500" },
  { id: "baseSepolia", name: "Base", color: "from-blue-500 to-indigo-500" },
  { id: "arbitrumSepolia", name: "Arbitrum", color: "from-cyan-500 to-blue-500" },
  { id: "polygonAmoy", name: "Polygon", color: "from-purple-500 to-violet-500" },
];
const pageTitles: Record<string, string> = {
  overview: "Overview",
  addresses: "Addresses",
  send: "Send Transaction",
  receive: "Receive",
  history: "Transaction History",
  settings: "Settings",
};

export function WalletLayout({
  wallet,
  network,
  onNetworkChange,
  onLock,
  currentPage,
  onPageChange,
  children,
}: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavClick = (page: string) => {
    onPageChange(page);
    setMobileOpen(false); // close drawer after selecting on mobile
  };

  // Sidebar content shared between desktop and mobile
  const SidebarContent = () => (
    <div className="h-full p-6 flex flex-col overflow-y-auto">
      {/* Logo */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center font-bold text-white">
            A
          </div>
          <div>
            <p className="font-bold text-white text-lg">AnonWallet</p>
            <p className="text-xs text-purple-400 font-semibold">testnet</p>
          </div>
        </div>
        {/* Close button - mobile only */}
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden text-slate-400 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="space-y-2 flex-1 mb-8">
        {navItems.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => handleNavClick(id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${
              currentPage === id
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                : "text-slate-400 hover:text-slate-300 hover:bg-slate-800/50"
            }`}
          >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {/* Network Selector */}
      <div className="mb-6 pb-6 border-t border-slate-800 pt-6">
        <p className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wider">Network</p>
        <div className="space-y-2">
          {networks.map((net) => (
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
        <Lock className="w-4 h-4" /> Lock Wallet
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden lg:flex fixed left-0 top-0 h-screen w-56 bg-gradient-to-b from-slate-900/80 to-slate-950/80 border-r border-slate-800 backdrop-blur-xl flex-col">
        <SidebarContent />
      </div>

      {/* Mobile Drawer - overlay + panel */}
      {mobileOpen && (
        <>
          {/* Dark overlay */}
          <div
            className="lg:hidden fixed inset-0 bg-black/60 z-40"
            onClick={() => setMobileOpen(false)}
          />
          {/* Sliding panel */}
          <div className="lg:hidden fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-slate-900 to-slate-950 border-r border-slate-800 z-50">
            <SidebarContent />
          </div>
        </>
      )}

      {/* Main Content - margin only on desktop */}
      <div className="lg:ml-56 min-h-screen">
        {/* Top Bar */}
        <div className="sticky top-0 z-30 border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Hamburger - mobile only */}
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden text-slate-300 hover:text-white"
              >
                <Menu className="w-6 h-6" />
              </button>
              <h1 className="text-xl lg:text-2xl font-bold text-white">
                {pageTitles[currentPage] || ""}
              </h1>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-sm text-slate-400">
              <Globe className="w-4 h-4" />
              {network === "sepolia" && "Sepolia Testnet"}
              {network === "goerli" && "Goerli Testnet"}
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-4 lg:p-8">{children}</div>
      </div>
    </div>
  );
}