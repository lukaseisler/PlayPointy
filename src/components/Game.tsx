"use client";

import { useEffect, useRef, useState } from "react";
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
 * Orchestriert das Gameplay:
 * - hält die Kartenreihenfolge + aktuellen Index
 * - optional featuredCard (Share-Link): Viral Loop → danach aktive Packs
 * - Swipe links -> nächste Karte, nach letzter Karte -> Store-Modal
 * - Swipe rechts -> vorherige Karte (auf Index 0: nächste, nahtlos weiter)
 */
export default function Game({ initialCards, storePacks, featuredCard = null }: GameProps) {
  const [cards, setCards] = useState<Card[]>(() => withFeaturedFirst(initialCards, featuredCard));
  const [index, setIndex] = useState(0);
  const [storeReason, setStoreReason] = useState<StoreReason | null>(null);
  const [pwaNudgeDismissed, setPwaNudgeDismissed] = useState(false);
  const [activePackIds, setActivePackIds] = useState<string[]>([FREE_PACK_ID]);
  const [cardBurstTick, setCardBurstTick] = useState(0);
  const skipFirstCardBurst = useRef(true);
  const isStandalonePwa = useIsStandalonePwa();
  const { canPrompt, kind: installKind } = usePwaInstallEligibility();

  // Nach Mount: aktive Packs aus localStorage → Deck neu bauen (Gäste = Starter,
  // Wiederkehrer = gespeicherte Packs). Featured bleibt Index 0.
  useEffect(() => {
    const packIds = readActivePackIds();
    setActivePackIds(packIds);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client deck from localStorage after SSR seed
    setCards(buildDeck(packIds, featuredCard));
    setIndex(0);
  }, [featuredCard]);

  // Logo-Fountain bei Kartenwechsel (nicht beim allerersten Render).
  useEffect(() => {
    if (skipFirstCardBurst.current) {
      skipFirstCardBurst.current = false;
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- burst tick on index change
    setCardBurstTick((t) => t + 1);
  }, [index]);

  const total = cards.length;
  const current = cards[index];
  const totalAcrossAllPacks = storePacks.reduce((sum, pack) => sum + pack.cardCount, 0);

  function handleSwipeLeft() {
    if (index < total - 1) {
      setIndex((i) => i + 1);
    } else {
      setStoreReason("limit");
    }
  }

  function handleSwipeRight() {
    if (index === 0) {
      if (total > 1) setIndex(1);
      return;
    }
    setIndex((i) => Math.max(0, i - 1));
  }

  function handleActivePacksChange(next: string[]) {
    setActivePackIds(next);
    writeActivePackIds(next);
  }

  function handleReshuffle() {
    setCards(buildDeck(activePackIds, null));
    setIndex(0);
    setStoreReason(null);
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
            isActive={i === index}
            cardBurstSignal={cardBurstTick}
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
    </div>
  );
}
