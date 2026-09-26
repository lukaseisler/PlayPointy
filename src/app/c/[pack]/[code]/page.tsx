import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AuthProvider from "@/components/AuthProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import Game from "@/components/Game";
import PhoneFrame from "@/components/PhoneFrame";
import {
  FREE_PACK_ID,
  displayTitle,
  getAllCards,
  getCardByPackAndCode,
  getCardsForPack,
  getStorePacks,
} from "@/lib/data";
import { SITE_URL, absoluteOgImageUrl, buildShareUrl } from "@/lib/share";
import { shuffle } from "@/lib/shuffle";

export function generateStaticParams() {
  return getAllCards().map((card) => ({
    pack: card.packId,
    code: card.shareCode,
  }));
}

export const dynamicParams = true;

interface SharePageProps {
  params: Promise<{ pack: string; code: string }>;
}

export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  const { pack, code } = await params;
  const card = getCardByPackAndCode(pack, code);
  if (!card) {
    return {
      title: { absolute: "PlayPointy" },
      robots: { index: false, follow: true },
    };
  }

  const image = absoluteOgImageUrl(card);
  const url = buildShareUrl(card);
  const question = displayTitle(card.text);
  const ogDescription =
    "Play this card in PlayPointy, the free Who is more likely to party game.";

  return {
    metadataBase: new URL(SITE_URL),
    title: { absolute: `${question} | PlayPointy` },
    description: `Who is more likely to: ${question} ${ogDescription}`,
    alternates: { canonical: url },
    robots: { index: false, follow: true },
    openGraph: {
      title: question,
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
      title: question,
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
        <AuthProvider>
          <Game
            initialCards={freeCards}
            storePacks={storePacks}
            featuredCard={featuredCard}
          />
        </AuthProvider>
      </ErrorBoundary>
    </PhoneFrame>
  );
}
