"use client";

import { useEffect } from "react";
import {
  isInAppBrowser,
  isIosDevice,
  isStandaloneDisplayMode,
} from "@/lib/pwa";

/**
 * iOS Safari (Liquid Glass): die untere URL-Leiste schwebt als Overlay über
 * dem Layout-Viewport und steckt NICHT in `safe-area-inset` / visualViewport.
 * Nur im normalen Browser-Tab (nicht PWA/Standalone) setzen wir deshalb
 * `--browser-chrome-bottom`, damit Footer-Buttons darüber bleiben.
 */
export function useBrowserChromeInset(): void {
  useEffect(() => {
    const root = document.documentElement;

    function sync() {
      const needsChromePad =
        isIosDevice() && !isStandaloneDisplayMode() && !isInAppBrowser();

      // ~72px deckt die floating Safari-Bar inkl. etwas Luft ab.
      // Home-Indicator kommt zusätzlich über env(safe-area-inset-bottom).
      root.style.setProperty(
        "--browser-chrome-bottom",
        needsChromePad ? "4.5rem" : "0px",
      );
    }

    sync();

    const mq = window.matchMedia("(display-mode: standalone)");
    const onChange = () => sync();
    mq.addEventListener("change", onChange);
    window.addEventListener("orientationchange", onChange);

    return () => {
      mq.removeEventListener("change", onChange);
      window.removeEventListener("orientationchange", onChange);
    };
  }, []);
}
