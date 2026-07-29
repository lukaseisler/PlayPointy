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
 * Baut die Pack-Liste für den Store: Name, Kartenanzahl, Akzentfarbe (erste
 * Karte) und Vorschaubild. Ohne `excludePackId` sind ALLE Packs enthalten
 * (inkl. des kostenlosen Starter-Packs) - der Store fungiert jetzt als
 * "Deck Manager" fuer saemtliche Packs, nicht nur als Kaufliste fuer die
 * noch nicht freigeschalteten.
 */
export function getStorePacks(excludePackId?: string): PackSummary[] {
  return allPacks
    .filter((p) => p.id !== excludePackId)
    .map((p) => {
      const cards = getCardsForPack(p.id);
      const first = cards[0];
      return {
        id: p.id,
        name: p.name,
        cardCount: p.cardCount,
        accentHex: first?.hex ?? "#171717",
        previewImage: first?.image ?? null,
      };
    });
}

/**
 * Bereitet den Kartentext für die Anzeige auf: entfernt Klammerzusätze wie
 * " (Unhinged Nights)" und stellt sicher, dass der Satz IMMER mit einem
 * Großbuchstaben beginnt (die Rohdaten in der Excel-Quelle sind hier
 * uneinheitlich). Die Rohdaten selbst bleiben unverändert.
 */
export function displayTitle(text: string): string {
  const cleaned = text.replace(/\s*\([^)]*\)\s*$/, "").trim();
  if (!cleaned) return cleaned;
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}
