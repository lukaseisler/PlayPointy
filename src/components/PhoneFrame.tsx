/**
 * Mobiles "Frame"-Layout für PlayPointy.
 *
 * - Auf echten Handys (Standardfall) füllt der Rahmen den kompletten
 *   Bildschirm (h-dvh) – kein Platz für Ränder.
 * - Auf Tablet/Desktop (ab `sm`) wird ein zentrierter Handy-Rahmen mit
 *   max. ~480px Breite gezeigt (Projektzusammenfassung Punkt 14).
 *   Bewusst KEIN `aspect-[4/5]` auf dem Frame: die 4:5-Proportion gehört
 *   zur farbigen Bildfläche in `GameCard` (800×1000px-Canvas). Header und
 *   Footer brauchen darueber/darunter Platz – der Frame ist deshalb eher
 *   hochkant-phone-artig (feste Breite + `min(1000px, 100dvh)` Hoehe).
 */
export default function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 flex h-dvh w-full items-center justify-center overflow-hidden bg-neutral-950 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] sm:p-6 sm:pt-6 sm:pb-6">
      <div className="game-surface relative isolate flex h-full min-h-0 w-full flex-col overflow-hidden bg-white sm:h-[min(1000px,calc(100dvh-3rem))] sm:w-[min(480px,calc(100%-3rem))] sm:rounded-[2.5rem] sm:shadow-2xl sm:ring-8 sm:ring-black/90">
        {children}
      </div>
    </div>
  );
}
