"use client";

import { useLayoutEffect, useState, type RefObject } from "react";
import { isInAppBrowser } from "@/lib/pwa";

/** Gboard + SMS autofill chip is typically well above this. */
const KEYBOARD_GUESS_MIN = 180;
const FALLBACK_RATIO = 0.45;

function visibleBottom(): number {
  const vv = window.visualViewport;
  if (vv) return vv.offsetTop + vv.height;
  return window.innerHeight;
}

function measureOverlap(container: HTMLElement): number {
  const rect = container.getBoundingClientRect();
  return Math.max(0, Math.round(rect.bottom - visibleBottom()));
}

function isPhoneLayout(): boolean {
  return window.innerWidth < 640;
}

function focusedInputIn(container: HTMLElement): boolean {
  const el = document.activeElement;
  return (
    el instanceof HTMLElement &&
    container.contains(el) &&
    (el.tagName === "INPUT" || el.tagName === "TEXTAREA")
  );
}

function fallbackInset(): number {
  return Math.min(380, Math.round(window.innerHeight * FALLBACK_RATIO));
}

/**
 * How far a bottom sheet sits under the on-screen keyboard.
 * Instagram/TikTok WebViews often overlay the keyboard without shrinking
 * visualViewport — then we pad by a phone-keyboard-sized fallback while an
 * input inside the sheet is focused.
 */
export function useKeyboardOverlap(
  containerRef: RefObject<HTMLElement | null>,
  enabled: boolean,
): number {
  const [overlap, setOverlap] = useState(0);

  useLayoutEffect(() => {
    if (!enabled) {
      setOverlap(0);
      return;
    }

    let raf = 0;
    let fallbackTimer = 0;

    function apply(next: number) {
      setOverlap((prev) => (prev === next ? prev : next));
    }

    function update() {
      const container = containerRef.current;
      if (!container) return;

      const measured = measureOverlap(container);
      if (measured >= KEYBOARD_GUESS_MIN) {
        apply(measured);
        return;
      }

      // Keep a prior in-app fallback while focus is still in an input and the
      // WebView still reports no viewport shrink (common on IG/TikTok).
      if (isPhoneLayout() && focusedInputIn(container) && isInAppBrowser()) {
        setOverlap((prev) => (prev >= KEYBOARD_GUESS_MIN ? prev : fallbackInset()));
        return;
      }

      apply(measured);
    }

    function schedule() {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        update();
      });
    }

    function onFocusIn() {
      window.clearTimeout(fallbackTimer);
      schedule();
      // Delay the lift so the focusing tap cannot land on the backdrop after
      // the sheet jumps (common Instagram/TikTok ghost-close bug).
      fallbackTimer = window.setTimeout(() => {
        const container = containerRef.current;
        if (!container || !isPhoneLayout() || !focusedInputIn(container)) return;
        const measured = measureOverlap(container);
        if (measured >= KEYBOARD_GUESS_MIN) {
          apply(measured);
          return;
        }
        if (isInAppBrowser()) {
          apply(fallbackInset());
        }
      }, 320);
    }

    function onFocusOut() {
      window.clearTimeout(fallbackTimer);
      fallbackTimer = window.setTimeout(update, 100);
    }

    update();
    const delayed = window.setTimeout(update, 160);

    const vv = window.visualViewport;
    vv?.addEventListener("resize", schedule);
    vv?.addEventListener("scroll", schedule);
    window.addEventListener("resize", schedule);
    window.addEventListener("focusin", onFocusIn);
    window.addEventListener("focusout", onFocusOut);

    return () => {
      window.clearTimeout(delayed);
      window.clearTimeout(fallbackTimer);
      window.cancelAnimationFrame(raf);
      vv?.removeEventListener("resize", schedule);
      vv?.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("focusin", onFocusIn);
      window.removeEventListener("focusout", onFocusOut);
    };
  }, [containerRef, enabled]);

  return overlap;
}
