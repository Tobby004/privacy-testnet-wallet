/**
 * Announcer mode: local (educational, free) vs on-chain (real ERC-5564).
 * Persisted so the choice survives refresh.
 */

export type AnnouncerMode = "local" | "onchain";

const STORAGE_KEY = "announcer_mode";

export function getAnnouncerMode(): AnnouncerMode {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "onchain" ? "onchain" : "local";
  } catch {
    return "local";
  }
}

export function setAnnouncerMode(mode: AnnouncerMode): void {
  localStorage.setItem(STORAGE_KEY, mode);
}