"use client";

import { AnimatePresence, motion, useDragControls } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { displayTitle, getPackById, getPackExampleCards } from "@/lib/data";
import { PACK_PRICE_LABEL } from "@/lib/stripe/catalog";
import { createClient } from "@/lib/supabase/client";

interface CheckoutConfirmModalProps {
  open: boolean;
  packId: string;
  packName: string;
  onClose: () => void;
}

/** Same bottom-sheet size as StoreModal — card peeks above, stay in-game. */
export default function CheckoutConfirmModal({
  open,
  packId,
  packName,
  onClose,
}: CheckoutConfirmModalProps) {
  const dragControls = useDragControls();
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shakeKey, setShakeKey] = useState(0);
  const [slide, setSlide] = useState(0);
  const examples = getPackExampleCards(packId, 3);
  const cardCount = getPackById(packId)?.cardCount ?? 30;
  const [badgeDir, setBadgeDir] = useState(1);
  const current = examples[slide] ?? examples[0];
  const packAccent = current?.hex || "#171717";
  const pitches = [
    "instant fun",
    "one time purchase",
    "no subscription",
  ];

  useEffect(() => {
    if (!open) return;
    setAccepted(false);
    setBusy(false);
    setError(null);
    setSlide(0);
    setBadgeDir(1);
    setShakeKey(0);
  }, [open, packId]);

  function go(delta: number) {
    if (examples.length === 0) return;
    setBadgeDir(delta > 0 ? 1 : -1);
    setSlide((s) => (s + delta + examples.length) % examples.length);
  }

  function goTo(index: number) {
    if (index === slide || examples.length === 0) return;
    setBadgeDir(index > slide ? 1 : -1);
    setSlide(index);
  }

  async function startCheckout() {
    if (!accepted) {
      setShakeKey((k) => k + 1);
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(40);
      }
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError("Please sign in again, then retry checkout.");
        setBusy(false);
        return;
      }

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          packId,
          acceptTerms: true,
          acceptWithdrawalWaiver: true,
        }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? "Checkout could not be started.");
        setBusy(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Checkout could not be started. Try again.");
      setBusy(false);
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="absolute inset-0 z-[60] flex flex-col justify-end bg-transparent"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="checkout-title"
            className="relative flex h-[85%] flex-col overflow-hidden rounded-t-[2rem] bg-white"
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
            <div
              onPointerDown={(e) => dragControls.start(e)}
              className="touch-none relative shrink-0 cursor-grab px-6 pt-6 pb-1"
            >
              <div className="mx-auto h-1.5 w-10 rounded-full bg-neutral-200" />
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                disabled={busy}
                onPointerDown={(e) => e.stopPropagation()}
                className="absolute top-5 right-5 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-600"
              >
                ✕
              </button>
              <h2
                id="checkout-title"
                className="mt-5 text-center text-3xl font-semibold tracking-tight text-neutral-900"
              >
                {packName}
              </h2>
              <p className="mt-1.5 text-center text-[15px] font-bold tracking-[0.14em] text-neutral-900 uppercase">
                {cardCount} new cards
              </p>
            </div>

            <div className="flex min-h-0 flex-1 flex-col justify-center overflow-visible px-1 pt-1 pb-2">
              {examples.length > 0 ? (
                <div className="relative">
                  <div className="mb-3 flex h-7 items-center justify-center overflow-hidden">
                    <AnimatePresence mode="wait" custom={badgeDir}>
                      <motion.p
                        key={`${packId}-${slide}`}
                        custom={badgeDir}
                        variants={{
                          enter: (d: number) => ({ x: d * 28, opacity: 0 }),
                          center: { x: 0, opacity: 1 },
                          exit: (d: number) => ({ x: d * -28, opacity: 0 }),
                        }}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="text-[15px] font-semibold tracking-[0.1em] uppercase"
                        style={{ color: packAccent }}
                      >
                        {pitches[slide % pitches.length]}
                      </motion.p>
                    </AnimatePresence>
                  </div>
                  <motion.div
                    className="relative mx-auto h-[min(46svh,360px)] w-full touch-pan-y overflow-visible [perspective:900px]"
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.18}
                    onDragEnd={(_e, info) => {
                      if (info.offset.x < -45) go(1);
                      else if (info.offset.x > 45) go(-1);
                    }}
                  >
                    {examples.map((card, i) => {
                      const n = examples.length;
                      const rel = ((i - slide) % n + n) % n;
                      // Map relative index onto left2 / left / center / right / right2
                      let slot:
                        | "left2"
                        | "left"
                        | "center"
                        | "right"
                        | "right2"
                        | null = null;
                      if (rel === 0) slot = "center";
                      else if (rel === 1) slot = "right";
                      else if (rel === n - 1) slot = "left";
                      else if (rel === 2) slot = "right2";
                      else if (rel === n - 2) slot = "left2";
                      if (!slot) return null;

                      const poses = {
                        left2: {
                          x: "-118%",
                          rotate: -18,
                          scale: 0.68,
                          opacity: 0.72,
                        },
                        left: {
                          x: "-84%",
                          rotate: -10,
                          scale: 0.82,
                          opacity: 0.9,
                        },
                        center: {
                          x: "-50%",
                          rotate: 0,
                          scale: 1,
                          opacity: 1,
                        },
                        right: {
                          x: "-16%",
                          rotate: 10,
                          scale: 0.82,
                          opacity: 0.9,
                        },
                        right2: {
                          x: "18%",
                          rotate: 18,
                          scale: 0.68,
                          opacity: 0.72,
                        },
                      } as const;
                      const z =
                        slot === "center"
                          ? 5
                          : slot === "left" || slot === "right"
                            ? 3
                            : 1;
                      const isCenter = slot === "center";

                      return (
                        <motion.div
                          key={card.id}
                          className="absolute top-0 left-1/2 w-[56%] max-w-[220px] origin-bottom cursor-pointer"
                          style={{ zIndex: z }}
                          animate={poses[slot]}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 28,
                          }}
                          onClick={() => {
                            if (slot === "left" || slot === "left2") go(-1);
                            else if (slot === "right" || slot === "right2")
                              go(1);
                          }}
                        >
                          <div
                            className={`overflow-hidden rounded-2xl ring-1 ring-black/10 ${
                              isCenter
                                ? "shadow-[0_18px_40px_-12px_rgba(0,0,0,0.45)]"
                                : "shadow-md"
                            }`}
                            style={{
                              backgroundColor: card.hex || "#171717",
                            }}
                          >
                            <div className="relative aspect-[3/4] w-full">
                              {card.image ? (
                                <Image
                                  src={`/${card.image}`}
                                  alt={displayTitle(card.text)}
                                  fill
                                  sizes="175px"
                                  className="pointer-events-none object-contain object-bottom select-none"
                                  draggable={false}
                                />
                              ) : null}
                            </div>
                            <p
                              className={`px-2 pb-2.5 pt-1 text-center font-semibold leading-snug text-white line-clamp-2 min-h-[2.5rem] ${
                                isCenter ? "text-sm opacity-100" : "text-[11px] opacity-70"
                              }`}
                            >
                              {displayTitle(card.text)}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>

                  <div className="mt-1 flex justify-center gap-1.5">
                    {examples.map((card, i) => (
                      <button
                        key={card.id}
                        type="button"
                        aria-label={`Example ${i + 1}`}
                        onClick={() => goTo(i)}
                        className={`h-1.5 rounded-full transition-all ${
                          i === slide
                            ? "w-4 bg-neutral-900"
                            : "w-1.5 bg-neutral-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="shrink-0 border-t border-neutral-100 px-6 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
              <motion.div
                key={shakeKey}
                className="mb-3 text-xs leading-snug text-neutral-700"
                animate={
                  shakeKey > 0
                    ? { x: [0, -8, 8, -6, 6, -3, 3, 0] }
                    : { x: 0 }
                }
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <label className="flex cursor-pointer items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={accepted}
                    onChange={(e) => setAccepted(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0"
                  />
                  <span>
                    I agree to the{" "}
                    <Link
                      href="/terms"
                      target="_blank"
                      className="underline underline-offset-2"
                    >
                      Terms
                    </Link>
                    , want instant access, and acknowledge that I lose my{" "}
                    <Link
                      href="/terms#withdrawal"
                      target="_blank"
                      className="underline underline-offset-2"
                    >
                      14-day right of withdrawal
                    </Link>{" "}
                    once this pack unlocks.
                  </span>
                </label>
              </motion.div>
              <button
                type="button"
                disabled={busy}
                onClick={() => void startCheckout()}
                className="w-full rounded-full bg-emerald-600 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
              >
                {busy ? "Redirecting…" : `Unlock now · ${PACK_PRICE_LABEL}`}
              </button>

              {error ? (
                <p className="mt-2 text-center text-xs text-red-600">{error}</p>
              ) : (
                <p className="mt-2 text-center text-[11px] text-neutral-400">
                  Secure checkout · Stripe · VAT included
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
