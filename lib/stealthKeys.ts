/**
 * Persistence for the user's stealth keys (spending + viewing) and meta-address.
 *
 * Educational note: for simplicity these are stored as-is in localStorage. In a
 * production wallet you would (a) derive them deterministically from the HD seed
 * so they're recoverable, and (b) encrypt them at rest with the user's password,
 * exactly like the main seed phrase. Wiring HD derivation is a clean follow-up.
 */

import { generateStealthKeys, StealthKeys } from "./stealth";

const STORAGE_KEY = "stealth_keys";

/** Load existing stealth keys, or generate + persist a fresh set on first use. */
export function getOrCreateStealthKeys(): StealthKeys {
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing) return JSON.parse(existing);
  } catch {}
  const keys = generateStealthKeys();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
  return keys;
}

/** Returns keys if they exist, else null (without creating). */
export function getStealthKeys(): StealthKeys | null {
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    return existing ? JSON.parse(existing) : null;
  } catch {
    return null;
  }
}

export function clearStealthKeys(): void {
  localStorage.removeItem(STORAGE_KEY);
}