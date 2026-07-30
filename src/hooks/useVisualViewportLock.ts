"use client";

import { useEffect } from "react";

/**
 * Bindet die App-Höhe an `visualViewport`, damit iOS Safari die untere
 * URL-/Toolbar-Leiste nicht über Fixed-Content (Buttons) legt.
 * Setzt CSS-Vars `--app-height` und `--app-top` auf `:root`.
 */
export function useVisualViewportLock(): void {
  useEffect(() => {
    const root = document.documentElement;

    function sync() {
      const vv = window.visualViewport;
      const height = vv?.height ?? window.innerHeight;
      const top = vv?.offsetTop ?? 0;
      root.style.setProperty("--app-height", `${Math.round(height)}px`);
      root.style.setProperty("--app-top", `${Math.round(top)}px`);
    }

    sync();
    const vv = window.visualViewport;
    vv?.addEventListener("resize", sync);
    vv?.addEventListener("scroll", sync);
    window.addEventListener("resize", sync);
    window.addEventListener("orientationchange", sync);

    return () => {
      vv?.removeEventListener("resize", sync);
      vv?.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      window.removeEventListener("orientationchange", sync);
    };
  }, []);
}
