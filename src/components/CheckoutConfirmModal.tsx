"use client";

import { AnimatePresence, motion, useDragControls } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { displayTitle, getPackById } from "@/lib/data";
import { PACK_PRICE_LABEL } from "@/lib/stripe/catalog";
import { createClient } from "@/lib/supabase/client";
import { usePackTeaserCards } from "@/lib/usePackTeaserCards";

interface CheckoutConfirmModalProps {
  open: boolean;
  packId: string;
  packName: string;
  onClose: () => void;
}

/** Split near the midpoint on a word boundary; second half is the teaser blur. */
function splitTitleForTeaser(title: string): { head: string; tail: string } {
  const t = title.trim();
  if (t.length < 8) return { head: t, tail: "" };

  const mid = Math.ceil(t.length / 2);
  const before = t.lastIndexOf(" ", mid);
  const after = t.indexOf(" ", mid);
  let cut = mid;
  if (before >= Math.floor(t.length * 0.35)) cut = before;
  else if (after > 0) cut = after;

  return {
    head: t.slice(0, cut).trimEnd(),
    tail: t.slice(cut).trimStart(),
  };
}

function TeaserCardTitle({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const title = displayTitle(text);
  const { head, tail } = splitTitleForTeaser(title);
  return (
    <p className={className} aria-label={title}>
      <span>{head}</span>
      {tail ? (
        <>
          {" "}
          <span className="inline select-none blur-[7px]" aria-hidden>
            {tail}
          </span>
        </>
      ) : null}
    </p>
  );
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
  const examples = usePackTeaserCards(open ? packId : null, 3);
  const cardCount = getPackById(packId)?.cardCount ?? 30;
  const sheetRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [cardWidth, setCardWidth] = useState(176);
  const [shortSheet, setShortSheet] = useState(false);

  useEffect(() => {
    if (!open) return;
    const sheet = sheetRef.current;
    const slot = carouselRef.current;

    const measure = () => {
      const sheetH = sheet?.clientHeight ?? 0;
      setShortSheet(sheetH > 0 && sheetH < 620);
      if (!slot) return;
      const imageH = Math.max(80, slot.clientHeight - 40);
      const fromHeight = imageH * 0.75;
      const fromWidth = slot.clientWidth * 0.52;
      setCardWidth(
        Math.round(Math.max(120, Math.min(220, fromHeight, fromWidth))),
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (sheet) ro.observe(sheet);
    if (slot) ro.observe(slot);
    return () => ro.disconnect();
  }, [open, examples.length]);

  useEffect(() => {
    if (!open) return;
    setAccepted(false);
    setBusy(false);
    setError(null);
    setSlide(0);
    setShakeKey(0);
  }, [open, packId]);

  function go(delta: number) {
    if (examples.length === 0) return;
    setSlide((s) => (s + delta + examples.length) % examples.length);
  }

  function goTo(index: number) {
    if (index === slide || examples.length === 0) return;
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

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers,
        body: JSON.stringify({
          packId,
          acceptTerms: true,
          acceptWithdrawalWaiver: true,
          teaserCardIds: examples.map((card) => card.id),
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
          className="absolute inset-0 z-[60] bg-black/60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="checkout-title"
            data-short={shortSheet ? "true" : undefined}
            className="group absolute inset-x-0 bottom-0 top-[15%] flex flex-col overflow-hidden rounded-t-[2rem] bg-white"
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
              className="touch-none relative z-20 shrink-0 cursor-grab bg-white px-6 pt-5 pb-2 group-data-[short=true]:pt-3 group-data-[short=true]:pb-1"
            >
              <div className="mx-auto h-1.5 w-10 rounded-full bg-neutral-200" />
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                disabled={busy}
                onPointerDown={(e) => e.stopPropagation()}
                className="absolute top-5 right-5 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 group-data-[short=true]:top-3"
              >
                ✕
              </button>
              <h2
                id="checkout-title"
                className="mt-5 text-center text-3xl font-semibold tracking-tight text-neutral-900 group-data-[short=true]:mt-3 group-data-[short=true]:text-[1.65rem]"
              >
                {packName}
              </h2>
              <p className="mt-1.5 text-center text-[15px] font-bold tracking-[0.14em] text-neutral-900 uppercase group-data-[short=true]:mt-1 group-data-[short=true]:text-[13px]">
                <motion.span
                  key={`${packId}-new-cards`}
                  className="inline-block origin-center will-change-transform"
                  initial={{ scale: 0.84 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 160,
                    damping: 12,
                    mass: 1.15,
                    delay: 0.5,
                  }}
                >
                  {cardCount} new cards
                </motion.span>
              </p>
            </div>

            <div className="flex min-h-0 flex-1 flex-col px-1 pt-1">
              {examples.length > 0 ? (
                <>
                  <div
                    ref={carouselRef}
                    className="relative mx-auto min-h-0 w-full flex-1"
                  >
                  <motion.div
                    className="absolute inset-0 touch-pan-y [perspective:900px]"
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
                          y: "-50%",
                          rotate: -18,
                          scale: 0.68,
                          opacity: 0.72,
                        },
                        left: {
                          x: "-84%",
                          y: "-50%",
                          rotate: -10,
                          scale: 0.82,
                          opacity: 0.9,
                        },
                        center: {
                          x: "-50%",
                          y: "-50%",
                          rotate: 0,
                          scale: 1,
                          opacity: 1,
                        },
                        right: {
                          x: "-16%",
                          y: "-50%",
                          rotate: 10,
                          scale: 0.82,
                          opacity: 0.9,
                        },
                        right2: {
                          x: "18%",
                          y: "-50%",
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
                          className="absolute top-1/2 left-1/2 origin-center cursor-pointer"
                          style={{ zIndex: z, width: cardWidth }}
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
                            <TeaserCardTitle
                              text={card.text}
                              className={`px-2 pb-2 pt-1 text-center font-semibold leading-snug text-white line-clamp-2 min-h-[2.25rem] ${
                                isCenter ? "text-sm opacity-100" : "text-[11px] opacity-70"
                              }`}
                            />
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                  </div>

                  <div className="flex shrink-0 justify-center gap-1.5 py-1.5">
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
                </>
              ) : null}
            </div>

            <div className="relative z-20 shrink-0 border-t border-neutral-100 bg-white px-6 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] group-data-[short=true]:pt-2 group-data-[short=true]:pb-[max(0.7rem,env(safe-area-inset-bottom))]">
              <motion.div
                key={shakeKey}
                className="mb-3 text-xs leading-snug text-neutral-700 group-data-[short=true]:mb-2 group-data-[short=true]:text-[11px]"
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
              <p className="mb-3 text-[11px] leading-snug text-neutral-500 group-data-[short=true]:mb-2">
                If you buy, we may email that checkout address about new packs.{" "}
                <Link
                  href="/terms#pack-updates"
                  target="_blank"
                  className="underline underline-offset-2"
                >
                  Unsubscribe anytime
                </Link>
                .
              </p>
              <button
                type="button"
                disabled={busy}
                onClick={() => void startCheckout()}
                className="w-full rounded-full bg-emerald-600 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60 group-data-[short=true]:py-3"
              >
                {busy ? "Redirecting…" : `Unlock now · ${PACK_PRICE_LABEL}`}
              </button>

              {error ? (
                <p className="mt-2 text-center text-xs text-red-600">{error}</p>
              ) : (
                <p className="mt-2 text-center text-[11px] text-neutral-400 group-data-[short=true]:hidden">
                  One-time · stays on this phone · email for receipt &amp; restore
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
