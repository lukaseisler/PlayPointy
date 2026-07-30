"use client";

import { useEffect, useState } from "react";
import {
  isBraveBrowser,
  isInAppBrowser,
  isIosSafari,
  isStandaloneDisplayMode,
  type BeforeInstallPromptEvent,
  type PwaInstallKind,
} from "@/lib/pwa";

export interface PwaInstallEligibility {
  /** Ob ein Install-Hinweis sinnvoll ist. */
  canPrompt: boolean;
  kind: PwaInstallKind;
  /** Chromium: deferred prompt, falls der Browser ihn angeboten hat. */
  deferredPrompt: BeforeInstallPromptEvent | null;
}

/**
 * Bestimmt, ob der PWA-Install-Hinweis gezeigt werden darf.
 *
 * - Standalone / IAB / Brave → stumm
 * - Chromium: erst nach `beforeinstallprompt` (Browser bestätigt Installierbarkeit)
 * - iOS Safari: A2HS über Share-Sheet
 */
export function usePwaInstallEligibility(): PwaInstallEligibility {
  const [kind, setKind] = useState<PwaInstallKind>("none");
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    null,
  );

  useEffect(() => {
    if (isStandaloneDisplayMode() || isInAppBrowser() || isBraveBrowser()) {
      setKind("none");
      return;
    }

    if (isIosSafari()) {
      setKind("ios-safari");
      return;
    }

    function onBeforeInstallPrompt(event: Event) {
      // Doppelcheck: IAB/Brave feuern BIP praktisch nie, aber falls doch → ignorieren
      if (isInAppBrowser() || isBraveBrowser()) return;
      event.preventDefault();
      const bip = event as BeforeInstallPromptEvent;
      setDeferredPrompt(bip);
      setKind("chromium");
    }

    function onInstalled() {
      setDeferredPrompt(null);
      setKind("none");
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  return {
    canPrompt: kind !== "none",
    kind,
    deferredPrompt,
  };
}
