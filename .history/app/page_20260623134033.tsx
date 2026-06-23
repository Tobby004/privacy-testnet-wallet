"use client";

import { useState } from "react";
import { PrivacyWallet } from "@/lib/hdWallet";
import { NetworkId } from "@/lib/networks";
import { ImportWallet } from "./components/ImportWallet";
import { WalletLayout } from "./components/WalletLayout";
import { OverviewPage } from "./components/OverviewPage";
import { AddressesPage } from "./components/AddressesPage";
import { SendPage } from "./components/SendPage";
import { HistoryPage } from "./components/HistoryPage";
import { SettingsPage } from "./components/SettingsPage";

type PageView = "import" | "overview" | "addresses" | "send" | "history" | "settings";

export default function Home() {
  const [currentPage, setCurrentPage] = useState<PageView>("import");
  const [wallet, setWallet] = useState<PrivacyWallet | null>(null);
  const [network, setNetwork] = useState<NetworkId>("sepolia");
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);

  const handleWalletCreated = (newWallet: PrivacyWallet) => {
    setWallet(newWallet);
    setCurrentPage("overview");
  };

  const handleLock = () => {
    setWallet(null);
    setCurrentPage("import");
  };

  if (!wallet) {
    return <ImportWallet onWalletCreated={handleWalletCreated} />;
  }

  return (
    <WalletLayout
      wallet={wallet}
      network={network}
      currentPage={currentPage}
      onPageChange={(page: string) => setCurrentPage(page as PageView)}
      onLock={handleLock}
      onNetworkChange={setNetwork}
    >
      {currentPage === "overview" && (
        <OverviewPage wallet={wallet} network={network} />
      )}
      {currentPage === "addresses" && (
        <AddressesPage
          wallet={wallet}
          onSelectAddress={setSelectedAddressIndex}
          selectedIndex={selectedAddressIndex}
        />
      )}
      {currentPage === "send" && (
        <SendPage
          wallet={wallet}
          network={network}
          selectedAddressIndex={selectedAddressIndex}
        />
      )}
      {currentPage === "history" && <HistoryPage network={network} />}
      {currentPage === "settings" && (
        <SettingsPage network={network} onLock={handleLock} />
      )}
    </WalletLayout>
  );
}