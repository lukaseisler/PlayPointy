/**
 * PWA-Umgebung & Install-Eligibility.
 *
 * Goldstandard:
 * - Chromium: nur wenn `beforeinstallprompt` gefeuert hat (Browser sagt
 *   explizit "installierbar") → Instagram/TikTok/Brave ohne Support bleiben still.
 * - iOS: nur echtes Safari (Share → Zum Home-Bildschirm), keine In-App-WebViews.
 */

export type PwaInstallKind = "none" | "chromium" | "ios-safari";

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

/** Läuft die App bereits als installierte PWA / Standalone? */
export function isStandaloneDisplayMode(): boolean {
  if (typeof window === "undefined") return false;

  const mediaStandalone = window.matchMedia("(display-mode: standalone)").matches;
  const mediaFullscreen = window.matchMedia("(display-mode: fullscreen)").matches;
  const mediaMinimalUi = window.matchMedia("(display-mode: minimal-ui)").matches;
  const iosStandalone =
    "standalone" in navigator &&
    (navigator as Navigator & { standalone?: boolean }).standalone === true;

  return mediaStandalone || mediaFullscreen || mediaMinimalUi || iosStandalone;
}

function getUa(): string {
  return typeof navigator !== "undefined" ? navigator.userAgent || "" : "";
}

/** In-App-Browser / WebViews, in denen Install-Hinweise nur verwirren. */
export function isInAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = getUa();

  // Bekannte Social-/Messenger-WebViews
  if (
    /FBAN|FBAV|FB_IAB|Instagram|Line\/|LinkedInApp|Snapchat|Twitter|TikTok|BytedanceWebview|musical_ly|Pinterest|Discord|WhatsApp|MessengerTemplate|MicroMessenger|Weibo|GSA\//i.test(
      ua,
    )
  ) {
    return true;
  }

  // Android WebView-Marker (`; wv)` in Chromium-UA)
  if (/; wv\)|\bwv\b/i.test(ua)) return true;

  // iOS WebView: AppleWebKit ohne "Safari/" (echte Safari-UA enthält beides)
  const ios = isIosDevice();
  if (ios && /AppleWebKit/i.test(ua) && !/Safari/i.test(ua)) return true;

  return false;
}

export function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = getUa();
  if (/iPhone|iPad|iPod/i.test(ua)) return true;
  // iPadOS meldet sich oft als MacIntel + Touch
  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
}

/** Brave (desktop/Android/iOS) – Install-UX uneinheitlich / oft verwirrend. */
export function isBraveBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as Navigator & { brave?: { isBrave?: () => Promise<boolean> } };
  if (nav.brave) return true;
  return /Brave/i.test(getUa());
}

/**
 * Echtes iOS Safari (nicht Chrome/Firefox/Edge/Brave/DuckDuckGo auf iOS,
 * nicht Instagram-etc. WebView). Nur hier ist A2HS reibungslos.
 */
export function isIosSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  if (!isIosDevice()) return false;
  if (isInAppBrowser()) return false;
  if (isBraveBrowser()) return false;

  const ua = getUa();
  // Andere Browser auf iOS (WebKit-Wrapper mit eigenen Tokens)
  if (/CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo|YaBrowser/i.test(ua)) return false;

  // Safari-UA oder Legacy-Flag `navigator.standalone` (nur iOS Safari-Familie)
  return /Safari/i.test(ua) || "standalone" in navigator;
}

/**
 * Sync-Snapshot ohne BIP-Event: nie "chromium" (braucht Event).
 * Wird vom Hook mit BIP-State kombiniert.
 */
export function getStaticInstallKind(): PwaInstallKind {
  if (typeof window === "undefined") return "none";
  if (isStandaloneDisplayMode()) return "none";
  if (isInAppBrowser()) return "none";
  if (isBraveBrowser()) return "none";
  if (isIosSafari()) return "ios-safari";
  return "none";
}
