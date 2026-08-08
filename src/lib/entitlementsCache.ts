const PREFIX = "playpointy:unlocked:";

export interface EntitlementsCachePayload {
  userId: string;
  packIds: string[];
  fetchedAt: string;
}

function keyFor(userId: string) {
  return `${PREFIX}${userId}`;
}

export function readEntitlementsCache(userId: string): EntitlementsCachePayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(keyFor(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as EntitlementsCachePayload;
    if (parsed.userId !== userId || !Array.isArray(parsed.packIds)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeEntitlementsCache(userId: string, packIds: string[]): void {
  if (typeof window === "undefined") return;
  const payload: EntitlementsCachePayload = {
    userId,
    packIds,
    fetchedAt: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(keyFor(userId), JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

export function clearEntitlementsCache(userId?: string): void {
  if (typeof window === "undefined") return;
  try {
    if (userId) {
      window.localStorage.removeItem(keyFor(userId));
      return;
    }
    const toRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k?.startsWith(PREFIX)) toRemove.push(k);
    }
    toRemove.forEach((k) => window.localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}
