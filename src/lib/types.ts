/** Eine einzelne Karte, wie sie von process_cards.py in public/cards.json geschrieben wird. */
export interface Card {
  id: string;
  pack: string;
  packId: string;
  text: string;
  /** Hex-Farbe der Karte (z.B. "#2d5c37"). Steuert Hintergrund, Pack-Label und Buttons. */
  hex: string;
  image: string | null;
  matched: boolean;
  matchScore: number;
  excelRow: number;
}

/** Ein Pack, wie es von process_cards.py in public/packs.json geschrieben wird. */
export interface Pack {
  id: string;
  name: string;
  cardCount: number;
  cardIds: string[];
}

/** Aufbereitete Pack-Info für den Store (inkl. Akzentfarbe + Vorschaubild). */
export interface PackSummary {
  id: string;
  name: string;
  cardCount: number;
  accentHex: string;
  previewImage: string | null;
}
