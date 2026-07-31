"use client";

import { AnimatePresence, motion, useAnimation, useDragControls } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";
import type { PackSummary } from "@/lib/types";
import { FREE_PACK_ID } from "@/lib/data";

export type StoreReason = "limit" | "manual";

interface StoreModalProps {
  open: boolean;
  reason: StoreReason;
  packs: PackSummary[];
  activePackIds: string[];
  onActivePacksChange: (ids: string[]) => void;
  onClose: () => void;
  onReshuffle: () => void;
}

const STORE_CATCHPHRASES = [
  "More packs. More drama. 🎭🔥",
  "Unlock more packs for even more chaos. 🌪️😈",
  "Make things weird. Unlock new packs. 👀🌶️",
  "Level up your party. 🚀",
  "Bonds will be tested. Get more cards. 💔😂",
  "Boring company? Unlock more chaos. 🥱💸",
] as const;

function pickStoreCatchphrase(): string {
  return STORE_CATCHPHRASES[Math.floor(Math.random() * STORE_CATCHPHRASES.length)]!;
}

/**
 * "Deck Manager"-Popup: verwaltet, welche Packs aktiv sind, und bietet die
 * weiteren (noch nicht freigeschalteten) Packs zum Kauf an (UI-Text bewusst
 * komplett auf Englisch).
 *
 * Aktive Packs werden vom Parent gesteuert und in localStorage persistiert.
 * Preis-Button ist noch UI-Platzhalter (kein Stripe-Checkout).
 */
