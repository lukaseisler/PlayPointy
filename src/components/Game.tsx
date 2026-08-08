"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import CardStack from "./CardStack";
import GameCard from "./GameCard";
import PWANudge from "./PWANudge";
import StoreModal, { type StoreReason } from "./StoreModal";
import { useIsStandalonePwa } from "@/hooks/useIsStandalonePwa";
import { usePwaInstallEligibility } from "@/hooks/usePwaInstallEligibility";
import { readActivePackIds, writeActivePackIds } from "@/lib/activePacks";
import { FREE_PACK_ID, getCardsForPacks } from "@/lib/data";
import { shuffle } from "@/lib/shuffle";
import type { Card, PackSummary } from "@/lib/types";

interface GameProps {
  initialCards: Card[];
  storePacks: PackSummary[];
  /** Geteilte Karte: wird zuerst gezeigt, danach Queue der aktiven Packs. */
  featuredCard?: Card | null;
}

function buildDeck(packIds: string[], featured?: Card | null): Card[] {
  const pool = getCardsForPacks(packIds);
  if (!featured) return shuffle(pool);
  return [featured, ...shuffle(pool.filter((c) => c.id !== featured.id))];
}

function withFeaturedFirst(cards: Card[], featured?: Card | null): Card[] {
  if (!featured) return cards;
  return [featured, ...cards.filter((c) => c.id !== featured.id)];
}

/**
 * Orchestriert das Gameplay + Deck-Rebuild nach Auth/Restore/Kauf.
 */
export default function Game({ initialCards, storePacks, featuredCard = null }: GameProps) {
  const [cards, setCards] = useState<Card[]>(() => withFeaturedFirst(initialCards, featuredCard));
  const [index, setIndex] = useState(0);
  const [storeReason, setStoreReason] = useState<StoreReason | null>(null);
  const [pwaNudgeDismissed, setPwaNudgeDismissed] = useState(false);
  const [activePackIds, setActivePackIds] = useState<string[]>([FREE_PACK_ID]);
  const [toast, setToast] = useState<string | null>(null);
  const isStandalonePwa = useIsStandalonePwa();
  const { canPrompt, kind: installKind } = usePwaInstallEligibility();
  const {
    authReady,
    user,
    entitlementsStatus,
    deckEpoch,
    checkoutNotice,
    clearCheckoutNotice,
  } = useAuth();
  const initialMountDone = useRef(false);
  const lastDeckEpoch = useRef(0);
  /** Toggle im Store: neues Deck erst beim nächsten Kartenwechsel. */
  const pendingToggleRebuild = useRef(false);

  // Gäste / SSR: activePacks vor Paint. Session-User: auf Entitlements warten.
  useLayoutEffect(() => {
    if (!authReady) return;

    if (user && entitlementsStatus !== "ready" && entitlementsStatus !== "error") {
      return;
    }

    const packIds = readActivePackIds();
    setActivePackIds(packIds);

    const keepServerDeck =
      !featuredCard &&
      !user &&
      packIds.length === 1 &&
      packIds[0] === FREE_PACK_ID &&
      !initialMountDone.current;

    initialMountDone.current = true;

    if (keepServerDeck) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect -- client deck sync
    setCards(buildDeck(packIds, featuredCard));
    setIndex(0);
  }, [authReady, user, entitlementsStatus, featuredCard]);

  // Restore / Logout / Kauf → deckEpoch: neu bauen (ohne Featured erneut zu erzwingen).
  useEffect(() => {
    if (deckEpoch === 0 || deckEpoch === lastDeckEpoch.current) return;
    lastDeckEpoch.current = deckEpoch;
    pendingToggleRebuild.current = false;
    const packIds = readActivePackIds();
    setActivePackIds(packIds);
    setCards(buildDeck(packIds, null));
    setIndex(0);
  }, [deckEpoch]);

  useEffect(() => {
    if (!checkoutNotice) return;
    setToast(checkoutNotice);
    clearCheckoutNotice();
  }, [checkoutNotice, clearCheckoutNotice]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(t);
  }, [toast]);

  const total = cards.length;
  const current = cards[index];
  const totalAcrossAllPacks = storePacks.reduce((sum, pack) => sum + pack.cardCount, 0);

  function rebuildDeckFromActivePacks() {
    const packIds = readActivePackIds();
    setActivePackIds(packIds);
    setCards(buildDeck(packIds, null));
    setIndex(0);
    pendingToggleRebuild.current = false;
  }

  function handleSwipeLeft() {
    if (pendingToggleRebuild.current) {
      rebuildDeckFromActivePacks();
      return;
    }
    if (index < total - 1) {
      setIndex((i) => i + 1);
    } else {
      setStoreReason("limit");
    }
  }

  function handleSwipeRight() {
    if (pendingToggleRebuild.current) {
      rebuildDeckFromActivePacks();
      return;
    }
    if (index === 0) {
      if (total > 1) setIndex(1);
      return;
    }
    setIndex((i) => Math.max(0, i - 1));
  }

  function handleActivePacksChange(next: string[]) {
    setActivePackIds(next);
    writeActivePackIds(next);
    pendingToggleRebuild.current = true;
  }

  function handleReshuffle() {
    pendingToggleRebuild.current = false;
    setCards(buildDeck(activePackIds, null));
    setIndex(0);
    setStoreReason(null);
  }

  const waitingForPacks =
    Boolean(user) && entitlementsStatus !== "ready" && entitlementsStatus !== "error";

  if (waitingForPacks) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 bg-white px-6 text-center">
        <p className="text-base font-semibold text-neutral-800">Loading your packs…</p>
        <p className="text-sm text-neutral-500">Just a moment</p>
      </div>
    );
  }

  if (!current) return null;

  const showInstallNudge =
    index === 15 &&
    !pwaNudgeDismissed &&
    !isStandalonePwa &&
    canPrompt &&
    installKind !== "none";

  return (
    <div className="relative flex h-full flex-col">
      <CardStack
        cards={cards}
        index={index}
        onSwipeLeft={handleSwipeLeft}
        onSwipeRight={handleSwipeRight}
        renderCard={(card, i) => (
          <GameCard
            card={card}
            position={i + 1}
            index={i}
            total={totalAcrossAllPacks}
            onOpenStore={() => setStoreReason("manual")}
          />
        )}
      />

      {installKind !== "none" && (
        <PWANudge
          open={showInstallNudge}
          kind={installKind}
          onClose={() => setPwaNudgeDismissed(true)}
        />
      )}

      <StoreModal
        open={storeReason !== null}
        reason={storeReason ?? "manual"}
        packs={storePacks}
        activePackIds={activePackIds}
        onActivePacksChange={handleActivePacksChange}
        onClose={() => setStoreReason(null)}
        onReshuffle={handleReshuffle}
      />

      {toast && (
        <div className="pointer-events-none absolute inset-x-4 bottom-28 z-[70] flex justify-center">
          <p className="rounded-2xl bg-neutral-900/90 px-4 py-3 text-center text-sm font-medium text-white shadow-lg">
            {toast}
          </p>
        </div>
      )}
    </div>
  );
}
