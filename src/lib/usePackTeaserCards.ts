"use client";

import { useEffect, useState } from "react";
import { getOrCreateTeaserCards } from "@/lib/teaserCards";
import type { Card } from "@/lib/types";

export function usePackTeaserCards(
  packId: string | null | undefined,
  count = 3,
): Card[] {
  const [cards, setCards] = useState<Card[]>([]);

  useEffect(() => {
    if (!packId) {
      setCards([]);
      return;
    }
    setCards(getOrCreateTeaserCards(packId, count));
  }, [packId, count]);

  return cards;
}
