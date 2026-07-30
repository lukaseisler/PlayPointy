"use client";

import { useBrowserChromeInset } from "@/hooks/useBrowserChromeInset";

/**
 * Mobiles "Frame"-Layout für PlayPointy.
 *
 * Wichtig für iOS 26 Safari (Liquid Glass): Fixed-Container per Inset
 * verankern (`inset-0`), NICHT mit vh/dvh/visualViewport-Höhe bemessen –
 * sonst clippt Safari den unteren Rand hinter die URL-Leiste.
 */
export default function PhoneFrame({ children }: { children: React.ReactNode }) {
  useBrowserChromeInset();

  return (
    <div className="fixed inset-0 flex w-full items-center justify-center overflow-hidden bg-neutral-950 sm:p-6">
      <div className="game-surface relative isolate flex h-full min-h-0 w-full flex-col overflow-hidden bg-white sm:h-[min(1000px,calc(100dvh-3rem))] sm:w-[min(480px,calc(100%-3rem))] sm:rounded-[2.5rem] sm:shadow-2xl sm:ring-8 sm:ring-black/90">
        {children}
      </div>
    </div>
  );
}
