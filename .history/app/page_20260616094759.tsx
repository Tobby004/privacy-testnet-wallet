"use client";

import { useState } from "react";
import { PrivacyWallet } from "@/lib/hdWallet";
import { ImportWallet } from "./components/ImportWallet";
import { Dashboard } from "./components/Dashboard";

type View = "import" | "dashboard";

export default function Home() {
  const [view, setView] = useState<View>("import");
  const [wallet, setWallet] = useState<PrivacyWallet | null>(null);

  const handleImportSuccess = (newWallet: PrivacyWallet) => {
    setWallet(newWallet);
    setView("dashboard");
  };

  const handleLock = () => {
    setWallet(null);
    setView("import");
  };

  return (
    <>
      {view === "import" && <ImportWallet onSuccess={handleImportSuccess} />}
      {view === "dashboard" && wallet && (
        <Dashboard wallet={wallet} onLock={handleLock} />
      )}
    </>
  );
}