"use client";

import { useState } from "react";

interface TutorialModalProps {
  onComplete: () => void;
}

export function TutorialModal({ onComplete }: TutorialModalProps) {
  const [step, setStep] = useState(1);

  const steps = [
    {
      title: "Welcome to Privacy Wallet",
      description: "A testnet wallet that protects your privacy with fresh addresses, MEV protection, and encrypted key storage.",
      icon: "🔒",
      content: (
        <div className="space-y-4">
          <p className="text-white">This wallet is designed to keep your transactions private on testnet.</p>
          <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4">
            <p className="text-sm font-semibold text-blue-300 mb-2">What you'll learn:</p>
            <ul className="text-sm text-blue-200 space-y-1">
              <li>✓ How to generate/import a wallet</li>
              <li>✓ How to send private transactions</li>
              <li>✓ Why fresh addresses matter</li>
              <li>✓ How to track your transactions</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      title: "Your Fresh Addresses",
      description: "Each transaction uses a new address to avoid on-chain linking.",
      icon: "📍",
      content: (
        <div className="space-y-4">
          <p className="text-white">Look at the addresses section below:</p>
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <p className="text-sm text-slate-300 mb-2">You have 3 fresh addresses:</p>
            <div className="space-y-2">
              <div className="text-xs font-mono text-blue-300 bg-slate-900/50 p-2 rounded">Address #0: 0x1234...abcd</div>
              <div className="text-xs font-mono text-blue-300 bg-slate-900/50 p-2 rounded">Address #1: 0x5678...efgh</div>
              <div className="text-xs font-mono text-blue-300 bg-slate-900/50 p-2 rounded">Address #2: 0x9abc...ijkl</div>
            </div>
          </div>
          <p className="text-sm text-slate-400">
            Each one is ready to use. When you send a transaction, it comes from the address you choose.
          </p>
        </div>
      ),
    },
    {
      title: "Get Testnet ETH",
      description: "Your addresses start with 0 ETH. Use the faucet to get test funds.",
      icon: "💰",
      content: (
        <div className="space-y-4">
          <p className="text-white">To test transactions, you need testnet ETH:</p>
          <ol className="text-sm text-slate-300 space-y-2 ml-4 list-decimal">
            <li>Copy one of your addresses (click "Copy")</li>
            <li>Click the "Get Testnet ETH" button below</li>
            <li>Paste your address on the faucet site</li>
            <li>Wait 30 seconds for ETH to arrive</li>
          </ol>
          <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4 mt-4">
            <p className="text-xs text-yellow-200">
              💡 Tip: The faucet might require you to verify you're human or complete a task. Follow the prompts.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Send a Private Transaction",
      description: "Your transactions are sent through MEV-Blocker, hidden from bots.",
      icon: "📤",
      content: (
        <div className="space-y-4">
          <p className="text-white">Once you have ETH, try sending a transaction:</p>
          <ol className="text-sm text-slate-300 space-y-2 ml-4 list-decimal">
            <li>Click "Send Transaction" button</li>
            <li>Choose which address to send from</li>
            <li>Enter recipient address (can be your own!)</li>
            <li>Enter amount (try 0.001 ETH)</li>
            <li>Review and sign</li>
            <li>Transaction sent via MEV-Blocker (hidden!)</li>
          </ol>
          <div className="bg-green-900/20 border border-green-600/30 rounded-lg p-4 mt-4">
            <p className="text-xs text-green-200">
              ✓ Your transaction won't appear in the public mempool. It's protected from sandwich bots!
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Track Your Transactions",
      description: "View all your sends in the transaction history.",
      icon: "📊",
      content: (
        <div className="space-y-4">
          <p className="text-white">Every transaction is saved locally:</p>
          <ul className="text-sm text-slate-300 space-y-2 ml-4 list-disc">
            <li>Click "View History" to see all sends</li>
            <li>See transaction status (pending, confirmed, failed)</li>
            <li>Click "View on Etherscan" to see on-chain details</li>
            <li>All data stored encrypted on your device</li>
          </ul>
          <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4 mt-4">
            <p className="text-xs text-blue-200">
              🔒 Your transaction history is never sent to servers. It stays on your device, encrypted.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Privacy Features Explained",
      description: "Why this wallet keeps you private.",
      icon: "🛡️",
      content: (
        <div className="space-y-3">
          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
            <p className="text-sm font-semibold text-white mb-2">1. Fresh Addresses</p>
            <p className="text-xs text-slate-300">Each transaction uses a new address. Observers can't link your transfers together.</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
            <p className="text-sm font-semibold text-white mb-2">2. MEV-Blocker</p>
            <p className="text-xs text-slate-300">Transactions sent through private relay. Hidden from mempool. Bots can't sandwich you.</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
            <p className="text-sm font-semibold text-white mb-2">3. RPC Rotation</p>
            <p className="text-xs text-slate-300">Each RPC call hits a different endpoint. No single server knows all your activity.</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
            <p className="text-sm font-semibold text-white mb-2">4. Encrypted Storage</p>
            <p className="text-xs text-slate-300">Your seed phrase is encrypted with your password before storing locally.</p>
          </div>
        </div>
      ),
    },
    {
      title: "You're Ready!",
      description: "Now go send some test transactions.",
      icon: "🚀",
      content: (
        <div className="space-y-4">
          <p className="text-white text-center text-lg font-semibold">You're all set!</p>
          <div className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 border border-green-600/30 rounded-lg p-6 text-center">
            <p className="text-sm text-green-200 mb-4">
              Your private wallet is ready to use. Your keys are encrypted. Your transactions are hidden.
            </p>
            <p className="text-xs text-green-300 font-semibold">
              ✓ Fresh addresses ✓ MEV protected ✓ RPC rotated ✓ Encrypted
            </p>
          </div>
          <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4">
            <p className="text-xs text-blue-200">
              <span className="font-semibold">Remember:</span> This is testnet only. Never use mainnet funds. For learning purposes only.
            </p>
          </div>
        </div>
      ),
    },
  ];

  const currentStep = steps[step - 1];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-lg max-w-2xl w-full p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="text-4xl">{currentStep.icon}</div>
          <div>
            <h2 className="text-2xl font-bold text-white">{currentStep.title}</h2>
            <p className="text-sm text-slate-400 mt-1">{currentStep.description}</p>
          </div>
        </div>

        {/* Content */}
        <div className="mb-8 max-h-96 overflow-y-auto">
          {currentStep.content}
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex gap-1">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`h-1 flex-1 rounded-full transition-all ${
                  idx < step ? "bg-blue-500" : idx === step - 1 ? "bg-blue-400" : "bg-slate-700"
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-2">Step {step} of {steps.length}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-semibold rounded-lg transition"
          >
            ← Back
          </button>

          {step < steps.length ? (
            <button
              onClick={() => setStep(step + 1)}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={onComplete}
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition"
            >
              Get Started!
            </button>
          )}
        </div>

        {/* Skip Option */}
        <button
          onClick={onComplete}
          className="w-full mt-4 text-sm text-slate-400 hover:text-slate-300 transition"
        >
          Skip tutorial
        </button>
      </div>
    </div>
  );
}