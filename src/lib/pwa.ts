/** Erkennt, ob die App als installierte PWA (ohne Browser-Chrome) läuft. */
export function isStandaloneDisplayMode(): boolean {
  if (typeof window === "undefined") return false;

  const mediaStandalone = window.matchMedia("(display-mode: standalone)").matches;
  const mediaFullscreen = window.matchMedia("(display-mode: fullscreen)").matches;
  const mediaMinimalUi = window.matchMedia("(display-mode: minimal-ui)").matches;
  // iOS Safari setzt nach "Zum Home-Bildschirm" dieses Legacy-Flag.
  const iosStandalone =
    "standalone" in navigator &&
    (navigator as Navigator & { standalone?: boolean }).standalone === true;

  return mediaStandalone || mediaFullscreen || mediaMinimalUi || iosStandalone;
}
