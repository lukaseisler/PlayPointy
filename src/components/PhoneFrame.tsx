/**
 * Mobiles "Frame"-Layout für PlayPointy.
 *
 * Äußerer Container: `h-[100dvh]` (dynamische Viewport-Höhe).
 * `viewport-fit=cover` in layout.tsx aktiviert Safe-Area-Insets für iOS.
 */
export default function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-x-0 top-0 flex h-[100dvh] w-full items-center justify-center overflow-hidden bg-neutral-950 sm:inset-0 sm:h-[100dvh] sm:p-6">
      <div className="game-surface relative isolate flex h-full min-h-0 w-full flex-col overflow-hidden bg-white sm:h-[min(1000px,calc(100dvh-3rem))] sm:w-[min(480px,calc(100%-3rem))] sm:rounded-[2.5rem] sm:shadow-2xl sm:ring-8 sm:ring-black/90">
        {children}
      </div>
    </div>
  );
}
