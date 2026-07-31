"use client";

import { useEffect } from "react";

function measureViewportUnit(unit: "svh" | "lvh"): number {
  const el = document.createElement("div");
  el.style.cssText = `position:fixed;top:0;left:0;width:0;height:100${unit};visibility:hidden;pointer-events:none;`;
  document.body.appendChild(el);
  const h = el.offsetHeight;
  el.remove();
  return h;
}

/**
 * Standard-Fix für iOS Safari Fixed-Layouts:
 * - Frame-Höhe/Top folgen `visualViewport` → passen sich an, wenn die
 *   Adressleiste ein-/ausblendet (kein permanentes Riesen-Padding).
 * - Nur wenn die Leiste als Overlay liegt (Liquid Glass: VV schrumpft nicht),
 *   reservieren wir unten die gemessene Chrome-Höhe (lvh − svh).
 */
export function useAdaptiveViewportFrame(): void {
  useEffect(() => {
    const root = document.documentElement;
    let svh = 0;
    let lvh = 0;

    function measureUnits() {
      svh = measureViewportUnit("svh");
      lvh = measureViewportUnit("lvh");
    }

    function sync() {
      const vv = window.visualViewport;
      const vvHeight = vv?.height ?? window.innerHeight;
      const vvTop = vv?.offsetTop ?? 0;

      root.style.setProperty("--app-height", `${Math.round(vvHeight)}px`);
      root.style.setProperty("--app-top", `${Math.round(vvTop)}px`);

      // Overlay-Modus: VV bleibt groß ≈ lvh, Leiste liegt darüber.
      // Resize-Modus: VV ist bereits kleiner → kein Extra-Padding nötig.
      const overlaysChrome = lvh > 0 && vvHeight >= lvh - 2;
      const overlayPad = overlaysChrome ? Math.max(0, lvh - svh) : 0;
      root.style.setProperty("--overlay-chrome-bottom", `${Math.round(overlayPad)}px`);
    }

    measureUnits();
    sync();

    const vv = window.visualViewport;
    vv?.addEventListener("resize", sync);
    vv?.addEventListener("scroll", sync);
    window.addEventListener("resize", sync);

    const onOrientation = () => {
      // Nach Rotation erst messen, wenn Safari die Units aktualisiert hat.
      window.setTimeout(() => {
        measureUnits();
        sync();
      }, 250);
    };
    window.addEventListener("orientationchange", onOrientation);

    return () => {
      vv?.removeEventListener("resize", sync);
      vv?.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      window.removeEventListener("orientationchange", onOrientation);
    };
  }, []);
}
