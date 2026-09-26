import { getCardsForPack } from "@/lib/data";
import type { Card } from "@/lib/types";

const STORAGE_PREFIX = "playpointy:teaser:";
const TEASER_COUNT = 3;

function storageKey(packId: string): string {
  return `${STORAGE_PREFIX}${packId}`;
}

function cardsWithArt(packId: string): Card[] {
  return getCardsForPack(packId).filter((card) => Boolean(card.image));
}

function allowedIds(packId: string): Set<string> {
  return new Set(cardsWithArt(packId).map((card) => card.id));
}

function shuffleIds(ids: string[]): string[] {
  const next = [...ids];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = next[i];
    next[i] = next[j]!;
    next[j] = tmp!;
  }
  return next;
}

function readStoredIds(packId: string): string[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey(packId));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed.filter((id): id is string => typeof id === "string");
  } catch {
    return null;
  }
}

function writeStoredIds(packId: string, ids: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(packId), JSON.stringify(ids));
  } catch {
    // Private mode / quota — still show this visit's trio.
  }
}

function pickFreshIds(packId: string, count: number): string[] {
  return shuffleIds(cardsWithArt(packId).map((card) => card.id)).slice(0, count);
}

function resolveCards(packId: string, ids: string[]): Card[] {
  const byId = new Map(getCardsForPack(packId).map((card) => [card.id, card]));
  return ids
    .map((id) => byId.get(id))
    .filter((card): card is Card => Boolean(card?.image));
}

/** Valid pack cards only, max 3, order preserved. */
export function sanitizeTeaserCardIds(
  packId: string,
  raw: unknown,
): string[] | null {
  if (!Array.isArray(raw)) return null;
  const allowed = allowedIds(packId);
  const unique: string[] = [];
  for (const item of raw) {
    if (typeof item !== "string" || !allowed.has(item)) continue;
    if (unique.includes(item)) continue;
    unique.push(item);
    if (unique.length >= TEASER_COUNT) break;
  }
  return unique.length > 0 ? unique : null;
}

/** Same trio until this browser clears storage — checkout can match what they saw. */
export function getOrCreateTeaserCards(
  packId: string,
  count = TEASER_COUNT,
): Card[] {
  if (!packId) return [];
  const allowed = allowedIds(packId);
  const stored = readStoredIds(packId);
  const valid = stored?.filter((id) => allowed.has(id)).slice(0, count) ?? [];
  if (valid.length === count) {
    return resolveCards(packId, valid);
  }
  const ids = pickFreshIds(packId, count);
  writeStoredIds(packId, ids);
  return resolveCards(packId, ids);
}

export function formatTeaserCardIds(ids: string[]): string {
  return ids.join(",");
}
