import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ErrorBoundary from "@/components/ErrorBoundary";
import Game from "@/components/Game";
import PhoneFrame from "@/components/PhoneFrame";
import {
  FREE_PACK_ID,
  displayTitle,
  getCardByPackAndCode,
  getCardsForPack,
  getStorePacks,
} from "@/lib/data";
import {
  OG_SHARE_TITLE,
  SITE_URL,
  absoluteOgImageUrl,
  buildShareUrl,
  cardTextWithoutQuestion,
} from "@/lib/share";
import { shuffle } from "@/lib/shuffle";

export const dynamic = "force-dynamic";

interface SharePageProps {
  params: Promise<{ pack: string; code: string }>;
}

export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  const { pack, code } = await params;
  const card = getCardByPackAndCode(pack, code);
  if (!card) {
    return { title: "PlayPointy" };
  }

  // Title = Hook, Description = Kartentext (nicht doppelt denselben String).
  const ogTitle = OG_SHARE_TITLE;
  const ogDescription = cardTextWithoutQuestion(card.text);
  const image = absoluteOgImageUrl(card);
  const url = buildShareUrl(card);
  const pageTitle = `${displayTitle(card.text)} | PlayPointy`;

  return {
    metadataBase: new URL(SITE_URL),
    title: pageTitle,
    description: ogDescription,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url,
      type: "website",
      siteName: "PlayPointy",
      images: image
        ? [
            {
              url: image,
              secureUrl: image,
              type: "image/jpeg",
              width: 800,
              height: 1000,
              alt: displayTitle(card.text),
            },
          ]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      images: image ? [image] : [],
    },
  };
}

/**
 * Viral Share-Route: /c/[pack-name]/[3-char-code]
 * Zeigt die geteilte Karte zuerst; danach setzt Game die Queue aus den
 * aktiven Packs des Nutzers fort (localStorage / Starter-Fallback).
 */
export default async function ShareCardPage({ params }: SharePageProps) {
  const { pack, code } = await params;
  const featuredCard = getCardByPackAndCode(pack, code);
  if (!featuredCard) notFound();

  const freeCards = shuffle(getCardsForPack(FREE_PACK_ID));
  const storePacks = getStorePacks();

  return (
    <PhoneFrame>
      <ErrorBoundary>
        <Game
          initialCards={freeCards}
          storePacks={storePacks}
          featuredCard={featuredCard}
        />
      </ErrorBoundary>
    </PhoneFrame>
  );
}
