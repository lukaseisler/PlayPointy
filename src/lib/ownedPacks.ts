import { FREE_PACK_ID, getPackById } from "./data";

/** Pack ist spielbar/toggelbar: Free oder in Entitlements. */
export function isOwnedPack(packId: string, unlockedPackIds: string[]): boolean {
  if (packId === FREE_PACK_ID) return true;
  return unlockedPackIds.includes(packId);
}

/** Nur bekannte, nicht-Free Pack-IDs behalten. */
export function sanitizeUnlockedPackIds(ids: string[]): string[] {
  const unique = [...new Set(ids)];
  return unique.filter((id) => id !== FREE_PACK_ID && Boolean(getPackById(id)));
}

export function mergeActiveWithOwned(
  currentActive: string[],
  unlockedPackIds: string[],
  mode: "add" | "allOwned",
  purchasedPackId?: string,
): string[] {
  const owned = new Set<string>([FREE_PACK_ID, ...sanitizeUnlockedPackIds(unlockedPackIds)]);
  if (mode === "allOwned") {
    return [...owned];
  }
  const next = new Set(currentActive.filter((id) => owned.has(id) || id === FREE_PACK_ID));
  if (purchasedPackId && owned.has(purchasedPackId)) {
    next.add(purchasedPackId);
  }
  if (next.size === 0) next.add(FREE_PACK_ID);
  return [...next];
}