export default function StoreModal({
  open,
  reason,
  packs,
  activePackIds,
  onActivePacksChange,
  onClose,
  onReshuffle,
}: StoreModalProps) {
  const dragControls = useDragControls();
  const wiggleControls = useAnimation();
  const [catchphrase, setCatchphrase] = useState<string>(STORE_CATCHPHRASES[1]);

  // Bei jedem Öffnen eine neue Catchphrase würfeln.
  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fresh tagline per store open
    setCatchphrase(pickStoreCatchphrase());
  }, [open]);

  function toggleActive(id: string) {
    const isActive = activePackIds.includes(id);
    if (isActive && activePackIds.length === 1) {
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([40, 50, 40]);
      }
      void wiggleControls.start({ x: [-4, 4, -4, 4, 0], transition: { duration: 0.3 } });
      return;
    }
    onActivePacksChange(
      isActive ? activePackIds.filter((p) => p !== id) : [...activePackIds, id],
    );
  }

  const subtitle =
    reason === "limit"
      ? `You've played all 30 free cards. ${catchphrase}`
      : catchphrase;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="absolute inset-0 z-50 flex flex-col justify-end bg-black/60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="no-scrollbar relative max-h-[85%] overflow-y-auto rounded-t-[2rem] bg-white pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            drag="y"
            dragListener={false}
            dragControls={dragControls}
            dragDirectionLock
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_event, info) => {
              if (info.offset.y > 100) onClose();
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Login fest oben rechts im Sheet-Eck (Summary: "Login button:
                top-right"). `top-6 right-6` = gleiches 24px-Inset wie die
                Pack-Liste (`pr-6`/`ml-6`) und genug Abstand zur
                `rounded-t-[2rem]`-Rundung, damit das Icon nicht in die
                Kurve gequetscht wirkt. */}
            <button
              type="button"
              onClick={() => {
                /* Login flow follows later. */
              }}
              onPointerDown={(e) => e.stopPropagation()}
              aria-label="Login"
              className="pointer-events-auto absolute top-6 right-6 z-20 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-neutral-100 text-lg text-neutral-600 ring-1 ring-black/5 transition-colors hover:bg-neutral-200"
            >
              👤
            </button>

            {/* Der GESAMTE Griff-Bereich (kleiner Balken + Emoji/Titel/Text)
                startet das Swipe-to-close-Drag (per `dragControls`) - nicht
                mehr nur der winzige graue Strich. Die Liste darunter bleibt
                bewusst AUSSERHALB dieses Wrappers und damit normal
                scrollbar, ohne mit `touch-action` zu kollidieren. */}
            <div
              onPointerDown={(e) => dragControls.start(e)}
              className="touch-none cursor-grab px-6"
            >
              <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-neutral-200" />

              <div className="mb-5 text-center">
                <div className="mb-1 text-3xl">
                  {reason === "limit" ? "🎉" : "🛒"}
                </div>
                <h2 className="text-xl font-semibold text-neutral-900">
                  {reason === "limit"
                    ? "Starter Chaos complete!"
                    : "All Packs"}
                </h2>
                <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>
              </div>
            </div>

            <div className="flex flex-col">
              {packs.map((pack, idx) => {
                const isFreePack = pack.id === FREE_PACK_ID;
                const isActive = activePackIds.includes(pack.id);
                return (
                  // `border-b`-Klassen ersetzt durch eine hartcodierte 1px-DOM-
                  // Linie UNTER der Zeile (statt als Border AUF der Zeile) -
                  // die CSS-Border-Variante war (vermutlich durch zu helle
                  // Farben/Border-Collapsing) auf Weiss quasi unsichtbar.
                  <div key={pack.id} className="flex flex-col">
                    <div className="flex w-full items-center py-2">
                    {/* Gleiches horizontales Inset wie der Header (`px-6` =
                        24px): vorher `ml-3`/`pr-3` (12px) liess die
                        Aktions-Spalte (Toggle/Preis) weiter rechts enden
                        als das Login-Icon im Header - optisch wirkte das
                        Icon dann "zu weit rechts" bzw. nicht buendig mit
                        dem Rest. */}
                    <div
                      className="relative ml-6 aspect-[3/2] w-[145px] flex-none overflow-hidden rounded-xl"
                      style={{ backgroundColor: pack.accentHex }}
                    >
                      {pack.previewImage && (
                        <Image
                          src={`/${pack.previewImage}`}
                          alt={pack.name}
                          fill
                          sizes="145px"
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 px-4">
                      <p className="truncate text-sm font-semibold text-neutral-900">
                        {pack.name}
                      </p>
                      <p className="text-xs text-neutral-500">{pack.cardCount} Cards</p>
                    </div>

                    <div className="self-center pr-6">
                    {isFreePack ? (
                      // iOS-artiger An/Aus-Toggle statt Kauf-Button: das
                      // Starter-Pack ist bereits freigeschaltet, kann aber
                      // im Deck Manager aktiviert/deaktiviert werden. An
                      // `wiggleControls` gebunden, damit ein Versuch, das
                      // letzte aktive Pack abzuschalten, sichtbar abgelehnt
                      // wird (kurzes Wackeln statt stillem No-op).
                      <motion.div
                        role="switch"
                        aria-checked={isActive}
                        aria-label={`${pack.name} ${isActive ? "deactivate" : "activate"}`}
                        tabIndex={0}
                        onClick={() => toggleActive(pack.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            toggleActive(pack.id);
                          }
                        }}
                        animate={wiggleControls}
                        className="pointer-events-auto relative h-7 w-12 flex-none cursor-pointer rounded-full transition-colors duration-300"
                        style={{ backgroundColor: isActive ? pack.accentHex : "#d4d4d4" }}
                      >
                        <motion.span
                          className="absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow-md"
                          animate={{ x: isActive ? 20 : 0 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      </motion.div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          /* Stripe checkout follows - placeholder only for now. */
                        }}
                        className="pointer-events-auto flex-none rounded-full px-4 py-2 text-xs font-semibold text-white transition-colors"
                        style={{ backgroundColor: pack.accentHex }}
                      >
                        €2.99
                      </button>
                    )}
                    </div>
                    </div>
                    {/* Hartcodierte 1px-Linie zwischen den Pack-Zeilen.
                        `bg-neutral-300` statt `/10`-Opazitaet oder
                        `neutral-200`: auf reinem Weiss war `black/10` bzw.
                        `neutral-200` (oklch ~0.92) praktisch unsichtbar -
                        `neutral-300` (~#d4d4d4) bleibt dezent, ist aber
                        klar wahrnehmbar. Bewusst OHNE `dark:`-Variante, da
                        der Sheet immer hart `bg-white` ist. */}
                    {/* Dezente, moderne 1px-Trennlinie – leicht transparent,
                        damit sie auf Weiss sichtbar bleibt, aber nicht
                        hart/laut wirkt. */}
                    {idx < packs.length - 1 && (
                      <div className="h-px w-full bg-black/10" />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-5 flex flex-col gap-2 px-6">
              {reason === "limit" && (
                <button
                  type="button"
                  onClick={onReshuffle}
                  className="pointer-events-auto w-full rounded-full border-2 border-neutral-200 py-3 text-sm font-semibold text-neutral-700"
                >
                  Shuffle Again 🔀
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="pointer-events-auto w-full rounded-full py-3 text-sm font-semibold text-neutral-500"
              >
                Back to Game
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
