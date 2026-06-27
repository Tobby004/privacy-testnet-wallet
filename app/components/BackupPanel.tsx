"use client";

import { useState, useRef } from "react";
import { downloadBackup, importBackup } from "@/lib/walletBackup";
import { useToast } from "./Toast";
import { Download, Upload, ShieldCheck, AlertTriangle, Loader2 } from "lucide-react";

export function BackupPanel() {
  const [exportPassword, setExportPassword] = useState("");
  const [importPassword, setImportPassword] = useState("");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [busy, setBusy] = useState<"export" | "import" | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const handleExport = async () => {
    if (!exportPassword) {
      showToast("Enter a password to encrypt the backup", "error");
      return;
    }
    setBusy("export");
    try {
      await downloadBackup(exportPassword);
      showToast("Encrypted backup downloaded", "success");
      setExportPassword("");
    } catch (err: any) {
      showToast(err.message || "Export failed", "error");
    } finally {
      setBusy(null);
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      showToast("Choose a backup file first", "error");
      return;
    }
    if (!importPassword) {
      showToast("Enter the backup password", "error");
      return;
    }
    setBusy("import");
    try {
      const contents = await importFile.text();
      const restored = await importBackup(contents, importPassword);
      showToast(`Restored ${restored.length} item(s). Reloading…`, "success");
      setImportPassword("");
      setImportFile(null);
      // reload so the app picks up the restored wallet
      setTimeout(() => window.location.reload(), 1200);
    } catch (err: any) {
      showToast(err.message || "Import failed", "error");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Export */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-5">
        <div className="flex items-center gap-2 mb-3">
          <Download className="w-5 h-5 text-purple-300" />
          <h3 className="text-base font-semibold text-white">Export encrypted backup</h3>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Downloads an encrypted file containing your wallet, stealth keys, and history.
          The file is protected by the password you set here — store both safely.
        </p>
        <input
          type="password"
          value={exportPassword}
          onChange={(e) => setExportPassword(e.target.value)}
          placeholder="Backup password"
          className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500 outline-none mb-3"
        />
        <button
          onClick={handleExport}
          disabled={busy === "export"}
          className="w-full flex items-center justify-center gap-2 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold rounded-lg"
        >
          {busy === "export" ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Encrypting…</>
          ) : (
            <><Download className="w-4 h-4" /> Download Backup</>
          )}
        </button>
      </div>

      {/* Import */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-5">
        <div className="flex items-center gap-2 mb-3">
          <Upload className="w-5 h-5 text-purple-300" />
          <h3 className="text-base font-semibold text-white">Restore from backup</h3>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Load a previously exported backup file and enter its password to restore.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={(e) => setImportFile(e.target.files?.[0] || null)}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full mb-3 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 rounded-lg text-sm"
        >
          {importFile ? `Selected: ${importFile.name}` : "Choose backup file"}
        </button>

        <input
          type="password"
          value={importPassword}
          onChange={(e) => setImportPassword(e.target.value)}
          placeholder="Backup password"
          className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500 outline-none mb-3"
        />

        <div className="bg-amber-900/20 border border-amber-600/30 rounded-lg p-3 mb-3 flex gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-300 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-200">
            Restoring overwrites the current wallet data in this browser. Export a backup first
            if you have unsaved funds.
          </p>
        </div>

        <button
          onClick={handleImport}
          disabled={busy === "import"}
          className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold rounded-lg"
        >
          {busy === "import" ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Restoring…</>
          ) : (
            <><Upload className="w-4 h-4" /> Restore Backup</>
          )}
        </button>
      </div>

      {/* Security note */}
      <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4 flex gap-3">
        <ShieldCheck className="w-5 h-5 text-blue-300 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-200">
          The backup is encrypted with PBKDF2 + XSalsa20-Poly1305. Without the password the file
          can't be read. This is a testnet educational wallet — never store real-value seeds here.
        </p>
      </div>
    </div>
  );
}