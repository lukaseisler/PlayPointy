"use client";

import { useLayoutEffect } from "react";
import { isIosDevice, isStandaloneDisplayMode } from "@/lib/pwa";

const MIN_CARD_H = 80;
/** Overlay-Tab-Leiste, wenn visualViewport 0 liefert. Kein Top-Inset:
 *  der 133px-Titel mit justify-end sitzt schon unter der Adresszeile. */
const FALLBACK_TAB_BAR = 24;

function px(n: number): string {
  return `${Math.max(0, Math.round(n * 100) / 100)}px`;
}

function probeUnit(unit: "svh" | "lvh" | "dvh"): number {
  const el = document.createElement("div");
  el.style.cssText = `position:fixed;left:0;top:0;width:0;height:100${unit};pointer-events:none;visibility:hidden`;
  document.body.appendChild(el);
  const h = el.getBoundingClientRect().height;
  el.remove();
  return h;
}

function probeSafe(side: "top" | "bottom"): number {
  const el = document.createElement("div");
  el.style.cssText = `position:fixed;visibility:hidden;padding-${side}:env(safe-area-inset-${side},0px)`;
  document.body.appendChild(el);
  const v = parseFloat(getComputedStyle(el).getPropertyValue(`padding-${side}`)) || 0;
  el.remove();
  return v;
}

function measureHole(): { top: number; height: number } {
  const vv = window.visualViewport;
  const innerH = window.innerHeight;
  const svh = probeUnit("svh");
  const lvh = probeUnit("lvh");
  const dvh = probeUnit("dvh");
  const safeBottom = probeSafe("bottom");

  const vvTop = Math.max(0, vv?.offsetTop ?? 0);
  const vvH = vv?.height ?? innerH;
  const vvBottom = Math.max(0, innerH - vvH - vvTop);
  const unitChrome = Math.max(0, lvh - Math.min(svh, dvh));

  let top = vvTop;
  let height = Math.min(vvH, lvh, innerH);
  let bottom = Math.max(vvBottom, safeBottom);

  const silent = top < 2 && bottom < 8 && unitChrome < 8;
  if (silent || (top < 2 && vvBottom < 8)) {
    bottom = Math.max(FALLBACK_TAB_BAR, safeBottom);
  }

  height = Math.max(MIN_CARD_H, innerH - top - bottom);
  return { top, height };
}

function resetSurface(surface: HTMLElement) {
  surface.style.marginTop = "";
  surface.style.height = "";
  surface.style.maxHeight = "";
  surface.style.removeProperty("--game-card-h");
  document.documentElement.style.removeProperty("--ios-hole-top");
  document.documentElement.style.removeProperty("--ios-hole-h");
}

function layoutIosSafari() {
  const surface = document.querySelector(".game-surface");
  if (!(surface instanceof HTMLElement)) return;

  const iosPhone = isIosDevice() && !window.matchMedia("(min-width: 640px)").matches;
  if (!iosPhone || isStandaloneDisplayMode()) {
    return;
  }

  document.documentElement.setAttribute("data-ios-safari", "");
  const hole = measureHole();
  const root = document.documentElement;
  root.style.setProperty("--ios-hole-top", px(hole.top));
  root.style.setProperty("--ios-hole-h", px(hole.height));

  const title = surface.querySelector(".game-title-block");
  const footer = surface.querySelector(".game-footer");
  const titleH = title instanceof HTMLElement ? title.offsetHeight : 133;
  const footerH = footer instanceof HTMLElement ? footer.offsetHeight : 116;
  const fullCardH = surface.clientWidth * 1.25;
  const available = hole.height - titleH - footerH;
  const cardH = Math.max(MIN_CARD_H, Math.min(fullCardH, available));
  surface.style.setProperty("--game-card-h", px(cardH));
}

/** Nur iPhone Safari: Loch zwischen den Leisten messen und Karte unten croppen. */
export function useIosSafariViewport(): void {
  useLayoutEffect(() => {
    const vv = window.visualViewport;
    let raf = 0;

    function schedule() {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        layoutIosSafari();
      });
    }

    layoutIosSafari();
    const delayed = window.setTimeout(layoutIosSafari, 120);

    vv?.addEventListener("resize", schedule);
    vv?.addEventListener("scroll", schedule);
    window.addEventListener("resize", schedule);
    window.addEventListener("orientationchange", schedule);

    return () => {
      window.clearTimeout(delayed);
      window.cancelAnimationFrame(raf);
      vv?.removeEventListener("resize", schedule);
      vv?.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("orientationchange", schedule);
      const surface = document.querySelector(".game-surface");
      if (surface instanceof HTMLElement) resetSurface(surface);
    };
  }, []);
}
