import IosSafariViewportSync from "@/components/IosSafariViewportSync";

/**
 * Mobiles Frame-Layout.
 *
 * Standard (Android/Desktop): 100svh. iPhone Safari setzt Höhe/Offset per JS
 * auf das gemessene Loch zwischen den Browser-Leisten.
 */
export default function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="phone-frame-root fixed inset-0 flex w-full items-start justify-center overflow-hidden bg-white sm:items-center sm:bg-neutral-950 sm:p-6">
      <IosSafariViewportSync />
      <div className="game-surface relative isolate mt-[var(--ios-hole-top,0px)] flex h-[var(--ios-hole-h,100svh)] max-h-[var(--ios-hole-h,100svh)] min-h-0 w-full flex-col overflow-hidden bg-white sm:mt-0 sm:h-[min(1000px,calc(100svh-3rem))] sm:max-h-none sm:w-[min(480px,calc(100%-3rem))] sm:rounded-[2.5rem] sm:shadow-2xl sm:ring-8 sm:ring-black/90">
        {children}
      </div>
    </div>
  );
}
