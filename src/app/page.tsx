import AuthProvider from "@/components/AuthProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import Game from "@/components/Game";
import PhoneFrame from "@/components/PhoneFrame";
import { FREE_PACK_ID, getCardsForPack, getStorePacks } from "@/lib/data";
import { shuffle } from "@/lib/shuffle";

// Erzwingt dynamisches Rendering pro Request, statt die Seite (inkl. der
// gemischten Kartenreihenfolge) einmalig statisch zu cachen - sonst wuerde
// jeder Nutzer fuer immer dieselbe "zufaellige" Reihenfolge sehen.
export const dynamic = "force-dynamic";

export default function Home() {
  // Server-seitig gemischt: Der Client bekommt bereits die fertig gemischte
  // Reihenfolge im ersten HTML-Response. Es gibt dadurch keinen zweiten,
  // client-seitigen Misch-Schritt mehr, der nach dem Mount die sichtbare
  // Karte aendern wuerde - und somit auch keinen Hydration-Mismatch mehr.
  const freeCards = shuffle(getCardsForPack(FREE_PACK_ID));
  // Ohne Exclude-Parameter: der "Deck Manager" listet ALLE Packs, inklusive
  // des bereits freigeschalteten Starter-Packs (dafuer gibt es dort einen
  // Toggle statt eines Kauf-Buttons - siehe StoreModal.tsx).
  const storePacks = getStorePacks();

  return (
    <PhoneFrame>
      <ErrorBoundary>
        <AuthProvider>
          <Game initialCards={freeCards} storePacks={storePacks} />
        </AuthProvider>
      </ErrorBoundary>
    </PhoneFrame>
  );
}
