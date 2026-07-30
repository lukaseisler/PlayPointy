"use client";

import { AnimatePresence, motion, useAnimation } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { displayTitle } from "@/lib/data";
import { shareCard } from "@/lib/share";
import type { Card } from "@/lib/types";
import { useIsStandalonePwa } from "@/hooks/useIsStandalonePwa";

interface GameCardProps {
  card: Card;
  position: number;
  index: number;
  total: number;
  onOpenStore: () => void;
}

interface BurstParticle {
  id: string;
  x: number;
  delay: number;
  rotate: number;
}

function CardCounterBurst({ burstKey }: { burstKey: number }) {
  const particles: BurstParticle[] = Array.from({ length: 6 }, (_, i) => ({
    id: `${burstKey}-${i}`,
    x: (i - 2.5) * 14,
    delay: i * 0.04,
    rotate: (i - 2.5) * 12,
  }));

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-end pr-2">
      <AnimatePresence>
        {particles.map((p) => (
          <motion.span
            key={p.id}
            initial={{ opacity: 0, y: 8, scale: 0.4, x: 0 }}
            animate={{
              opacity: [0, 1, 1, 0],
              y: [8, -12, -48, -72],
              x: p.x,
              scale: [0.4, 1.1, 1, 0.7],
              rotate: p.rotate,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.75, delay: p.delay, ease: "easeOut" }}
            className="absolute top-0 right-6 text-lg"
            aria-hidden
          >
            🎴
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}

/**
 * Eine einzelne Spielkarte. Färbt sich komplett passend zu `card.hex`
 * (Hintergrund der Bildfläche, Pack-Label, beide Buttons).
 */
export default function GameCard({ card, position, index, total, onOpenStore }: GameCardProps) {
  const accent = card.hex;
  const [infoOpen, setInfoOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [burstKey, setBurstKey] = useState(0);
  const isStandalonePwa = useIsStandalonePwa();
  const logoControls = useAnimation();

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 1800);
    return () => window.clearTimeout(t);
  }, [toast]);

  async function handleShare() {
    const result = await shareCard(card);
    if (result === "copied") setToast("Copied to clipboard");
  }

  async function handleLogoBoop(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    await logoControls.start({
      scale: [1, 1.22, 0.88, 1.1, 1],
      rotate: [0, -8, 6, -3, 0],
      transition: { duration: 0.42, ease: "easeOut" },
    });
  }

  function handleCounterTap(e: React.MouseEvent) {
    e.stopPropagation();
    setBurstKey((k) => k + 1);
  }

  return (
    <div className="relative isolate flex h-full w-full flex-col overflow-hidden bg-white">
      {/* Header nimmt restliche Hoehe; darf schrumpfen, Footer nicht. */}
      <div className="relative z-10 flex min-h-0 flex-1 flex-col justify-end gap-1 px-6 pt-8 pb-4">
        <span className="text-base font-semibold tracking-wide text-neutral-700 uppercase">
          Who is more likely to
        </span>
        <h1 className="text-[26px] leading-tight font-semibold text-neutral-900">
          {displayTitle(card.text)}
        </h1>
      </div>

      <div
        className="relative z-10 aspect-[4/5] w-full min-h-0 shrink overflow-hidden transition-colors duration-500"
        style={{
          backgroundColor: accent,
          // Platz fuer Header-Minimum + Footer (Buttons + Chrome-Inset) reservieren,
          // damit die Karte die Action-Buttons nie hinter die Safari-Bar drueckt.
          maxHeight:
            "calc(100% - 9.5rem - env(safe-area-inset-bottom, 0px) - var(--browser-chrome-bottom, 0px))",
        }}
      >
        <motion.button
          type="button"
          aria-label="PlayPointy"
          data-no-tap-nav
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            void handleLogoBoop(e);
          }}
          animate={logoControls}
          whileTap={{ scale: 0.9 }}
          className="pointer-events-auto absolute top-4 left-4 z-10 origin-center cursor-pointer border-0 bg-transparent p-0 [filter:drop-shadow(0_1px_3px_rgba(0,0,0,0.35))]"
        >
          <Image
            src="/logo.png"
            alt=""
            width={825}
            height={676}
            priority
            draggable={false}
            className="pointer-events-none h-auto w-[94px] select-none"
          />
        </motion.button>

        <div className="absolute top-4 right-4 z-10">
          <button
            type="button"
            data-no-tap-nav
            aria-label={`${position} of ${total} cards`}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={handleCounterTap}
            className="pointer-events-auto relative cursor-pointer border-0 bg-transparent p-0 text-[22px] font-medium tracking-wide text-white"
          >
            {position} / {total}
          </button>
          {burstKey > 0 && <CardCounterBurst key={burstKey} burstKey={burstKey} />}
        </div>

        {card.image ? (
          <Image
            src={`/${card.image}`}
            alt={displayTitle(card.text)}
            fill
            draggable={false}
            priority
            sizes="(max-width: 480px) 100vw, 480px"
            className="pointer-events-none object-contain object-bottom select-none"
          />
        ) : null}

        {index === 0 && !infoOpen && !isStandalonePwa && (
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="pointer-events-none absolute right-0 bottom-6 left-0 z-20 mx-auto flex w-fit flex-col items-center gap-1 rounded-2xl bg-black/40 px-4 py-2 text-[13px] font-medium text-white/90 backdrop-blur-md"
          >
            <span>↔️ Swipe for next card</span>
          </motion.div>
        )}

        <button
          type="button"
          data-no-tap-nav
          aria-label="Legal information"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            setInfoOpen(true);
          }}
          className="pointer-events-auto absolute bottom-3 left-3 z-30 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border border-white/70 text-[11px] font-semibold text-white/90 transition-colors hover:bg-white/15"
        >
          i
        </button>
        {/* Rein dekorativ – Klicks fallen durch aufs rechte Drittel (nächste Karte). */}
        <span
          className="pointer-events-none absolute right-1.5 bottom-3 z-30 origin-bottom-right text-[14px] font-medium tracking-wide text-white/90"
          style={{ writingMode: "vertical-rl" }}
          aria-hidden
        >
          playpointy.com
        </span>

        <AnimatePresence>
          {infoOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 z-40 flex items-center justify-center bg-black/55 p-6 backdrop-blur-md"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => setInfoOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ type: "spring", stiffness: 380, damping: 28 }}
                role="dialog"
                aria-modal="true"
                aria-label="Legal information"
                className="relative w-full max-w-[240px] rounded-2xl border border-white/20 bg-white/10 p-5 text-white shadow-xl backdrop-blur-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setInfoOpen(false)}
                  className="pointer-events-auto absolute top-3 right-3 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-white/15 text-sm font-semibold text-white transition-colors hover:bg-white/25"
                >
                  ✕
                </button>
                <p className="pr-8 text-sm font-medium text-white/80">Legal</p>
                <nav className="mt-4 flex flex-col gap-2">
                  <Link
                    href="/imprint"
                    onPointerDown={(e) => e.stopPropagation()}
                    className="pointer-events-auto rounded-xl bg-white/15 px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-white/25"
                  >
                    Imprint
                  </Link>
                  <Link
                    href="/privacy"
                    onPointerDown={(e) => e.stopPropagation()}
                    className="pointer-events-auto rounded-xl bg-white/15 px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-white/25"
                  >
                    Privacy
                  </Link>
                  <Link
                    href="/terms"
                    onPointerDown={(e) => e.stopPropagation()}
                    className="pointer-events-auto rounded-xl bg-white/15 px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-white/25"
                  >
                    Terms &amp; Conditions
                  </Link>
                </nav>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer: shrink-0 – darf NIE vom Flex-Layout gequetscht werden, sonst
          landen die Buttons hinter der Safari-URL-Leiste. Padding unten =
          Safe-Area + Browser-Chrome-Inset (Liquid Glass Overlay). */}
      <div
        className="relative z-10 flex w-full shrink-0 flex-col gap-3 px-6 pt-3"
        style={{
          paddingBottom:
            "calc(0.75rem + env(safe-area-inset-bottom, 0px) + var(--browser-chrome-bottom, 0px))",
        }}
      >
        <span
          className="text-center font-oswald text-lg font-bold tracking-widest uppercase transition-colors duration-500"
          style={{ color: accent }}
        >
          {card.pack}
        </span>
        <div className="flex w-full gap-3">
          <button
            type="button"
            data-no-tap-nav
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onOpenStore}
            className="pointer-events-auto relative z-50 min-w-0 flex-1 cursor-pointer rounded-full py-3 text-center text-lg font-semibold text-white shadow-sm transition-colors duration-500"
            style={{ backgroundColor: accent }}
          >
            All Packs
          </button>
          <button
            type="button"
            data-no-tap-nav
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => {
              void handleShare();
            }}
            className="pointer-events-auto relative z-50 min-w-0 flex-1 cursor-pointer rounded-full border-2 bg-white py-3 text-center text-lg font-semibold transition-colors duration-500"
            style={{ borderColor: accent, color: accent }}
          >
            Send to Friend 👉
          </button>
        </div>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            className="pointer-events-none absolute inset-x-0 bottom-24 z-[60] flex justify-center px-6"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.2 }}
          >
            <span className="rounded-full bg-neutral-900/90 px-4 py-2 text-sm font-medium text-white shadow-lg">
              {toast}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
