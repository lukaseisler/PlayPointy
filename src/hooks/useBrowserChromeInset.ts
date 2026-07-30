"use client";

import { useEffect } from "react";
import { isIosDevice, isStandaloneDisplayMode } from "@/lib/pwa";

/**
 * iOS Safari Liquid Glass: URL-Leiste liegt als Overlay ÜBER dem Layout.
 * Setzt `--browser-chrome-bottom` (JS), ergänzend zum CSS-Fallback in globals.css.
 */
export function useBrowserChromeInset(): void {
  useEffect(() => {
    const root = document.documentElement;

    function sync() {
      const needsChromePad = isIosDevice() && !isStandaloneDisplayMode();
      // Großzügig: floating Liquid-Glass-Bar + Luft (~112px).
      root.style.setProperty(
        "--browser-chrome-bottom",
        needsChromePad ? "7rem" : "0px",
      );
    }

    sync();
    const mq = window.matchMedia("(display-mode: standalone)");
    mq.addEventListener("change", sync);
    window.addEventListener("orientationchange", sync);
    return () => {
      mq.removeEventListener("change", sync);
      window.removeEventListener("orientationchange", sync);
    };
  }, []);
}
