/**
 * Mobiles Frame-Layout.
 *
 * iOS 26 Safari (Liquid Glass): Fixed-UI per Inset verankern (`inset-0`),
 * NICHT mit 100dvh / visualViewport-Höhe. Safari clippt fixed-Container auf
 * den Bereich zwischen Status- und Adressleiste — Buttons bleiben sichtbar,
 * ohne Hardcode-Paddings.
 *
 * `viewport-fit=cover` in layout.tsx bleibt Voraussetzung für Safe-Areas.
 */
export default function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 flex w-full items-center justify-center overflow-hidden bg-neutral-950 sm:p-6">
      <div className="game-surface relative isolate flex h-full min-h-0 w-full flex-col overflow-hidden bg-white sm:h-[min(1000px,calc(100svh-3rem))] sm:w-[min(480px,calc(100%-3rem))] sm:rounded-[2.5rem] sm:shadow-2xl sm:ring-8 sm:ring-black/90">
        {children}
      </div>
    </div>
  );
}
