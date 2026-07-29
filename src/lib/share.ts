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
 * "That's so you haha! 😂\n\n[Kartentext]:\n[LINK]"
 */
export function buildShareMessage(card: Card): string {
  return `That's so you haha! 😂\n\n${cardTextWithoutQuestion(card.text)}:\n${buildShareUrl(card)}`;
}

/** OG-Vorschau: Title prominent, Domain als Description (kein Kartentext-Doppel). */
export const OG_SHARE_TITLE = "Party Card Game!";
export const OG_SHARE_DESCRIPTION = "playpointy.com";

/**
 * Absolute JPEG-URL für Open-Graph / WhatsApp.
 *
 * Warum nicht R2-WebP:
 * - `r2.playpointy.com` hat derzeit keinen DNS-Eintrag → Crawler laden nichts
 * - WhatsApp rendert RGBA-WebP unzuverlässig → leere Vorschau
 *
 * JPEGs liegen unter `/og/card_XXX.jpg` (gleiche Origin wie die Seite).
 */
export function absoluteOgImageUrl(card: Card): string | null {
  if (!card.image) return null;
  return `${SITE_URL}/og/${card.id}.jpg`;
}

/** @deprecated Prefer absoluteOgImageUrl for social previews. */
export function absoluteCardImageUrl(card: Card): string | null {
  return absoluteOgImageUrl(card);
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
