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
export function getStorePreviewPath(packId: string): string | null {
  return STORE_PREVIEWS[packId]?.image ?? null;
}

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
