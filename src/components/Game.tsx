"use client";

import { useState } from "react";
import CardStack from "./CardStack";
import GameCard from "./GameCard";
import PWANudge from "./PWANudge";
import StoreModal, { type StoreReason } from "./StoreModal";
import { shuffle } from "@/lib/shuffle";
import type { Card, PackSummary } from "@/lib/types";

interface GameProps {
  initialCards: Card[];
  storePacks: PackSummary[];
}

/**
 * Orchestriert das gesamte Free-Pack-Gameplay:
 * - hält die (server-seitig gemischte) Kartenreihenfolge + aktuellen Index
 * - Swipe links -> nächste Karte, nach letzter Karte -> Store-Modal (Free-Limit)
 * - Swipe rechts -> vorherige Karte
 * - "All Packs"-Button auf der Karte -> Store-Modal (manuell geöffnet)
 */
export default function Game({ initialCards, storePacks }: GameProps) {
  // `initialCards` kommt bereits server-seitig gemischt aus `app/page.tsx`
  // (siehe `shuffle(getCardsForPack(...))` dort) - es gibt daher KEINEN
  // client-seitigen Misch-Schritt mehr nach dem Mount. Server-HTML und
  // Client-State sind von Anfang an identisch: kein zweiter Render-Pass, der
  // die sichtbare Karte aendert, und damit kein Hydration-Mismatch mehr.
  const [cards, setCards] = useState<Card[]>(initialCards);
  const [index, setIndex] = useState(0);
  const [storeReason, setStoreReason] = useState<StoreReason | null>(null);
  // PWA-Install-Hinweis: taucht genau einmal nach Karte 15 auf, es sei denn
  // der Nutzer hat ihn vorher schon manuell weggeklickt.
  const [pwaNudgeDismissed, setPwaNudgeDismissed] = useState(false);

  const total = cards.length;
  const current = cards[index];
  // FOMO-Zaehler: zeigt nicht nur die 30 Karten des Free-Packs, sondern die
  // GESAMTE Kartenanzahl ueber alle Packs hinweg - macht sichtbar, wie viel
  // Inhalt im Deck Manager noch wartet. `storePacks` enthaelt inzwischen
  // ALLE Packs (inkl. Starter-Pack, siehe `getStorePacks()` in page.tsx),
  // daher NICHT mehr zusaetzlich `initialCards.length` addieren - das wuerde
  // das Starter-Pack doppelt zaehlen.
  const totalAcrossAllPacks = storePacks.reduce((sum, pack) => sum + pack.cardCount, 0);

  function handleSwipeLeft() {
    if (index < total - 1) {
      setIndex((i) => i + 1);
    } else {
      setStoreReason("limit");
    }
  }

  function handleSwipeRight() {
    // Sonderfall erste Karte: Es gibt noch nichts, wovon man "zurueck"
    // koennte - ein Rechts-Swipe auf Karte 1 verhaelt sich deshalb
    // identisch zu Links (naechste Karte).
    if (index === 0) {
      setIndex(1);
      return;
    }
    setIndex((i) => Math.max(0, i - 1));
  }

  function handleReshuffle() {
    setCards((prev) => shuffle(prev));
    setIndex(0);
    setStoreReason(null);
  }

  if (!current) return null;

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

      <PWANudge
        open={index === 15 && !pwaNudgeDismissed}
        onClose={() => setPwaNudgeDismissed(true)}
      />

      <StoreModal
        open={storeReason !== null}
        reason={storeReason ?? "manual"}
        packs={storePacks}
        onClose={() => setStoreReason(null)}
        onReshuffle={handleReshuffle}
      />
    </div>
  );
}
