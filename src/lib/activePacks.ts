import { FREE_PACK_ID } from "./data";

const STORAGE_KEY = "playpointy:activePacks";

/** Liest gespeicherte aktive Pack-IDs; Fallback = Starter Chaos. */
export function readActivePackIds(): string[] {
  if (typeof window === "undefined") return [FREE_PACK_ID];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [FREE_PACK_ID];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) return [FREE_PACK_ID];
    const ids = parsed.filter((id): id is string => typeof id === "string");
    return ids.length > 0 ? ids : [FREE_PACK_ID];
  } catch {
    return [FREE_PACK_ID];
  }
}

export function writeActivePackIds(ids: string[]): void {
  if (typeof window === "undefined") return;
  const safe = ids.length > 0 ? ids : [FREE_PACK_ID];
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
  } catch {
    /* Quota / private mode – ignorieren */
  }
}
