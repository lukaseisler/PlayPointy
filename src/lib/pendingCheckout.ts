import type { StoreReason } from "@/lib/storeTypes";

const STORAGE_KEY = "playpointy:pendingCheckout";
const RESUME_FLAG_KEY = "playpointy:resumeAfterAuth";
const TTL_MS = 30 * 60 * 1000;

export interface PendingCheckout {
  packId: string;
  reason: StoreReason;
  createdAt: number;
}

export function savePendingCheckout(packId: string, reason: StoreReason): void {
  if (typeof window === "undefined") return;
  const payload: PendingCheckout = { packId, reason, createdAt: Date.now() };
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

export function readPendingCheckout(): PendingCheckout | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingCheckout;
    if (!parsed.packId || !parsed.reason || !parsed.createdAt) return null;
    if (Date.now() - parsed.createdAt > TTL_MS) {
      clearPendingCheckout();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearPendingCheckout(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** Set before OAuth redirect / OTP verify so AuthProvider can toast after session is ready. */
export function markResumeAfterAuth(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(RESUME_FLAG_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function consumeResumeAfterAuth(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const marked = window.sessionStorage.getItem(RESUME_FLAG_KEY) === "1";
    if (marked) window.sessionStorage.removeItem(RESUME_FLAG_KEY);
    return marked;
  } catch {
    return false;
  }
}
