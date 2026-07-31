"use client";

import { useAdaptiveViewportFrame } from "@/hooks/useAdaptiveViewportFrame";

/**
 * Mobiles Frame-Layout.
 *
 * Höhe folgt adaptiv dem Visual Viewport (`--app-height` / `--app-top`),
 * Fallback CSS: `100dvh`. So bleibt die UI über der Safari-Leiste, ohne
 * mit festem Riesen-Padding nach oben zu rutschen.
 */
export default function PhoneFrame({ children }: { children: React.ReactNode }) {
  useAdaptiveViewportFrame();

  return (
    <div
      className="fixed inset-x-0 flex w-full items-center justify-center overflow-hidden bg-neutral-950 sm:p-6"
      style={{
        top: "var(--app-top, 0px)",
        height: "var(--app-height, 100dvh)",
      }}
    >
      <div className="game-surface relative isolate flex h-full min-h-0 w-full flex-col overflow-hidden bg-white sm:h-[min(1000px,calc(100dvh-3rem))] sm:w-[min(480px,calc(100%-3rem))] sm:rounded-[2.5rem] sm:shadow-2xl sm:ring-8 sm:ring-black/90">
        {children}
      </div>
    </div>
  );
}
