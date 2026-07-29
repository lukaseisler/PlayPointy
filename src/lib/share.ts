import { displayTitle } from "./data";
import type { Card } from "./types";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://playpointy.com";
export const R2_CARDS_BASE = "https://r2.playpointy.com/cards";

/** Kartentitel ohne abschließendes Fragezeichen (für Share-Text / OG). */
export function cardTextWithoutQuestion(text: string): string {
  return displayTitle(text).replace(/\?+\s*$/, "").trim();
}

export function buildSharePath(card: Card): string {
  return `/c/${card.packId}/${card.shareCode}`;
}

export function buildShareUrl(card: Card): string {
  return `${SITE_URL}${buildSharePath(card)}`;
}

/**
 * Share-Nachricht laut Product Spec:
 * "That's so you haha 😂\n\n[Kartentext ohne ?]\n\n[LINK]"
 */
export function buildShareMessage(card: Card): string {
  return `That's so you haha 😂\n\n${cardTextWithoutQuestion(card.text)}\n\n${buildShareUrl(card)}`;
}

/**
 * Absolute R2-Bild-URL für Open-Graph / WhatsApp-Previews.
 * `card.image` ist lokal `cards/card_001.webp` → `https://r2.playpointy.com/cards/card_001.webp`
 */
export function absoluteCardImageUrl(card: Card): string | null {
  if (!card.image) return null;
  const filename = card.image.replace(/^cards\//, "");
  return `${R2_CARDS_BASE}/${filename}`;
}

export type ShareResult = "shared" | "copied" | "cancelled" | "failed";

/**
 * Mobile: navigator.share mit voller Message.
 * Desktop / Fallback: Zwischenablage, Caller zeigt Toast bei "copied".
 */
export async function shareCard(card: Card): Promise<ShareResult> {
  const message = buildShareMessage(card);

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({ text: message });
      return "shared";
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return "cancelled";
      }
      // Weiter mit Clipboard-Fallback
    }
  }

  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(message);
      return "copied";
    } catch {
      return "failed";
    }
  }

  return "failed";
}
