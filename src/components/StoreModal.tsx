"use client";

import { AnimatePresence, motion, useAnimation, useDragControls } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import type { PackSummary } from "@/lib/types";
import { FREE_PACK_ID } from "@/lib/data";
import { isOwnedPack } from "@/lib/ownedPacks";
import type { StoreReason } from "@/lib/storeTypes";

export type { StoreReason };

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

function shortEmail(email: string): string {
  const [name, domain] = email.split("@");
  if (!name || !domain) return email;
  if (name.length <= 2) return `${name[0] ?? ""}…@${domain}`;
  return `${name.slice(0, 2)}…@${domain}`;
}

/**
 * Deck Manager + Kauf-Einstieg.
 * Owned Packs: Toggle. Unowned: Buy. Free: Toggle.
 * Checkout (Stripe) folgt — Buy löst Login / Purchase-Intent aus.
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
  const [accountOpen, setAccountOpen] = useState(false);
  const {
    user,
    unlockedPackIds,
    entitlementsStatus,
    entitlementsError,
    openRestoreLogin,
    beginPurchase,
    signOut,
    refreshEntitlements,
  } = useAuth();

  useEffect(() => {
    if (!open) {
      setAccountOpen(false);
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fresh tagline per store open
    setCatchphrase(pickStoreCatchphrase());
  }, [open]);

  function toggleActive(id: string) {
    if (!isOwnedPack(id, unlockedPackIds)) return;
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

  const ownedCount = unlockedPackIds.length;

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
            <button
              type="button"
              onClick={() => {
                if (user) {
                  setAccountOpen((v) => !v);
                } else {
                  openRestoreLogin();
                }
              }}
              onPointerDown={(e) => e.stopPropagation()}
              aria-label={user ? "Account" : "Restore purchases"}
              className="pointer-events-auto absolute top-6 right-6 z-20 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-neutral-100 text-lg text-neutral-600 ring-1 ring-black/5 transition-colors hover:bg-neutral-200"
            >
              👤
            </button>

            <div
              onPointerDown={(e) => dragControls.start(e)}
              className="touch-none cursor-grab px-6"
            >
              <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-neutral-200" />

              <div className="mb-2 text-center">
                <div className="mb-1 text-3xl" aria-hidden>
                  {reason === "limit" ? "🎉" : "🛒"}
                </div>
                <h2 className="text-xl font-semibold text-neutral-900">
                  {reason === "limit" ? "Starter Chaos complete!" : "All Packs"}
                </h2>
                <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>
              </div>
            </div>

            {accountOpen && user && (
              <div className="mx-6 mb-4 rounded-2xl bg-neutral-50 px-4 py-3 text-sm text-neutral-700 ring-1 ring-black/5">
                <p className="font-semibold text-neutral-900">
                  {user.email ? shortEmail(user.email) : "Signed in"}
                </p>
                <p className="mt-1 text-neutral-500">
                  {entitlementsStatus === "loading"
                    ? "Loading purchases…"
                    : entitlementsStatus === "error"
                      ? entitlementsError || "Couldn't load purchases — try again"
                      : ownedCount === 0
                        ? "No purchases found for this account"
                        : `${ownedCount} unlocked pack${ownedCount === 1 ? "" : "s"}`}
                </p>
                {entitlementsStatus === "error" && (
                  <button
                    type="button"
                    onClick={() => void refreshEntitlements()}
                    className="mt-2 font-semibold text-neutral-900 underline underline-offset-2"
                  >
                    Try again
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="mt-3 w-full rounded-full border border-neutral-200 py-2 text-xs font-semibold text-neutral-700"
                >
                  Log out
                </button>
              </div>
            )}

            <div className="flex flex-col">
              {packs.map((pack, idx) => {
                const owned = isOwnedPack(pack.id, unlockedPackIds);
                const isActive = activePackIds.includes(pack.id);
                return (
                  <div key={pack.id} className="flex flex-col">
                    <div className="flex w-full items-center py-2">
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
                        {owned ? (
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
                            style={{
                              backgroundColor: isActive ? pack.accentHex : "#d4d4d4",
                            }}
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
                            onClick={() => beginPurchase(pack.id, pack.name, reason)}
                            className="pointer-events-auto flex-none rounded-full px-3 py-2 text-xs font-semibold text-white transition-colors"
                            style={{ backgroundColor: pack.accentHex }}
                          >
                            €2.99
                          </button>
                        )}
                      </div>
                    </div>
                    {idx < packs.length - 1 && (
                      <div className="h-px w-full bg-black/10" />
                    )}
                  </div>
                );
              })}
            </div>

            <nav className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-1 px-6 text-xs text-neutral-500">
              <Link href="/terms" className="underline underline-offset-2">
                Terms
              </Link>
              <Link href="/privacy" className="underline underline-offset-2">
                Privacy
              </Link>
              <Link href="/imprint" className="underline underline-offset-2">
                Imprint
              </Link>
            </nav>

            <div className="mt-4 flex flex-col gap-2 px-6">
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
