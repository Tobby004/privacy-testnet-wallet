/**
 * Privacy Inspector — analyzes local wallet data and flags privacy leaks.
 *
 * Pure logic, no network calls. Takes snapshots of local data (tx history,
 * stealth announcements, addresses) and returns findings with severity,
 * explanation, and a concrete suggestion.
 *
 * This turns the wallet's honest privacy framing into an interactive audit:
 * it tells the user *how their own behavior leaks privacy*, which is the
 * insight most wallets never surface.
 */

export type Severity = "good" | "info" | "warning" | "critical";

export interface Finding {
  id: string;
  severity: Severity;
  title: string;
  detail: string;       // plain-English explanation of the leak
  suggestion?: string;  // concrete fix
}

export interface TxRecord {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
  status: string;
  network: string;
}

export interface AnnouncementRecord {
  stealthAddress: string;
  ephemeralPublicKey: string;
  network: string;
  amount?: string;
  txHash?: string;
}

export interface InspectorInput {
  addresses: string[];          // the wallet's own derived addresses
  txHistory: TxRecord[];        // outgoing sends recorded by the app
  announcements: AnnouncementRecord[]; // stealth payments (local store)
}

export interface InspectorReport {
  score: number;        // 0-100
  findings: Finding[];
}

const lc = (s: string) => (s || "").toLowerCase();

/**
 * Run all privacy checks against the local data and return a scored report.
 */
export function runPrivacyInspector(input: InspectorInput): InspectorReport {
  const findings: Finding[] = [];
  const ownSet = new Set(input.addresses.map(lc));

  // --- Check 1: address reuse as a SENDER ---
  const fromCounts = new Map<string, number>();
  for (const tx of input.txHistory) {
    const f = lc(tx.from);
    fromCounts.set(f, (fromCounts.get(f) || 0) + 1);
  }
  const reusedSenders = [...fromCounts.entries()].filter(([, n]) => n >= 3);
  if (reusedSenders.length > 0) {
    findings.push({
      id: "sender-reuse",
      severity: "warning",
      title: "Address reused for multiple sends",
      detail: `One or more of your addresses has sent ${reusedSenders[0][1]}+ transactions. Reusing a sending address links all those transactions to a single identity on-chain.`,
      suggestion: "Rotate sending addresses, or use stealth payments for unlinkable transfers.",
    });
  } else if (input.txHistory.length > 0) {
    findings.push({
      id: "sender-reuse",
      severity: "good",
      title: "No heavy sender reuse",
      detail: "You haven't concentrated many sends on a single address.",
    });
  }

  // --- Check 2: consolidation (multiple own-addresses sending to the same destination) ---
  const destFromOwn = new Map<string, Set<string>>();
  for (const tx of input.txHistory) {
    if (ownSet.has(lc(tx.from))) {
      const d = lc(tx.to);
      if (!destFromOwn.has(d)) destFromOwn.set(d, new Set());
      destFromOwn.get(d)!.add(lc(tx.from));
    }
  }
  const consolidations = [...destFromOwn.entries()].filter(([, froms]) => froms.size >= 2);
  if (consolidations.length > 0) {
    findings.push({
      id: "consolidation",
      severity: "critical",
      title: "Funds consolidated from multiple addresses",
      detail: `You've sent from ${consolidations[0][1].size} different addresses to the same destination. This publicly links those addresses together — defeating the benefit of using separate addresses.`,
      suggestion: "Avoid merging funds from separate addresses into one destination. Keep address clusters separate.",
    });
  }

  // --- Check 3: stealth sweeps re-linking payments ---
  // If multiple stealth addresses were swept to the same destination (appears as
  // tx.from = stealthAddress, tx.to = sameDest)
  const stealthSet = new Set(input.announcements.map((a) => lc(a.stealthAddress)));
  const sweepDest = new Map<string, number>();
  for (const tx of input.txHistory) {
    if (stealthSet.has(lc(tx.from))) {
      const d = lc(tx.to);
      sweepDest.set(d, (sweepDest.get(d) || 0) + 1);
    }
  }
  const relinkingSweeps = [...sweepDest.entries()].filter(([, n]) => n >= 2);
  if (relinkingSweeps.length > 0) {
    findings.push({
      id: "stealth-sweep-relink",
      severity: "critical",
      title: "Stealth payments swept to one address",
      detail: `${relinkingSweeps[0][1]} stealth payments were swept to the same destination. This re-links payments that the stealth scheme had kept separate.`,
      suggestion: "Sweep different stealth payments to different addresses to preserve unlinkability.",
    });
  }

  // --- Check 4: self-funded stealth (funding address is one of your own) ---
  // If a stealth funding tx came from a known own-address, the sender link is trivial.
  const selfFunded = input.announcements.filter((a) => {
    if (!a.txHash) return false;
    const fundingTx = input.txHistory.find((t) => lc(t.hash) === lc(a.txHash!));
    return fundingTx && ownSet.has(lc(fundingTx.from));
  });
  if (selfFunded.length > 0) {
    findings.push({
      id: "self-funded-stealth",
      severity: "warning",
      title: "Stealth addresses funded from your own wallet",
      detail: `${selfFunded.length} stealth payment(s) were funded directly from your own address. Since the funding transaction is public, anyone can link your address to the stealth address.`,
      suggestion: "For real privacy, stealth addresses should be funded by an unrelated sender — not from your own known address.",
    });
  }

  // --- Check 5: stealth usage (positive signal) ---
  if (input.announcements.length > 0) {
    findings.push({
      id: "stealth-active",
      severity: "good",
      title: "Stealth payments in use",
      detail: `You've used ${input.announcements.length} stealth payment(s), which break the link between incoming funds and your identity.`,
    });
  } else {
    findings.push({
      id: "stealth-inactive",
      severity: "info",
      title: "No stealth payments yet",
      detail: "You haven't used stealth addresses. They provide real recipient-side unlinkability, unlike fresh HD addresses alone.",
      suggestion: "Try receiving via your stealth meta-address for stronger privacy.",
    });
  }

  // --- Scoring: start at 100, subtract per finding severity ---
  let score = 100;
  for (const f of findings) {
    if (f.severity === "critical") score -= 30;
    else if (f.severity === "warning") score -= 15;
    else if (f.severity === "info") score -= 5;
  }
  score = Math.max(0, Math.min(100, score));

  // order: critical -> warning -> info -> good
  const order: Record<Severity, number> = { critical: 0, warning: 1, info: 2, good: 3 };
  findings.sort((a, b) => order[a.severity] - order[b.severity]);

  return { score, findings };
}