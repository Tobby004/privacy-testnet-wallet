import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "./components/Toast";

export const metadata: Metadata = {
  title: "Privacy Wallet",
  description: "Secure, privacy-preserving wallet for testnet transactions",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}