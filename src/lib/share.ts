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

export const SHARE_HOOK = "That's so you haha! 😂";

/** Hook + link only. The card line is the OG preview title, not repeated here. */
export function buildShareMessage(card: Card): string {
  return `${SHARE_HOOK}\n${buildShareUrl(card)}`;
}

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

export type ShareResult = "shared" | "cancelled" | "failed";

function canShareData(data: ShareData): boolean {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
    return false;
  }
  if (typeof navigator.canShare !== "function") return true;
  try {
    return navigator.canShare(data);
  } catch {
    return false;
  }
}

/**
 * Always open the OS share sheet. Never copy to the clipboard.
 * Tries a few payloads because iOS/Android reject some combinations.
 */
export async function shareCard(card: Card): Promise<ShareResult> {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
    return "failed";
  }

  const url = buildShareUrl(card);
  // Keep the URL inside `text` only. Passing a separate `url` makes WhatsApp
  // insert the OG card title between the hook and the link.
  const payloads: ShareData[] = [
    { text: `${SHARE_HOOK}\n${url}` },
    { text: SHARE_HOOK, url },
    { url },
  ];

  for (const data of payloads) {
    if (!canShareData(data)) continue;
    try {
      await navigator.share(data);
      return "shared";
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return "cancelled";
      }
      if (err instanceof DOMException && err.name === "InvalidStateError") {
        return "cancelled";
      }
    }
  }

  return "failed";
}
