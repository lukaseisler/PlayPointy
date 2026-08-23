import cardsJson from "../../public/cards.json";
import packsJson from "../../public/packs.json";
import type { Card, Pack, PackSummary } from "./types";

const allCards = cardsJson as Card[];
const allPacks = packsJson as Pack[];

/** Das kostenlose Startpack. Wird sofort ohne Login gespielt. */
export const FREE_PACK_ID = "starter-chaos";

export function getAllCards(): Card[] {
  return allCards;
}

export function getAllPacks(): Pack[] {
  return allPacks;
}

export function getPackById(packId: string): Pack | undefined {
  return allPacks.find((p) => p.id === packId);
}

/** Liefert die Karten eines Packs in der Reihenfolge von packs.json (cardIds). */
export function getCardsForPack(packId: string): Card[] {
  const pack = getPackById(packId);
  if (!pack) return [];
  const byId = new Map(allCards.map((c) => [c.id, c]));
  return pack.cardIds
    .map((id) => byId.get(id))
    .filter((c): c is Card => Boolean(c));
}

/** Karte anhand Pack-Slug + 3-stelligem Share-Code (Share-URL). */
export function getCardByPackAndCode(packId: string, code: string): Card | undefined {
  return allCards.find((c) => c.packId === packId && c.shareCode === code);
}

/** Alle Karten der angegebenen Packs (Reihenfolge der Pack-IDs, dann cardIds). */
export function getCardsForPacks(packIds: string[]): Card[] {
  return packIds.flatMap((id) => getCardsForPack(id));
}

/**
 * Dedicated All Packs thumbnails (3:2 WebP in /public/store).
 * Accent matches the source card in the deck.
 */
const STORE_PREVIEWS: Record<string, { image: string; accentHex: string }> = {
  "starter-chaos": {
    image: "store/starter-chaos.webp",
    accentHex: "#e11d48",
  },
  "dark-evil": {
    image: "store/dark-evil.webp",
    accentHex: "#15803d",
  },
  "roast-friends": {
    image: "store/roast-friends.webp",
    accentHex: "#7c3aed",
  },
  "toxic-love": {
    image: "store/toxic-love.webp",
    accentHex: "#db2777",
  },
  "unhinged-nights": {
    image: "store/unhinged-nights.webp",
    accentHex: "#ff7200", // Puke in an Uber? — night-out orange, not navy
  },
};

/**
 * Baut die Pack-Liste für den Store: Name, Kartenanzahl, Akzentfarbe und
 * Vorschaubild. Dedicated store thumbs if present, else first card.
 */
export function getStorePacks(excludePackId?: string): PackSummary[] {
  return allPacks
    .filter((p) => p.id !== excludePackId)
    .map((p) => {
      const cards = getCardsForPack(p.id);
      const first = cards[0];
      const custom = STORE_PREVIEWS[p.id];
      return {
        id: p.id,
        name: p.name,
        cardCount: p.cardCount,
        accentHex: custom?.accentHex ?? first?.hex ?? "#171717",
        previewImage: custom?.image ?? first?.image ?? null,
      };
    });
}

/**
 * Score pack card backgrounds for store previews: prefer saturated, bright
 * colors; downrank muddy browns, dark navy, and grey.
 */
function vibrancyScore(hex: string): number {
  const raw = hex.replace("#", "").trim();
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;
  if (full.length !== 6) return 0;
  const n = Number.parseInt(full, 16);
  if (Number.isNaN(n)) return 0;
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  const sat = max === 0 ? 0 : d / max;
  let hue = 0;
  if (d > 0) {
    if (max === r) hue = ((g - b) / d) % 6;
    else if (max === g) hue = (b - r) / d + 2;
    else hue = (r - g) / d + 4;
    hue *= 60;
    if (hue < 0) hue += 360;
  }
  // Muddy olive / brown / khaki band
  const muddy =
    hue >= 20 && hue <= 55 && sat < 0.88 && max < 0.78;
  if (muddy || max < 0.38 || sat < 0.42) return sat * max * 0.15;
  return sat * max;
}

function hueOf(hex: string): number {
  const raw = hex.replace("#", "").trim();
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;
  if (full.length !== 6) return 0;
  const n = Number.parseInt(full, 16);
  if (Number.isNaN(n)) return 0;
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d === 0) return 0;
  let hue = 0;
  if (max === r) hue = ((g - b) / d) % 6;
  else if (max === g) hue = (b - r) / d + 2;
  else hue = (r - g) / d + 4;
  hue *= 60;
  if (hue < 0) hue += 360;
  return hue;
}

/** Hand-picked punchy + colorful examples per pack (store buy preview). */
const PACK_EXAMPLE_CARD_IDS: Record<string, string[]> = {
  "dark-evil": ["card_044", "card_059", "card_038"],
  "roast-friends": ["card_076", "card_066", "card_079"],
  "toxic-love": ["card_120", "card_095", "card_091"],
  "unhinged-nights": ["card_122", "card_129", "card_130"],
};

/**
 * Liefert bis zu `count` Beispielkarten für Store-Preview:
 * kuratierte Favoriten, sonst die knalligsten Farben (ohne matschiges Braun).
 */
export function getPackExampleCards(packId: string, count = 5): Card[] {
  const byId = new Map(allCards.map((c) => [c.id, c]));
  const curated = (PACK_EXAMPLE_CARD_IDS[packId] ?? [])
    .map((id) => byId.get(id))
    .filter((c): c is Card => Boolean(c?.image))
    .slice(0, count);
  if (curated.length >= count) return curated;

  const pool = getCardsForPack(packId).filter((c) => Boolean(c.image));
  if (pool.length === 0) return getCardsForPack(packId).slice(0, count);

  const ranked = [...pool].sort(
    (a, b) => vibrancyScore(b.hex) - vibrancyScore(a.hex),
  );
  const picked: Card[] = [...curated];
  const seen = new Set(picked.map((c) => c.id));
  const usedHues: number[] = picked.map((c) => hueOf(c.hex));

  for (const card of ranked) {
    if (picked.length >= count) break;
    if (seen.has(card.id)) continue;
    if (vibrancyScore(card.hex) < 0.35) continue;
    const hue = hueOf(card.hex);
    const tooClose = usedHues.some((h) => {
      const d = Math.min(Math.abs(h - hue), 360 - Math.abs(h - hue));
      return d < 28;
    });
    if (tooClose && picked.length >= Math.min(2, count)) continue;
    picked.push(card);
    seen.add(card.id);
    usedHues.push(hue);
  }

  // Fill remaining if hue filter was too strict
  for (const card of ranked) {
    if (picked.length >= count) break;
    if (seen.has(card.id)) continue;
    picked.push(card);
    seen.add(card.id);
  }

  return picked.slice(0, count);
}

/**
 * Bereitet den Kartentext für die Anzeige auf: entfernt Klammerzusätze wie
 * " (Unhinged Nights)", stellt sicher, dass der Satz mit einem Großbuchstaben
 * beginnt, und hängt ein fehlendes Fragezeichen an. Die Rohdaten bleiben
 * unverändert.
 */
export function displayTitle(text: string): string {
  let cleaned = text.replace(/\s*\([^)]*\)\s*$/, "").trim();
  if (allPacks.length > 0) {
    const names = allPacks
      .map((p) => p.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("|");
    cleaned = cleaned.replace(new RegExp(`\\s+(?:${names})\\s*$`, "i"), "").trim();
  }
  if (!cleaned) return cleaned;
  cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  if (!cleaned.endsWith("?")) cleaned += "?";
  return cleaned;
}
